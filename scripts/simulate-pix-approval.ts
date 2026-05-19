/**
 * Simula a aprovação de um pagamento sem precisar pagar de fato.
 *
 * Uso:
 *   pnpm tsx scripts/simulate-pix-approval.ts            # lista os últimos 10
 *   pnpm tsx scripts/simulate-pix-approval.ts <id>       # aprova esse
 *   pnpm tsx scripts/simulate-pix-approval.ts <id> <metodo>   # ex: "Cartão 3x"
 *
 * Suporta tanto o fluxo antigo (gift_name + amount) quanto o novo (cart_items jsonb).
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import {
  appendPaymentAudit,
  decrementGiftAvailability,
} from "../src/lib/sheets/gifts-write";

type CartItem =
  | { kind: "gift"; giftName: string; quantity: number; price: number }
  | { kind: "donation"; amount: number };

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const arg = process.argv[2];
  const methodArg = process.argv[3] ?? "PIX";

  if (!arg) {
    const rows = await sql`
      SELECT id, status, type, gift_name, cart_items, amount, reserver_name,
             audit_written, inventory_decremented, created_at
      FROM pix_payments
      ORDER BY id DESC
      LIMIT 10
    `;
    if (rows.length === 0) {
      console.log("Nenhum pagamento ainda.");
      return;
    }
    console.log("Últimos pagamentos:\n");
    for (const r of rows) {
      const tag =
        r.status === "approved" ? "✓" : r.status === "pending" ? "○" : "✗";
      const summary = describeRow(r as Record<string, unknown>);
      console.log(
        `${tag} #${r.id}  ${String(r.status).padEnd(8)}  ${summary}  R$ ${r.amount}  (${r.reserver_name})`
      );
    }
    console.log(
      "\nPra aprovar: pnpm tsx scripts/simulate-pix-approval.ts <id> [metodo]"
    );
    return;
  }

  const id = parseInt(arg, 10);
  if (Number.isNaN(id)) {
    console.error("ID inválido.");
    process.exit(1);
  }

  const rows = await sql`SELECT * FROM pix_payments WHERE id = ${id}`;
  if (rows.length === 0) {
    console.error(`#${id} não encontrado.`);
    process.exit(1);
  }
  const pix = rows[0] as Record<string, unknown>;

  if (pix.status === "approved") {
    console.log(`#${id} já está approved. Nada a fazer.`);
    return;
  }
  if (pix.status === "rejected" || pix.status === "expired") {
    console.log(`#${id} está ${pix.status}. Crie um novo pra testar.`);
    return;
  }

  console.log(`Aprovando #${id} (método: ${methodArg})...`);

  const items = extractItems(pix);

  if (!pix.audit_written) {
    const giftImageUrl = (pix.gift_image_url as string | null) ?? null;
    for (const item of items) {
      if (item.kind === "gift") {
        for (let i = 0; i < item.quantity; i++) {
          await appendPaymentAudit({
            giftName: item.giftName,
            reserverName: (pix.reserver_name as string) ?? "",
            amount: item.price,
            message: (pix.message as string | null) ?? null,
            paymentMethod: methodArg,
            email: (pix.reserver_email as string) ?? "",
            phone: (pix.reserver_phone as string | null) ?? "",
            giftImageUrl,
          });
        }
      } else {
        await appendPaymentAudit({
          giftName: "Doação",
          reserverName: (pix.reserver_name as string) ?? "",
          amount: item.amount,
          message: (pix.message as string | null) ?? null,
          paymentMethod: methodArg,
          email: (pix.reserver_email as string) ?? "",
          phone: (pix.reserver_phone as string | null) ?? "",
          giftImageUrl,
        });
      }
    }
    await sql`UPDATE pix_payments SET audit_written = true WHERE id = ${id}`;
    console.log(`  ✓ ${items.length} linha(s) lógica(s) em 'Presentes Dados'`);
  } else {
    console.log("  · Audit já gravado, pulando");
  }

  if (!pix.inventory_decremented) {
    for (const item of items) {
      if (item.kind === "gift") {
        const r = await decrementGiftAvailability(item.giftName, item.quantity);
        if (!r) {
          console.log(
            `  ⚠ "${item.giftName}" não encontrado na planilha pra decrementar`
          );
        } else if (r.skipped) {
          console.log(
            `  · ${item.giftName}: sem limite (coluna em branco), não decrementa`
          );
        } else {
          console.log(
            `  ✓ ${item.giftName}: -${item.quantity} (nova qty: ${r.newAvailability})`
          );
        }
      }
    }
    await sql`UPDATE pix_payments SET inventory_decremented = true WHERE id = ${id}`;
  } else {
    console.log("  · Inventário já decrementado, pulando");
  }

  await sql`
    UPDATE pix_payments
    SET status = 'approved', paid_at = NOW(), payment_method = ${methodArg}
    WHERE id = ${id}
  `;
  console.log("  ✓ Status: approved");
  console.log("\nPronto! A página /checkout/success vai detectar no próximo poll.");
}

function describeRow(r: Record<string, unknown>): string {
  if (r.cart_items) {
    const items = r.cart_items as CartItem[];
    const count = items.reduce(
      (n, it) => n + (it.kind === "gift" ? it.quantity : 1),
      0
    );
    return `Carrinho ${count}× itens`;
  }
  if (r.type === "donation") return "Doação";
  return (r.gift_name as string) ?? (r.type as string) ?? "?";
}

function extractItems(pix: Record<string, unknown>): CartItem[] {
  if (pix.cart_items) {
    return (pix.cart_items as CartItem[]) ?? [];
  }
  // legacy single-item flow
  if (pix.type === "gift" && pix.gift_name) {
    return [
      {
        kind: "gift",
        giftName: pix.gift_name as string,
        quantity: 1,
        price: Number(pix.amount),
      },
    ];
  }
  return [{ kind: "donation", amount: Number(pix.amount) }];
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
