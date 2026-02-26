import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { names } = body as { names: string[] };

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json({
        success: true,
        data: { duplicates: [] },
      });
    }

    const normalizedNames = names
      .filter((n) => typeof n === "string" && n.trim().length > 0)
      .map((n) => n.trim().toLowerCase().replace(/\s+/g, " "));

    if (normalizedNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: { duplicates: [] },
      });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const existingRsvps = await sql`
      SELECT LOWER(TRIM(name)) as normalized_name FROM rsvp_confirmations
      WHERE LOWER(TRIM(name)) = ANY(${normalizedNames})
    `;

    const existingGuests = await sql`
      SELECT LOWER(TRIM(guest_name)) as normalized_name FROM rsvp_guests
      WHERE LOWER(TRIM(guest_name)) = ANY(${normalizedNames})
    `;

    const duplicates = [
      ...new Set([
        ...existingRsvps.map((r) => r.normalized_name as string),
        ...existingGuests.map((g) => g.normalized_name as string),
      ]),
    ];

    return NextResponse.json({
      success: true,
      data: { duplicates },
    });
  } catch (error) {
    console.error("Check names error:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao verificar nomes." },
      { status: 500 }
    );
  }
}
