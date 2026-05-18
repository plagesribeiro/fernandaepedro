import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { rsvpSubmitSchema } from "@/lib/validators";
import { writeResponses } from "@/lib/sheets/write";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = rsvpSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { inviteGroupName, confirmedBy, responses } = parsed.data;

  try {
    const result = await writeResponses({
      inviteGroupName,
      confirmedBy,
      responses: responses.map((r) => ({
        slotIndex: r.guestSlotIndex,
        status: r.status,
        nameFilled: r.nameFilled || undefined,
      })),
    });

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    try {
      const sql = neon(process.env.DATABASE_URL!);
      const submittedAt = new Date();
      for (const r of responses) {
        const written = result.rowsWritten.find(
          (w) => w.slotIndex === r.guestSlotIndex
        );
        await sql`
          INSERT INTO rsvp_responses (
            invite_group_name, guest_slot_index, guest_original_name,
            status, name_filled, confirmed_by, ip_address, user_agent, sheet_row_index, created_at
          ) VALUES (
            ${inviteGroupName}, ${r.guestSlotIndex}, ${written?.originalName ?? null},
            ${r.status}, ${r.nameFilled || null}, ${confirmedBy},
            ${ipAddress}, ${userAgent}, ${written?.spreadsheetRowNumber ?? -1}, ${submittedAt}
          )
        `;
      }
    } catch (dbErr) {
      // Sheet is source of truth; DB failure must not break the user flow.
      console.error("[api/rsvp/submit] db audit log failed:", dbErr);
    }

    return NextResponse.json({
      ok: true,
      summary: result.rowsWritten.map((w) => ({
        slotIndex: w.slotIndex,
        originalName: w.originalName,
      })),
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    if (code === "INVITE_GROUP_NOT_FOUND") {
      return NextResponse.json(
        { error: "Convite não encontrado. A planilha pode ter sido editada — tente buscar novamente." },
        { status: 404 }
      );
    }
    if (code.startsWith("SLOT_NOT_FOUND")) {
      return NextResponse.json(
        { error: "Lista de convidados mudou. Recarregue e tente novamente." },
        { status: 409 }
      );
    }
    console.error("[api/rsvp/submit] error:", err);
    return NextResponse.json(
      { error: "Erro ao salvar. Tente novamente." },
      { status: 500 }
    );
  }
}
