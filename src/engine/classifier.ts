import problemTypesData from "@/knowledge/problem_types.json";
import type { ClassificationResult, ProblemTypeDef } from "@/types";

const problemTypes = problemTypesData as ProblemTypeDef[];

/** Categories used as a safety net when the input text matches no keyword at all. */
const FALLBACK_CATEGORY_IDS = ["organization", "productivity", "tracking"];

/**
 * Weighted keyword classifier. Scores every problem category by summing the
 * weight of every keyword phrase found (case-insensitive, substring match) in
 * the input text, then normalizes to a 0-100 scale.
 */
export function classify(problemText: string): ClassificationResult[] {
  const text = problemText.toLowerCase();

  const raw = problemTypes.map((category) => {
    let score = 0;
    for (const kw of category.keywords) {
      if (text.includes(kw.term.toLowerCase())) {
        score += kw.weight;
      }
    }
    return { categoryId: category.id, score };
  });

  const maxScore = Math.max(...raw.map((r) => r.score), 1);
  let results: ClassificationResult[] = raw
    .map((r) => ({ categoryId: r.categoryId, score: Math.round((r.score / maxScore) * 100) }))
    .sort((a, b) => b.score - a.score);

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
