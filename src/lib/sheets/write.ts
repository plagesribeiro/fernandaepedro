import { getSheetsClient, getSheetConfig } from "./client";
import { fetchSnapshot, invalidateSnapshot } from "./read";

export interface WriteResponseInput {
  slotIndex: number;
  status: "Sim" | "Nao";
  nameFilled?: string;
}

export interface WriteResult {
  rowsWritten: Array<{
    rowIndex: number;
    spreadsheetRowNumber: number;
    slotIndex: number;
    originalName: string | null;
  }>;
}

const STATUS_DISPLAY = { Sim: "Sim", Nao: "Não" } as const;

export async function writeResponses(args: {
  inviteGroupName: string;
  responses: WriteResponseInput[];
  confirmedBy: string;
}): Promise<WriteResult> {
  const snapshot = await fetchSnapshot({ bustCache: true });
  const group = snapshot.groupsByName.get(args.inviteGroupName);
  if (!group) {
    throw new Error("INVITE_GROUP_NOT_FOUND");
  }

  const { sheetId, tabName } = getSheetConfig();
  const now = new Date().toISOString();
  const data: Array<{ range: string; values: string[][] }> = [];
  const rowsWritten: WriteResult["rowsWritten"] = [];

  for (const resp of args.responses) {
    const row = group.rows.find((r) => r.slotIndex === resp.slotIndex);
    if (!row) {
      throw new Error(`SLOT_NOT_FOUND:${resp.slotIndex}`);
    }
    const rowNum = row.spreadsheetRowNumber;
    const statusValue = STATUS_DISPLAY[resp.status];
    const filledValue = resp.nameFilled?.trim() ?? "";
    data.push({
      range: `${tabName}!E${rowNum}:H${rowNum}`,
      values: [[statusValue, filledValue, now, args.confirmedBy]],
    });
    rowsWritten.push({
      rowIndex: row.rowIndex,
      spreadsheetRowNumber: rowNum,
      slotIndex: row.slotIndex,
      originalName: row.originalName,
    });
  }

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });

  invalidateSnapshot();
  return { rowsWritten };
}
