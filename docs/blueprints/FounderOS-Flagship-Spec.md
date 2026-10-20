# FounderOS — Flagship Spec & Task Feed

**Document type:** Product bible + execution feed (Sonnet-ready)
**Last updated:** 2026-07-11 · **Source of truth for:** what's shipped, what's in flight, what's next
**Companion visual:** `docs/showcase/FounderOS-Mission-Control.html` (the living roadmap)

---

## 0 · The bar

FounderOS must *feel* like the product of a 1000-person company: every discipline visibly
represented, every state designed, every failure handled. The honest version of
"no single drawback" is not perfection — it's **no *visible* drawback**: the discipline
that every feature ships with all five states (loading · empty · error · success ·
degraded), a fallback path, a test, and a doc. That rule is enforced below.

**The believability trick is real:** FounderOS *is* built by a company — a company of
agents (Product, Architecture, Design, QA+Security, CEO, COO, Market Scout), each with a
voice, a budget, and receipts. We present that honestly instead of pretending.

---

## 1 · SHIPPED — past works (verified: tsc clean, 58/58 tests)

| # | Capability | Department | Where |
|---|---|---|---|
| S1 | Projects: CRUD, adaptive per-domain themes, search/sort, archive/restore | Product·Design | `features/projects` |
| S2 | Auth (dev email) + HMAC-signed sessions + workspace tenancy on every query | Security | `server/auth` |
| S3 | Project memory: notes, decisions auto-saved per run, recalled into next run | AI Research | `notes.repo`, `persist-run` |
| S4 | Model Router: cheapest-capable model, fallback chain, offline Echo provider | Platform | `server/ai/router` |
| S5 | The Loop v2: minimum-set activation → parallel departments → **agent debate** → CEO ruling | AI Research | `run-service`, `debate` |
| S6 | Live SSE runs: plan → takes → critiques → decision streamed; Conversation view + history replay | Design·Platform | `runs/stream`, `ConversationView` |
| S7 | Governors: safety gate (pre-token refusal), per-run budget cap, ETHOS clause | Security·FinOps | `governors` |
| S8 | Analytics: overview metrics, spend-by-model, 14-day spend trend | Data | `overview` |
| S9 | Hardening: rate limits, same-origin (CSRF) on all mutations, pagination | Platform | `security/rate-limit` |
| S10 | ⌘K command palette, toast system, optimistic UI with rollback | Design | `command-palette`, `Toaster` |
| S11 | Freelance Studio: listings (create/edit/delete), Gumroad/Contra/Fiverr posting board, Idea Agent | Growth | `features/freelance` |
| S12 | Visual memory (image capture + gallery) | AI Research | `visual-memory` |

## 2 · IN FLIGHT — present tasks (the money path, in order)

| # | Task | Definition of done |
|---|---|---|
| P1 | **Live Research Agent** — ✅ SHIPPED 2026-07-11 (offline seam; live with TAVILY_API_KEY). Remaining: "Research this idea" button in Freelance Studio (T2) | Brief streams with cited sources, persists to memory, rate-limited + safety-gated — verified 63/63 tests |
| P2 | **Deploy + real auth** — Vercel + MongoDB Atlas + magic-link sign-in | Live URL; magic-link end-to-end; RLS-equivalent tenancy tests pass in prod; env guide updated |
| P3 | **Design System v2 ("Google-grade")** — from the Mission-Control mockup: motion language (agent cursor), elevation, type ramp, light theme | Every screen passes the 5-state rule; Lighthouse ≥90 perf/a11y; reduced-motion complete |
| P4 | **Reskin + Export** — one build → 3 themed variants → Gumroad-ready zip | One command produces a sellable, branded zip with README + license |

## 3 · HORIZON — future systems (blueprints exist; do not start before P1–P4)

Knowledge Graph (relational reasoning across projects) · Design DNA (learn the founder's
visual language as principles) · Technology & Opportunity Radars (scheduled ingestion +
net-benefit recommendations) · Founder Intelligence (weekly executive brief) · Billing &
plans (usage-metered, BYO-key economics) · Teams/multi-user workspaces · Worker/queue
service (BullMQ) for scheduled sweeps · Native marketplace publishing APIs.

## 4 · The no-visible-drawback rules (apply to every task above)

1. **Five states designed** — loading, empty, error, success, degraded. No unstyled state ever reaches a user.
2. **Fallback path named** — what happens offline / over budget / provider down. (Pattern: Echo provider, budget governor, offline idea templates.)
3. **Workspace-scoped + same-origin** — every new route copies the existing guards.
4. **Tested** — unit for logic, integration for routes; suite stays green (`npm test`, currently 58/58).
5. **Documented** — PROGRESS.md row + dev-log entry in the same PR. Code and docs never drift.
6. **Honest by construction** — no fabricated numbers, sources cited, offline output labeled offline.

## 5 · Sonnet task feed (paste one at a time)

> **T1.** Build `server/ai/research-agent.ts` + `POST /api/v1/research` (workspace-scoped,
> same-origin, rate-limited 4/min, budget-capped): input `{topic, projectId?}` → web search via
> provider seam (interface `SearchProvider`; implement Brave/Tavily adapter + offline fixture
> provider) → distill to `ResearchBrief {summary, competitors[], demand, risks[], sources[]}`
> → persist to project memory. Stream progress over SSE like `/runs/stream`. Tests: provider
> fallback, source-citation presence, tenancy. Follow rules in §4.
>
> **T2.** Add `ResearchPanel` to the project dashboard + a "Research this idea" button on every
> Idea card in Freelance Studio (prefills topic). Reuse ConversationView phase styling.
>
> **T3.** Magic-link auth: `packages` pattern from `server/auth/session.ts`, token table w/ TTL,
> email via Resend (env-gated; console fallback in dev). Replace dev sign-in; keep sessions.
>
> **T4.** Vercel + Atlas deploy: envs from `docs/16-environment-guide.md`, health route,
> deployment guide update. No secrets in repo.
>
> **T5.** Design System v2 per `docs/showcase/FounderOS-Mission-Control.html`: extract its
> tokens into `shared/config/themes.ts`, add light theme, agent-cursor motion component,
> migrate screens one per PR.

---

*Amend this file, never fork it. The Mission-Control page is its visual twin — update both.*
