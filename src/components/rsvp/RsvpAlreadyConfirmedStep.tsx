"use client";

import { ArrowLeft, Check, X, Minus, Edit } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { HelpContact } from "./HelpContact";

interface Guest {
  slotIndex: number;
  originalName: string | null;
  description: string;
  currentStatus: "Sim" | "Nao" | null;
  currentNameFilled: string | null;
  currentConfirmedAt: string | null;
  currentConfirmedBy: string | null;
}

interface FamilyData {
  groupName: string;
  guests: Guest[];
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function latestConfirmation(guests: Guest[]): {
  by: string | null;
  at: string | null;
} {
  let best: { by: string | null; at: string | null; atMs: number } = {
    by: null,
    at: null,
    atMs: 0,
  };
  for (const g of guests) {
    if (!g.currentConfirmedAt) continue;
    const ms = Date.parse(g.currentConfirmedAt);
    if (Number.isNaN(ms)) continue;
    if (ms > best.atMs) {
      best = { by: g.currentConfirmedBy, at: g.currentConfirmedAt, atMs: ms };
    }
  }
  return { by: best.by, at: best.at };
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return dateFormatter.format(new Date(ms));
}

export function RsvpAlreadyConfirmedStep({
  data,
  onUpdate,
  onBack,
}: {
  data: FamilyData;
  onUpdate: () => void;
  onBack: () => void;
}) {
  const { by, at } = latestConfirmation(data.guests);
  const formattedAt = formatDate(at);

  return (
    <div className="bg-champagne backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rose-gold/10 shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-warm-gray hover:text-rose-gold flex items-center gap-1 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-sage" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-xl text-charcoal truncate">
            {data.groupName}
          </h3>
          <p className="text-xs text-warm-gray">Este convite já foi respondido</p>
        </div>
      </div>

      {(by || formattedAt) && (
        <p className="text-sm text-warm-gray mb-5 mt-2">
          {by ? (
            <>
              Respondido por{" "}
              <span className="font-medium text-charcoal">{by}</span>
            </>
          ) : (
            "Respondido"
          )}
          {formattedAt ? ` · ${formattedAt}` : ""}
        </p>
      )}

      <ul className="space-y-2 mb-6">
        {data.guests.map((g) => {
          const displayName =
            g.originalName ?? g.currentNameFilled ?? "Acompanhante (+1)";
          const status = g.currentStatus;
          return (
            <li
              key={g.slotIndex}
              className="border border-rose-gold/10 rounded-lg p-3 bg-ivory/40 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-charcoal truncate">
                  {displayName}
                </div>
                {g.description && (
                  <div className="text-xs text-warm-gray truncate">
                    {g.description}
                  </div>
                )}
              </div>
              <StatusPill status={status} />
            </li>
          );
        })}
      </ul>

      <AnimatedButton
        onClick={onUpdate}
        variant="outline"
        size="md"
        className="w-full mb-4"
      >
        <span className="flex items-center justify-center gap-2">
          <Edit className="w-4 h-4" /> Atualizar resposta
        </span>
      </AnimatedButton>

      <div className="pt-4 border-t border-rose-gold/10 flex justify-center">
        <HelpContact />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "Sim" | "Nao" | null }) {
  if (status === "Sim") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-sage bg-sage/10 px-2 py-1 rounded-full flex-shrink-0">
        <Check className="w-3 h-3" /> Vai
      </span>
    );
  }
  if (status === "Nao") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warm-gray bg-warm-gray/10 px-2 py-1 rounded-full flex-shrink-0">
        <X className="w-3 h-3" /> Não vai
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-warm-gray/70 bg-warm-gray/5 px-2 py-1 rounded-full flex-shrink-0">
      <Minus className="w-3 h-3" /> Sem resposta
    </span>
  );
}
