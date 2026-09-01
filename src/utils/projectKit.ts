import JSZip from "jszip";
import { createShuffleBag } from "@/engine/templates";
import { buildIdeaSpec, hasBackend } from "@/engine/spec/ideaSpec";
import { explainOriginality } from "@/engine/scoring";
import kitPhrasingData from "@/knowledge/kit_phrasing.json";
import type { IdeaSpec, KitPhrasingMap, ProjectIdea } from "@/types";

const kitPhrasing = kitPhrasingData as KitPhrasingMap;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

// ---------------------------------------------------------------------------
// Phrasing variety — reuses the same shuffle-bag mechanism the core engine
// uses for idea copy (src/engine/templates.ts). Bags live at module scope, not
// recreated per buildProjectKit() call: a bag instantiated fresh for a single
// draw gets zero benefit from its own no-repeat guarantee. The real "batch"
// here is the sequence of kit exports across one page session, same reasoning
// as why the engine's CopyPicker lives at the per-batch level, not per-idea.
// ---------------------------------------------------------------------------

const phrasingBags = new Map<string, () => string>();

function pickPhrasing(key: string): string {
  let bag = phrasingBags.get(key);
  if (!bag) {
    bag = createShuffleBag(kitPhrasing[key] ?? [key]);
    phrasingBags.set(key, bag);
  }
  return bag();
}

// ---------------------------------------------------------------------------
// Small, local lookup tables used only to phrase generic guidance around real
// per-idea data (never to invent idea-specific facts the engine doesn't have).
// ---------------------------------------------------------------------------

const STACK_ROLE: Record<string, string> = {
  react: "UI layer",
  typescript: "type safety across the codebase",
  vite: "dev server and build tool",
  "react-dom": "renders React to the DOM",
  fastapi: "API layer",
  "express.js": "API layer",
  "express": "API layer",
  "node.js": "JavaScript runtime",
  python: "backend language",
  go: "backend language",
  rust: "backend language",
  postgresql: "primary data store",
  sqlite: "primary data store (single file, zero setup)",
  duckdb: "embedded analytics data store",
  indexeddb: "client-side storage — no backend needed",
  "web crypto api": "client-side cryptography",
  websocket: "real-time client/server messaging",
  typer: "CLI framework",
  click: "CLI framework",
  cobra: "CLI framework",
  clap: "CLI framework",
  "axe-core": "accessibility auditing engine",
  "duckdb-wasm": "in-browser analytics engine"
};

function stackRole(item: string): string {
  const key = item.toLowerCase();
  for (const [needle, role] of Object.entries(STACK_ROLE)) {
    if (key.includes(needle)) return role;
  }
  return "supporting library";
}

function isoDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toISOString().slice(0, 10);
}

function provenanceNote(spec: IdeaSpec, key: string, itemLabel: string): string {
  const tier = spec.provenance[key];
  if (tier === "axis") return `*Derived from this idea's problem text (not just its category) — ${itemLabel}.*`;
  if (tier === "category-default") return `*A category-level starting suggestion, not derived from this idea's specific text — ${itemLabel}. Adapt freely.*`;
  return "";
}

// ---------------------------------------------------------------------------
// Document builders — every one takes the derived IdeaSpec (spec.idea for the
// original ProjectIdea fields, plus spec.entities/screens/risks/decisions/
// notApplicable/validationRules/moduleSurface/tasks/provenance for everything
// Stage A's fact-expansion adds). Nothing is invented beyond generic, clearly
// labeled starting suggestions — same honesty bar as before, now with far
// more real facts backing it.
// ---------------------------------------------------------------------------

export interface ProjectKitOptions {
  /** A user-reviewed, on-device-AI-generated elaboration paragraph. Optional — see src/utils/onDeviceAi.ts. */
  aiElaboration?: string;
}

function buildReadme(spec: IdeaSpec, opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const hasAi = Boolean(opts.aiElaboration && opts.aiElaboration.trim().length > 0);
  const aiIndexLine = hasAi ? "11. [11-AI-ELABORATION.md](11-AI-ELABORATION.md) — an optional, on-device AI elaboration of this idea\n" : "";

  return `# ${idea.name} — Planning Kit

> ${idea.tagline}

**Open source potential:** ${idea.openSourcePotential} · **Community value:** ${idea.communityValue}

This is a starter planning kit for **${idea.name}**, generated offline by [Project Zero](https://github.com/NexuZero/Project_Zero) — no account, no cloud AI, nothing fabricated beyond what the idea itself already describes. It mirrors a lightweight version of a real ten-document planning process. Read in order, or jump to what you need:

1. [01-PRD.md](01-PRD.md) — what you're building and why
2. [02-TRD.md](02-TRD.md) — the tech stack, how the code is organized, and *why* each pick was made
3. [03-UIUX.md](03-UIUX.md) — a design-system and screen-inventory starting point
4. [04-APPFLOW.md](04-APPFLOW.md) — how a user moves through the app
5. [05-SCHEMA.md](05-SCHEMA.md) — a suggested starting data model
6. [06-API-CONTRACT.md](06-API-CONTRACT.md) — API shape, or a module-boundary contract if this idea has no backend
7. [07-SECURITY.md](07-SECURITY.md) — secrets, environments, data handling
8. [08-TESTING.md](08-TESTING.md) — acceptance criteria per feature
9. [09-IMPLEMENTATION.md](09-IMPLEMENTATION.md) — build order, milestone by milestone
10. [10-AGENT-RULES.md](10-AGENT-RULES.md) — standing rules if an AI coding agent builds this with you
${aiIndexLine}
This kit derives **${spec.entities.length} data entities**, **${spec.screens.length} screens**, and **${idea.decisions.length} engine decisions** (with their real alternatives and reasoning) from this specific idea — not just its category. Docs 3 and 5 also carry category-level starting suggestions where the engine genuinely doesn't know your exact screens or database; those are labeled inline, never presented as more specific than they are.

---
Idea generated: ${isoDate(idea.createdAt)} · Kit exported: ${isoDate(new Date().toISOString())}

_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildPrd(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const featureList = idea.mvpFeatures.map((f) => `**${f}**`).join(", ");

  return `# Document 1 — Product Requirements (${idea.name})

## Pitch
**${idea.name}** — ${idea.tagline}

${idea.githubDescription}

_Why this name: ${idea.namingRationale}_

## Problem statement
${idea.whyItShouldExist}

## Target audience
${idea.targetUsers} — the primary user of ${idea.name}, in the ${idea.fieldName} / ${idea.nicheLabel} space.

## Goal
${idea.solution}

## Idea Scorecard (heuristic engine signals, 0-100)
Project Zero's own internal scoring signals — a different, finer-grained scale from the difficulty rating below (1-5) and the Low/Medium/High labels elsewhere in this kit. Useful as a gut-check, not a guarantee.

| Signal | Score |
|---|---|
| Usefulness | ${idea.scores.usefulness} |
| Originality | ${idea.scores.originality} |
| Buildability | ${idea.scores.buildability} |
| Community value | ${idea.scores.communityValue} |
| Open source suitability | ${idea.scores.openSourceSuitability} |
| Scope fit | ${idea.scores.scope} |
| Difficulty (finer-grained) | ${idea.scores.difficulty} |

_Originality basis: ${explainOriginality(idea.axes)}_

## Core features (MVP) — as a user story
As **${idea.targetUsers}**, I want ${featureList}, so that the problem described above is no longer something to deal with by hand.

## Nice-to-have (explicitly deferred, not v1)
${bulletList(idea.futureFeatures)}

## Success criteria
1. All ${idea.mvpFeatures.length} MVP features above work end to end.
2. ${idea.aiRequired === "No" ? "Runs with zero AI/LLM dependency, exactly as scoped." : idea.aiRequired === "Optional" ? "Works fully without any AI dependency; AI (if added) is additive, not required." : "The AI component works reliably — this idea is scoped to need it."}
3. Stays within the estimated **${idea.buildSize}** build size / difficulty ${idea.difficulty}/5 — if it's ballooning past that, cut scope before adding time.

## Out of scope (v1)
- Anything in "Deferred / future" above.
${idea.aiRequired === "No" ? "- Any paid or cloud AI/LLM API — this idea is explicitly scoped not to need one." : ""}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildTrd(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const stackLines = idea.techStack.map((item) => `- **${item}** — ${stackRole(item)}`).join("\n");
  const backend = hasBackend(idea.techStack);

  const decisionLines = idea.decisions
    .map((d) => {
      const others = d.alternatives.filter((a) => a.value !== d.chosen).map((a) => a.value);
      const alsoConsidered = others.length > 0 ? ` (also considered: ${others.join(", ")})` : "";
      return `- **${d.subject}:** ${d.chosen}${alsoConsidered}${d.isDefault ? " — **[DEFAULT]**" : ""} — ${d.reason}`;
    })
    .join("\n");

  const transportNote =
    spec.provenance["section:transport"] === "axis"
      ? "\n## Transport (real-time)\nThis idea's problem text signals real-time updates. Prefer WebSocket for bidirectional/high-frequency updates, or Server-Sent Events (SSE) for simpler one-way server-to-client push — pick SSE first unless the client also needs to send frequent updates back; it's the lower-complexity default.\n"
      : "";

  return `# Document 2 — Technical Requirements (${idea.name})

## Suggested stack
${stackLines}

*(This is the stack Project Zero suggested based on this idea's category and scope — swap anything for a technology you already know well; nothing here is load-bearing.)*

## Architecture shape
${backend ? "This idea is scoped with a backend/API layer — plan for a client + server split." : "This idea is scoped to run **without a backend** — everything can live client-side. Simpler to build and host; revisit only if you outgrow local/client storage."}
${transportNote}
## Key decisions (from the generation engine's own decision trace)
Every non-obvious pick the engine made for this specific idea, what it chose, what else was on the table, and why:

${decisionLines}

## Suggested folder structure
\`\`\`
${idea.name.toLowerCase()}/
${backend ? "  api/            server-side logic, routes, data access\n  web/            frontend application" : "  src/            application source\n  src/components/ UI components\n  src/state/      client-side data (IndexedDB / local storage)"}
  docs/           this planning kit
\`\`\`

## Coding standards
${pickPhrasing("trdCodingStandards")}

## Dependency policy
${pickPhrasing("trdDependencyPolicy")}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildUiux(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const screenBlocks = spec.screens
    .map((screen) => {
      const note = provenanceNote(spec, `screen:${screen.name}`, screen.name);
      return `### ${screen.name}
${screen.purpose}
${note ? `\n${note}\n` : ""}
- **Default:** ${screen.states.default}
- **Loading:** ${screen.states.loading}
- **Empty:** ${screen.states.empty}
- **Error:** ${screen.states.error}
- **Success:** ${screen.states.success}
`;
    })
    .join("\n");

  return `# Document 3 — UI/UX Starting Point (${idea.name})

**Screen inventory and states below are derived per-idea where noted; unmarked screens are category-level starting suggestions.** Treat the design-system section as a scaffold to adapt.

## Design system starter
${pickPhrasing("uiuxDesignSystemStarter")}

## Screen inventory (${spec.screens.length} screens, with real default/loading/empty/error/success states — not just a reminder to design them)
${screenBlocks}
## Mobile notes
${pickPhrasing("uiuxMobileNotes")}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildAppFlow(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const anchorFeature = idea.mvpFeatures[0] ?? "the core feature";
  const journeyLine = pickPhrasing("appFlowJourneyTemplate").replaceAll("{feature}", anchorFeature);
  const routeLines = spec.routes.map((r) => `- \`${r.path}\` → ${r.screen}`).join("\n");

  return `# Document 4 — App Flow (${idea.name})

## Primary journey
${journeyLine}

## Route map (derived from this idea's own screen inventory — see Document 3)
${routeLines}

## Navigation map
${pickPhrasing("appFlowNavMap")}

## Edge paths to design for
${pickPhrasing("appFlowEdgeIntro")}
- Back button after a completed action
- Page refresh mid-flow (does in-progress state survive, or is that acceptable to lose?)
- A direct link into an inner screen when nothing has loaded yet

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildSchema(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const clientOnly = idea.techStack.some((t) => t.toLowerCase().includes("indexeddb")) && !hasBackend(idea.techStack);

  const entityBlocks = spec.entities
    .map((entity) => {
      const note = provenanceNote(spec, `entity:${entity.name}`, entity.name);
      const fieldRows = entity.fields.map((f) => `| ${f.name} | ${f.type} | ${f.note ?? ""} |`).join("\n");
      const relations = entity.relations.length > 0 ? `\nRelated to: ${entity.relations.join(", ")}` : "";
      return `### ${entity.name}
${note ? `${note}\n` : ""}
| Field | Type | Note |
|---|---|---|
${fieldRows}
${relations}
`;
    })
    .join("\n");

  const rlsEntry = spec.notApplicable.find((na) => na.section === "Row-level security / permissions");

  return `# Document 5 — Data Model (${idea.name})

**Entities below are derived from this idea's category and problem text where noted — a real starting sketch, not a guess dressed up as certainty.** Adapt freely once real requirements are clearer.

## Entities (${spec.entities.length})
${entityBlocks}
## ID strategy
UUIDs, generated client-side (\`crypto.randomUUID()\`) unless your stack gives you a better default.

## Storage
${clientOnly ? "This idea is scoped to run without a backend — IndexedDB or localStorage is enough; no server-side database needed unless the idea's scope grows." : "A relational database (PostgreSQL/SQLite, matching the tech stack in Document 2) fits this idea's scope."}

## Row-level security / permissions
${rlsEntry ? `**Not applicable.** ${rlsEntry.reason}` : "See the entities above — role/access entities are included where this idea's scope implies multiple users."}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildApiContract(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const backend = hasBackend(idea.techStack);

  if (!backend) {
    const moduleLines = spec.moduleSurface
      .map((fn) => `| \`${fn.name}${fn.params}\` | ${fn.returns} | ${fn.description} |`)
      .join("\n");
    return `# Document 6 — Module Boundary Contract (${idea.name})

**Not a REST API — this idea has no backend.** Instead, here's the module boundary: the functions the UI calls to read/write data, derived from this idea's own entities (Document 5). This is real, per-idea content, not a "not applicable" placeholder.

| Function | Returns | Purpose |
|---|---|---|
${moduleLines}

Implement these as plain functions over IndexedDB/localStorage (see Document 5's Storage section) — no network boundary to define, so no request/response shape, auth headers, or versioning to design here.

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
  }

  const primaryEntity = spec.entities[0]?.name ?? "Item";
  const resource = slugify(primaryEntity);
  return `# Document 6 — API Contract (${idea.name})

## Suggested starting endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | /api/${resource} | List all ${resource.replace(/-/g, " ")} records |
| POST | /api/${resource} | Create one |
| GET | /api/${resource}/:id | Fetch one |
| PATCH | /api/${resource}/:id | Update one |

*This primary resource (${resource}) is this idea's first derived entity (see Document 5) — check it against the feature list in 01-PRD.md before committing to it.*

## Conventions
JSON in, JSON out. Auth (if any) via a bearer token header. Version the API only once you have an external consumer depending on it — don't pre-optimize.

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildSecurity(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const secretsApplicable = spec.provenance["section:secrets"] === "axis";
  const authEntry = spec.notApplicable.find((na) => na.section === "Authentication / access control");
  const validationRows = spec.validationRules.map((v) => `| ${v.field} | ${v.rule} | ${v.reason} |`).join("\n");

  return `# Document 7 — Security & Environment (${idea.name})

## Secrets
${pickPhrasing("securitySecretsNote")}

${secretsApplicable ? "**Applicable here:** this idea's problem text implies pulling from an external source — the connection's credential goes in `.env` like any other secret, and the app should degrade gracefully (or clearly disable the affected feature) if that credential is missing, never silently fail elsewhere." : idea.aiRequired === "No" ? "This idea has no AI/LLM dependency and no external integration implied by its problem text — there's no API key to manage at all." : "If you integrate an AI API, its key goes in `.env` like any other secret, and the app should degrade gracefully (or refuse to run the AI-dependent feature) if that key is missing — never silently fail elsewhere."}

## Authentication / access control
${authEntry ? `**Not applicable.** ${authEntry.reason}` : "This idea's problem text implies multiple users or regulated data — see the entities/screens in Documents 3 and 5 for the access-control model this implies."}

## Input validation
${pickPhrasing("securityInputValidation")}

| Field | Rule | Why |
|---|---|---|
${validationRows}

## Dependency policy
${pickPhrasing("securityDependencyPolicy")}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildTesting(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const criteria = idea.mvpFeatures
    .map((f) => `- **${f}** — Given a user opens ${idea.name}, when they use ${f.toLowerCase()}, then it behaves as described in this kit's Solution section (see 01-PRD.md).`)
    .join("\n");

  const thresholdNote =
    spec.provenance["section:alertThresholds"] === "axis"
      ? `\n## Alert-threshold acceptance criteria (this idea fires alerts)\nEach alert rule needs a concrete, testable threshold before it ships — "notify when risk is high" isn't testable, "notify when risk score >= 70" is. Write one such criterion per alert rule before building it.\n`
      : "";

  const riskLines = spec.risks.length > 0 ? spec.risks.map((r) => `- **${r.description}** — ${r.mitigation}`).join("\n") : "";

  return `# Document 8 — Testing & Acceptance (${idea.name})

## Acceptance criteria (MVP features)
${criteria}
${thresholdNote}${riskLines ? `\n## Risks this idea's shape implies (test these explicitly, not just the happy path)\n${riskLines}\n` : ""}
## Definition of done (every feature)
${pickPhrasing("testingDodIntro")}
- [ ] Matches its acceptance criterion above
- [ ] Empty / loading / error states handled
- [ ] Verified on a mobile viewport
- [ ] No console errors
- [ ] Committed with a clear message

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildImplementation(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  const taskLines = spec.tasks
    .map((t) => `| ${t.id} | ${t.goal} | ${t.dependsOn.join(", ") || "—"} | ${t.acceptance} |`)
    .join("\n");

  return `# Document 9 — Implementation Plan (${idea.name})

## Milestones, in order

1. **Setup** — scaffold the project with the stack from Document 2.
2. **MVP** — build, in order:
${idea.mvpFeatures.map((f) => `   - ${f}`).join("\n")}
3. **Round out the core concept** — the remaining capabilities:
${idea.coreFeatures.filter((f) => !idea.mvpFeatures.includes(f)).map((f) => `   - ${f}`).join("\n") || "   - (MVP already covers the full core concept)"}
4. **Testing** — run through Document 8's acceptance criteria.
5. **Future** — once the above is solid and real users want more:
${idea.futureFeatures.map((f) => `   - ${f}`).join("\n")}

## Task register (derived per MVP feature)
| ID | Goal | Depends on | Acceptance |
|---|---|---|---|
${taskLines}

## Checkpoint rule
Commit after each milestone; don't move to the next one with a broken build.

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildAgentRules(spec: IdeaSpec, _opts: ProjectKitOptions): string {
  const idea = spec.idea;
  return `# Document 10 — Agent Collaboration Rules (${idea.name})

If you build this with an AI coding agent, give it this file (or fold it into your own \`CLAUDE.md\`):

- ${pickPhrasing("agentRulesScopeBullet")}
- ${pickPhrasing("agentRulesAskBeforeBullet")}
${idea.aiRequired === "No" ? "- **Never add a call to a paid or cloud LLM/AI API** — this idea is explicitly scoped to need none." : ""}
- ${pickPhrasing("agentRulesStuckBullet")}
- ${pickPhrasing("agentRulesReportBullet")}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildAiElaboration(idea: ProjectIdea, text: string): string {
  return `# Document 11 — AI-Elaborated Summary (${idea.name})

**Optional, on-device only.** This paragraph was written by your browser's built-in local AI model, at your request, to rephrase and connect what Project Zero's rule engine already generated elsewhere in this kit — nothing was sent to any server, and nothing new was invented beyond what's already in this kit. Review it like a first draft; small on-device models can still get details wrong. This is separate from whether *${idea.name} itself* needs AI to build (see Document 1 / Document 7) — it's Project Zero's own optional writing assist for this kit.

${text.trim()}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

const DOCUMENT_BUILDERS: { filename: string; build: (spec: IdeaSpec, opts: ProjectKitOptions) => string }[] = [
  { filename: "00-README.md", build: buildReadme },
  { filename: "01-PRD.md", build: buildPrd },
  { filename: "02-TRD.md", build: buildTrd },
  { filename: "03-UIUX.md", build: buildUiux },
  { filename: "04-APPFLOW.md", build: buildAppFlow },
  { filename: "05-SCHEMA.md", build: buildSchema },
  { filename: "06-API-CONTRACT.md", build: buildApiContract },
  { filename: "07-SECURITY.md", build: buildSecurity },
  { filename: "08-TESTING.md", build: buildTesting },
  { filename: "09-IMPLEMENTATION.md", build: buildImplementation },
  { filename: "10-AGENT-RULES.md", build: buildAgentRules }
];

/** Builds the full planning kit as a map of {filename: content} — 11 files, or 12 with an AI elaboration. Exported for testing. */
export function buildProjectKit(idea: ProjectIdea, opts: ProjectKitOptions = {}): Record<string, string> {
  const spec = buildIdeaSpec(idea);
  const files: Record<string, string> = {};
  for (const { filename, build } of DOCUMENT_BUILDERS) {
    files[filename] = build(spec, opts);
  }
  if (opts.aiElaboration && opts.aiElaboration.trim().length > 0) {
    files["11-AI-ELABORATION.md"] = buildAiElaboration(idea, opts.aiElaboration);
  }
  return files;
}

/** Triggers a browser download of the full planning kit as a .zip (one folder, per-idea). */
export async function downloadProjectKit(idea: ProjectIdea, opts: ProjectKitOptions = {}): Promise<void> {
  const zip = new JSZip();
  const folderName = slugify(idea.name);
  const folder = zip.folder(folderName);
  if (!folder) throw new Error("Failed to create zip folder");

  const files = buildProjectKit(idea, opts);
  for (const [filename, content] of Object.entries(files)) {
    folder.file(filename, content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${folderName}-planning-kit.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
