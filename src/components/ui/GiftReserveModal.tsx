"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Loader2, ArrowLeft } from "lucide-react";
import { AnimatedButton } from "./AnimatedButton";
import { FormField } from "./FormField";
import { PhoneInput } from "./PhoneInput";
import { PixPaymentStep } from "./PixPaymentStep";
import { ConfettiOverlay } from "@/components/effects/ConfettiOverlay";
import { usePixPolling } from "@/hooks/usePixPolling";
import { formatCurrency } from "@/lib/utils";
import type { Gift as GiftType, PixCreateResponse } from "@/types";

interface GiftReserveModalProps {
  gift: GiftType | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "form" | "pix" | "success";

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export function GiftReserveModal({
  gift,
  onClose,
  onSuccess,
}: GiftReserveModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState<PixCreateResponse | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const { status, isPolling } = usePixPolling({
    pixPaymentId: pixData?.pixPaymentId ?? null,
  });

  // Transition to success when payment is approved
  if (status === "approved" && step === "pix") {
    setStep("success");
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      onSuccess();
      handleFullClose();
    }, 4000);
  }

  if (!gift) return null;

  function handleFullClose() {
    setStep("form");
    setName("");
    setEmail("");
    setPhone("");
    setError("");
    setPixData(null);
    setShowConfetti(false);
    onClose();
  }

  async function handleCreatePix(e: React.FormEvent) {
    e.preventDefault();
    if (!gift) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "gift",
          reserverName: name,
          reserverEmail: email,
          reserverPhone: phone,
          giftName: gift.name,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setPixData(data.data);
        setStep("pix");
      } else {
        setError(data.message || "Erro ao gerar pagamento PIX.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ConfettiOverlay active={showConfetti} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={step === "form" ? handleFullClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-ivory rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {step !== "success" && (
              <button
                onClick={handleFullClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-rose-gold/10 transition-colors"
              >
                <X className="w-5 h-5 text-warm-gray" />
              </button>
            )}

            {step === "pix" && status === "pending" && (
              <button
                onClick={() => setStep("form")}
                className="absolute top-4 left-4 p-1 rounded-full hover:bg-rose-gold/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-warm-gray" />
              </button>
            )}

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-rose-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-rose-gold" />
              </div>
              <h3 className="font-serif text-xl text-charcoal">{gift.name}</h3>
              {step === "form" && (
                <p className="text-rose-gold font-semibold mt-1">
                  {formatCurrency(gift.price)}
                </p>
              )}
            </div>

            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.form
                  key="form"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  onSubmit={handleCreatePix}
                  className="space-y-4"
                >
                  <FormField
                    id="reserve-name"
                    label="Seu nome"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) =>
                      setName((e.target as HTMLInputElement).value)
                    }
                    required
                  />
                  <FormField
                    id="reserve-email"
                    label="Seu e-mail"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) =>
                      setEmail((e.target as HTMLInputElement).value)
                    }
                    required
                  />
                  <PhoneInput
                    id="reserve-phone"
                    label="Seu telefone"
                    value={phone}
                    onChange={setPhone}
                  />

                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}

                  <AnimatedButton
                    type="submit"
                    disabled={
                      loading || !name || !email || phone.replace(/\D/g, "").length < 10
                    }
                    className="w-full"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando PIX...
                      </span>
                    ) : (
                      "Prosseguir para Pagamento"
                    )}
                  </AnimatedButton>
                </motion.form>
              )}

              {step === "pix" && pixData && (
                <motion.div
                  key="pix"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <PixPaymentStep
                    amount={pixData.amount}
                    copiaECola={pixData.copiaECola}
                    qrCodeBase64={pixData.qrCodeBase64}
                    expiresAt={pixData.expiresAt}
                    status={status}
                    isPolling={isPolling}
                  />
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="text-center py-4"
                >
                  <p className="text-warm-gray">
                    Presente reservado com sucesso! Obrigado pela sua
                    generosidade.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
