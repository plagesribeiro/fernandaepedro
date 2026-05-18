import { getSheetsClient, getSheetConfig } from "./client";
import type {
  InviteRow,
  InviteGroup,
  SheetSnapshot,
  GuestStatus,
} from "./types";

const CACHE_TTL_MS = 30_000;
let cache: { snapshot: SheetSnapshot; expiresAt: number } | null = null;
let inflight: Promise<SheetSnapshot> | null = null;

function nonEmpty(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

function parseStatus(raw: string | null): GuestStatus {
  if (!raw) return null;
  if (raw === "Sim") return "Sim";
  if (raw === "Não" || raw === "Nao") return "Nao";
  return null;
}

function rangeStartRow(range: string): number {
  const m = range.match(/^[A-Z]+(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

function parseSnapshot(
  values: unknown[][],
  rangeStartRowNumber: number,
  range: string
): SheetSnapshot {
  const groups: InviteGroup[] = [];
  let currentGroup: InviteGroup | null = null;
  let slotIndexInGroup = 0;

  for (let i = 0; i < values.length; i++) {
    const row = values[i] ?? [];
    const colA = nonEmpty(row[0]);
    const colB = nonEmpty(row[1]);
    const colC = nonEmpty(row[2]);
    const colD = nonEmpty(row[3]);
    const colE = nonEmpty(row[4]);
    const colF = nonEmpty(row[5]);
    const colG = nonEmpty(row[6]);
    const colH = nonEmpty(row[7]);

    if (!colA && !colB && !colC && !colD && !colE) continue;

    const isFirstInGroup = colA !== null;
    if (isFirstInGroup) {
      currentGroup = { groupName: colA, phoneE164: colD, rows: [] };
      groups.push(currentGroup);
      slotIndexInGroup = 0;
    } else if (!currentGroup) {
      console.warn(
        `[sheets] orphan row ${rangeStartRowNumber + i}: no group header above, skipping`
      );
      continue;
    }

    const inviteRow: InviteRow = {
      rowIndex: i,
      spreadsheetRowNumber: rangeStartRowNumber + i,
      groupName: currentGroup.groupName,
      originalName: colB,
      description: colC ?? "",
      phoneE164: isFirstInGroup ? colD : null,
      status: parseStatus(colE),
      nameFilled: colF,
      confirmedAt: colG,
      confirmedBy: colH,
      isFirstInGroup,
      slotIndex: slotIndexInGroup,
    };
    currentGroup.rows.push(inviteRow);
    slotIndexInGroup++;
  }

  const groupsByName = new Map<string, InviteGroup>();
  for (const g of groups) groupsByName.set(g.groupName, g);

  return { groups, groupsByName, fetchedAt: Date.now(), range };
}

async function doFetch(): Promise<SheetSnapshot> {
  const sheets = getSheetsClient();
  const { sheetId, fullRange, range } = getSheetConfig();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: fullRange,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values = (res.data.values as unknown[][] | undefined) ?? [];
  return parseSnapshot(values, rangeStartRow(range), fullRange);
}

export async function fetchSnapshot(
  opts: { bustCache?: boolean } = {}
): Promise<SheetSnapshot> {
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

export function invalidateSnapshot() {
  cache = null;
}
