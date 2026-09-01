import axesData from "@/knowledge/axes.json";
import { scoreKeywordSets } from "./keywordScore";
import type { Axes, DataOrigin, Interaction, OutputArtifact, Scale, Stakes, Temporality, WeightedKeyword } from "@/types";

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

/**
 * No-signal defaults. When the problem text doesn't clearly hit an axis's keywords,
 * pick the value that implies the LEAST extra infrastructure/entities — the derivation
 * rules (spec §5) add real complexity (Job/Run entities, Source/Sensor entities, audit
 * logging, team/role screens) per axis value, so a false-positive signal is costlier
 * than a false-negative one. Mirrors classify()'s own fallback philosophy (favors
 * general-purpose categories over specific ones when uncertain).
 */
const DEFAULTS = {
  temporality: "one-shot" as Temporality,
  interaction: "on-demand" as Interaction,
  dataOrigin: ["entered"] as DataOrigin[],
  outputArtifact: ["dashboard"] as OutputArtifact[],
  stakes: "operational" as Stakes,
  scale: "single-user" as Scale
};

/** Top-scoring value wins; falls back to the no-signal default when nothing scored. */
function pickSingle<T extends string>(text: string, defs: AxisValueDef[], fallback: T): T {
  const scored = scoreKeywordSets(text, defs);
  const top = scored[0];
  if (!top || top.score === 0) return fallback;
  return top.id as T;
}

/** Every value scoring above zero, capped to the top 2 by score; falls back to the default set when nothing scored. */
function pickMulti<T extends string>(text: string, defs: AxisValueDef[], fallback: T[]): T[] {
  const scored = scoreKeywordSets(text, defs).filter((r) => r.score > 0);
  if (scored.length === 0) return fallback;
  return scored.slice(0, 2).map((r) => r.id as T);
}

/** Extracts all six classification axes from the same problem text the category classifier scores. Pure, deterministic given the same input. */
export function extractAxes(problemText: string): Axes {
  return {
    temporality: pickSingle(problemText, axesKnowledge.temporality, DEFAULTS.temporality),
    interaction: pickSingle(problemText, axesKnowledge.interaction, DEFAULTS.interaction),
    dataOrigin: pickMulti(problemText, axesKnowledge.dataOrigin, DEFAULTS.dataOrigin),
    outputArtifact: pickMulti(problemText, axesKnowledge.outputArtifact, DEFAULTS.outputArtifact),
    stakes: pickSingle(problemText, axesKnowledge.stakes, DEFAULTS.stakes),
    scale: pickSingle(problemText, axesKnowledge.scale, DEFAULTS.scale)
  };
}
