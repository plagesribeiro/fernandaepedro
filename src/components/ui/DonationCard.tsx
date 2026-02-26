"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { AnimatedButton } from "./AnimatedButton";

interface DonationCardProps {
  onDonate: () => void;
}

export function DonationCard({ onDonate }: DonationCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl overflow-hidden border border-rose-gold/20 bg-gradient-to-br from-rose-gold/5 to-champagne hover:shadow-xl hover:border-rose-gold/40 transition-all duration-300"
    >
      <div className="aspect-[4/3] sm:aspect-square bg-gradient-to-br from-rose-gold/10 to-blush/50 flex items-center justify-center relative overflow-hidden">
        <div className="relative">
          <Heart className="w-12 h-12 sm:w-20 sm:h-20 text-rose-gold/40 fill-rose-gold/20" />
          <Heart className="w-6 h-6 sm:w-10 sm:h-10 text-rose-gold/60 fill-rose-gold/30 absolute -top-2 -right-4 rotate-12" />
        </div>
      </div>
      <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-3">
        <div>
          <h3 className="font-serif text-base sm:text-lg text-charcoal leading-tight">
            Doação Personalizada
          </h3>
          <p className="text-xs sm:text-sm text-warm-gray mt-1 line-clamp-1 sm:line-clamp-2">
            Contribua com o valor que desejar e deixe uma mensagem carinhosa
            para os noivos.
          </p>
        </div>
        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <span className="text-xs sm:text-sm text-rose-gold font-medium">
            Valor livre
          </span>
          <AnimatedButton size="sm" onClick={onDonate}>
            Contribuir
          </AnimatedButton>
        </div>
      </div>
    </motion.div>
  );
}
