import { neon } from "@neondatabase/serverless";

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

/**
 * Checks if a gift is still available by counting approved payments.
 * Returns true if total_quantity > number of approved pix_payments for this gift.
 */
export async function isGiftAvailable(giftId: number): Promise<boolean> {
  const sql = getSql();
  const result = await sql`
    SELECT g.total_quantity - COALESCE(c.cnt, 0) AS available
    FROM gifts g
    LEFT JOIN (
      SELECT gift_id, COUNT(*)::int AS cnt
      FROM pix_payments
      WHERE status = 'approved' AND gift_id = ${giftId}
      GROUP BY gift_id
    ) c ON c.gift_id = g.id
    WHERE g.id = ${giftId}
  `;
  if (result.length === 0) return false;
  return Number(result[0].available) > 0;
}

/**
 * Marks expired pending PIX payments as 'expired'.
 * Does NOT touch reserved_quantity — availability is derived from approved payments.
 */
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

export async function createGiftReservation(
  giftId: number,
  name: string,
  email: string,
  pixPaymentId: number
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO gift_reservations (gift_id, reserver_name, reserver_email, pix_payment_id)
    VALUES (${giftId}, ${name}, ${email}, ${pixPaymentId})
  `;
}

export async function getGiftPrice(
  giftId: number
): Promise<{ price: number; name: string } | null> {
  const sql = getSql();
  const result = await sql`
    SELECT price, name FROM gifts WHERE id = ${giftId}
  `;
  if (result.length === 0) return null;
  return { price: Number(result[0].price), name: result[0].name as string };
}
