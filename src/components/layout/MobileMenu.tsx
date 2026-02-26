"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/lib/constants";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}

export function MobileMenu({ isOpen, onClose, activeSection }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-ivory shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-rose-gold/10">
              <span className="font-serif text-2xl text-rose-gold">
                F & P
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-rose-gold/10 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 text-warm-gray" />
              </button>
            </div>

            <nav className="flex-1 p-6">
              <ul className="space-y-1">
                {SECTIONS.map(({ id, label }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={onClose}
                      className={cn(
                        "block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                        activeSection === id
                          ? "bg-rose-gold/10 text-rose-gold"
                          : "text-charcoal hover:bg-rose-gold/5 hover:text-rose-gold"
                      )}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-6 border-t border-rose-gold/10 text-center">
              <Heart className="w-4 h-4 text-rose-gold mx-auto mb-2 fill-rose-gold" />
              <p className="text-sm text-warm-gray">
                08 de agosto de 2026
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
