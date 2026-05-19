import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getPaymentClient } from "@/lib/mercadopago";
import {
  appendPaymentAudit,
  decrementGiftAvailability,
} from "@/lib/sheets/gifts-write";

export const dynamic = "force-dynamic";

type CartItem =
  | { kind: "gift"; giftName: string; quantity: number; price: number; description?: string }
  | { kind: "donation"; amount: number };

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão",
  debit_card: "Débito",
  ticket: "Boleto",
  account_money: "MP",
  bank_transfer: "Transferência",
};

function paymentMethodLabel(
  paymentType: string | null | undefined,
  installments: number | null | undefined
): string {
  const base =
    (paymentType && PAYMENT_TYPE_LABEL[paymentType]) ||
    (paymentType ? paymentType : "PIX");
  if (paymentType === "credit_card" && installments && installments > 1) {
    return `${base} ${installments}x`;
  }
  return base;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const internalId = parseInt(id, 10);
    if (Number.isNaN(internalId)) {
      return NextResponse.json(
        { success: false, message: "ID inválido." },
        { status: 400 }
      );
    }

    const paymentIdParam = request.nextUrl.searchParams.get("paymentId");

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, status, mercado_pago_id, preference_id,
             cart_items, amount, reserver_name, reserver_email, reserver_phone,
             message, gift_image_url, audit_written, inventory_decremented, paid_at
      FROM pix_payments WHERE id = ${internalId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pagamento não encontrado." },
        { status: 404 }
      );
    }

    const row = rows[0] as Record<string, unknown>;

    if (row.status === "approved") {
      return NextResponse.json({
        success: true,
        data: { status: "approved", paidAt: row.paid_at },
      });
    }

    if (row.status === "rejected" || row.status === "expired") {
      return NextResponse.json({
        success: true,
        data: { status: row.status, paidAt: null },
      });
    }

    // Need to query MP. Prefer the explicit paymentId from URL; fall back to mercado_pago_id we stored
    const mpPaymentId =
      paymentIdParam ?? (row.mercado_pago_id as string | null);

    if (!mpPaymentId) {
      return NextResponse.json({
        success: true,
        data: { status: "pending", paidAt: null },
      });
    }

    try {
      const paymentClient = getPaymentClient();
      const mpPayment = await paymentClient.get({ id: mpPaymentId });
      const mpStatus = mpPayment.status;
      const paymentMethod = paymentMethodLabel(
        mpPayment.payment_type_id,
        mpPayment.installments
      );

      if (mpStatus === "approved") {
        return await handleApproved(
          sql,
          row,
          internalId,
          mpPaymentId,
          paymentMethod
        );
      }

      if (
        mpStatus === "rejected" ||
        mpStatus === "cancelled" ||
        mpStatus === "refunded"
      ) {
        await sql`UPDATE pix_payments SET status = 'rejected' WHERE id = ${internalId}`;
        return NextResponse.json({
          success: true,
          data: { status: "rejected", paidAt: null },
        });
      }

      // pending / in_process / etc.
      await sql`
        UPDATE pix_payments SET mercado_pago_id = ${mpPaymentId} WHERE id = ${internalId}
      `;
      return NextResponse.json({
        success: true,
        data: { status: "pending", paidAt: null },
      });
    } catch (mpErr) {
      console.error("[checkout/status] MP error:", mpErr);
      return NextResponse.json({
        success: true,
        data: { status: "pending", paidAt: null },
      });
    }
  } catch (err) {
    console.error("[checkout/status] error:", err);
    return NextResponse.json(
      { success: false, message: "Erro ao verificar status." },
      { status: 500 }
    );
  }
}

async function handleApproved(
  sql: ReturnType<typeof neon<false, false>>,
  row: Record<string, unknown>,
  internalId: number,
  mpPaymentId: string,
  paymentMethod: string
) {
  const cartItems = (row.cart_items as CartItem[] | null) ?? [];
  const auditWritten = row.audit_written === true;
  const inventoryDecremented = row.inventory_decremented === true;
  const reserverName = (row.reserver_name as string) ?? "";
  const reserverEmail = (row.reserver_email as string) ?? "";
  const reserverPhone = (row.reserver_phone as string | null) ?? "";
  const message = (row.message as string | null) ?? null;
  const giftImageUrl = (row.gift_image_url as string | null) ?? null;

  if (!auditWritten) {
    try {
      for (const item of cartItems) {
        if (item.kind === "gift") {
          for (let i = 0; i < item.quantity; i++) {
            await appendPaymentAudit({
              giftName: item.giftName,
              reserverName,
              amount: item.price,
              message,
              paymentMethod,
              email: reserverEmail,
              phone: reserverPhone,
              giftImageUrl,
            });
          }
        } else {
          await appendPaymentAudit({
            giftName: "Doação",
            reserverName,
            amount: item.amount,
            message,
            paymentMethod,
            email: reserverEmail,
            phone: reserverPhone,
            giftImageUrl,
          });
        }
      }
      await sql`UPDATE pix_payments SET audit_written = true WHERE id = ${internalId}`;
    } catch (err) {
      console.error(
        `[checkout/status] audit write failed for ${internalId}; will retry`,
        err
      );
      return NextResponse.json({
        success: true,
        data: { status: "pending", paidAt: null },
      });
    }
  }

  if (!inventoryDecremented) {
    try {
      for (const item of cartItems) {
        if (item.kind === "gift") {
          await decrementGiftAvailability(item.giftName, item.quantity);
        }
      }
      await sql`UPDATE pix_payments SET inventory_decremented = true WHERE id = ${internalId}`;
    } catch (err) {
      console.error(
        `[checkout/status] inventory decrement failed for ${internalId}; will retry`,
        err
      );
      return NextResponse.json({
        success: true,
        data: { status: "pending", paidAt: null },
      });
    }
  }

  const paidAt = new Date().toISOString();
  await sql`
    UPDATE pix_payments
    SET status = 'approved', paid_at = ${paidAt},
        mercado_pago_id = ${mpPaymentId},
        payment_method = ${paymentMethod}
    WHERE id = ${internalId}
  `;

  return NextResponse.json({
    success: true,
    data: { status: "approved", paidAt },
  });
}
