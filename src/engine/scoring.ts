import axesData from "@/knowledge/axes.json";
import type { AiRequired, Axes, BuildSize, PotentialLevel, ProjectScores, TechStackVariant, WeightedKeyword } from "@/types";
import type { TraceRecorder } from "./spec/trace";

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

// ---------------------------------------------------------------------------
// Combinatorial-surprisal originality (Kit Depth Upgrade T-034). Replaces the
// old djb2 hash-bucket: that number was a stable-but-meaningless bucket, not
// an assessment of anything. This is a real (if simple) frequency model over
// the axis vector — computed once at module load from the axes knowledge
// base's own keyword weight totals, not from runtime user behavior (this repo
// has zero tracking/telemetry and that stays true). Rarer axis combinations
// score higher; "all defaults" scores low. Still fully deterministic: the
// same axes vector always produces the same originality score and the same
// explanation.
// ---------------------------------------------------------------------------

interface AxisValueDef {
  id: string;
  keywords: WeightedKeyword[];
}
interface AxesKnowledge {
  temporality: AxisValueDef[];
  interaction: AxisValueDef[];
  dataOrigin: AxisValueDef[];
  outputArtifact: AxisValueDef[];
  stakes: AxisValueDef[];
  scale: AxisValueDef[];
}
const axesKnowledge = axesData as AxesKnowledge;

/** Extra prior mass folded into each axis's no-signal default — terse/vague real-world inputs land there disproportionately often, which thin keyword coverage alone wouldn't capture. */
const DEFAULT_MASS_FRACTION = 0.4;
const AXIS_DEFAULTS: Record<keyof AxesKnowledge, string[]> = {
  temporality: ["one-shot"],
  interaction: ["on-demand"],
  dataOrigin: ["entered"],
  outputArtifact: ["dashboard"],
  stakes: ["operational"],
  scale: ["single-user"]
};

function computeAxisFrequencies(defs: AxisValueDef[], defaultIds: string[]): Record<string, number> {
  const rawTotals: Record<string, number> = {};
  for (const def of defs) {
    rawTotals[def.id] = def.keywords.reduce((sum, k) => sum + k.weight, 0);
  }
  const rawGrandTotal = Object.values(rawTotals).reduce((a, b) => a + b, 0) || 1;
  const boosted = { ...rawTotals };
  for (const id of defaultIds) {
    boosted[id] = (boosted[id] ?? 0) + DEFAULT_MASS_FRACTION * rawGrandTotal;
  }
  const grandTotal = Object.values(boosted).reduce((a, b) => a + b, 0) || 1;
  const freq: Record<string, number> = {};
  for (const [id, total] of Object.entries(boosted)) {
    freq[id] = total / grandTotal;
  }
  return freq;
}

const AXIS_FREQUENCIES: Record<keyof AxesKnowledge, Record<string, number>> = {
  temporality: computeAxisFrequencies(axesKnowledge.temporality, AXIS_DEFAULTS.temporality),
  interaction: computeAxisFrequencies(axesKnowledge.interaction, AXIS_DEFAULTS.interaction),
  dataOrigin: computeAxisFrequencies(axesKnowledge.dataOrigin, AXIS_DEFAULTS.dataOrigin),
  outputArtifact: computeAxisFrequencies(axesKnowledge.outputArtifact, AXIS_DEFAULTS.outputArtifact),
  stakes: computeAxisFrequencies(axesKnowledge.stakes, AXIS_DEFAULTS.stakes),
  scale: computeAxisFrequencies(axesKnowledge.scale, AXIS_DEFAULTS.scale)
};

const FALLBACK_FREQUENCY = 0.01;

function axisVectorCandidates(axes: Axes): { label: string; freq: number }[] {
  return [
    { label: `${axes.temporality} timing`, freq: AXIS_FREQUENCIES.temporality[axes.temporality] ?? FALLBACK_FREQUENCY },
    { label: `${axes.interaction} interaction`, freq: AXIS_FREQUENCIES.interaction[axes.interaction] ?? FALLBACK_FREQUENCY },
    { label: `${axes.stakes} stakes`, freq: AXIS_FREQUENCIES.stakes[axes.stakes] ?? FALLBACK_FREQUENCY },
    { label: `${axes.scale} scale`, freq: AXIS_FREQUENCIES.scale[axes.scale] ?? FALLBACK_FREQUENCY },
    ...axes.dataOrigin.map((v) => ({ label: `${v} data origin`, freq: AXIS_FREQUENCIES.dataOrigin[v] ?? FALLBACK_FREQUENCY })),
    ...axes.outputArtifact.map((v) => ({ label: `${v} output`, freq: AXIS_FREQUENCIES.outputArtifact[v] ?? FALLBACK_FREQUENCY }))
  ];
}

/** Joint probability of the whole axis vector, treating each axis as independent (a standard, honestly-simple approximation — not a claim of measured correlation). */
function axisVectorProbability(axes: Axes): number {
  return axisVectorCandidates(axes).reduce((p, c) => p * c.freq, 1);
}

/** Combinatorial surprisal (-log2 p), scaled onto 0-100. Deterministic: same axes -> same score, always. */
function surprisalOriginality(axes: Axes): number {
  const p = Math.max(axisVectorProbability(axes), 1e-9);
  const bits = -Math.log2(p);
  // 6 largely-independent axes with the default-mass floor above put "all
  // defaults" around ~4-6 bits and a fully rare combination around ~20-25
  // bits in practice — scaled so it composes with the rest of ProjectScores.
  return clamp(Math.round((bits / 22) * 100), 5, 97);
}

/** Human-readable reason for an originality score, citing the actual rarest axis value(s) in play. Exported for the Planning Kit's PRD scorecard caption. */
export function explainOriginality(axes: Axes): string {
  const candidates = axisVectorCandidates(axes).sort((a, b) => a.freq - b.freq);
  const allCommon = candidates.every((c) => c.freq > 0.15);
  if (allCommon) return "This combination of timing, interaction, data origin, output, stakes, and scale is a common shape — nothing here is statistically unusual.";
  const rarest = candidates.slice(0, 2).map((c) => c.label);
  return `Less common combination: ${rarest.join(" + ")} — that specific pairing doesn't come up in most generated ideas.`;
}

export function computeAiRequired(fieldId: string, categoryId: string, recorder: TraceRecorder): AiRequired {
  let chosen: AiRequired;
  let reason: string;

  if (fieldId === "applied-ai") {
    const isOperationalCategory = ["monitoring", "management", "tracking", "organization"].includes(categoryId);
    chosen = isOperationalCategory ? "No" : "Optional";
    reason = isOperationalCategory
      ? `Field is Applied AI, but "${categoryId}" is an operational category that doesn't inherently need an AI component.`
      : `Field is Applied AI and "${categoryId}" isn't one of the exempted operational categories — AI involvement is plausible but not required.`;
  } else if (["detection", "analysis"].includes(categoryId)) {
    chosen = "Optional";
    reason = `"${categoryId}" often benefits from an AI/ML component (e.g. anomaly scoring), but a rule-based approach works too.`;
  } else {
    chosen = "No";
    reason = `Field isn't Applied AI and "${categoryId}" isn't a detection/analysis category — nothing about this idea implies an AI component.`;
  }

  recorder.record({ subject: "AI required", chosen, alternatives: [{ value: chosen, weight: 1 }], reason, isDefault: true, source: "category" });
  return chosen;
}

export function computeDifficulty(buildSize: BuildSize, techStackVariant: TechStackVariant, axes: Axes, recorder: TraceRecorder): 1 | 2 | 3 | 4 | 5 {
  const base = BUILD_SIZE_DIFFICULTY[buildSize];
  const dashboardBump = techStackVariant === "webDashboard" && buildSize !== "Tiny";

  // Axis-driven complexity terms (Kit Depth Upgrade T-034) — each is a real, nameable
  // source of extra build effort, not a generic per-category multiplier.
  const realTimeBump = axes.temporality === "real-time"; // live transport + reconnect handling
  const regulatedBump = axes.stakes === "regulated"; // audit/consent/retention burden
  const teamBump = axes.scale === "team"; // role/permission handling

  const bumps = [dashboardBump, realTimeBump, regulatedBump, teamBump].filter(Boolean).length;
  const chosen = clamp(base + bumps, 1, 5) as 1 | 2 | 3 | 4 | 5;

  const stackLabel = techStackVariant === "cli" ? "a CLI" : techStackVariant === "browserOnly" ? "a browser-only client" : "a web dashboard";
  const bumpReasons = [
    dashboardBump ? "a non-Tiny web dashboard adds real frontend+backend coordination overhead" : null,
    realTimeBump ? "real-time updates add live-transport and reconnect handling" : null,
    regulatedBump ? "regulated stakes add audit/consent/retention burden" : null,
    teamBump ? "team scale adds role/permission handling" : null
  ].filter((r): r is string => r !== null);
  const reason =
    bumpReasons.length > 0
      ? `Base difficulty for a ${buildSize} build via ${stackLabel} is ${base}; +${bumpReasons.length} because ${bumpReasons.join("; ")}.`
      : `Base difficulty for a ${buildSize} build via ${stackLabel} is ${base}, no adjustment.`;

  recorder.record({ subject: "difficulty rating", chosen: String(chosen), alternatives: [{ value: String(chosen), weight: 1 }], reason, isDefault: true, source: "category" });
  return chosen;
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
  axes: Axes;
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

  const originality = clamp(surprisalOriginality(input.axes) + (input.hasNiche ? 3 : 0) + (input.hasTargetUsers ? 2 : 0), 0, 97);

  const techBonus = input.techStackVariant === "browserOnly" ? 10 : input.techStackVariant === "cli" ? 5 : 0;
  const buildability = clamp(100 - (input.difficulty - 1) * 20 + techBonus);

  const scope = clamp(BUILD_SIZE_SCOPE[input.buildSize]);

  // Idea-level nudge on top of the category base (Kit Depth Upgrade T-034): a
  // publicly-scoped idea fits the open-source/community-adoption model better
  // than a narrow single-user personal tool, independent of its category.
  const scaleOpenSourceBonus = input.axes.scale === "public" ? 5 : 0;
  const scaleCommunityBonus = input.axes.scale === "public" ? 8 : input.axes.scale === "team" ? 4 : 0;

  const openSourceSuitability = clamp(
    traits.openSourceBase + techBonus + scaleOpenSourceBonus + (input.buildSize === "Tiny" || input.buildSize === "Small" ? 5 : 0)
  );
  const openSourcePotential: PotentialLevel = openSourceSuitability >= 80 ? "High" : openSourceSuitability >= 60 ? "Medium" : "Low";

  const communityValueScore = clamp(COMMUNITY_VALUE_BASE[traits.communityValue] + (input.hasTargetUsers ? 5 : 0) + scaleCommunityBonus);

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
