"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { formatCurrency } from "@/lib/utils";
import type { PixStatusResponse } from "@/types";

interface PixPaymentStepProps {
  amount: number;
  copiaECola: string;
  qrCodeBase64?: string | null;
  expiresAt: string;
  status: PixStatusResponse["status"];
  isPolling: boolean;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-sm text-warm-gray">
      <Clock className="w-4 h-4" />
      <span>Expira em: {timeLeft}</span>
    </div>
  );
}

export function PixPaymentStep({
  amount,
  copiaECola,
  qrCodeBase64,
  expiresAt,
  status,
  isPolling,
}: PixPaymentStepProps) {
  const [showCode, setShowCode] = useState(false);
  if (status === "approved") {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-sage" />
        </div>
        <h3 className="font-serif text-xl text-charcoal mb-2">
          Pagamento Confirmado!
        </h3>
        <p className="text-warm-gray text-sm">
          Obrigado pela sua generosidade!
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="font-serif text-xl text-charcoal mb-2">
          Pagamento Não Aprovado
        </h3>
        <p className="text-warm-gray text-sm">
          Houve um problema com o pagamento. Tente novamente.
        </p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="font-serif text-xl text-charcoal mb-2">
          PIX Expirado
        </h3>
        <p className="text-warm-gray text-sm">
          O tempo para pagamento expirou. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-warm-gray mb-1">Valor</p>
        <p className="text-2xl font-semibold text-rose-gold">
          {formatCurrency(amount)}
        </p>
      </div>

      {qrCodeBase64 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-charcoal">
            Escaneie o QR Code
          </p>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-rose-gold/10">
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-48 h-48"
            />
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <CopyButton text={copiaECola} />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCode((v) => !v)}
          className="flex items-center gap-1.5 mx-auto text-sm text-warm-gray hover:text-charcoal transition-colors"
        >
          <span>Ver código PIX Copia e Cola</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${showCode ? "rotate-180" : ""}`}
          />
        </button>
        {showCode && (
          <div className="mt-3 bg-champagne/50 border border-rose-gold/20 rounded-xl p-4">
            <p className="text-xs text-warm-gray break-all font-mono leading-relaxed select-all">
              {copiaECola}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <CountdownTimer expiresAt={expiresAt} />
        {isPolling && (
          <div className="flex items-center gap-2 text-sm text-rose-gold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Aguardando pagamento...</span>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-warm-gray/70">
        Escaneie o QR Code com o app do seu banco para pagar via PIX.
        A confirmação é automática.
      </p>
    </div>
  );
}
