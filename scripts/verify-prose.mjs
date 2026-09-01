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

const { mod: groundingMod, tmpFile: groundingTmp } = await bundleAndImport("src/engine/prose/grounding.ts", ".verify-prose-grounding-bundle.mjs");
const { mod: providerMod, tmpFile: providerTmp } = await bundleAndImport("src/engine/prose/ProseProvider.ts", ".verify-prose-provider-bundle.mjs");
const { validateGrounding } = groundingMod;
const { renderSection, createRenderStats } = providerMod;

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK:   ${message}`);
  }
}

const SAMPLE_FACTS = {
  name: "TaskFlow",
  tagline: "Cut the friction out of task tracking.",
  whyItShouldExist: "Teams lose track of who owns what.",
  solution: "TaskFlow gives every team a single, always-current view of ownership.",
  mvpFeatures: ["Task list", "Ownership view"]
};

// ---- 1. Grounding validator ----
assert(
  validateGrounding("TaskFlow gives every team a single, always-current view of ownership.", SAMPLE_FACTS).ok,
  "text built entirely from real facts passes grounding"
);
assert(
  validateGrounding("This uses Quantum Blockchain Encryption to secure your data.", SAMPLE_FACTS).ok === false,
  "an invented capitalized technology name absent from FACTS fails grounding"
);
assert(
  validateGrounding("This has been used by 50000 companies worldwide.", SAMPLE_FACTS).ok === false,
  "an invented, unbacked number fails grounding"
);
assert(
  validateGrounding("This tool runs as a Web Worker and follows Best Practices.", SAMPLE_FACTS).ok,
  "generic technical vocabulary (Web Worker, Best Practices) is allowlisted even though not in FACTS"
);
const offending = validateGrounding("Built with Fictional Framework for TaskFlow.", SAMPLE_FACTS);
assert(offending.ok === false && offending.offendingToken === "Fictional Framework", "the offending token is correctly identified");

// ---- 2. renderSection: no providers available -> template fallback ----
{
  const stats = createRenderStats();
  const unavailableProvider = { id: "test-unavailable", available: async () => false, render: async () => "should never be called" };
  const result = await renderSection({ section: "test", facts: SAMPLE_FACTS, fallbackText: "FALLBACK TEXT" }, [unavailableProvider], stats);
  assert(result.usedFallback === true && result.text === "FALLBACK TEXT" && result.providerId === "template", "no available provider -> falls back to template text");
  assert(stats.total === 1 && stats.fallback === 1, "render stats track total and fallback counts correctly");
}

// ---- 3. renderSection: available provider throws -> falls through to fallback ----
{
  const throwingProvider = { id: "test-throwing", available: async () => true, render: async () => { throw new Error("boom"); } };
  const result = await renderSection({ section: "test", facts: SAMPLE_FACTS, fallbackText: "FALLBACK TEXT" }, [throwingProvider]);
  assert(result.usedFallback === true, "a provider that throws never propagates the error — falls back to template instead");
}

// ---- 4. renderSection: available provider, grounded output -> used directly ----
{
  const goodProvider = { id: "test-good", available: async () => true, render: async () => "TaskFlow gives every team ownership clarity." };
  const result = await renderSection({ section: "test", facts: SAMPLE_FACTS, fallbackText: "FALLBACK TEXT" }, [goodProvider]);
  assert(result.usedFallback === false && result.providerId === "test-good" && result.text.includes("TaskFlow"), "a grounded provider's output is used as-is, not the fallback");
}

// ---- 5. renderSection: ungrounded once, then grounded on retry -> retry succeeds ----
{
  let callCount = 0;
  const retryProvider = {
    id: "test-retry",
    available: async () => true,
    render: async () => {
      callCount++;
      return callCount === 1 ? "Built using Nonexistent Cloud Platform." : "TaskFlow, built for teams.";
    }
  };
  const result = await renderSection({ section: "test", facts: SAMPLE_FACTS, fallbackText: "FALLBACK TEXT" }, [retryProvider]);
  assert(callCount === 2, "an ungrounded first attempt triggers exactly one retry");
  assert(result.usedFallback === false && result.text === "TaskFlow, built for teams.", "a grounded retry is used, not the fallback");
}

// ---- 6. renderSection: ungrounded on both attempts -> falls through to next provider ----
{
  const alwaysUngroundedProvider = { id: "test-always-bad", available: async () => true, render: async () => "Powered by Imaginary Engine X9000." };
  const secondProvider = { id: "test-second", available: async () => true, render: async () => "TaskFlow helps teams stay aligned." };
  const result = await renderSection({ section: "test", facts: SAMPLE_FACTS, fallbackText: "FALLBACK TEXT" }, [alwaysUngroundedProvider, secondProvider]);
  assert(result.providerId === "test-second" && result.usedFallback === false, "a provider that stays ungrounded after retry is skipped in favor of the next provider in the ladder");
}

// ---- 7. renderSection: every provider fails -> template fallback, never an unhandled rejection ----
{
  const alwaysUngroundedProvider = { id: "test-bad-a", available: async () => true, render: async () => "Uses Made Up Tech Stack." };
  const alsoBadProvider = { id: "test-bad-b", available: async () => true, render: async () => "Runs on Invented Runtime 3000." };
  const result = await renderSection({ section: "test", facts: SAMPLE_FACTS, fallbackText: "FALLBACK TEXT" }, [alwaysUngroundedProvider, alsoBadProvider]);
  assert(result.usedFallback === true && result.text === "FALLBACK TEXT", "when every provider in the ladder fails or stays ungrounded, the template fallback is used");
}

await fs.unlink(groundingTmp).catch(() => {});
await fs.unlink(providerTmp).catch(() => {});

console.log(failures === 0 ? "\nAll prose-layer checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
