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

type KeywordSource = "domain" | "category" | "genericAction" | "genericOutcome";
type NamingPattern = "suffix" | "prefix" | "brand";

interface PoolWord {
  word: string;
  source: KeywordSource;
}

/** A word with no listed connotation (a plain action/outcome word) — used only in the rare
 * fallback where a suffix would collide with the keyword itself. */
const PLAIN_OUTCOME_MEANING = "a plain word for the outcome a tool like this delivers";

export interface NameParts {
  keyword: string;
  keywordSource: KeywordSource;
  fieldName?: string;
  categoryName: string;
  pattern: NamingPattern;
  modifierWord: string;
  modifierMeaning: string;
  truncatedFrom?: string;
  extraDisambiguationWords: string[];
}

interface NameCandidate {
  name: string;
  parts: NameParts;
}

function wordPoolFor(field: FieldDef | undefined, categoryId: string): PoolWord[] {
  const pool: PoolWord[] = [
    ...(field?.domainWords ?? []).map((word): PoolWord => ({ word, source: "domain" })),
    { word: categoryWord(categoryId), source: "category" },
    ...naming.genericActionWords.map((word): PoolWord => ({ word, source: "genericAction" })),
    ...naming.genericOutcomeWords.map((word): PoolWord => ({ word, source: "genericOutcome" }))
  ];

  const seen = new Set<string>();
  return pool.filter((p) => {
    const key = p.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function suffixPoolFor(categoryId: string) {
  const matched = naming.suffixes.filter((s) => s.fitCategories.includes(categoryId));
  return matched.length > 0 ? matched : naming.suffixes;
}

function prefixPoolFor(categoryId: string) {
  return naming.prefixModifiers.filter((p) => p.fitCategories.includes(categoryId));
}

function buildCandidate(fieldId: string, categoryId: string, categoryName: string): NameCandidate {
  const field = fields.find((f) => f.id === fieldId);
  const pool = wordPoolFor(field, categoryId);
  const picked = pick(pool);
  const roll = Math.random();

  const baseParts = {
    keyword: picked.word,
    keywordSource: picked.source,
    fieldName: picked.source === "domain" ? field?.name : undefined,
    categoryName,
    extraDisambiguationWords: [] as string[]
  };

  if (roll < 0.6) {
    const suffix = pick(suffixPoolFor(categoryId));
    if (picked.word.toLowerCase() === suffix.word.toLowerCase()) {
      const outcome = pick(naming.genericOutcomeWords);
      return {
        name: `${picked.word}${outcome}`,
        parts: { ...baseParts, pattern: "suffix", modifierWord: outcome, modifierMeaning: PLAIN_OUTCOME_MEANING }
      };
    }
    return {
      name: `${picked.word}${suffix.word}`,
      parts: { ...baseParts, pattern: "suffix", modifierWord: suffix.word, modifierMeaning: suffix.meaning }
    };
  }

  if (roll < 0.85) {
    const prefixPool = prefixPoolFor(categoryId);
    if (prefixPool.length > 0) {
      const prefix = pick(prefixPool);
      if (prefix.word.toLowerCase() !== picked.word.toLowerCase()) {
        return {
          name: `${prefix.word}${picked.word}`,
          parts: { ...baseParts, pattern: "prefix", modifierWord: prefix.word, modifierMeaning: prefix.meaning }
        };
      }
    }
    const suffix = pick(naming.suffixes);
    return {
      name: `${picked.word}${suffix.word}`,
      parts: { ...baseParts, pattern: "suffix", modifierWord: suffix.word, modifierMeaning: suffix.meaning }
    };
  }

  const brand = pick(naming.brandSuffixes);
  const truncated = picked.word.length > 8;
  const short = truncated ? picked.word.slice(0, 8) : picked.word;
  return {
    name: `${short}${brand.word}`,
    parts: {
      ...baseParts,
      keyword: short,
      pattern: "brand",
      modifierWord: brand.word,
      modifierMeaning: brand.meaning,
      truncatedFrom: truncated ? picked.word : undefined
    }
  };
}

function keywordClause(parts: NameParts): string {
  switch (parts.keywordSource) {
    case "domain":
      return `a word tied to ${parts.fieldName ?? "this field"}`;
    case "category":
      return `the short form of this idea's category, ${parts.categoryName}`;
    case "genericAction":
      return "a common word for what tools like this actually do";
    case "genericOutcome":
      return "a word for the outcome a tool like this is meant to deliver";
  }
}

function composeRationale(parts: NameParts): string {
  const clause = keywordClause(parts);
  let sentence: string;

  if (parts.pattern === "suffix") {
    sentence = `"${parts.keyword}" (${clause}) is paired with "${parts.modifierWord}," a suffix that signals ${parts.modifierMeaning}.`;
  } else if (parts.pattern === "prefix") {
    sentence = `"${parts.modifierWord}" is placed in front of "${parts.keyword}" (${clause}); "${parts.modifierWord}" is a prefix that signals ${parts.modifierMeaning}.`;
  } else {
    const truncationNote = parts.truncatedFrom ? `, shortened from "${parts.truncatedFrom}"` : "";
    sentence = `"${parts.keyword}" (${clause}${truncationNote}) gets the "${parts.modifierWord}" ending — a style common in tech product names that signals ${parts.modifierMeaning}.`;
  }

  if (parts.extraDisambiguationWords.length > 0) {
    const extra = parts.extraDisambiguationWords.map((w) => `"${w}"`).join(", ");
    sentence += ` ${extra} was added at the end to keep this name unique in this batch.`;
  }

  return sentence;
}

export interface GeneratedName {
  name: string;
  rationale: string;
}

/**
 * Generates one GitHub-friendly project name that hasn't appeared in
 * `excludeNames` (case-insensitive), never repeating within a session, plus a
 * plain-language explanation of why the name was built the way it was.
 */
export function generateName(
  seed: { fieldId: string; categoryId: string; categoryName: string },
  excludeNames: string[]
): GeneratedName {
  const used = new Set(excludeNames.map((n) => n.toLowerCase()));
  const maxLen = naming.maxNameLength;

  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = buildCandidate(seed.fieldId, seed.categoryId, seed.categoryName);
    if (candidate.name.length <= maxLen && !used.has(candidate.name.toLowerCase())) {
      return { name: candidate.name, rationale: composeRationale(candidate.parts) };
    }
  }

  // Extremely unlikely fallback: append a distinguishing outcome word until unique.
  const candidate = buildCandidate(seed.fieldId, seed.categoryId, seed.categoryName);
  let guard = 0;
  while (used.has(candidate.name.toLowerCase()) && guard < 20) {
    const extra = pick(naming.genericOutcomeWords);
    candidate.name = `${candidate.name}${extra}`;
    candidate.parts.extraDisambiguationWords.push(extra);
    guard++;
  }
  return { name: candidate.name, rationale: composeRationale(candidate.parts) };
}
