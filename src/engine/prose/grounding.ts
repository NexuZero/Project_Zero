import genericVocabData from "@/knowledge/generic_tech_vocabulary.json";

const GENERIC_ALLOWLIST = new Set((genericVocabData as string[]).map((s) => s.toLowerCase()));

export interface GroundingResult {
  ok: boolean;
  offendingToken?: string;
}

function extractCandidateTokens(text: string): string[] {
  const tokens = new Set<string>();
  // Capitalized multi-word phrases (e.g. "React Native", "Web Crypto API") — the shape
  // an invented technology/entity/capability name would take.
  for (const m of text.match(/\b[A-Z][a-zA-Z0-9]*(?:\s[A-Z][a-zA-Z0-9]*)+\b/g) ?? []) tokens.add(m);
  // Standalone numbers — the shape an invented statistic/threshold/version would take.
  for (const m of text.match(/\b\d+(?:\.\d+)*\b/g) ?? []) tokens.add(m);
  // Filename/version-string-shaped tokens (e.g. "config.json", "v2.1").
  for (const m of text.match(/\b[\w-]+\.[a-zA-Z]{2,4}\b/g) ?? []) tokens.add(m);
  return [...tokens];
}

/**
 * Every capitalized multi-word phrase, standalone number, or filename-shaped token in
 * `text` must appear in `facts` (case-insensitive substring match) or the generic
 * technical-vocabulary allowlist. A cheap, mechanical net that catches the *shape* of
 * fabrication (an invented tech name, an invented number) — not a claim of perfect
 * fact-checking, and not the only thing standing between the model and the user (see
 * renderSection()'s retry-then-fallback-to-template behavior in ProseProvider.ts).
 */
export function validateGrounding(text: string, facts: unknown): GroundingResult {
  const haystack = JSON.stringify(facts).toLowerCase();
  for (const token of extractCandidateTokens(text)) {
    if (GENERIC_ALLOWLIST.has(token.toLowerCase())) continue;
    if (!haystack.includes(token.toLowerCase())) {
      return { ok: false, offendingToken: token };
    }
  }
  return { ok: true };
}
