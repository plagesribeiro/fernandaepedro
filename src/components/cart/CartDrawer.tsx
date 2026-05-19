"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, Heart, ShoppingBag } from "lucide-react";
import { useCart, type CartItem } from "./CartContext";
import { formatCurrency, isUsableImage } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    drawerOpen,
    closeDrawer,
    total,
    setGiftQuantity,
    removeGift,
    removeDonation,
    clear,
  } = useCart();

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-[90] w-full sm:w-[420px] bg-ivory shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-rose-gold/10">
              <h2 className="font-serif text-xl text-charcoal flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-gold" />
                Seu carrinho
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1 rounded-full hover:bg-rose-gold/10 transition-colors"
              >
                <X className="w-5 h-5 text-warm-gray" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {items.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-rose-gold/30 mx-auto mb-3" />
                  <p className="text-warm-gray text-sm">
                    Seu carrinho ainda está vazio. Volte e escolha alguns
                    presentes!
                  </p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {items.map((it) => {
                  const atLimit =
                    it.kind === "gift" &&
                    it.availableQuantity !== null &&
                    it.quantity >= it.availableQuantity;
                  return (
                    <CartRow
                      key={
                        it.kind === "gift"
                          ? `gift-${it.giftName}`
                          : `donation-${it.id}`
                      }
                      item={it}
                      onIncrement={
                        it.kind === "gift"
                          ? () =>
                              setGiftQuantity(
                                it.giftName,
                                it.quantity + 1
                              )
                          : undefined
                      }
                      incrementDisabled={atLimit}
                      onDecrement={
                        it.kind === "gift"
                          ? () => setGiftQuantity(it.giftName, it.quantity - 1)
                          : undefined
                      }
                      onRemove={() =>
                        it.kind === "gift"
                          ? removeGift(it.giftName)
                          : removeDonation(it.id)
                      }
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            {items.length > 0 && (
              <div className="border-t border-rose-gold/10 p-5 space-y-3 bg-champagne/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-gray">Total</span>
                  <span className="text-2xl font-serif text-rose-gold tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="block w-full text-center bg-rose-gold text-white py-3 rounded-lg font-medium hover:bg-rose-gold-dark transition-colors"
                >
                  Finalizar compra
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  className="block w-full text-center text-xs text-warm-gray hover:text-rose-gold transition-colors"
                >
                  Esvaziar carrinho
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CartRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  incrementDisabled,
}: {
  item: CartItem;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove: () => void;
  incrementDisabled?: boolean;
}) {
  const isGift = item.kind === "gift";
  const lineTotal =
    isGift ? item.price * item.quantity : item.amount;
  const hasImage = isGift && isUsableImage(item.imageUrl);
  const atLimit =
    incrementDisabled === true ||
    (isGift &&
      item.availableQuantity !== null &&
      item.quantity >= item.availableQuantity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className="flex gap-3 p-3 rounded-xl border border-rose-gold/10 bg-white"
    >
      <div className="w-16 h-16 rounded-lg bg-blush/40 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
        {hasImage ? (
          <Image
            src={item.imageUrl}
            alt={item.giftName}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : isGift ? (
          <ShoppingBag className="w-6 h-6 text-rose-gold/40" />
        ) : (
          <Heart className="w-6 h-6 text-rose-gold/50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm text-charcoal truncate">
              {isGift ? item.giftName : "Doação Personalizada"}
            </p>
            <p className="text-xs text-warm-gray tabular-nums">
              {formatCurrency(isGift ? item.price : item.amount)}
              {isGift && item.quantity > 1 && ` × ${item.quantity}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-warm-gray hover:text-red-500 transition-colors"
            aria-label="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          {isGift ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onDecrement}
                className="w-6 h-6 rounded-md border border-rose-gold/30 text-rose-gold flex items-center justify-center hover:bg-rose-gold hover:text-white transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-medium tabular-nums min-w-[20px] text-center">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={atLimit ? undefined : onIncrement}
                disabled={atLimit}
                aria-disabled={atLimit}
                title={atLimit ? "Limite disponível atingido" : undefined}
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                  atLimit
                    ? "border-warm-gray/20 text-warm-gray/40 cursor-not-allowed"
                    : "border-rose-gold/30 text-rose-gold hover:bg-rose-gold hover:text-white"
                }`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span />
          )}
          <span className="text-sm font-semibold text-rose-gold tabular-nums">
            {formatCurrency(lineTotal)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
