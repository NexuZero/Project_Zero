import { validateGrounding } from "./grounding";

/**
 * One prose section to render. `facts` is the exact fact bundle this section may draw
 * from — the grounding validator checks the provider's output against it. `fallbackText`
 * is the already-generated deterministic (P0/template) text for this section — always
 * present, always correct, used whenever no provider is available or every attempt to
 * ground the model's output fails.
 */
export interface SectionRequest {
  section: string;
  facts: Record<string, unknown>;
  style?: string;
  fallbackText: string;
}

export interface ProseProvider {
  id: string;
  available(): Promise<boolean>;
  render(req: SectionRequest): Promise<string>;
}

export interface RenderResult {
  text: string;
  providerId: string;
  usedFallback: boolean;
}

/** Running total across a kit export session — surfaced in the kit README per the brief ("N of M sections used the standard template"). */
export interface RenderStats {
  total: number;
  fallback: number;
}

export function createRenderStats(): RenderStats {
  return { total: 0, fallback: 0 };
}

async function safeAvailable(provider: ProseProvider): Promise<boolean> {
  try {
    return await provider.available();
  } catch {
    return false;
  }
}

async function safeRender(provider: ProseProvider, req: SectionRequest): Promise<string | null> {
  try {
    return await provider.render(req);
  } catch {
    return null;
  }
}

/**
 * Tries each provider in priority order (first available one wins), validates its
 * output against `req.facts` (grounding.ts), retries once naming the offending token if
 * ungrounded, and falls back to `req.fallbackText` if every provider is unavailable, every
 * attempt fails, or every attempt stays ungrounded. `providers` should be given in
 * priority order (e.g. [webllmProvider, chromeBuiltinProvider, ollamaProvider]) — the
 * template/P0 fallback is NOT one of these; it's built into this function via
 * `req.fallbackText`, since P0 has nothing to "try", it's simply always correct.
 */
export async function renderSection(req: SectionRequest, providers: ProseProvider[], stats?: RenderStats): Promise<RenderResult> {
  if (stats) stats.total++;

  for (const provider of providers) {
    if (!(await safeAvailable(provider))) continue;

    const first = await safeRender(provider, req);
    if (first !== null) {
      const grounded = validateGrounding(first, req.facts);
      if (grounded.ok) return { text: first, providerId: provider.id, usedFallback: false };

      const retryReq: SectionRequest = {
        ...req,
        style: `${req.style ?? ""} Do not mention "${grounded.offendingToken}" or any fact not present in FACTS.`.trim()
      };
      const second = await safeRender(provider, retryReq);
      if (second !== null && validateGrounding(second, req.facts).ok) {
        return { text: second, providerId: provider.id, usedFallback: false };
      }
    }
    // This provider was unavailable, failed outright, or stayed ungrounded after one
    // retry — move to the next provider in the ladder rather than giving up entirely.
  }

  if (stats) stats.fallback++;
  return { text: req.fallbackText, providerId: "template", usedFallback: true };
}
