import type { WeightedKeyword } from "@/types";

export interface KeywordSet {
  id: string;
  keywords: WeightedKeyword[];
}

export interface ScoredKeywordResult {
  id: string;
  score: number;
}

/**
 * Weighted keyword bag-of-words scorer: sums keyword weights found (case-insensitive,
 * substring match) in `text` per set, then normalizes to 0-100 against the batch's own
 * max. Shared by classifier.ts (problem categories) and axes.ts (classification axes) so
 * both use the identical algorithm instead of two copies that could quietly drift apart.
 */
export function scoreKeywordSets(text: string, sets: KeywordSet[]): ScoredKeywordResult[] {
  const lower = text.toLowerCase();

  const raw = sets.map((set) => {
    let score = 0;
    for (const kw of set.keywords) {
      if (lower.includes(kw.term.toLowerCase())) {
        score += kw.weight;
      }
    }
    return { id: set.id, score };
  });

  const maxScore = Math.max(...raw.map((r) => r.score), 1);
  return raw
    .map((r) => ({ id: r.id, score: Math.round((r.score / maxScore) * 100) }))
    .sort((a, b) => b.score - a.score);
}
