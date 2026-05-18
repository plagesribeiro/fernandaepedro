import { NextRequest, NextResponse } from "next/server";
import { rsvpSearchSchema } from "@/lib/validators";
import { fetchSnapshot } from "@/lib/sheets/read";
import { searchInvites } from "@/lib/sheets/match";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const parsed = rsvpSearchSchema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.q?.[0] ?? "Busca inválida" },
      { status: 400 }
    );
  }

  try {
    const snapshot = await fetchSnapshot();
    const matches = searchInvites(snapshot, parsed.data.q);
    return NextResponse.json({
      matches: matches.map((m) => ({
        groupName: m.group.groupName,
        matchedText: m.matchedText,
        matchedField: m.matchedField,
        preview: {
          guestCount: m.group.rows.length,
          firstDescription: m.group.rows[0]?.description ?? "",
        },
      })),
    });
  } catch (err) {
    console.error("[api/rsvp/search] error:", err);
    return NextResponse.json(
      { error: "Não foi possível buscar agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
