import JSZip from "jszip";
import { createShuffleBag } from "@/engine/templates";
import kitPhrasingData from "@/knowledge/kit_phrasing.json";
import type { KitPhrasingMap, ProjectIdea } from "@/types";

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

function hasBackend(techStack: string[]): boolean {
  const backendMarkers = ["fastapi", "express", "node.js", "postgresql", "sqlite", "duckdb"];
  const clientOnlyMarkers = ["indexeddb"];
  const lower = techStack.map((t) => t.toLowerCase());
  const looksClientOnly = lower.some((t) => clientOnlyMarkers.some((m) => t.includes(m)));
  const looksBackend = lower.some((t) => backendMarkers.some((m) => t.includes(m)));
  return looksBackend && !looksClientOnly;
}

const ENTITY_SUGGESTIONS: Record<string, string[]> = {
  automation: ["Rule", "Trigger", "RunLog"],
  monitoring: ["Target", "HealthCheck", "Alert"],
  detection: ["Event", "RiskScore", "Report"],
  organization: ["Item", "Tag", "Collection"],
  productivity: ["Task", "Priority", "DailySummary"],
  security: ["Policy", "AccessGrant", "AuditEntry"],
  documentation: ["Document", "Version", "Tag"],
  analysis: ["DataSource", "Metric", "Insight"],
  communication: ["Update", "Channel", "Notification"],
  collaboration: ["Workspace", "Comment", "ActivityEvent"],
  visualization: ["Dataset", "ChartView", "Filter"],
  management: ["Item", "Owner", "StatusHistory"],
  tracking: ["Record", "StatusChange", "Timeline"],
  education: ["Lesson", "Progress", "Check"],
  accessibility: ["Audit", "Finding", "Guideline"],
  integration: ["Connection", "SyncLog", "FieldMapping"],
  reliability: ["HealthCheck", "Incident", "FailoverRule"],
  privacy: ["DataAsset", "AccessLog", "ConsentRecord"],
  "developer-experience": ["Template", "Scaffold", "DocPage"]
};

const SCREEN_SUGGESTIONS: Record<string, string[]> = {
  automation: ["Home (rules list)", "Rule editor", "Run history"],
  monitoring: ["Dashboard", "Target detail", "Alert history"],
  detection: ["Dashboard", "Event detail", "Reports"],
  organization: ["Home (item list)", "Item detail", "Search/filter view"],
  productivity: ["Home (task list)", "Task detail", "Daily summary"],
  security: ["Dashboard", "Policy editor", "Audit log"],
  documentation: ["Document list", "Document editor", "Version history"],
  analysis: ["Dashboard", "Data source setup", "Report view"],
  communication: ["Inbox/feed", "Update composer", "Channel settings"],
  collaboration: ["Workspace home", "Item detail with comments", "Activity feed"],
  visualization: ["Dashboard", "Chart builder", "Saved views"],
  management: ["Dashboard", "Item detail", "Ownership/assignment view"],
  tracking: ["Home (record list)", "Record detail/timeline", "Reports"],
  education: ["Home (course list)", "Lesson view", "Progress view"],
  accessibility: ["Audit dashboard", "Finding detail", "Guidelines reference"],
  integration: ["Connections list", "Connection setup", "Sync log"],
  reliability: ["Dashboard", "Incident detail", "Health history"],
  privacy: ["Data inventory", "Access log", "Consent settings"],
  "developer-experience": ["CLI (no UI)", "Docs site", "Template gallery"]
};

function suggestionsFor(map: Record<string, string[]>, categoryId: string, fallback: string[]): string[] {
  return map[categoryId] ?? fallback;
}

function isoDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Document builders — every one takes only the already-generated ProjectIdea
// (plus the shared, mostly-unused ProjectKitOptions), nothing is invented
// beyond generic, clearly-labeled starting suggestions.
// ---------------------------------------------------------------------------

export interface ProjectKitOptions {
  /** A user-reviewed, on-device-AI-generated elaboration paragraph. Optional — see src/utils/onDeviceAi.ts. */
  aiElaboration?: string;
}

function buildReadme(idea: ProjectIdea, opts: ProjectKitOptions): string {
  const hasAi = Boolean(opts.aiElaboration && opts.aiElaboration.trim().length > 0);
  const aiIndexLine = hasAi ? "11. [11-AI-ELABORATION.md](11-AI-ELABORATION.md) — an optional, on-device AI elaboration of this idea\n" : "";

  return `# ${idea.name} — Planning Kit

> ${idea.tagline}

**Open source potential:** ${idea.openSourcePotential} · **Community value:** ${idea.communityValue}

This is a starter planning kit for **${idea.name}**, generated offline by [Project Zero](https://github.com/NexuZero/Project_Zero) — no account, no cloud AI, nothing fabricated beyond what the idea itself already describes. It mirrors a lightweight version of a real ten-document planning process. Read in order, or jump to what you need:

1. [01-PRD.md](01-PRD.md) — what you're building and why
2. [02-TRD.md](02-TRD.md) — the tech stack and how the code is organized
3. [03-UIUX.md](03-UIUX.md) — a design-system and screen-inventory starting point
4. [04-APPFLOW.md](04-APPFLOW.md) — how a user moves through the app
5. [05-SCHEMA.md](05-SCHEMA.md) — a suggested starting data model
6. [06-API-CONTRACT.md](06-API-CONTRACT.md) — API shape, if this idea needs one
7. [07-SECURITY.md](07-SECURITY.md) — secrets, environments, data handling
8. [08-TESTING.md](08-TESTING.md) — acceptance criteria per feature
9. [09-IMPLEMENTATION.md](09-IMPLEMENTATION.md) — build order, milestone by milestone
10. [10-AGENT-RULES.md](10-AGENT-RULES.md) — standing rules if an AI coding agent builds this with you
${aiIndexLine}
Docs 3, 5, and 6 are honest starting *suggestions* — the engine that generated this idea doesn't know your exact screens, database, or API, so those three are templated guidance to adapt, not fabricated specifics. Everything else is built directly from what was actually generated for this idea.

---
Idea generated: ${isoDate(idea.createdAt)} · Kit exported: ${isoDate(new Date().toISOString())}

_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildPrd(idea: ProjectIdea, _opts: ProjectKitOptions): string {
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

function buildTrd(idea: ProjectIdea, _opts: ProjectKitOptions): string {
  const stackLines = idea.techStack.map((item) => `- **${item}** — ${stackRole(item)}`).join("\n");
  const backend = hasBackend(idea.techStack);

  return `# Document 2 — Technical Requirements (${idea.name})

## Suggested stack
${stackLines}

*(This is the stack Project Zero suggested based on this idea's category and scope — swap anything for a technology you already know well; nothing here is load-bearing.)*

## Architecture shape
${backend ? "This idea is scoped with a backend/API layer — plan for a client + server split." : "This idea is scoped to run **without a backend** — everything can live client-side. Simpler to build and host; revisit only if you outgrow local/client storage."}

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

function buildUiux(idea: ProjectIdea, _opts: ProjectKitOptions): string {
  const screens = suggestionsFor(SCREEN_SUGGESTIONS, idea.categoryId, ["Home", "Detail view", "Settings"]);
  const screenBlocks = screens
    .map(
      (screen) => `### ${screen}
- **Default / Loading / Empty / Error / Success** — design all five states before calling this screen done.
`
    )
    .join("\n");

  return `# Document 3 — UI/UX Starting Point (${idea.name})

**This document is an honest starting checklist, not a bespoke design spec** — Project Zero's engine doesn't know your exact screens or brand, so treat everything below as a scaffold to adapt.

## Design system starter
${pickPhrasing("uiuxDesignSystemStarter")}

## Suggested screen inventory (starting point, based on this idea's category — ${idea.categoryName})
${screenBlocks}
## Mobile notes
${pickPhrasing("uiuxMobileNotes")}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildAppFlow(idea: ProjectIdea, _opts: ProjectKitOptions): string {
  const anchorFeature = idea.mvpFeatures[0] ?? "the core feature";
  const journeyLine = pickPhrasing("appFlowJourneyTemplate").replaceAll("{feature}", anchorFeature);

  return `# Document 4 — App Flow (${idea.name})

## Primary journey
${journeyLine}

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

function buildSchema(idea: ProjectIdea, _opts: ProjectKitOptions): string {
  const entities = suggestionsFor(ENTITY_SUGGESTIONS, idea.categoryId, ["Item", "Owner", "History"]);
  const clientOnly = idea.techStack.some((t) => t.toLowerCase().includes("indexeddb")) && !hasBackend(idea.techStack);
  const worksheet = entities.map((e) => `| ${e} | _(fill in — see 01-PRD.md)_ |`).join("\n");

  return `# Document 5 — Data Model Starting Sketch (${idea.name})

**This is a suggested sketch, not a definitive schema** — adapt freely once real requirements are clearer.

## Suggested entities (based on this idea's category — ${idea.categoryName})
| Suggested entity | Touched by which MVP feature(s)? |
|---|---|
${worksheet}

## ID strategy
UUIDs, generated client-side (\`crypto.randomUUID()\`) unless your stack gives you a better default.

## Storage
${clientOnly ? "This idea is scoped to run without a backend — IndexedDB or localStorage is enough; no server-side database needed unless the idea's scope grows." : "A relational database (PostgreSQL/SQLite, matching the tech stack in Document 2) fits this idea's scope."}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildApiContract(idea: ProjectIdea, _opts: ProjectKitOptions): string {
  const backend = hasBackend(idea.techStack);
  if (!backend) {
    return `# Document 6 — API Contract (${idea.name})

**Not applicable (by design).** This idea is scoped to run without a backend/server — there's no API surface to define. If the idea's scope grows enough to need one, come back to this document then; the JSON knowledge base's \`tech_stacks.json\` also has a \`webDashboard\` variant with a backend if you want to switch approaches.

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
  }

  // Reuses the same entity suggestions as 05-SCHEMA.md (not idea.mvpFeatures — feature
  // labels like "Dashboard" or "Alerts" are UI concepts, not REST-resource nouns).
  const primaryEntity = suggestionsFor(ENTITY_SUGGESTIONS, idea.categoryId, ["Item"])[0];
  const resource = slugify(primaryEntity);
  return `# Document 6 — API Contract (${idea.name})

## Suggested starting endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | /api/${resource} | List all ${resource.replace(/-/g, " ")} records |
| POST | /api/${resource} | Create one |
| GET | /api/${resource}/:id | Fetch one |
| PATCH | /api/${resource}/:id | Update one |

*This primary resource (${resource}) is a guess based on this idea's category, not its specific MVP features — check it against the feature list in 01-PRD.md before committing to it.*

## Conventions
JSON in, JSON out. Auth (if any) via a bearer token header. Version the API only once you have an external consumer depending on it — don't pre-optimize.

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildSecurity(idea: ProjectIdea, _opts: ProjectKitOptions): string {
  return `# Document 7 — Security & Environment (${idea.name})

## Secrets
${pickPhrasing("securitySecretsNote")}

${idea.aiRequired === "No" ? "This idea has no AI/LLM dependency — there's no AI API key to manage at all." : "If you integrate an AI API, its key goes in `.env` like any other secret, and the app should degrade gracefully (or refuse to run the AI-dependent feature) if that key is missing — never silently fail elsewhere."}

## Input validation
${pickPhrasing("securityInputValidation")}

## Dependency policy
${pickPhrasing("securityDependencyPolicy")}

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildTesting(idea: ProjectIdea, _opts: ProjectKitOptions): string {
  const criteria = idea.mvpFeatures
    .map((f) => `- **${f}** — Given a user opens ${idea.name}, when they use ${f.toLowerCase()}, then it behaves as described in this kit's Solution section (see 01-PRD.md).`)
    .join("\n");

  return `# Document 8 — Testing & Acceptance (${idea.name})

## Acceptance criteria (MVP features)
${criteria}

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

function buildImplementation(idea: ProjectIdea, _opts: ProjectKitOptions): string {
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

## Checkpoint rule
Commit after each milestone; don't move to the next one with a broken build.

---
_Generated offline by Project Zero — no account, no cloud AI, no tracking._
`;
}

function buildAgentRules(idea: ProjectIdea, _opts: ProjectKitOptions): string {
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

const DOCUMENT_BUILDERS: { filename: string; build: (idea: ProjectIdea, opts: ProjectKitOptions) => string }[] = [
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
  const files: Record<string, string> = {};
  for (const { filename, build } of DOCUMENT_BUILDERS) {
    files[filename] = build(idea, opts);
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
