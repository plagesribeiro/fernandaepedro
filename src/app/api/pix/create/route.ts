import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { pixCreateSchema } from "@/lib/validators";
import { getPaymentClient } from "@/lib/mercadopago";
import { isGiftAvailable, getGiftPrice } from "@/lib/gift-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = pixCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, reserverName, reserverEmail, giftId, amount, message } =
      parsed.data;

    let pixAmount: number;
    let description: string;

    if (type === "gift") {
      const gift = await getGiftPrice(giftId!);
      if (!gift) {
        return NextResponse.json(
          { success: false, message: "Presente não encontrado." },
          { status: 404 }
        );
      }

      const available = await isGiftAvailable(giftId!);
      if (!available) {
        return NextResponse.json(
          {
            success: false,
            message: "Este presente já foi reservado por outro convidado.",
          },
          { status: 409 }
        );
      }

      pixAmount = gift.price;
      description = `Presente: ${gift.name}`;
    } else {
      pixAmount = amount!;
      description = "Doação para Fernanda & Pedro";
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    let mercadoPagoId: string | null = null;
    let pixCopiaECola: string | null = null;
    let qrCodeBase64: string | null = null;

    try {
      const payment = getPaymentClient();
      const mpResponse = await payment.create({
        body: {
          transaction_amount: pixAmount,
          description,
          payment_method_id: "pix",
          payer: {
            email: reserverEmail,
            first_name: reserverName.split(" ")[0],
            last_name: reserverName.split(" ").slice(1).join(" ") || reserverName,
          },
          date_of_expiration: expiresAt.toISOString(),
        },
        requestOptions: { idempotencyKey: `${type}-${Date.now()}-${Math.random()}` },
      });

      mercadoPagoId = String(mpResponse.id);
      const transactionData = mpResponse.point_of_interaction?.transaction_data;
      pixCopiaECola = transactionData?.qr_code || null;
      qrCodeBase64 = transactionData?.qr_code_base64 || null;
    } catch (mpError) {
      console.error("Mercado Pago error:", mpError);
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao gerar pagamento PIX. Tente novamente.",
        },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      INSERT INTO pix_payments (
        mercado_pago_id, amount, description, status, type,
        reserver_name, reserver_email, gift_id, message,
        pix_copia_e_cola, expires_at
      ) VALUES (
        ${mercadoPagoId}, ${pixAmount}, ${description}, 'pending', ${type},
        ${reserverName}, ${reserverEmail}, ${giftId || null}, ${message || null},
        ${pixCopiaECola}, ${expiresAt.toISOString()}
      ) RETURNING id
    `;

    const pixPaymentId = result[0].id;

    return NextResponse.json({
      success: true,
      data: {
        pixPaymentId,
        copiaECola: pixCopiaECola,
        qrCodeBase64,
        amount: pixAmount,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("PIX create error:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao criar pagamento PIX." },
      { status: 500 }
    );
  }
}
