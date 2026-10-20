# FounderOS — Project Structure & Alignment Map

> **Read this first.** It explains every folder and file, where each came from across
> the 8 steps, the one clean target structure, and the exact moves to get there.
> Goal: you understand the whole project and can read & extend it confidently.

**Last updated:** June 28, 2026 · **Status:** pre-alignment (two app homes to merge)

---

## 1 · TL;DR — the one problem, the one fix

**Problem:** there are **two app homes**. `founderos-app/` is the real, working React app
(built in Step 5). `apps/web/` is an empty placeholder reserved for it (created in Step 6).
The root also collects reference blueprints, design docs, and temp scripts.

**Fix:** make it **one monorepo**. `founderos-app/` becomes `apps/web/`. Reference and
design files move into `docs/`. Root becomes clean. Nothing is lost — only relocated.

```
BEFORE (confusing)                      AFTER (clean, one home)
FoundersOS/                             FoundersOS/
├─ founderos-app/   ← real app          ├─ apps/web/        ← the app (was founderos-app)
├─ apps/web/        ← empty placeholder ├─ services/        ← backend runtimes
├─ packages/        ← shared core       ├─ packages/        ← shared core (unchanged)
├─ *.dc.html        ← old references    ├─ docs/
├─ FounderOS-*.md   ← design docs        │  ├─ blueprints/  ← the FounderOS-*.md/.docx/.html
├─ _build-*.js      ← temp scripts       │  └─ reference/   ← old AI Company OS *.dc.html
└─ ...                                  └─ tooling/scratch/ ← _build-*.js
```

---

## 2 · Current state — every item, where it came from, what to do

### Folders

| Folder | Origin | What it is | Action |
|---|---|---|---|
| `founderos-app/` | **Step 5** | The real Next.js + React + Tailwind app (Strata design system, Command Surface, modules). 44 files. | **→ move into `apps/web/`** |
| `apps/web/` | **Step 6** | Empty placeholder (only a README reserving the spot). | Receives `founderos-app` contents |
| `apps/` | Step 6 | Container for deployable apps. | Keep |
| `services/` | Step 6 | `worker/` (BullMQ) + `gateway/` (optional). Skeleton READMEs only. | Keep |
| `packages/` | Step 6 + **Step 8** | The shared platform core. 17 package folders; `config/core/utils/logger` now have **real code** (Phase 1). | Keep — this is correct |
| `plugins/` | Step 6 | Extensibility modules. Empty skeleton. | Keep |
| `infra/` | Step 6 | Docker / CI / scripts. Skeleton. | Keep |
| `docs/` | Step 6 | 18 auto-evolving project docs + index. | Keep — add `blueprints/` + `reference/` |
| `tooling/` | Step 6 | Repo scripts (docs-check placeholder). | Keep — add `scratch/` |
| `node_modules/` | stray | Empty/leftover from an install attempt. Gitignored. | Ignore (or delete later) |

### Loose root files

| File(s) | Origin | What it is | Action |
|---|---|---|---|
| `AI Company OS *.dc.html` (4 files) | **your reference** (pre-Step 1) | Your original blueprint mockups that everything was synthesized from. Valuable history. | **→ `docs/reference/`** |
| `support.js` | your reference | Runtime for those old mockups. | **→ `docs/reference/`** |
| `FounderOS-Product-Bible.md/.docx` | Step 1–2 | Vision & constitution. | **→ `docs/blueprints/`** |
| `FounderOS-Master-Architecture.md/.docx` | Step 3 | System architecture. | **→ `docs/blueprints/`** |
| `FounderOS-Architecture-Map.html` | Step 3 | Visual architecture companion. | **→ `docs/blueprints/`** |
| `FounderOS-Design-Showcase.html` | Step 4 | The Strata design language (interactive). | **→ `docs/blueprints/`** |
| `FounderOS-Step6-Foundation.md` | Step 6 | Folder & database design. | **→ `docs/blueprints/`** |
| `FounderOS-Step7-MVP-Roadmap.md` | Step 7 | The 12-phase roadmap. | **→ `docs/blueprints/`** |
| `ENGINEERING.md` | Step 8 | The standing engineering standard. | Keep at root (it's a working rule) |
| `PROJECT-STRUCTURE.md` | now | This map. | Keep at root |
| `README.md` | Step 6 | Monorepo entry. | Keep at root |
| `CLAUDE.md` | your project | Project instructions. | Keep at root |
| `package.json` / `package-lock.json` | Step 6 | npm-workspaces root config. | Keep at root |
| `.editorconfig` `.gitignore` `.nvmrc` `.env.example` | Step 6 | Root tooling config. | Keep at root |
| `_build-arch-docx.js` `_build-docx.js` | my temp tools | Scripts I used to generate the .docx files. Not part of the app. | **→ `tooling/scratch/`** |

> **Why keep the blueprints at all?** They're your single source of truth (Steps 1–7).
> Moving them into `docs/blueprints/` keeps them authoritative but off the root, and the
> `docs/` index already cross-links them.

---

## 3 · The target structure (the one perfect layout)

```
FoundersOS/                         # repo root (npm workspaces monorepo)
│
├─ apps/
│  └─ web/                          # ← founderos-app moves here (the Next.js app)
│     ├─ src/
│     │  ├─ app/                    # routes, layout, globals (Strata substrate)
│     │  ├─ features/               # screen compositions (Command Surface, …)
│     │  ├─ shared/                 # ui/ providers/ config/ motion/ lib/
│     │  └─ modules/                # (temporary) → promote to packages/* over time
│     ├─ package.json · tsconfig.json · tailwind.config.ts · next.config.mjs
│     └─ README.md
│
├─ services/
│  ├─ worker/                       # BullMQ runtime (long agent runs, sweeps)
│  └─ gateway/                      # optional API gateway (build only if needed)
│
├─ packages/                        # shared platform core — ALL business logic
│  ├─ config/   ✅ real             # tsconfig/eslint presets
│  ├─ core/     ✅ real             # domain contracts (ids, errors, entities, events, ports)
│  ├─ utils/    ✅ real + tests     # pure helpers (Result, id, dates, assert)
│  ├─ logger/   ✅ real + tests     # structured logging + redaction
│  ├─ db/       🟡 started          # Mongo + Postgres + event log + repository
│  ├─ ui/                           # ← Strata design system (promote from app/shared/ui)
│  ├─ ai-providers/                 # Model Router + provider abstraction
│  ├─ agents/ memory/ knowledge-graph/ intelligence/
│  ├─ auth/ queue/ cache/ storage/ prompts/
│  └─ (each: domain/ application/ infrastructure/ + index.ts barrel)
│
├─ plugins/                         # extensibility modules
├─ infra/                           # docker/ github-actions/ scripts/
├─ tooling/                         # repo scripts (+ scratch/ for one-off tools)
│
├─ docs/                            # the living knowledge base
│  ├─ 01..18 *.md                   # auto-evolving project docs
│  ├─ blueprints/                   # ← the FounderOS-*.md/.docx/.html (Steps 1–7)
│  ├─ reference/                    # ← old AI Company OS *.dc.html + support.js
│  ├─ features/                     # per-feature 10-doc sets (Step 8 onward)
│  └─ PROGRESS.md                   # implementation progress tracker
│
├─ README.md · ENGINEERING.md · PROJECT-STRUCTURE.md · CLAUDE.md
├─ package.json · package-lock.json · .env.example · .gitignore · .nvmrc · .editorconfig
```

Legend: ✅ real code now · 🟡 started · everything else = skeleton awaiting its phase.

---

## 4 · Migration checklist (do these moves yourself)

Safe, non-destructive — all are **moves**, nothing is deleted. Easiest in the VS Code
Explorer (drag & drop), or PowerShell from the project root. Order doesn't matter.

**A. Merge the app into the monorepo**
1. Open `founderos-app/` and `apps/web/` side by side.
2. Move **everything inside** `founderos-app/` into `apps/web/` (including hidden files:
   `.gitignore`, `.eslintrc.json`, `next-env.d.ts`).
3. When prompted about `README.md` (both have one), keep the app's README; the old
   placeholder note can be discarded.
4. Delete the now-empty `founderos-app/` folder.
   - PowerShell: `Move-Item founderos-app\* apps\web\ -Force; Move-Item founderos-app\.* apps\web\ -Force; Remove-Item founderos-app`

**B. Organize docs**
5. Create `docs\blueprints\` and `docs\reference\`.
6. Move into `docs\blueprints\`: `FounderOS-Product-Bible.*`, `FounderOS-Master-Architecture.*`,
   `FounderOS-Architecture-Map.html`, `FounderOS-Design-Showcase.html`,
   `FounderOS-Step6-Foundation.md`, `FounderOS-Step7-MVP-Roadmap.md`.
7. Move into `docs\reference\`: `AI Company OS *.dc.html` (all 4) and `support.js`.

**C. Tidy temp scripts**
8. Move `_build-arch-docx.js` and `_build-docx.js` into `tooling\scratch\`.

**D. Verify**
9. From root: `npm install` (links workspaces), then `npm run dev` (should start `apps/web`).
10. Delete the stray empty `node_modules/` at root if present, then re-run `npm install`.

> Keep at root (do **not** move): `README.md`, `ENGINEERING.md`, `PROJECT-STRUCTURE.md`,
> `CLAUDE.md`, `package.json`, `package-lock.json`, and the dotfiles.

---

## 5 · How the structure maps to the 8 steps

| Step | Produced | Lives in |
|---|---|---|
| 1 Vision · 2 Constitution | Product Bible | `docs/blueprints/FounderOS-Product-Bible.*` |
| 3 System Architecture | Master Architecture (+ map) | `docs/blueprints/FounderOS-Master-Architecture.*` |
| 4 UI/UX Design System | Strata showcase + design tokens | `docs/blueprints/FounderOS-Design-Showcase.html` + `apps/web` (code) |
| 5 Technical Blueprint | The React app | `apps/web/` (was `founderos-app`) |
| 6 Database & Folder | Monorepo + DB design | this structure + `docs/blueprints/FounderOS-Step6-Foundation.md` |
| 7 MVP Roadmap | 12-phase plan | `docs/blueprints/FounderOS-Step7-MVP-Roadmap.md` |
| 8 Production Impl. | Real code, feature by feature | `packages/*` + `apps/web` + `docs/features/*` |
| (standing) | Engineering & doc-sync rules | `ENGINEERING.md` |

Your **reference content** (the original `AI Company OS` mockups) → `docs/reference/`.

---

## 6 · How to read & extend the project (the understanding goal)

**To understand the product** → read `docs/blueprints/` in step order (1 → 7).
**To understand the code** → start at `apps/web/src/app/page.tsx` (the Command Surface),
then `apps/web/src/shared/ui` (design system), then `packages/core` (the shared contracts
everything agrees on).

**The mental model, in one line:** apps & services *compose* packages; packages hold the
logic; `core` is the shared vocabulary. Dependencies always point **inward**:
`apps → packages → core`. Nothing ever imports "outward".

**Where to put new code:**

| You're adding… | Put it in… |
|---|---|
| A new screen / page | `apps/web/src/features/<feature>/` |
| A reusable UI component | `packages/ui/` (or `apps/web/src/shared/ui` until promoted) |
| Business logic / a domain rule | the relevant `packages/<module>/application` |
| A shared type/contract | `packages/core` |
| A new engine (memory, router, …) | its `packages/<module>/` (domain → application → infrastructure) |
| A background job | `services/worker/processors/` |
| A new model provider | `packages/ai-providers/infrastructure/providers/` |

**Golden rules** (from `ENGINEERING.md`): import packages only via their `index.ts` barrel;
no business logic in components; production-ready only (no TODOs/placeholders); update the
docs in the same change.

---

## 7 · Foundation status (Step 8 · Phase 1 — already started)

Real, production code already written and correctly placed:

- `packages/config` ✅ — shared `tsconfig.base.json` + eslint preset.
- `packages/utils` ✅ — `Result`, prefixed ids, dates, assert + **unit tests**.
- `packages/core` ✅ — branded ids, typed `DomainError`, entities, events, ports.
- `packages/logger` ✅ — structured logger with secret redaction + **unit tests**.
- `packages/db` 🟡 — started (package.json in place; Mongo/Postgres/event-log/repository next).

These need no moving — they already sit in the target structure. After you do the migration
in §4, the next coding session finishes `packages/db`, then wires `apps/web` to import from
`@founderos/core` etc.

---

## 8 · Short-term roadmap — "release fast in days"

A tight, dependency-ordered path to a running, demoable FounderOS. Each day ends with
something that works.

**Day 1 — Align & boot.** Do the §4 migration. `npm install`, `npm run dev`, confirm the
Command Surface runs from `apps/web`. Wire `apps/web` to import `@founderos/core` + `utils`.

**Day 2 — Finish the foundation.** Complete `packages/db` (Mongo client, event log,
base repository) + the typed env loader. Health check connects to MongoDB. Tests green.

**Day 3 — Projects vertical slice (Phase 3).** Projects CRUD: `projects` collection +
`/api/v1/projects` + a real "create/open project" UI in the Command Surface. Adaptive theme
per project. This is the first end-to-end, demoable feature.

**Day 4 — Auth (Phase 2, minimal).** Magic-link sign-in + workspace session + per-workspace
scoping. Now it's multi-user-safe.

**Day 5 — Memory seed (Phase 4 start).** `packages/memory` write+recall over Mongo (vector
optional first), so a project starts remembering decisions. Memory Explorer (read-only).

**Day 6–7 — The loop (Phase 5–6 thin slice).** Model Router with one real provider +
a minimal COO run that produces one answer and writes to memory. This is the "wow" demo:
one prompt → one answer that remembers.

> After this slice, you have a believable FounderOS to learn and iterate on. The remaining
> phases (Design DNA, Radars, Founder Intelligence, Billing, Optimization) layer on top per
> `docs/blueprints/FounderOS-Step7-MVP-Roadmap.md`.

---

*Keep this map current as the structure changes — it's the front door to understanding FounderOS.*
