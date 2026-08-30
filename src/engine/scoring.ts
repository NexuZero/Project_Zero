import type { AiRequired, BuildSize, PotentialLevel, ProjectScores, TechStackVariant } from "@/types";

interface CategoryTraits {
  communityValue: PotentialLevel;
  openSourceBase: number;
}

/** Deterministic, hand-tuned base traits per problem category (spec §8: no ML, simple rules). */
const CATEGORY_TRAITS: Record<string, CategoryTraits> = {
  automation: { communityValue: "High", openSourceBase: 85 },
  monitoring: { communityValue: "Medium", openSourceBase: 75 },
  detection: { communityValue: "High", openSourceBase: 80 },
  organization: { communityValue: "Medium", openSourceBase: 70 },
  productivity: { communityValue: "Medium", openSourceBase: 75 },
  security: { communityValue: "Medium", openSourceBase: 70 },
  documentation: { communityValue: "High", openSourceBase: 85 },
  analysis: { communityValue: "Medium", openSourceBase: 70 },
  communication: { communityValue: "Low", openSourceBase: 60 },
  collaboration: { communityValue: "Medium", openSourceBase: 70 },
  visualization: { communityValue: "Medium", openSourceBase: 75 },
  management: { communityValue: "Medium", openSourceBase: 65 },
  tracking: { communityValue: "Medium", openSourceBase: 70 },
  education: { communityValue: "High", openSourceBase: 80 },
  accessibility: { communityValue: "High", openSourceBase: 85 },
  integration: { communityValue: "High", openSourceBase: 80 },
  reliability: { communityValue: "Medium", openSourceBase: 75 },
  privacy: { communityValue: "Medium", openSourceBase: 75 },
  "developer-experience": { communityValue: "High", openSourceBase: 90 }
};

const DEFAULT_TRAITS: CategoryTraits = { communityValue: "Medium", openSourceBase: 65 };

const BUILD_SIZE_DIFFICULTY: Record<BuildSize, number> = { Tiny: 1, Small: 2, Medium: 3, Large: 4 };
const BUILD_SIZE_SCOPE: Record<BuildSize, number> = { Tiny: 95, Small: 85, Medium: 65, Large: 45 };
const COMMUNITY_VALUE_BASE: Record<PotentialLevel, number> = { Low: 45, Medium: 65, High: 85 };

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

/** Small deterministic string hash (djb2), used only to spread originality scores — never Math.random. */
function hashToRange(str: string, min: number, max: number): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) + h + str.charCodeAt(i);
    h = h & h;
  }
  const span = max - min + 1;
  return min + (Math.abs(h) % span);
}

export function computeAiRequired(fieldId: string, categoryId: string): AiRequired {
  if (fieldId === "applied-ai") {
    return ["monitoring", "management", "tracking", "organization"].includes(categoryId) ? "No" : "Optional";
  }
  if (["detection", "analysis"].includes(categoryId)) return "Optional";
  return "No";
}

export function computeDifficulty(buildSize: BuildSize, techStackVariant: TechStackVariant): 1 | 2 | 3 | 4 | 5 {
  let difficulty = BUILD_SIZE_DIFFICULTY[buildSize];
  if (techStackVariant === "webDashboard" && buildSize !== "Tiny") difficulty += 1;
  return clamp(difficulty, 1, 5) as 1 | 2 | 3 | 4 | 5;
}

export interface ScoreInputs {
  fieldId: string;
  categoryId: string;
  buildSize: BuildSize;
  techStackVariant: TechStackVariant;
  classificationScore: number;
  hasNiche: boolean;
  hasTargetUsers: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface ScoreResult {
  scores: ProjectScores;
  communityValue: PotentialLevel;
  openSourcePotential: PotentialLevel;
}

/**
 * Deterministic scoring: identical inputs always produce identical scores.
 * No ML, no hidden randomness — see spec §8.
 */
export function scoreProject(input: ScoreInputs): ScoreResult {
  const traits = CATEGORY_TRAITS[input.categoryId] ?? DEFAULT_TRAITS;

  const usefulness = clamp(50 + Math.round(input.classificationScore * 0.45), 50, 98);

  const originalityBase = hashToRange(`${input.fieldId}:${input.categoryId}:${input.buildSize}`, 55, 88);
  const originality = clamp(originalityBase + (input.hasNiche ? 5 : 0) + (input.hasTargetUsers ? 3 : 0), 0, 97);

  const techBonus = input.techStackVariant === "browserOnly" ? 10 : input.techStackVariant === "cli" ? 5 : 0;
  const buildability = clamp(100 - (input.difficulty - 1) * 20 + techBonus);

  const scope = clamp(BUILD_SIZE_SCOPE[input.buildSize]);

  const openSourceSuitability = clamp(
    traits.openSourceBase + techBonus + (input.buildSize === "Tiny" || input.buildSize === "Small" ? 5 : 0)
  );
  const openSourcePotential: PotentialLevel = openSourceSuitability >= 80 ? "High" : openSourceSuitability >= 60 ? "Medium" : "Low";

  const communityValueScore = clamp(COMMUNITY_VALUE_BASE[traits.communityValue] + (input.hasTargetUsers ? 5 : 0));

  const difficultyScore = input.difficulty * 20;

  return {
    scores: {
      usefulness,
      originality,
      buildability,
      communityValue: communityValueScore,
      openSourceSuitability,
      scope,
      difficulty: difficultyScore
    },
    communityValue: traits.communityValue,
    openSourcePotential
  };
}
