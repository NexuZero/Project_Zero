# CLAUDE.md — read before writing any code in this repo

Project Zero is an offline-first, rule-based "Project Idea Engine." Full spec: `Project_Zero.md`. Planning docs (PRD, TRD, UI/UX, App Flow, Schema, API Contract, Security, Testing, Implementation Plan): `.project-os/planning/`. Live task/decision/issue tracking: `.project-os/PROJECT_STATE.md` — read its Delta block first on resume.

## Non-negotiable
- **No paid or cloud LLM/AI API** (OpenAI, Anthropic, Gemini, or any other) anywhere in the generation path, ever. The rule engine in `src/engine/` must always work fully offline. This overrides convenience every time.
- No backend, no accounts, no analytics/trackers in V1.
- User data (ideas, favorites) never leaves the device — no network calls beyond loading the app's own static assets.

## Working rules
- Only change what the current task requires. Never refactor unrelated code without asking.
- Ask before: adding a dependency not already in `.project-os/planning/02-TRD.md`, changing the data model in `05-SCHEMA.md`, altering the stack, deleting files, or renaming anything project-wide.
- Never touch lockfiles, `.env*` contents, or git history unless the task is explicitly about them.
- The knowledge base (`src/knowledge/*.json`) is data-driven by design — new fields/niches/naming patterns/templates should be addable via JSON edits, not code changes. See `docs/CONTRIBUTING_KNOWLEDGE.md`.
- If stuck after two failed attempts on the same problem: stop, explain what was tried, propose 2–3 options.
- After every task: report what changed, which files, how to verify it, and open questions.
- Keep `.project-os/PROJECT_STATE.md` current — Task Register, Decision Log (including `[DEFAULT]` choices), Event Log.
