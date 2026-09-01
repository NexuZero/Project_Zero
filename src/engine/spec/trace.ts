import type { Decision } from "@/types";

export interface TraceRecorder {
  record(decision: Omit<Decision, "id">): void;
  decisions(): Decision[];
}

/** One recorder per generated idea. Capture at the point of the roll — never re-derive after the fact. */
export function createTraceRecorder(): TraceRecorder {
  const decisions: Decision[] = [];

  return {
    record(decision: Omit<Decision, "id">): void {
      decisions.push({ id: `D-${String(decisions.length + 1).padStart(3, "0")}`, ...decision });
    },
    decisions(): Decision[] {
      return decisions;
    }
  };
}
