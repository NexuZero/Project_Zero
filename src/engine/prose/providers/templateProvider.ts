import type { ProseProvider } from "../ProseProvider";

/**
 * P0 — the permanent default and fallback, never removed. Wraps the kit builders'
 * existing deterministic output as-is: kit output with only P0 selected must be
 * byte-identical to Stage A's output, which is what makes every other provider in the
 * ladder strictly additive polish rather than a replacement.
 */
export const templateProvider: ProseProvider = {
  id: "template",
  async available() {
    return true;
  },
  async render(req) {
    return req.fallbackText;
  }
};
