# FounderOS — Three-Track Plan

**Written:** 2026-09-04 · **Status:** plan only, no code moved · **Decision:** approved to plan all three
**Obeys:** `FounderOS-Doctrine.md` (the law) · `CLAUDE.md` (repo rules)

Three tracks, each sitting on the delivery chain:

| Track | Chain position | Serves |
|---|---|---|
| **A · Project Registry + Ejectable Projects** | *built system delivered* | Law 1 Effective · Principle 2 no lock-in |
| **B · Token Router** | *the company thinks* | Law 2 Efficient · Principle 3 free-first |
| **C · Agency Service Catalog** | *client need → money → resold* | The whole chain |

---

## 0 · What I verified today (facts, not claims)

| Finding | Evidence |
|---|---|
| Two `node_modules` exist | `./node_modules` + `./apps/gati-rides/node_modules` (12 packages) |
| **Root cause: version conflict** | `gati-rides` needs **React 19**; `apps/web` pins **React 18.3.1**. npm cannot hoist both, so it nested — npm is behaving *correctly* |
| `mono-doctor` already detects it | `WARN apps/gati-rides: nested node_modules (15 packages) — shadows the hoisted root install` |
| `--fix` would break Gati-Rides | Removing the nested copy leaves it without React 19 |
| Router is well-built | `OpenAICompatibleProvider` exists; Echo + Gemini + Groq + OpenRouter + Ollama + Anthropic registered, key-gated, Echo-floored, Vitest-deterministic |
| 9 registry models, 6 free at `costPer1k: 0` | `router.ts` |

**Conclusion:** the nested `node_modules` is a *symptom*. The disease is that a **client
project is registered as an npm workspace of FounderOS**. Track A fixes the disease.

---

# TRACK A · Project Registry + Ejectable Projects

## A1 · The category error

`apps/gati-rides` is a **product FounderOS built**, not a *part of* FounderOS.
Putting it in `workspaces: ["apps/*"]` forced npm to reconcile FounderOS's dependency tree
with a client project's — a reconciliation that has no reason to succeed and, here, didn't.

> **Rule (new):** FounderOS's workspaces contain only FounderOS. Client projects live
> outside the workspace graph and are *orchestrated*, never *linked*.

## A2 · Target layout

```
FoundersOS/
├── package.json            workspaces: apps/* services/* packages/* plugins/*   ← unchanged
├── apps/web/               FounderOS itself                                     ← the only app
├── packages/ services/ …   FounderOS internals
│
└── projects/               ← NEW. NOT an npm workspace. Not built by FounderOS.
    └── gati-rides/
        ├── project.json    ← FounderOS manifest (the "content JSON")
        ├── frontend/       ← its own package.json + node_modules
        ├── backend/        ← its own package.json + node_modules
        ├── details/        ← blueprint.md · debate.json · decisions.md · receipts.json
        └── README.md       ← generated: how to run this standalone
```

`projects/` is added to the root `.gitignore` **or** tracked deliberately — the founder
chooses per project. Either way npm never sees it, so **no hoisting, no conflicts, ever.**
Gati-Rides keeps React 19; `apps/web` keeps React 18. Both correct, permanently.

> **Note on shape:** Gati-Rides today is a single Vite app with `server.ts` (not split
> frontend/backend). The manifest supports both shapes — see `layout` in A3. Do not force a
> split that the project doesn't have; that would be a rewrite, not a migration.

## A3 · `project.json` — the manifest (the contract)

The single source of truth FounderOS reads. Deliberately small, human-editable, and
**inert on eject** (a plain JSON file that a standalone project can ignore or delete).

```jsonc
{
  "schemaVersion": 1,
  "id": "prj_gati_rides",              // links to the FounderOS project record
  "name": "Gati Rides",
  "domain": "developer",                // drives Strata adaptive theme
  "summary": "AI dispatch, pre-booking and fleet command for cab operators.",

  "layout": "single",                   // "single" | "split"
  "apps": {
    "frontend": { "dir": ".", "install": "npm install", "dev": "npm run dev", "port": 5173 },
    "backend":  null                     // or { dir: "backend", dev: "npm run dev", port: 3001 }
  },

  "runtime": { "node": ">=18.18", "packageManager": "npm" },

  "client":   { "name": "", "contact": "" },
  "delivery": { "status": "in-progress", "pricedUsd": null, "deliveredAt": null },

  "provenance": {                        // receipts — Law 4 Understandable
    "blueprintRunId": "run_…",           // the debate that produced it
    "createdAt": "2026-09-04T00:00:00Z",
    "detailsDir": "details"
  },

  "eject": { "standalone": true, "verifiedAt": null }
}
```

**Validation:** a zod schema in `server/validation/project-manifest.schema.ts`. Every read is
parsed defensively (CLAUDE.md §8.7 — manifests on disk are untrusted input).

## A4 · The Project Registry seam

> **Shipped 2026-10-01 as `ProjectFolderRegistry`** (`server/project-folders/registry.ts`) —
> renamed so it can't be confused with FounderOS *workspaces*. Stage 1 surface: `list · get ·
> claim · status · verifyEject`. `scaffold` arrives with the foundation template (Product
> Factory step 2); eject *zip* with the gate runner (step 3).

New repository, same pattern as every other (`server/repositories/`), so it swaps
implementation without touching callers:

```ts
export interface ProjectWorkspaceRegistry {
  list(workspaceId: string): Promise<ProjectManifest[]>;
  get(workspaceId: string, id: string): Promise<ProjectManifest | null>;
  scaffold(workspaceId: string, input: NewProjectInput): Promise<ProjectManifest>;
  status(workspaceId: string, id: string): Promise<ProjectRunStatus>;
  eject(workspaceId: string, id: string): Promise<EjectReport>;
}
```

- **In-memory / disk implementation** reads `projects/*/project.json` (default).
- **Workspace-scoped**: the registry only ever exposes projects owned by the caller's
  workspace (CLAUDE.md §6). A manifest without a matching workspace-owned project record is
  ignored, not leaked.

## A5 · Orchestration — staged, and honest about the constraint

**The honest engineering problem:** long-lived dev servers must not be spawned from a
Next.js route handler. Request handlers are short-lived; a child process owned by one would
be orphaned or killed unpredictably. Promising "click to run" without solving process
ownership would be a *wish*, not a design (Law 1).

So it ships in two stages:

**Stage 1 — Detect & Direct (build first, no process ownership).**
- FounderOS reads the manifest and shows the project card with real status.
- **Status by port probe**: `status()` checks whether `apps.frontend.port` is listening →
  `running` | `stopped`.
- A **copy-ready command block** (`cd projects/gati-rides && npm run dev`) and an
  "open folder" affordance.
- This is honest, useful, and has zero process-lifecycle risk.

**Stage 2 — Runner (only after Stage 1 is in use).**
- A small local runner owns child processes: `tooling/project-runner.mjs`, started with
  `npm run projects` (or folded into `services/worker`).
- FounderOS talks to it over a local HTTP/IPC seam: `start(id)`, `stop(id)`, `logs(id)`.
- Ports assigned from a range; logs streamed to the UI over **SSE** (CLAUDE.md §4).
- If the runner is not running, the UI **degrades to Stage 1** and says so plainly
  (the *degraded* state — Law 4 + the five-state rule).

## A6 · EJECT — the portability guarantee ★ (your requirement)

> *"after he is done with project he has to install and run out of FounderOS if he wants to
> move out"*

This is Principle 2 (**no lock-in**) made testable. Eject is not a feature bolted on at the
end — it is an **invariant enforced from day one**.

**The three eject invariants** (a project violating any of these is a defect):

1. **No FounderOS imports.** A project may never import `@founderos/*` or reach into
   `apps/web`. Its `package.json` lists every dependency it needs, with real versions —
   never `workspace:*`.
2. **No FounderOS env.** It reads only its own `.env`. It must never require
   `AUTH_SECRET`, `MONGODB_URI`, or any FounderOS variable.
3. **Runs from a bare copy.** `cp -r projects/gati-rides ~/anywhere && npm install &&
   npm run dev` must work with FounderOS deleted from the machine.

**`eject()` produces an `EjectReport`** — it *verifies*, it doesn't just zip:

| Check | Method |
|---|---|
| No `@founderos/*` imports | static scan of the project's source |
| No `workspace:` protocol deps | parse its `package.json` |
| No nested-into-parent resolution | confirm it has (or can create) its own `node_modules` |
| Required env documented | its `.env.example` covers every `process.env.X` it uses |
| Standalone README present | generated at scaffold, updated on eject |

Output: `{ ok, violations[], zipPath? }`, and on success it stamps
`eject.verifiedAt` in the manifest. **A green eject report is the deliverable you hand the
client** — it is also, not coincidentally, exactly the receipt that proves no lock-in.

## A7 · Migrating Gati-Rides (the actual steps, when approved)

1. `mkdir projects/` and move `apps/gati-rides` → `projects/gati-rides` (its nested
   `node_modules` **comes with it and becomes correct** — it is no longer "nested", it is
   the project's own install).
2. Remove `dev:gati` from the root `package.json` scripts, or repoint it at the new path.
3. `npm install` once at root → `mono-doctor` now reports **zero** nested installs, because
   `projects/` is outside the workspace globs.
4. Write `projects/gati-rides/project.json` (`layout: "single"`, port 5173).
5. Run the eject verifier; fix any violation it reports.
6. Confirm `apps/web` still builds and the 92-test baseline is green.

**Risk & reversal:** this is a folder move plus a scripts edit. Fully reversible by moving
it back. Nothing inside Gati-Rides changes.

## A8 · Craft bar for Track A

- **Five states** on the Projects surface: loading · empty (no projects yet) · error
  (unreadable manifest) · success (card + status) · **degraded** (runner offline → Stage 1).
- **Security:** manifests zod-parsed; paths resolved and confined to `projects/` (no `..`
  traversal); no shell interpolation of user strings into commands.
- **Tests:** manifest schema (valid/invalid/malicious path), registry workspace-scoping,
  eject verifier catches each of the three invariants. Every fix ships its regression test.

---

# TRACK B · Token Router

## B1 · One honest correction first

The tools in the screenshot — **Kimi Code CLI, Qwen Code, MiMo Code, Huawei CodeArts,
Z Code** — are **CLI coding agents** (developer tools, like Claude Code). They are *not*
API endpoints. FounderOS's departments cannot call a CLI as their runtime brain, and
pretending otherwise would be fabricating a capability (Law 3).

**What *is* true and useful:** the model families behind several of them expose
**OpenAI-shaped APIs with free tiers** — and FounderOS is already built to absorb those in
one line each (`OpenAICompatibleProvider`, CLAUDE.md §9).

So: **yes, FounderOS can run with zero paid providers — it already does.** Track B makes
that *more efficient*, not newly possible.

## B2 · What already exists (verified)

Echo (offline floor, always) · Gemini free tier · Groq · OpenRouter (gateway to many
`:free` models) · Ollama (opt-in local) · Anthropic (paid, optional).
Six of nine registry models are `costPer1k: 0`. Key-gated registration is correct.

## B3 · The actual upgrade — quota-aware rotation

Today `pick()` selects the cheapest capable model **statically**. Every free tier has a
*daily cap* (requests/day or tokens/min). When one is exhausted the provider starts
throwing, the router falls back to Echo, and **run quality silently drops to templated
text** — the failure mode the doctrine calls out as unacceptable (silence masquerading as
an answer).

**The Token Router adds a per-provider health + quota ledger:**

```ts
interface ProviderHealth {
  key: string;
  callsToday: number;
  dailyLimit: number | null;      // null = unknown; never invent a number
  consecutiveFailures: number;
  cooldownUntil: number | null;   // epoch ms after a 429
  lastError: string | null;
}
```

**Routing becomes:** cheapest capable **and reachable and not cooling down** →
on `429`/quota error, mark cooldown and **rotate to the next free provider at the same
quality bar** → only fall to Echo when every free option is exhausted, and **say so**.

**Why this is the efficiency win:** stacking several free tiers multiplies daily free
throughput instead of burning one and collapsing to Echo.

## B4 · Adding providers (one line each — the seam already exists)

Any OpenAI-shaped endpoint slots in beside Groq/OpenRouter with a base URL, an env key and
a registry entry. Candidates worth wiring: **Qwen** (DashScope / via OpenRouter),
**Moonshot/Kimi**, **Z.ai / GLM**, plus more OpenRouter `:free` models.

**Two rules that must not bend** (CLAUDE.md §9 — this bug has bitten once):
1. **Register only if its key exists.** A registered-but-unreachable provider wins the
   cheapest sort, fails every call, and silently degrades every run.
2. **Quality numbers are estimates, not benchmarks.** Set them conservatively and label
   them as our own routing heuristic — never publish them as measured comparisons (Law 3;
   and the doctrine forbids competitor benchmarking).

## B5 · Receipts (Law 4)

The run side-channel gains: **which provider served each seat**, whether it was a
**rotation** (and from what), and remaining known quota. Degraded runs say
*"free tiers exhausted — answered offline"* rather than quietly returning Echo text.

## B6 · Guardrails & tests

- Under `VITEST`, still **Echo-only** — the ledger must not make suites machine-dependent.
- Ledger is in-memory with the same `globalThis` hot-reload pattern as the rate limiter.
- Tests: rotation on 429, cooldown expiry, "every quality bar still has a free option"
  (assert the *guarantee*, not a hard-coded provider list — that assertion broke once),
  and Echo remains the floor.

---

# TRACK C · Agency Service Catalog

## C1 · What this is

Your ten services turned into **productized offerings** FounderOS can sell, brief, deliver
and report on — the `client need → money → resold` span of the chain. It builds on the
existing `/delivery` and `/freelance` surfaces rather than a new app.

## C2 · The ten, as catalog entries

Each becomes a `ServiceOffering` with: what the buyer gets · inputs needed from them ·
deliverable checklist (definition of done) · effort band · price band · what FounderOS
actually produces vs. what you produce.

| # | Service | FounderOS produces | You produce |
|---|---|---|---|
| 1 | Posters (festival/offer/product) | concepts, copy, layout brief, print+social specs | the artwork |
| 2 | Meta Ads (FB + IG) | audience/targeting plan, ad copy variants, funnel | campaign setup |
| 3 | Insta Reels (8–15/mo) | hooks, scripts, shot list, posting calendar | edit + post |
| 4 | WhatsApp (click-to-chat) Ads | campaign structure, chat-opener scripts, qualifying flow | setup |
| 5 | Website | sitemap, copy, stack advice, **buildable project** (Track A!) | review + launch |
| 6 | Form → WhatsApp | the actual integration spec + working form | connect number |
| 7 | Meta Lead Forms | field design, qualifying questions, follow-up sequence | setup |
| 8 | Social Media Management | monthly content plan, captions, reply playbook | daily execution |
| 9 | Google Ads | keyword plan, negatives, ad copy, landing alignment | setup |
| 10 | Performance / Growth Report | **auto-generated** weekly/monthly report from entered metrics | share it |

**The honesty line (Law 3):** FounderOS is strong at *thinking, briefing, copy, structure,
integration and reporting*. It does **not** produce finished artwork or edited video.
Services 1 and 3 must be sold as "concept + script + brief", with the visual craft yours
(or a tool's). Selling generated posters we can't generate would be fabricating capability.

## C3 · Flow (reuses what exists)

```
Client intake form  →  brief  →  the company debates it (existing loop, receipts shown)
                    →  service plan + deliverable checklist  →  work delivered
                    →  report generated  →  packaged as a Gumroad/Contra listing (existing Freelance Studio)
```

Intake → brief is the only genuinely new step; the debate, receipts, listings and platform
tracker already exist.

## C4 · Pricing

Price **bands** the founder sets per market, stored in the catalog — never invented
precision, and never presented as a market rate we measured (Law 3, §14). Bundles
(e.g. *Starter · Growth · Full*) are just named sets of offerings with a combined band.

## C5 · Additions worth making (ideas you asked for)

1. **Client Intake → Brief** — one link the client fills; output is a structured brief that
   feeds the debate. Highest leverage of anything here.
2. **Deliverable Checklist per service** — a real definition of done. Kills scope creep and
   makes "delivered" objective.
3. **Proof Pack generator** — turns a completed project (blueprint + receipts + before/after
   metrics) into a case study page. This is what wins the *next* client on Contra.
4. **Monthly Report generator** (service #10 productized) — enter the numbers, get the
   client-ready report. Recurring revenue with near-zero marginal effort.
5. **Retainer modelling** — one-off vs monthly, with a simple capacity check so you don't
   oversell your own hours.
6. **WhatsApp-first templates** — your services are clearly aimed at local businesses;
   WhatsApp is the conversion surface. Ship the chat scripts as first-class deliverables.
7. **Reusable local-business kit** — one strong website + form→WhatsApp build, reskinned per
   client. This is Track A's ejectable-project model earning money repeatedly.

## C6 · Craft bar

Five states on the catalog and intake surfaces; zod on the intake body; rate-limit the
public intake route; never store client PII beyond what the brief needs.

---

# Sequencing (recommended order, with reasoning)

| Order | Track | Why it goes here | Rough size |
|---|---|---|---|
| **1** | **A · Registry + Eject (Stage 1)** | Unblocks everything; ends the node_modules problem permanently; makes "delivered" real | ~2 days |
| **2** | **C · Intake → Brief + Catalog** | Fastest path to *money*, and it consumes Track A's output | ~2 days |
| **3** | **B · Token Router rotation** | Pure efficiency — valuable, but nothing is blocked on it today | ~1 day |
| **4** | **A · Runner (Stage 2)** | Only once Stage 1 is genuinely in use | ~1 day |

Track B is last deliberately: the free ladder **already works**. Rotation raises the
ceiling; it doesn't unblock the chain.

---

# Executive review (CLAUDE.md §15)

1. **North Star / chain?** Yes — A = *delivered*, C = *money + resold*, B = *efficient thinking*.
2. **Reuses what exists?** Yes — repository seam, `OpenAICompatibleProvider`, SSE, Freelance
   Studio, `/delivery`. Track A adds one new repository; nothing is duplicated.
3. **Five states / fallbacks / guards?** Specified for every new surface, including the
   *degraded* state when the project runner is offline.
4. **typecheck / tests?** **Not run — no code was changed this session.** Baseline stands at
   the last verified state; new logic ships with its own tests when built.
5. **Docs updated same change?** This plan + known-issues entry for the nested install.
6. **Secrets / placeholders / TODOs left?** None — this is a design document.
7. **What I did NOT verify — stated plainly:**
   - I did **not** run `npm run typecheck`, `npm run test`, or `npm run build` this session.
   - I did **not** move, install, or execute anything; the repo is byte-identical apart from
     this document and the docs updates.
   - I did **not** confirm Gati-Rides still runs after a move — that is step 6 of A7 and
     must be done *during* migration, not assumed.
   - I did **not** verify the free-tier limits or API shapes of Qwen / Kimi / GLM. Those
     must be checked against their live docs at wiring time; I have deliberately not written
     numbers I cannot source.
   - Port-probe status detection (A5 Stage 1) is a design, untested against a running
     Gati-Rides.
