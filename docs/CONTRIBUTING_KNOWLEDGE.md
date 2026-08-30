# Extending the knowledge base

Everything Project Zero "knows" lives in `src/knowledge/*.json`. None of it requires touching `src/engine/` or any React code. This doc walks through each file with a real example for each.

After editing any of these files, run `npm run dev`, submit a few different problems on the Home screen, and check that your addition shows up naturally — in the card, and in the full detail view.

---

## `fields.json` — add a field

A field is a top-level area (spec examples: Applied AI, Cybersecurity, DevOps, ...). Shown in the Field combobox's suggestions and used to pick a tech stack and default audience.

```json
{
  "id": "robotics",
  "name": "Robotics",
  "description": "Building and operating physical, sensor-driven machines.",
  "keywords": ["robot", "sensor", "actuator", "firmware", "telemetry"],
  "domainWords": ["Robot", "Sensor", "Fleet", "Telemetry"],
  "defaultAudiences": ["solo-developers"]
}
```

- `id` — lowercase, hyphenated, unique.
- `keywords` — not currently used for classification (that's `problem_types.json`'s job) but reserved for future field-aware matching; keep them relevant.
- `domainWords` — feeds the naming engine (e.g. "Robot" + "Watch" → "RobotWatch"). Pick 3–6 short, capitalized, recognizable nouns.
- `defaultAudiences` — must reference an id from `audiences.json`; used as a last-resort fallback when no audience is a better match.

If you also want a tailored tech stack for the field, add an entry to `tech_stacks.json` (see below) — if you don't, generation falls back to a sensible generic stack automatically, so this step is optional.

## `niches.json` — add a niche

A niche is a specific angle within one or more fields, used both as an autocomplete-style suggestion and as the middle term in **Surprise Me**'s field × niche × category combinations.

```json
{
  "id": "warehouse-automation",
  "label": "Warehouse Automation",
  "compatibleFields": ["robotics", "automation"],
  "compatibleCategories": ["automation", "monitoring", "reliability"]
}
```

`compatibleFields` and `compatibleCategories` must reference real ids from `fields.json` and `problem_types.json`. This is what keeps Surprise Me "logical, not random" (spec §9) — only pick categories that genuinely fit the niche.

## `problem_types.json` — add or tune a problem category

This is the classifier's vocabulary. Each category has a list of weighted keywords/phrases; the classifier scores a problem description by summing the weights of every phrase it finds (case-insensitive substring match).

```json
{
  "id": "scheduling",
  "name": "Scheduling",
  "description": "Coordinating when things happen so people and systems don't collide.",
  "keywords": [
    { "term": "double-booked", "weight": 3 },
    { "term": "conflicting times", "weight": 2 },
    { "term": "calendar", "weight": 1 }
  ]
}
```

- Weight `3` = a strong, near-unambiguous signal; `1` = a weak supporting signal. Look at existing categories for calibration.
- If you add a new category id, also add an entry for it to `capabilities.json` (its feature set) and `project_templates.json` (its copy) — otherwise generation falls back to a generic category, which works but won't feel tailored.

## `capabilities.json` — Feature Intelligence for a category

A flat list of 5–7 feature names for a category id. The generator splits this into Core (the full list) / MVP (roughly the first half) / Future (the rest, plus one synthesized extra).

```json
"scheduling": ["Calendar Sync", "Conflict Detection", "Notifications", "Recurring Rules", "History"]
```

## `naming_patterns.json` — add a naming suffix or prefix

```json
{ "word": "Slot", "fitCategories": ["scheduling", "management"] }
```

Add to the `suffixes` (or `prefixModifiers`) array. `fitCategories` should reference real category ids — the naming engine prefers suffixes that fit the chosen category, falling back to the full list if nothing matches. Keep new words short (the combined name is capped at `maxNameLength`), clean, and pronounceable — the spec explicitly asks to avoid ridiculous combinations.

## `tech_stacks.json` — a tech stack preset for a field

Keyed by field id, with three variants the generator picks between based on the problem category: `cli`, `webDashboard`, `browserOnly`.

```json
"robotics": {
  "cli": ["Python", "Typer", "SQLite"],
  "webDashboard": ["Python", "FastAPI", "PostgreSQL", "React", "TypeScript"],
  "browserOnly": ["TypeScript", "React", "WebSocket", "IndexedDB"]
}
```

If a field has no entry here, generation silently falls back to a generic stack per variant — adding an entry just makes the suggestion more specific to that field.

## `project_templates.json` — copy for a category

Each category id maps to a few short template strings for its tagline, "why it should exist," solution, and GitHub description. Multiple entries per array give variety across a batch of 10.

```json
"scheduling": {
  "taglines": ["Stop double-booking {niche}.", "Conflict-free scheduling for {field}."],
  "why": ["{problem} A calendar that doesn't catch conflicts isn't really doing its job."],
  "solution": ["{name} checks every new booking against existing ones in {niche} and flags conflicts before they happen."],
  "githubDesc": ["Open-source conflict-aware scheduler for {field}."]
}
```

Placeholders: `{field}` / `{Field}` (capitalized), `{niche}`, `{problem}`, `{targetUsers}`, `{name}`. Write natural sentences — these are read directly by real users evaluating whether to build the idea.

## `audiences.json` — add a target user

```json
{ "id": "warehouse-managers", "label": "Warehouse Managers", "compatibleFields": ["robotics", "automation"] }
```

Used to auto-fill "Target Users" when the user leaves that field blank, and in Surprise Me.

---

## What you never need to touch

`src/engine/*.ts` is generic orchestration over whatever is in `src/knowledge/`. A well-formed JSON addition following the shapes above is picked up automatically — no code changes, no rebuild logic, no new components.
