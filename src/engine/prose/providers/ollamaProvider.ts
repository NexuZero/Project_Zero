import type { ProseProvider, SectionRequest } from "../ProseProvider";

/**
 * P3 — optional power-user mode: a locally-installed Ollama instance. Allowlisted
 * explicitly in scripts/verify-no-cloud-ai.mjs (that's why "localhost" is on that
 * script's permitted-marker list) — this is a local HTTP call, never a cloud one.
 *
 * Setup note (document this for users, don't let them discover it in production):
 * Ollama's default config rejects cross-origin requests, so the browser tab running
 * this app needs `OLLAMA_ORIGINS` set to allow it — e.g.
 * `OLLAMA_ORIGINS=http://localhost:5173 ollama serve` (adjust the origin/port to match
 * wherever this app is actually served from). Without it, `available()` below will
 * correctly report false (the fetch fails) rather than hang or crash.
 */

const OLLAMA_BASE_URL = "http://localhost:11434";
const FETCH_TIMEOUT_MS = 1500;

let cachedModel: string | null | undefined; // undefined = not checked yet, null = checked, none found

async function pickLocalModel(): Promise<string | null> {
  if (cachedModel !== undefined) return cachedModel;
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      cachedModel = null;
      return null;
    }
    const data = (await res.json()) as { models?: { name: string }[] };
    cachedModel = data.models?.[0]?.name ?? null;
    return cachedModel;
  } catch {
    cachedModel = null;
    return null;
  }
}

function buildPrompt(req: SectionRequest): string {
  return `You render project documentation. You may only restate, organise, and explain facts present in FACTS. You may not introduce any entity, number, technology, or capability absent from FACTS. If FACTS is insufficient for the requested section, output exactly: INSUFFICIENT.

FACTS: ${JSON.stringify(req.facts)}
SECTION: ${req.section}
STYLE: ${req.style ?? "technical, declarative, 120-200 words, no marketing language, no hedging, prefer concrete nouns from FACTS."}

Write only the section's prose, no heading, no preamble.`;
}

export const ollamaProvider: ProseProvider = {
  id: "ollama",
  async available() {
    return (await pickLocalModel()) !== null;
  },
  async render(req: SectionRequest): Promise<string> {
    const model = await pickLocalModel();
    if (!model) throw new Error("ollama: no local model available");

    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: buildPrompt(req), stream: false, options: { temperature: 0, seed: 42 } })
    });
    if (!res.ok) throw new Error(`ollama: HTTP ${res.status}`);

    const data = (await res.json()) as { response?: string };
    const text = (data.response ?? "").trim();
    if (text === "" || text === "INSUFFICIENT") throw new Error("ollama: no usable output for this section");
    return text;
  }
};
