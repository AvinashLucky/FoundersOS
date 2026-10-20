# CLAUDE.md — VaultRelay

**VaultRelay** · product 04 of 10 · build order #6 · Mobile app (Expo) + API
From navigating banking menus to completing a financial objective under explicit limits. Mobile financial intent with explicit authority.

This file is binding for all work inside `projects/vaultrelay/`. Read it fully, then
`details/brief.md`, before your first edit in a session.

---

## 1 · Scope of this file

- This project is **standalone**. It lives inside the FounderOS repo folder for
  convenience only. If a parent `CLAUDE.md` (FounderOS's) is also loaded, **this file wins
  for everything in this folder**: FounderOS's Next.js, MongoDB, `ModelRouter` and Echo
  rules do not apply here.
- Never import, require, or read code from outside this folder (`../../apps`,
  `@founderos/*`, sibling projects). Copy an idea if you need it; never link it.

## 2 · The three eject invariants (no lock-in — non-negotiable)

1. **No outside code.** Every dependency is in this project's own `package.json` files
   with real versions — never `workspace:`, never `file:` paths leaving the folder.
2. **No outside environment.** Only variables documented in `.env.example`. Nothing
   prefixed `FOUNDEROS_`.
3. **Runs from a bare copy.** `cp -r projects/vaultrelay ~/anywhere`, then `npm install` +
   `npm run dev` in `backend/` and `frontend/` must work with FounderOS deleted.

FounderOS's eject check enforces these statically once the project is added to a
workspace. Keep it green from the first commit, not at the end.

## 3 · Layout and stack

```
vaultrelay/
├── project.json      manifest FounderOS reads (keep delivery.status current)
├── frontend/         Expo (React Native) mobile app
├── backend/          API + database + workers
├── details/          brief.md · prompts.md · every planning/research/release document
├── .env.example      every variable either app reads, documented
└── README.md         how to run it standalone
```

- `frontend/` — Expo (React Native) + TypeScript with Expo Router; `npm run dev` runs `expo start --port 5104`.
- `backend/` — Node.js + TypeScript + Express, zod on every input, Prisma + PostgreSQL, a Postgres-backed job table + worker for durable background work. Port **4104**.
- Products 04–06 share one mobile approach; keep contracts in `backend/` and generate client types from them.
- A Python (FastAPI) service is allowed **only** when `details/ARCHITECTURE.md` justifies it
  (e.g. Docling for document reading). It gets its own folder and its own README section.
- Pin versions you actually installed; commit lockfiles. Check licenses before adding a
  dependency and record it in `details/dependency-register.md`.

## 4 · Work order

1. **Research (Phase 0).** Desk research of the three references' public pages, plus
   crawler output once the Product-Research-Engine gate passes; save under
   `details/research/`. Public pages only — never log in to, pay, or submit anything on a
   reference product.
2. **Plan — Prompt A** (`details/prompts.md`) with `details/brief.md` appended. All output
   files go in `details/`. **Stop for the founder's approval.**
3. **Build — Prompt B.** First one vertical slice: UI action → validated API → domain
   transition → persisted event/job → worker → verified result → updated UI. Then the rest.
   Keep `details/BUILD_STATUS.md` current (implemented · tested · simulated · blocked · deferred).
4. **Release — Prompt C.** Only passing gates make it "ready". Failed gates stay visible.
5. **Hand to FounderOS.** Set `delivery.status` in `project.json`; in FounderOS open
   Projects → Built projects → *Add to workspace* → *Run eject check*.
6. **Leave notes for FounderOS.** Keep `details/founderos-notes.md` as you go: each step
   you did by hand that FounderOS should do next time, the prompts that worked, the checks
   you wished were automatic, and where time was lost. FounderOS is reshaped from these
   notes, so write what actually happened, not what should have.

## 5 · Models and keys (free-first)

- One backend-only `ModelProvider` interface. Order: **Gemini** (`GEMINI_API_KEY`) →
  OpenAI-compatible free tiers (Groq, OpenRouter `:free`, xAI Grok at
  `https://api.x.ai/v1`) → **Simulator** when no key is set.
- **Register only providers whose key exists.** The simulator is deterministic and is
  labelled "simulated" in the UI and in every receipt — never shown as a live model.
- Keys live in `backend/.env` only. Nothing secret gets a `VITE_` / `EXPO_PUBLIC_`
  prefix, and keys never appear in logs, errors, prompts or client payloads.
- Model output is untrusted: validate with zod, clamp, whitelist. Money, identity
  matching, permissions, idempotency and calculations are **deterministic code**, never a model.
- Every AI call records model, tokens, cost and latency. `AI_BUDGET_USD_PER_RUN` caps a run;
  on exhaustion it stops and says so.
- Tests mock `fetch` for providers. Tests never touch the network.

## 6 · Engineering standards

- TypeScript strict, `noUncheckedIndexedAccess`; no `any`, no `@ts-ignore`.
- **Never leave a TODO, placeholder, stub, or dead branch.** Unfinished work is listed in
  `BUILD_STATUS.md`, not hidden in code.
- Auth and authorization server-side. **Every query is scoped by organization (tenant).**
  Two tenant fixtures from day one; a cross-tenant read is a security bug with a test.
- zod on every body, param and query. Idempotency keys on every side effect. Audit events
  on every state change. Durable jobs with bounded retries and recovery after restart.
- Every bug fix ships with the regression test that would have caught it. The brief's
  **Mandatory tests** list is the minimum, not the goal.
- Files past ~300 lines get split by responsibility. Comments explain *why*.

## 7 · Design

- **No preset look.** Use the `design-director` skill (FounderOS repo: `skills/design-director/`,
  or the installed skill): generate three directions with `--industry banking`, choose one,
  and build only from its tokens in `design/` (`tokens.css`, `DESIGN.md`). Keep
  `design/.history.json` so the product never drifts back to a look it already rejected.
- Every contrast check in `design/DESIGN.md` must pass before UI work starts.
- The roadmap's six surfaces, in this domain's own language: **Command** (state the
  objective) · **Plan** (inspect proposed actions) · **Work** (watch real state) ·
  **Exceptions** (resolve only what needs attention) · **Evidence** (sources and
  receipts) · **Outcomes** (quality, time, cost).
- Every screen designs: loading · empty · success · error · permission-denied ·
  disconnected · timeout · partially-completed. An unstyled state is a defect.
- Framer Motion, minimal and meaningful; honour `prefers-reduced-motion`. WCAG AA,
  keyboard-complete, visible focus rings, `aria-live` on changing status. Mobile-first
  responsive.

## 8 · Honesty rules

- Synthetic data only in demos. Simulated integrations are labelled as simulated and use
  the same interface as the real adapter.
- Never invent customers, metrics, savings, benchmarks, endorsements or competitor
  weaknesses. Synthetic benchmarks say "synthetic". Use ranges, not invented precision.
- The three references are research inputs: **don't copy their code, assets, layouts or
  wording, and don't name or compare against them in product UI, copy or listings.**
- Healthcare and banking demos are bounded demos: no clinical, regulatory or bank-readiness
  claims.

## 9 · Definition of done (from the roadmap)

A substantial v1 has: a real database and backend, working role-based UI, two tenant
fixtures, one complete domain workflow, an integration boundary, bounded AI use,
approval/exception handling, durable jobs, tests, logs, cost controls, and a clean
install/demo package. For the portfolio release add:

- A live sandbox with synthetic data, a reset button, seeded roles, labelled simulators.
- A 2–3 minute demo: a normal case, an exception, and recovery after a failure.
- A small benchmark (accuracy, manual effort, latency, cost), synthetic results labelled.
- Tests for cross-tenant access, repeated events, integration outages and the domain's
  most costly failure.
- Architecture diagram, setup guide, deployment procedure, honest limitations page.

## 10 · Before you finish any task

1. Does it move the proof workflow forward?
2. Typecheck and tests run **and** green — say which commands you actually ran.
3. All screen states designed? Tenant scoping and validation on every new route?
4. `details/BUILD_STATUS.md` updated?
5. Any secret, placeholder, TODO or fabricated claim left behind?
6. **What did you not verify?** Say it plainly.
