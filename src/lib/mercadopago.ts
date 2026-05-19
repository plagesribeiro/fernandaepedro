import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

let _client: MercadoPagoConfig | null = null;

function getClient() {
  if (!_client) {
    _client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!.trim(),
    });
  }
  return _client;
}

export function getPaymentClient() {
  return new Payment(getClient());
}

export function getPreferenceClient() {
  return new Preference(getClient());
}

export function isSandboxToken(): boolean {
  return (process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "")
    .trim()
    .toUpperCase()
    .startsWith("TEST-");
}
