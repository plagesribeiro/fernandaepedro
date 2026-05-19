import { neon } from "@neondatabase/serverless";

export interface AiGenerationLog {
  kind: "message" | "image";
  reserverName: string;
  reserverEmail: string;
  reserverPhone: string;
  ipAddress?: string | null;
  prompt?: string | null;
  hint?: string | null;
  resultUrl?: string | null;
  resultText?: string | null;
  attachmentsCount?: number;
  attachmentsDataUrl?: number;
  attachmentsGallery?: number;
  success: boolean;
  errorMessage?: string | null;
}

/**
 * Insere um registro de geração de IA no banco. Não lança — se falhar,
 * loga no console mas não interrompe o fluxo do convidado.
 */
export async function logAiGeneration(entry: AiGenerationLog): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const trimmedResultText = entry.resultText
      ? entry.resultText.slice(0, 400)
      : null;
    await sql`
      INSERT INTO ai_generations (
        kind, reserver_name, reserver_email, reserver_phone,
        ip_address, prompt, hint, result_url, result_text,
        attachments_count, attachments_data_url, attachments_gallery,
        success, error_message
      ) VALUES (
        ${entry.kind},
        ${entry.reserverName},
        ${entry.reserverEmail},
        ${entry.reserverPhone},
        ${entry.ipAddress ?? null},
        ${entry.prompt ?? null},
        ${entry.hint ?? null},
        ${entry.resultUrl ?? null},
        ${trimmedResultText},
        ${entry.attachmentsCount ?? 0},
        ${entry.attachmentsDataUrl ?? 0},
        ${entry.attachmentsGallery ?? 0},
        ${entry.success},
        ${entry.errorMessage ?? null}
      )
    `;
  } catch (err) {
    console.error("[ai/log] insert failed:", err);
  }
}
