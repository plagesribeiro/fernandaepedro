"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { HelpContact } from "./HelpContact";

export function RsvpSearchStep({
  initialQuery,
  loading,
  error,
  onSubmit,
}: {
  initialQuery: string;
  loading: boolean;
  error?: string;
  onSubmit: (query: string) => void;
}) {
  const [q, setQ] = useState(initialQuery);

  function handle(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length >= 2) onSubmit(trimmed);
  }

  return (
    <div className="bg-champagne backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rose-gold/10 shadow-sm">
      <form onSubmit={handle} className="space-y-5">
        <FormField
          id="rsvp-search"
          label="Seu nome ou nome do convite"
          placeholder="Ex: Maria Silva, ou Família Silva"
          value={q}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <AnimatedButton
          type="submit"
          disabled={loading || q.trim().length < 2}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Buscando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Buscar meu convite
            </span>
          )}
        </AnimatedButton>
      </form>
      <div className="mt-6 pt-4 border-t border-rose-gold/10 flex justify-center">
        <HelpContact />
      </div>
    </div>
  );
}
