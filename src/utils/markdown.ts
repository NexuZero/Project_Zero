import type { ProjectIdea } from "@/types";

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

/** Renders a ProjectIdea as Markdown shaped like the start of a GitHub README (spec §11). */
export function toMarkdown(idea: ProjectIdea): string {
  return `# ${idea.name}

> ${idea.tagline}

${idea.githubDescription}

## Problem

${idea.whyItShouldExist}

## Solution

${idea.solution}

## Features

### Core
${bulletList(idea.coreFeatures)}

### MVP
${bulletList(idea.mvpFeatures)}

### Future
${bulletList(idea.futureFeatures)}

## Tech Stack

${bulletList(idea.techStack)}

## Roadmap

1. Ship the MVP feature set above.
2. Gather feedback from ${idea.targetUsers.toLowerCase()}.
3. Layer in the future features once the core loop is proven.

## Details

| | |
|---|---|
| Field | ${idea.fieldName} |
| Niche | ${idea.nicheLabel} |
| Difficulty | ${"●".repeat(idea.difficulty)}${"○".repeat(5 - idea.difficulty)} |
| Build size | ${idea.buildSize} |
| AI required | ${idea.aiRequired} |
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
