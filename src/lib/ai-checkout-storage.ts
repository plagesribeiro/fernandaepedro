export const AI_IMAGE_STORAGE_KEY = "fp-checkout-ai-image-v1";
export const AI_TIP_STORAGE_KEY = "fp-checkout-ai-tip-v1";

export interface PersistedAiImage {
  generatedUrl: string | null;
  included: boolean;
  prompt: string;
  /** Total de gerações neste checkout. Cap de 5 (controle de custo). */
  generationCount: number;
}

export const MAX_GENERATIONS_PER_CHECKOUT = 5;

export interface PersistedTipState {
  added: boolean;
  dismissed: boolean;
  addedAmount?: number;
}

function safeLoad<T>(key: string, isValid: (v: unknown) => v is T): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeSave(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function isPersistedAiImage(v: unknown): v is PersistedAiImage {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  // generationCount foi adicionado depois — aceita ausente pra compatibilidade
  // com sessões que ficaram salvas antes da mudança.
  const hasValidCount =
    o.generationCount === undefined ||
    (typeof o.generationCount === "number" && o.generationCount >= 0);
  return (
    (o.generatedUrl === null || typeof o.generatedUrl === "string") &&
    typeof o.included === "boolean" &&
    typeof o.prompt === "string" &&
    hasValidCount
  );
}

function isPersistedTipState(v: unknown): v is PersistedTipState {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.added === "boolean" && typeof o.dismissed === "boolean";
}

export function loadPersistedAiImage(): PersistedAiImage | null {
  const raw = safeLoad(AI_IMAGE_STORAGE_KEY, isPersistedAiImage);
  if (!raw) return null;
  return {
    ...raw,
    generationCount: raw.generationCount ?? 0,
  };
}

export function savePersistedAiImage(state: PersistedAiImage): void {
  safeSave(AI_IMAGE_STORAGE_KEY, state);
}

export function clearPersistedAiImage(): void {
  safeRemove(AI_IMAGE_STORAGE_KEY);
}

export function loadTipState(): PersistedTipState {
  return (
    safeLoad(AI_TIP_STORAGE_KEY, isPersistedTipState) ?? {
      added: false,
      dismissed: false,
    }
  );
}

export function saveTipState(state: PersistedTipState): void {
  safeSave(AI_TIP_STORAGE_KEY, state);
}

export function clearTipState(): void {
  safeRemove(AI_TIP_STORAGE_KEY);
}
