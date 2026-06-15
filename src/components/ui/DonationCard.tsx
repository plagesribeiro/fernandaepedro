"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, X } from "lucide-react";
import { AnimatedButton } from "./AnimatedButton";
import { CurrencyInput } from "./CurrencyInput";
import { useCart } from "@/components/cart/CartContext";

export function DonationCard() {
  const { addDonation, openDrawer } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState(0);

  function handleAdd() {
    if (amount < 1) return;
    addDonation(amount);
    setAmount(0);
    setExpanded(false);
    openDrawer();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl overflow-hidden border border-rose-gold/20 bg-gradient-to-br from-rose-gold/5 to-champagne hover:shadow-xl hover:border-rose-gold/40 transition-all duration-300 flex flex-col h-full"
    >
      <div className="aspect-[4/3] sm:aspect-square bg-gradient-to-br from-rose-gold/10 to-blush/50 flex items-center justify-center relative overflow-hidden">
        <div className="relative">
          <Heart className="w-12 h-12 sm:w-20 sm:h-20 text-rose-gold/40 fill-rose-gold/20" />
          <Heart className="w-6 h-6 sm:w-10 sm:h-10 text-rose-gold/60 fill-rose-gold/30 absolute -top-2 -right-4 rotate-12" />
        </div>
      </div>
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        <h3 className="font-serif text-base sm:text-lg text-charcoal leading-tight line-clamp-2">
          Presente Personalizado
        </h3>
        <p className="text-xs sm:text-sm text-warm-gray line-clamp-3 leading-snug mt-2">
          Contribua com o valor que desejar.
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {!expanded ? (
            <motion.div
              key="closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-auto pt-3 space-y-2"
            >
              <p className="text-base sm:text-lg text-rose-gold font-semibold tabular-nums">
                Valor livre
              </p>
              <AnimatedButton
                size="sm"
                onClick={() => setExpanded(true)}
                className="w-full"
              >
                <span className="flex items-center justify-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </span>
              </AnimatedButton>
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-auto pt-3 space-y-2 overflow-hidden"
            >
              <CurrencyInput
                id="donation-card-amount"
                label="Quanto você quer contribuir?"
                value={amount}
                onChange={setAmount}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setAmount(0);
                  }}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg border border-rose-gold/20 text-warm-gray hover:bg-rose-gold/5 transition-colors text-xs flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <AnimatedButton
                  size="sm"
                  className="w-full sm:flex-1"
                  disabled={amount < 1}
                  onClick={handleAdd}
                >
                  Adicionar ao carrinho
                </AnimatedButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
