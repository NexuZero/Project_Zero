# Security Policy

## Reporting a vulnerability

Please open a GitHub issue, or contact a maintainer directly for anything sensitive. There is no bug bounty; this is a community project, but real reports are taken seriously and will be fixed promptly.

## What's in scope

Project Zero has no backend, no accounts, and no network calls in its core flow, which removes most of the usual web-app attack surface (no auth to bypass, no server-side data to exfiltrate, no API keys to leak — there are none). The realistic areas of concern are:

- XSS via user-typed input (field/niche/problem/target user text) rendered back into the UI or into exported Markdown.
- Anything that would make the app silently start making network requests, or silently depend on a **cloud** AI/LLM API — this would violate the project's core premise, not just its security posture. (Optional, opt-in, **on-device** inference is a deliberate, disclosed exception — see "On-device AI" below. It is never on by default and never a substitute for the core engine.)
- Prompt injection via user-typed text, for the optional on-device inference layer only (see below) — mitigated by a grounding check that discards any model output not already backed by the idea's own generated facts.
- Supply-chain risk in dependencies (see below).

## On-device AI (optional)

Project Zero can optionally run a small language model **entirely on your own device** (in-browser WebLLM, or Chrome's built-in model) to enhance the prose in an exported Planning Kit. This is off by default and never required.

- The only network request this feature makes is a one-time download of model weight files from a model CDN, cached locally afterward. Nothing you type, and nothing the app generates, is ever sent anywhere.
- If you never enable it, this code path never runs and never makes a request.
- Model output is validated against the idea's own already-generated facts before display; anything the model states that isn't already backed by real data is discarded in favor of the standard, deterministic output.

## Known `npm audit` advisories (as of v0.1)

| Package | Severity | Issue | Why it's low-risk here | Fix |
|---|---|---|---|---|
| `esbuild` (≤0.24.2, via `vite`) | Moderate (shown as High on `vite`) | Vite's dev server will respond to requests from any origin during local development. | Only reachable while a developer is running `npm run dev` on their own machine; has no effect on the deployed static `dist/` build. | Requires Vite 5→8 (breaking); deferred to v0.2. |
| `react-router` / `react-router-dom` (6.x) | Moderate | Open redirect via `<Link>`/`useNavigate` when the target is attacker-controlled; a separate SSR `deserializeErrors()` issue. | Every navigation in this app targets a fixed, code-defined route — never a user-supplied URL — and the app has no server-side rendering. Neither advisory has a reachable path in this codebase. | Requires react-router-dom 6→7 (breaking); deferred to v0.2. |

Both are tracked as a deliberate v0.2 task (`CONTRIBUTING.md` → Open work) rather than rushed in as a breaking change late in a v0.1 build. Re-run `npm audit` before relying on this table — it reflects the dependency versions pinned in `package.json` at the time this file was written.

## Data handling

All user data (typed field/niche/problem/target-user text, generated ideas, favorites, theme preference) stays in the browser's `localStorage`/`sessionStorage` for this app's origin. Nothing is transmitted anywhere. Clearing site data for this app removes it completely; there is no server-side copy to request deletion of.
