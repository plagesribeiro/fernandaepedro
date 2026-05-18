"use client";

import { useState, useMemo, type FormEvent, type ChangeEvent } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { FormField } from "@/components/ui/FormField";
import { HelpContact } from "./HelpContact";

interface Guest {
  slotIndex: number;
  originalName: string | null;
  description: string;
  currentStatus: "Sim" | "Nao" | null;
  currentNameFilled: string | null;
}

interface FamilyData {
  groupName: string;
  guests: Guest[];
}

interface RowState {
  status: "Sim" | "Nao";
  nameFilled: string;
}

export interface FamilySubmitPayload {
  inviteGroupName: string;
  confirmedBy: string;
  responses: Array<{
    guestSlotIndex: number;
    status: "Sim" | "Nao";
    nameFilled?: string;
  }>;
}

export function RsvpFamilyStep({
  data,
  submitting,
  error,
  initialConfirmedBy,
  onSubmit,
  onBack,
}: {
  data: FamilyData;
  submitting: boolean;
  error?: string;
  initialConfirmedBy: string;
  onSubmit: (payload: FamilySubmitPayload) => void;
  onBack: () => void;
}) {
  const [confirmedBy, setConfirmedBy] = useState(initialConfirmedBy);
  const initial = useMemo<Record<number, RowState>>(() => {
    const out: Record<number, RowState> = {};
    for (const g of data.guests) {
      out[g.slotIndex] = {
        status: g.currentStatus ?? "Sim",
        nameFilled: g.currentNameFilled ?? "",
      };
    }
    return out;
  }, [data.guests]);

  const [rows, setRows] = useState<Record<number, RowState>>(initial);
  const [localError, setLocalError] = useState<string | undefined>();

  function setRow(slot: number, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [slot]: { ...r[slot], ...patch } }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(undefined);
    if (confirmedBy.trim().length < 2) {
      setLocalError("Informe quem está confirmando.");
      return;
    }
    for (const g of data.guests) {
      const r = rows[g.slotIndex];
      if (
        g.originalName === null &&
        r.status === "Sim" &&
        r.nameFilled.trim().length < 2
      ) {
        setLocalError(
          `Informe o nome do acompanhante (${g.description}) ou marque como "Não vai".`
        );
        return;
      }
    }
    onSubmit({
      inviteGroupName: data.groupName,
      confirmedBy: confirmedBy.trim(),
      responses: data.guests.map((g) => {
        const r = rows[g.slotIndex];
        const filled = r.nameFilled.trim();
        return {
          guestSlotIndex: g.slotIndex,
          status: r.status,
          nameFilled: filled.length > 0 ? filled : undefined,
        };
      }),
    });
  }

  return (
    <div className="bg-champagne backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rose-gold/10 shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-warm-gray hover:text-rose-gold flex items-center gap-1 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h3 className="font-serif text-2xl text-charcoal mb-1">
        {data.groupName}
      </h3>
      <p className="text-sm text-warm-gray mb-6">
        Quem desse convite vai estar com a gente no dia 8 de agosto?
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {data.guests.map((g) => {
          const r = rows[g.slotIndex];
          const isOpenSlot = g.originalName === null;
          return (
            <div
              key={g.slotIndex}
              className="border border-rose-gold/10 rounded-xl p-4 bg-ivory/40 space-y-3"
            >
              <div>
                <div className="font-medium text-charcoal">
                  {g.originalName ?? "Acompanhante (+1)"}
                </div>
                <div className="text-xs text-warm-gray">{g.description}</div>
              </div>

              {isOpenSlot && (
                <div>
                  <label
                    htmlFor={`name-${g.slotIndex}`}
                    className="block text-xs font-medium text-charcoal mb-1"
                  >
                    Nome do acompanhante
                  </label>
                  <input
                    id={`name-${g.slotIndex}`}
                    type="text"
                    placeholder="Nome e sobrenome"
                    value={r.nameFilled}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setRow(g.slotIndex, { nameFilled: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-charcoal/10 bg-ivory text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/25 focus:border-rose-gold transition"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRow(g.slotIndex, { status: "Sim" })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    r.status === "Sim"
                      ? "bg-sage text-white shadow-sm"
                      : "bg-white text-warm-gray border border-rose-gold/15 hover:border-sage hover:text-sage"
                  }`}
                >
                  Vai
                </button>
                <button
                  type="button"
                  onClick={() => setRow(g.slotIndex, { status: "Nao" })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    r.status === "Nao"
                      ? "bg-warm-gray text-white shadow-sm"
                      : "bg-white text-warm-gray border border-rose-gold/15 hover:border-warm-gray"
                  }`}
                >
                  Não vai
                </button>
              </div>
            </div>
          );
        })}

        <FormField
          id="rsvp-confirmed-by"
          label="Seu nome (quem está confirmando)"
          placeholder="Seu nome"
          value={confirmedBy}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setConfirmedBy(e.target.value)
          }
        />

        {(localError || error) && (
          <p className="text-sm text-red-500 text-center">
            {localError ?? error}
          </p>
        )}

        <AnimatedButton
          type="submit"
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Salvando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Send className="w-5 h-5" /> Confirmar
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
