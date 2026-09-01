import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SRC_DIR = path.join(root, "src");

/**
 * Hard, permanent ban (CLAUDE.md "Non-negotiable"): any paid or cloud LLM/AI API,
 * anywhere in src/, ever. This is a static text scan, not a runtime sandbox — it
 * catches the SDK imports and hostnames a real integration would need, not every
 * conceivable obfuscation. That's the same bar the rest of this repo's "verify"
 * scripts hold (deterministic, offline, no test framework), not a security boundary.
 */
const BANNED_PATTERNS = [
  { pattern: /\bopenai\b/i, label: "openai" },
  { pattern: /\banthropic\b/i, label: "anthropic" },
  { pattern: /generativelanguage/i, label: "generativelanguage (Gemini API)" },
  { pattern: /api\.anthropic/i, label: "api.anthropic" },
  { pattern: /api\.openai/i, label: "api.openai" }
];

/**
 * Explicitly permitted per CLAUDE.md's split rule: on-device / local-only inference.
 * Not used to suppress a match above (none of the banned patterns can legitimately
 * match these) — documented here so the intent is visible next to the ban list, and
 * so a future addition to BANNED_PATTERNS doesn't have to rediscover this reasoning.
 *
 * Verified directly from the installed @mlc-ai/web-llm@0.2.84 package's own
 * prebuiltAppConfig (not a guess): model weights come from "huggingface.co"
 * (e.g. https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC), and the
 * compiled model library (.wasm) comes from
 * "raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs". Both are one-time,
 * cached-thereafter, model-file-only downloads — never user data.
 */
const ALLOWED_ON_DEVICE_MARKERS = ["localhost", "127.0.0.1", "huggingface.co", "raw.githubusercontent.com"];

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(SRC_DIR);
let failures = 0;

for (const file of files) {
  const content = await fs.readFile(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    for (const { pattern, label } of BANNED_PATTERNS) {
      if (pattern.test(line)) {
        failures++;
        console.error(`FAIL: ${path.relative(root, file)}:${i + 1} references "${label}" — ${line.trim()}`);
      }
    }
  });
}

if (failures === 0) {
  console.log(`OK:   scanned ${files.length} files under src/ — zero paid/cloud LLM API references`);
  console.log(`OK:   permitted on-device/local markers (not banned): ${ALLOWED_ON_DEVICE_MARKERS.join(", ")}`);
}

console.log(failures === 0 ? "\nAll no-cloud-AI checks passed." : `\n${failures} check(s) FAILED — any paid/cloud LLM API is a hard, permanent ban. See CLAUDE.md.`);
process.exit(failures === 0 ? 0 : 1);
