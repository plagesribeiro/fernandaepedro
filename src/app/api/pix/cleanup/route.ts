import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getPaymentClient } from "@/lib/mercadopago";
import { createGiftReservation } from "@/lib/gift-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const pendingPayments = await sql`
      SELECT id, mercado_pago_id, type, gift_id, reserver_name, reserver_email,
             amount, message, expires_at
      FROM pix_payments
      WHERE status = 'pending' AND expires_at < NOW()
    `;

    let cleaned = 0;
    let approved = 0;

    for (const pix of pendingPayments) {
      let finalStatus = "expired";

      // Check Mercado Pago before marking expired — payment may have been made last second
      if (pix.mercado_pago_id) {
        try {
          const payment = getPaymentClient();
          const mpPayment = await payment.get({
            id: pix.mercado_pago_id as string,
          });
          if (mpPayment.status === "approved") {
            finalStatus = "approved";
          }
        } catch {
          // If MP check fails, assume expired
        }
      }

      if (finalStatus === "approved") {
        const paidAt = new Date().toISOString();
        await sql`
          UPDATE pix_payments SET status = 'approved', paid_at = ${paidAt}
          WHERE id = ${pix.id}
        `;
        if (pix.type === "gift" && pix.gift_id) {
          await createGiftReservation(
            pix.gift_id as number,
            pix.reserver_name as string,
            pix.reserver_email as string,
            pix.id as number
          );
        } else if (pix.type === "donation") {
          await sql`
            INSERT INTO donations (pix_payment_id, donor_name, donor_email, amount, message, paid_at)
            VALUES (${pix.id}, ${pix.reserver_name}, ${pix.reserver_email}, ${pix.amount}, ${pix.message}, ${paidAt})
          `;
        }
        approved++;
      } else {
        await sql`
          UPDATE pix_payments SET status = 'expired' WHERE id = ${pix.id}
        `;
        cleaned++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Limpeza concluída. ${cleaned} expirados, ${approved} aprovados retroativamente.`,
    });
  } catch (error) {
    console.error("PIX cleanup error:", error);
    return NextResponse.json(
      { success: false, message: "Erro na limpeza de PIX." },
      { status: 500 }
    );
  }
}
