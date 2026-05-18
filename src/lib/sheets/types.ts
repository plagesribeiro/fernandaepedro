export type GuestStatus = "Sim" | "Nao" | null;

export interface InviteRow {
  rowIndex: number;
  spreadsheetRowNumber: number;
  groupName: string;
  originalName: string | null;
  description: string;
  phoneE164: string | null;
  status: GuestStatus;
  nameFilled: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  isFirstInGroup: boolean;
  slotIndex: number;
}

export interface InviteGroup {
  groupName: string;
  phoneE164: string | null;
  rows: InviteRow[];
}

export interface SheetSnapshot {
  groups: InviteGroup[];
  groupsByName: Map<string, InviteGroup>;
  fetchedAt: number;
  range: string;
}
