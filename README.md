# Project Zero

[![CI](https://github.com/NexuZero/Project_Zero/actions/workflows/ci.yml/badge.svg)](https://github.com/NexuZero/Project_Zero/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](LICENSE)

**Turn problems into projects.**

Project Zero is a lightweight, offline-first "project idea engine." Describe a field, a niche, and a problem, and it generates 10 structured, buildable, open-source project concepts — complete with features, an MVP scope, a suggested tech stack, and a GitHub-ready description.

There is no API key, no account, no cloud AI, and no network request in the core flow. The entire generation engine is a local, rule-based, data-driven system that runs in your browser. An optional, opt-in layer can additionally run a small language model **entirely on your own device** to polish exported prose — never required, never cloud, never on by default.

> Your ideas stay on your device.

---

## Why

Going from "I'm interested in X" to a concrete, scoped project is the hardest first step of building something. Most tools for this either cost money, need an account, send your half-formed idea to a third-party API, or produce generic filler. Project Zero is a focused alternative: fast, private, and built to be extended by the community rather than retrained.

## Features

- **Directed generation** — pick a field, type a niche, describe a problem, get 10 distinct project concepts.
- **Surprise Me** — no input required; combines a field, a compatible niche, and a compatible problem category that make logical sense together.
- **Generate 10 More** — regenerates without repeating names you've already seen this session.
- **Full project detail view** — problem, solution, core/MVP/future features, suggested tech stack, difficulty, build size, AI-required, open-source potential, community value, and a ready-to-use GitHub description.
- **Favorites** — save ideas locally, no account, no sync, no server.
- **Markdown export** — download an idea as a `.md` file shaped like the start of a real README.
- **Dark / light mode**, responsive layout, and installable as a Progressive Web App with offline support.

## How the engine works

Project Zero does **not** call OpenAI, Anthropic, Gemini, or any other LLM/cloud AI service — that's a hard constraint, not a missing feature. Instead, `src/engine/` is a small, deterministic rule engine:

| Module | Responsibility |
|---|---|
| `classifier.ts` | Scores your problem text against 19 weighted-keyword problem categories (automation, monitoring, detection, documentation, …). |
| `naming.ts` | Combines domain/category words with a curated suffix/prefix bank (`Flow`, `Guard`, `Lens`, `Watch`, …) into short, GitHub-friendly names — never repeating a name within a session. |
| `templates.ts` | Feature Intelligence: maps a problem category to a feature set (core/MVP/future), a tech stack, and a build size. |
| `scoring.ts` | Deterministic 0–100 scores (usefulness, originality, buildability, community value, open-source suitability, scope, difficulty) — same input always produces the same score. No machine learning, and none is pretended. |
| `generator.ts` | Orchestrates the above into 10 distinct `ProjectIdea` objects, with controlled randomness so results vary without being incoherent. |

All of the actual knowledge — fields, niches, audiences, problem categories, feature maps, naming word banks, tech stacks, and copy templates — lives in plain JSON under `src/knowledge/`. See [`docs/CONTRIBUTING_KNOWLEDGE.md`](docs/CONTRIBUTING_KNOWLEDGE.md) for how to extend it without touching any engine code.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev            # start the dev server
npm run build          # production build to dist/
npm run preview        # preview the production build locally
npm run typecheck      # TypeScript, no emit
npm run lint           # ESLint
npm run verify:engine  # assertion-based smoke test of the generation engine
```

Open the printed local URL, fill in a field/niche/problem (or click **Surprise Me**), and generate.

## Tech stack

React 18 + TypeScript + Vite + Tailwind CSS + react-router-dom + lucide-react, `vite-plugin-pwa` for the service worker/manifest. No backend. Favorites and preferences persist in `localStorage`; the current results batch and session dedupe list live in `sessionStorage`.

## Project structure

```
src/
  engine/       generator, classifier, naming, scoring, templates — the rule engine
  knowledge/    *.json — fields, niches, problem types, audiences, capabilities,
                naming patterns, tech stacks, project templates (community-editable)
  types/        shared TypeScript types
  hooks/        useTheme, useFavorites, useIdeaSession
  utils/        storage.ts (local/sessionStorage), markdown.ts (export)
  components/   shared UI (Button, Card, ProjectCard, AppShell, ...)
  pages/        Home, Results, ProjectDetail, Favorites, NotFound
docs/           contributor guides for the knowledge base
```

## Privacy

- No analytics, no trackers, no telemetry.
- No account, no login, no server-side storage.
- Your field/niche/problem text and saved ideas never leave your device — there is no network call in the generation, favoriting, or export path.
- Clearing your browser's site data for this app removes everything; there is no server copy.

## Known limitations (v0.1)

Documented rather than hidden, per this project's own build-quality bar:

- App icons ship as SVG (crisp, zero extra build tooling). iOS's "Add to Home Screen" prefers a PNG `apple-touch-icon`; SVG works everywhere else (Chrome/Edge/Android install prompts). A PNG icon set is a good first contribution — see [`docs/CONTRIBUTING_KNOWLEDGE.md`](docs/CONTRIBUTING_KNOWLEDGE.md).
- `npm audit` reports advisories in `esbuild` (dev-server only — doesn't affect the built app) and `react-router` (an open-redirect vector that requires a user-supplied navigation target; every route in this app is fixed and code-defined, so it isn't reachable here). Full detail in [`SECURITY.md`](SECURITY.md). Fixing either is a breaking major-version upgrade, deferred to v0.2 by design rather than rushed in.
- `npm run verify:engine` runs a real, assertion-based smoke test of the generation engine (10-distinct-results, no-repeat regeneration, Surprise Me, score bounds, unknown-field handling) — but there's no component/UI test suite yet (Vitest for components, Playwright for the four screens). See [`CONTRIBUTING.md`](CONTRIBUTING.md) for where that would plug in.
- Local-LLM support exists as an **optional, opt-in enhancement layer only** — Chrome's built-in on-device model (Prompt API) already ships for a single-paragraph idea elaboration, and an in-browser WebLLM provider is being added for richer Planning Kit prose. Neither is ever required: the rule engine in `src/engine/` always works fully offline with zero AI, by design, and every on-device provider is additive polish behind a grounding check that discards anything not already backed by real generated data.

## Roadmap

See [`CHANGELOG.md`](CHANGELOG.md) for what shipped.

## Contributing

Adding a field, niche, naming pattern, or project template is a JSON edit — no engine code required. See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/CONTRIBUTING_KNOWLEDGE.md`](docs/CONTRIBUTING_KNOWLEDGE.md).

## License

[MIT](LICENSE) — © Project Zero contributors.
