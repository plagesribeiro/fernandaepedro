import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { rsvpSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = rsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, guestCount, additionalGuests, message } =
      parsed.data;

    const allNames = [name, ...additionalGuests];
    const normalizedNames = allNames.map(normalizeName);

    // Check for duplicates in the submission itself
    const seen = new Set<string>();
    for (const n of normalizedNames) {
      if (seen.has(n)) {
        return NextResponse.json(
          {
            success: false,
            message: `O nome "${n}" aparece mais de uma vez na sua confirmação.`,
          },
          { status: 400 }
        );
      }
      seen.add(n);
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Check for duplicates in existing RSVPs
    const existingRsvps = await sql`
      SELECT LOWER(TRIM(name)) as normalized_name FROM rsvp_confirmations
      WHERE LOWER(TRIM(name)) = ANY(${normalizedNames})
    `;

    const existingGuests = await sql`
      SELECT LOWER(TRIM(guest_name)) as normalized_name FROM rsvp_guests
      WHERE LOWER(TRIM(guest_name)) = ANY(${normalizedNames})
    `;

    const duplicates = [
      ...existingRsvps.map((r) => r.normalized_name as string),
      ...existingGuests.map((g) => g.normalized_name as string),
    ];

    if (duplicates.length > 0) {
      const dupName = duplicates[0];
      // Find original casing
      const originalName =
        allNames.find((n) => normalizeName(n) === dupName) || dupName;
      return NextResponse.json(
        {
          success: false,
          message: `Parece que ${originalName} já confirmou presença! Se houver algum engano, entre em contato conosco.`,
        },
        { status: 409 }
      );
    }

    const browserInfo = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Insert RSVP confirmation
    const rsvpResult = await sql`
      INSERT INTO rsvp_confirmations (name, email, phone, guest_count, message, browser_info, ip_address)
      VALUES (${name}, ${email}, ${phone}, ${guestCount}, ${message || null}, ${browserInfo}, ${ipAddress})
      RETURNING id
    `;

    const rsvpId = rsvpResult[0].id as number;

    // Insert all guest names (including the primary guest)
    for (const guestName of allNames) {
      await sql`
        INSERT INTO rsvp_guests (rsvp_id, guest_name)
        VALUES (${rsvpId}, ${guestName.trim()})
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Presença confirmada com sucesso!",
    });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao confirmar presença. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
