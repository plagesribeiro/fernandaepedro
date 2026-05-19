"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

interface AiGalleryPickerProps {
  open: boolean;
  images: readonly string[];
  /** Quantas fotos a mais o usuário ainda pode selecionar (4 - currentAttachments). */
  remaining: number;
  onClose: () => void;
  onConfirm: (selectedUrls: string[]) => void;
}

export function AiGalleryPicker({
  open,
  images,
  remaining,
  onClose,
  onConfirm,
}: AiGalleryPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [bumpKey, setBumpKey] = useState(0);

  // Reset selection every time the modal opens.
  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const limitReached = selected.length >= remaining;

  function toggle(url: string) {
    setSelected((cur) => {
      if (cur.includes(url)) return cur.filter((u) => u !== url);
      if (cur.length >= remaining) {
        setBumpKey((k) => k + 1);
        return cur;
      }
      return [...cur, url];
    });
  }

  function handleConfirm() {
    if (selected.length === 0) return;
    onConfirm(selected);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex items-center justify-center sm:p-4 bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-ivory w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rose-gold/10 sticky top-0 bg-ivory z-10">
              <div className="min-w-0">
                <h2 className="font-serif text-base sm:text-lg text-charcoal">
                  Escolha do álbum de Fernanda &amp; Pedro
                </h2>
                <p className="text-[11px] text-warm-gray/80 mt-0.5">
                  Use até{" "}
                  <span className="font-medium">{remaining}</span>{" "}
                  {remaining === 1 ? "foto" : "fotos"} como referência pra IA.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-rose-gold/10 text-warm-gray transition-colors flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <motion.div
                key={bumpKey}
                animate={
                  limitReached ? { x: [0, -4, 4, -2, 2, 0] } : undefined
                }
                transition={{ duration: 0.3 }}
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
              >
                {images.map((src, i) => {
                  const isSelected = selectedSet.has(src);
                  const isLocked = !isSelected && limitReached;
                  return (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => toggle(src)}
                      disabled={isLocked}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                        isSelected
                          ? "border-rose-gold ring-2 ring-rose-gold/30"
                          : "border-transparent hover:border-rose-gold/40",
                        isLocked && "opacity-40 cursor-not-allowed"
                      )}
                      aria-pressed={isSelected}
                    >
                      <Image
                        src={src}
                        alt={`Foto de Fernanda e Pedro ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover"
                      />
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-gold text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
              {limitReached && (
                <p className="text-[11px] text-warm-gray/80 text-center mt-3">
                  Você já escolheu o máximo de fotos.
                </p>
              )}
            </div>

            <footer className="sticky bottom-0 bg-ivory border-t border-rose-gold/10 p-3 sm:p-4 flex items-center justify-between gap-3">
              <span className="text-xs text-warm-gray tabular-nums">
                {selected.length} / {remaining} selecionada
                {selected.length === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-warm-gray hover:text-charcoal px-3 py-2"
                >
                  Cancelar
                </button>
                <AnimatedButton
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  disabled={selected.length === 0}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Confirmar{" "}
                    {selected.length > 0 && `${selected.length} `}
                    {selected.length === 1 ? "foto" : "fotos"}
                  </span>
                </AnimatedButton>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
