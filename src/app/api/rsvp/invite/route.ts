import { NextRequest, NextResponse } from "next/server";
import { fetchSnapshot } from "@/lib/sheets/read";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const group = request.nextUrl.searchParams.get("group");
  if (!group) {
    return NextResponse.json({ error: "group obrigatório" }, { status: 400 });
  }

  try {
    const snapshot = await fetchSnapshot();
    const invite = snapshot.groupsByName.get(group);
    if (!invite) {
      return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      groupName: invite.groupName,
      guests: invite.rows.map((r) => ({
        slotIndex: r.slotIndex,
        originalName: r.originalName,
        description: r.description,
        currentStatus: r.status,
        currentNameFilled: r.nameFilled,
        currentConfirmedAt: r.confirmedAt,
        currentConfirmedBy: r.confirmedBy,
      })),
    });
  } catch (err) {
    console.error("[api/rsvp/invite] error:", err);
    return NextResponse.json(
      { error: "Não foi possível carregar o convite agora." },
      { status: 500 }
    );
  }
}
