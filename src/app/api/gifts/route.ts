import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cleanupExpiredPayments } from "@/lib/gift-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Mark expired pending payments (doesn't affect availability, just housekeeping)
    await cleanupExpiredPayments();

    const sql = neon(process.env.DATABASE_URL!);
    const allGifts = await sql`
      SELECT g.*,
             g.total_quantity - COALESCE(c.cnt, 0) AS available_quantity
      FROM gifts g
      LEFT JOIN (
        SELECT gift_id, COUNT(*)::int AS cnt
        FROM pix_payments
        WHERE status = 'approved'
        GROUP BY gift_id
      ) c ON c.gift_id = g.id
      ORDER BY g.category ASC, g.name ASC
    `;

    const giftsWithAvailability = allGifts.map((gift) => ({
      id: gift.id,
      name: gift.name,
      description: gift.description,
      imageUrl: gift.image_url,
      price: Number(gift.price),
      category: gift.category,
      totalQuantity: gift.total_quantity,
      availableQuantity: Number(gift.available_quantity),
      createdAt: gift.created_at,
    }));

    return NextResponse.json(
      { success: true, gifts: giftsWithAvailability },
      {
        headers: {
          "Cache-Control": "s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Gifts fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao carregar presentes." },
      { status: 500 }
    );
  }
}
