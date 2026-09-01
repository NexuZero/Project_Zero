import type { Entity, IdeaSpec, NotApplicable, Provenance, Risk, Route, Screen, ScreenStates, VRule } from "@/types";
import type { ProjectIdea } from "@/types";

// ---------------------------------------------------------------------------
// buildIdeaSpec: pure derivation from an already-generated ProjectIdea (which
// carries axes + decisions from Stage A's earlier steps). No new randomness,
// no new inputs — generateProjects()/generateSurprise() signatures are
// untouched. Every section is one of: derived · category-default (labelled) ·
// not-applicable-with-a-reason. Never silently omitted, never generic filler
// passed off as idea-specific.
// ---------------------------------------------------------------------------

function slugifyPath(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `/${slug || "screen"}`;
}

/** True when the tech stack implies a server/API layer (same heuristic previously local to projectKit.ts, now the shared source of truth). */
export function hasBackend(techStack: string[]): boolean {
  const backendMarkers = ["fastapi", "express", "node.js", "postgresql", "sqlite", "duckdb"];
  const clientOnlyMarkers = ["indexeddb"];
  const lower = techStack.map((t) => t.toLowerCase());
  const looksClientOnly = lower.some((t) => clientOnlyMarkers.some((m) => t.includes(m)));
  const looksBackend = lower.some((t) => backendMarkers.some((m) => t.includes(m)));
  return looksBackend && !looksClientOnly;
}

function deriveScreenStates(screenName: string, ideaName: string): ScreenStates {
  const lower = screenName.toLowerCase();
  const isList = /list|home|inbox|feed|dashboard/.test(lower);
  const isDetail = /detail|editor|view|composer|setup/.test(lower);
  return {
    default: isList
      ? `Shows every relevant record for ${ideaName}, most recent first.`
      : isDetail
        ? `Shows the full detail for one selected record from ${ideaName}.`
        : `Shows this screen's primary content for ${ideaName}.`,
    loading: "Skeleton placeholders while data loads — never a blank white screen.",
    empty: isList
      ? "A clear empty state explaining there's nothing here yet, with a way to create the first record."
      : "An explicit 'not found' state if the referenced record no longer exists.",
    error: "A retry-capable error state — never a silent failure or an unhandled crash.",
    success: isDetail
      ? "Confirms a save/update took effect (e.g. a toast or inline confirmation)."
      : "Confirms the list reflects the latest state after any action."
  };
}

function addEntity(entities: Entity[], provenance: Record<string, Provenance>, entity: Entity, tier: Provenance): void {
  if (entities.some((e) => e.name === entity.name)) return;
  entities.push(entity);
  provenance[`entity:${entity.name}`] = tier;
}

function addScreen(screens: Screen[], provenance: Record<string, Provenance>, screen: Screen, tier: Provenance, ideaName: string): void {
  if (screens.some((s) => s.name === screen.name)) return;
  screens.push({ ...screen, states: screen.states ?? deriveScreenStates(screen.name, ideaName) });
  provenance[`screen:${screen.name}`] = tier;
}

// ---------------------------------------------------------------------------
// Category-default tier — moved here from src/utils/projectKit.ts's old flat
// ENTITY_SUGGESTIONS/SCREEN_SUGGESTIONS name lists, upgraded from bare names
// to real fields/relations/purposes. This is the "always have something
// reasonable" floor every idea gets before any axis-triggered addition.
// ---------------------------------------------------------------------------

const CATEGORY_ENTITIES: Record<string, Entity[]> = {
  automation: [
    { name: "Rule", fields: [{ name: "condition", type: "string", note: "the expression that must match" }, { name: "action", type: "string", note: "what happens when it matches" }, { name: "enabled", type: "boolean" }], relations: ["Trigger", "RunLog"] },
    { name: "Trigger", fields: [{ name: "kind", type: "enum(schedule|event|manual)" }, { name: "config", type: "string", note: "e.g. a cron expression or event name" }], relations: ["Rule"] },
    { name: "RunLog", fields: [{ name: "ruleId", type: "reference" }, { name: "ranAt", type: "Date" }, { name: "outcome", type: "enum(success|failure|skipped)" }], relations: ["Rule"] }
  ],
  monitoring: [
    { name: "Target", fields: [{ name: "name", type: "string" }, { name: "endpointOrLocation", type: "string" }, { name: "addedAt", type: "Date" }], relations: ["HealthCheck", "Alert"] },
    { name: "HealthCheck", fields: [{ name: "targetId", type: "reference" }, { name: "checkedAt", type: "Date" }, { name: "status", type: "enum(healthy|degraded|down)" }, { name: "latencyMs", type: "number", note: "optional" }], relations: ["Target"] },
    { name: "Alert", fields: [{ name: "targetId", type: "reference" }, { name: "firedAt", type: "Date" }, { name: "severity", type: "enum(low|medium|high)" }, { name: "acknowledgedAt", type: "Date", note: "optional" }], relations: ["Target"] }
  ],
  detection: [
    { name: "Event", fields: [{ name: "occurredAt", type: "Date" }, { name: "source", type: "string" }, { name: "payload", type: "string", note: "raw event detail" }], relations: ["RiskScore"] },
    { name: "RiskScore", fields: [{ name: "eventId", type: "reference" }, { name: "score", type: "number", note: "0-100" }, { name: "reason", type: "string" }], relations: ["Event"] },
    { name: "Report", fields: [{ name: "generatedAt", type: "Date" }, { name: "periodStart", type: "Date" }, { name: "periodEnd", type: "Date" }], relations: [] }
  ],
  organization: [
    { name: "Item", fields: [{ name: "name", type: "string" }, { name: "notes", type: "string", note: "optional" }, { name: "addedAt", type: "Date" }], relations: ["Tag", "Collection"] },
    { name: "Tag", fields: [{ name: "name", type: "string" }, { name: "color", type: "string", note: "optional" }], relations: ["Item"] },
    { name: "Collection", fields: [{ name: "name", type: "string" }, { name: "description", type: "string", note: "optional" }], relations: ["Item"] }
  ],
  productivity: [
    { name: "Task", fields: [{ name: "title", type: "string" }, { name: "done", type: "boolean" }, { name: "dueAt", type: "Date", note: "optional" }], relations: ["Priority"] },
    { name: "Priority", fields: [{ name: "taskId", type: "reference" }, { name: "level", type: "enum(low|medium|high|urgent)" }], relations: ["Task"] },
    { name: "DailySummary", fields: [{ name: "date", type: "Date" }, { name: "completedCount", type: "number" }], relations: [] }
  ],
  security: [
    { name: "Policy", fields: [{ name: "name", type: "string" }, { name: "rule", type: "string" }, { name: "enforced", type: "boolean" }], relations: ["AccessGrant"] },
    { name: "AccessGrant", fields: [{ name: "subject", type: "string", note: "who/what is granted access" }, { name: "scope", type: "string" }, { name: "grantedAt", type: "Date" }], relations: ["Policy"] },
    { name: "AuditEntry", fields: [{ name: "actor", type: "string" }, { name: "action", type: "string" }, { name: "at", type: "Date" }], relations: [] }
  ],
  documentation: [
    { name: "Document", fields: [{ name: "title", type: "string" }, { name: "body", type: "string" }, { name: "updatedAt", type: "Date" }], relations: ["Version", "Tag"] },
    { name: "Version", fields: [{ name: "documentId", type: "reference" }, { name: "number", type: "number" }, { name: "savedAt", type: "Date" }], relations: ["Document"] },
    { name: "Tag", fields: [{ name: "name", type: "string" }], relations: ["Document"] }
  ],
  analysis: [
    { name: "DataSource", fields: [{ name: "name", type: "string" }, { name: "kind", type: "string" }, { name: "lastSyncedAt", type: "Date", note: "optional" }], relations: ["Metric"] },
    { name: "Metric", fields: [{ name: "dataSourceId", type: "reference" }, { name: "name", type: "string" }, { name: "value", type: "number" }, { name: "recordedAt", type: "Date" }], relations: ["DataSource", "Insight"] },
    { name: "Insight", fields: [{ name: "metricId", type: "reference" }, { name: "summary", type: "string" }, { name: "generatedAt", type: "Date" }], relations: ["Metric"] }
  ],
  communication: [
    { name: "Update", fields: [{ name: "authorId", type: "string" }, { name: "body", type: "string" }, { name: "postedAt", type: "Date" }], relations: ["Channel"] },
    { name: "Channel", fields: [{ name: "name", type: "string" }, { name: "description", type: "string", note: "optional" }], relations: ["Update"] },
    { name: "Notification", fields: [{ name: "recipient", type: "string" }, { name: "body", type: "string" }, { name: "sentAt", type: "Date" }, { name: "readAt", type: "Date", note: "optional" }], relations: [] }
  ],
  collaboration: [
    { name: "Workspace", fields: [{ name: "name", type: "string" }, { name: "members", type: "string[]" }], relations: ["Comment", "ActivityEvent"] },
    { name: "Comment", fields: [{ name: "workspaceId", type: "reference" }, { name: "authorId", type: "string" }, { name: "body", type: "string" }, { name: "postedAt", type: "Date" }], relations: ["Workspace"] },
    { name: "ActivityEvent", fields: [{ name: "workspaceId", type: "reference" }, { name: "actor", type: "string" }, { name: "action", type: "string" }, { name: "at", type: "Date" }], relations: ["Workspace"] }
  ],
  visualization: [
    { name: "Dataset", fields: [{ name: "name", type: "string" }, { name: "source", type: "string" }, { name: "rowCount", type: "number", note: "optional" }], relations: ["ChartView"] },
    { name: "ChartView", fields: [{ name: "datasetId", type: "reference" }, { name: "chartType", type: "enum(line|bar|pie|table)" }, { name: "config", type: "string" }], relations: ["Dataset", "Filter"] },
    { name: "Filter", fields: [{ name: "chartViewId", type: "reference" }, { name: "field", type: "string" }, { name: "operator", type: "string" }, { name: "value", type: "string" }], relations: ["ChartView"] }
  ],
  management: [
    { name: "Item", fields: [{ name: "name", type: "string" }, { name: "status", type: "string" }, { name: "createdAt", type: "Date" }], relations: ["Owner", "StatusHistory"] },
    { name: "Owner", fields: [{ name: "itemId", type: "reference" }, { name: "assignee", type: "string" }, { name: "assignedAt", type: "Date" }], relations: ["Item"] },
    { name: "StatusHistory", fields: [{ name: "itemId", type: "reference" }, { name: "fromStatus", type: "string" }, { name: "toStatus", type: "string" }, { name: "changedAt", type: "Date" }], relations: ["Item"] }
  ],
  tracking: [
    { name: "Record", fields: [{ name: "subject", type: "string" }, { name: "currentStatus", type: "string" }, { name: "createdAt", type: "Date" }], relations: ["StatusChange", "Timeline"] },
    { name: "StatusChange", fields: [{ name: "recordId", type: "reference" }, { name: "fromStatus", type: "string" }, { name: "toStatus", type: "string" }, { name: "changedAt", type: "Date" }], relations: ["Record"] },
    { name: "Timeline", fields: [{ name: "recordId", type: "reference" }, { name: "events", type: "string[]", note: "ordered event descriptions" }], relations: ["Record"] }
  ],
  education: [
    { name: "Lesson", fields: [{ name: "title", type: "string" }, { name: "order", type: "number" }, { name: "content", type: "string" }], relations: ["Progress"] },
    { name: "Progress", fields: [{ name: "lessonId", type: "reference" }, { name: "learnerId", type: "string" }, { name: "completedAt", type: "Date", note: "optional" }], relations: ["Lesson"] },
    { name: "Check", fields: [{ name: "lessonId", type: "reference" }, { name: "question", type: "string" }, { name: "correctAnswer", type: "string" }], relations: ["Lesson"] }
  ],
  accessibility: [
    { name: "Audit", fields: [{ name: "target", type: "string" }, { name: "ranAt", type: "Date" }, { name: "score", type: "number", note: "optional" }], relations: ["Finding"] },
    { name: "Finding", fields: [{ name: "auditId", type: "reference" }, { name: "severity", type: "enum(low|medium|high)" }, { name: "description", type: "string" }], relations: ["Audit", "Guideline"] },
    { name: "Guideline", fields: [{ name: "code", type: "string", note: "e.g. a WCAG success-criterion reference" }, { name: "description", type: "string" }], relations: ["Finding"] }
  ],
  integration: [
    { name: "Connection", fields: [{ name: "name", type: "string" }, { name: "provider", type: "string" }, { name: "authRef", type: "string", note: "reference to stored credential, never the credential itself" }], relations: ["SyncLog", "FieldMapping"] },
    { name: "SyncLog", fields: [{ name: "connectionId", type: "reference" }, { name: "startedAt", type: "Date" }, { name: "outcome", type: "enum(success|failure)" }], relations: ["Connection"] },
    { name: "FieldMapping", fields: [{ name: "connectionId", type: "reference" }, { name: "sourceField", type: "string" }, { name: "targetField", type: "string" }], relations: ["Connection"] }
  ],
  reliability: [
    { name: "HealthCheck", fields: [{ name: "component", type: "string" }, { name: "checkedAt", type: "Date" }, { name: "status", type: "enum(healthy|degraded|down)" }], relations: ["Incident"] },
    { name: "Incident", fields: [{ name: "startedAt", type: "Date" }, { name: "resolvedAt", type: "Date", note: "optional" }, { name: "severity", type: "enum(low|medium|high|critical)" }], relations: ["HealthCheck", "FailoverRule"] },
    { name: "FailoverRule", fields: [{ name: "triggerCondition", type: "string" }, { name: "action", type: "string" }], relations: ["Incident"] }
  ],
  privacy: [
    { name: "DataAsset", fields: [{ name: "name", type: "string" }, { name: "classification", type: "enum(public|internal|sensitive|regulated)" }, { name: "owner", type: "string" }], relations: ["AccessLog", "ConsentRecord"] },
    { name: "AccessLog", fields: [{ name: "dataAssetId", type: "reference" }, { name: "actor", type: "string" }, { name: "action", type: "string" }, { name: "at", type: "Date" }], relations: ["DataAsset"] },
    { name: "ConsentRecord", fields: [{ name: "subject", type: "string" }, { name: "scope", type: "string" }, { name: "grantedAt", type: "Date" }, { name: "revokedAt", type: "Date", note: "optional" }], relations: ["DataAsset"] }
  ],
  "developer-experience": [
    { name: "Template", fields: [{ name: "name", type: "string" }, { name: "description", type: "string" }, { name: "files", type: "string[]" }], relations: ["Scaffold"] },
    { name: "Scaffold", fields: [{ name: "templateId", type: "reference" }, { name: "generatedAt", type: "Date" }, { name: "targetPath", type: "string" }], relations: ["Template"] },
    { name: "DocPage", fields: [{ name: "title", type: "string" }, { name: "slug", type: "string" }, { name: "body", type: "string" }], relations: [] }
  ]
};

const CATEGORY_SCREENS: Record<string, string[]> = {
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

// ---------------------------------------------------------------------------
// buildIdeaSpec
// ---------------------------------------------------------------------------

export function buildIdeaSpec(idea: ProjectIdea): IdeaSpec {
  const entities: Entity[] = [];
  const screens: Screen[] = [];
  const risks: Risk[] = [];
  const notApplicable: NotApplicable[] = [];
  const validationRules: VRule[] = [
    { field: "Problem/Niche/Target User text", rule: "Trimmed, length-capped, never executed as code or markup.", reason: "Baseline input hygiene — applies regardless of stakes." }
  ];
  const provenance: Record<string, Provenance> = {};
  let riskCounter = 0;
  const nextRiskId = () => `R-${String(++riskCounter).padStart(3, "0")}`;

  // ---- category-default tier: always present, the floor every idea gets ----
  for (const entity of CATEGORY_ENTITIES[idea.categoryId] ?? CATEGORY_ENTITIES.organization) {
    addEntity(entities, provenance, entity, "category-default");
  }
  for (const name of CATEGORY_SCREENS[idea.categoryId] ?? CATEGORY_SCREENS.organization) {
    addScreen(screens, provenance, { name, purpose: `Primary ${idea.categoryName.toLowerCase()} screen for ${idea.name}.`, states: deriveScreenStates(name, idea.name) }, "category-default", idea.name);
  }

  // ---- axis-triggered additions (brief §5 trigger table) ----

  if (idea.axes.dataOrigin.includes("fetched")) {
    addEntity(
      entities,
      provenance,
      { name: "Source", fields: [{ name: "endpoint", type: "string" }, { name: "authRef", type: "string", note: "reference to stored credential, never the credential itself" }, { name: "lastSyncedAt", type: "Date", note: "optional" }, { name: "rateLimitNote", type: "string", note: "optional" }], relations: [] },
      "axis"
    );
    addScreen(screens, provenance, { name: "Connections / settings", purpose: "Where the user configures the external source this idea pulls from.", states: deriveScreenStates("settings", idea.name) }, "axis", idea.name);
    risks.push({ id: nextRiskId(), description: "The external source's rate limit is hit under normal use.", impact: "Sync fails or slows down unpredictably.", mitigation: "Respect documented rate limits; back off and retry with jitter; surface sync failures to the user rather than failing silently.", source: "axis:dataOrigin=fetched" });
    risks.push({ id: nextRiskId(), description: "The external source changes its response shape without notice.", impact: "Sync breaks silently or corrupts stored data.", mitigation: "Validate the response shape on every sync; fail loudly rather than storing malformed data.", source: "axis:dataOrigin=fetched" });
    provenance["section:secrets"] = "axis"; // real integration credentials exist — Doc 7 secrets section becomes applicable
  }

  if (idea.axes.temporality === "scheduled") {
    addEntity(entities, provenance, { name: "Job", fields: [{ name: "schedule", type: "string", note: "e.g. a cron expression or plain-language cadence" }, { name: "lastRunAt", type: "Date", note: "optional" }, { name: "status", type: "enum(idle|running|failed)" }], relations: ["Run"] }, "axis");
    addEntity(entities, provenance, { name: "Run", fields: [{ name: "jobId", type: "reference" }, { name: "startedAt", type: "Date" }, { name: "outcome", type: "enum(success|failure)" }, { name: "error", type: "string", note: "optional" }], relations: ["Job"] }, "axis");
    addScreen(screens, provenance, { name: "Run history", purpose: "Shows every past run of the scheduled job, success or failure.", states: deriveScreenStates("history", idea.name) }, "axis", idea.name);
    risks.push({ id: nextRiskId(), description: "A scheduled run is missed (app closed, device asleep, tab not open).", impact: "Data goes stale without the user noticing.", mitigation: "Show a clear 'last run' timestamp; detect and surface a missed run rather than silently skipping it.", source: "axis:temporality=scheduled" });
    risks.push({ id: nextRiskId(), description: "Clock skew between the schedule and the actual run time.", impact: "Runs fire earlier/later than expected, or double-fire.", mitigation: "Use the browser's own clock consistently; guard against double-fire on tab refocus.", source: "axis:temporality=scheduled" });
    provenance["section:scheduler"] = "axis";
  }

  if (idea.axes.temporality === "real-time") {
    addEntity(entities, provenance, { name: "Event", fields: [{ name: "ts", type: "Date" }, { name: "payload", type: "string", note: "raw event detail" }], relations: ["Subscription"] }, "axis");
    addEntity(entities, provenance, { name: "Subscription", fields: [{ name: "channel", type: "string" }, { name: "connectedAt", type: "Date" }], relations: ["Event"] }, "axis");
    addScreen(screens, provenance, { name: "Live view", purpose: "Shows events as they happen, without a manual refresh.", states: deriveScreenStates("live view", idea.name) }, "axis", idea.name);
    risks.push({ id: nextRiskId(), description: "Event volume exceeds what the client can render smoothly (backpressure).", impact: "UI stutters or drops events silently.", mitigation: "Batch/throttle rendering; cap the visible buffer; never block the event loop on a full re-render per event.", source: "axis:temporality=real-time" });
    risks.push({ id: nextRiskId(), description: "The live connection drops (network blip, tab backgrounded).", impact: "The user believes they're seeing live data when they're not.", mitigation: "Visibly show connection status; auto-reconnect with backoff; never show stale data as if it were live.", source: "axis:temporality=real-time" });
    provenance["section:transport"] = "axis"; // Doc 2 gains a transport decision (WebSocket/SSE/polling)
  }

  if (idea.axes.outputArtifact.includes("alert")) {
    addEntity(entities, provenance, { name: "Rule", fields: [{ name: "condition", type: "string" }, { name: "threshold", type: "string" }], relations: ["Notification"] }, "axis");
    addEntity(entities, provenance, { name: "Notification", fields: [{ name: "channel", type: "string" }, { name: "sentAt", type: "Date" }], relations: ["Rule"] }, "axis");
    addScreen(screens, provenance, { name: "Rule editor", purpose: "Where alert thresholds/conditions are configured.", states: deriveScreenStates("editor", idea.name) }, "axis", idea.name);
    addScreen(screens, provenance, { name: "Inbox", purpose: "Where fired alerts land for review.", states: deriveScreenStates("inbox", idea.name) }, "axis", idea.name);
    risks.push({ id: nextRiskId(), description: "Alert fatigue — too many low-value alerts fire.", impact: "Users start ignoring alerts, including real ones.", mitigation: "Default thresholds conservative; let users tune sensitivity; group/deduplicate related alerts.", source: "axis:outputArtifact=alert" });
    risks.push({ id: nextRiskId(), description: "False positives fire alerts for non-issues.", impact: "Erodes trust in the alerting system.", mitigation: "Require the acceptance criteria for each alert rule to name a concrete, testable threshold — see Doc 8.", source: "axis:outputArtifact=alert" });
    provenance["section:alertThresholds"] = "axis"; // Doc 8 gains threshold-based acceptance criteria
  }

  if (idea.axes.stakes === "regulated") {
    addEntity(entities, provenance, { name: "AuditLog", fields: [{ name: "actor", type: "string" }, { name: "action", type: "string" }, { name: "at", type: "Date" }], relations: [] }, "axis");
    addEntity(entities, provenance, { name: "Consent", fields: [{ name: "subject", type: "string" }, { name: "scope", type: "string" }, { name: "grantedAt", type: "Date" }, { name: "revokedAt", type: "Date", note: "optional" }], relations: [] }, "axis");
    addScreen(screens, provenance, { name: "Consent", purpose: "Where the user grants/reviews consent for data use.", states: deriveScreenStates("settings", idea.name) }, "axis", idea.name);
    addScreen(screens, provenance, { name: "Audit view", purpose: "A queryable record of who did what, when.", states: deriveScreenStates("history", idea.name) }, "axis", idea.name);
    risks.push({ id: nextRiskId(), description: "Data is retained longer than the applicable regulation permits.", impact: "Compliance violation.", mitigation: "Define and enforce a retention period explicitly; don't rely on 'we'll delete it eventually.'", source: "axis:stakes=regulated" });
    risks.push({ id: nextRiskId(), description: "A user requests deletion and there's no mechanism to honor it.", impact: "Right-to-delete violation (e.g. GDPR Art. 17).", mitigation: "Design the deletion path from day one, not as a v2 afterthought.", source: "axis:stakes=regulated" });
    validationRules.push({ field: "Any field storing personal/sensitive data", rule: "Collect the minimum necessary; document a retention period; support deletion on request.", reason: "Regulated stakes detected (compliance/audit/PII language) — the usual 'no server, nothing to validate' reasoning doesn't fully cover real personal data at stake." });
    provenance["section:auth"] = "axis"; // Doc 7 auth section becomes applicable
  }

  if (idea.axes.scale === "team") {
    addEntity(entities, provenance, { name: "User", fields: [{ name: "displayName", type: "string" }, { name: "joinedAt", type: "Date" }], relations: ["Role", "Membership"] }, "axis");
    addEntity(entities, provenance, { name: "Role", fields: [{ name: "name", type: "string" }, { name: "permissions", type: "string[]" }], relations: ["User"] }, "axis");
    addEntity(entities, provenance, { name: "Membership", fields: [{ name: "userId", type: "reference" }, { name: "roleId", type: "reference" }], relations: ["User", "Role"] }, "axis");
    addScreen(screens, provenance, { name: "Invite teammates", purpose: "Where new team members are added.", states: deriveScreenStates("editor", idea.name) }, "axis", idea.name);
    addScreen(screens, provenance, { name: "Permissions", purpose: "Where role/access is managed per teammate.", states: deriveScreenStates("settings", idea.name) }, "axis", idea.name);
    risks.push({ id: nextRiskId(), description: "A lower-privilege user can act as a higher-privilege one (privilege escalation).", impact: "Unauthorized data access/modification.", mitigation: "Check role/permission server-side (or in the sync boundary) on every write, never trust client-side role display alone.", source: "axis:scale=team" });
    notApplicable.push({ section: "Row-level security / permissions", reason: "Not applicable as 'no shared data' — this idea has multiple users. Instead: role-based access control is the relevant model here — see the entities/screens above." });
    provenance["section:rls"] = "axis";
  } else if (idea.axes.scale === "single-user") {
    notApplicable.push({ section: "Row-level security / permissions", reason: "Single local user, no shared or multi-tenant data — there is nothing to isolate between users." });
    provenance["section:rls"] = "derived";
  } else {
    notApplicable.push({ section: "Row-level security / permissions", reason: "This idea has no accounts (per Project Zero's own no-backend default) even though it's meant for public/anyone-can-use scope — there's no per-user data to isolate unless accounts are added later. Revisit if the idea's scope grows to include user accounts." });
    provenance["section:rls"] = "derived";
  }

  if (idea.axes.stakes !== "regulated" && idea.axes.scale !== "team") {
    notApplicable.push({ section: "Authentication / access control", reason: "No regulated-data or multi-user signal detected in the problem description — a single local user with no accounts needs none. Revisit if the idea's scope grows." });
    provenance["section:auth"] = "derived";
  }

  // ---- hasBackend = false → Doc 6 gets a module-boundary contract, not REST ----
  const backend = hasBackend(idea.techStack);
  const moduleSurface = backend
    ? []
    : entities.flatMap((e) => [
        { name: `list${e.name}s`, params: "()", returns: `${e.name}[]`, description: `Returns all stored ${e.name} records.` },
        { name: `create${e.name}`, params: `(input: New${e.name})`, returns: e.name, description: `Creates and persists one new ${e.name}.` },
        { name: `update${e.name}`, params: `(id: string, patch: Partial<${e.name}>)`, returns: e.name, description: `Updates an existing ${e.name} by id.` },
        { name: `delete${e.name}`, params: "(id: string)", returns: "void", description: `Removes one ${e.name} by id.` }
      ]);

  const routes: Route[] = screens.map((s) => ({ path: slugifyPath(s.name), screen: s.name }));

  const tasks = idea.mvpFeatures.map((feature, i) => ({
    id: `T-${String(i + 1).padStart(3, "0")}`,
    goal: `Implement: ${feature}`,
    files: [`src/features/${slugifyPath(feature).slice(1)}.ts`],
    dependsOn: i === 0 ? [] : [`T-${String(i).padStart(3, "0")}`],
    acceptance: `Given a user opens ${idea.name}, when they use ${feature.toLowerCase()}, then it behaves as described in the Solution section.`,
    commitMessage: `feat: ${feature.toLowerCase()}`
  }));

  return { idea, entities, screens, routes, moduleSurface, risks, notApplicable, validationRules, tasks, provenance };
}
