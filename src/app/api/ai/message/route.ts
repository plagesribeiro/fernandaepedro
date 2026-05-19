import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { TEXT_MODEL } from "@/lib/ai/models";
import {
  buildMessageSystemPrompt,
  buildMessageUserPrompt,
  type CartItemForPrompt,
} from "@/lib/ai/prompts";
import { checkoutItemSchema } from "@/lib/validators";
import { checkRateLimit, ipFromHeaders } from "@/lib/rate-limit";
import { fetchGiftSnapshot } from "@/lib/sheets/gifts-read";
import { logAiGeneration } from "@/lib/ai/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const aiMessageRequestSchema = z.object({
  hint: z.string().trim().max(200).optional(),
  items: z.array(checkoutItemSchema).min(1).max(50),
  // Dados do comprador — agora obrigatórios pra gerar (uniformiza com checkout
  // e permite auditoria por convidado).
  reserverName: z.string().trim().min(2, "Informe seu nome").max(255),
  reserverEmail: z.string().email("Email inválido"),
  reserverPhone: z.string().trim().min(10, "Telefone inválido").max(25),
});

export async function POST(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  const rl = checkRateLimit(`ai:msg:${ip}`, 60, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Devagar — espera só um instante antes de gerar de novo.",
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

  const parsed = aiMessageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Preencha seu nome, email e telefone antes de gerar com IA.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Cruzar items com a planilha para usar nome/preço canônicos. Não confia no preço do cliente.
  let snapshot;
  try {
    snapshot = await fetchGiftSnapshot();
  } catch (err) {
    console.error("[ai/message] gift snapshot error:", err);
    return NextResponse.json(
      { success: false, message: "Falha ao consultar lista de presentes." },
      { status: 502 }
    );
  }

  const itemsForPrompt: CartItemForPrompt[] = [];
  let total = 0;
  for (const item of input.items) {
    if (item.kind === "gift") {
      const gift = snapshot.byName.get(item.giftName);
      if (!gift) continue;
      itemsForPrompt.push({
        kind: "gift",
        name: gift.name,
        unitPrice: gift.price,
        quantity: item.quantity,
      });
      total += gift.price * item.quantity;
    } else {
      itemsForPrompt.push({
        kind: "donation",
        name: "Doação livre",
        unitPrice: item.amount,
        quantity: 1,
      });
      total += item.amount;
    }
  }

  if (itemsForPrompt.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Não consegui identificar os presentes do carrinho.",
      },
      { status: 400 }
    );
  }

  try {
    const result = streamText({
      model: TEXT_MODEL,
      system: buildMessageSystemPrompt(),
      prompt: buildMessageUserPrompt({
        items: itemsForPrompt,
        total,
        hint: input.hint,
        reserverName: input.reserverName,
      }),
      // GPT-5.2 é reasoning model — não aceita temperature.
      abortSignal: req.signal,
      onFinish: async ({ text }) => {
        await logAiGeneration({
          kind: "message",
          reserverName: input.reserverName,
          reserverEmail: input.reserverEmail,
          reserverPhone: input.reserverPhone,
          ipAddress: ip,
          hint: input.hint ?? null,
          resultText: text,
          success: true,
        });
      },
      onError: async ({ error }) => {
        await logAiGeneration({
          kind: "message",
          reserverName: input.reserverName,
          reserverEmail: input.reserverEmail,
          reserverPhone: input.reserverPhone,
          ipAddress: ip,
          hint: input.hint ?? null,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : String(error),
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[ai/message] streamText error:", err);
    await logAiGeneration({
      kind: "message",
      reserverName: input.reserverName,
      reserverEmail: input.reserverEmail,
      reserverPhone: input.reserverPhone,
      ipAddress: ip,
      hint: input.hint ?? null,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        success: false,
        message: "A IA está descansando. Tente daqui a pouco.",
      },
      { status: 502 }
    );
  }
}
