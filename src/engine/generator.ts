import fieldsData from "@/knowledge/fields.json";
import nichesData from "@/knowledge/niches.json";
import audiencesData from "@/knowledge/audiences.json";
import { classify, getCategoryById } from "./classifier";
import { generateName } from "./naming";
import { computeAiRequired, computeDifficulty, scoreProject } from "./scoring";
import { buildFeatures, createCopyPicker, pickBuildSize, pickTechStack, pickTechStackVariant, type CopyPicker } from "./templates";
import type { AudienceDef, ClassificationResult, FieldDef, GenerationInput, NicheDef, ProjectIdea } from "@/types";

const fields = fieldsData as FieldDef[];
const niches = nichesData as NicheDef[];
const audiences = audiencesData as AudienceDef[];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(s: string): string {
  const slug = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "custom-field";
}

/**
 * Resolves a known field by id or name; if the user typed a field that isn't in
 * the knowledge base, synthesizes one from their words rather than silently
 * substituting an unrelated field (spec §1 allows freely typing a field).
 */
function resolveField(fieldIdOrName: string): FieldDef {
  const normalized = fieldIdOrName.trim();
  if (!normalized) return fields[0];

  const lower = normalized.toLowerCase();
  const match = fields.find((f) => f.id === lower || f.name.toLowerCase() === lower);
  if (match) return match;

  const words = normalized.split(/\s+/).filter(Boolean);
  return {
    id: slugify(normalized),
    name: normalized,
    description: `A community-defined focus area: ${normalized}.`,
    keywords: words.map((w) => w.toLowerCase()),
    domainWords: words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
    defaultAudiences: ["solo-developers"]
  };
}

function resolveNicheLabel(field: FieldDef, typedNiche?: string): string {
  const trimmed = typedNiche?.trim();
  if (trimmed) return trimmed;
  const compatible = niches.filter((n) => n.compatibleFields.includes(field.id));
  const pool = compatible.length > 0 ? compatible : niches;
  return pick(pool).label;
}

function resolveTargetUsers(field: FieldDef, typedTargetUsers?: string): string {
  const trimmed = typedTargetUsers?.trim();
  if (trimmed) return trimmed;
  const compatible = audiences.filter((a) => a.compatibleFields.includes(field.id));
  if (compatible.length > 0) return pick(compatible).label;
  const fallbackId = field.defaultAudiences[0];
  const fallback = audiences.find((a) => a.id === fallbackId);
  return fallback?.label ?? "builders and small teams";
}

/**
 * Builds the category for each of the `count` ideas in a batch: weighted toward
 * higher-scored categories (so the batch stays relevant to what was typed), but
 * capped per category so one dominant keyword match can't produce 9 near-identical
 * "Detection" cards out of 10 — spec §2 asks for 10 *different* concepts, not 10
 * names for the same concept. Order is shuffled so same-category cards aren't
 * all clumped together in the results grid.
 */
function buildCategoryPlan(results: ClassificationResult[], count: number, topN: number): string[] {
  const slice = results.slice(0, Math.min(topN, results.length));
  const weights = slice.map((r) => Math.max(r.score, 1) + 5);
  // Each category has 3 copy variants (see project_templates.json) that never repeat
  // within 3 consecutive draws of that category — so capping at 3 keeps every card's
  // text distinct whenever the cap is actually reachable, instead of just "different name."
  const cap = Math.min(3, Math.max(2, Math.ceil(count / slice.length) + 1));
  const used = new Array(slice.length).fill(0);
  const plan: string[] = [];

  for (let n = 0; n < count; n++) {
    let eligible = slice.map((_, i) => i).filter((i) => used[i] < cap);
    if (eligible.length === 0) eligible = slice.map((_, i) => i);

    const eligibleWeights = eligible.map((i) => weights[i]);
    const total = eligibleWeights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let chosen = eligible[eligible.length - 1];
    for (let k = 0; k < eligible.length; k++) {
      roll -= eligibleWeights[k];
      if (roll <= 0) {
        chosen = eligible[k];
        break;
      }
    }

    used[chosen]++;
    plan.push(slice[chosen].categoryId);
  }

  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }
  return plan;
}

interface BuildIdeaParams {
  field: FieldDef;
  categoryId: string;
  nicheLabel: string;
  targetUsersLabel: string;
  problemText: string;
  classificationScore: number;
  hasNiche: boolean;
  hasTargetUsers: boolean;
  usedNames: string[];
  copyPicker: CopyPicker;
}

function buildIdea(params: BuildIdeaParams): ProjectIdea {
  const { field, categoryId, nicheLabel, targetUsersLabel, problemText, classificationScore, hasNiche, hasTargetUsers, usedNames, copyPicker } = params;
  const categoryDef = getCategoryById(categoryId);

  const techStackVariant = pickTechStackVariant(categoryId);
  const techStack = pickTechStack(field.id, techStackVariant);
  const buildSize = pickBuildSize(categoryId);
  const { coreFeatures, mvpFeatures, futureFeatures } = buildFeatures(categoryId);
  const difficulty = computeDifficulty(buildSize, techStackVariant);
  const aiRequired = computeAiRequired(field.id, categoryId);

  const name = generateName({ fieldId: field.id, categoryId }, usedNames);
  usedNames.push(name);

  const copy = copyPicker.buildCopy(categoryId, {
    field: field.name,
    niche: nicheLabel,
    problem: problemText,
    targetUsers: targetUsersLabel,
    name
  });

  const { scores, communityValue, openSourcePotential } = scoreProject({
    fieldId: field.id,
    categoryId,
    buildSize,
    techStackVariant,
    classificationScore,
    hasNiche,
    hasTargetUsers,
    difficulty
  });

  return {
    id: crypto.randomUUID(),
    name,
    tagline: copy.tagline,
    fieldId: field.id,
    fieldName: field.name,
    nicheLabel,
    problemInput: problemText,
    targetUsers: targetUsersLabel,
    whyItShouldExist: copy.whyItShouldExist,
    solution: copy.solution,
    coreFeatures,
    mvpFeatures,
    futureFeatures,
    techStack,
    difficulty,
    buildSize,
    aiRequired,
    openSourcePotential,
    communityValue,
    githubDescription: copy.githubDescription,
    scores,
    categoryId,
    categoryName: categoryDef?.name ?? categoryId,
    createdAt: new Date().toISOString()
  };
}

export interface GenerateOptions {
  count?: number;
  excludeNames?: string[];
}

/** Produces `count` distinct project concepts from a directed field/niche/problem input. */
export function generateProjects(input: GenerationInput, opts: GenerateOptions = {}): ProjectIdea[] {
  const count = opts.count ?? 10;
  const field = resolveField(input.fieldId);
  const nicheLabel = resolveNicheLabel(field, input.niche);
  const targetUsersLabel = resolveTargetUsers(field, input.targetUsers);
  const problemText = input.problem.trim();
  const classification = classify(problemText);
  const usedNames = [...(opts.excludeNames ?? [])];
  const copyPicker = createCopyPicker();
  const categoryPlan = buildCategoryPlan(classification, count, 6);

  const ideas: ProjectIdea[] = [];
  for (let i = 0; i < count; i++) {
    const categoryId = categoryPlan[i];
    const classificationScore = classification.find((c) => c.categoryId === categoryId)?.score ?? 10;
    ideas.push(
      buildIdea({
        field,
        categoryId,
        nicheLabel,
        targetUsersLabel,
        problemText,
        classificationScore,
        hasNiche: Boolean(input.niche?.trim()),
        hasTargetUsers: Boolean(input.targetUsers?.trim()),
        usedNames,
        copyPicker
      })
    );
  }
  return ideas;
}

export interface SurpriseResult {
  input: GenerationInput;
  projects: ProjectIdea[];
}

/** Generates without requiring input, by combining a field, a compatible niche, and its compatible problem categories. */
export function generateSurprise(opts: GenerateOptions = {}): SurpriseResult {
  const count = opts.count ?? 10;
  const field = pick(fields);
  const compatibleNiches = niches.filter((n) => n.compatibleFields.includes(field.id));
  const niche = pick(compatibleNiches.length > 0 ? compatibleNiches : niches);
  const categories = niche.compatibleCategories.length > 0 ? niche.compatibleCategories : ["organization", "productivity", "tracking"];
  const targetUsersLabel = resolveTargetUsers(field, undefined);

  const problemText = `${targetUsersLabel} working in ${field.name.toLowerCase()} don't have a simple, focused way to handle ${niche.label.toLowerCase()}.`;
  const usedNames: string[] = [...(opts.excludeNames ?? [])];
  const copyPicker = createCopyPicker();
  const equalWeighted: ClassificationResult[] = categories.map((categoryId) => ({ categoryId, score: 60 }));
  const categoryPlan = buildCategoryPlan(equalWeighted, count, categories.length);

  const projects: ProjectIdea[] = [];
  for (let i = 0; i < count; i++) {
    const categoryId = categoryPlan[i];
    const classificationScore = 60;
    projects.push(
      buildIdea({
        field,
        categoryId,
        nicheLabel: niche.label,
        targetUsersLabel,
        problemText,
        classificationScore,
        hasNiche: true,
        hasTargetUsers: true,
        usedNames,
        copyPicker
      })
    );
  }

  return {
    input: { fieldId: field.id, niche: niche.label, problem: problemText, targetUsers: targetUsersLabel },
    projects
  };
}
