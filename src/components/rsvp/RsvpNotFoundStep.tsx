"use client";

import { SearchX } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { HelpContact } from "./HelpContact";

export function RsvpNotFoundStep({
  query,
  onRetry,
}: {
  query: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-champagne backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rose-gold/10 shadow-sm text-center">
      <div className="w-16 h-16 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-8 h-8 text-rose-gold" />
      </div>
      <h3 className="font-serif text-2xl text-charcoal mb-2">
        Não encontramos seu nome
      </h3>
      <p className="text-warm-gray mb-1">
        Procuramos por{" "}
        <span className="font-medium text-charcoal">&ldquo;{query}&rdquo;</span>{" "}
        e não veio nada.
      </p>
      <p className="text-warm-gray mb-6 text-sm">
        Tente outro sobrenome, ou o nome do convite (ex: &ldquo;Família
        Silva&rdquo;).
      </p>
      <AnimatedButton
        onClick={onRetry}
        variant="primary"
        size="md"
        className="mb-6"
      >
        Tentar de novo
      </AnimatedButton>
      <div className="pt-4 border-t border-rose-gold/10">
        <HelpContact />
      </div>
    </div>
  );
}
