import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// The engine is authored for the browser (path aliases, .json imports resolved by
// Vite/TS at bundle time). esbuild lets this script exercise the *real* source
// directly — bundled to plain ESM and run in Node — rather than re-implementing
// the logic in a separate test-only copy that could quietly drift from it.
const result = await esbuild.build({
  entryPoints: [path.join(root, "src/engine/generator.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "es2022",
  alias: { "@": path.join(root, "src") }
});

const code = result.outputFiles[0].text;
const tmpFile = path.join(root, "scripts", ".engine-bundle.mjs");
await fs.writeFile(tmpFile, code);
const { generateProjects, generateSurprise } = await import(tmpFile + `?t=${Date.now()}`);

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK:   ${message}`);
  }
}

// 1. Generate 10 Projects — distinct names, 10 results
const input = {
  fieldId: "Applied AI",
  niche: "AI Agent Operations",
  problem: "Companies deploying AI agents don't know the status of their agents, and it's a manual process to check ownership, health, and incidents.",
  targetUsers: "IT Operations Teams"
};
const batch1 = generateProjects(input, { count: 10 });
assert(batch1.length === 10, "generateProjects returns exactly 10 ideas");
assert(new Set(batch1.map((i) => i.name)).size === 10, "all 10 names in a batch are distinct");
assert(batch1.every((i) => i.coreFeatures.length > 0 && i.mvpFeatures.length > 0), "every idea has core + MVP features");
assert(batch1.every((i) => i.techStack.length > 0), "every idea has a tech stack");
assert(batch1.every((i) => i.whyItShouldExist.length > 20 && i.solution.length > 20), "every idea has real why/solution copy");

// 2. Generate 10 More — no repeats against excludeNames
const seenNames = batch1.map((i) => i.name);
const batch2 = generateProjects(input, { count: 10, excludeNames: seenNames });
const overlap = batch2.filter((i) => seenNames.includes(i.name));
assert(batch2.length === 10, "generate-10-more returns exactly 10 ideas");
assert(overlap.length === 0, "generate-10-more produces zero name overlap with the previous batch");

// 3. Surprise Me — no input required
const surprise = generateSurprise({ count: 10 });
assert(surprise.projects.length === 10, "generateSurprise returns exactly 10 ideas with no input");
assert(Boolean(surprise.input.fieldId && surprise.input.niche), "generateSurprise synthesizes a visible field+niche");

// 4. Deterministic scoring — same category/field/buildSize inputs produce same originality via generator's scoring path
// (scoring.ts itself is pure; sanity check by generating twice with identical seeds is not deterministic due to
//  controlled randomness in naming/buildSize — so we check scores stay within valid bounds instead.)
assert(
  batch1.every((i) => Object.values(i.scores).every((v) => v >= 0 && v <= 100)),
  "all numeric scores stay within 0-100"
);
assert(batch1.every((i) => i.difficulty >= 1 && i.difficulty <= 5), "difficulty stays within 1-5");

// 5. Degenerate input still produces 10 results (fallback path in classifier)
const degenerate = generateProjects({ fieldId: "Made Up Field", niche: "", problem: "asdf asdf asdf asdf" }, { count: 10 });
assert(degenerate.length === 10, "even a low-signal / unknown-field input still yields 10 ideas");
assert(degenerate[0].fieldName === "Made Up Field", "an unrecognized typed field is preserved as-is, not silently swapped");

// 6. Regression: a batch must never contain two cards with byte-identical copy text.
// (Historical bug: with only 2 template variants per category and a category picked 3+
// times in one batch, the 1st and 3rd draw were *guaranteed* identical on tagline/why/
// solution simultaneously — see Bug Ledger 2026-08-31 "duplicate card text". Fixed by
// adding a 3rd template variant per category and capping per-category draws at 3.)
const stressInput = {
  fieldId: "Cybersecurity",
  niche: "",
  problem: "Small businesses keep getting hit by phishing attacks and have no way to detect suspicious emails before someone clicks.",
  targetUsers: ""
};
let duplicateTextCount = 0;
for (let trial = 0; trial < 25; trial++) {
  const batch = generateProjects(stressInput, { count: 10 });
  const seenTaglines = new Set();
  const seenWhy = new Set();
  const seenSolutions = new Set();
  for (const idea of batch) {
    if (seenTaglines.has(idea.tagline)) duplicateTextCount++;
    if (seenWhy.has(idea.whyItShouldExist)) duplicateTextCount++;
    if (seenSolutions.has(idea.solution)) duplicateTextCount++;
    seenTaglines.add(idea.tagline);
    seenWhy.add(idea.whyItShouldExist);
    seenSolutions.add(idea.solution);
  }
}
assert(duplicateTextCount === 0, "no two cards in a batch share identical tagline/why/solution text (25 trials)");

await fs.unlink(tmpFile).catch(() => {});

console.log(failures === 0 ? "\nAll engine checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
