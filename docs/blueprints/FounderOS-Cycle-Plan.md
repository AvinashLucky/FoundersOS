# FounderOS — Cycle Plan (FounderOS + every project, one system)

**Written:** 2026-10-09 · **Status:** plan, awaiting the founder's decisions in §9
**Supersedes the ordering in:** `FounderOS-Product-Factory-Plan.md` (its engines and rules stay)
**Obeys:** `FounderOS-Doctrine.md` · `CLAUDE.md`

> **One sentence:** FounderOS becomes the place where a project is created, staffed with
> seats, researched, designed, built and shipped in **cycles** — and FounderOS itself is
> built the same way, in **5 cycles to MVP**, each cycle proven on one real pilot project.

---

## 0 · The answer first: what gets built first?

**FounderOS first — but never without a project.** Every FounderOS cycle is accepted only
when the **pilot project** (the bank app, §9-D1) moves one stage forward *through* it.

- Not "finish FounderOS, then build projects" (too slow, nothing real to test against).
- Not "build ten projects, then fix FounderOS" (the process you described lives *inside*
  FounderOS: login → create → seats → research → plan → cycles → publish).
- So: **one FounderOS cycle = one stage of the process, accepted by the pilot passing
  through it.** The other nine products wait until the MVP exists, then use it.

This replaces last week's "projects first" ordering. Nothing is lost: the ten project
folders, briefs and the crawler gate become inputs to this plan.

---

## 1 · The cycle rules (how every cycle works — FounderOS's and every project's)

1. **One theme per cycle.** A cycle does one systematic thing (e.g. "Research"). Work from
   another theme waits for its cycle — no mixing.
2. **Fixed scope, written before it starts:** goal · deliverables · owner seat · exit gate.
3. **Exit gate = evidence**, not a feeling: tests green, the pilot step demonstrated,
   receipts saved, docs updated. A cycle ends when its gate passes, not on a date.
4. **Time is a band, not a promise.** Typical cycle: **4–7 focused working days.** The COO
   seat re-estimates after every cycle from real receipts.
5. **Checkpoint every 3 cycles.** You review in FounderOS chat; the seats cross-verify your
   notes against the receipts, disagree openly where needed, and the CEO proposes the next
   move. You approve before the next cycle starts.
6. **Tiers:** **5 cycles = MVP.** More enhancement → **7, 9 or 14 cycles.** Every tier is a
   complete, working product at its level, never a half-finished bigger one.

---

## 2 · The seats (every project gets a company)

Each project gets a **roster of seats**. A seat is a *contract*, not a personality:
mandate · inputs · outputs · allowed tools · what needs your approval · which cycles it leads.
The existing PM/AR/UX/QA departments and the CEO synthesis become the first seats; nothing
is rebuilt.

| Seat | Mandate | Typical outputs | Leads |
|---|---|---|---|
| **CEO** | Scope, priorities, final call; resolves every disagreement explicitly | decision memo, go/no-go | kickoff, checkpoints |
| **COO** | Cycles, time bands, dependencies, cost per cycle | cycle plan, re-estimates | planning, every checkpoint |
| **Product Lead** | Buyer, job-to-be-done, proof workflow, scope cuts | PRODUCT_SPEC, acceptance criteria | kickoff |
| **Research Lead** | References, crawler runs, L1–L5 synthesis | research reports, reference matrix | research |
| **Design Lead** | Styles, tokens, screens, all states | design screens, DESIGN.md | design |
| **Architect** | Stack, data model, boundaries, API contract | ARCHITECTURE, API_CONTRACT | skeleton |
| **Frontend Lead** | UI implementation to the approved design | frontend code, component library | build cycles |
| **Backend Lead** | API, database, jobs, integrations (simulators labelled) | backend code, migrations | build cycles |
| **QA Lead** | Test plan, Playwright journeys, gate results | test suites, QA report | verify |
| **Security Lead** | Tenancy, auth, secrets, threat checks | security review, findings | every gate |
| **Release Lead** | Packaging, eject check, deploy | release package, eject receipt | ship |
| **Growth Lead** | Proof post, Gumroad/Contra/social drafts | listings, case study | publish |

**Minimum-set rule (already law):** a cycle activates only the seats it needs. A Research
cycle doesn't wake the Frontend Lead.

### 2.1 · Workers — our own always-on seats

A seat can also run as a **Worker**: it wakes on a schedule or an event, works inside the
project folder only, keeps the project's memory, and **stops for your approval** before
anything outward-facing (publishing, messaging, spending, deleting). Design in
`FounderOS-Product-Factory-Plan.md` §9 — unchanged.

**Your bot ideas go here.** When you bring features you like from the always-on agents you
use, they are added as Worker capabilities — but only in our shape: every capability gets
a contract, a sandbox, a budget, receipts and an approval point. Ideas we will **not**
adopt as-is: an agent holding *your* personal logins, or acting in your accounts unattended.

---

## 3 · The process — what you do, what happens (the bank app as the example)

| Step | You do | FounderOS does | Output (in `projects/<slug>/`) |
|---|---|---|---|
| **1 · Create** | Login → *New project* → pick a type (Bank app · Commerce · Lab ops · … · Blank) → name it | Creates the folder: `project.json`, `frontend/`, `backend/` (each with its own `package.json`), `details/`, `.env.example`, `CLAUDE.md` | a valid, ejectable skeleton |
| **2 · Kickoff** | Open the project | Seats give their first takes and **disagree openly**; COO turns them into a **cycle plan** (5 / 7 / 9 / 14) with themes, gates, time bands | `details/cycles/plan.md`, `debate.json` |
| **3 · Research** | Paste up to **3 reference links** | Research Lead runs the crawler (public pages), Playwright journeys; live progress + screenshots stream into FounderOS | `details/research/` (L1–L5 per reference + synthesis) |
| **4 · One plan** | Read, comment | CEO + COO + leads merge research into **one plan**; you approve | updated plan, PRODUCT_SPEC |
| **5 · Design** | Give styles, Figma exports, existing designs, skills | Design Lead generates screens (all states), live preview desktop/mobile, point-at-an-element comments, versions | `details/design/`, `DESIGN.md` |
| **6 · Build cycles** | Approve each cycle | Tasks per seat → executed (§4) → receipts | code + `details/receipts/` |
| **7 · Verify** | — | Gates: typecheck · tests · build · Playwright journeys · eject check; QA + Security reports | `details/gates/` |
| **8 · Checkpoint (every 3 cycles)** | Write your updates in chat | Seats cross-verify against receipts; CEO proposes the next move | checkpoint record |
| **9 · Publish** | Approve the drafts, post them | Growth Lead drafts the proof post, Gumroad listing, Contra service, case study | `details/release/` |

### 3.1 · Honest boundaries for the bank example

- **Original product, synthetic money.** No real bank connection, no real accounts, no
  bank's name, logo, wording or screens in the product. "Like SBI / iMobile / HDFC" means
  *the workflows we study*, never the brand we copy.
- **Crawl public pages only for banks.** Product pages, feature tours, help centres,
  public app-store listings. **Never** save a logged-in session to your real bank account:
  a saved session is live access to your money, and banks' terms generally forbid
  automated access. For logged-in journeys, *you* walk through them and record the steps
  by hand (the kit's L2 method) — without capturing your personal data.
- **A crawler sees the front, not the back.** It can map screens, flows, wording and
  states. It cannot recover a bank's backend rules, security or data. "100%" here means
  100% of what is publicly visible, which is the honest ceiling.

---

## 4 · How work executes — Cowork now, API agents later

Your rule: *everything runs through Claude (Windows) + Cowork first; model keys come last.*
So FounderOS is the **cockpit** (state, plans, seats, files, receipts) and Cowork is the
**hands**, connected by plain files both can read:

```
FounderOS UI ──writes──▶ projects/<slug>/details/tasks/T-012.md      (seat · cycle · goal · acceptance checks · status: queued)
Cowork      ──reads───▶ the queue, does the work in the project folder, runs the checks
Cowork      ──writes──▶ details/receipts/T-012.json                    (files changed · commands · exit codes · notes)
FounderOS   ──reads───▶ shows the receipt, runs the gates itself, marks the task done or blocked
```

- **One interface, three executors:** `SeatExecutor` → **Cowork** (default now) · **API**
  (Gemini / free tiers / Anthropic — added in a later cycle) · **Echo** (offline demo,
  labelled). Same task files, same receipts; switching executors changes nothing else.
- **What starts Cowork:** you open a Cowork session and say *"run the queue for
  bank-app"*, or a **Cowork scheduled task** runs it (e.g. every morning). FounderOS cannot
  wake Cowork by itself — stated plainly so the UI never pretends otherwise.
- **FounderOS never trusts "done".** It re-runs the gates and shows its own results next to
  the executor's receipt.
- **Files are the source of truth** for project work (`details/`), so Cowork needs no API,
  you can read everything, and an ejected project carries its full history.

### 4.1 · Dependencies (`node_modules`)

Each project keeps **its own** `node_modules`, installed for you by FounderOS/Cowork — you
never have to manage it. It **cannot** share FounderOS's own `node_modules`: that is
exactly the React 18-vs-19 break we fixed by moving Gati Rides out, and a shared install
would make the project un-ejectable. Disk and time stay low because npm already caches
every package once per machine; a shared pnpm store is an option later if disk becomes a
problem.

---

## 5 · The Studio feel (patterns we blend into our own)

You named the tools whose working styles you like. We take **patterns**, never their
looks, names or code, and build one FounderOS way of working:

| Pattern | Where it shows up in FounderOS |
|---|---|
| **Plan before change** — the agent states what it will do, you approve | every task + cycle start |
| **Chat that builds** — talk to a seat, it edits the project, you see the diff | project chat with `@seat` mentions |
| **Live preview** — the app running beside the conversation, desktop/mobile toggle | Design + Build cycles |
| **Point and ask** — select an element in the preview, comment on *that* | Design Studio |
| **Design canvas from a prompt** — screens generated, iterated, approved | Design Studio |
| **Versions you can return to** — every approved step restorable | per-task receipts + git |
| **Bring your own inputs** — style refs, Figma exports, existing designs, skills | Design inputs panel |
| **Receipts everywhere** — model/executor, cost, files, dissent | FounderOS's own law |

Figma: imported as exported frames/images now; a Figma connector only if one is connected
and verified later.

---

## 6 · FounderOS MVP — 5 cycles

Each cycle: one theme · the pilot's acceptance step · the exit gate.

| Cycle | Theme | Builds | Pilot acceptance | Exit gate |
|---|---|---|---|---|
| **1** | **Create** | *New project* flow (type → name → scaffold), project types (Bank app + Blank first), project home with five states; task/receipt file formats defined | You create the bank app from the UI; its skeleton installs, runs, passes the eject check | tests + typecheck green; eject ✓ on the skeleton |
| **2** | **Company** | Seat roster per project (contracts, on/off), kickoff council → cycle plan (5/7/9/14), project chat with `@seat`, `SeatExecutor` with Cowork + Echo | The bank app gets a debated cycle plan with visible dissent; you approve it | plan saved; dissent present; approval recorded |
| **3** | **Research** | Paste 3 links → research job (crawler in public mode + Playwright journeys) on your machine, live progress + screenshots, L1–L5 report view | 3 bank references researched; reports readable in FounderOS | the crawler's **7-run gate is OPEN** first (run it during cycles 1–2); reports cited |
| ✋ | **Checkpoint 1** | You review cycles 1–3 in chat; seats cross-verify; CEO proposes changes | — | your go |
| **4** | **Design** | Design Studio on top of the `design-director` skill (shipped 2026-10-10): 3 directions per project from the design genome, project history so looks never repeat, contrast-checked tokens; then style inputs, screen generation with all states, live preview desktop/mobile, point-and-comment, versions, `DESIGN.md` | Bank app: 3 directions shown, one chosen, core screens approved | 3 directions presented; every contrast check passes; every screen has all states; approved set saved |
| **5** | **Deliver** | Task queue + Cowork bridge, gate runner (typecheck · test · build · Playwright · eject), QA/Security reports, publish drafts (reuses Freelance Studio) | The bank app finishes **its own cycle 1 (Skeleton)** end-to-end through FounderOS: tasks → Cowork → receipts → gates green → proof post drafted | the whole loop runs without leaving FounderOS except to start Cowork |

**MVP = after cycle 5:** any of the ten products can be created, staffed, researched,
designed and built cycle by cycle inside FounderOS, with Cowork as the hands.

### 6.1 · Beyond MVP — 7 · 9 · 14 cycles

| Cycle | Theme | Adds |
|---|---|---|
| 6 | **Workers** | Always-on seats on schedules/events (QA Worker first), your bot-idea intake (§2.1) |
| 7 | **Live agent desk** | Headed browser runs beside FounderOS with streamed screenshots, agent run reports, replay → **7-cycle tier** |
| ✋ | Checkpoint 2 | |
| 8 | **Portfolio** | All projects in one cockpit; foundation template extracted from the pilot; cross-project seats |
| 9 | **Publish & growth** | Listing/case-study/social pipeline, posting calendar, proof packs → **9-cycle tier** |
| ✋ | Checkpoint 3 | |
| 10 | **API executors** | Seats on Gemini / free tiers / Anthropic keys via the same task protocol |
| 11 | **Native build loop** | write → run → read errors → fix, confined and allow-listed (Product Factory §2) |
| 12 | **Agent Studio** | You define new seats (mandate, principles, quality bar, model) |
| ✋ | Checkpoint 4 | |
| 13 | **Agency services** | The 10 marketing services on the same pipeline (Three-Track Plan, Track C) |
| 14 | **Hardening & launch** | Security review, accessibility, performance, docs, release → **14-cycle tier** |

---

## 7 · The project cycle template (what FounderOS gives every project)

The COO seat proposes one of these at kickoff; you choose the tier.

| Cycle | Theme | Done means |
|---|---|---|
| P1 | **Skeleton** | Auth, two tenants, DB + migrations, design tokens, CI, health checks — runs from a bare copy |
| P2 | **Core workflow** | One vertical slice end-to-end: UI → API → DB → job → verified result → UI |
| P3 | **Exceptions & integrations** | Approvals, failure paths, labelled simulators, idempotency |
| P4 | **Experience** | Every screen, every state, responsive, accessible, polished motion |
| P5 | **Verify & package** | Mandatory tests, demo script, eject ✓, listing drafts → **MVP (5)** |
| P6–P7 | Second workflow · evaluation & hardening | → **7** |
| P8–P9 | Extra channel (mobile/voice/AI feature) · operations (jobs, recovery, observability) | → **9** |
| P10–P14 | Performance · admin & analytics · accessibility & languages · security review · launch & case study | → **14** |

"100% working end-to-end" means **100% of the features agreed for that tier**, proven by
gates — never "everything a real bank does".

---

## 8 · What already exists and gets reused (nothing rebuilt)

Agent loop + debate + CEO synthesis (seats) · project records + workspace scoping ·
`projects/` registry + eject verifier (Create, Release) · the ten project folders + briefs +
prompts (project types, seat inputs) · Research Agent + SSE pattern (Research) · Delivery
blueprint agent (kickoff) · Freelance Studio (Publish) · Product-Research-Engine + its
7-run gate (Research) · model router (API executors, later).

---

## 9 · Decisions for you (with my recommendation)

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | **Pilot project** | **The bank app = VaultRelay (product 04)**, built web-previewable through Expo's web target | It is your own example, and it exercises every stage. Alternative: LedgerWeave (simpler, web-only). |
| D2 | **3 bank references** | You choose; public pages only (§3.1) | Your market knowledge beats mine here |
| D3 | **`node_modules`** | Per project, installed by FounderOS/Cowork, npm cache shared | Ejectable and conflict-free (§4.1) |
| D4 | **Executor now** | Cowork by default; your Gemini key optional for faster council runs | Matches "Cowork first, keys last" |
| D5 | **The other nine products** | Wait for the MVP, then go through FounderOS one at a time | One pilot keeps cycles un-mixed |
| D6 | **Crawler gate** | Do the 7 runs during cycles 1–2 on your PC | Cycle 3 needs it open |

---

## 10 · Honest limits

- FounderOS cannot start Cowork on its own; you or a scheduled Cowork task does.
- Playwright and the crawler run on **your Windows machine** (they need Chrome). FounderOS
  shows their progress and screenshots; it does not embed a live Chrome inside the page.
- Cycle time bands are estimates. The COO re-estimates from real receipts after each cycle.
- The crawler sees public, front-end behaviour only (§3.1).
- Regulated domains (banking, health) ship as bounded demos with synthetic data.

## 11 · Executive review (CLAUDE.md §15)

1. **Chain + North Star:** yes — this *is* the chain, made into one process you can run.
2. **Reuse:** §8; the genuinely new parts are the cycle engine, seat roster UI, Cowork
   bridge, Design Studio and gate runner — all already named in earlier plans.
3. **States / guards:** required in every cycle's exit gate.
4. **Typecheck / tests:** not applicable — plan only, no code changed.
5. **Docs:** this file + dev log + PROGRESS + a pointer in the Product Factory Plan.
6. **Placeholders / secrets:** none.
7. **Not verified:** Expo's web target for the pilot's design (decided in its skeleton
   cycle); Figma import paths; how many Playwright journeys a bank's public pages allow
   before blocking; Cowork scheduled-task limits on your plan.
