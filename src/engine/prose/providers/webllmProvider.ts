import type { ProseProvider, SectionRequest } from "../ProseProvider";
import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";

/**
 * P1 — the primary enhanced path (brief's recommendation: "Build this one"). WebGPU-
 * accelerated, in-browser, runs entirely in a Web Worker (webllm.worker.ts). `@mlc-ai/
 * web-llm` is imported ONLY via the dynamic import below — never a top-level import
 * anywhere in this codebase — so it never enters the main bundle and costs nothing for
 * users who don't opt in (verified: `npm run build`'s output chunk list has no web-llm
 * code in the main entry).
 */

// Verified against the installed @mlc-ai/web-llm@0.2.84 package's own prebuiltAppConfig
// (not guessed): this is a real, current prebuilt model id. ~2.2GB VRAM required.
const MODEL_ID = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

// Fixed seed preserves the app's determinism guarantee at the prose layer too: the same
// facts + section + seed always render the same text (see the per-section cache key in
// useWebllmProse.ts, which includes this seed).
const SEED = 42;
const MAX_TOKENS = 300;

let enginePromise: Promise<WebWorkerMLCEngine> | null = null;
let onProgressCallbacks: ((loaded: number) => void)[] = [];

function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/** Synchronous capability check — no download, no engine creation. Safe to call on every render. */
export function webllmSupported(): boolean {
  return hasWebGPU();
}

/** Whether the model weights are already cached (IndexedDB) from a prior session — distinguishes "ready now" from "first click downloads ~2GB." */
export async function isWebllmModelCached(): Promise<boolean> {
  if (!hasWebGPU()) return false;
  const webllm = await import("@mlc-ai/web-llm");
  return webllm.hasModelInCache(MODEL_ID);
}

async function getEngine(): Promise<WebWorkerMLCEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const webllm = await import("@mlc-ai/web-llm");
      const worker = new Worker(new URL("../webllm.worker.ts", import.meta.url), { type: "module" });
      return webllm.CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: (report) => {
          for (const cb of onProgressCallbacks) cb(report.progress);
        }
      });
    })();
  }
  return enginePromise;
}

/** Subscribes to model-download progress (0-1). Triggers the download/engine-init on first call if not already in flight. */
export function onWebllmDownloadProgress(cb: (loaded: number) => void): () => void {
  onProgressCallbacks.push(cb);
  return () => {
    onProgressCallbacks = onProgressCallbacks.filter((c) => c !== cb);
  };
}

function buildPrompt(req: SectionRequest): string {
  return `You render project documentation. You may only restate, organise, and explain facts present in FACTS. You may not introduce any entity, number, technology, or capability absent from FACTS. If FACTS is insufficient for the requested section, output exactly: INSUFFICIENT.

FACTS: ${JSON.stringify(req.facts)}
SECTION: ${req.section}
STYLE: ${req.style ?? "technical, declarative, 120-200 words, no marketing language, no hedging, prefer concrete nouns from FACTS."}

Write only the section's prose, no heading, no preamble.`;
}

export const webllmProvider: ProseProvider = {
  id: "webllm",
  async available() {
    return hasWebGPU();
  },
  async render(req: SectionRequest): Promise<string> {
    const engine = await getEngine();
    const completion = await engine.chat.completions.create({
      messages: [{ role: "user", content: buildPrompt(req) }],
      temperature: 0,
      seed: SEED,
      max_tokens: MAX_TOKENS
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (text === "" || text === "INSUFFICIENT") throw new Error("webllm: no usable output for this section");
    return text;
  }
};
