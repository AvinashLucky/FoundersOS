# FounderOS — Step 7 · MVP Build Plan

### The complete implementation roadmap · 12 production milestones

**Document type:** Implementation Roadmap (binding sequence for delivery)
**Canonical name:** FounderOS · *Working title: AI Company OS*
**Version:** 1.0 · CONFIDENTIAL
**Companions:** `FounderOS-Step6-Foundation.md`, `ENGINEERING.md`, `docs/13-roadmap.md`
**Last updated:** June 28, 2026

---

## 0 · How to read this roadmap

Twelve phases, sequenced **highest-value foundation first**. Each phase is **independently testable and deployable** — it ends with a working application, green tests, and synchronized documentation. A phase may not begin until its dependencies' acceptance criteria pass.

Every phase specifies the eight things requested — Objectives, Deliverables, Dependencies, Estimated Complexity, Potential Risks, Acceptance Criteria, Testing Strategy, Documentation Requirements — and closes with the same **Definition of Done** (§1).

Complexity scale: **S** (≈1 wk) · **M** (≈2–3 wks) · **L** (≈4–6 wks) · **XL** (≈6–8 wks), for a small senior team. These are planning estimates, not commitments.

---

## 1 · The Definition of Done (every phase, no exceptions)

A phase is "done" only when all of the following are true — this is the company-level bar:

1. **Working application** — the increment runs and is deployable behind a feature flag.
2. **Documentation updated** — `docs/` and the feature's 10-doc set reflect reality.
3. **Architecture updated** — `docs/03-architecture.md` records any deltas; diagrams refreshed.
4. **Memory updated** — decisions/lessons written to the Decision Ledger (`docs/08`) and reusable-knowledge notes.
5. **Tests completed** — unit + integration green; coverage targets met; e2e for user-facing slices.
6. **Technical debt reviewed** — `docs/12-known-issues.md` updated; debt logged or paid down, never silent.

> The standing rule (see `ENGINEERING.md`): code and docs never drift. Documentation is a first-class deliverable equal to source.

---

## 2 · The dependency graph at a glance

```
P1 Core Foundation ─┬─► P2 Authentication ─► P3 Project Workspace ─┬─► P4 Memory Engine ─► P5 Model Router ─► P6 Agent Orchestrator
                    │                                              │
                    └──────────────────────────────────────────────┘
P6 ─► P7 Design DNA ─► P8 Technology Radar ─► P9 Opportunity Radar ─► P10 Founder Intelligence ─► P11 Billing/SaaS ─► P12 Production Optimization
```

Critical path: **P1 → P2 → P3 → P4 → P5 → P6**. P3 (Workspace UI shell) can begin in parallel with P4 once P2 lands. Intelligence phases (P7–P10) are deferred until memory compounds (P4) — building them earlier yields low-signal output.

---

## Phase 1 · Core Foundation  · **Complexity: M**

**Objectives.** Stand up the monorepo's shared spine so every later phase composes from it: domain contracts, configuration, utilities, structured logging, the hybrid data layer (Mongo + Postgres/pgvector), the event log, and env validation. Nothing user-facing — everything load-bearing.

**Deliverables.** `packages/config` (build/lint presets) · `packages/core` (domain types, ports, errors, `Result`) · `packages/utils` (pure helpers + tests) · `packages/logger` (structured, correlated) · `packages/db` (Mongo client, Postgres pool, event-log writer, base repository, zod schemas) · typed env loader · CI pipeline (typecheck → lint → test → docs:check → build).

**Dependencies.** None (the root). Consumes the Step-6 folder structure.

**Potential risks.** *Over-engineering the core* (mitigate: build only contracts P2–P6 need now) · *premature schema lock-in* (mitigate: zod schemas versioned, additive) · *hybrid-store complexity leaking upward* (mitigate: the access-layer seam is mandatory from day one).

**Acceptance criteria.** `npm run typecheck && lint && test` green across workspaces · a health check connects to Mongo + Postgres + Redis · the event-log writer round-trips an event and a projection rebuilds from it · env loader refuses to boot on a missing required var · base repository enforces `workspaceId` scoping in every query.

**Testing strategy.** Unit tests for utils and the `Result`/error types (pure, fast, high coverage) · integration tests for db clients against ephemeral Mongo/Postgres containers · a contract test proving event → projection rebuild.

**Documentation requirements.** Feature 10-doc set for "Core Foundation" · `docs/04-database.md` seeded with the live schema · `docs/16-environment-guide.md` finalized · ADR entries for hybrid store and monorepo tooling.

**Definition of Done:** §1.

---

## Phase 2 · Authentication  · **Complexity: M**

**Objectives.** Establish identity, sessions, and workspace-scoped authorization with database-enforced tenancy — the gate everything else trusts.

**Deliverables.** `packages/auth` (Identity, Session, Workspace, Role, Permission, Policy; sign-in/verify/authorize/switch-workspace) · magic-link + OAuth adapters · rotating httpOnly sessions · **Postgres RLS** policies + Mongo query scoping · encrypted BYO-key vault integration · `(auth)` routes + the onboarding screen.

**Dependencies.** P1 (core, db, logger).

**Potential risks.** *Tenancy leaks* (mitigate: RLS + scoping + a deliberate cross-workspace negative test suite) · *session/key handling mistakes* (mitigate: security review gate; no secrets in logs) · *OAuth provider variance* (mitigate: adapter contract).

**Acceptance criteria.** A user signs in via magic link and OAuth · sessions rotate and expire · every API request resolves `{identity, workspace, role}` · a user in workspace A provably cannot read workspace B (RLS test) · BYO keys are encrypted at rest and never appear in logs.

**Testing strategy.** Unit: policy evaluation · Integration: full auth flow against test DB · **Security:** automated cross-tenant access tests + secret-leak scan · e2e: sign-in → workspace → sign-out.

**Documentation requirements.** Auth 10-doc set · `docs/05-api.md` auth endpoints · `docs/23 security` notes · ADR for the auth model.

**Definition of Done:** §1.

---

## Phase 3 · Project Workspace  · **Complexity: L**

**Objectives.** The first visible vertical slice: create, open, and navigate projects inside the Strata Command Surface shell — proof the architecture renders end-to-end (UI → API → DB).

**Deliverables.** `apps/web` migrated from `founderos-app` · the `(workspace)` shell (Command Surface, project switcher, run timeline placeholder) · projects CRUD (API + `projects` collection) · adaptive theme per project · TanStack Query data layer · Redux store for global UI (active project, command palette).

**Dependencies.** P1, P2.

**Potential risks.** *Scope creep into agent features* (mitigate: this phase ships an *empty but real* workspace; no runs yet) · *migration friction moving founderos-app* (mitigate: Step-6 §1.4 plan; mechanical move) · *state-management sprawl* (mitigate: enforce server→Query / global→Redux split).

**Acceptance criteria.** A signed-in founder creates a project, sees it themed by domain, reopens it, and the project list persists · Lighthouse ≥ 90 perf/a11y on the shell · keyboard-complete navigation (⌘K) · zero business logic in components (review).

**Testing strategy.** Unit: reducers/hooks · Integration: projects API + DB · **e2e:** create → open → switch → delete project · a11y automated checks + reduced-motion.

**Documentation requirements.** Workspace 10-doc set · `docs/06-ui-design.md` + `docs/07-components.md` (generated) · roadmap status.

**Definition of Done:** §1.

---

## Phase 4 · Memory Engine  · **Complexity: XL**

**Objectives.** The moat: a curated, four-layer, graph-linked memory that compounds per founder — the foundation the orchestrator and all intelligence read from.

**Deliverables.** `packages/memory` (curate/recall/consolidate/lifecycle) · the **access layer** over Mongo (docs) + Postgres/pgvector (embeddings) · `packages/knowledge-graph` v1 (nodes/edges in Postgres) · blended retrieval (vector + graph + recency + reuse) · scheduled consolidation/decay sweeps in `services/worker` · Memory Explorer UI (read-only).

**Dependencies.** P1, P3 (projects to attach memory to).

**Potential risks.** *Retrieval quality* (mitigate: golden-set recall tests; blended ranking) · *over-retrieval cost* (mitigate: budget-aware, smallest-sufficient context) · *embedding/index latency at scale* (mitigate: tuned pgvector index; measure) · *curation poisoning* (mitigate: curation is a reviewed step).

**Acceptance criteria.** Writing a decision/component/lesson persists, embeds, and graph-links it · `recall(query)` returns a ranked, budget-bounded set blending all four signals · a consolidation sweep merges related memories without data loss · archived items remain searchable · retrieval p95 within target as memory grows (load test).

**Testing strategy.** Unit: ranking + lifecycle transitions · Integration: write→recall round-trip against pgvector · **golden-set** recall regression · load test for retrieval latency vs memory size.

**Documentation requirements.** Memory 10-doc set · `docs/04-database.md` (memory collections + pgvector) · `docs/18-memory-archive.md` wired · ADRs for retrieval blend.

**Definition of Done:** §1.

---

## Phase 5 · Model Router  · **Complexity: L**

**Objectives.** Model sovereignty: every task reaches the cheapest capable model through one port, with fallback, cost accounting, and quality gates — making agents affordable before they exist.

**Deliverables.** `packages/ai-providers` production build (the Step-5 contracts made real) · adapters: Claude, Gemini, OpenAI, local · declarative registry · routing engine (capability/quality/cost/latency/privacy scoring) · fallback chains · prompt/result cache (`packages/cache`) · live cost meter + per-run budgets (`cost-controller`) · Cost & Routing UI.

**Dependencies.** P1; benefits from P4 (reuse-before-generate).

**Potential risks.** *Provider API drift* (mitigate: adapter contract + golden-set) · *quality regressions on cheap tiers* (mitigate: min-quality thresholds + auto-escalation) · *cost runaway* (mitigate: budgets enforced deterministically) · *cache staleness* (mitigate: keyed, event-invalidated cache).

**Acceptance criteria.** A task routes to the lowest-tier model clearing its bar; a forced failure escalates along the fallback chain · swapping a provider requires only a new adapter + registry entry (no business-logic change) — proven by a test · every call records attributable cost · privacy-pinned tasks never leave local models.

**Testing strategy.** Unit: scoring + fallback selection · Integration: each adapter against a mocked/contract endpoint · **golden-set** quality regression per task type · cost-accounting assertions.

**Documentation requirements.** Router 10-doc set · `docs/17-ai-prompt-library.md` (versioned) · `docs/05-api.md` cost/router endpoints · ADRs for routing weights.

**Definition of Done:** §1.

---

## Phase 6 · Agent Orchestrator  · **Complexity: XL**

**Objectives.** The brain: turn one intent into coordinated, reviewed company work and one synthesized answer — the existence proof of the category (MVP "prove the loop").

**Deliverables.** `packages/agents` production build · the COO loop (decompose → minimum-set activation → schedule → parallel execute on the blackboard → review gates → CEO synthesis → persist) · the 16-role roster · review-gate engine + the three governors (max-revision, budget, confidence) · run execution in `services/worker` over BullMQ · **SSE** streaming to the Command Surface · the live "company at work" + single-answer UI.

**Dependencies.** P4 (memory), P5 (router), P3 (surface).

**Potential risks.** *Infinite review loops / cost blowups* (mitigate: governors + budget ceilings; force "best draft with caveats") · *non-determinism/flakiness* (mitigate: deterministic shell, resumable from event log, seeded tests) · *latency of multi-agent runs* (mitigate: parallel scheduling, streaming, perceived-progress UI).

**Acceptance criteria.** One prompt produces one synthesized answer with the side-channel (departments, models, cost, memory writes) · only required departments activate (token economy verified) · a run resumes after a simulated worker crash · review gates block sub-bar output · the run is demonstrably better than calling a single model (golden comparison).

**Testing strategy.** Unit: decomposition, gate logic, governors · Integration: end-to-end run against mocked providers · **resilience:** kill-and-resume test · **e2e:** prompt → streamed run → answer · cost-bound assertions.

**Documentation requirements.** Orchestrator 10-doc set · architecture update (the run lifecycle) · `docs/08` ADRs · prompt history.

**Definition of Done:** §1. **← MVP milestone: the core loop is live.**

---

## Phase 7 · Design DNA  · **Complexity: M**

**Objectives.** Learn the founder's visual language as *principles* (never copies) and apply it automatically across UI work.

**Deliverables.** `packages/intelligence/design-dna` · extraction pipeline (vision models via the router → abstract token/rules profile) · per-project + founder profiles, versioned · application hook in the Design division · Design DNA UI (view/fork profile) · media ingestion via FFmpeg/worker.

**Dependencies.** P4 (memory), P6 (agents apply it).

**Potential risks.** *Copying/IP risk* (mitigate: extraction is lossy/generalizing by construction; provenance recorded; refuses source reproduction — a hard gate) · *low-signal on a thin portfolio* (mitigate: confidence thresholds; defer surfacing until enough signal).

**Acceptance criteria.** Uploading references yields an *abstract* profile that cannot reconstruct a source (verified) · a new screen inherits the active profile automatically · profile is versioned and forkable · provenance auditable.

**Testing strategy.** Unit: profile merge/versioning · Integration: ingest → profile → apply · **policy test:** no source reconstruction.

**Documentation requirements.** Design DNA 10-doc set · `docs/06-ui-design.md` · ethics/IP note.

**Definition of Done:** §1.

---

## Phase 8 · Technology Radar  · **Complexity: M**

**Objectives.** Track the founder's stack + landscape and recommend migrations only when benefit beats switching cost (evolve, don't churn).

**Deliverables.** `packages/intelligence/technology-radar` · scheduled ingestion sweeps (vetted public sources) · tech nodes in the graph with maturity/momentum/risk/fit · **impact analysis over the graph** · adopt/trial/hold/retire recommendations with review dates · Radar UI.

**Dependencies.** P4 (graph/memory), P6 (research division).

**Potential risks.** *Noisy/low-quality sources* (mitigate: source allow-list + research-division distillation) · *churn pressure* (mitigate: net-benefit-after-switching-cost rule; "your stack is fine" is valid) · *untrusted external content* (mitigate: sandboxed ingestion).

**Acceptance criteria.** A sweep populates tech nodes · a recommendation fires only when graph impact analysis shows net benefit · every recommendation has rationale + review date · ignored items decay.

**Testing strategy.** Unit: scoring + impact analysis · Integration: sweep → nodes → recommendation · content-safety test on ingestion.

**Documentation requirements.** Radar 10-doc set · ADRs for source policy.

**Definition of Done:** §1.

---

## Phase 9 · Opportunity Radar  · **Complexity: M**

**Objectives.** Surface what to build next by fusing internal graph gaps, external trends, and founder fit.

**Deliverables.** `packages/intelligence/opportunity-radar` · signal fusion (internal + external + fit) · transparent scoring (demand/effort/fit/timing/reuse) · opportunities as graph nodes that can seed a project · Opportunity UI · founder-feedback tuning loop.

**Dependencies.** P4, P8 (shared ingestion), P6.

**Potential risks.** *Irrelevant/naggy suggestions* (mitigate: fit weighting, decay, feedback tuning) · *over-trust of trends* (mitigate: confidence + rationale shown) · *auto-acting* (mitigate: suggests only; never starts work).

**Acceptance criteria.** Each opportunity shows a transparent multi-factor score + rationale · suggestions improve with feedback (measured) · an opportunity can seed a new project · nothing auto-starts.

**Testing strategy.** Unit: scoring + fusion · Integration: signals → scored opportunities · feedback-loop test.

**Documentation requirements.** Opportunity 10-doc set · roadmap update.

**Definition of Done:** §1.

---

## Phase 10 · Founder Intelligence  · **Complexity: L**

**Objectives.** The third pillar: improve the *founder*, not just the projects — learning, decisions, productivity, reuse, and the Weekly Executive Brief.

**Deliverables.** `packages/intelligence/founder-intelligence` · Learning Tracker · Decision Journal (atop the ledger) · Productivity Insights · Knowledge Reuse surfacing · **Weekly Executive Brief** (scheduled `brief` queue job) · the Founder Intelligence dashboard · scheduled delivery (email/in-app).

**Dependencies.** P4, P6, P8, P9.

**Potential risks.** *Insight quality/usefulness* (mitigate: ground in real signals; founder feedback) · *privacy of founder-level data* (mitigate: workspace-isolated, local-pinned where sensitive) · *notification fatigue* (mitigate: one calm weekly cadence).

**Acceptance criteria.** The Weekly Brief generates from real project/cost/decision data on schedule · learning/productivity/reuse panels reflect actual activity · all founder data is workspace-isolated and exportable.

**Testing strategy.** Unit: brief assembly · Integration: scheduled job → brief from seeded data · privacy/isolation tests.

**Documentation requirements.** Founder Intelligence 10-doc set · `docs/13-roadmap.md` · brief templates in prompt library.

**Definition of Done:** §1.

---

## Phase 11 · Billing & SaaS Features  · **Complexity: L**

**Objectives.** Turn the platform into a product: plans, metering, BYO-key economics, and team/workspace management — priced on leverage, not seats.

**Deliverables.** Plan tiers (Solo/Founder/Studio/Enterprise) · usage metering tied to the cost ledger · subscription + payment integration · workspace membership/roles UI · plan-gated feature flags (org depth, memory retention, engines) · self-host/SSO hooks (Enterprise).

**Dependencies.** P2 (auth/workspaces), P5 (cost ledger), P10 (value to monetize).

**Potential risks.** *Billing correctness* (mitigate: reconcile metering vs ledger; idempotent webhooks) · *payment security/PCI* (mitigate: use a provider; never store card data) · *plan-gating leaks* (mitigate: server-enforced flags, tested).

**Acceptance criteria.** A founder upgrades/downgrades; features gate correctly server-side · usage meters match the cost ledger to the cent · payment webhooks are idempotent and reconciled · BYO-key keeps inference at cost on every tier.

**Testing strategy.** Unit: plan-gate logic · Integration: subscribe → meter → invoice (sandbox) · webhook idempotency tests · gating leak tests.

**Documentation requirements.** Billing 10-doc set · pricing docs · `docs/05-api.md` billing endpoints.

**Definition of Done:** §1.

---

## Phase 12 · Production Optimization  · **Complexity: L**

**Objectives.** Harden for scale and launch: performance, cost, reliability, security, and observability to a production bar.

**Deliverables.** Performance pass (retrieval latency, route caching, bundle budget, motion perf) · cost optimization audit (routing, caching, reuse rates) · reliability (queue back-pressure, DLQ alarms, graceful degradation) · full security review + pen-test remediation · observability dashboards + SLOs · load/chaos testing · launch runbook.

**Dependencies.** All prior phases.

**Potential risks.** *Optimization regressions* (mitigate: golden/perf baselines before changes) · *scaling surprises* (mitigate: load test to target; chaos test resume paths) · *security gaps* (mitigate: external review; the security gate blocks launch).

**Acceptance criteria.** SLOs met under load test · blended inference cost ≈70% below frontier-everywhere baseline (measured) · all critical/high security findings closed · graceful degradation verified (provider outage, worker crash) · observability covers every run, cost, and error.

**Testing strategy.** **Load + chaos** tests · full **security** review/pen-test · perf regression suite · cost-baseline assertions · DR/resume drills.

**Documentation requirements.** `docs/14-testing-reports.md`, `docs/15-deployment-guide.md`, SLO/runbook docs · final architecture pass · launch checklist.

**Definition of Done:** §1. **← Production launch.**

---

## 3 · Cross-phase quality bars (apply to all phases)

**Security:** tenancy isolation tested every phase that touches data; secrets never logged; security review gates user-facing releases. **Performance:** every phase carries a perf budget; retrieval and run latency tracked as memory/scale grow. **Accessibility:** WCAG AA, keyboard-complete, reduced-motion — checked on every UI slice. **Cost:** attributable per-run cost from P5 onward; budgets enforced. **Reuse:** reuse-before-build; no duplicate logic (enforced in review).

---

## 4 · Amendment Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-06-28 | Initial 12-phase MVP roadmap with per-phase objectives, deliverables, dependencies, complexity, risks, acceptance criteria, testing strategy, documentation requirements, and a uniform Definition of Done. | Founder + FounderOS delivery team |

> **Now executing:** Step 8 begins with **Phase 1 · Core Foundation** — production code + its 10-doc set, with living docs synchronized (see `ENGINEERING.md`).

*This roadmap sequences value, not excitement. Each phase ships working, tested, documented software before the next begins.*
