---
title: Development Logs
source: event-fed
owner: engineering
lastReviewed: 2026-06-28
status: seed
---

# Development Logs

Dated log of what shipped and why, appended from CI/release events. Newest first.

### 2026-10-16 — Model failover: many keys, many providers, work never stops
- **Key pools** (`server/ai/keys.ts`):
  - Every provider rotates its keys. A 429 rests the key for 1 minute, 401/403 for
    1 hour, 5xx for 15 seconds.
  - Gemini keeps one pool per role: worker → fast, complex work → balanced,
    CEO/COO → frontier. Each tier borrows the other roles' keys only when its own
    are all resting.
- **Router fallback chain:** a failure no longer drops straight to Echo. `run()` tries
  the picked model, then every other reachable model cheapest-first, then Echo.
- **Honest labels:** Echo is now labelled `local-echo`. Before, an Echo answer after a
  failure carried the failed model's name and price.
- **Unavailable models:** a model that returns 404 on every key (e.g. `gemini-4-argon`
  before the account has access) is skipped for 30 minutes.
- **Registry changes:**
  - Gemini 2.5 flash/pro + 4 Argon (CEO seat).
  - Groq now uses `openai/gpt-oss-120b`; llama-3.3-70b is enterprise-only now.
  - New providers: Mistral and GLM (SiliconFlow).
  - Tavily rotates `TAVILY_API_KEY`/`_ONE`/`_TWO`.
  - The Gemini key moved from the URL to the `x-goog-api-key` header.
- **Secrets incident:** the founder's real keys were in `.env.example`, which gets
  committed and which Next.js never reads (so no key was ever live).
  - Moved them to git-ignored `apps/web/.env.local` and generated a real `AUTH_SECRET`.
  - Both templates are now placeholders.
  - New test: templates must contain no key-shaped values.
  - Founder advised to rotate the keys.

**Verification:** typecheck 0 · apps/web **155/155** (141 + 12 failover + 2 template).
**Not run:** live calls to any provider (the sandbox has no network to them). Whether
`gemini-4-argon` answers for these keys is unknown until the founder runs it.

### 2026-10-12 — Gati UI/UX: Live Dispatch rebuilt + calm theme + mobile tab bar
Structural:
- Dispatch reordered around "what needs me now": attention tiles (at risk · waiting ·
  oldest wait · captains free) → queue sorted at-risk-first then longest wait.
- Each ride shows its **best free captain from the same planner auto-dispatch uses**, with
  one-tap **Assign <name>** and the full chooser kept.
- An auto-dispatch preview ("N assigned, M stay waiting") before pressing the button, and
  a supply-vs-demand panel per category.
- The map moved below/beside the queue; fixed heights removed. Pre-bookings no longer
  show a "waiting" time.
- Phones get a fixed bottom tab bar. The header blur was removed because it trapped the
  fixed bar.

Theme: one palette remap in `index.css` (neutral greys + one indigo accent; colour kept
only for meaning), coloured glows and bouncing badges removed, and hard-coded hex
backgrounds replaced. Founder never picked A/B/C, so this follows his standing preference
(clean, dark, Linear/Vercel-like) rather than one of the three generated directions.
**Verification:** typecheck 0 · **129/129** unit (+2 for queue order and wait formatting) ·
**34/34** browser, with the 18 visual baselines regenerated for the new design.

### 2026-10-12 — "Code is not running": both products run; real fixes
**Why Gati didn't run on the founder's PC:** `projects/gati-rides/node_modules` is a stale
partial install from 5 Aug (12 of 25 packages, with no express, tsx or vitest), so
`npm run dev` failed inside tsx. The code itself was fine: on a full install, typecheck
was 0, tests 122/122, and dev served the page (200) and `/api/state`.
Fix: `scripts/check-install.mjs` now runs before dev/test/build and names the missing
packages plus the one command that fixes them (`npm install`), with tests.
**FounderOS:**
- Workspace `npm run typecheck` was actually failing. `packages/db` is an empty package
  with scripts, and `packages/logger`/`core` used `rootDir: src` while mapping sibling
  sources. Fixed: rootDir dropped; db scripts removed until it has code.
- Next.js 14.2.5 → **14.2.35**, which clears the critical advisories including the
  middleware authorization bypass.
- Root lockfile cleaned (stale `apps/gati-rides` entries).
- mono-doctor no longer flags the empty `node_modules` that test runners leave.
**Gati edge-case audit** (12 new real-browser edge tests). Two bugs found and fixed, each
with a test that fails without the fix:
1. Escape didn't close the call form, which wasn't a real dialog. Fixed: role=dialog,
   focus in and back to the opener, Escape closes.
2. A ride another operator had already dispatched showed "Booking bk-201 is already
   dispatched", and the stale queue kept offering Assign. Fixed: the message names the
   passenger, and a 404/409 refetches state.

Also removed two unverifiable claims from the call form ("Zero-Latency", "under 5 seconds").
Passed without changes: double-click save, long names at 360/1280, offline save, 429 busy,
invalid phone, 320px on every tab.
**Verification:** FounderOS typecheck 0 (all workspaces) · tests 141 + 4 + 12 · doctor clean ·
`next dev` serves /signin 200, API 401 unauthenticated. Gati typecheck 0 · **127/127** unit ·
**34/34** browser (22 + 12 edge).
**Not run:** FounderOS `next build` (the sandbox can't reach Google Fonts; it needs internet),
anything on the founder's PC.

### 2026-10-12 (later) — RaKeGa decisions R1–R6 recorded
Brand RaKeGa; one app with four modules (Live · Learn · Works · Reach); full service
catalogue added (build, AI & automation, ads, content, teaching for clients, care); first
Reach niche = coaching institutes in Vizianagaram, Visakhapatnam and Vijayawada; Basic and
Advanced course tiers; deliveries reviewed by the founder via Telegram delivery records; no
recording now: open-licence test content with an NC-blocks-paid rule; **$0 until launch**
(local LiveKit, local HLS → R2, Razorpay test mode, YouTube embed for free workshops,
Oracle free VM as an untested option under ~200 seats). LetsUpgrade crawler config added.
**Verification:** `test:configs` 6/6 (7 configs load). Docs only otherwise; no RaKeGa code yet.

### 2026-10-12 — RaKeGa planned · crawler fixed · six reference studies
Gati Rides paused at v1 (founder's call). **RaKeGa** (product 11, `projects/rakega/`):
manifest, binding CLAUDE.md, `.env.example`, README, decision log, and `details/brief.md`:
name options, three zones (Live · Learn · Works) + Reach agent, Stage + Audience live
architecture with costs from published prices, first 10 courses, outreach guardrails
(human approval, caps, opt-out, suppression), 5 cycles to MVP.
**Crawler fixes (Product-Research-Engine):**
1. `crawl:gated` public runs passed no mode flag, so crawl.js printed its usage and every
   public run failed. Fixed in `gate/args.mjs`, with a regression test.
2. `_TEMPLATE/config.js` was byte-identical to `runway/config.js`, so copying it crawled
   Runway. Replaced by `research/lib/site-config.js`, which builds a config from about 15
   lines of facts, discovers and follows pricing/course/feature pages, and **writes a
   real, generated Layer-1 UI map**. Before this, crawls only left L1 stubs, so the gate's
   L1 check could never pass.
3. `CRAWL_HEADLESS=1` added for runs with no display.
Six configs added (atoms, lovable, replit, be10x, outskill, graphy) and six reference
studies written in `docs/research/references/` (internal only, per CLAUDE.md §1).
**Verification:** `test:configs` 6/6 · `test:gate` 9/9. One end-to-end gated run against a
local fixture site passed the gate's machine check: 3 pages, 4 nav links, login/privacy and
off-site links skipped, real L1 written. The run was in a scratch copy, so the real ledger
is still at 0/7.
**Not run:** any crawl of the six real sites (sandbox can't reach them; runs happen on the
founder's PC); FounderOS app tests (no app code changed, baseline 141); RaKeGa has no code
yet by design (cycle 1 creates it).

### 2026-10-11 — Gati Rides cycle 6 ("Make it sellable") + git/CI for both repos
Gati: operator login (HMAC-signed HttpOnly/SameSite=Strict cookie, Secure on HTTPS,
failure-only lockout, every `/api` route protected, cross-site changes refused, sign-in
screen + sign-out + expired-session handling); production refuses to start without strong
credentials; built server fixed to production at build time (found `npm start` would have
skipped login and run Vite dev mode); README/runbook replacing AI Studio boilerplate;
Dockerfile (no `VOLUME` — Railway rejects it); CI + manual baseline workflow; demo script and
Contra/Gumroad/Fiverr listing drafts. FounderOS: `.gitattributes`, `.gitignore` (Gati in its
own repo), `.github/workflows/ci.yml`; `docs/YOUR-NEXT-STEPS.md` for the founder's side.
**Verification:** Gati typecheck 0; **122/122** unit+screen; **22/22** browser (stable);
production-only install checked (refuses without secrets; 401→200 with login); bare-copy
reinstall passes; eject ✓ (50 files). **Not run:** Docker build, GitHub Actions (no repo yet),
any deployment, the founder's PC. FounderOS app code unchanged this session (141 baseline).

### 2026-10-10 — Gati Rides cycle 5 ("Make it durable")
Persistence: server-authoritative state behind a `GatiStore` seam (`JsonFileStore`, atomic,
serialised; `MemoryStore` for tests), domain operations shared by server and an in-memory
client adapter, 7 state routes with validation and write rate-limits; the client reads and
writes through `GatiApi` with loading/error/retry states and a demo reset. Browser checks:
Playwright on a real Chromium (sandbox needed one library, unpacked locally) — 18 visual
baselines + 2 journeys. The browser found horizontal overflow on every screen at 1024–1280 px
and on phones, Revenue missing from the mobile nav, hot-linked stock photos of real people as
captain avatars, a fake "Grid Active" status, "Direct Payout Ready", a hard-coded ETA — all
fixed (report D1–D11).
**Verification:** typecheck 0; **103/103** unit+screen; **20/20** browser; overflow sweep
30/30; production restart survival proven; bare-copy reinstall passes everything; FounderOS
eject ✓ (44 files). **Not run:** your PC, real Gemini, a screen reader, multi-operator use.

### 2026-10-10 — Gati Rides cycle 4 ("Make it right")
Every dashboard figure computed (`src/lib/stats.ts`) — removed padded counters and printed
trends no data supported ("↑ 18% vs Yesterday", "92% Compliance", "1.3x Surge", "+24% vs
Last Week", hard-coded revenue breakdown). One dispatch rule (`src/lib/dispatch.ts`,
`canServe`) replaces five inconsistent ones — auto-dispatch had paired rides and captains by
position. Model output whitelisted/clamped (`server/sanitize.ts`); caller note fenced in the
prompt. Accessibility: 0 unnamed controls on every screen and the call modal (was 16),
guarded by an audit test proven to fail on regression. Fake actions made honest (fleet
broadcast "delivered", WhatsApp ticket). Other brands' names and three real public
figures' names removed. Eight extra bugs fixed (B1–B8, incl. Prime→XL miscategorisation
and a lockfile drift that would break `npm ci`). Re-estimated to 6 cycles.
**Verification:** Gati typecheck 0 errors; **67/67** tests (was 28); build OK; prod + dev
servers answered; bare-copy `npm ci` → typecheck → tests → build pass; FounderOS eject ✓
(28 files). FounderOS itself unchanged (141 baseline). **Not run:** your machine, a real
browser, real Gemini, a screen reader end to end.

### 2026-10-10 — Our own design skill: `design-director`
Founder asked for our own design skills covering what template marketplaces offer. We
don't copy anyone's templates (their layouts, code and assets aren't ours); we built a
**generator** instead: `skills/design-director/` with a design genome of 11 axes (18
layouts · 16 colour strategies · 31 Google-Fonts pairings · 7 shapes · 4 densities ·
8 motion characters · 12 imagery · 9 nav · 8 surfaces · 12 heroes · 15 signature moves),
23 industry rule-sets, 19 incompatibility rules, and down-weighting of the overused "AI
look". `scripts/design.mjs` (Node, no deps) samples 3 directions forced ≥12/19 apart,
remembers each project's choices so looks don't repeat, generates OKLCH palettes pushed
to WCAG contrast, and writes `tokens.css`, a Tailwind v4 `@theme`, `DESIGN.md`. SKILL.md
holds the workflow (brief → reference study → directions → tokens → build → browser
verification); references cover pages, sections, 22 industry playbooks, reference study
and Playwright verification. Packaged as `skills/dist/design-director.skill`. The 10
project CLAUDE.md files no longer prescribe one aesthetic — each points to the skill
with its own industry. Cycle Plan cycle 4 gate updated.
**Verification:** `node --test tooling/skills/design-director.test.mjs` **10/10** —
including every colour strategy × 36 hues passing all 10 contrast checks, distinctness
across all 23 industries × 15 seeds, no repeats vs history, industry rules over 200 seeds;
`validate` clean; packager validation passed. Font weights for the 14 fixed-weight
families checked live against Google Fonts. **Not run:** an A/B evaluation of real
builds with vs. without the skill (needs subagent runs); the 17 variable-weight families
weren't individually fetched.

### 2026-10-10 — Gati Rides cycle 3 ("Make it tested") + install-completeness check
**Gati Rides** (`projects/gati-rides`): strict TypeScript errors 13 → 0 at their causes;
API split into `server/api.ts` (`createApp`, injected model client) so it is testable;
first suite of **28 tests** (15 API incl. T17–T22, 6 screens, 2 core-journey, 3 regressions,
2 empty-fleet). Two silent state bugs fixed, each with a regression test proven to fail on
the old code: captain *Accept* swapped its arguments and was dropped; the passenger screen
could show a captain dispatch never assigned. Lockfile added. Report:
`delivery/gati-rides/04-cycle3-test-report.md`; 9 findings queued for cycle 4 (KI-11).
**FounderOS:** found that Gati's own install was incomplete — it ran by borrowing 16
packages from the root install, which the static eject check couldn't see (and my
2026-10-01 "root `npm install`" advice would have pruned). New `server/project-folders/install.ts`
reports complete / incomplete / not-installed per app from the app's own `node_modules`;
shown as a pill on the project card. Regression test included. KI-5 instructions corrected.
**Process note:** the first attempt at this work was lost when the sandbox's scratch space
was reset before files were copied back; it was redone from the same scripted patches and
each step is now copied to the project as soon as it verifies.
**Verification:** FounderOS Vitest **141/141** (6 new), `tsc` clean, ESLint
(`next/core-web-vitals`) clean on touched folders. Gati: typecheck 0 errors, **28/28**,
build OK, production + dev servers answered, **bare-copy `npm ci` → typecheck → tests →
build all pass with FounderOS absent**, FounderOS eject check ✓. **Not run:** anything on
the founder's Windows machine; a real browser; real Gemini.

### 2026-10-09 — Cycle Plan (planning, no code changed)
Founder asked for one plan covering FounderOS and every project. Wrote
`blueprints/FounderOS-Cycle-Plan.md`: **FounderOS first, never without a project** — a
5-cycle MVP (Create · Company · Research · Design · Deliver), each cycle accepted only when
the pilot (the bank app, recommended VaultRelay) passes through it; tiers of 7/9/14 cycles;
a checkpoint every 3 cycles; 12 project seats as contracts; Workers as our own always-on
seats; Cowork as the executor now via a file-based task/receipt bridge (`SeatExecutor`:
Cowork · API later · Echo); per-project `node_modules` (shared install refused: it breaks
eject and caused KI-5); honest bank boundaries (public pages only, no saved real-bank
sessions, synthetic money). Replaces last week's projects-first ordering.
**Verification:** none run; no code changed. Six decisions await the founder (§9).

### 2026-10-02 — Projects-first: 10 standalone product folders + the crawler's 7-run gate
**Decision (founder):** build the products now, standalone, with a coding agent + Gemini +
free keys; evolve FounderOS in parallel from what the builds teach. Recorded as the
strategy change at the top of `blueprints/FounderOS-Product-Factory-Plan.md`.
- **`projects/<slug>/` × 10** (lumapath · wardweave · ledgerweave · vaultrelay ·
  intentcart · mealmesh · sourceweave · voxrelay · fleetlens · proofgate), each with:
  `project.json` (status `planned`, split layout, ports `51NN`/`41NN`), a binding
  per-project `CLAUDE.md` (eject invariants, stack, free-first model ladder, standards,
  roadmap definition of done, notes-for-FounderOS step), `details/brief.md` extracted
  verbatim from the roadmap HTML + starter-prompt briefs (source links kept),
  `details/prompts.md` (Prompts A/B/C), `.env.example`, `.gitignore`, `README.md`.
  No `frontend/`/`backend/` yet — no empty scaffolding. `projects/README.md` indexes them.
- **Root `CLAUDE.md`:** a product's own `CLAUDE.md` governs inside its folder.
- **Product-Research-Engine `gate/`:** `crawl:gated` wraps the unchanged crawler, checks
  the output (exit 0; required layers fresh, non-stub, substantial), and records the run;
  `gate:review` records the human "useful" verdict. 7 runs that pass both → integrate
  into FounderOS. Crawler source not read or modified.
**Verification:** all 10 manifests validated against the real zod schema (22 distinct
ports incl. FounderOS 3000 + Gati 3001); gate tests **8/8** (`node --test`); gate CLI
rehearsed end-to-end in a scratch copy with a stand-in crawler (pass, fail, bad id,
missing config, review, ledger render) — the real ledger starts empty. FounderOS re-run:
Vitest **135/135**, `tsc --noEmit` clean, `mono-doctor` clean; the real registry lists all
11 folders as unclaimed with their names. **Not run:** the real crawler (needs Windows
Chrome + Playwright on your machine); any product code (none exists yet).

### 2026-10-01 — Track A Stage 1 shipped: `projects/`, manifest, registry, eject verifier
Product Factory step 1. Client/product codebases now live in **`projects/<slug>/`**, outside
the npm workspace graph, each with a zod-validated **`project.json`** (paths confined,
commands limited to package-manager verbs, strict keys).
- **Server:** `server/project-folders/` — `ProjectFolderRegistry` (list · get · claim ·
  status · verifyEject; disk-backed, renamed from the plan's `ProjectWorkspaceRegistry` to
  avoid colliding with FounderOS *workspaces*), port-probe status, and the **eject
  verifier** (no `@founderos/*` imports, no out-of-project imports or `workspace:`/`file:`
  deps, no FounderOS env, every env var documented, README present; symlinks never
  followed; truncated scans never report clean). Ownership lives in
  `projects/.owners.json`, outside every project, so ejected copies carry nothing of ours.
- **API:** `GET /api/v1/project-folders`, `GET …/:slug` (status), `POST …/:slug/claim`,
  `POST …/:slug/eject-check` — session, same-origin on mutations, rate limits, zod slugs.
- **UI:** "Built projects" section on `/projects` — five states, live port pills
  (`aria-live`), copy-ready commands, eject receipt with per-check marks.
- **Migration:** `apps/gati-rides` → `projects/gati-rides` with its manifest; `dev:gati` now
  `npm --prefix projects/gati-rides run dev`. The verifier caught one real gap
  (`DISABLE_HMR` undocumented) — documented in its `.env.example`; Gati-Rides now passes.
- **Plan:** added **FounderOS Workers** (our own always-on department workers) to the
  Product Factory Plan; `projects/` is their sandbox.
**Verification (run in the sandbox against the real install):** `tsc --noEmit` (strict,
`noUncheckedIndexedAccess`) **clean**; Vitest **135/135 passing** — 32 new + 103 existing
(the CLAUDE.md "92" baseline was stale); ESLint `next/core-web-vitals` clean on all new and
touched files; `mono-doctor` **clean, zero nested installs**; manifest + eject verified on the
real Gati-Rides folder. **Not run:** `next build`, the UI in a browser, root `npm install`.

### 2026-09-30 — Product Factory Plan (planning, no code moved)
Read `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (10 products) and
wrote `blueprints/FounderOS-Product-Factory-Plan.md`: an 8-stage pipeline (research →
debate → design → scaffold → build → verify → package → sell) with human approval gates.
Named the real gap plainly: FounderOS *thinks* but cannot yet *build* (no
write → run → read-errors → fix loop). Plan: **Build Pack** first (FounderOS plans and
verifies, an existing coding agent executes), then a confined, allow-listed **native Build
Engine** via the project runner. Added a **Design Studio** stage (Gemini generates
HTML/Tailwind screens with all five states; Google Stitch as an optional import). Grok is
registered through the existing OpenAI-compatible adapter (`api.x.ai/v1`). Recommended
**one product at a time**, starting with **LedgerWeave**, because the roadmap's
3-in-10-days wave assumes three contributors.
**Verification:** none run; no code changed.

### 2026-09-04 — Three-Track Plan (planning session, no code moved)
Returned after a break. Verified repo state: **2 `node_modules`** — root plus
`apps/gati-rides` — and traced the root cause to a **React 19 vs 18.3.1 conflict**, not a
mistake by npm. Diagnosed the real issue as a *category error*: a client project registered
as a FounderOS npm workspace. Read the Doctrine first, then wrote
`blueprints/FounderOS-Three-Track-Plan.md` covering:
**A) Project Registry + ejectable projects** (`projects/` outside the workspace graph,
`project.json` manifest, staged orchestration, and an **eject verifier** enforcing three
no-lock-in invariants); **B) Token Router** (quota-aware rotation across free tiers, with
an honest correction that the Kimi/Qwen/MiMo *CLIs* are dev tools, not runtime APIs);
**C) Agency Service Catalog** (the ten marketing services productized, with an explicit
honesty line that FounderOS briefs and scripts them but does not produce artwork or edited
video). Sequenced A → C → B → A-Stage-2.
**Verification:** none run — no code changed. Repo byte-identical apart from docs.

### 2026-08-01 (later) — The Delivery Engine + Doctrine
Reframed the whole project around the founder's actual scoreboard: **one user finding it
worthy**, and money from delivered work — not market share. Wrote `FounderOS-Doctrine.md`
(North Star, the client-need→money chain, the four laws: effective · efficient · ethical
& safe · understandable, and what we will never do).

Built the missing link between "agents debated" and "client paid": **Delivery Studio**
(`/delivery`). A client requirement in plain language becomes a sellable **Solution
Blueprint** — the agentic loop (each step with role · action · tool · handoff), the ML/GenAI
systems required (and honestly where none is), the tech stack with monthly cost bands and
free-tier reality, milestones with day estimates, risks, dual pricing (service vs product),
and a proof-post draft that feeds the daily posting habit. Copy-as-Markdown makes it a
client deliverable in one click; blueprints persist to project memory so the company
remembers what it quoted. Guards identical to every other surface (same-origin, session,
4/min rate limit, safety gate, ownership check before the stream opens); strict-JSON parsing
of untrusted model output with an honest, clearly-labeled offline template as fallback.
Verified: tsc clean, **92/92 tests**.

### 2026-08-01 — Cloud-only free engine + Engine Room
**Bug caught before first launch:** Ollama was auto-registered, so on a machine without it
running the router would pick `llama3.1` (cheap + capable), fail, and silently drop every
run to Echo — the founder would never see a real model. Ollama is now **opt-in**
(`OLLAMA_URL` / `OLLAMA_ENABLED=1`) and `pick()` only considers registered providers.
Added `OpenAICompatibleProvider` — one adapter for every OpenAI-shaped cloud, wired to
**Groq** (`GROQ_API_KEY`, fastest free inference) and **OpenRouter** (`OPENROUTER_API_KEY`,
many `:free` models), both with env model overrides since vendor ids drift. New
`GET /api/v1/providers` returns booleans + public hints only (never key material), powering
the **Engine Room** panel in the Boardroom: live providers lit, dormant ones dimmed with the
exact env var and where to get the key. `.env.example` rewritten as a free-key shopping list.
Verified: tsc clean, **84/84 tests**.

### 2026-07-13 (later) — Free-first model ladder
The company now runs on REAL models for $0. `OllamaProvider` (local, no key; `OLLAMA_URL`/
`OLLAMA_MODEL`, always registered outside tests — unreachable daemon degrades cleanly) and
`GeminiProvider` (free tier, `GEMINI_API_KEY`; throws on non-200/empty → clean fallback).
Registry gains `llama3.1` (0.78), `gemini-1.5-flash` (0.82) and `gemini-1.5-pro` (0.90) at
costPer1k 0 — the cheapest-capable sort now prefers free real models automatically, and with
a Gemini key even CEO/frontier seats run real for free. `pick()` considers only registered
providers; under Vitest the router is deliberately Echo-only so suites stay deterministic.
Mocked-fetch tests for both adapters (no network in tests). Env guide + audit updated.
Verified: tsc clean, 72/72 tests (all pre-existing suites untouched).

### 2026-07-13 — Demo Mode: the product presents itself
`/demo` (server-guarded; "▶ Present" button in the Boardroom + ⌘K action): a six-act,
self-driving keynote rendered by the product from its own data. Act I real workspace
numbers · Act II a LIVE company run (actual SSE stream — activation, debate, CEO ruling,
cost receipt) · Act III `SystemMap`, an animated SVG of the real architecture (guard
stack → router → departments/research → debate → CEO → memory → SSE return path; every
node exists in the repo) · Act IV roadmap lanes · credits with replay. Space pauses,
arrows skip acts, Esc exits; reduced-motion respected; no-project state handled honestly.
Zero new backend surface. Verified: tsc clean, 63/63 tests.

### 2026-07-11 (later) — The Boardroom
Mission Control is now IN the product: `/boardroom` (server-guarded, ⌘K + nav wired).
Three acts: workspace **pulse** (real overview numbers), the **run theater** (pick a real
project, fire a preset intent, and the actual company performs over the same SSE pipe —
activation → departments → debate → CEO ruling; nothing simulated), and the **roadmap
lanes** (Past/Present/Future as data in `features/boardroom/roadmap.ts`, kept in lockstep
with the Flagship Spec). Zero new backend surface — reuses runs stream, overview, and the
Conversation components. Verified: tsc clean, 63/63 tests.

### 2026-07-11 — Research Agent (P1) + Mission Control
- **Research Agent** (`server/ai/research-agent.ts` + `POST /api/v1/research`, SSE): topic →
  3 targeted searches (competitors · demand · risks) → cited ResearchBrief (summary,
  competitors, demand, risks, opportunities, sources). Search seam mirrors the model seam:
  `SearchProvider` contract, Tavily adapter (TAVILY_API_KEY), deterministic offline fixtures
  honestly labeled. Guards: same-origin, session, 4/min rate limit, safety gate, project
  ownership check before stream opens. Briefs persist to project memory (research compounds).
  UI: ResearchPanel on the project dashboard with live query progress + cited brief card.
  Verified: tsc clean, 63/63 tests.
- **Mission Control** (`docs/showcase/FounderOS-Mission-Control.html`): self-demonstrating
  concept page — agent cursor runs the loop live (Stitch-style), Past/Present/Future lanes,
  Strata v2 tokens. Companion spec: `docs/blueprints/FounderOS-Flagship-Spec.md` (no-visible-
  drawback rules + Sonnet task feed T1–T5; T1 research backend now shipped).

### 2026-07-07 (evening) — Agent Debate + Conversation view
The departments now argue before the CEO decides. New debate round in the agent loop
(`server/ai/debate.ts`): each activated department reviews the others' takes and returns
1–2 points tagged support/challenge/concern (cheap tier; offline = deterministic
role-flavoured voices; a tension governor forbids pure-agreement rounds). New `critique`
SSE events stream between departments and synthesis; the CEO synthesis explicitly names
and resolves each disagreement. Plan + department takes + debate persist on the RunRecord.
UI: `ConversationView` renders the four-phase transcript (① plan ② takes ③ debate ④
decision) — live during a run and as replay from any past run in history; challenge/concern
messages styled pink/amber with "AR → QA" arrows. Verified: tsc clean, 58/58 tests green
(all pre-existing suites untouched). Also: listings edit/delete (PATCH fields + DELETE
route + composer edit mode) landed.

### 2026-07-07
Five phases shipped in one pass:
- **Product polish** — global ⌘K command palette (navigate, open any project, actions),
  project search/sort/active-archived views, archive/restore (PATCH, soft & reversible),
  Strata toast system, optimistic create/update with rollback.
- **Hardening** — fixed-window rate limiting (auth 10/min·IP, runs+ideas 6/min·workspace,
  creates 20/min), same-origin checks on all mutations (CSRF defense-in-depth over
  SameSite cookies), list pagination (?limit&offset&status), security test suite.
- **Live runs** — /runs/stream SSE endpoint; the Command Surface streams the run as it
  happens (departments light up on completion). Overview gained a 14-day spend trend.
- **Agent intelligence** — minimum-set department activation (token economy, deterministic
  + testable), pre-model safety gate (refuses weapons/malware/phishing/fraud intents),
  per-run budget governor (CEO degrades tier rather than exceeding RUN_BUDGET_USD),
  memory recall injected into every prompt (runs compound), shared ETHOS clause on all
  system prompts, transparent side-channel inspector in the UI.
- **Freelance Studio** — /freelance: package projects as sellable listings (AI/system/
  app/web/ecommerce), track posting status per marketplace (Gumroad/Contra/Fiverr),
  Idea Agent (/api/v1/ideas) returns 5 transparently scored ideas (demand·effort·fit·
  monetization) with a draft-listing handoff. Suggest-only by design; offline template
  fallback honestly labeled.

### 2026-06-28
Created monorepo skeleton (apps/services/packages/plugins/infra/tooling), root config, and the
docs/ knowledge base. No feature code yet (foundation phase).
