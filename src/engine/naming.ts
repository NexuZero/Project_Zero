import namingData from "@/knowledge/naming_patterns.json";
import fieldsData from "@/knowledge/fields.json";
import type { FieldDef, NamingPatterns } from "@/types";

const naming = namingData as NamingPatterns;
const fields = fieldsData as FieldDef[];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function categoryWord(categoryId: string): string {
  const first = categoryId.split("-")[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function wordPoolFor(fieldId: string, categoryId: string): string[] {
  const field = fields.find((f) => f.id === fieldId);
  const pool = [
    ...(field?.domainWords ?? []),
    categoryWord(categoryId),
    ...naming.genericActionWords,
    ...naming.genericOutcomeWords
  ];
  return Array.from(new Set(pool));
}

function suffixPoolFor(categoryId: string) {
  const matched = naming.suffixes.filter((s) => s.fitCategories.includes(categoryId));
  return matched.length > 0 ? matched : naming.suffixes;
}

function prefixPoolFor(categoryId: string) {
  return naming.prefixModifiers.filter((p) => p.fitCategories.includes(categoryId));
}

function buildCandidate(fieldId: string, categoryId: string): string {
  const words = wordPoolFor(fieldId, categoryId);
  const keyword = pick(words);
  const roll = Math.random();

  if (roll < 0.6) {
    const suffix = pick(suffixPoolFor(categoryId)).word;
    if (keyword.toLowerCase() === suffix.toLowerCase()) {
      return `${keyword}${pick(naming.genericOutcomeWords)}`;
    }
    return `${keyword}${suffix}`;
  }

  if (roll < 0.85) {
    const prefixPool = prefixPoolFor(categoryId);
    if (prefixPool.length > 0) {
      const prefix = pick(prefixPool).word;
      if (prefix.toLowerCase() !== keyword.toLowerCase()) {
        return `${prefix}${keyword}`;
      }
    }
    const suffix = pick(naming.suffixes).word;
    return `${keyword}${suffix}`;
  }

  const brand = pick(naming.brandSuffixes);
  const short = keyword.length > 8 ? keyword.slice(0, 8) : keyword;
  return `${short}${brand}`;
}

/**
 * Generates one GitHub-friendly project name that hasn't appeared in
 * `excludeNames` (case-insensitive), never repeating within a session.
 */
export function generateName(seed: { fieldId: string; categoryId: string }, excludeNames: string[]): string {
  const used = new Set(excludeNames.map((n) => n.toLowerCase()));
  const maxLen = naming.maxNameLength;

  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = buildCandidate(seed.fieldId, seed.categoryId);
    if (candidate.length <= maxLen && !used.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Extremely unlikely fallback: append a distinguishing outcome word until unique.
  let fallback = buildCandidate(seed.fieldId, seed.categoryId);
  let guard = 0;
  while (used.has(fallback.toLowerCase()) && guard < 20) {
    fallback = `${fallback}${pick(naming.genericOutcomeWords)}`;
    guard++;
  }
  return fallback;
}
