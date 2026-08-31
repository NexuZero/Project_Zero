import type { AiRequired, ProjectIdea } from "@/types";

const FALLBACK_RATIONALE =
  "This name was generated in an earlier version of Project Zero, so a detailed rationale isn't available for it.";

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function aiRequiredNote(aiRequired: AiRequired): string {
  switch (aiRequired) {
    case "Yes":
      return "AI is a required part of this build, not an optional add-on.";
    case "No":
      return "No AI is required — this is a fully deterministic, rule-based build.";
    case "Optional":
      return "AI can enhance this build, but a working version doesn't require it.";
  }
}

/** Renders a ProjectIdea as a complete Markdown project brief (spec §11 — README-shaped, expanded). */
export function toMarkdown(idea: ProjectIdea): string {
  return `# ${idea.name}

> ${idea.tagline}

${idea.githubDescription}

## Naming Rationale

${idea.namingRationale || FALLBACK_RATIONALE}

## Snapshot

| | |
|---|---|
| Field | ${idea.fieldName} |
| Niche | ${idea.nicheLabel} |
| Category | ${idea.categoryName} |
| Target users | ${idea.targetUsers} |

## Problem

${idea.whyItShouldExist}

## Solution

${idea.solution}

## Scope

### MVP / v1
${bulletList(idea.mvpFeatures)}

### Core concept
${bulletList(idea.coreFeatures)}

### Deferred / future
${bulletList(idea.futureFeatures)}

## Tech Stack

${bulletList(idea.techStack)}

## Effort & Difficulty

${"●".repeat(idea.difficulty)}${"○".repeat(5 - idea.difficulty)} — difficulty ${idea.difficulty}/5, estimated as a **${idea.buildSize}** build.

${aiRequiredNote(idea.aiRequired)}

## Open Source & Community Potential

| | |
|---|---|
| Open source potential | ${idea.openSourcePotential} |
| Community value | ${idea.communityValue} |

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Triggers a browser download of the idea as a `.md` file. DOM concern, kept out of `toMarkdown`. */
export function downloadMarkdown(idea: ProjectIdea): void {
  const content = toMarkdown(idea);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(idea.name)}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
