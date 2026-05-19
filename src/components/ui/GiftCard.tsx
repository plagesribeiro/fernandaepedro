"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Gift as GiftIcon, Plus, Check } from "lucide-react";
import { cn, formatCurrency, isUsableImage } from "@/lib/utils";
import { AnimatedButton } from "./AnimatedButton";
import { useCart } from "@/components/cart/CartContext";
import type { Gift } from "@/types";

interface GiftCardProps {
  gift: Gift;
}

function AvailabilityBadge({
  available,
  inCart,
}: {
  available: number | null;
  inCart: number;
}) {
  if (available !== null && available <= 0) {
    return (
      <span className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md font-medium bg-red-50 text-red-600 border border-red-200">
        Esgotado
      </span>
    );
  }
  if (inCart > 0) {
    const remaining =
      available === null ? null : Math.max(0, available - inCart);
    return (
      <span className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md font-medium bg-rose-gold/10 text-rose-gold border border-rose-gold/30 flex items-center gap-1">
        <Check className="w-3 h-3" />
        {inCart} no carrinho
        {remaining !== null && remaining > 0 ? ` · +${remaining}` : ""}
      </span>
    );
  }
  if (available === null) {
    return (
      <span className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        Disponível
      </span>
    );
  }
  return (
    <span className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      {available} disponí{available === 1 ? "vel" : "veis"}
    </span>
  );
}

export function GiftCard({ gift }: GiftCardProps) {
  const { addGift, giftQuantityInCart, openDrawer } = useCart();
  const inCart = giftQuantityInCart(gift.name);
  const isAvailable =
    gift.availableQuantity === null || gift.availableQuantity > 0;
  const remaining =
    gift.availableQuantity === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, gift.availableQuantity - inCart);
  const canAddMore = isAvailable && remaining > 0;
  const hasImage = isUsableImage(gift.imageUrl);

  function handleAdd() {
    if (!canAddMore) return;
    addGift({
      giftName: gift.name,
      price: gift.price,
      imageUrl: gift.imageUrl,
      description: gift.description,
      availableQuantity: gift.availableQuantity,
    });
    openDrawer();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col h-full",
        "bg-champagne backdrop-blur-sm hover:shadow-xl",
        isAvailable
          ? "border-rose-gold/10 hover:border-rose-gold/30"
          : "border-gray-200 opacity-70"
      )}
    >
      <div className="aspect-[4/3] sm:aspect-square bg-gradient-to-br from-blush to-champagne flex items-center justify-center relative overflow-hidden">
        {hasImage ? (
          <Image
            src={gift.imageUrl}
            alt={gift.name}
            fill
            sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <GiftIcon className="w-10 h-10 sm:w-16 sm:h-16 text-rose-gold/30" />
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-serif text-sm sm:text-lg rotate-[-15deg]">
              Esgotado
            </span>
          </div>
        )}
        <AnimatePresence>
          {inCart > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-gold text-white text-xs font-bold flex items-center justify-center shadow-md"
            >
              {inCart}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        <h3 className="font-serif text-base sm:text-lg text-charcoal leading-tight line-clamp-2">
          {gift.name}
        </h3>
        {gift.description && (
          <p className="text-xs sm:text-sm text-warm-gray line-clamp-3 leading-snug mt-2">
            {gift.description}
          </p>
        )}
        <div className="mt-auto pt-3 space-y-2">
          <p className="text-base sm:text-lg font-semibold text-rose-gold tabular-nums">
            {formatCurrency(gift.price)}
          </p>
          <div>
            <AvailabilityBadge
              available={gift.availableQuantity}
              inCart={inCart}
            />
          </div>
          <AnimatedButton
            size="sm"
            variant={canAddMore ? "primary" : "outline"}
            disabled={!canAddMore}
            onClick={handleAdd}
            className="w-full"
          >
            <span className="flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              {!isAvailable
                ? "Esgotado"
                : !canAddMore
                  ? "No carrinho"
                  : inCart > 0
                    ? "Mais um"
                    : "Adicionar"}
            </span>
          </AnimatedButton>
        </div>
      </div>
    </motion.div>
  );
}
