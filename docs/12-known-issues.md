---
title: Known Issues
source: curated
owner: engineering
lastReviewed: 2026-06-28
status: seed
---

# Known Issues

Open issues and workarounds. Template: _ID · Severity · Description · Workaround · Tracking link._

- **KI-1 · Low · Rate limiter is in-memory (single instance).** Fine for dev/solo deploys;
  multi-instance deploys need the Redis implementation behind the same `rateLimit` interface.
- **KI-2 · Low · Idea Agent has no live web ingestion yet.** With no ANTHROPIC_API_KEY it
  serves labeled offline templates; with a key it ideates from model knowledge. Web-scale
  trend sweeps land with the Phase 8/9 worker.
- **KI-3 · Info · Marketplace posting is tracked, not automated.** Founder posts on
  Gumroad/Contra/Fiverr manually and marks the listing live; direct API publishing is a
  later integration.
- **KI-4 · Low · Safety gate is heuristic (phrase patterns).** Defense-in-depth only —
  providers also refuse; a classifier-based gate can replace it behind `safetyGate()`.
- **KI-5 · RESOLVED 2026-10-01 · Nested `node_modules` in `apps/gati-rides`.**
  Cause was React 19 (Gati-Rides) vs React 18.3.1 (apps/web) inside one workspace graph.
  Fixed by Track A: Gati-Rides moved to `projects/gati-rides` (outside the workspace globs);
  `mono-doctor` now reports clean. **Follow-up on your machine, in this order:** (1)
  `npm install` inside `projects/gati-rides` — its own install was incomplete and it was
  silently borrowing 16 packages from the root; (2) then `npm install` at the repo root so
  `package-lock.json` drops the old `apps/gati-rides` entries. *Corrected 2026-10-10: the
  original note said root only, which would have pruned what Gati was borrowing.*
- **KI-6 · Medium · `npm run lint` is broken (pre-existing).** `apps/web/.eslintrc.json`
  extends `next/typescript`, which only exists in `eslint-config-next` ≥ 15; the repo has
  14.2.5. The `@typescript-eslint/consistent-type-imports` rule also needs the
  `@typescript-eslint` plugin, which isn't a direct dependency. Fix (one reviewed change):
  drop `next/typescript` and that rule, or upgrade to Next 15 deliberately. New code on
  2026-10-01 was linted with `next/core-web-vitals` alone and is clean.
- **KI-7 · Low · Project-folder ownership is a local file.** `projects/.owners.json` maps
  folders to workspaces; first claim wins. It is correct for one founder on one machine,
  not for a shared server — a multi-user deploy needs a repository-backed owner store
  behind the same `ProjectFolderRegistry` interface.
- **KI-9 · Low · Crawler gate thresholds are unvalidated.** `MIN_MD_BYTES` (600) and
  `MIN_JSON_ITEMS` (5) in `Product-Research-Engine/gate/inspect.mjs` were set without seeing
  real crawler output. The first real run may need them tuned; the freshness rule must not
  be loosened. The gate also counts runs, not distinct competitors.
- **KI-10 · Info · Planned products show as unclaimed in FounderOS.** The 10 product
  folders appear under *Built projects* as "found on disk"; an eject check on one fails
  ("no package.json") until Prompt B creates `frontend/` and `backend/`. That is correct —
  they aren't built — but it reads as red until then.
- **KI-12 · Low · design-director quality is unmeasured on real builds.** The generator's
  guarantees are tested (distinctness, history, contrast), but whether sites built with the
  skill beat sites built without it hasn't been evaluated side by side yet. Variety ≠ quality;
  the workflow and verification steps carry quality.
- **KI-11 · RESOLVED 2026-10-10 · Gati Rides cycle-3 findings.** All nine fixed in cycle 4,
  plus eight more bugs found on the way (`delivery/gati-rides/05-cycle4-report.md`).
  Remaining Gati debt: no persistence (cycle 5), no visual baselines (cycle 5).
- **KI-8 · Info · Stage 1 checks are static.** *Partly closed 2026-10-10:* project status
  now reports each app's install as complete / incomplete (with the missing packages) /
  not installed, by reading the app's *own* `node_modules` — the gap that let Gati lean on
  FounderOS's root install unnoticed. The eject verifier scans imports, deps and
  env statically — it cannot prove a bare copy installs and runs (the gate runner, plan
  step 3, adds real install/build). Port status reports that *something* answers on the
  manifest's port, not that it is this project.
- **KI-13 · Low · Hand-written crawler configs still leave a stub L1.** The six older
  configs (runway, kling, heygen, higgsfield, invideo, openart) predate
  `research/lib/site-config.js`. Their public runs capture screenshots and snapshots but
  don't write Layer 1, so the gate fails them. Fix: append the site-config L1 section, or
  rebuild them with `siteConfig`.
- **KI-14 · Info · RaKeGa live-class costs are estimates.** `projects/rakega/details/brief.md`
  §3 is computed from published LiveKit and Bunny prices at assumed bitrates, and the
  Stage + Audience CDN path is untested. Cycle 3 load-tests it and replaces the estimate
  with measured numbers.
- **KI-15 · Info · Reach-agent legal position is a summary, not advice.** The outreach rules
  follow DPDP/TRAI guidance from secondary sources. Confirm with a lawyer before sending at
  scale or to EU/UK contacts.
- **KI-16 · Info · RaKeGa's free paths are partly untested.** The Oracle free VM with
  self-hosted LiveKit for ~200 seats is unproven (capacity, idle reclaim, a reported 2026
  cut to the free ARM allowance). YouTube embed is free but must never carry paid content.
  Free-tier limits (Neon, R2, LiveKit Build) come from third-party summaries and are
  re-checked on deploy day.
- **KI-17 · Medium · Next.js 14 still has advisories fixed only in 15/16.** 14.2.35 clears
  the critical ones, but `npm audit` still lists DoS-class issues in `next` and its bundled
  `postcss`, fixed only in a major upgrade. Plan a Next 15 migration as its own cycle; don't
  `npm audit fix --force`.
- **KI-18 · Medium · Gati pre-booking time is free text.** "Tomorrow 09:00 AM" is a string,
  not a date, so the planner can't sort reliably or warn about a pickup in the past. This is
  a structural fix for the redesign (a real date-time field + validation server-side).
- **KI-19 · Low · FounderOS build needs internet for fonts.** `next/font/google` fetches at
  build time; offline or firewalled builds fail. Self-hosting the three fonts would remove it.
- **KI-20 · Medium · Keys were exposed.** Real keys sat in `.env.example` (and were read
  in a chat session on 2026-10-16). They now live only in `.env.local`, but every key
  that was in that file should be rotated, OpenRouter first because it can spend credit.
- **KI-21 · Info · Model ids and free tiers drift.** `gemini-4-argon` access is gradual;
  Groq's pricing page shows paid developer rates for gpt-oss (free plan assumed, so cost
  is reported as 0); OpenRouter `:free` ids get retired. All of these fail over safely,
  but a run on a paid Groq plan would under-report cost. Each id can be overridden with
  `*_MODEL` env vars.
