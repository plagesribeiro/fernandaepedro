import { NextResponse } from "next/server";
import { fetchGiftSnapshot } from "@/lib/sheets/gifts-read";
import { cleanupExpiredPayments } from "@/lib/gift-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    cleanupExpiredPayments().catch((e) =>
      console.warn("[api/gifts] cleanup non-fatal:", e)
    );

    const snapshot = await fetchGiftSnapshot();

    const gifts = snapshot.rows.map((g) => ({
      name: g.name,
      description: g.description,
      imageUrl: g.imageUrl,
      price: g.price,
      availableQuantity: g.availableQuantity,
    }));

    return NextResponse.json(
      { success: true, gifts },
      {
        headers: {
          "Cache-Control": "s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[api/gifts] error:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao carregar presentes." },
      { status: 500 }
    );
  }
}
