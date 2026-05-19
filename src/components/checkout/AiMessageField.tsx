"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, X, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

type ApiItem =
  | { kind: "gift"; giftName: string; quantity: number }
  | { kind: "donation"; amount: number };

interface AiMessageFieldProps {
  value: string;
  onChange: (next: string) => void;
  items: ApiItem[];
  /** Nome do comprador (obrigatório pra gerar — backend valida). */
  name: string;
  email: string;
  phone: string;
  /** Verdadeiro se nome/email/telefone passam na validação básica. */
  formValid: boolean;
  /** Disparado quando o convidado tenta gerar sem ter completado os dados. */
  onPrereqMissing?: () => void;
  maxLength?: number;
  disabled?: boolean;
  onAiUsed?: () => void;
}

export function AiMessageField({
  value,
  onChange,
  items,
  name,
  email,
  phone,
  formValid,
  onPrereqMissing,
  maxLength = 500,
  disabled,
  onAiUsed,
}: AiMessageFieldProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleGenerate() {
    if (status === "streaming") return;
    if (!formValid) {
      onPrereqMissing?.();
      return;
    }
    setError(null);
    setStatus("streaming");
    const ac = new AbortController();
    abortRef.current = ac;
    // Limpa o textarea pra ver o stream do zero (não destrói nada porque o
    // usuário escolheu gerar com IA).
    onChange("");

    try {
      const res = await fetch("/api/ai/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hint: hint.trim() || undefined,
          items,
          reserverName: name.trim(),
          reserverEmail: email.trim(),
          reserverPhone: phone.trim(),
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        let msg = "Não consegui gerar agora.";
        try {
          const j = await res.json();
          if (j?.message) msg = j.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      if (!res.body) throw new Error("Resposta sem corpo.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let aborted = false;

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        acc += decoder.decode(chunk, { stream: true });
        const truncated = acc.slice(0, maxLength);
        onChange(truncated);
        if (acc.length >= maxLength) {
          aborted = true;
          await reader.cancel();
          break;
        }
      }
      if (!aborted) {
        acc += decoder.decode();
        onChange(acc.slice(0, maxLength));
      }
      setStatus("idle");
      setHasGenerated(true);
      onAiUsed?.();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Não consegui gerar agora.";
      setStatus("error");
      setError(msg);
    } finally {
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }

  const count = value.length;
  const counterClass =
    count >= maxLength - 20 ? "text-red-500" : "text-warm-gray/70";
  const streaming = status === "streaming";
  const triggerLabel = hasGenerated ? "Gerar de novo com IA" : "Gerar com IA";

  return (
    <div className="space-y-1">
      <label
        htmlFor="ck-message"
        className="block text-sm font-medium text-charcoal mb-1"
      >
        Mensagem para os noivos{" "}
        <span className="text-warm-gray font-normal">(opcional)</span>
      </label>
      <textarea
        id="ck-message"
        rows={3}
        placeholder="Deixe um carinho..."
        value={value}
        readOnly={streaming || disabled}
        aria-busy={streaming}
        aria-live="polite"
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        className={cn(
          "w-full px-4 py-3 rounded-lg border border-charcoal/10 bg-ivory text-charcoal",
          "focus:outline-none focus:ring-2 focus:ring-rose-gold/25 focus:border-rose-gold",
          "transition placeholder:text-warm-gray/60",
          streaming && "cursor-progress",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      />
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[11px] tabular-nums", counterClass)}>
          {count}/{maxLength}
        </span>
        {!hintOpen && (
          <button
            type="button"
            onClick={() => {
              if (!formValid) {
                onPrereqMissing?.();
                return;
              }
              setHintOpen(true);
            }}
            disabled={disabled || streaming}
            className="inline-flex items-center gap-1.5 text-xs text-rose-gold hover:text-rose-gold-dark font-medium transition-colors disabled:opacity-50 disabled:hover:text-rose-gold"
            aria-expanded={hintOpen}
            aria-controls="ai-hint-row"
          >
            <Sparkles className="w-3.5 h-3.5" /> {triggerLabel}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hintOpen && (
          <motion.div
            id="ai-hint-row"
            key="hint"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl bg-ivory/60 border border-rose-gold/15 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider text-warm-gray/80 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-rose-gold" /> Dica para a
                  IA (opcional)
                </span>
                <button
                  type="button"
                  onClick={() => setHintOpen(false)}
                  className="p-1 rounded-full hover:bg-rose-gold/10 text-warm-gray transition-colors"
                  aria-label="Fechar dica"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value.slice(0, 80))}
                placeholder='Ex: "tom poético", "mencionar a viagem que fizemos"'
                disabled={streaming}
                aria-label="Dica opcional para a IA"
                className="w-full px-3 py-2 rounded-lg border border-charcoal/10 bg-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-gold/25 focus:border-rose-gold placeholder:text-warm-gray/60 disabled:opacity-60"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] text-warm-gray/60 tabular-nums">
                  {hint.length}/80
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  {streaming ? (
                    <>
                      <button
                        type="button"
                        onClick={handleStop}
                        className="text-xs text-warm-gray hover:text-charcoal underline-offset-2 hover:underline transition-colors"
                      >
                        Parar
                      </button>
                      <AnimatedButton type="button" size="sm" disabled>
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                          Gerando...
                        </span>
                      </AnimatedButton>
                    </>
                  ) : (
                    <AnimatedButton
                      type="button"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={disabled || items.length === 0 || !formValid}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />{" "}
                        {hasGenerated ? "Gerar de novo" : "Gerar"}
                      </span>
                    </AnimatedButton>
                  )}
                </div>
              </div>
              {error && status === "error" && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
