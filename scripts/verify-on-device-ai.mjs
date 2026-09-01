import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function bundleFresh() {
  const result = await esbuild.build({
    entryPoints: [path.join(root, "src/utils/onDeviceAi.ts")],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    target: "es2022",
    alias: { "@": path.join(root, "src") }
  });
  const tmpFile = path.join(root, "scripts", `.verify-ai-bundle-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  await fs.writeFile(tmpFile, result.outputFiles[0].text);
  const mod = await import(tmpFile);
  return { mod, tmpFile };
}

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK:   ${message}`);
  }
}

const SAMPLE_INPUT = {
  name: "TestIdea",
  tagline: "A test tagline",
  whyItShouldExist: "A test problem statement for verification purposes only.",
  solution: "A test solution statement for verification purposes only.",
  mvpFeatures: ["Feature One", "Feature Two"]
};

const tmpFiles = [];

// ---- 1. No LanguageModel global at all (the real, common case: this sandbox,
// any CI runner, any non-Chrome-desktop browser) — must resolve promptly, never throw.
{
  delete globalThis.LanguageModel;
  const { mod, tmpFile } = await bundleFresh();
  tmpFiles.push(tmpFile);

  const start = Date.now();
  const status = await mod.checkOnDeviceAssistStatus();
  const statusElapsed = Date.now() - start;
  assert(status === "unsupported", `checkOnDeviceAssistStatus() with no global returns "unsupported" (got "${status}")`);
  assert(statusElapsed < 500, `checkOnDeviceAssistStatus() with no global resolves promptly (${statusElapsed}ms)`);

  const elabStart = Date.now();
  const result = await mod.elaborateIdeaWithOnDeviceAi(SAMPLE_INPUT);
  const elabElapsed = Date.now() - elabStart;
  assert(result === null, "elaborateIdeaWithOnDeviceAi() with no global resolves to null");
  assert(elabElapsed < 500, `elaborateIdeaWithOnDeviceAi() with no global resolves promptly (${elabElapsed}ms)`);
}

// ---- 2. availability() reports each documented state correctly.
{
  const cases = [
    ["available", "ready"],
    ["downloadable", "downloadable"],
    ["downloading", "downloading"],
    ["unavailable", "unavailable"]
  ];
  for (const [reported, expected] of cases) {
    globalThis.LanguageModel = { availability: async () => reported, create: async () => { throw new Error("not used in this test"); } };
    const { mod, tmpFile } = await bundleFresh();
    tmpFiles.push(tmpFile);
    const status = await mod.checkOnDeviceAssistStatus();
    assert(status === expected, `availability() reporting "${reported}" maps to status "${expected}" (got "${status}")`);
  }
  delete globalThis.LanguageModel;
}

// ---- 3. availability() throwing is treated as "unsupported", not a crash.
{
  globalThis.LanguageModel = {
    availability: async () => {
      throw new Error("simulated failure");
    },
    create: async () => {
      throw new Error("not used");
    }
  };
  const { mod, tmpFile } = await bundleFresh();
  tmpFiles.push(tmpFile);
  const status = await mod.checkOnDeviceAssistStatus();
  assert(status === "unsupported", `a throwing availability() is treated as "unsupported", not surfaced as an error (got "${status}")`);
  delete globalThis.LanguageModel;
}

// ---- 4. THE critical safety contract: a session whose prompt() hangs forever must
// still resolve to null within timeoutMs, not hang the caller indefinitely.
{
  let destroyCalled = false;
  globalThis.LanguageModel = {
    availability: async () => "available",
    create: async () => ({
      prompt: () => new Promise(() => {}), // never resolves — simulates a stuck/misbehaving session
      promptStreaming: () => {
        throw new Error("not used");
      },
      destroy() {
        destroyCalled = true;
      }
    })
  };
  const { mod, tmpFile } = await bundleFresh();
  tmpFiles.push(tmpFile);

  const timeoutMs = 300;
  const start = Date.now();
  const result = await mod.elaborateIdeaWithOnDeviceAi(SAMPLE_INPUT, { timeoutMs });
  const elapsed = Date.now() - start;

  assert(result === null, "a hanging session.prompt() resolves to null, not an unhandled rejection or a hang");
  assert(elapsed < timeoutMs + 500, `a hanging session.prompt() is abandoned close to the ${timeoutMs}ms timeout, not left hanging (took ${elapsed}ms)`);
  assert(destroyCalled, "the hung session's destroy() is still called (cleanup happens even after a timeout)");
  delete globalThis.LanguageModel;
}

// ---- 4b. THE regression this file exists to prevent: a slow-but-legitimate model
// download (first-use only, can take minutes) must NOT be cut short by the much
// shorter inference (session.prompt()) timeout — the download phase gets its own,
// separately-configurable timeout.
{
  globalThis.LanguageModel = {
    availability: async () => "available",
    create: () =>
      new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              prompt: async () => "A perfectly good elaboration paragraph, long enough to pass the length check easily.",
              promptStreaming: () => {
                throw new Error("not used");
              },
              destroy() {}
            }),
          250
        ); // slower than the short inference timeoutMs below, but within downloadTimeoutMs
      })
  };
  const { mod, tmpFile } = await bundleFresh();
  tmpFiles.push(tmpFile);

  const result = await mod.elaborateIdeaWithOnDeviceAi(SAMPLE_INPUT, { timeoutMs: 50, downloadTimeoutMs: 2000 });
  assert(
    result !== null,
    "a 250ms model download is NOT cut short by a 50ms inference timeoutMs — downloadTimeoutMs governs the create() phase, not timeoutMs (this was the real bug: both phases shared one 15s timeout, so a real multi-minute first-download always failed)"
  );
  delete globalThis.LanguageModel;
}

// ---- 4c. A download that genuinely hangs is still bounded — by downloadTimeoutMs,
// not left to hang forever just because it's a separate budget from inference.
{
  globalThis.LanguageModel = {
    availability: async () => "available",
    create: () => new Promise(() => {}) // never resolves — simulates a stuck download
  };
  const { mod, tmpFile } = await bundleFresh();
  tmpFiles.push(tmpFile);

  const downloadTimeoutMs = 300;
  const start = Date.now();
  const result = await mod.elaborateIdeaWithOnDeviceAi(SAMPLE_INPUT, { downloadTimeoutMs });
  const elapsed = Date.now() - start;
  assert(result === null, "a hanging model download resolves to null, not an unhandled rejection or a hang");
  assert(elapsed < downloadTimeoutMs + 500, `a hanging model download is abandoned close to downloadTimeoutMs (${downloadTimeoutMs}ms), not left hanging (took ${elapsed}ms)`);
  delete globalThis.LanguageModel;
}

// ---- 5. Degenerate (too-short) output is treated as no result, not returned as-is.
{
  globalThis.LanguageModel = {
    availability: async () => "available",
    create: async () => ({
      prompt: async () => "ok", // 2 chars — below MIN_OUTPUT_LENGTH
      promptStreaming: () => {
        throw new Error("not used");
      },
      destroy() {}
    })
  };
  const { mod, tmpFile } = await bundleFresh();
  tmpFiles.push(tmpFile);
  const result = await mod.elaborateIdeaWithOnDeviceAi(SAMPLE_INPUT);
  assert(result === null, "a degenerate (too-short) model response is treated as no result, never handed to the caller as real content");
  delete globalThis.LanguageModel;
}

// ---- 6. A real-shaped, valid response is returned as-is (trimmed).
{
  const goodResponse = "  This idea connects a real problem to a real solution in a few sentences, as requested.  ";
  globalThis.LanguageModel = {
    availability: async () => "available",
    create: async () => ({
      prompt: async () => goodResponse,
      promptStreaming: () => {
        throw new Error("not used");
      },
      destroy() {}
    })
  };
  const { mod, tmpFile } = await bundleFresh();
  tmpFiles.push(tmpFile);
  const result = await mod.elaborateIdeaWithOnDeviceAi(SAMPLE_INPUT);
  assert(result === goodResponse.trim(), "a valid, well-formed model response is returned trimmed, unmodified otherwise");
  delete globalThis.LanguageModel;
}

for (const f of tmpFiles) {
  await fs.unlink(f).catch(() => {});
}

console.log(failures === 0 ? "\nAll on-device-AI safety checks passed." : `\n${failures} check(s) FAILED.`);
console.log(
  "\nNote: this verifies the fallback and timeout/safety contract only — real Gemini Nano availability,\n" +
  "latency, and output quality cannot be exercised in this environment and are not claimed here."
);
process.exit(failures === 0 ? 0 : 1);
