"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Loader2 } from "lucide-react";
import { AnimatedButton } from "./AnimatedButton";
import { FormField } from "./FormField";
import { CurrencyInput } from "./CurrencyInput";
import { PixPaymentStep } from "./PixPaymentStep";
import { ConfettiOverlay } from "@/components/effects/ConfettiOverlay";
import { usePixPolling } from "@/hooks/usePixPolling";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import type { PixCreateResponse } from "@/types";

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "form" | "pix" | "success";

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export function DonationModal({ open, onClose }: DonationModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState<PixCreateResponse | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { play } = useSoundEffect();

  const { status, isPolling } = usePixPolling({
    pixPaymentId: pixData?.pixPaymentId ?? null,
  });

  if (status === "approved" && step === "pix") {
    play("success");
    setStep("success");
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      handleFullClose();
    }, 4000);
  }

  if (!open) return null;

  function handleFullClose() {
    setStep("form");
    setName("");
    setEmail("");
    setAmount(0);
    setMessage("");
    setError("");
    setPixData(null);
    setShowConfetti(false);
    onClose();
  }

  async function handleCreatePix(e: React.FormEvent) {
    e.preventDefault();

    if (amount < 1) {
      setError("Valor mínimo é R$ 1,00");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "donation",
          reserverName: name,
          reserverEmail: email,
          amount,
          message: message || undefined,
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

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-rose-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-rose-gold" />
              </div>
              <h3 className="font-serif text-xl text-charcoal">
                Doação Personalizada
              </h3>
              <p className="text-sm text-warm-gray mt-1">
                Contribua com o valor que desejar
              </p>
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
                    id="donation-name"
                    label="Seu nome"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) =>
                      setName((e.target as HTMLInputElement).value)
                    }
                    required
                  />
                  <FormField
                    id="donation-email"
                    label="Seu e-mail"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) =>
                      setEmail((e.target as HTMLInputElement).value)
                    }
                    required
                  />
                  <CurrencyInput
                    id="donation-amount"
                    label="Valor da contribuição"
                    value={amount}
                    onChange={setAmount}
                  />
                  <FormField
                    id="donation-message"
                    label="Mensagem (opcional)"
                    as="textarea"
                    rows={3}
                    placeholder="Deixe uma mensagem carinhosa para os noivos..."
                    value={message}
                    onChange={(e) =>
                      setMessage((e.target as HTMLTextAreaElement).value)
                    }
                  />

                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}

                  <AnimatedButton
                    type="submit"
                    disabled={loading || !name || !email || amount < 1}
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
                    Doação recebida com sucesso! Muito obrigado pela sua
                    generosidade e carinho.
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
