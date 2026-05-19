import { neon } from "@neondatabase/serverless";
import { fetchGiftSnapshot } from "@/lib/sheets/gifts-read";

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

export async function isGiftAvailable(giftName: string): Promise<boolean> {
  const snapshot = await fetchGiftSnapshot();
  const gift = snapshot.byName.get(giftName);
  if (!gift) return false;
  if (gift.availableQuantity === null) return true; // sem limite
  return gift.availableQuantity > 0;
}

export async function getGift(
  giftName: string
): Promise<{ name: string; price: number; description: string } | null> {
  const snapshot = await fetchGiftSnapshot();
  const gift = snapshot.byName.get(giftName);
  if (!gift) return null;
  return { name: gift.name, price: gift.price, description: gift.description };
}

export async function cleanupExpiredPayments(): Promise<number> {
  const sql = getSql();
  const expired = await sql`
    UPDATE pix_payments
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < NOW()
    RETURNING id
  `;
  return expired.length;
}
