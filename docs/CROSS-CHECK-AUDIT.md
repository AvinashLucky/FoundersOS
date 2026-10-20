# FounderOS — Cross-Check Audit (Phases 1–4)

> Goal: make FounderOS feel built by a 100-person team — analytics, financial, security,
> QA, design, all together — not one person. This audits what exists, what we just added,
> and what to add next to reach that bar.

**Last updated:** July 7, 2026 (evening) · **Status:** sign in → create project → open → run the company **live over SSE** (activation plan → department takes → **the departments DEBATE each other** — challenges and concerns stream in with visible tension → the CEO rules, explicitly resolving the disagreements) → the full conversation is saved and replayable from run history → memory recalls it into the next run → see analytics, 14-day spend trend → package work as listings in the **Freelance Studio** (create/edit/delete, Idea Agent) and track where they're posted.

**New this round — Agent Debate + Conversation view:** a debate step in the agent loop (`server/ai/debate.ts`): each activated department reviews the others' takes and pushes back (support / challenge / concern), routed through the cheap tier; offline it speaks in deterministic role-flavoured voices. Zero-pushback rounds are impossible (a tension governor injects a challenge). Critique events stream between the department and synthesis events; the CEO prompt must name and resolve each disagreement. Plan + takes + debate persist on the RunRecord, so `features/run/ConversationView.tsx` renders the four-phase transcript both live and as history replay.

---

## 1 · What exists now (verified)

| Area | Built | Where |
|---|---|---|
| **Auth & tenancy** | Cookie session, email sign-in, server-guarded routes, per-workspace data isolation | `server/auth`, `app/api/v1/auth`, `features/auth` |
| **Projects** | List / create / open, adaptive theming, empty·loading·error states | `features/projects`, `app/api/v1/projects` |
| **Project memory** | Per-project notes (the memory seed), decisions auto-saved from runs | `features/project-workspace`, `notes.repo` |
| **The loop (AI)** | Model Router (cheapest-capable + fallback), 4-department run → one answer, offline Echo provider + real Claude adapter | `server/ai/*`, `features/run` |
| **Financial / cost** | Per-run cost, tokens, duration; cost shown on every answer | `run-service`, `RunPanel` |
| **Analytics** | Workspace overview: projects·runs·memories·spend, spend-by-model, recent activity | `app/api/v1/overview`, `features/overview` |
| **Data layer** | Repository pattern, Mongo + in-memory fallback (runs with zero setup) | `server/repositories/*`, `server/db/mongo` |
| **Design system** | Strata: tokens, adaptive themes, components, motion | `shared/ui`, `shared/config/themes` |
| **State** | React Query (server data) + Redux Toolkit (UI state) cleanly split | `shared/store`, feature hooks |

**Quality bar already met:** typed contracts at every boundary, zod validation, workspace
scoping on every query, graceful AI fallback (a run never hard-fails), no placeholder logic,
all logic files syntax-verified.

---

## 2 · Flagship features added this round (the "team-built" feel)

These are the additions that signal a funded team, not a solo build:

1. **Cost intelligence (Financial).** Every run is priced (model × tokens); cost is visible on
   the answer and aggregated per workspace. Real Financial-Ops thinking baked in.
2. **Analytics Overview.** A metrics dashboard (activity + spend + spend-by-model) — the kind
   of "whole company at a glance" surface a data team would own.
3. **Model sovereignty + resilience.** A router that picks the cheapest capable model and
   *falls back to local on failure* — reliability engineering, not a happy-path demo.
4. **Memory compounding.** Each run writes its decision back to project memory, so the product
   visibly "gets smarter" — the moat, made tangible.

---

## 3 · Addons we can add now (Phases 1–3 polish → enterprise feel)

High-leverage, low-risk additions, grouped by the "department" that would own them:

**Product / UX**
- ✅ Project **search & filter** + sort (recent / A–Z) — shipped 2026-07-07.
- ✅ **Archive / restore** projects (PATCH route + card control + archived view) — shipped 2026-07-07.
- ✅ **Command palette (⌘K)** — navigation, any project, new-project, sign-out — shipped 2026-07-07.
- ✅ **Toasts** + **optimistic updates** with rollback (create/archive/run) — shipped 2026-07-07.
- ✅ **Freelance Studio** (`/freelance`) — listings board, Idea Agent, platform tracker — shipped 2026-07-07.
- **Onboarding** first-run checklist; richer **empty states** with sample prompts.

**Design**
- **Daylight (light) theme** variant of Strata (accessibility + preference). *(Planned: 3-theme reskin pass — same product, three layout/identity skins.)*
- Per-project **cover/gradient** from its domain identity; project **favicon**.

**Engineering / Platform**
- ✅ **Pagination** on projects (?limit&offset&status) + runs (?limit) — shipped 2026-07-07.
- ✅ **Rate limiting** (auth 10/min·IP; runs+ideas 6/min·ws; creates 20/min·ws) — shipped 2026-07-07.
- ✅ **SSE streaming runs** (`/runs/stream`) with live department progress — shipped 2026-07-07.
- **Optimistic concurrency** (updatedAt checks) on edits; **soft delete**.
- Promote `apps/web/src/server/*` → shared `packages/*` once stable.

**Security**
- ✅ **Signed session cookie** (HMAC, timing-safe verify) — was already in; verified.
- ✅ **Same-origin checks on all mutations** (CSRF defense-in-depth) — shipped 2026-07-07.
- ✅ **AI safety gate + budget governor + ETHOS clause** on the agent loop — shipped 2026-07-07.
- **Audit log** of actions; **magic-link / OAuth** sign-in (replace dev email sign-in).

**AI / Platform — free-first model ladder (shipped 2026-07-13)**
- ✅ **OllamaProvider** (`server/ai/providers/ollama.ts`) — real LOCAL model, zero keys, cost $0.
  Always registered outside tests; unreachable daemon → clean fallback. `OLLAMA_URL` / `OLLAMA_MODEL`.
- ✅ **GeminiProvider** (`server/ai/providers/gemini.ts`) — Google free tier (`GEMINI_API_KEY`):
  `gemini-1.5-flash` (fast seats) and `gemini-1.5-pro` (0.9 quality → CEO/frontier seats run
  real, free). Throws on non-200/empty so the router falls back.
- ✅ Registry entries at costPer1k 0 → the cheapest-capable sort prefers free providers
  automatically; `pick()` now only considers models whose provider is actually registered.
- ✅ Under Vitest the router is Echo-only by design — suites stay deterministic on any machine.
  Provider adapters covered by mocked-fetch tests (no network in tests, ever).

**QA**
- Route + repository **unit/integration tests** (Vitest); **e2e** happy path (Playwright).
- **Golden-set** check for the agent loop's answer quality.

**Analytics / Finance**
- **Spend over time** chart + **per-project budgets** with alerts.
- **Usage metering** ready for billing (Phase 11).

---

## 4 · Future features (where the roadmap goes)

| Capability | Phase | One-liner |
|---|---|---|
| Real streaming runs (SSE) | 4+ | Stream the company working token-by-token. |
| Design DNA | 7 | Learn the founder's visual language; apply automatically. |
| Technology & Opportunity Radars | 8–9 | What to adopt; what to build next. |
| Founder Intelligence | 10 | Weekly brief, learning tracker, decision journal. |
| Screen / visual capture | (Sprint 5) | Screenshots/video → vision model → memory. |
| Billing & plans | 11 | Solo/Founder/Studio/Enterprise, usage-metered. |
| Knowledge graph | 4+ | Relational reasoning across projects. |

Full detail: `docs/blueprints/FounderOS-Step7-MVP-Roadmap.md`.

---

## 5 · The 100-member-team checklist (representation)

A funded team has every discipline represented. Status in FounderOS today:

- ✅ Product (PRDs, scope, project model) · ✅ Design (Strata system, states, motion)
- ✅ Frontend · ✅ Backend (API + repos) · ✅ AI/ML (router + loop)
- ✅ Data/Analytics (overview) · ✅ FinOps (cost) · ✅ Security (tenancy, guards — hardening listed)
- 🟡 QA (tests next) · 🟡 DevOps (Docker/CI scaffolded, not wired) · 🟡 Growth/Billing (Phase 11)

Closing the 🟡 items (tests, CI, hardened auth) is what turns "impressive demo" into
"enterprise product" — they're the recommended next focus alongside Phase 5.

---

*This audit is living — update it as features land.*
