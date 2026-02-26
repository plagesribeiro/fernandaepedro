"use client";

import { Heart } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory px-4 text-center">
      <Heart className="w-16 h-16 text-rose-gold/30 fill-rose-gold/30 mb-6" />
      <h1 className="font-serif text-4xl text-charcoal mb-3">
        Ops! Algo deu errado
      </h1>
      <p className="text-warm-gray mb-8 max-w-md">
        Não se preocupe, o casamento continua de pé! Tente novamente.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-rose-gold text-white rounded-full font-medium hover:bg-rose-gold-dark transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
