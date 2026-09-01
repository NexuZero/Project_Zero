import problemTypesData from "@/knowledge/problem_types.json";
import type { ClassificationResult, ProblemTypeDef } from "@/types";
import { scoreKeywordSets } from "./keywordScore";

const problemTypes = problemTypesData as ProblemTypeDef[];

/** Categories used as a safety net when the input text matches no keyword at all. */
const FALLBACK_CATEGORY_IDS = ["organization", "productivity", "tracking"];

/**
 * Weighted keyword classifier. Scores every problem category by summing the
 * weight of every keyword phrase found (case-insensitive, substring match) in
 * the input text, then normalizes to a 0-100 scale.
 */
export function classify(problemText: string): ClassificationResult[] {
  const scored = scoreKeywordSets(
    problemText,
    problemTypes.map((category) => ({ id: category.id, keywords: category.keywords }))
  );
  let results: ClassificationResult[] = scored.map((r) => ({ categoryId: r.id, score: r.score }));

  const hasSignal = results.some((r) => r.score > 0);
  if (!hasSignal) {
    results = problemTypes.map((category) => ({
      categoryId: category.id,
      score: FALLBACK_CATEGORY_IDS.includes(category.id) ? 40 : 10
    }));
    results.sort((a, b) => b.score - a.score);
  }

  return results;
}

export function getCategoryById(categoryId: string): ProblemTypeDef | undefined {
  return problemTypes.find((c) => c.id === categoryId);
}

export function allCategories(): ProblemTypeDef[] {
  return problemTypes;
}
