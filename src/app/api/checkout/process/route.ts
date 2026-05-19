import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { checkoutProcessSchema } from "@/lib/validators";
import { getPaymentClient } from "@/lib/mercadopago";
import { fetchGiftSnapshot } from "@/lib/sheets/gifts-read";
import {
  appendPaymentAudit,
  decrementGiftAvailability,
} from "@/lib/sheets/gifts-write";

export const dynamic = "force-dynamic";

const MAX_INSTALLMENTS = 12;
const PIX_EXPIRES_MS = 30 * 60 * 1000;

type CartItemForDb =
  | {
      kind: "gift";
      giftName: string;
      quantity: number;
      price: number;
      description?: string;
    }
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
  paymentTypeId: string | null | undefined,
  installments: number | null | undefined
): string {
  const base =
    (paymentTypeId && PAYMENT_TYPE_LABEL[paymentTypeId]) ||
    (paymentTypeId ? paymentTypeId : "PIX");
  if (paymentTypeId === "credit_card" && installments && installments > 1) {
    return `${base} ${installments}x`;
  }
  return base;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "JSON inválido" },
      { status: 400 }
    );
  }

  const parsed = checkoutProcessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Validate items against the current sheet snapshot
  const snapshot = await fetchGiftSnapshot({ bustCache: true });
  const cartItemsForDb: CartItemForDb[] = [];
  let totalAmount = 0;

  for (const item of input.items) {
    if (item.kind === "gift") {
      const gift = snapshot.byName.get(item.giftName);
      if (!gift) {
        return NextResponse.json(
          {
            success: false,
            message: `"${item.giftName}" não está mais disponível.`,
          },
          { status: 404 }
        );
      }
      if (
        gift.availableQuantity !== null &&
        gift.availableQuantity < item.quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `"${gift.name}" tem só ${gift.availableQuantity} unidade${gift.availableQuantity === 1 ? "" : "s"}.`,
          },
          { status: 409 }
        );
      }
      cartItemsForDb.push({
        kind: "gift",
        giftName: gift.name,
        quantity: item.quantity,
        price: gift.price,
        description: gift.description,
      });
      totalAmount += gift.price * item.quantity;
    } else {
      cartItemsForDb.push({ kind: "donation", amount: item.amount });
      totalAmount += item.amount;
    }
  }

  // Round to cents to avoid floating-point inconsistency
  totalAmount = Math.round(totalAmount * 100) / 100;

  const sql = neon(process.env.DATABASE_URL!);
  const description =
    input.items.length === 1 && input.items[0].kind === "gift"
      ? `Presente: ${input.items[0].giftName}`
      : "Carrinho · Fernanda & Pedro";

  const cartItemsJson = JSON.stringify(cartItemsForDb);
  const inserted = await sql`
    INSERT INTO pix_payments (
      amount, description, status, type,
      reserver_name, reserver_email, reserver_phone,
      message, gift_image_url, cart_items, expires_at
    ) VALUES (
      ${totalAmount}, ${description}, 'pending', 'cart',
      ${input.reserverName}, ${input.reserverEmail}, ${input.reserverPhone},
      ${input.message ?? null}, ${input.giftImageUrl ?? null},
      ${cartItemsJson}::jsonb,
      ${new Date(Date.now() + PIX_EXPIRES_MS).toISOString()}
    ) RETURNING id
  `;
  const internalId = inserted[0].id as number;

  if (input.paymentMethod === "pix") {
    return processPix({
      sql,
      internalId,
      totalAmount,
      description,
      reserverName: input.reserverName,
      reserverEmail: input.reserverEmail,
      cartItems: cartItemsForDb,
      message: input.message ?? null,
      giftImageUrl: input.giftImageUrl ?? null,
      phone: input.reserverPhone,
    });
  }

  return processCard({
    sql,
    internalId,
    totalAmount,
    description,
    formData: input.formData,
    reserverName: input.reserverName,
    reserverEmail: input.reserverEmail,
    cartItems: cartItemsForDb,
    message: input.message ?? null,
    giftImageUrl: input.giftImageUrl ?? null,
    phone: input.reserverPhone,
  });
}

async function processPix(args: {
  sql: ReturnType<typeof neon<false, false>>;
  internalId: number;
  totalAmount: number;
  description: string;
  reserverName: string;
  reserverEmail: string;
  cartItems: CartItemForDb[];
  message: string | null;
  giftImageUrl: string | null;
  phone: string;
}) {
  const expiresAt = new Date(Date.now() + PIX_EXPIRES_MS);
  try {
    const payment = getPaymentClient();
    const res = await payment.create({
      body: {
        transaction_amount: args.totalAmount,
        description: args.description,
        payment_method_id: "pix",
        payer: {
          email: args.reserverEmail,
          first_name: args.reserverName.split(" ")[0] ?? args.reserverName,
          last_name:
            args.reserverName.split(" ").slice(1).join(" ") ||
            args.reserverName,
        },
        date_of_expiration: expiresAt.toISOString(),
        external_reference: String(args.internalId),
        statement_descriptor: "FernandaEPedro",
        metadata: { internal_id: args.internalId },
      },
      requestOptions: {
        idempotencyKey: `pix-${args.internalId}-${Date.now()}`,
      },
    });

    const mpId = String(res.id);
    const txData = res.point_of_interaction?.transaction_data;
    const qrCode = txData?.qr_code ?? null;
    const qrCodeBase64 = txData?.qr_code_base64 ?? null;

    await args.sql`
      UPDATE pix_payments
      SET mercado_pago_id = ${mpId},
          pix_copia_e_cola = ${qrCode},
          payment_method = 'PIX',
          expires_at = ${expiresAt.toISOString()}
      WHERE id = ${args.internalId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        method: "pix",
        status: "pending",
        internalId: args.internalId,
        mercadoPagoId: mpId,
        copiaECola: qrCode,
        qrCodeBase64,
        amount: args.totalAmount,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[checkout/process] PIX error:", err);
    await args.sql`
      UPDATE pix_payments SET status = 'rejected' WHERE id = ${args.internalId}
    `;
    return NextResponse.json(
      { success: false, message: "Erro ao gerar PIX. Tente novamente." },
      { status: 502 }
    );
  }
}

async function processCard(args: {
  sql: ReturnType<typeof neon<false, false>>;
  internalId: number;
  totalAmount: number;
  description: string;
  formData: {
    token: string;
    payment_method_id: string;
    installments: number;
    issuer_id?: string | number;
    payer: {
      email?: string;
      identification?: { type: string; number: string };
    };
    [k: string]: unknown;
  };
  reserverName: string;
  reserverEmail: string;
  cartItems: CartItemForDb[];
  message: string | null;
  giftImageUrl: string | null;
  phone: string;
}) {
  if (args.formData.installments > MAX_INSTALLMENTS) {
    return NextResponse.json(
      {
        success: false,
        message: `Máximo ${MAX_INSTALLMENTS} parcelas.`,
      },
      { status: 400 }
    );
  }

  try {
    const payment = getPaymentClient();
    const payerEmail =
      args.formData.payer.email ?? args.reserverEmail;
    // For card payments, MP only wants payer.email + payer.identification.
    // first_name/last_name are only relevant for PIX/boleto/account_money.
    const paymentBody: Record<string, unknown> = {
      transaction_amount: args.totalAmount,
      token: args.formData.token,
      description: args.description,
      installments: args.formData.installments,
      payment_method_id: args.formData.payment_method_id,
      payer: {
        email: payerEmail,
        ...(args.formData.payer.identification
          ? { identification: args.formData.payer.identification }
          : {}),
      },
      external_reference: String(args.internalId),
      statement_descriptor: "FernandaEPedro",
      metadata: { internal_id: args.internalId },
    };
    if (args.formData.issuer_id !== undefined && args.formData.issuer_id !== null) {
      const issuer = Number(args.formData.issuer_id);
      if (Number.isFinite(issuer)) paymentBody.issuer_id = issuer;
    }
    const res = await payment.create({
      body: paymentBody as Parameters<typeof payment.create>[0]["body"],
      requestOptions: {
        idempotencyKey: `card-${args.internalId}-${Date.now()}`,
      },
    });

    const mpId = String(res.id);
    const status = res.status ?? "pending";
    const statusDetail = res.status_detail ?? null;
    const paymentTypeId = res.payment_type_id ?? "credit_card";
    const installments = res.installments ?? args.formData.installments ?? 1;
    const methodLabel = paymentMethodLabel(paymentTypeId, installments);

    if (status === "approved") {
      // Write audit + decrement inventory + mark approved
      try {
        for (const item of args.cartItems) {
          if (item.kind === "gift") {
            for (let i = 0; i < item.quantity; i++) {
              await appendPaymentAudit({
                giftName: item.giftName,
                reserverName: args.reserverName,
                amount: item.price,
                message: args.message,
                paymentMethod: methodLabel,
                email: args.reserverEmail,
                phone: args.phone,
                giftImageUrl: args.giftImageUrl,
              });
            }
          } else {
            await appendPaymentAudit({
              giftName: "Doação",
              reserverName: args.reserverName,
              amount: item.amount,
              message: args.message,
              paymentMethod: methodLabel,
              email: args.reserverEmail,
              phone: args.phone,
              giftImageUrl: args.giftImageUrl,
            });
          }
        }
        for (const item of args.cartItems) {
          if (item.kind === "gift") {
            await decrementGiftAvailability(item.giftName, item.quantity);
          }
        }
        await args.sql`
          UPDATE pix_payments
          SET status = 'approved',
              paid_at = NOW(),
              audit_written = true,
              inventory_decremented = true,
              mercado_pago_id = ${mpId},
              payment_method = ${methodLabel}
          WHERE id = ${args.internalId}
        `;
      } catch (sheetErr) {
        // MP charged the card. Sheet write failed. Log loudly; still return success
        // to the buyer so they don't get charged twice. Manual reconciliation needed.
        console.error(
          `[checkout/process] sheet write failed AFTER card approval for ${args.internalId}; pending audit retry`,
          sheetErr
        );
        await args.sql`
          UPDATE pix_payments
          SET status = 'approved', paid_at = NOW(),
              mercado_pago_id = ${mpId},
              payment_method = ${methodLabel}
          WHERE id = ${args.internalId}
        `;
      }

      return NextResponse.json({
        success: true,
        data: {
          method: "card",
          status: "approved",
          internalId: args.internalId,
          mercadoPagoId: mpId,
          paymentMethod: methodLabel,
        },
      });
    }

    if (
      status === "rejected" ||
      status === "cancelled" ||
      status === "refunded"
    ) {
      await args.sql`
        UPDATE pix_payments
        SET status = 'rejected', mercado_pago_id = ${mpId}, payment_method = ${methodLabel}
        WHERE id = ${args.internalId}
      `;
      return NextResponse.json(
        {
          success: false,
          data: {
            method: "card",
            status: "rejected",
            mercadoPagoId: mpId,
            statusDetail,
          },
          message: rejectionMessage(statusDetail),
        },
        { status: 402 }
      );
    }

    // pending / in_process — card requires async verification (e.g. 3DS)
    await args.sql`
      UPDATE pix_payments
      SET mercado_pago_id = ${mpId}, payment_method = ${methodLabel}
      WHERE id = ${args.internalId}
    `;
    return NextResponse.json({
      success: true,
      data: {
        method: "card",
        status: "pending",
        internalId: args.internalId,
        mercadoPagoId: mpId,
        paymentMethod: methodLabel,
        statusDetail,
      },
    });
  } catch (err) {
    // Dump everything MP sent us — `cause` often has the field-level errors
    const mpDetail = describeMpError(err);
    console.error("[checkout/process] card error:", mpDetail);
    await args.sql`
      UPDATE pix_payments SET status = 'rejected' WHERE id = ${args.internalId}
    `;
    const userMessage = humanizeMpError(mpDetail);
    return NextResponse.json(
      {
        success: false,
        message: userMessage,
        debug:
          process.env.NODE_ENV === "production" ? undefined : mpDetail,
      },
      { status: 502 }
    );
  }
}

function describeMpError(err: unknown): {
  message: string;
  status?: number;
  causes: Array<{ code?: string | number; description?: string }>;
} {
  const out: {
    message: string;
    status?: number;
    causes: Array<{ code?: string | number; description?: string }>;
  } = { message: "unknown", causes: [] };
  if (!err || typeof err !== "object") return out;
  const e = err as Record<string, unknown>;
  if (typeof e.message === "string") out.message = e.message;
  if (typeof e.status === "number") out.status = e.status;
  const cause = e.cause;
  if (Array.isArray(cause)) {
    for (const c of cause) {
      if (c && typeof c === "object") {
        const obj = c as Record<string, unknown>;
        out.causes.push({
          code: obj.code as string | number | undefined,
          description: obj.description as string | undefined,
        });
      }
    }
  } else if (cause && typeof cause === "object") {
    const obj = cause as Record<string, unknown>;
    out.causes.push({
      code: obj.code as string | number | undefined,
      description: obj.description as string | undefined,
    });
  }
  return out;
}

function humanizeMpError(detail: ReturnType<typeof describeMpError>): string {
  for (const c of detail.causes) {
    if (typeof c.code === "string" || typeof c.code === "number") {
      const msg = rejectionMessage(String(c.code));
      if (msg !== "Pagamento recusado.") return msg;
    }
  }
  if (detail.message === "internal_error") {
    return "Mercado Pago não conseguiu processar agora. Tente outro cartão ou PIX.";
  }
  return "Pagamento não autorizado. Verifique os dados e tente novamente.";
}

function rejectionMessage(statusDetail: string | null): string {
  switch (statusDetail) {
    case "cc_rejected_high_risk":
      return "Pagamento rejeitado por suspeita de fraude.";
    case "cc_rejected_insufficient_amount":
      return "Saldo insuficiente no cartão.";
    case "cc_rejected_bad_filled_security_code":
      return "Código de segurança (CVV) incorreto.";
    case "cc_rejected_bad_filled_date":
      return "Data de validade incorreta.";
    case "cc_rejected_bad_filled_other":
      return "Dados do cartão incorretos.";
    case "cc_rejected_call_for_authorize":
      return "Banco pediu autorização — entre em contato com seu banco.";
    case "cc_rejected_card_disabled":
      return "Cartão desabilitado.";
    case "cc_rejected_duplicated_payment":
      return "Pagamento duplicado.";
    case "cc_rejected_other_reason":
      return "Pagamento recusado pelo banco emissor.";
    default:
      return "Pagamento recusado.";
  }
}
