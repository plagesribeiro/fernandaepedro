"use client";

import { CheckCircle2, Edit } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { HelpContact } from "./HelpContact";

export function RsvpSuccessStep({
  groupName,
  onEdit,
}: {
  groupName: string;
  summary: Array<{ slotIndex: number; originalName: string | null }>;
  onEdit: () => void;
}) {
  return (
    <div className="bg-champagne backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rose-gold/10 shadow-sm text-center">
      <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-sage" />
      </div>
      <h3 className="font-serif text-2xl text-charcoal mb-2">
        Confirmação salva!
      </h3>
      <p className="text-warm-gray mb-1">
        Convite:{" "}
        <span className="font-medium text-charcoal">{groupName}</span>
      </p>
      <p className="text-warm-gray text-sm mb-4">
        Mal podemos esperar pra celebrar com vocês. Se mudar algo, é só voltar
        aqui e procurar pelo seu nome de novo.
      </p>
      <p className="text-xs text-warm-gray/80 mb-6">
        Se não foi você quem confirmou, fale com a gente pelo WhatsApp.
      </p>
      <AnimatedButton
        onClick={onEdit}
        variant="outline"
        size="md"
        className="mb-4"
      >
        <span className="flex items-center gap-2">
          <Edit className="w-4 h-4" /> Editar minha resposta
        </span>
      </AnimatedButton>
      <div className="pt-4 border-t border-rose-gold/10">
        <HelpContact />
      </div>
    </div>
  );
}
