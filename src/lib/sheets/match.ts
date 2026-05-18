import type { SheetSnapshot, InviteGroup } from "./types";

const STOPWORDS = ["e familia", "e família", "familia", "família"];

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stripStopwords(s: string): string {
  let out = s;
  for (const sw of STOPWORDS) {
    out = out.split(sw).join(" ");
  }
  return out.replace(/\s+/g, " ").trim();
}

export interface InviteMatch {
  group: InviteGroup;
  matchedField: "groupName" | "guestName";
  matchedText: string;
  score: number;
}

export function searchInvites(
  snapshot: SheetSnapshot,
  rawQuery: string,
  limit = 5
): InviteMatch[] {
  const q = normalize(rawQuery);
  if (q.length < 2) return [];
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length === 0) return [];

  const results: InviteMatch[] = [];

  for (const group of snapshot.groups) {
    const groupNameNorm = stripStopwords(normalize(group.groupName));
    let best: InviteMatch | null = null;

    if (tokens.every((t) => groupNameNorm.includes(t))) {
      best = {
        group,
        matchedField: "groupName",
        matchedText: group.groupName,
        score: 10 - Math.min(8, groupNameNorm.length / 5),
      };
    }

    for (const row of group.rows) {
      const candidates: string[] = [];
      if (row.originalName) candidates.push(row.originalName);
      if (row.nameFilled) candidates.push(row.nameFilled);
      for (const cand of candidates) {
        const candNorm = normalize(cand);
        if (tokens.every((t) => candNorm.includes(t))) {
          const score = 20 - Math.min(8, candNorm.length / 5);
          if (!best || score > best.score) {
            best = {
              group,
              matchedField: "guestName",
              matchedText: cand,
              score,
            };
          }
        }
      }
    }

    if (best) results.push(best);
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
