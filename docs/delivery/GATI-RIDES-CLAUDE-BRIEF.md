# Gati Rides — Claude Code brief

> **Partly superseded (2026-10-10).** Gati Rides now lives in `projects/gati-rides` with its
> **own** `node_modules` — run `npm install` *inside* that folder. The "one root
> node_modules / never install inside the app" rules below described the old workspace
> setup and no longer apply. Stages 1–3 are done (`gati-rides/01`–`04` reports).

**How to use:** paste the folder at `apps/gati-rides/`, open a terminal at the repo root,
run `claude`, then paste **one stage prompt at a time** from §3. Never paste all six —
staged work is reviewable; a single mega-prompt is not.

---

## 1 · Setup (once)

```powershell
npm install -g @anthropic-ai/claude-code
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS"
claude
```

Claude Code reads `CLAUDE.md` at the root automatically — the standards, security rules,
model-routing invariants and the executive review are already loaded. You don't repeat them.

**Before the first stage prompt, say this once:**

> Read `CLAUDE.md`, `docs/blueprints/FounderOS-Doctrine.md`, and
> `docs/delivery/GATI-RIDES-INTAKE.md`. Confirm in three lines that you understand the
> standards, the ten completion gates, and that you must never mark a gate green without
> running it. Then wait for my stage prompt.

---

## 2 · Ground rules to enforce (paste if Claude drifts)

- One `node_modules` at the repo root. Never `npm install` inside `apps/gati-rides` —
  use `npm install <pkg> --workspace apps/gati-rides` from the root. Run `npm run doctor`
  if unsure.
- Every bug fix ships with the regression test that would have caught it.
- Never delete my code to make an error disappear. Fix the cause, or tell me it can't be
  fixed and why.
- Stop and ask before: changing the data model, adding a paid dependency, or touching
  `apps/web` (that's FounderOS itself — out of scope for this project).
- Secrets only in `.env.local`. If you find a hard-coded key, remove it, put a placeholder
  in `.env.example`, and tell me which key to rotate.

---

## 3 · The six stage prompts

### Stage 1 — Inventory (no changes)

> Do not modify any file. Read everything under `apps/gati-rides/` and produce
> `docs/delivery/gati-rides/01-inventory.md` containing: the stack and versions actually
> used; every route/page/screen; every component with its purpose in one line; the data
> model (types, collections, API shapes); external services and where their keys are read;
> state management approach; dead or duplicated code; anything hard-coded that shouldn't be.
> End with "Open questions" — anything you had to guess. Do not fix anything yet.

### Stage 2 — Audit (evidence, still no feature work)

> From the repo root run `npm install`, `npm run typecheck`, `npm run test`, and
> `npm run build`, plus `npm run dev:gati` long enough to load each route. Capture the
> **exact** error text for every failure. Produce `docs/delivery/gati-rides/02-audit.md`:
> a table of findings, each with `file:line`, the verbatim error, the root cause, and a
> severity of blocker · bug · gap · risk · polish. Then list them in fix order with a
> one-line justification each. Fix nothing yet — I want to see the map first.

### Stage 3 — Blueprint (the debated plan)

> Read `apps/gati-rides/INTENT.md`. Produce `docs/delivery/gati-rides/03-blueprint.md`
> containing: the core user journey as numbered steps; the target architecture (routes,
> components, data model, API contracts); what to fix vs rebuild vs delete, with reasons;
> the five states for every screen; the test plan; and the milestone slices in the order
> you'll build them. Argue both sides on the two biggest decisions — the case for and
> against — then rule and say why. Do not start building.

### Stage 4 — Build (one slice at a time)

> Implement slice 1 from the blueprint only. Follow `CLAUDE.md` exactly: TypeScript strict,
> reuse `shared/ui` patterns where they fit, all five states, guards on any new route,
> zero placeholders. Add tests for the logic you write. Then run `npm run typecheck` and
> `npm run test` and paste the real output. Append what changed and why to
> `docs/delivery/gati-rides/04-changelog.md`. Stop after this slice and wait for me.

*(Repeat for each slice, changing the number. Review between slices — that's the point.)*

### Stage 5 — End-to-end test

> Produce `docs/delivery/gati-rides/05-test-report.md`. For every case: ID, steps,
> expected, actual, PASS/FAIL. Cover the full core journey; every negative path (bad input,
> network failure, empty data, unauthorised); every screen's five states; keyboard
> navigation and reduced-motion; and console cleanliness on each route. Where a case
> cannot be executed here, mark it **NOT VERIFIED** with the reason — never guess a PASS.
> Then run the ten completion gates from `docs/delivery/GATI-RIDES-INTAKE.md` §D and give
> each a real status with the command output as evidence.

### Stage 6 — Handover

> Produce `docs/delivery/gati-rides/06-handover.md`: how to install, run, test and deploy;
> the env vars needed and where to get each; the architecture in one diagram; known limits
> stated plainly; and the first three things a new developer should read. Then generate
> `docs/delivery/gati-rides/Gati-Rides-Process.pptx` — 10–12 slides covering the six
> stages, the before/after audit numbers, the architecture, the test evidence, and the
> completion gates. Finally write a 90-word build-in-public post about what shipped.

---

## 4 · Model choice per stage

| Stage | Model | Why |
|---|---|---|
| 1 Inventory | Sonnet | Wide reading, mechanical output |
| 2 Audit | Sonnet | Running commands and transcribing errors |
| 3 Blueprint | **Opus** | The decisions that shape everything after |
| 4 Build | Sonnet | Volume implementation against a fixed plan |
| 5 Test | Sonnet | Systematic execution |
| 6 Handover | Sonnet (Opus for the deck narrative) | Assembly |

Switch with `/model` inside Claude Code.

---

## 5 · What to bring back here

After each stage, paste me the artifact path plus anything Claude flagged as
**NOT VERIFIED** or an open question. I'll review the decisions, catch what a
single-pass agent misses, and prepare the next stage prompt. That review loop between
stages is the difference between "generated" and "delivered".
