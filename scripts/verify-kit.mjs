import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function bundleAndImport(entryRelativePath, tmpName) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, entryRelativePath)],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    target: "es2022",
    alias: { "@": path.join(root, "src") }
  });
  const tmpFile = path.join(root, "scripts", tmpName);
  await fs.writeFile(tmpFile, result.outputFiles[0].text);
  const mod = await import(tmpFile + `?t=${Date.now()}`);
  return { mod, tmpFile };
}

const { mod: generatorMod, tmpFile: generatorTmp } = await bundleAndImport("src/engine/generator.ts", ".verify-kit-generator-bundle.mjs");
const { mod: kitMod, tmpFile: kitTmp } = await bundleAndImport("src/utils/projectKit.ts", ".verify-kit-kit-bundle.mjs");
const { generateProjects } = generatorMod;
const { buildProjectKit } = kitMod;

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK:   ${message}`);
  }
}

const EXPECTED_FILES = [
  "00-README.md",
  "01-PRD.md",
  "02-TRD.md",
  "03-UIUX.md",
  "04-APPFLOW.md",
  "05-SCHEMA.md",
  "06-API-CONTRACT.md",
  "07-SECURITY.md",
  "08-TESTING.md",
  "09-IMPLEMENTATION.md",
  "10-AGENT-RULES.md"
];

// Gather a varied set of real, engine-generated ideas: different fields (so different
// techStack backend/no-backend shapes) and enough of them to cover all 3 aiRequired values.
const fixtures = [
  ...generateProjects(
    { fieldId: "Applied AI", niche: "AI Agent Operations", problem: "Companies deploying AI agents dont have a simple way to track ownership, health, permissions and incidents.", targetUsers: "IT Operations Teams" },
    { count: 10 }
  ),
  ...generateProjects(
    { fieldId: "Cybersecurity", niche: "", problem: "Small businesses keep getting hit by phishing attacks and have no way to detect suspicious emails before someone clicks.", targetUsers: "" },
    { count: 10 }
  )
];

const sampleIdea = fixtures[0];

// 1. Deterministic (not probabilistic) variety — run FIRST, before anything else touches
// the module's shuffle bags. The bag's no-repeat guarantee only holds for a "bagful" of
// draws starting at a fresh refill boundary; sampling mid-stream after other draws have
// already partially consumed a bag is a different (weaker) property, so this must run
// against a clean module state to be a meaningful, non-flaky assertion.
const poolSize = 3; // every kit_phrasing.json key currently has exactly 3 variants
const trdCodingStandardsDraws = new Set();
for (let i = 0; i < poolSize; i++) {
  const files = buildProjectKit(sampleIdea);
  const trd = files["02-TRD.md"];
  const match = trd.match(/## Coding standards\n([\s\S]+?)\n\n## Dependency policy/);
  trdCodingStandardsDraws.add(match ? match[1] : null);
}
assert(trdCodingStandardsDraws.size === poolSize, `${poolSize} consecutive kit exports (from a fresh module state) draw ${poolSize} distinct "Coding standards" phrasings (shuffle-bag guarantee)`);

// 2. Structural: 11 files, never throws, across every generated fixture idea.
let allHaveAllFiles = true;
let anyThrew = false;
for (const idea of fixtures) {
  try {
    const files = buildProjectKit(idea);
    const names = Object.keys(files);
    if (EXPECTED_FILES.some((f) => !names.includes(f)) || names.length !== EXPECTED_FILES.length) {
      allHaveAllFiles = false;
    }
  } catch {
    anyThrew = true;
  }
}
assert(allHaveAllFiles, "every fixture idea produces all 11 expected kit files, nothing more, nothing less");
assert(!anyThrew, "buildProjectKit never throws across a varied set of real generated ideas");

// 3. Confirmed-unused-field wiring: scorecard has 7 rows, namingRationale in PRD,
// openSourcePotential/communityValue in README.
const files = buildProjectKit(sampleIdea);
const prd = files["01-PRD.md"];
const readme = files["00-README.md"];

const scorecardRows = ["Usefulness", "Originality", "Buildability", "Community value", "Open source suitability", "Scope fit", "Difficulty (finer-grained)"];
assert(scorecardRows.every((row) => prd.includes(row)), "PRD's Idea Scorecard has all 7 ProjectScores signals as labeled rows");
assert(prd.includes(sampleIdea.namingRationale), "PRD includes the idea's real namingRationale verbatim");
assert(readme.includes(sampleIdea.openSourcePotential) && readme.includes(sampleIdea.communityValue), "README includes openSourcePotential and communityValue verbatim");
assert(readme.includes("Idea generated:") && readme.includes("Kit exported:"), "README distinguishes idea-generation date from kit-export date");

// 4. Schema/API-contract honesty fixes: worksheet table present, no fabricated mapping.
const schema = files["05-SCHEMA.md"];
assert(schema.includes("Touched by which MVP feature(s)?") && schema.includes("_(fill in"), "Schema doc presents entities as a fill-in worksheet, not a fabricated mapping");

// 5. Part 1.5 — optional AI elaboration threading (pure, synchronous, tested with a fixture string).
const withoutAi = buildProjectKit(sampleIdea);
assert(Object.keys(withoutAi).length === 11, "buildProjectKit returns 11 files when no AI elaboration is supplied");

const fixtureText = "This is a fixture elaboration paragraph used only to test the plumbing, not real model output.";
const withAi = buildProjectKit(sampleIdea, { aiElaboration: fixtureText });
assert(Object.keys(withAi).length === 12, "buildProjectKit returns 12 files when an AI elaboration is supplied");
assert(withAi["11-AI-ELABORATION.md"]?.includes(fixtureText), "the AI elaboration file contains the exact supplied text");
assert(withAi["11-AI-ELABORATION.md"]?.includes("Optional, on-device only"), "the AI elaboration file carries its disclaimer");
assert(withAi["00-README.md"].includes("11-AI-ELABORATION.md"), "the README index includes the AI elaboration doc only when it exists");
assert(!withoutAi["00-README.md"].includes("11-AI-ELABORATION.md"), "the README index omits the AI elaboration doc when it doesn't exist");

const emptyAi = buildProjectKit(sampleIdea, { aiElaboration: "   " });
assert(Object.keys(emptyAi).length === 11, "a whitespace-only aiElaboration is treated as absent, not included");

await fs.unlink(generatorTmp).catch(() => {});
await fs.unlink(kitTmp).catch(() => {});

console.log(failures === 0 ? "\nAll planning-kit checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
