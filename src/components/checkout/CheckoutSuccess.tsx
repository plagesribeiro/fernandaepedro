"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Heart } from "lucide-react";
import { ConfettiOverlay } from "@/components/effects/ConfettiOverlay";

export function CheckoutSuccess({
  paymentMethod,
}: {
  paymentMethod?: string;
}) {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <ConfettiOverlay active={confetti} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto bg-champagne rounded-2xl p-8 text-center border border-rose-gold/10 shadow-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 280, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-sage/20 mx-auto mb-4 flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-sage" />
        </motion.div>
        <h1 className="font-serif text-3xl text-charcoal mb-3 flex items-center justify-center gap-2">
          Recebemos!{" "}
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Heart className="w-7 h-7 text-rose-gold fill-rose-gold" />
          </motion.span>
        </h1>
        <p className="text-warm-gray leading-relaxed mb-2">
          Que carinho! Sua contribuição já tá registrada.
        </p>
        <p className="text-warm-gray text-sm mb-6">
          Mal podemos esperar pra te ver no dia 8 de agosto.
        </p>
        {paymentMethod && (
          <p className="text-xs text-warm-gray/70 mb-6">
            Pago via {paymentMethod}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/#presentes"
            className="inline-block bg-rose-gold text-white px-6 py-2.5 rounded-lg hover:bg-rose-gold-dark transition-colors text-sm"
          >
            Voltar pra lista
          </Link>
          <Link
            href="/"
            className="inline-block bg-white border border-rose-gold/30 text-charcoal px-6 py-2.5 rounded-lg hover:bg-rose-gold/5 transition-colors text-sm"
          >
            Página inicial
          </Link>
        </div>
      </motion.div>
    </>
  );
}
