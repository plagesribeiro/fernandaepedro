"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  images: readonly string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
        >
          <X className="w-8 h-8" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-w-4xl max-h-[80vh] mx-16 rounded-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentIndex]}
            alt={`Foto ${currentIndex + 1} de ${images.length}`}
            className="max-w-full max-h-[80vh] object-contain"
          />
        </motion.div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        <div className="absolute bottom-4 text-white/50 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
