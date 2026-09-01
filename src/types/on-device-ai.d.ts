/**
 * Minimal, hand-written ambient types for Chrome's on-device Prompt API
 * (window.LanguageModel / Gemini Nano). Deliberately narrow — only the 5
 * members this app actually calls, verified against the current API surface.
 * This is experimental, Chrome-desktop-only browser surface with no stable
 * community @types package worth pinning to; these ~15 lines are easier to
 * keep accurate than a third-party guess at a still-moving API.
 */

interface LanguageModelAvailabilityOptions {
  expectedInputs?: { type: string; languages?: string[] }[];
  expectedOutputs?: { type: string; languages?: string[] }[];
}

type LanguageModelAvailability = "unavailable" | "downloadable" | "downloading" | "available";

interface LanguageModelDownloadProgressEvent extends Event {
  loaded: number;
}

interface LanguageModelSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): AsyncIterable<string>;
  destroy(): void;
}

interface LanguageModelCreateOptions {
  monitor?: (m: {
    addEventListener(type: "downloadprogress", listener: (e: LanguageModelDownloadProgressEvent) => void): void;
  }) => void;
}

interface LanguageModelStatic {
  availability(options?: LanguageModelAvailabilityOptions): Promise<LanguageModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

declare const LanguageModel: LanguageModelStatic | undefined;
