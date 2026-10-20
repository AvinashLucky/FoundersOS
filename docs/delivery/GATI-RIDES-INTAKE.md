# Gati Rides — Intake Contract & Delivery Process

> **Part B is superseded (2026-10-10).** Client projects no longer join FounderOS's
> workspaces: they live in `projects/<name>/` with their own install and must pass the eject
> check (`blueprints/FounderOS-Three-Track-Plan.md`, Track A). Sharing FounderOS's
> `node_modules` caused the React 18-vs-19 conflict that forced this change.

**Client project #1.** This document is the agreement between us before a single line
changes: what you provide, how the monorepo absorbs it, how I work, and what "100% done"
means in evidence rather than adjectives.

---

## PART A — YOUR SIDE (3 things, nothing else)

### A1 · Put the folder inside FoundersOS (the important one)

**Copy the whole `gati-rides` folder to:**

```
C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS\apps\gati-rides\
```

Why here: I already have permission to this folder, so nothing new needs approving — I can
read, fix and test immediately. And `apps/*` is already a declared workspace, so it becomes
part of the monorepo the moment it lands.

**Before you copy — delete these from the gati-rides folder if present:**
- `node_modules/`  (a nested copy breaks React and shadows the root install)
- `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`  (workspaces use the ROOT lockfile)
- `.env` / `.env.local` with real secrets — keep them locally, tell me the *names* of the
  variables and I'll wire `.env.example` properly.

Don't worry if you forget: run `npm run doctor` at the root and it lists exactly what to
remove; `npm run doctor:fix` removes it for you.

### A2 · Give me the project intent (5 minutes of typing)

Create `apps/gati-rides/INTENT.md` — or just paste into chat — answering:

1. **What is Gati Rides?** One paragraph, as you'd explain to a customer.
2. **Who are the users?** (riders · drivers · admin/dispatcher?)
3. **The core journey that must work end to end** (e.g. "rider requests a ride → nearby
   driver accepts → live status → fare shown → trip completes").
4. **What already works** in the half-built code, honestly.
5. **What's broken or missing** that you know of.
6. **What it must NOT do yet** (so I don't build the world).
7. **Where it should run** — localhost only for now, or a live URL too?
8. **Any Stitch/AI-Studio design images** — put them in `apps/gati-rides/design/` and I'll
   match the UI to them.

### A3 · The environment (once, ~30 min — the START-HERE doc covers it)

Node.js LTS installed · free keys pasted into `apps/web/.env.local`
(Gemini + Groq + OpenRouter + optional Tavily) · then at the **repo root**:

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS"
npm run doctor          # confirm one node_modules
npm install             # ONE install for the whole monorepo
npm run dev:gati        # or npm run dev:web for FounderOS
```

**That's everything on your side.** Nothing else is blocked on you.

---

## PART B — HOW ONE `node_modules` WORKS (your question, answered)

FoundersOS is already an **npm-workspaces monorepo**. The root `package.json` declares:

```json
"workspaces": ["apps/*", "services/*", "packages/*", "plugins/*"]
```

So the layout becomes:

```
FoundersOS/
├── node_modules/            ← THE ONLY ONE. Every dependency hoisted here.
├── package.json             ← workspaces + root scripts
├── package-lock.json        ← THE ONLY LOCKFILE
├── apps/
│   ├── web/                 ← FounderOS itself (package.json, NO node_modules)
│   └── gati-rides/          ← your project (package.json, NO node_modules)
└── packages/                ← shared code both apps can import
    ├── core/  utils/  logger/  config/  db/
```

**What this gives you**
- **One `npm install`** at the root installs for both apps. Shared deps (React, Next,
  TypeScript, Tailwind) are downloaded **once** — big disk and time saving on OneDrive.
- **One version of React**, which is what prevents the classic "Invalid hook call" and
  duplicate-context bugs that come from nested installs.
- **Shared packages work by name**: gati-rides can `import { ... } from "@founderos/utils"`
  with no publishing, no relative `../../..` paths.
- **Run either app**: `npm run dev:web` · `npm run dev:gati` (scripts already added).
- **Verify everything at once**: `npm run verify` → typecheck + tests + build across all
  workspaces.

**Rules that keep it healthy**
1. Never run `npm install` *inside* `apps/gati-rides`. Always at the root. If you need a
   dep only for that app: `npm install <pkg> --workspace apps/gati-rides` (still from root
   — it records the dep in that app's package.json but installs to the root tree).
2. Keep exactly one lockfile — the root one. Commit it.
3. Run `npm run doctor` after pasting any external project. It is a 1-second sanity check.
4. If a package genuinely misbehaves when hoisted (rare — some native/bundler tools do),
   the escape hatch is `nohoist`-style isolation for that one package, not a nested install.

**Guard rail:** `npm run doctor` fails with a non-zero exit if a nested `node_modules` or
lockfile reappears, so it can be wired into CI later.

---

## PART C — HOW I WILL WORK (the delivery flow)

This is the sequence I'll follow and record. Each stage produces a written artifact, so at
the end there is a paper trail, not a claim.

```
┌─ 1 · INTAKE ────────────────────────────────────────────────────────────┐
│ Read every file. Inventory: stack, routes, components, data model,      │
│ deps, dead code, secrets. No changes yet.                              │
│ → docs/delivery/gati-rides/01-inventory.md                             │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 2 · AUDIT ────────────────────────────────────────────────────────────┐
│ Run it. Capture real errors: build, typecheck, runtime, console.        │
│ Classify: blocker · bug · gap · risk · polish.                         │
│ → 02-audit.md (every finding with file:line and the exact error text)   │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 3 · BLUEPRINT (FounderOS Delivery Studio) ────────────────────────────┐
│ Feed the intent into /delivery → agentic loop, ML/GenAI needs, stack,   │
│ milestones, risks, pricing. The departments DEBATE the plan; the CEO    │
│ rules. Receipts captured.                                              │
│ → 03-blueprint.md  +  the debate transcript                            │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 4 · BUILD (in slices, each shippable) ────────────────────────────────┐
│ Fix blockers → complete the core journey → the five states on every    │
│ screen → premium visual pass matching your Stitch designs.             │
│ Every slice: code + test + doc in the same step.                       │
│ → 04-changelog.md (what changed, why, file by file)                    │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 5 · END-TO-END TEST ──────────────────────────────────────────────────┐
│ Unit (logic) · integration (API + data) · E2E (the real journey,        │
│ clicked through) · negative paths · a11y + reduced-motion · perf.       │
│ Every case: steps → expected → actual → PASS/FAIL.                     │
│ → 05-test-report.md (the evidence file)                                │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 6 · DELIVER ──────────────────────────────────────────────────────────┐
│ Run book (how to start/stop/deploy) · known limits stated plainly ·     │
│ handover walkthrough · the process deck · a proof post for the day.     │
│ → 06-handover.md  +  Gati-Rides-Process.pptx                           │
└────────────────────────────────────────────────────────────────────────┘
```

**Debugging discipline at every stage:** exact error text → smallest reproduction →
root cause named → fix → regression test that would have caught it. Nothing gets "seems
fixed"; it gets a test.

---

## PART D — WHAT "100% DONE" MEANS (evidence, not adjectives)

I will only claim completion when every line below is true and demonstrable:

| # | Gate | Evidence |
|---|---|---|
| 1 | Installs from a clean clone with one root `npm install` | terminal transcript |
| 2 | `npm run typecheck` exits 0 | transcript |
| 3 | `npm run test` — all suites green, including new ones for every bug fixed | transcript + counts |
| 4 | `npm run build` produces a production build | transcript |
| 5 | The core journey completes end to end | 05-test-report.md, step by step |
| 6 | Every screen has all five states designed (loading · empty · error · success · degraded) | screen-by-screen table |
| 7 | No console errors/warnings on any route | audit table |
| 8 | Secrets only in env; none in code, logs or prompts | grep evidence |
| 9 | Every known limit written down | 06-handover.md |
| 10 | Docs and code agree | docs:check |

**Honesty clause:** if a gate can't be met (e.g. a live map API needs a paid key), I will
say so plainly in the handover with the exact blocker and the cheapest path through it —
never quietly mark it green. That's the difference between a report you can trust and a
demo that collapses in front of a client.

---

## PART E — WHAT I'VE ALREADY DONE FOR THIS (before your folder arrives)

- ✅ Monorepo confirmed workspace-ready (`apps/*` declared) — your folder becomes a
  workspace on arrival with zero config.
- ✅ Root scripts added: `dev:web`, `dev:gati`, `verify`, `doctor`, `doctor:fix`.
- ✅ `tooling/mono-doctor.mjs` written and verified — enforces ONE node_modules, reports by
  default, deletes only with `--fix`.
- ✅ This intake contract.
- ⏳ Waiting on: the folder at `apps/gati-rides/` + your INTENT answers.

---

*Paste the folder, answer the eight questions, and I start at stage 1 immediately.*
