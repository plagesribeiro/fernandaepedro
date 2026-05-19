"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  QrCode,
  Clock,
  XCircle,
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatCurrency } from "@/lib/utils";

interface PixData {
  internalId: number;
  mercadoPagoId: string;
  copiaECola: string;
  qrCodeBase64: string;
  amount: number;
  expiresAt: string;
}

interface Props {
  items: Array<
    | { kind: "gift"; giftName: string; quantity: number }
    | { kind: "donation"; amount: number }
  >;
  reserverName: string;
  reserverEmail: string;
  reserverPhone: string;
  message?: string;
  giftImageUrl?: string;
  amount: number;
  onApproved: (info: { internalId: number; mercadoPagoId: string }) => void;
}

type Phase = "idle" | "loading" | "awaiting" | "expired" | "error";

export function PixCheckoutStep({
  items,
  reserverName,
  reserverEmail,
  reserverPhone,
  message,
  giftImageUrl,
  amount,
  onApproved,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pix, setPix] = useState<PixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const approvedCalled = useRef(false);

  const generate = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/checkout/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "pix",
          items,
          reserverName,
          reserverEmail,
          reserverPhone,
          message,
          giftImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        setError(data.message || "Não foi possível gerar o PIX.");
        setPhase("error");
        return;
      }
      setPix(data.data as PixData);
      setPhase("awaiting");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setPhase("error");
    }
  }, [items, reserverName, reserverEmail, reserverPhone, message, giftImageUrl]);

  // Poll status
  useEffect(() => {
    if (phase !== "awaiting" || !pix) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const url = `/api/checkout/status/${pix.internalId}?paymentId=${pix.mercadoPagoId}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data?.data?.status === "approved") {
          if (!approvedCalled.current) {
            approvedCalled.current = true;
            onApproved({
              internalId: pix.internalId,
              mercadoPagoId: pix.mercadoPagoId,
            });
          }
        } else if (
          data?.data?.status === "expired" ||
          data?.data?.status === "rejected"
        ) {
          setPhase("expired");
        }
      } catch {
        // silent
      }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, pix, onApproved]);

  if (phase === "idle") {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-gold/10 mx-auto flex items-center justify-center">
          <QrCode className="w-8 h-8 text-rose-gold" />
        </div>
        <div>
          <p className="text-sm text-warm-gray mb-1">
            Vamos gerar um QR Code PIX no valor de
          </p>
          <p className="text-2xl font-serif text-rose-gold tabular-nums">
            {formatCurrency(amount)}
          </p>
        </div>
        <AnimatedButton onClick={generate} size="lg" className="w-full">
          <span className="flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5" /> Gerar QR Code PIX
          </span>
        </AnimatedButton>
        <p className="text-xs text-warm-gray/70">
          Você terá 30 minutos pra pagar. A confirmação é automática.
        </p>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-rose-gold animate-spin mx-auto mb-2" />
        <p className="text-sm text-warm-gray">Gerando PIX...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="text-center py-8 space-y-3">
        <XCircle className="w-10 h-10 text-red-500 mx-auto" />
        <p className="text-sm text-red-600">{error}</p>
        <AnimatedButton variant="outline" onClick={() => setPhase("idle")}>
          Tentar de novo
        </AnimatedButton>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div className="text-center py-8 space-y-3">
        <Clock className="w-10 h-10 text-yellow-600 mx-auto" />
        <p className="text-sm text-warm-gray">
          O PIX expirou. Gere um novo pra continuar.
        </p>
        <AnimatedButton variant="outline" onClick={() => setPhase("idle")}>
          Gerar novo PIX
        </AnimatedButton>
      </div>
    );
  }

  if (!pix) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center">
        <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">
          Valor a pagar
        </p>
        <p className="text-2xl font-serif text-rose-gold tabular-nums">
          {formatCurrency(pix.amount)}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-charcoal">
          Escaneie o QR Code com seu app de banco
        </p>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-rose-gold/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code PIX"
            className="w-48 h-48"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <CopyButton text={pix.copiaECola} />
      </div>

      <div className="bg-champagne/50 border border-rose-gold/15 rounded-xl p-3">
        <p className="text-[11px] text-warm-gray/80 break-all font-mono leading-relaxed select-all max-h-24 overflow-y-auto">
          {pix.copiaECola}
        </p>
      </div>

      <CountdownTimer expiresAt={pix.expiresAt} />

      <AnimatePresence>
        <div className="flex items-center justify-center gap-2 text-sm text-rose-gold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Aguardando pagamento...</span>
        </div>
      </AnimatePresence>
    </motion.div>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    function tick() {
      const ms = Date.parse(expiresAt) - Date.now();
      if (ms <= 0) {
        setText("Expirado");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setText(
        `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-warm-gray">
      <Clock className="w-3.5 h-3.5" />
      Expira em <span className="font-semibold tabular-nums">{text}</span>
    </div>
  );
}
