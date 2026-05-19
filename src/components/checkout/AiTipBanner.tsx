"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { formatCurrency } from "@/lib/utils";

interface AiTipBannerProps {
  /** Renderiza o banner se true. */
  show: boolean;
  /** Estado persistido — pra refletir adições anteriores corretamente após reload. */
  addedAmount: number | null;
  onAdd: (amount: number) => void;
  onDismiss: () => void;
}

const PRESETS = [10, 25, 50];

export function AiTipBanner({
  show,
  addedAmount,
  onAdd,
  onDismiss,
}: AiTipBannerProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customOpen) {
      // Foca o input quando abre
      requestAnimationFrame(() => customInputRef.current?.focus());
    }
  }, [customOpen]);

  function handlePreset(amount: number) {
    onAdd(amount);
    setCustomOpen(false);
    setCustomValue("");
  }

  function handleCustomSubmit() {
    const num = Number(customValue.replace(",", "."));
    if (!Number.isFinite(num) || num < 1) return;
    onAdd(Math.round(num * 100) / 100);
    setCustomOpen(false);
    setCustomValue("");
  }

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="tip"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "relative rounded-xl border border-rose-gold/20 p-4 my-3",
            "bg-gradient-to-br from-rose-gold/[0.08] via-champagne to-blush/40"
          )}
        >
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-rose-gold/10 text-warm-gray transition-colors"
            aria-label="Dispensar"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {addedAmount === null ? (
            <>
              <div className="flex items-start gap-2 pr-6">
                <Sparkles className="w-4 h-4 text-rose-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-serif text-sm text-charcoal">
                    Adorou a experiência?
                  </p>
                  <p className="text-xs text-warm-gray/90 leading-relaxed">
                    Esse site foi feito com carinho pelos noivos. Se quiser,
                    inclui uma doaçãozinha extra de agrado.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {PRESETS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePreset(amount)}
                    className="border border-rose-gold/30 hover:bg-rose-gold/10 active:bg-rose-gold/15 px-3 py-1.5 rounded-full text-xs font-medium text-charcoal transition-colors tabular-nums"
                  >
                    R$ {amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomOpen((v) => !v)}
                  className="border border-rose-gold/30 hover:bg-rose-gold/10 active:bg-rose-gold/15 px-3 py-1.5 rounded-full text-xs font-medium text-rose-gold transition-colors"
                  aria-expanded={customOpen}
                >
                  Outro valor
                </button>
              </div>

              <AnimatePresence initial={false}>
                {customOpen && (
                  <motion.div
                    key="custom"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-warm-gray">R$</span>
                      <input
                        ref={customInputRef}
                        type="text"
                        inputMode="decimal"
                        value={customValue}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9,.]/g, "");
                          setCustomValue(v);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCustomSubmit();
                          }
                        }}
                        placeholder="0,00"
                        className="w-24 px-3 py-1.5 rounded-lg border border-charcoal/10 bg-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-gold/25 focus:border-rose-gold tabular-nums"
                      />
                      <AnimatedButton
                        type="button"
                        size="sm"
                        onClick={handleCustomSubmit}
                        disabled={!customValue}
                      >
                        Adicionar
                      </AnimatedButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex items-start gap-2 pr-6">
              <Heart className="w-4 h-4 text-rose-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-serif text-sm text-charcoal flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-sage" />
                  Doação extra de{" "}
                  <span className="font-semibold text-rose-gold">
                    {formatCurrency(addedAmount)}
                  </span>{" "}
                  no carrinho
                </p>
                <p className="text-xs text-warm-gray/90 leading-relaxed">
                  Obrigado pelo carinho! Pra mudar o valor, abre o carrinho no
                  cantinho da tela.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
