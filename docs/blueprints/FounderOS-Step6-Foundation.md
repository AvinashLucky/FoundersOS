# FounderOS — Step 6 · Development Foundation

### Database, Folder Structure & Implementation Planning · The pre-code blueprint

**Document type:** Implementation Foundation (binding before any feature code)
**Canonical name:** FounderOS · *Working title: AI Company OS*
**Version:** 1.0 · CONFIDENTIAL
**Monorepo tooling:** npm workspaces (plain) · Node ≥ 18.18
**Companions:** `FounderOS-Product-Bible`, `FounderOS-Master-Architecture`, `FounderOS-Design-Showcase.html`, `founderos-app/` (Step-5 scaffold → migrates to `apps/web`)
**Last updated:** June 28, 2026

---

## 0 · How to read this document

This is the foundation engineers build on. It freezes *where every kind of code, data, asset and document lives* before implementation begins, so the platform stays modular and scalable for years. It contains no implementation code — only structure, contracts, schemas, and the rules that keep them coherent.

Two commitments from earlier steps are load-bearing here: the **hybrid runtime** (Next.js app + a dedicated worker service) and the **hybrid datastore** (MongoDB for flexible documents + Postgres/pgvector for embeddings & the knowledge graph). The monorepo below gives each a home while sharing one domain core.

A note on the Step-5 app: `founderos-app/` already implements the Strata design system and the Command Surface. It is **not moved** in this step. Section 1.4 specifies exactly how it becomes `apps/web` when we migrate.

For **every folder** this document gives the four things requested: **Purpose**, **Responsibilities**, **Dependencies**, **Best practices.**

---

## 1 · Complete Monorepo Structure

### 1.1 Top-level layout

```
founderos/                          # repo root (npm workspaces)
├─ package.json                     # root: workspaces + orchestration scripts
├─ package-lock.json
├─ .nvmrc · .editorconfig · .gitignore · .env.example
├─ README.md                        # monorepo entry
│
├─ apps/                            # deployable user-facing applications
│  └─ web/                          # Next.js App Router (founderos-app migrates here)
│
├─ services/                        # deployable headless backends
│  ├─ worker/                       # BullMQ orchestration runtime (long agent runs, sweeps)
│  └─ gateway/                      # (optional) dedicated API/edge gateway if web routes outgrow
│
├─ packages/                        # shared, versioned internal libraries (the platform core)
│  ├─ config/                       # tsconfig/eslint/tailwind/prettier presets
│  ├─ ui/                           # Strata design system (shared React components + tokens)
│  ├─ core/                         # domain contracts shared across modules (pure TS)
│  ├─ ai-providers/                 # AI provider abstraction + Model Router
│  ├─ agents/                       # Agent Engine (roster, orchestrator, gates)
│  ├─ memory/                       # Memory Engine + access layer
│  ├─ knowledge-graph/              # graph nodes/edges/traversal
│  ├─ intelligence/                 # Radars, Design DNA, Decision Ledger, Founder Intelligence
│  ├─ db/                           # data-access: Mongo + Postgres clients, repositories, schema
│  ├─ queue/                        # BullMQ queue/worker abstractions
│  ├─ auth/                         # authN/authZ primitives, session, permissions
│  ├─ logger/                       # structured logging + telemetry
│  ├─ cache/                        # cache abstraction (Redis + in-memory)
│  ├─ storage/                      # object storage abstraction (assets, media)
│  ├─ prompts/                      # versioned prompt library + templating
│  └─ utils/                        # tiny framework-free helpers
│
├─ plugins/                         # first-party + future plug-in modules (extensibility)
│
├─ infra/                           # Docker, compose, CI/CD, IaC
│  ├─ docker/ · github-actions/ · scripts/
│
├─ docs/                            # auto-evolving project documentation (Section 25)
└─ tooling/                         # repo scripts: codegen, migration runners, generators
```

**Purpose.** One repository, many independently-deployable units sharing one typed domain core — so a change to a contract is visible everywhere at compile time.

**Responsibilities.** House apps, services, shared packages, plugins, infra, and docs under a single dependency graph; enforce that the *domain* is shared and the *runtimes* are separate.

**Dependencies.** Root manages workspaces; apps/services depend on packages; packages depend only on lower packages and `core`; nothing depends on apps.

**Best practices.** Apps and services contain *no business logic* — they compose packages. Business logic lives in `packages/*`. The dependency direction is strictly inward (Section 1.3).

### 1.2 Root `package.json` (shape, not code)

Declares `private: true`, `workspaces: ["apps/*","services/*","packages/*","plugins/*"]`, an engine pin, and orchestration scripts that fan out across workspaces: `dev`, `build`, `lint`, `typecheck`, `test`, `format`, plus `db:*` and `docs:*` helpers (Section 25.3). With plain npm workspaces, cross-package builds run in dependency order via simple scripts; we add caching later only if build times demand it.

### 1.3 The dependency rule (clean architecture across the repo)

```
apps/ , services/        →  may import any package
packages/<feature>       →  may import packages/core, packages/utils, and lower-level infra packages
packages/core            →  imports NOTHING (pure domain types & ports)
packages/<infra: db,queue,cache,storage,logger>  →  implement ports declared in core/feature domains
plugins/                 →  may import core + public package barrels only
```

Imports cross workspaces **only through each package's `index.ts` barrel** — never deep paths. A lint boundary rule enforces this.

### 1.4 Migration of the Step-5 app (planned, not executed now)

`founderos-app/` → `apps/web/`. Its `src/modules/*` are promoted to workspace packages: `modules/model-router → packages/ai-providers`, `modules/agent-engine → packages/agents`, `modules/memory-engine → packages/memory`, `modules/knowledge-graph → packages/knowledge-graph`, `modules/{design-dna,technology-radar,opportunity-radar,decision-ledger,cost-controller,founder-intelligence} → packages/intelligence/*`. Its `src/shared/ui → packages/ui`. The Command Surface stays in `apps/web/src/features`. The move is mechanical because Step 5 already used the same layered shape and barrel exports.

---

## 2 · Frontend Folder Structure (`apps/web`)

```
apps/web/
├─ src/
│  ├─ app/                          # Next.js App Router: routes, layouts, route handlers
│  │  ├─ (workspace)/               # authed shell: command surface, projects, memory, cost, radars
│  │  ├─ (auth)/                    # sign-in / onboarding routes
│  │  ├─ api/                       # route handlers (thin: delegate to packages)
│  │  ├─ layout.tsx · globals.css   # Strata substrate + providers
│  ├─ features/                     # screen-level compositions (Command Surface, Project Canvas…)
│  ├─ widgets/                      # cross-feature composite UI (e.g. AgentChorus, CostMeter)
│  ├─ entities/                     # client view-models mapping domain → UI
│  ├─ providers/                    # ThemeProvider, Query, Redux store, Auth context
│  ├─ hooks/                        # reusable client hooks (useRun, useMemoryRecall…)
│  ├─ store/                        # Redux Toolkit slices (only truly-global UI state)
│  ├─ lib/                          # client utils, API client, query keys
│  └─ styles/                       # token bridges, animation presets
├─ public/                          # static assets served as-is
├─ next.config.mjs · tailwind.config.ts · tsconfig.json
```

**Purpose.** The founder-facing surface and its thin API route handlers; fast reads, streaming runs, dashboards.

**Responsibilities.** Presentation, client state, routing, and delegation to packages. It renders the company working; it never *is* the company.

**Dependencies.** `packages/ui`, `packages/core` (types only), `packages/auth` (client), data via API + TanStack Query. Long jobs are enqueued, not run here.

**Best practices.** Server Components for reads; `"use client"` only where interactivity demands. State philosophy: **server state → TanStack Query; ephemeral UI → local state; truly-global UI → Redux**. Feature-sliced organization; widgets are reused across features; no business logic in components.

> Naming convention used throughout (FSD-influenced): `app → features → widgets → entities → shared`. A higher layer may import a lower one, never the reverse.

---

## 3 · Backend Folder Structure (`services/worker`, `services/gateway`)

```
services/worker/                    # the orchestration runtime (hybrid runtime, the heavy half)
├─ src/
│  ├─ main.ts                       # boot: register queues, processors, schedules
│  ├─ processors/                   # BullMQ processors: run, sweep, ingest, brief
│  ├─ schedules/                    # cron-like: radar scans, memory consolidation, ledger reviews
│  ├─ orchestration/               # wires packages/agents COO loop to the queue
│  ├─ config/ · health/             # env load, readiness/liveness
│
services/gateway/                   # OPTIONAL — only if web route handlers outgrow their home
├─ src/{routes, middleware, config}/
```

**Purpose.** Execute long-running, supervised, or scheduled work off the request path: multi-agent runs, radar sweeps, memory consolidation, media ingestion, the Weekly Brief.

**Responsibilities.** Own concurrency, retries, back-pressure, budget enforcement, and resumability from the event log. Stateless workers; the queue is the scaling unit.

**Dependencies.** `packages/agents`, `packages/ai-providers`, `packages/memory`, `packages/queue`, `packages/db`, `packages/logger`. No UI.

**Best practices.** Processors are thin adapters over package use-cases. Every job is idempotent and resumable. Long work *never* runs inside `apps/web`. Gateway stays unbuilt until web route handlers prove insufficient (avoid premature service-splitting).

---

## 4 · Shared Packages (the platform core)

Each package follows the same internal clean-architecture shape and exposes a single barrel:

```
packages/<name>/
├─ src/
│  ├─ domain/            # pure types, entities, ports (no framework)
│  ├─ application/       # use-cases orchestrating domain + ports
│  ├─ infrastructure/    # adapters implementing ports (DB, SDKs, queues)
│  ├─ presentation/      # (ui/intelligence only) React components
│  └─ index.ts           # PUBLIC API — the only import surface
├─ package.json · tsconfig.json · README.md
```

| Package | Purpose | Key dependencies | Best practice |
|---|---|---|---|
| `config` | Shared tsconfig/eslint/tailwind/prettier presets | — | Single source of build/lint truth; apps extend, never fork |
| `ui` | Strata design system: tokens + components | `utils` | Components reference semantic tokens only, never hex |
| `core` | Domain contracts shared across modules | none | Pure TS; the stable spine; changes are reviewed hardest |
| `ai-providers` | Provider abstraction + Model Router | `core` | Adding a model = registry entry + adapter; logic untouched |
| `agents` | Agent Engine: roster, COO loop, gates | `core`,`ai-providers`,`memory` | Agents are stateless functions over memory |
| `memory` | 4-layer memory + access layer | `core`,`db` | Callers use `recall/remember`; never touch a DB directly |
| `knowledge-graph` | Nodes/edges/traversal | `core`,`db` | Bound multi-hop; prune weak edges |
| `intelligence` | Radars, Design DNA, Ledger, Founder Intelligence | `core`,`memory`,`knowledge-graph` | Sequenced after memory fills (low-signal when empty) |
| `db` | Mongo + Postgres clients, repositories, schema | `core`,`logger` | Repository pattern; one access layer hides the seam |
| `queue` | BullMQ abstractions | `logger` | Typed job contracts; idempotent processors |
| `auth` | AuthN/Z, session, permissions | `core`,`db` | Server-enforced; never trust the client |
| `logger` | Structured logs + telemetry | — | Correlation IDs everywhere; no secrets in logs |
| `cache` | Redis + in-memory cache | `logger` | Cache reads; never cache secrets or per-request auth |
| `storage` | Object storage for assets/media | `core`,`logger` | Store meaning + file; signed URLs only |
| `prompts` | Versioned prompt library + templating | `core` | Prompts are versioned assets, not inline strings |
| `utils` | Framework-free helpers | — | Tiny, pure, fully unit-tested |

---

## 5 · Agent Modules (`packages/agents`)

```
packages/agents/src/
├─ domain/        # AgentRole, Division, TaskNode, ReviewGate, Run, GateVerdict
├─ application/
│  ├─ orchestrator/   # the COO loop: decompose → activate-min-set → schedule → gate → synthesize
│  ├─ blackboard/     # run-scoped shared working state
│  ├─ gates/          # review-gate engine (product, architecture, design, qa, security, cost)
│  └─ synthesis/      # CEO single-answer + side-channel
├─ infrastructure/  # blackboard persistence to event log; provider calls via ai-providers
├─ roster.ts        # 3 executives + 13 specialists, as data
└─ index.ts
```

**Purpose.** Turn one intent into coordinated, reviewed company work and one answer.
**Responsibilities.** Decomposition, minimum-set activation, scheduling, review gates, synthesis, persistence triggers.
**Dependencies.** `core`, `ai-providers` (routing), `memory` (context + write-back), `queue` (execution).
**Best practices.** Deterministic shell around probabilistic agents; bounded by budget + max-revision governors; resumable from the event log; agents hold no state between runs.

---

## 6 · Memory Modules (`packages/memory`)

```
packages/memory/src/
├─ domain/        # MemoryItem, MemoryLayer, MemoryKind, RecallQuery, MemoryAccess (port)
├─ application/
│  ├─ recall/         # blended retrieval: vector + graph + recency + reuse, budget-aware
│  ├─ curate/         # extract → summarize → score → dedupe → embed → link (write path)
│  ├─ consolidate/    # scheduled merge/re-summarize into higher-order patterns
│  └─ lifecycle/      # decay, salience, promotion, archival, supersede
├─ infrastructure/
│  ├─ mongo/          # project/founder docs, decisions, lessons, timelines
│  ├─ postgres/       # embeddings (pgvector) + graph edge tables
│  └─ access-layer.ts # the single seam over both stores
└─ index.ts
```

**Purpose.** A curated, decaying, graph-linked memory that compounds per founder.
**Responsibilities.** Write (curate), read (blend), and evolve (consolidate/decay/promote/archive) memory across four layers.
**Dependencies.** `core`, `db` (Mongo+Postgres), `knowledge-graph`, `storage` (binaries).
**Best practices.** Curation over capture; smallest-sufficient retrieval; never expose the store seam; forgetting is *supersede + pointer*, not delete.

---

## 7 · AI Provider Modules (`packages/ai-providers`)

```
packages/ai-providers/src/
├─ domain/        # AIProvider (port), ModelRecord, TaskSpec, Tier, Capability, Completion*
├─ application/   # ModelRouter (pick cheapest-capable + fallback escalation), registry
├─ infrastructure/providers/   # claude.ts, gemini.ts, openai.ts, local.ts  (same port)
├─ registry.ts    # declarative model catalog (data, not code)
└─ index.ts
```

**Purpose.** Model sovereignty: every department reaches intelligence through one port.
**Responsibilities.** Score & route per task, escalate on failure, account cost, expose a stable adapter contract for future models/modalities.
**Dependencies.** `core` only (providers' SDKs live behind infrastructure).
**Best practices.** Cheapest-capable by default; escalate only on failure; adding a provider = new adapter + registry entry, zero business-logic change.

---

## 8 · Feature Modules (`apps/web/src/features`, `plugins/`)

**Purpose.** User-visible capabilities composed from packages — Command Surface, Project Canvas, Memory Explorer, Cost & Routing, Radars, Founder Intelligence.
**Responsibilities.** Screen-level orchestration + presentation; map domain to Strata UI.
**Dependencies.** `packages/ui`, `packages/core` (types), data hooks; never infra packages directly.
**Best practices.** One focal plane per feature; feature-sliced; a feature that could be third-party becomes a `plugin` (Section 24).

---

## 9 · API Structure

A thin, typed, versioned surface. Route handlers in `apps/web/src/app/api` delegate immediately to package use-cases.

```
/api
├─ /v1
│  ├─ /auth        POST  session, callback, signout
│  ├─ /projects    CRUD  projects; GET /:id/timeline
│  ├─ /runs        POST  create run (enqueues)  · GET /:id (SSE stream) · GET (history)
│  ├─ /memory      GET   recall?q=  · POST remember · POST supersede
│  ├─ /graph       GET   query?start=&edge=&hops=
│  ├─ /decisions   CRUD  ledger; GET /due
│  ├─ /cost        GET   spend, budgets · POST budget
│  ├─ /radars      GET   technology, opportunity
│  ├─ /design-dna  GET   profile · POST extract
│  ├─ /intelligence GET  weekly-brief, learning, productivity
│  └─ /webhooks    POST  provider/queue callbacks
```

**Conventions.** REST for CRUD; **SSE** for live runs; **webhooks/schedules** trigger sweeps. Every payload validated with zod at the boundary. Versioned under `/v1`. Internal package contracts are a *separate* layer from this public surface, so internals evolve without breaking the API.

**Best practices.** Handlers are <30 lines: validate → call use-case → shape response. No DB or model calls inline in a handler. Errors use a typed problem+JSON envelope. Idempotency keys on POST /runs.

---

## 10 · Authentication & Authorization Structure (`packages/auth`)

```
packages/auth/src/
├─ domain/        # Identity, Session, Workspace, Role, Permission, Policy
├─ application/   # signIn, verify, authorize(policy), switchWorkspace
├─ infrastructure/# provider adapters (magic-link/OAuth), session store, key vault
└─ index.ts
```

**Flow.** Magic-link / OAuth → server-issued session (httpOnly, rotating) → every request resolves `{identity, workspace, role}` at the gateway → **policy checks per use-case** → DB enforces **workspace isolation via Postgres RLS** and Mongo query scoping (defense in depth).

**Model.** Workspace-scoped RBAC: roles (Owner, Admin, Member, Viewer) → permissions → policies evaluated in `application`. BYO model keys are encrypted at rest, scoped to the workspace, never logged, never sent to a model.

**Best practices.** Authorize in the application layer, not the UI; the UI only *hides* what policy already forbids. Sessions short-lived + rotating. Never trust client-sent workspace IDs — always derive from the session.

---

## 11 · Database Architecture (hybrid)

Two engines behind one access layer (`packages/db` + `packages/memory/access-layer`):

- **MongoDB** — schema-fluid documents: workspaces, projects, runs, memory items, decisions, lessons, timelines, assets metadata, agent/prompt configs. Document flexibility absorbs memory's constant shape-change without migrations.
- **PostgreSQL + pgvector** — relational + vector + graph: identities/permissions, embeddings, knowledge-graph edge tables, cost ledger index, anything needing transactions/joins/RLS.
- **Object storage** — heavy binaries (screenshots, video, design files), referenced by Mongo metadata.
- **Event log (durable stream)** — append-only source of truth; Mongo/Postgres/graph are rebuildable projections.

```
packages/db/src/
├─ mongo/        # client, collections, repositories (one per aggregate)
├─ postgres/     # client, migrations/, pgvector + graph tables, RLS policies
├─ events/       # event log writer + projector
├─ schema/       # zod schemas = the single shape definition shared by both
└─ index.ts
```

**Best practices.** Repository pattern; no raw queries outside `db`. Schema defined once in `schema/` (zod) and reused by app, API, and DB. Writes commit to the event log first; projections are eventually consistent and rebuildable. Migrations are versioned and forward-only.

---

## 12 · MongoDB Collections

Field lists below are the canonical shapes (indicative, not exhaustive). All documents carry `_id`, `workspaceId`, `createdAt`, `updatedAt`, and `schemaVersion`.

**`workspaces`** — `name, plan, ownerId, settings{routingWeights, budgets}, byoKeys(ref→vault)`.

**`users`** — `email, name, role, workspaceIds[], preferences{theme}`. *(Identity/permission source of truth is Postgres; this is the profile projection.)*

**`projects`** — `name, domain(themeId), status, designDnaId, summary, stageState{stage,enteredAt}, archived`.

**`runs`** — `projectId, intent, classification{type,scope,novelty,risk,stakes}, graph[taskNodes], gates[], status, costUsd, modelTrace[], startedAt, finishedAt`.

**`memory_items`** — `projectId?, layer(working|project|founder|graph), kind, summary, summaries{short,long}, reuseValue, confidence, embeddingRef(→pg), graphNodeId(→pg), supersededBy?, source{runId,assetId?}`.

**`decisions`** (ledger) — `projectId?, decision, reason, alternatives[], tradeoffs, impact, reviewDate, reusableKnowledge, supersededBy?, runId`.

**`lessons`** — `projectId, lesson, context, confidence, promotedToFounder(bool)`.

**`assets`** — `projectId, kind(screenshot|video|design|export), storageKey, derivedMeaningRef(→memory), mime, bytes`.

**`timelines`** — `projectId, events[{type, at, ref}]` *(projection of the event log per project)*.

**`design_dna`** — `scope(project|founder), profile{spacingRhythm,radiusScale,contrast,motion,typography}, influences[], version`.

**`radar_signals`** — `kind(technology|opportunity), payload, ring/scores, reviewedAt, dismissed`.

**`prompts`** — `role, version, template, inputSchema, modelHints, active`.

**`cost_entries`** — `runId, taskId, modelId, tokensIn, tokensOut, costUsd` *(hot index also mirrored in Postgres for analytics)*.

**`founder_intelligence`** — `founderId, learning[], productivity[], reuse[], weeklyBriefs[]`.

**`jobs`** — *(BullMQ owns its own Redis structures; this collection only records job→run linkage for audit.)*

---

## 13 · Relationships

Mongo models relationships by **reference** (not deep embedding) to keep documents small and independently updatable; the *semantic* relationships live in the Postgres knowledge graph.

```
workspace 1───* project 1───* run 1───* cost_entry
project 1───* memory_item *───1 asset(optional)
project 1───* decision        (review-dated)
project 1───1 design_dna(project)   founder 1───1 design_dna(founder)
memory_item 1───1 embedding (Postgres)   memory_item *───* graph_node (Postgres)
run *───* prompt(version)     run 1───1 timeline-slice
founder 1───1 founder_intelligence
```

**Graph edges** (Postgres) carry the *meaningful* links — `uses, depends-on, reuses, replaces, solved-by, evolved-from` — between projects, components, technologies, decisions, and patterns, with weight + provenance. Embed only truly-owned, always-read-together sub-objects (e.g. a run's `graph` task nodes); reference everything else.

**Best practices.** No unbounded arrays in hot documents (timelines/cost roll to their own collections). Every cross-collection reference is indexed. Cascading is explicit and event-driven, never relied upon implicitly.

---

## 14 · Index Strategy

Indexes are designed from the **actual access patterns**, not guessed. Core set:

| Collection | Index | Serves |
|---|---|---|
| all | `{ workspaceId: 1, _id: 1 }` | tenancy scoping on every read |
| projects | `{ workspaceId:1, status:1, updatedAt:-1 }` | project list, active first |
| runs | `{ projectId:1, startedAt:-1 }` · `{ status:1 }` | run history; worker pickup |
| memory_items | `{ projectId:1, layer:1, kind:1 }` · `{ reuseValue:-1 }` · text/`summary` | blended recall pre-filter |
| decisions | `{ reviewDate:1 }` · `{ projectId:1 }` | "due for review" sweep |
| assets | `{ projectId:1, kind:1 }` | gallery/reuse |
| cost_entries | `{ runId:1 }` · `{ workspaceId:1, createdAt:-1 }` | per-run + spend analytics |
| radar_signals | `{ workspaceId:1, kind:1, dismissed:1 }` | radar surfaces |
| prompts | `{ role:1, active:1 }` | prompt resolution |

**Postgres:** an **HNSW/IVF index on the pgvector embedding column** for semantic recall; B-tree on graph `(from, kind)` and `(to, kind)` for traversal; RLS policy indexes on `workspace_id`.

**Best practices.** Compound indexes ordered by equality→sort→range. TTL index on `working`-layer scratch. Index only what queries use; review with `explain()` before adding. Vector index parameters tuned to recall/latency budget, not defaults.

---

## 15 · File Storage Structure (object storage)

```
storage://founderos/
├─ {workspaceId}/
│  ├─ projects/{projectId}/
│  │  ├─ screenshots/{assetId}.{ext}
│  │  ├─ videos/{assetId}.{ext}
│  │  ├─ design/{assetId}.{ext}
│  │  ├─ exports/{assetId}.{ext}
│  │  └─ uploads/{assetId}.{ext}
│  └─ founder/{ references, design-dna sources }
└─ _tmp/{uploadSessionId}/         # pre-commit staging, TTL-cleaned
```

**Purpose.** Durable home for heavy binaries; their *meaning* is extracted into memory, the file is the source-of-record.
**Responsibilities.** Store/serve via signed URLs; never public buckets; lifecycle-tier cold assets.
**Dependencies.** `packages/storage`; metadata in Mongo `assets`; derived meaning in `memory`.
**Best practices.** Keys are opaque + workspace-scoped; access only through signed, expiring URLs; antivirus/type-check on ingest; FFmpeg processing happens in the worker, not the web app.

---

## 16 · Project Memory Structure

Each project owns its memory; the access layer presents it as one space across stores.

```
Project Memory (logical)
├─ working    (run blackboards, ephemeral → event log)
├─ project    (decisions, architecture, components, design, research, testing, lessons, timeline)
├─ founder    (promoted patterns, cross-project knowledge, Design DNA)        ← shared across projects
└─ graph      (this project's nodes/edges within the founder graph)
```

**Evolution over time** (scheduled in the worker): consolidation → decay/salience → promotion (project→founder) → archival (cold, still searchable) → supersede (mark + pointer). Archived projects remain graph-connected and retrievable years later.

**Best practices.** Memory is curated on write, blended on read, and tended by sweeps; the founder owns it, can export and delete it; sensitive items are processed by local Tier-0 models only.

---

## 17 · Assets Organization (in-repo, not user data)

```
packages/ui/assets/        # design-system icons, logo, illustration primitives
apps/web/public/           # favicons, og-images, static marketing assets
docs/assets/               # diagrams, screenshots used by documentation
```

**Purpose.** Distinguish *product* assets (shipped) from *user* assets (Section 15) and *doc* assets.
**Best practices.** Iconography is a single set in `packages/ui/assets/icons` (one stroke weight, one grid); no per-feature icon forks; SVG optimized; large media never committed to git (use storage + links).

---

## 18 · Environment Variables

Grouped, validated at boot by a typed loader (`packages/config/env`); the app refuses to start on a missing required var.

```
# Providers (BYO; routed via Model Router)
ANTHROPIC_API_KEY · OPENAI_API_KEY · GOOGLE_API_KEY · LOCAL_MODEL_URL
# Data
MONGODB_URI · DATABASE_URL(Postgres+pgvector) · REDIS_URL
# Storage
STORAGE_ENDPOINT · STORAGE_BUCKET · STORAGE_ACCESS_KEY · STORAGE_SECRET
# Auth
AUTH_SECRET · OAUTH_* · KEY_VAULT_URL
# App / ops
NEXT_PUBLIC_APP_URL · NODE_ENV · LOG_LEVEL · SENTRY_DSN
```

**Best practices.** `.env.example` is the contract and is committed; real `.env*` never are. Secrets resolve from a vault in production, not files. `NEXT_PUBLIC_*` is the *only* prefix exposed to the browser. One typed `env` object; no `process.env` access scattered through code.

---

## 19 · Configuration Management (`packages/config`)

**Purpose.** One source of truth for build, lint, format, type, and design presets, plus runtime feature flags.
**Contents.** `tsconfig.base.json`, `eslint preset`, `tailwind preset`, `prettier`, and a runtime `flags` module (workspace-scoped feature toggles, routing weights, budget defaults).
**Best practices.** Apps/packages *extend* these presets, never redefine them. Runtime config is data (per-workspace settings in Mongo), not redeploys. Config changes are reviewed like code.

---

## 20 · Logging Architecture (`packages/logger`)

**Purpose.** Structured, correlated observability across web, worker, and packages.
**Shape.** JSON logs with `{ts, level, service, workspaceId, runId, taskId, msg, ...}`; a correlation/run ID threads a request from API → queue → agents → providers. Three sinks: console (dev), aggregator (prod), and the **event log** for domain events (runs, decisions, cost).
**Best practices.** Never log secrets, keys, PII, or full prompts; log prompt *hashes* and token counts. Levels used consistently (error/warn/info/debug). Every agent run is traceable end-to-end by its run ID. Cost is a first-class logged metric.

---

## 21 · Queue Architecture (`packages/queue` + `services/worker`)

**Tooling:** BullMQ on Redis.

```
Queues
├─ run        # multi-agent orchestration (the heavy path)
├─ sweep      # scheduled: radar scans, memory consolidation, ledger reviews
├─ ingest     # asset/media processing (FFmpeg)
└─ brief      # Founder Intelligence weekly brief generation
```

**Purpose.** Move long, supervised, or scheduled work off the request path with retries, back-pressure, and rate-limit smoothing.
**Responsibilities.** Typed job contracts, idempotent processors, concurrency + priority, dead-letter handling, scheduled (repeatable) jobs.
**Dependencies.** Redis; processors live in `services/worker`, contracts in `packages/queue`.
**Best practices.** Jobs are idempotent and resumable from the event log; every job carries `{workspaceId, runId}`; provider rate limits smoothed at the queue; DLQ alarms; no long job ever runs in `apps/web`.

---

## 22 · Cache Architecture (`packages/cache`)

**Layers.** Browser (TanStack Query) → CDN/route cache (Next) → server cache (Redis) → in-process memoization.

**What we cache.** Read-heavy projections (project lists, dashboards), prompt/result pairs for identical sub-tasks (token economy), model registry/health, and recall results within a run. **What we never cache.** Secrets, per-request authorization, anything workspace-crossing.

**Best practices.** Cache keys are workspace-scoped and explicitly invalidated on write (event-driven). TTLs sized per data volatility. The prompt/result cache is a direct cost lever and is measured. Caching is read-side only; writes always hit the source.

---

## 23 · Security Layer

A cross-cutting concern owned partly by `packages/auth`, partly by every layer.

- **Tenancy isolation:** Postgres RLS + Mongo query scoping (defense in depth); never app-trust alone.
- **Secrets:** vault-backed, encrypted, workspace-scoped, never logged or sent to models.
- **Untrusted content:** radar/web/upload content is sandboxed, never executed, never privileged; agent tools are allow-listed per role.
- **Privacy routing:** sensitive data pinned to local Tier-0 models by a deterministic rule.
- **Transport & input:** all input zod-validated at the boundary; strict CSP, HTTPS-only, signed asset URLs.
- **Auditability:** the event log is an immutable trail of every action, decision, model call, and cost; every autonomous action is reversible.

**Best practices.** Authorize in the application layer; least-privilege everywhere; rotate sessions and keys; security review is a *gate* (it blocks delivery), not a checklist.

---

## 24 · Plugin Architecture (`plugins/`)

**Purpose.** Let new capabilities (and future divisions/modules) plug in without platform refactor — the extensibility promise.

**Contract.** A plugin is a workspace package that exports a typed manifest: `{ id, version, permissions[], contributes{ routes?, features?, agents?, radarSources?, modelAdapters? }, register(ctx) }`. The platform exposes a stable `PluginContext` (access to memory recall, the router, the event bus, UI slots) — plugins depend on `core` + public barrels only, never internals.

**Extensibility rules.** Plugins declare permissions and are sandboxed to them; they may *contribute* to extension points but may not reach into another module's internals; versioned manifests; a failing plugin degrades to disabled, never crashes the host. A new model provider, a new radar source, or a whole new "Legal Division" are all just plugins.

**Best practices.** Keep the `PluginContext` surface small and stable (it's a forever-API); validate manifests on load; isolate plugin failures; first-party features may start as plugins to prove the extension points.

---

## 25 · Documentation Structure (`docs/`) — auto-evolving

Every project automatically carries its documentation, and the docs evolve as the project grows.

```
docs/
├─ README.md                    # index + the auto-evolve policy
├─ 01-business-vision.md        # ← sourced from FounderOS-Product-Bible
├─ 02-product-requirements.md   # PRD, per-release acceptance criteria
├─ 03-architecture.md           # ← sourced from FounderOS-Master-Architecture
├─ 04-database.md               # ← this document, Sections 11–14 (living)
├─ 05-api.md                    # endpoint reference (generated + curated)
├─ 06-ui-design.md              # ← Strata; links FounderOS-Design-Showcase.html
├─ 07-components.md             # component catalog (generated from packages/ui)
├─ 08-project-decisions.md      # ADR log (one entry per major decision)
├─ 09-meeting-notes.md          # dated notes
├─ 10-development-logs.md       # dated dev log (what shipped, why)
├─ 11-release-notes.md          # versioned changelog
├─ 12-known-issues.md           # open issues + workarounds
├─ 13-roadmap.md                # phases (MVP → Phase 4) + status
├─ 14-testing-reports.md        # coverage, golden-set, e2e summaries
├─ 15-deployment-guide.md       # how to ship each app/service
├─ 16-environment-guide.md      # env vars + local setup
├─ 17-ai-prompt-library.md      # ← mirrors packages/prompts (versioned)
├─ 18-memory-archive.md         # archived-project summaries, still searchable
└─ assets/                      # diagrams & screenshots used above
```

### 25.1 Purpose & responsibilities

A single, navigable knowledge base that onboards a new engineer in one read and stays true as the system changes. It is the human-readable mirror of the machine's memory.

### 25.2 How documentation auto-evolves

Three mechanisms keep docs current instead of stale:

1. **Generated sections.** `05-api`, `07-components`, and `17-ai-prompt-library` are partly generated from source (route definitions, `packages/ui` exports, `packages/prompts`) by `tooling/` scripts run in CI — code and docs can't drift.
2. **Event-fed sections.** `08-project-decisions`, `10-development-logs`, `11-release-notes`, and `18-memory-archive` receive entries from the **same event log** that powers project memory: when a decision, release, or archival event is emitted, a CI/worker hook appends a dated entry. The Decision Ledger and the docs are two views of one truth.
3. **Review-gated curated sections.** `01`–`04`, `13` are human-owned and updated through PRs; a CI check flags when referenced code changes without a doc touch.

### 25.3 Best practices

Docs live in-repo beside the code they describe and version with it. Each file carries front-matter `{ owner, source(generated|event|curated), lastReviewed }`. `npm run docs:check` (CI) fails the build when a generated doc is out of date or a curated doc is past its review window. Diagrams are committed as source (Mermaid/SVG) so they diff. Nothing here duplicates code comments — docs explain *why* and *how it fits*, code explains *what*.

---

## 26 · Build Order (foundation → features)

1. **`packages/config` + `core` + `utils`** — the shared spine.
2. **`db` + `logger` + `cache` + `storage` + `queue`** — boring infrastructure.
3. **`ai-providers` + `memory`** — the critical path begins (Master-Arch §19).
4. **`agents`** — the COO loop over memory + router.
5. **`apps/web` (migrate founderos-app) + `services/worker`** — the runtimes.
6. **`knowledge-graph` + `intelligence`** — layered once memory compounds.
7. **`plugins` + Founder Intelligence surfaces** — extensibility + the third pillar.

`docs/` and `infra/` are created first (this step) and evolve continuously.

---

## 27 · Amendment Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-06-28 | Initial development foundation: npm-workspaces monorepo, hybrid runtime/data structure, MongoDB collections + relationships + indexes, storage/env/logging/queue/cache/security/plugin layers, and the auto-evolving Docs folder. | Founder + FounderOS Architecture Board |

> **Next step:** scaffold the package skeletons (empty layered folders + barrels) and migrate `founderos-app → apps/web`, then begin the critical path: `ai-providers → memory → agents`.

*This is the development foundation. Structure is frozen here before feature code; amend deliberately, never drift.*
