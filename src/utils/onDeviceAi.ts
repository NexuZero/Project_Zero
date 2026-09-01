/**
 * Optional, on-device-only enhancement layer for the Planning Kit export.
 * Wraps Chrome's on-device Prompt API (Gemini Nano) — never the core engine's
 * dependency, never required for anything else in the app to work. Every
 * export here is designed to never throw and to always resolve, even when
 * the browser API is absent, broken, or hangs: unsupported/unavailable browsers
 * (the overwhelming majority, including any non-Chrome-desktop environment)
 * are a first-class, fully-expected outcome, not an error case.
 */

export type OnDeviceAssistStatus = "unsupported" | "unavailable" | "downloadable" | "downloading" | "ready";

const CHECK_TIMEOUT_MS = 3000;
// The model download (first use only) can be hundreds of MB to a few GB —
// give it minutes, not seconds. Inference against an already-downloaded
// model should be fast; that phase gets its own, much shorter timeout.
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_ELABORATION_TIMEOUT_MS = 15000;
const MIN_OUTPUT_LENGTH = 20;
const MAX_OUTPUT_LENGTH = 1200;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("on-device AI operation timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Never throws. Resolves within ~3s even if the browser API stalls. */
export async function checkOnDeviceAssistStatus(): Promise<OnDeviceAssistStatus> {
  if (typeof LanguageModel === "undefined") return "unsupported";

  try {
    const availability = await withTimeout(
      LanguageModel.availability({
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
      }),
      CHECK_TIMEOUT_MS
    );
    if (availability === "available") return "ready";
    if (availability === "downloadable") return "downloadable";
    if (availability === "downloading") return "downloading";
    return "unavailable";
  } catch {
    // Any unexpected failure (including a timeout) is treated the same as "not
    // supported here" — safer than surfacing a disabled button for a state that
    // shouldn't normally occur when the global is actually present.
    return "unsupported";
  }
}

export interface OnDeviceElaborationInput {
  name: string;
  tagline: string;
  whyItShouldExist: string;
  solution: string;
  mvpFeatures: string[];
}

function buildPrompt(input: OnDeviceElaborationInput): string {
  const firstFeature = input.mvpFeatures[0] ?? "the core feature";
  return `You are a technical writing assistant. Rewrite/elaborate the following into ONE short paragraph (3-5 sentences) that connects the problem to the solution and the first MVP feature. Do not invent any new facts, features, technologies, numbers, or claims beyond what is given below. If unsure, stay closer to the given text rather than adding detail.

Problem: ${input.whyItShouldExist}
Solution: ${input.solution}
First MVP feature: ${firstFeature}

Write only the paragraph, no heading, no preamble.`;
}

/**
 * Never throws. Returns null on: unsupported, availability failure, session-create
 * failure, prompt failure, timeout, or degenerate (too-short) output.
 */
export async function elaborateIdeaWithOnDeviceAi(
  input: OnDeviceElaborationInput,
  opts: { timeoutMs?: number; downloadTimeoutMs?: number; onDownloadProgress?: (loaded: number) => void } = {}
): Promise<string | null> {
  if (typeof LanguageModel === "undefined") return null;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_ELABORATION_TIMEOUT_MS;
  const downloadTimeoutMs = opts.downloadTimeoutMs ?? DEFAULT_DOWNLOAD_TIMEOUT_MS;

  let session: LanguageModelSession | undefined;
  try {
    session = await withTimeout(
      LanguageModel.create({
        monitor: opts.onDownloadProgress
          ? (m) => {
              m.addEventListener("downloadprogress", (e) => {
                opts.onDownloadProgress?.(e.loaded);
              });
            }
          : undefined
      }),
      downloadTimeoutMs
    );

    const raw = await withTimeout(session.prompt(buildPrompt(input)), timeoutMs);
    const trimmed = raw.trim();
    if (trimmed.length < MIN_OUTPUT_LENGTH) return null;
    return trimmed.length > MAX_OUTPUT_LENGTH ? `${trimmed.slice(0, MAX_OUTPUT_LENGTH)}…` : trimmed;
  } catch {
    return null;
  } finally {
    session?.destroy();
  }
}
