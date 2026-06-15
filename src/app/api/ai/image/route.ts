import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_MODEL } from "@/lib/ai/models";
import { buildImagePrompt } from "@/lib/ai/prompts";
import { checkRateLimit, ipFromHeaders } from "@/lib/rate-limit";
import { uploadGiftImage, uploadInputImage } from "@/lib/blob";
import { logAiGeneration } from "@/lib/ai/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ATTACHMENTS = 4;
const MAX_DATA_URL_BYTES = 7 * 1024 * 1024; // ~5 MB binário
const MAX_TOTAL_BYTES = 14 * 1024 * 1024;
const DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/]+=*)$/i;

const attachmentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("dataUrl"),
    value: z
      .string()
      .max(MAX_DATA_URL_BYTES + 100)
      .refine((v) => DATA_URL_REGEX.test(v), {
        message: "Formato de imagem inválido (PNG/JPEG/WebP).",
      }),
  }),
  z.object({
    kind: z.literal("galleryUrl"),
    value: z
      .string()
      .regex(/^\/images\/gallery\/[^/\\]+\.(jpe?g|png|webp)$/i, {
        message: "Caminho da galeria inválido.",
      }),
  }),
]);

const aiImageRequestSchema = z
  .object({
    prompt: z.string().trim().max(500).optional(),
    attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).optional(),
    // Dados do comprador — agora obrigatórios pra gerar (uniformiza com checkout
    // e permite auditoria por convidado).
    reserverName: z.string().trim().min(2, "Informe seu nome").max(255),
    reserverEmail: z.string().email("Email inválido"),
    reserverPhone: z.string().trim().min(10, "Telefone inválido").max(25),
  })
  .refine(
    (v) =>
      (v.prompt?.trim().length ?? 0) > 0 || (v.attachments?.length ?? 0) > 0,
    {
      message: "Descreva uma imagem ou anexe pelo menos uma referência.",
    }
  );

type ResolvedAttachment = { mediaType: string; bytes: Uint8Array };

function mediaTypeFromGalleryPath(p: string): string {
  const lower = p.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function parseDataUrl(dataUrl: string): { mediaType: string; bytes: Uint8Array } | null {
  const m = DATA_URL_REGEX.exec(dataUrl);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  const mediaType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  try {
    const bytes = new Uint8Array(Buffer.from(m[2], "base64"));
    return { mediaType, bytes };
  } catch {
    return null;
  }
}

async function resolveGalleryAttachment(
  urlPath: string
): Promise<ResolvedAttachment | null> {
  try {
    const decoded = decodeURIComponent(urlPath);
    // Defesa extra contra traversal: garante que o caminho normalizado fique
    // dentro de public/images/gallery.
    const safeRel = path
      .normalize(decoded)
      .replace(/^[/\\]+/, "");
    if (!safeRel.startsWith("images/gallery/")) return null;
    const absPath = path.join(process.cwd(), "public", safeRel);
    const buf = await readFile(absPath);
    return {
      mediaType: mediaTypeFromGalleryPath(safeRel),
      bytes: new Uint8Array(buf),
    };
  } catch (err) {
    console.error("[ai/image] gallery read failed:", err);
    return null;
  }
}

function bytesToDataUrl(mediaType: string, bytes: Uint8Array): string {
  return `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function POST(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  const rl = checkRateLimit(`ai:img:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Devagar — espera só um instante antes de gerar outra imagem.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "JSON inválido" },
      { status: 400 }
    );
  }

  const parsed = aiImageRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const pointsToBuyer =
      issue?.path?.[0] === "reserverName" ||
      issue?.path?.[0] === "reserverEmail" ||
      issue?.path?.[0] === "reserverPhone";
    return NextResponse.json(
      {
        success: false,
        message: pointsToBuyer
          ? "Preencha seu nome, email e telefone antes de gerar com IA."
          : issue?.message ?? "Pedido inválido.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const attachmentsCount = input.attachments?.length ?? 0;
  const attachmentsDataUrl =
    input.attachments?.filter((a) => a.kind === "dataUrl").length ?? 0;
  const attachmentsGallery =
    input.attachments?.filter((a) => a.kind === "galleryUrl").length ?? 0;

  // Preenchido depois de resolver/persistir os anexos; o closure abaixo lê o
  // valor corrente, então a falha também registra as imagens de input.
  const inputImageRefs: Array<{ url: string; source: "gallery" | "device" }> = [];

  async function logFailure(message: string) {
    await logAiGeneration({
      kind: "image",
      reserverName: input.reserverName,
      reserverEmail: input.reserverEmail,
      reserverPhone: input.reserverPhone,
      ipAddress: ip,
      prompt: input.prompt ?? null,
      attachmentsCount,
      attachmentsDataUrl,
      attachmentsGallery,
      attachmentUrls: inputImageRefs,
      success: false,
      errorMessage: message,
    });
  }

  // Resolve cada attachment para bytes + mediaType
  const resolved: ResolvedAttachment[] = [];
  let totalBytes = 0;
  for (const att of input.attachments ?? []) {
    if (att.kind === "dataUrl") {
      const parsed = parseDataUrl(att.value);
      if (!parsed) {
        return NextResponse.json(
          { success: false, message: "Anexo inválido." },
          { status: 400 }
        );
      }
      resolved.push(parsed);
      totalBytes += parsed.bytes.byteLength;
    } else {
      const gal = await resolveGalleryAttachment(att.value);
      if (!gal) {
        return NextResponse.json(
          { success: false, message: "Foto da galeria não encontrada." },
          { status: 400 }
        );
      }
      resolved.push(gal);
      totalBytes += gal.bytes.byteLength;
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: "Anexos somam mais que o permitido. Tente imagens menores.",
        },
        { status: 413 }
      );
    }
  }

  // Persiste as imagens de input pra ficarem salvas junto do prompt/resultado.
  // Uploads de dispositivo vão pro Blob; imagens da galeria guardam o caminho
  // público estático (o arquivo já é persistente). Falha de upload não bloqueia
  // a geração — só perde aquela referência no log.
  const attachments = input.attachments ?? [];
  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i];
    if (att.kind === "galleryUrl") {
      inputImageRefs.push({ url: att.value, source: "gallery" });
      continue;
    }
    const res = resolved[i];
    if (!res) continue;
    try {
      const uploaded = await uploadInputImage(res.bytes, res.mediaType);
      inputImageRefs.push({ url: uploaded.url, source: "device" });
    } catch (err) {
      console.error("[ai/image] input image upload failed:", err);
    }
  }

  const composedPrompt = buildImagePrompt({
    userPrompt: input.prompt,
    hasReferenceImages: resolved.length > 0,
  });

  try {
    // Roteamento de modo: sem refs → prompt string; com refs → messages multimodal
    const result =
      resolved.length === 0
        ? await generateText({
            model: IMAGE_MODEL,
            prompt: composedPrompt,
            abortSignal: req.signal,
          })
        : await generateText({
            model: IMAGE_MODEL,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: composedPrompt },
                  ...resolved.map((r) => ({
                    type: "image" as const,
                    image: bytesToDataUrl(r.mediaType, r.bytes),
                  })),
                ],
              },
            ],
            abortSignal: req.signal,
          });

    // Gemini-3-Pro-Image retorna bytes em result.files (não em text).
    const imageFile = result.files?.find((f) =>
      f.mediaType?.startsWith("image/")
    );
    if (!imageFile) {
      console.warn(
        "[ai/image] no image file in result. Likely safety block. Text:",
        result.text
      );
      await logFailure(
        `no image file in result (text: ${result.text?.slice(0, 200) ?? "n/a"})`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Não consegui gerar agora — tente um pedido diferente ou outras referências.",
        },
        { status: 422 }
      );
    }

    const fileBytes =
      imageFile.uint8Array ??
      (imageFile.base64
        ? new Uint8Array(Buffer.from(imageFile.base64, "base64"))
        : null);
    if (!fileBytes) {
      await logFailure("image file had no bytes");
      return NextResponse.json(
        { success: false, message: "Imagem gerada sem bytes legíveis." },
        { status: 502 }
      );
    }

    const uploaded = await uploadGiftImage(
      fileBytes,
      imageFile.mediaType ?? "image/png"
    );

    await logAiGeneration({
      kind: "image",
      reserverName: input.reserverName,
      reserverEmail: input.reserverEmail,
      reserverPhone: input.reserverPhone,
      ipAddress: ip,
      prompt: input.prompt ?? null,
      resultUrl: uploaded.url,
      attachmentsCount,
      attachmentsDataUrl,
      attachmentsGallery,
      attachmentUrls: inputImageRefs,
      success: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploaded.url,
        mediaType: uploaded.mediaType,
      },
    });
  } catch (err) {
    console.error("[ai/image] error:", err);
    if (err instanceof Error && err.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }
    await logFailure(err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      {
        success: false,
        message:
          "A IA está descansando. Tenta de novo daqui a pouco.",
      },
      { status: 502 }
    );
  }
}
