# FounderOS — Technical Architecture (founderos-app)

The production blueprint, in code. This document is the contract an engineering team
implements against; the running `src/` already embodies its shape.

> Companion docs in the parent folder: `FounderOS-Product-Bible` (vision),
> `FounderOS-Master-Architecture` (systems), `FounderOS-Design-Showcase.html` (Strata).

---

## 1 · Stack & why

| Layer | Choice | Why (and the trade-off) |
|---|---|---|
| Framework | **Next.js App Router** | Server components for fast reads, streaming for live runs, one deploy target. Trade-off: couples us to Vercel-style runtime — mitigated by keeping orchestration in a separate worker. |
| Language | **TypeScript (strict)** | Contracts at every boundary (tenet T6). `noUncheckedIndexedAccess` on. |
| UI | **React + Tailwind + shadcn/ui** | Token-driven design system; shadcn gives us owned, un-vendored primitives. |
| Motion | **Framer Motion + GSAP + Lenis** | Framer for component motion, GSAP for timeline-grade sequences, Lenis for smooth scroll. |
| Server state | **TanStack Query** | Caching, dedupe, background refresh for all reads. |
| Global UI state | **Redux Toolkit** *(only where justified)* | Command palette, active run, theme. Everything else is local or server state. |
| Data | **MongoDB + Postgres/pgvector** | Hybrid: flexible memory docs in Mongo; embeddings + graph + RLS in Postgres. |
| Queue | **BullMQ (Redis)** | Long multi-agent runs, scheduled radar/consolidation sweeps. |
| Media | **FFmpeg** | Screenshot/video memory ingestion. |
| Infra | **Docker + GitHub Actions** | Reproducible builds; CI gates on typecheck + lint + test. |

State philosophy, stated once: **server state → TanStack Query; ephemeral UI → local state;
truly global UI → Redux Toolkit.** If a slice isn't shared across unrelated trees, it does
not belong in Redux.

---

## 2 · Clean architecture — the layer rule

Dependencies point **inward only**: presentation → application → domain. Infrastructure
implements domain ports. A domain file may never import React, a DB driver, or a vendor SDK.

```
presentation  (React components, screens)        ← may import application + shared/ui
application   (use-cases, orchestration logic)   ← may import domain
domain        (pure types, entities, ports)      ← imports nothing framework-specific
infrastructure(DB, providers, queues, HTTP)      ← implements domain ports
```

Every feature module repeats this internally, so a module is replaceable in isolation.

---

## 3 · Folder structure

```
founderos-app/
├─ src/
│  ├─ app/                         # Next.js routes, layout, globals (presentation shell)
│  │  ├─ layout.tsx                # fonts (3 voices), ThemeProvider, substrate
│  │  ├─ page.tsx                  # → Command Surface
│  │  └─ globals.css               # Strata tokens + adaptive themes (CSS vars)
│  │
│  ├─ shared/                      # cross-cutting, no business logic
│  │  ├─ ui/                       # Button, Surface, Card … the design system
│  │  ├─ providers/                # ThemeProvider, Query/Redux providers
│  │  ├─ config/                   # themes.ts (adaptive identities)
│  │  ├─ motion/                   # Strata motion variants
│  │  └─ lib/                      # utils (cn, formatters)
│  │
│  ├─ modules/                     # independent feature modules (clean arch each)
│  │  ├─ model-router/             # AI provider abstraction + routing  ← key seam
│  │  │  ├─ domain/                # AIProvider port, ModelRecord, TaskSpec
│  │  │  ├─ application/           # ModelRouter (pick + fallback)
│  │  │  ├─ infrastructure/        # providers/claude.ts, gemini.ts, …
│  │  │  └─ index.ts               # public API barrel
│  │  ├─ agent-engine/             # COO orchestrator, roster, gates
│  │  ├─ memory-engine/            # 4-layer memory, access-layer port
│  │  ├─ knowledge-graph/          # nodes/edges, traversal
│  │  ├─ design-dna/               # token/rules extraction (principles, never copies)
│  │  ├─ technology-radar/         # stack tracking + migration advice
│  │  ├─ opportunity-radar/        # opportunity scoring
│  │  ├─ cost-controller/          # budgets, spend ledger
│  │  ├─ decision-ledger/          # decisions with review dates
│  │  └─ founder-intelligence/     # ★ 3rd pillar: learning, decisions, brief
│  │
│  └─ features/                    # screens that compose modules + ui
│     └─ command-surface/          # the flagship screen
│        ├─ CommandSurface.tsx
│        └─ components/            # AgentChorus, ExecutiveAnswer, ThemeSwitcher
│
├─ tailwind.config.ts · tsconfig.json · next.config.mjs · .env.example
```

**Path aliases** (tsconfig): `@shared/*`, `@modules/*`, `@features/*`, `@app/*`.

---

## 4 · Module contract & dependency rules

1. A module exposes a **single `index.ts` barrel**. Other modules import only from the barrel,
   never deep paths. (Enforced by lint boundary rules.)
2. Modules depend on **domain types of other modules**, not their infrastructure.
3. `features/` may compose modules + `shared/ui`; modules must not import `features/`.
4. A new module (e.g. `legal-division/`) plugs in by following the same four-layer shape —
   **no platform refactor required** (extensibility rule).
5. The **AI provider abstraction** (`modules/model-router`) is the canonical seam: Claude,
   Gemini, OpenAI, and local models implement the same `AIProvider` port. Swapping or adding a
   provider never touches agent or feature code — see `infrastructure/providers/claude.ts`.

---

## 5 · Prompt management (planned shape)

Prompts are versioned assets, not inline strings: `modules/agent-engine/prompts/<role>/<version>.ts`
exporting a typed template + input schema (zod). The router records which prompt+model produced
each artifact, so a prompt regression is detectable on the golden set.

---

## 6 · Memory synchronization

Writes go to the **event log** first (source of truth); Mongo/Postgres/graph are projections,
rebuildable from it. The `MemoryAccess` port (memory-engine/domain) hides the Mongo↔Postgres seam.
Cross-store writes are reconciled by background BullMQ sweeps (consolidation, decay, promotion).

---

## 7 · Queues, caching, performance

- **BullMQ** queues: `run` (multi-agent), `sweep` (radars/consolidation), `ingest` (media via FFmpeg).
- **Caching:** TanStack Query (client), Redis (server reads + prompt/result cache), Next route cache.
- **Performance budget:** GPU-only transforms in motion, `prefers-reduced-motion` honored, code-split
  per feature, RSC for reads, stream long runs over SSE. Motion degrades to fades on low-end devices.

---

## 8 · Security

Workspace isolation via Postgres RLS + Mongo query scoping (defense in depth). BYO keys encrypted,
never logged or sent to a model. External content (radars, uploads) is untrusted: sandboxed,
tools allow-listed per agent. Privacy-pinned tasks route to local Tier-0 models only.

---

## 9 · Testing, CI/CD, monitoring

- **Testing:** Vitest for domain/application (pure, fast); golden-set regression for prompts; Playwright
  (add later) for the Command Surface happy path.
- **CI (GitHub Actions):** `typecheck → lint → test → build` on every PR; no merge on red.
- **Monitoring:** structured logs + run/cost events to an observability sink; per-run cost is a first-class metric.

---

## 10 · Coding standards

- Naming: components `PascalCase`, hooks `useX`, files match export, barrels `index.ts`.
- Imports: type-only imports marked; alias paths over relative `../../`.
- No default exports except Next route files and React screens.
- Every public function/port carries a one-line intent comment tied to a tenet/principle.

---

## 11 · Run it

```bash
cd founderos-app
npm install
cp .env.example .env.local   # fill keys as needed; the UI runs without them
npm run dev                  # http://localhost:3000
```

The home route renders the **Command Surface** with live adaptive themes — the reference quality bar.
