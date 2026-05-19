"use client";

import { useEffect, useState } from "react";
import { CardPayment } from "@mercadopago/sdk-react";
import { Loader2, AlertCircle } from "lucide-react";
import { ensureMpInitialized } from "./mp-init";

interface SubmittedPayload {
  paymentMethod: "card";
  items: Array<
    | { kind: "gift"; giftName: string; quantity: number }
    | { kind: "donation"; amount: number }
  >;
  reserverName: string;
  reserverEmail: string;
  reserverPhone: string;
  message?: string;
  giftImageUrl?: string;
  formData: unknown;
}

interface ProcessResponse {
  success: boolean;
  message?: string;
  data?: {
    status: "approved" | "pending" | "rejected";
    internalId?: number;
    mercadoPagoId?: string;
    paymentMethod?: string;
    statusDetail?: string | null;
  };
}

interface Props {
  amount: number;
  payerEmail: string;
  buildPayload: (formData: unknown) => SubmittedPayload;
  onApproved: (info: { internalId?: number; mercadoPagoId?: string; paymentMethod?: string }) => void;
  onPending: (info: { internalId: number; mercadoPagoId: string; statusDetail?: string | null }) => void;
}

export function CardPaymentBrick({
  amount,
  payerEmail,
  buildPayload,
  onApproved,
  onPending,
}: Props) {
  const [initOk, setInitOk] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInitOk(ensureMpInitialized());
  }, []);

  if (initOk === false) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">
            Pagamento por cartão indisponível.
          </p>
          <p className="text-yellow-700/90">
            Configure <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY</code>{" "}
            no <code className="bg-yellow-100 px-1 rounded">.env</code> com a public key do MP. Enquanto isso, paga via PIX.
          </p>
        </div>
      </div>
    );
  }

  if (initOk === null) {
    return (
      <div className="flex items-center justify-center py-12 text-warm-gray text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  return (
    <div className="relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-ivory/80 z-10 rounded-lg">
          <div className="flex items-center gap-2 text-warm-gray text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando formulário do cartão...
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-500 text-center mb-3">{error}</p>
      )}
      <CardPayment
        initialization={{
          amount,
          payer: { email: payerEmail },
        }}
        customization={{
          paymentMethods: {
            maxInstallments: 12,
            minInstallments: 1,
          },
          visual: {
            hideFormTitle: true,
            style: {
              theme: "default",
            },
          },
        }}
        onReady={() => setReady(true)}
        onError={(err: unknown) => {
          console.error("[CardPaymentBrick] error:", err);
          setError("Algo deu errado com o formulário. Recarregue e tente novamente.");
        }}
        onSubmit={async (formData) => {
          setError(null);
          const payload = buildPayload(formData);
          const res = await fetch("/api/checkout/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = (await res.json()) as ProcessResponse;
          if (!res.ok || !result.success || !result.data) {
            const msg = result.message || "Pagamento recusado.";
            setError(msg);
            throw new Error(msg);
          }
          if (result.data.status === "approved") {
            onApproved({
              internalId: result.data.internalId,
              mercadoPagoId: result.data.mercadoPagoId,
              paymentMethod: result.data.paymentMethod,
            });
            return;
          }
          if (result.data.status === "pending") {
            onPending({
              internalId: result.data.internalId!,
              mercadoPagoId: result.data.mercadoPagoId!,
              statusDetail: result.data.statusDetail,
            });
            return;
          }
          const msg = result.message || "Pagamento recusado.";
          setError(msg);
          throw new Error(msg);
        }}
      />
    </div>
  );
}
