"use client";

import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartContext";
import { formatCurrency } from "@/lib/utils";

export function CartButton() {
  const { itemCount, total, openDrawer } = useCart();

  if (itemCount === 0) return null;

  return (
    <motion.button
      type="button"
      onClick={openDrawer}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{ type: "spring", damping: 18, stiffness: 320 }}
      className="fixed z-[60] bottom-5 right-5 sm:bottom-8 sm:right-8 flex items-center gap-3 pl-3 pr-4 sm:pl-4 sm:pr-5 py-3 rounded-full bg-rose-gold text-white shadow-xl hover:bg-rose-gold-dark transition-colors group"
      aria-label="Abrir carrinho"
    >
      <span className="relative">
        <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
        <AnimatePresence>
          <motion.span
            key={itemCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-ivory text-rose-gold text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {itemCount}
          </motion.span>
        </AnimatePresence>
      </span>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] uppercase tracking-wider opacity-80">
          Carrinho
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
    </motion.button>
  );
}
