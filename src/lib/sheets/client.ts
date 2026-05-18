import { google, type sheets_v4 } from "googleapis";

let cachedClient: sheets_v4.Sheets | null = null;

export function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is missing");
  }
  const credentials = JSON.parse(json);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

export function getSheetConfig() {
  const sheetId = process.env.GUEST_SHEET_ID;
  const tabName = process.env.GUEST_SHEET_TAB_NAME || "Convidados";
  const range = process.env.GUEST_SHEET_RANGE || "A2:H1000";
  if (!sheetId) throw new Error("GUEST_SHEET_ID env var is missing");
  return { sheetId, tabName, range, fullRange: `${tabName}!${range}` };
}
