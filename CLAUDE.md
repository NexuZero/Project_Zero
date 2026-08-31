# CLAUDE.md — read before writing any code in this repo

Project Zero is an offline-first, rule-based "Project Idea Engine." Full spec: `Project_Zero.md`. Planning docs (PRD, TRD, UI/UX, App Flow, Schema, API Contract, Security, Testing, Implementation Plan) and live task/decision/issue tracking live locally in `.project-os/`, if present on this machine — it's gitignored and never published, so don't assume it exists in a fresh clone. When it exists, read `.project-os/PROJECT_STATE.md`'s Delta block first on resume.

## Non-negotiable
- **No paid or cloud LLM/AI API** (OpenAI, Anthropic, Gemini, or any other) anywhere in the generation path, ever. The rule engine in `src/engine/` must always work fully offline. This overrides convenience every time.
- No backend, no accounts, no analytics/trackers in V1.
- User data (ideas, favorites) never leaves the device — no network calls beyond loading the app's own static assets.

## Working rules
- Only change what the current task requires. Never refactor unrelated code without asking.
- Ask before: adding a new runtime dependency, changing the data model, altering the stack, deleting files, or renaming anything project-wide.
- Never touch lockfiles, `.env*` contents, or git history unless the task is explicitly about them.
- The knowledge base (`src/knowledge/*.json`) is data-driven by design — new fields/niches/naming patterns/templates should be addable via JSON edits, not code changes. See `docs/CONTRIBUTING_KNOWLEDGE.md`.
- If stuck after two failed attempts on the same problem: stop, explain what was tried, propose 2–3 options.
- After every task: report what changed, which files, how to verify it, and open questions.
- If `.project-os/PROJECT_STATE.md` exists locally, keep it current — Task Register, Decision Log (including `[DEFAULT]` choices), Event Log. Never commit anything under `.project-os/` — it's gitignored on purpose.
