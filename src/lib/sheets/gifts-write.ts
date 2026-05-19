import { getSheetsClient, getSheetConfig } from "./client";
import {
  fetchGiftSnapshot,
  invalidateGiftSnapshot,
  GIFT_LIST_TAB,
} from "./gifts-read";

export const PAYMENT_AUDIT_TAB = "Presentes Dados";

export interface PaymentAuditInput {
  giftName: string;
  reserverName: string;
  amount: number;
  message: string | null;
  paymentMethod: string;
  email: string;
  phone: string;
  giftImageUrl: string | null;
}

export async function appendPaymentAudit(row: PaymentAuditInput): Promise<void> {
  const sheets = getSheetsClient();
  const { sheetId } = getSheetConfig();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${PAYMENT_AUDIT_TAB}'!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          row.giftName,
          row.reserverName,
          row.amount,
          row.message ?? "",
          row.paymentMethod,
          row.email,
          row.phone,
          row.giftImageUrl ?? "",
        ],
      ],
    },
  });
}

export async function decrementGiftAvailability(
  giftName: string,
  by = 1
): Promise<{ newAvailability: number | null; skipped?: boolean } | null> {
  const snapshot = await fetchGiftSnapshot({ bustCache: true });
  const gift = snapshot.byName.get(giftName);
  if (!gift) return null;
  // null = sem limite → não decrementa, deixa a célula em branco
  if (gift.availableQuantity === null) {
    return { newAvailability: null, skipped: true };
  }
  const newQty = Math.max(0, gift.availableQuantity - by);
  const sheets = getSheetsClient();
  const { sheetId } = getSheetConfig();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `'${GIFT_LIST_TAB}'!C${gift.spreadsheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[newQty]] },
  });
  invalidateGiftSnapshot();
  return { newAvailability: newQty };
}
