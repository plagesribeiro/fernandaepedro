"use client";

import { initMercadoPago } from "@mercadopago/sdk-react";

let initialized = false;

export function ensureMpInitialized(): boolean {
  if (initialized) return true;
  if (typeof window === "undefined") return false;
  const key = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[checkout] NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ausente — Card Brick não vai carregar."
      );
    }
    return false;
  }
  try {
    initMercadoPago(key, { locale: "pt-BR" });
    initialized = true;
    return true;
  } catch (err) {
    console.error("[checkout] failed to init MP SDK:", err);
    return false;
  }
}
