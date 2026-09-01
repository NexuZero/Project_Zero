/**
 * The actual inference worker — all WebLLM computation happens here, never on the main
 * thread (mandatory: unblocked-UI is not optional for a multi-minute first-load model
 * download plus per-token generation). Loaded from webllmProvider.ts via
 * `new Worker(new URL("../webllm.worker.ts", import.meta.url), { type: "module" })`,
 * Vite's native worker pattern — no vite.config.ts changes needed for this form.
 *
 * Scoped by tsconfig.worker.json (WebWorker lib, not DOM) — this file must never import
 * anything that assumes a Window/DOM global.
 */
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// WebWorkerMLCEngineHandler's constructor takes no arguments — it creates and owns its
// own internal MLCEngine (exposed as `handler.engine` if ever needed). The package's own
// doc-comment example shows `new WebWorkerMLCEngineHandler(engine)`, which doesn't match
// its actual declared `constructor()` signature in @mlc-ai/web-llm@0.2.84 — verified
// against the installed package's real .d.ts, not the stale doc comment.
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
