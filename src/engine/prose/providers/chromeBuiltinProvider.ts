import { checkOnDeviceAssistStatus, elaborateIdeaWithOnDeviceAi, type OnDeviceElaborationInput } from "@/utils/onDeviceAi";
import type { ProseProvider, SectionRequest } from "../ProseProvider";

/**
 * P2 — the already-shipped Chrome built-in Prompt API (Gemini Nano), refit behind the
 * shared ProseProvider interface. No behavior change to src/utils/onDeviceAi.ts itself —
 * this is a thin adapter, demoted to a lower-priority rung than WebLLM (P1) since Chrome's
 * on-device model availability is low in practice (desktop-Chrome-only, behind a flag/
 * origin trial as of this writing).
 *
 * Honest limitation: elaborateIdeaWithOnDeviceAi() was built for one specific shape (an
 * idea elaboration paragraph), not arbitrary named sections. This adapter only serves
 * requests whose `facts` actually carry that shape — for any other section it declines
 * (throws), and the ladder in renderSection() moves on to the next provider or the
 * template fallback. That's more honest than pretending this narrow function can render
 * anything.
 */

function asElaborationInput(facts: Record<string, unknown>): OnDeviceElaborationInput | null {
  if (
    typeof facts.name === "string" &&
    typeof facts.tagline === "string" &&
    typeof facts.whyItShouldExist === "string" &&
    typeof facts.solution === "string" &&
    Array.isArray(facts.mvpFeatures) &&
    facts.mvpFeatures.every((f) => typeof f === "string")
  ) {
    return { name: facts.name, tagline: facts.tagline, whyItShouldExist: facts.whyItShouldExist, solution: facts.solution, mvpFeatures: facts.mvpFeatures };
  }
  return null;
}

export const chromeBuiltinProvider: ProseProvider = {
  id: "chrome-builtin",
  async available() {
    const status = await checkOnDeviceAssistStatus();
    return status === "ready" || status === "downloadable";
  },
  async render(req: SectionRequest): Promise<string> {
    const input = asElaborationInput(req.facts);
    if (!input) {
      throw new Error("chrome-builtin: this section's facts don't match the idea-elaboration shape this provider supports");
    }
    const result = await elaborateIdeaWithOnDeviceAi(input);
    if (result === null) throw new Error("chrome-builtin: elaboration failed or produced no usable output");
    return result;
  }
};
