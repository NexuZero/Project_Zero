import capabilitiesData from "@/knowledge/capabilities.json";
import techStacksData from "@/knowledge/tech_stacks.json";
import projectTemplatesData from "@/knowledge/project_templates.json";
import type { BuildSize, CapabilitiesMap, CategoryTemplate, ProjectTemplatesMap, TechStackVariant, TechStacksMap } from "@/types";

const capabilities = capabilitiesData as CapabilitiesMap;
const techStacks = techStacksData as TechStacksMap;
const projectTemplates = projectTemplatesData as ProjectTemplatesMap;

const GENERIC_STACK: Record<TechStackVariant, string[]> = {
  cli: ["Python", "Typer", "SQLite"],
  webDashboard: ["Node.js", "Express", "SQLite", "React", "TypeScript"],
  browserOnly: ["TypeScript", "React", "IndexedDB"]
};

const FUTURE_EXTRAS = ["Public API", "Team Accounts & Roles", "Webhooks", "Plugin System", "Mobile Companion App"];

/** Categories that lean toward a CLI-first tool rather than a dashboard. */
const CLI_LEANING = new Set(["automation", "developer-experience", "documentation", "integration"]);
/** Categories that lean toward a full web dashboard. */
const DASHBOARD_LEANING = new Set(["monitoring", "management", "visualization", "analysis", "detection", "reliability"]);

/** Picks `count` distinct items without replacement (caps at `arr.length`). */
function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, arr.length));
}

export function pickTechStackVariant(categoryId: string): TechStackVariant {
  const roll = Math.random();
  if (CLI_LEANING.has(categoryId)) return roll < 0.7 ? "cli" : roll < 0.9 ? "browserOnly" : "webDashboard";
  if (DASHBOARD_LEANING.has(categoryId)) return roll < 0.7 ? "webDashboard" : roll < 0.9 ? "browserOnly" : "cli";
  return roll < 0.6 ? "browserOnly" : roll < 0.85 ? "webDashboard" : "cli";
}

export function pickTechStack(fieldId: string, variant: TechStackVariant): string[] {
  return techStacks[fieldId]?.[variant] ?? GENERIC_STACK[variant];
}

const BUILD_SIZES: BuildSize[] = ["Tiny", "Small", "Medium", "Large"];
const BUILD_SIZE_WEIGHTS: Record<string, number[]> = {
  automation: [0.35, 0.4, 0.2, 0.05],
  documentation: [0.3, 0.4, 0.25, 0.05],
  "developer-experience": [0.3, 0.4, 0.25, 0.05],
  monitoring: [0.15, 0.35, 0.35, 0.15],
  management: [0.1, 0.3, 0.4, 0.2],
  reliability: [0.1, 0.3, 0.4, 0.2],
  default: [0.2, 0.4, 0.3, 0.1]
};

export function pickBuildSize(categoryId: string): BuildSize {
  const weights = BUILD_SIZE_WEIGHTS[categoryId] ?? BUILD_SIZE_WEIGHTS.default;
  const roll = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll <= cumulative) return BUILD_SIZES[i];
  }
  return "Small";
}

export interface FeatureSet {
  coreFeatures: string[];
  mvpFeatures: string[];
  futureFeatures: string[];
}

export function buildFeatures(categoryId: string): FeatureSet {
  const list = capabilities[categoryId] ?? capabilities.organization;
  const mvpCount = Math.max(2, Math.ceil(list.length / 2));
  const coreFeatures = [...list];
  const mvpFeatures = list.slice(0, mvpCount);
  // Future features are genuinely additional ideas beyond the core vision (never a
  // re-listing of items already in coreFeatures) — otherwise a feature can end up
  // labeled both "core" and "deferred" in the same document, which is a contradiction.
  const futureFeatures = pickMany(FUTURE_EXTRAS, 2);
  return { coreFeatures, mvpFeatures, futureFeatures };
}

export interface TemplateVars {
  field: string;
  niche: string;
  problem: string;
  targetUsers: string;
  name: string;
}

function fillTemplate(template: string, vars: TemplateVars): string {
  return template
    .replaceAll("{Field}", capitalize(vars.field))
    .replaceAll("{field}", vars.field)
    .replaceAll("{niche}", vars.niche)
    .replaceAll("{problem}", vars.problem)
    .replaceAll("{targetUsers}", vars.targetUsers)
    .replaceAll("{name}", vars.name);
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

export interface GeneratedCopy {
  tagline: string;
  whyItShouldExist: string;
  solution: string;
  githubDescription: string;
}

/**
 * A "shuffle bag": draws items in random order without repeating until every
 * item has been used once, then reshuffles — and avoids handing back the same
 * item twice in a row across a reshuffle boundary. Used so that when a batch
 * of 10 lands on the same category multiple times, the copy doesn't repeat
 * word-for-word just because a category only has 2-3 template variants.
 */
export function createShuffleBag<T>(items: T[]): () => T {
  let bag: T[] = [];
  let last: T | undefined;

  function refill() {
    bag = [...items];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (items.length > 1 && bag[bag.length - 1] === last) {
      [bag[bag.length - 1], bag[0]] = [bag[0], bag[bag.length - 1]];
    }
  }

  return function next(): T {
    if (bag.length === 0) refill();
    const item = bag.pop() as T;
    last = item;
    return item;
  };
}

export interface CopyPicker {
  buildCopy(categoryId: string, vars: TemplateVars): GeneratedCopy;
}

/** Create one of these per generation call (one per batch), not per idea. */
export function createCopyPicker(): CopyPicker {
  const bags = new Map<string, () => string>();

  function bagFor(categoryId: string, field: keyof CategoryTemplate, items: string[]): () => string {
    const key = `${categoryId}:${field}`;
    let bag = bags.get(key);
    if (!bag) {
      bag = createShuffleBag(items);
      bags.set(key, bag);
    }
    return bag;
  }

  return {
    buildCopy(categoryId: string, vars: TemplateVars): GeneratedCopy {
      const template = projectTemplates[categoryId] ?? projectTemplates.organization;
      return {
        tagline: fillTemplate(bagFor(categoryId, "taglines", template.taglines)(), vars),
        whyItShouldExist: fillTemplate(bagFor(categoryId, "why", template.why)(), vars),
        solution: fillTemplate(bagFor(categoryId, "solution", template.solution)(), vars),
        githubDescription: fillTemplate(bagFor(categoryId, "githubDesc", template.githubDesc)(), vars)
      };
    }
  };
}
