import { getSheetsClient, getSheetConfig } from "./client";

export const GIFT_LIST_TAB = "Lista de Presentes";
const RANGE = "A2:E1000";
const CACHE_TTL_MS = 5_000;

export interface GiftRow {
  rowIndex: number;
  spreadsheetRowNumber: number;
  name: string;
  description: string;
  /** null = sem limite (coluna em branco no sheet) */
  availableQuantity: number | null;
  price: number;
  imageUrl: string;
}

export interface GiftSnapshot {
  rows: GiftRow[];
  byName: Map<string, GiftRow>;
  fetchedAt: number;
}

let cache: { snapshot: GiftSnapshot; expiresAt: number } | null = null;
let inflight: Promise<GiftSnapshot> | null = null;

function nonEmpty(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

function asNumber(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  const s = String(v)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function parseAvailability(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  return Math.max(0, Math.floor(asNumber(s, 0)));
}

function normalizeImageUrl(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  if (s === "") return "";
  // Migration default that no longer exists in /public — treat as "no image"
  if (s.endsWith("placeholder.webp")) return "";
  return s;
}

async function doFetch(): Promise<GiftSnapshot> {
  const sheets = getSheetsClient();
  const { sheetId } = getSheetConfig();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${GIFT_LIST_TAB}'!${RANGE}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values = (res.data.values as unknown[][] | undefined) ?? [];
  const startRow = 2;
  const rows: GiftRow[] = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i] ?? [];
    const name = nonEmpty(row[0]);
    if (!name) continue;
    rows.push({
      rowIndex: i,
      spreadsheetRowNumber: startRow + i,
      name,
      description: nonEmpty(row[1]) ?? "",
      availableQuantity: parseAvailability(row[2]),
      price: asNumber(row[3], 0),
      imageUrl: normalizeImageUrl(row[4]),
    });
  }
  const byName = new Map(rows.map((r) => [r.name, r]));
  return { rows, byName, fetchedAt: Date.now() };
}

export async function fetchGiftSnapshot(
  opts: { bustCache?: boolean } = {}
): Promise<GiftSnapshot> {
  const now = Date.now();
  if (!opts.bustCache && cache && cache.expiresAt > now) {
    return cache.snapshot;
  }
  if (inflight && !opts.bustCache) return inflight;
  inflight = (async () => {
    try {
      const snapshot = await doFetch();
      cache = { snapshot, expiresAt: Date.now() + CACHE_TTL_MS };
      return snapshot;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function invalidateGiftSnapshot() {
  cache = null;
}
