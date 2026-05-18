"use client";

import { ChevronRight, ArrowLeft } from "lucide-react";
import { HelpContact } from "./HelpContact";

interface Match {
  groupName: string;
  matchedText: string;
  matchedField: "groupName" | "guestName";
  preview: { guestCount: number; firstDescription: string };
}

export function RsvpDisambiguationStep({
  matches,
  onPick,
  onBack,
}: {
  matches: Match[];
  onPick: (groupName: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="bg-champagne backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rose-gold/10 shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-warm-gray hover:text-rose-gold flex items-center gap-1 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h3 className="font-serif text-xl text-charcoal mb-1">
        Encontramos mais de um convite
      </h3>
      <p className="text-sm text-warm-gray mb-4">Escolha o seu:</p>
      <ul className="space-y-2">
        {matches.map((m) => (
          <li key={m.groupName}>
            <button
              type="button"
              onClick={() => onPick(m.groupName)}
              className="w-full text-left px-4 py-3 rounded-lg border border-rose-gold/15 hover:border-rose-gold hover:bg-ivory/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-charcoal truncate">
                  {m.groupName}
                </div>
                <div className="text-xs text-warm-gray truncate">
                  {m.preview.guestCount} convidado
                  {m.preview.guestCount === 1 ? "" : "s"}
                  {m.preview.firstDescription
                    ? ` · ${m.preview.firstDescription}`
                    : ""}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-gold flex-shrink-0" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 pt-4 border-t border-rose-gold/10 flex justify-center">
        <HelpContact />
      </div>
    </div>
  );
}
