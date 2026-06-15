import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Taxa de serviço aplicada sobre o valor do presente no checkout.
 * Mantida aqui pra que front e back-end calculem o mesmo número.
 */
export const CHECKOUT_FEE_RATE = 0.035;

/** Taxa de 3,5% sobre o subtotal, arredondada pra centavos. */
export function computeServiceFee(subtotal: number): number {
  return Math.round(subtotal * CHECKOUT_FEE_RATE * 100) / 100;
}

/** Subtotal + taxa de serviço, arredondado pra centavos. */
export function computeTotalWithFee(subtotal: number): number {
  return Math.round((subtotal + computeServiceFee(subtotal)) * 100) / 100;
}

export function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Returns true only for image URLs we can actually render. */
export function isUsableImage(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.endsWith("placeholder.webp")) return false;
  return true;
}
