# Changelog

All notable changes to this project are documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project does not yet follow strict semantic versioning pre-1.0.

## [Unreleased]

### Added
- Naming rationale: every generated idea now explains, in plain language, why its name was built the way it was — which word was used and why, and what the paired suffix/prefix/ending signals. Shown on the Project Detail page and included in the Markdown export.
- Markdown export restructured into a fuller project brief: naming rationale, a Snapshot table, an explicit Scope split (MVP/v1 vs. core concept vs. deferred/future), and an Effort & Difficulty section — replacing the old flat feature list and generic hardcoded roadmap.

### Changed
- Removed `.project-os/` (internal agent planning notes used to build this app) from version control. It's kept locally as a gitignored, unpublished directory — never part of the public repo going forward.

## [0.1.0] — 2026-08-31

Initial release.

### Added
- Home screen: field (select-or-type), niche, problem, and optional target-user inputs, with client-side validation.
- Local rule-based generation engine (`src/engine/`): weighted-keyword classifier, naming engine (session-scoped no-repeat), deterministic scoring, category-driven feature/tech-stack templates, and a generator orchestrating all four.
- Data-driven knowledge base (`src/knowledge/*.json`): 13 fields, 20 niches, 19 weighted problem categories, 22 audiences, per-category Feature Intelligence, naming word banks, per-field tech stack presets, and per-category copy templates.
- "Generate 10 Projects", "Generate 10 More" (no repeats within a session), and "Surprise Me" (logical field × niche × problem-category combinations, not pure randomness).
- Project detail view with the full field set from the product spec, including a ready-to-use GitHub description.
- Favorites, stored in `localStorage`, no account required.
- Markdown export shaped like the start of a GitHub README.
- Dark/light mode (system-aware, persisted, no flash-of-wrong-theme on load).
- Responsive layout: desktop top nav, mobile bottom tab bar.
- PWA: manifest, SVG app icons, offline support via `vite-plugin-pwa`.
- Full planning document set (`.project-os/planning/`) and a persistent agent-rules file (`CLAUDE.md`).

### Known limitations
See `README.md` → Known limitations, and `SECURITY.md` for the two deferred dependency upgrades.
