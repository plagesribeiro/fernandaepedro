"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  AlertCircle,
  Check,
  Download,
  ImageIcon,
  Loader2,
  Paperclip,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import {
  downscaleImage,
  HeicConversionError,
  ImageTooBigError,
} from "@/lib/image-downscale";
import {
  clearPersistedAiImage,
  loadPersistedAiImage,
  MAX_GENERATIONS_PER_CHECKOUT,
  savePersistedAiImage,
} from "@/lib/ai-checkout-storage";
import { AiGalleryPicker } from "./AiGalleryPicker";

interface AiGiftImageBoxProps {
  onImageReady: (generatedUrl: string | null) => void;
  onBusyChange: (busy: boolean) => void;
  onAiUsed: () => void;
  galleryImages: readonly string[];
  /** Dados do comprador — obrigatórios no backend. */
  name: string;
  email: string;
  phone: string;
  /** Verdadeiro se nome/email/telefone passam na validação básica. */
  formValid: boolean;
  disabled?: boolean;
}

type Attachment = {
  id: string;
  source: "device" | "gallery" | "paste" | "drop";
  apiKind: "dataUrl" | "galleryUrl";
  apiValue: string;
  previewUrl: string;
  fileName?: string;
};

type Status = "idle" | "generating" | "ready" | "error";
const MAX_ATTACHMENTS = 4;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AiGiftImageBox({
  onImageReady,
  onBusyChange,
  onAiUsed,
  galleryImages,
  name,
  email,
  phone,
  formValid,
  disabled,
}: AiGiftImageBoxProps) {
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [included, setIncluded] = useState<boolean>(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragDepth, setDragDepth] = useState(0);
  // Confirmação inline: aparece quando o convidado clica Gerar sem nenhum anexo.
  // Lembra dele que pode usar fotos do álbum, mas deixa seguir mesmo assim.
  const [pendingNoRefsConfirm, setPendingNoRefsConfirm] = useState(false);
  // Cap por checkout (custo). Hidratado do localStorage, incrementado após cada geração com sucesso.
  const [generationCount, setGenerationCount] = useState(0);
  const hydratedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Controla animação "shake" na caixa quando o convidado clica Gerar sem ter
  // escrito nada nem anexado nada — feedback visual claro do que está faltando.
  const boxShake = useAnimation();
  const [contentMissingFlash, setContentMissingFlash] = useState(false);

  // Hidrata a partir do localStorage uma vez.
  useEffect(() => {
    const saved = loadPersistedAiImage();
    if (saved) {
      if (saved.generatedUrl) setGeneratedUrl(saved.generatedUrl);
      setIncluded(saved.included);
      if (saved.prompt) setPrompt(saved.prompt);
      if (saved.generatedUrl) setStatus("ready");
      setGenerationCount(saved.generationCount);
    }
    hydratedRef.current = true;
  }, []);

  // Persistência após hidratação.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!generatedUrl && !prompt && generationCount === 0) {
      clearPersistedAiImage();
      return;
    }
    savePersistedAiImage({ generatedUrl, included, prompt, generationCount });
  }, [generatedUrl, included, prompt, generationCount]);

  // Notifica parent quando "imagem que vamos enviar" muda.
  useEffect(() => {
    onImageReady(included ? generatedUrl : null);
  }, [generatedUrl, included, onImageReady]);

  // Notifica parent sobre estado de "ocupado".
  useEffect(() => {
    onBusyChange(status === "generating");
  }, [status, onBusyChange]);

  // Aborta em unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Se o convidado adicionar qualquer anexo enquanto a confirmação está aberta,
  // fecha automaticamente — o lembrete deixou de fazer sentido.
  useEffect(() => {
    if (pendingNoRefsConfirm && attachments.length > 0) {
      setPendingNoRefsConfirm(false);
    }
  }, [attachments.length, pendingNoRefsConfirm]);

  const showWarning = useCallback((msg: string) => {
    setWarning(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setWarning(null), 4000);
  }, []);

  // Calcula quais campos do comprador faltam — lista específica pro banner de erro.
  const missingBuyerFields = useMemo<string[]>(() => {
    const missing: string[] = [];
    if (name.trim().length < 2) missing.push("Seu nome completo");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      missing.push("Email válido");
    if (phone.replace(/\D/g, "").length < 10)
      missing.push("Telefone com DDD");
    return missing;
  }, [name, email, phone]);

  // Erro mais granular pra "o que falta no conteúdo da imagem"
  const contentEmpty = !prompt.trim() && attachments.length === 0;

  const handleFilesPicked = useCallback(
    async (files: File[]) => {
      const remaining = MAX_ATTACHMENTS - attachments.length;
      if (remaining <= 0) {
        showWarning(`Máximo de ${MAX_ATTACHMENTS} imagens.`);
        return;
      }
      const picked = files.filter((f) => {
        if (f.type.startsWith("image/")) return true;
        const lower = f.name.toLowerCase();
        return lower.endsWith(".heic") || lower.endsWith(".heif");
      });
      const accepted: Attachment[] = [];
      for (const file of picked.slice(0, remaining)) {
        try {
          const dataUrl = await downscaleImage(file, {
            maxSide: 1024,
            quality: 0.85,
          });
          accepted.push({
            id: newId(),
            source: "device",
            apiKind: "dataUrl",
            apiValue: dataUrl,
            previewUrl: dataUrl,
            fileName: file.name,
          });
        } catch (err) {
          if (err instanceof HeicConversionError) {
            showWarning(err.message);
          } else if (err instanceof ImageTooBigError) {
            showWarning(err.message);
          } else {
            console.error("[AiGiftImageBox] downscale failed:", err);
            showWarning("Não consegui ler essa imagem.");
          }
        }
      }
      if (accepted.length > 0) {
        setAttachments((cur) => [...cur, ...accepted]);
      }
      if (picked.length > remaining) {
        showWarning(`Máximo de ${MAX_ATTACHMENTS} imagens.`);
      }
    },
    [attachments.length, showWarning]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const fileItems = items.filter((it) => it.kind === "file");
      const imageFiles = fileItems
        .map((it) => it.getAsFile())
        .filter((f): f is File =>
          !!f && (f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
        );
      if (imageFiles.length === 0) return;
      e.preventDefault();
      void handleFilesPicked(imageFiles);
    },
    [handleFilesPicked]
  );

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setDragDepth((d) => d + 1);
  }
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setDragDepth((d) => Math.max(0, d - 1));
  }
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setDragDepth(0);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    void handleFilesPicked(files);
  }

  function handleRemoveAttachment(id: string) {
    setAttachments((cur) => cur.filter((a) => a.id !== id));
  }

  function handleGallerySelect(urls: string[]) {
    const remaining = MAX_ATTACHMENTS - attachments.length;
    const slice = urls.slice(0, remaining);
    setAttachments((cur) => [
      ...cur,
      ...slice.map((url) => ({
        id: newId(),
        source: "gallery" as const,
        apiKind: "galleryUrl" as const,
        apiValue: url,
        previewUrl: url,
      })),
    ]);
    setGalleryOpen(false);
  }

  async function handleGenerate(skipNoRefsConfirm = false) {
    if (status === "generating") return;
    if (missingBuyerFields.length > 0 || !formValid) {
      // Defesa: o step "ai" só renderiza quando o buyer está válido, então
      // chegar aqui é caso de borda. Apenas aborta silenciosamente.
      showWarning(
        "Volte ao passo anterior e complete seus dados antes de gerar."
      );
      return;
    }
    if (generationCount >= MAX_GENERATIONS_PER_CHECKOUT) {
      showWarning(
        `Você já gerou ${MAX_GENERATIONS_PER_CHECKOUT} imagens neste pedido — o limite por compra. Conclua o pagamento ou use a última imagem gerada.`
      );
      return;
    }
    if (contentEmpty) {
      showWarning(
        "Escreva uma descrição da imagem no campo acima ou anexe pelo menos uma foto do álbum."
      );
      // Reforço visual: foca a textarea, sacode a caixa e pisca borda vermelha
      textareaRef.current?.focus();
      void boxShake.start({
        x: [0, -6, 6, -4, 4, -2, 0],
        transition: { duration: 0.4 },
      });
      setContentMissingFlash(true);
      window.setTimeout(() => setContentMissingFlash(false), 1800);
      return;
    }
    // Se o convidado vai gerar sem nenhuma referência, mostra um lembrete
    // sugerindo usar fotos do álbum. Não bloqueia — só lembra uma vez por clique.
    if (!skipNoRefsConfirm && attachments.length === 0) {
      setPendingNoRefsConfirm(true);
      return;
    }
    setPendingNoRefsConfirm(false);
    setError(null);
    setStatus("generating");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim() || undefined,
          attachments: attachments.map((a) => ({
            kind: a.apiKind,
            value: a.apiValue,
          })),
          reserverName: name.trim(),
          reserverEmail: email.trim(),
          reserverPhone: phone.trim(),
        }),
        signal: ac.signal,
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.imageUrl) {
        throw new Error(data?.message ?? "Não consegui gerar agora.");
      }
      setGeneratedUrl(data.data.imageUrl as string);
      setIncluded(true);
      setStatus("ready");
      setGenerationCount((c) => c + 1);
      onAiUsed();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus(generatedUrl ? "ready" : "idle");
        return;
      }
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Não consegui gerar agora."
      );
    } finally {
      abortRef.current = null;
    }
  }

  // O botão NÃO fica disabled quando falta conteúdo — queremos que o clique
  // dispare o feedback (shake + foco) em vez de não fazer nada.
  const generateDisabled =
    disabled || status === "generating" || !formValid;

  const containerBorder = cn(
    "rounded-2xl bg-ivory border transition-colors p-4 space-y-3",
    dragDepth > 0
      ? "border-rose-gold border-dashed bg-rose-gold/5"
      : contentMissingFlash
        ? "border-red-400 ring-2 ring-red-300/40 bg-red-50/30"
        : "border-rose-gold/20 hover:border-rose-gold/40 focus-within:border-rose-gold focus-within:ring-2 focus-within:ring-rose-gold/15"
  );

  return (
    <section className="space-y-2">
      <header className="space-y-0.5">
        <h3 className="font-serif text-base text-charcoal flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-gold" />
          Adicione uma imagem para os noivos{" "}
          <span className="text-warm-gray font-normal text-sm">(opcional)</span>
        </h3>
        <p className="text-xs text-warm-gray/80">
          Use suas fotos, escolha do nosso álbum, ou descreva — a IA cria uma
          arte que pode virar decoração da festa.
        </p>
      </header>

      <motion.div
        animate={boxShake}
        className={containerBorder}
        onPaste={handlePaste}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-rose-gold/15"
              >
                <Image
                  src={a.previewUrl}
                  alt={a.fileName ?? "Anexo"}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={a.apiKind === "dataUrl"}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(a.id)}
                  disabled={disabled || status === "generating"}
                  className="absolute top-1 right-1 w-7 h-7 sm:w-5 sm:h-5 rounded-full bg-charcoal/70 hover:bg-charcoal text-white text-[10px] flex items-center justify-center disabled:opacity-50"
                  aria-label="Remover anexo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={3}
          placeholder="Descreva uma imagem para os noivos... (opcional — pode também só anexar fotos)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
          disabled={disabled || status === "generating"}
          className="w-full bg-transparent text-charcoal placeholder:text-warm-gray/60 focus:outline-none resize-none min-h-[72px] disabled:opacity-60"
        />

        <div className="border-t border-rose-gold/10 -mx-4" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) void handleFilesPicked(files);
            e.target.value = "";
          }}
        />

        <AnimatePresence mode="wait" initial={false}>
          {pendingNoRefsConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl bg-rose-gold/[0.06] border border-rose-gold/30 p-3 space-y-3"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-rose-gold flex-shrink-0 mt-0.5" />
                <p className="text-sm text-charcoal leading-relaxed">
                  <span className="font-medium">
                    Sem fotos de referência?
                  </span>{" "}
                  Adicione imagens do álbum dos noivos pra IA criar algo
                  realmente personalizado pra eles. Tem certeza que quer gerar
                  assim mesmo?
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setPendingNoRefsConfirm(false)}
                  className="text-xs text-warm-gray hover:text-charcoal px-2 py-1.5 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingNoRefsConfirm(false);
                    setGalleryOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-gold-dark bg-rose-gold/10 hover:bg-rose-gold/20 border border-rose-gold/40 rounded-full px-3 py-1.5 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Escolher do álbum
                </button>
                <AnimatedButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleGenerate(true)}
                >
                  Gerar assim mesmo
                </AnimatedButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {formValid && attachments.length === 0 && !generatedUrl && (
                <p className="text-[11px] text-warm-gray/90 flex items-start gap-1.5 leading-relaxed">
                  <Sparkles className="w-3 h-3 text-rose-gold/80 mt-0.5 flex-shrink-0" />
                  <span>
                    Use fotos do álbum dos noivos pra IA criar algo realmente
                    personalizado.
                  </span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {/* Primary CTA: álbum dos noivos — pill destacada */}
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  disabled={
                    disabled ||
                    status === "generating" ||
                    attachments.length >= MAX_ATTACHMENTS
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium",
                    "text-rose-gold-dark bg-rose-gold/10 hover:bg-rose-gold/20 active:bg-rose-gold/25",
                    "border border-rose-gold/40 hover:border-rose-gold/60",
                    "rounded-full px-3.5 py-2 transition-colors shadow-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-gold/10"
                  )}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">
                    Galeria F&amp;P
                  </span>
                  <span className="xs:hidden sm:hidden">Do álbum F&amp;P</span>
                  {attachments.length > 0 && (
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        attachments.length >= MAX_ATTACHMENTS
                          ? "text-red-500"
                          : "text-rose-gold-dark/70"
                      )}
                    >
                      · {attachments.length}/{MAX_ATTACHMENTS}
                    </span>
                  )}
                </button>

                {/* Secundário: foto do dispositivo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    disabled ||
                    status === "generating" ||
                    attachments.length >= MAX_ATTACHMENTS
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-warm-gray hover:text-rose-gold transition-colors px-2 py-2 rounded-md hover:bg-rose-gold/5 disabled:opacity-50 disabled:hover:text-warm-gray"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Suas fotos
                </button>

                <div className="ml-auto flex items-center gap-2">
                  {generationCount > 0 && (
                    <span
                      className={cn(
                        "text-[11px] tabular-nums",
                        generationCount >= MAX_GENERATIONS_PER_CHECKOUT
                          ? "text-red-500 font-medium"
                          : "text-warm-gray/70"
                      )}
                      title={`Você usou ${generationCount} de ${MAX_GENERATIONS_PER_CHECKOUT} gerações deste pedido`}
                    >
                      {generationCount}/{MAX_GENERATIONS_PER_CHECKOUT}
                    </span>
                  )}
                  {status === "generating" ? (
                    <AnimatedButton type="button" size="sm" disabled>
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                        Gerando...
                      </span>
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton
                      type="button"
                      size="sm"
                      onClick={() => void handleGenerate()}
                      disabled={
                        generateDisabled ||
                        generationCount >= MAX_GENERATIONS_PER_CHECKOUT
                      }
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />{" "}
                        {generatedUrl ? "Gerar de novo" : "Gerar imagem"}
                      </span>
                    </AnimatedButton>
                  )}
                </div>
              </div>

              {generationCount >= MAX_GENERATIONS_PER_CHECKOUT && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  Limite de {MAX_GENERATIONS_PER_CHECKOUT} imagens por pedido
                  atingido. Conclua o pagamento ou use a última gerada.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {warning && (
          <div
            className="rounded-lg bg-red-50 border border-red-300 p-2.5 flex items-start gap-2"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">{warning}</p>
          </div>
        )}
        {dragDepth > 0 && (
          <p className="text-[11px] text-rose-gold text-center">
            Solte aqui pra anexar
          </p>
        )}
      </motion.div>

      <AnimatePresence>
        {status === "generating" && !generatedUrl && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            <div className="relative aspect-square w-full max-w-[400px] mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-blush/40 via-champagne to-blush/30 animate-pulse flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-rose-gold animate-spin" />
            </div>
            <p className="text-xs text-warm-gray/80 text-center">
              Pode levar até 30 segundos...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {generatedUrl && status !== "generating" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <div className="relative aspect-square w-full max-w-[400px] mx-auto rounded-xl overflow-hidden border border-rose-gold/15 shadow-sm">
              <Image
                src={generatedUrl}
                alt="Imagem de presente gerada pela IA"
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-center">
              {included ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-sage">
                  <Check className="w-3.5 h-3.5" /> Vamos incluir essa imagem
                  com o presente
                </span>
              ) : (
                <span className="text-xs text-warm-gray/70">
                  Essa imagem não vai com o pedido
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={
                  disabled ||
                  generateDisabled ||
                  generationCount >= MAX_GENERATIONS_PER_CHECKOUT
                }
                className="inline-flex items-center gap-1 text-xs text-rose-gold hover:text-rose-gold-dark hover:underline transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Gerar de novo
              </button>
              <a
                href={generatedUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-rose-gold hover:text-rose-gold-dark hover:underline transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Baixar
              </a>
              <button
                type="button"
                onClick={() => setIncluded((v) => !v)}
                className="ml-auto text-xs text-warm-gray hover:text-charcoal underline-offset-2 hover:underline transition-colors"
              >
                {included ? "Não incluir" : "Incluir"}
              </button>
            </div>
            {status === "error" && error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
          </motion.div>
        )}
        {!generatedUrl && status === "error" && error && (
          <p key="err" className="text-xs text-red-500 text-center">
            {error}
          </p>
        )}
      </AnimatePresence>

      <AiGalleryPicker
        open={galleryOpen}
        images={galleryImages}
        remaining={Math.max(0, MAX_ATTACHMENTS - attachments.length)}
        onClose={() => setGalleryOpen(false)}
        onConfirm={handleGallerySelect}
      />
    </section>
  );
}
