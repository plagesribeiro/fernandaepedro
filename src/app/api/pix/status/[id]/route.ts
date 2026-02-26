import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getPaymentClient } from "@/lib/mercadopago";
import { isGiftAvailable } from "@/lib/gift-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pixId = parseInt(id, 10);
    if (isNaN(pixId)) {
      return NextResponse.json(
        { success: false, message: "ID inválido." },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, mercado_pago_id, status, type, gift_id, reserver_name,
             reserver_email, amount, message, expires_at, paid_at
      FROM pix_payments WHERE id = ${pixId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pagamento não encontrado." },
        { status: 404 }
      );
    }

    const pix = rows[0];

    // Already in terminal state
    if (pix.status === "approved" || pix.status === "rejected") {
      return NextResponse.json({
        success: true,
        data: { status: pix.status, paidAt: pix.paid_at },
      });
    }

    // Check if expired locally — but consult MP first before marking expired
    const isExpired =
      pix.expires_at && new Date(pix.expires_at as string) < new Date();

    // Check status on Mercado Pago (both for polling and for expired-but-maybe-paid)
    if (pix.mercado_pago_id) {
      try {
        const payment = getPaymentClient();
        const mpPayment = await payment.get({
          id: pix.mercado_pago_id as string,
        });

        const mpStatus = mpPayment.status;

        if (mpStatus === "approved") {
          return await handleApproved(sql, pix, pixId);
        }

        if (
          mpStatus === "rejected" ||
          mpStatus === "cancelled" ||
          mpStatus === "refunded"
        ) {
          await sql`
            UPDATE pix_payments SET status = 'rejected' WHERE id = ${pixId}
          `;
          return NextResponse.json({
            success: true,
            data: { status: "rejected", paidAt: null },
          });
        }
      } catch (mpError) {
        console.error("MP status check error:", mpError);
        // Continue with current status if MP check fails
      }
    }

    // If expired and MP didn't say approved, mark as expired
    if (isExpired && pix.status === "pending") {
      await sql`
        UPDATE pix_payments SET status = 'expired' WHERE id = ${pixId}
      `;
      return NextResponse.json({
        success: true,
        data: { status: "expired", paidAt: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: { status: pix.status, paidAt: pix.paid_at },
    });
  } catch (error) {
    console.error("PIX status error:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao verificar status." },
      { status: 500 }
    );
  }
}

async function handleApproved(
  sql: ReturnType<typeof neon<false, false>>,
  pix: Record<string, unknown>,
  pixId: number
) {
  const paidAt = new Date().toISOString();
  await sql`
    UPDATE pix_payments SET status = 'approved', paid_at = ${paidAt}
    WHERE id = ${pixId}
  `;

  if (pix.type === "gift" && pix.gift_id) {
    const available = await isGiftAvailable(pix.gift_id as number);
    if (!available) {
      console.warn(
        `Gift ${pix.gift_id} is already fully reserved but payment ${pixId} was approved. Resolve manually.`
      );
    }
  }

  return NextResponse.json({
    success: true,
    data: { status: "approved", paidAt },
  });
}
