# Contributing to Project Zero

Thanks for considering a contribution. Project Zero is intentionally built so most contributions don't touch application code at all — the "brain" is data-driven JSON, and most improvements are edits to that data.

## The easiest contributions (no code)

Everything in `src/knowledge/*.json` is community-editable:

- Add a **field** (e.g. "Robotics", "Climate Tech") → `fields.json`
- Add a **niche** (a sub-domain angle) → `niches.json`
- Add a **naming pattern** (a new suffix like `Flow`/`Guard`/`Lens`) → `naming_patterns.json`
- Add a **project template** (copy for a problem category) → `project_templates.json`
- Add a **tech stack preset** for a field → `tech_stacks.json`
- Add a **target audience** → `audiences.json`

Full walkthrough with examples: [`docs/CONTRIBUTING_KNOWLEDGE.md`](docs/CONTRIBUTING_KNOWLEDGE.md).

## Setting up

```bash
npm install
npm run dev
```

Requires Node.js 20+. No `.env` file, no API key, no external account is needed to run or develop this project — if you ever find yourself needing one, something has gone wrong (see the hard rule below).

## Before you open a PR

- `npm run typecheck` — zero TypeScript errors.
- `npm run lint` — zero errors (warnings are fine to leave, but please don't add new ones if avoidable).
- `npm run build` — must succeed.
- `npm run verify:engine` — if you touched anything under `src/engine/` or `src/knowledge/`, this must still pass. It bundles the real engine source with esbuild and runs it in Node, asserting things like "10 distinct results," "no name repeats on regenerate," and "Surprise Me works with zero input."
- If you added or edited `src/knowledge/*.json`, also run the app and generate a few batches to sanity-check your addition reads naturally in a card and in the detail view — the automated check catches structural breakage, not whether your new copy reads well.
- There's no component/UI test suite yet (a good first contribution — see "Open work" below), so verify UI changes manually at both a mobile and a desktop viewport width, and in both light and dark mode.

## The one hard rule

**Never add a call to any paid or cloud LLM/AI API** (OpenAI, Anthropic, Gemini, or otherwise) anywhere in `src/engine/` or the generation path. Project Zero's entire premise is that it works fully offline, for free, forever. A PR that introduces a network dependency to the core generation flow will be declined regardless of how good the output looks — see `.project-os/planning/07-SECURITY.md` for the full reasoning. (Architecture for an *optional*, fully local model — Ollama, WebLLM, Transformers.js — is welcome as a genuinely optional enhancement layered on top of, not replacing, the rule engine.)

## Code contributions

- Match the existing structure: `engine/` (pure logic, no DOM), `knowledge/` (data), `hooks/` (state), `utils/` (storage/export), `components/` (UI), `pages/` (screens).
- TypeScript strict mode; no `any` in `engine/` or `types/`.
- Functional components + hooks only.
- Keep PRs focused — one field addition, one bug fix, one feature. Large refactors should start as an issue/discussion first.

## Open work (good first contributions)

- A PNG icon set (see `README.md` → Known limitations) for `public/icons/`.
- A proper component/UI test suite (Vitest + React Testing Library for components, Playwright for the four screens end to end). `scripts/verify-engine.mjs` only covers the engine layer today.
- Upgrading `vite` (5→8) and `react-router-dom` (6→7) to clear the two `npm audit` advisories documented in `SECURITY.md` — both are breaking-change upgrades, so they're deliberately scoped as their own PR rather than bundled into this one.

## Reporting issues

Open a GitHub issue with steps to reproduce. For anything that could be a privacy or security concern, see `SECURITY.md`.
