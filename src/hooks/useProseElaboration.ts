import { useCallback, useEffect, useState } from "react";
import { renderSection, type SectionRequest } from "@/engine/prose/ProseProvider";
import { isWebllmModelCached, onWebllmDownloadProgress, webllmProvider, webllmSupported } from "@/engine/prose/providers/webllmProvider";
import { chromeBuiltinProvider } from "@/engine/prose/providers/chromeBuiltinProvider";
import { ollamaProvider } from "@/engine/prose/providers/ollamaProvider";
import { checkOnDeviceAssistStatus } from "@/utils/onDeviceAi";

export type ProseStatus = "unsupported" | "downloadable" | "downloading" | "ready";
type ElaborationState = "idle" | "loading" | "downloading" | "done" | "failed";

// Priority order: P1 WebLLM (primary enhanced path) -> P2 Chrome built-in (demoted, low
// real-world availability) -> P3 Ollama (opt-in power mode). P0/template isn't in this
// list — renderSection() falls back to it automatically via req.fallbackText.
const PROVIDERS = [webllmProvider, chromeBuiltinProvider, ollamaProvider];

async function computeStatus(): Promise<ProseStatus> {
  if (webllmSupported()) {
    return (await isWebllmModelCached()) ? "ready" : "downloadable";
  }
  const chromeStatus = await checkOnDeviceAssistStatus();
  if (chromeStatus === "ready" || chromeStatus === "downloadable" || chromeStatus === "downloading") return chromeStatus;
  if (await ollamaProvider.available()) return "ready";
  return "unsupported";
}

/**
 * UI-facing hook driving the full ProseProvider ladder (WebLLM -> Chrome built-in ->
 * Ollama -> template fallback), replacing the previous Chrome-only useOnDeviceAi.ts as
 * the Project Detail "Elaborate" button's implementation. useOnDeviceAi.ts itself is
 * untouched (still directly exercised by scripts/verify-on-device-ai.mjs, and now also
 * reachable indirectly via chromeBuiltinProvider.ts).
 */
export function useProseElaboration() {
  const [status, setStatus] = useState<ProseStatus | "checking">("checking");
  const [elaboration, setElaboration] = useState<string | null>(null);
  const [elaborationState, setElaborationState] = useState<ElaborationState>("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    computeStatus().then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const elaborate = useCallback(async (facts: Record<string, unknown>): Promise<string | null> => {
    setElaborationState("loading");
    setDownloadProgress(0);
    const unsubscribe = onWebllmDownloadProgress((loaded) => {
      setDownloadProgress(loaded);
      setElaborationState(loaded < 1 ? "downloading" : "loading");
    });

    try {
      const req: SectionRequest = { section: "idea-elaboration", facts, fallbackText: "" };
      const result = await renderSection(req, PROVIDERS);
      if (result.usedFallback) {
        setElaborationState("failed");
        return null;
      }
      setElaboration(result.text);
      setProviderUsed(result.providerId);
      setElaborationState("done");
      setStatus("ready");
      return result.text;
    } catch {
      setElaborationState("failed");
      return null;
    } finally {
      unsubscribe();
    }
  }, []);

  const reset = useCallback(() => {
    setElaboration(null);
    setElaborationState("idle");
  }, []);

  return { status, elaboration, elaborationState, downloadProgress, providerUsed, elaborate, reset };
}
