"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ConfettiOverlay } from "@/components/effects/ConfettiOverlay";
import { RsvpSearchStep } from "./RsvpSearchStep";
import { RsvpNotFoundStep } from "./RsvpNotFoundStep";
import { RsvpDisambiguationStep } from "./RsvpDisambiguationStep";
import { RsvpFamilyStep, type FamilySubmitPayload } from "./RsvpFamilyStep";
import { RsvpAlreadyConfirmedStep } from "./RsvpAlreadyConfirmedStep";
import { RsvpSuccessStep } from "./RsvpSuccessStep";

interface SearchMatch {
  groupName: string;
  matchedText: string;
  matchedField: "groupName" | "guestName";
  preview: { guestCount: number; firstDescription: string };
}

interface FamilyGuest {
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
  guests: FamilyGuest[];
}

interface SubmitSummary {
  slotIndex: number;
  originalName: string | null;
}

type State =
  | { step: "search"; query: string; loading: boolean; error?: string }
  | { step: "notFound"; query: string }
  | {
      step: "disambiguation";
      query: string;
      matches: SearchMatch[];
    }
  | { step: "loadingFamily"; query: string; groupName: string }
  | { step: "alreadyConfirmed"; query: string; data: FamilyData }
  | {
      step: "family";
      query: string;
      data: FamilyData;
      submitting: boolean;
      error?: string;
    }
  | {
      step: "success";
      groupName: string;
      summary: SubmitSummary[];
    };

const initialState: State = { step: "search", query: "", loading: false };

export function RsvpWizard() {
  const [state, setState] = useState<State>(initialState);
  const [showConfetti, setShowConfetti] = useState(false);

  const loadInvite = useCallback(async (groupName: string, query: string) => {
    setState({ step: "loadingFamily", query, groupName });
    try {
      const res = await fetch(
        `/api/rsvp/invite?group=${encodeURIComponent(groupName)}`
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setState({
          step: "search",
          query,
          loading: false,
          error: j.error ?? "Convite não encontrado.",
        });
        return;
      }
      const data = (await res.json()) as FamilyData;
      const alreadyAnswered = data.guests.some(
        (g) => g.currentStatus !== null
      );
      setState(
        alreadyAnswered
          ? { step: "alreadyConfirmed", query, data }
          : { step: "family", query, data, submitting: false }
      );
    } catch {
      setState({
        step: "search",
        query,
        loading: false,
        error: "Sem conexão. Tente de novo.",
      });
    }
  }, []);

  const search = useCallback(
    async (query: string) => {
      setState({ step: "search", query, loading: true });
      try {
        const res = await fetch(
          `/api/rsvp/search?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setState({
            step: "search",
            query,
            loading: false,
            error: j.error ?? "Erro na busca.",
          });
          return;
        }
        const j = (await res.json()) as { matches: SearchMatch[] };
        if (j.matches.length === 0) {
          setState({ step: "notFound", query });
        } else if (j.matches.length === 1) {
          await loadInvite(j.matches[0].groupName, query);
        } else {
          setState({ step: "disambiguation", query, matches: j.matches });
        }
      } catch {
        setState({
          step: "search",
          query,
          loading: false,
          error: "Sem conexão. Tente de novo.",
        });
      }
    },
    [loadInvite]
  );

  const submit = useCallback(async (payload: FamilySubmitPayload) => {
    setState((prev) =>
      prev.step === "family"
        ? { ...prev, submitting: true, error: undefined }
        : prev
    );
    try {
      const res = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        setState((prev) =>
          prev.step === "family"
            ? {
                ...prev,
                submitting: false,
                error: j.error ?? "Erro ao salvar.",
              }
            : prev
        );
        return;
      }
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      setState({
        step: "success",
        groupName: payload.inviteGroupName,
        summary: (j.summary ?? []) as SubmitSummary[],
      });
    } catch {
      setState((prev) =>
        prev.step === "family"
          ? {
              ...prev,
              submitting: false,
              error: "Sem conexão. Tente de novo.",
            }
          : prev
      );
    }
  }, []);

  const backToSearch = useCallback(
    (clearQuery = false) =>
      setState({
        step: "search",
        query: clearQuery ? "" : "query" in state ? state.query : "",
        loading: false,
      }),
    [state]
  );

  return (
    <div className="rsvp-form">
      <ConfettiOverlay active={showConfetti} />

      {state.step === "search" && (
        <RsvpSearchStep
          initialQuery={state.query}
          loading={state.loading}
          error={state.error}
          onSubmit={search}
        />
      )}

      {state.step === "notFound" && (
        <RsvpNotFoundStep
          query={state.query}
          onRetry={() => backToSearch(true)}
        />
      )}

      {state.step === "disambiguation" && (
        <RsvpDisambiguationStep
          matches={state.matches}
          onPick={(groupName) => loadInvite(groupName, state.query)}
          onBack={() => backToSearch()}
        />
      )}

      {state.step === "loadingFamily" && (
        <div className="bg-champagne rounded-2xl p-8 border border-rose-gold/10 shadow-sm text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-gold mb-2" />
          <p className="text-warm-gray text-sm">Carregando seu convite...</p>
        </div>
      )}

      {state.step === "alreadyConfirmed" && (
        <RsvpAlreadyConfirmedStep
          data={state.data}
          onUpdate={() =>
            setState({
              step: "family",
              query: state.query,
              data: state.data,
              submitting: false,
            })
          }
          onBack={() => backToSearch()}
        />
      )}

      {state.step === "family" && (
        <RsvpFamilyStep
          key={state.data.groupName}
          data={state.data}
          submitting={state.submitting}
          error={state.error}
          initialConfirmedBy={state.query}
          onSubmit={submit}
          onBack={() => backToSearch()}
        />
      )}

      {state.step === "success" && (
        <RsvpSuccessStep
          groupName={state.groupName}
          summary={state.summary}
          onEdit={() => backToSearch(true)}
        />
      )}
    </div>
  );
}
