# CLAUDE.md — permanent project instructions

You are working inside **FounderOS**, an npm-workspaces monorepo. Read this file fully
before your first edit in a session. It is binding.

---

## 1 · Identity

FounderOS is a **virtual AI software company**: a founder types one intent, a roster of
role-specialised agents (Product, Architecture, Design, QA+Security, Research, CEO, COO)
activate, **debate each other in the open**, and return **one accountable decision with
receipts** — which model ran, what it cost, what memory it used, who disagreed.

It is also a **delivery engine**: client need → debated blueprint → built system → money →
resold as a product. Every feature must sit somewhere on that chain.

**Three permanent principles**
1. **Receipts over claims** — show model, cost, memory, dissent. Never a black box.
2. **The user brings a key, we bring the company** — no lock-in, data is theirs.
3. **Free-first** — fully usable at $0 forever (offline Echo engine + free cloud tiers).

**North Star:** one user finds this worthy. Not market share. Never benchmark features
against competitors in code, copy, or docs.

---

## 2 · Repository map

```
FounderOS/
├── node_modules/          ONE hoisted install. Never create nested ones.
├── package.json           workspaces: apps/* services/* packages/* plugins/*
├── tooling/mono-doctor.mjs  enforces the single node_modules
├── apps/web/              FounderOS itself (Next.js 14 App Router)
│   └── src/
│       ├── app/           routes + /api/v1/* handlers (thin)
│       ├── features/      feature slices (UI + hooks + types)
│       ├── modules/       domain modules (blueprint-era, some reference-only)
│       ├── server/        ai/ · auth/ · repositories/ · validation/ · security/
│       └── shared/        ui/ · config/themes · motion/ · store/ · providers/
├── packages/              core · utils · logger · config · db (shared, importable)
├── projects/              built products — NOT workspaces. Each has project.json, its own
│                          install, and must pass the eject check (no @founderos/* imports,
│                          no FounderOS env). `.owners.json` maps folders → workspaces.
│                          **Inside `projects/<slug>/`, that project's own CLAUDE.md governs;**
│                          this file's stack rules (Next.js, Mongo, ModelRouter) don't apply there.
├── skills/                our own agent skills. `design-director/` = design genome + generator
│                          (directions → contrast-checked tokens); `dist/` = installable .skill files.
│                          Tests: `npm run test:skills`.
└── docs/                  living knowledge base — see §11
```

**Commands (always from the repo root):**
`npm run dev:web` · `npm run dev:gati` · `npm run typecheck` · `npm run test` ·
`npm run build` · `npm run verify` (all three) · `npm run doctor` / `doctor:fix`

---

## 3 · Development standards

- **TypeScript strict.** No `any`. No `@ts-ignore`. `noUncheckedIndexedAccess` is on —
  index access returns `T | undefined`, handle it.
- **Never leave a TODO, placeholder, stub, or dead branch.** If it isn't finished, it
  isn't committed.
- **Reuse before writing.** Search `shared/ui`, `packages/*`, and existing features first.
  A second implementation of an existing pattern is a defect.
- **Small, honest comments** explaining *why*, not narrating *what*. Every non-obvious
  module opens with a short block comment stating its job and its seam.
- **File size**: if a component passes ~300 lines, split by responsibility.
- **Naming**: features are nouns (`freelance`, `delivery`), hooks are `useX`, server
  seams are interfaces (`XRepository`, `AIProvider`, `SearchProvider`).

---

## 4 · React & Next.js (App Router)

- Server Components by default; add `"use client"` only when you need state, effects,
  or browser APIs.
- Route handlers in `app/api/v1/**` stay **thin**: guard → validate → delegate to
  `server/*` → return via `ok()` / `problem()` from `server/http.ts`. No business logic.
- Pages are server-guarded: `if (!getSession()) redirect("/signin")`.
- Streaming uses **SSE via ReadableStream** (see `runs/stream`, `research`, `blueprints`).
  Client reads with a fetch reader — never `EventSource` (it can't POST).
- Never `position: fixed` inside embedded/widget contexts; never browser storage APIs in
  artifacts.

---

## 5 · State: the golden split

- **Server data → TanStack React Query.** Query keys are arrays, invalidated on mutation.
  Optimistic updates must include rollback (`onMutate` snapshot → `onError` restore).
- **Global UI state → Redux Toolkit** (`shared/store`). Currently: active project,
  create-dialog, command palette. Keep the store *small*.
- **Never duplicate server data into Redux.**

---

## 6 · Data layer (MongoDB + in-memory)

- All persistence goes through a **repository interface** in `server/repositories/`.
  Each has two implementations: in-memory (default, zero setup) and Mongo (when
  `MONGODB_URI` is set), chosen by `getXRepository()`.
- **Every query is workspace-scoped.** `workspaceId` is a required first argument. A
  repository method that can read or write across workspaces is a security bug.
- Strip `workspaceId` and `_id` before returning documents to callers.

---

## 7 · Styling: Tailwind + the Strata design language

- Tailwind utilities only; tokens live in `shared/config/themes.ts` and `globals.css`
  (`--ink`, `--ink2/3/4`, `--accent`, `--accent2`, `--base`, `--raised`).
- Compose from `shared/ui` (`Surface`, `Button`, `Toaster`) — don't hand-roll panels.
- Typography: serif for headings/answers, sans for UI, mono for metadata/receipts.
- **shadcn/ui** is permitted for new primitives, but match Strata tokens — never import a
  competing theme.
- **Motion (Framer Motion / GSAP)**: minimal and meaningful. Shared variants in
  `shared/motion/variants.ts` (`rise`, `chorus`, `chorusItem`). Always honour
  `prefers-reduced-motion`. GSAP only for timeline work Framer can't express.
- **The five-state rule — non-negotiable.** Every screen designs: loading · empty · error ·
  success · degraded. An unstyled state is a defect.

---

## 8 · Security (every route, every time)

1. `sameOrigin(req)` on **all** mutations (CSRF defence-in-depth) — `server/security/rate-limit.ts`.
2. `getSession()` / `requireSession()` — sessions are HMAC-signed, timing-safe verified.
3. `rateLimit(bucket, key, {limit, windowMs})` on auth, runs, ideas, research, blueprints.
4. **Zod validation** of every body/param before use.
5. Workspace scoping on every query (§6).
6. **Secrets only in env.** Never in code, logs, prompts, error messages, or client
   payloads. Status endpoints return booleans, never key material.
7. Treat all model output as **untrusted input**: parse defensively, clamp, whitelist.

---

## 9 · AI model routing (the free-first ladder)

- One interface: `AIProvider { key, complete(input, model) }` in `server/ai/types.ts`.
- `ModelRouter.pick(minQuality)` returns the **cheapest reachable** model clearing the bar;
  `run()` falls back to Echo on any failure so a run never hard-fails.
- Registry order by cost: Echo (offline, always) → Gemini flash/pro, Groq, OpenRouter
  (free, key-gated) → Ollama (**opt-in only**) → Anthropic (paid).
- **Only register a provider whose key exists.** A registered-but-unreachable provider wins
  the cheapest sort, fails, and silently degrades every run — this bug has happened once;
  don't reintroduce it.
- Under Vitest the router is **Echo-only** (`process.env.VITEST`) so suites stay
  deterministic on any machine.
- **Never stop on one limit.** Every provider rotates a key pool (`server/ai/keys.ts`); `run()`
  walks a fallback chain across all reachable models before Echo, and Echo answers are labelled
  `local-echo` — a receipt never names a model that didn't run. Keys live only in `.env.local`;
  `.env.example` holds names only (a test enforces it).
- Adding a provider: if it speaks the OpenAI shape, add one line using
  `OpenAICompatibleProvider` — do not write a new adapter file.

### Agent-loop invariants (`server/ai/run-service.ts`)
Do not change these shapes without updating every consumer and test:
- Event order: `plan` → `department`× → `critique`× → `synthesis` → `done`.
- `result.departments` = activated departments **+ CEO**. Debate entries never go in it.
- Minimum-set activation; ambiguous intent → full company.
- Safety gate runs **before** any token is spent; budget governor degrades tier rather
  than exceeding `RUN_BUDGET_USD`.
- `ETHOS` is appended to every system prompt.

---

## 10 · Testing

- **Vitest** (`vitest.config.ts` mirrors tsconfig path aliases). Run from root: `npm run test`.
- **Every bug fix ships with the regression test that would have caught it.** "Seems fixed"
  is not fixed.
- Unit-test pure logic (activation, governors, scoring, parsers). Integration-test
  repositories and route logic. **Mock `fetch` for provider adapters — tests never touch
  the network.**
- Test the guarantees, not exact literals (e.g. assert "a free model exists at every quality
  bar", not a hard-coded provider list — that assertion broke once when the registry grew).
- Suites must stay green. Current baseline: **155 passing** in apps/web (2026-10-16).

---

## 11 · Memory-first development & documentation

Docs are a first-class deliverable; code and docs never drift. In the **same change** as
the code, update:
- `docs/PROGRESS.md` — the feature table (one row per system)
- `docs/10-development-logs.md` — dated entry: what shipped, why, verification counts
- `docs/12-known-issues.md` — any new limit or debt, stated plainly
- `docs/blueprints/*` — if the plan or doctrine changed

Read before designing anything: `docs/blueprints/FounderOS-Doctrine.md` (the law),
`FounderOS-Flagship-Spec.md` (rules + task feed), `FounderOS-Future-Flagship-Plan.md`
(what's next and in what order).

---

## 12 · Cost optimisation

- Cheapest capable model per task; frontier tiers only for synthesis and client artifacts.
- Short reactive judgments (critiques, classifications) route to the **cheap tier**.
- Cache and reuse before generating. Recall memory instead of re-deriving.
- Every run reports attributable cost; budgets are enforced deterministically, never by
  hoping the model behaves.

---

## 13 · Accessibility

- WCAG AA contrast; keyboard-complete (⌘K palette, focus-visible rings, escape closes).
- Semantic elements; `aria-label` on icon-only controls; `aria-live` on streaming regions;
  `role="img"` + description on charts and diagrams.
- Never nest interactive elements (a button inside a button is invalid — this was a real
  bug in `ProjectCard`).
- `prefers-reduced-motion` disables non-essential animation everywhere.

---

## 14 · Ethical AI (structural, not decorative)

- **Refuse before spending**: `safetyGate()` blocks weapons/malware/phishing/fraud intents
  pre-token, with an honest reason.
- **Never fabricate** data, citations, costs, benchmarks, or capabilities. Use bands
  ("$20–40"), not invented precision.
- **Label degraded output honestly** — offline research says "offline seed"; templated
  blueprints say so. Silence must never masquerade as an answer (providers throw on empty).
- **Cite or don't claim**: research output carries source URLs.
- **Show the disagreement.** A consensus-only debate is a bug; the CEO must resolve every
  challenge explicitly.
- Principles distilled from public craft are fine; **impersonating real people is not**.

---

## 15 · Executive review before every answer

Before you finish any task, verify — and state the result honestly:

1. Does this serve the North Star and sit on the delivery chain?
2. Does it reuse what exists rather than duplicate it?
3. Five states designed? Named fallback? Guards on every route?
4. `npm run typecheck` clean? `npm run test` green (with new tests for new logic)?
5. Docs updated in the same change?
6. Any secret, placeholder, TODO, or unstyled state left behind?
7. **What did I NOT verify?** Say it plainly. An honest gap beats a confident claim —
   never mark a gate green that you did not actually run.
