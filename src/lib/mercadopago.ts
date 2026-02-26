import { MercadoPagoConfig, Payment } from "mercadopago";

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
