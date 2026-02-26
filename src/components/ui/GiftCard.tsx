"use client";

import { motion } from "framer-motion";
import { Gift as GiftIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { AnimatedButton } from "./AnimatedButton";
import type { Gift } from "@/types";

interface GiftCardProps {
  gift: Gift;
  onReserve: (gift: Gift) => void;
}

function AvailabilityBadge({ available, total }: { available: number; total: number }) {
  const ratio = available / total;
  const color =
    ratio === 0
      ? "bg-red-900/30 text-red-400"
      : ratio <= 0.5
        ? "bg-yellow-900/30 text-yellow-400"
        : "bg-green-900/30 text-green-400";
  const label =
    ratio === 0
      ? "Esgotado"
      : `${available} de ${total} disponível${available > 1 ? "is" : ""}`;

  return (
    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", color)}>
      {label}
    </span>
  );
}

export function GiftCard({ gift, onReserve }: GiftCardProps) {
  const isAvailable = gift.availableQuantity > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "rounded-2xl overflow-hidden border transition-all duration-300",
        "bg-champagne backdrop-blur-sm hover:shadow-xl",
        isAvailable
          ? "border-rose-gold/10 hover:border-rose-gold/30"
          : "border-gray-200 opacity-70"
      )}
    >
      <div className="aspect-square bg-gradient-to-br from-blush to-champagne flex items-center justify-center relative overflow-hidden">
        <GiftIcon className="w-16 h-16 text-rose-gold/30" />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-serif text-lg rotate-[-15deg]">
              Reservado
            </span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg text-charcoal leading-tight">
            {gift.name}
          </h3>
          <AvailabilityBadge
            available={gift.availableQuantity}
            total={gift.totalQuantity}
          />
        </div>
        {gift.description && (
          <p className="text-sm text-warm-gray line-clamp-2">
            {gift.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-semibold text-rose-gold">
            {formatCurrency(gift.price)}
          </span>
          <AnimatedButton
            size="sm"
            variant={isAvailable ? "primary" : "outline"}
            disabled={!isAvailable}
            onClick={() => isAvailable && onReserve(gift)}
          >
            {isAvailable ? "Reservar" : "Esgotado"}
          </AnimatedButton>
        </div>
      </div>
    </motion.div>
  );
}
