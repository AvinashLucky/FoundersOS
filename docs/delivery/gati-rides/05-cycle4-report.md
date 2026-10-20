# Gati Rides — Cycle 4 report · "Make it right"

**Run:** 2026-10-10 · Linux sandbox copy, then a bare-copy reinstall from the saved files.
**Status:** cycle 4 complete — **4 cycles done.** Re-estimate: **6 cycles** to a sellable v1
(was 5); see §6.

---

## 1 · Headline

Every number on screen is now computed from data, every dispatch decision follows one
rule, every control has a name, and nothing claims to do something it doesn't.

- **Invented figures removed** — padded counters (+77 bookings, +₹38,200), and printed
  trends no data supported: "↑ 18% vs Yesterday", "92% Compliance", "1.3x Surge",
  "+24% vs Last Week", and a hard-coded revenue breakdown. All figures now come from a
  tested `computeStats` / `revenueByCategory`, labelled as demo data.
- **One dispatch rule instead of five** — auto-dispatch paired rides and captains *by
  position* (a bike ride went to an auto-rickshaw, a sedan ride to a bike); Pre-Bookings
  assigned any idle driver; GatiGo rides could go to bikes. Now `canServe`: same category,
  or a free upgrade to a bigger car — never a downgrade, never across vehicle types.
- **AI output validated** — fields whitelisted, typed, length-capped and clamped
  server-side; unknown keys never reach the browser; the caller's note is fenced in the
  prompt as data.
- **0 unnamed controls** on all six screens and the call modal (was 16), guarded by an
  automated audit proven to fail when a label is removed.
- **Two fake actions made honest** — "Broadcast delivered to all captains" (nothing was
  sent) now says *simulated*; the WhatsApp trip-ticket toggle (connected to nothing) is
  disabled and says *not connected yet*.

## 2 · Bugs found and fixed this cycle (beyond the queued F1–F9)

| # | Bug | Effect | Test |
|---|---|---|---|
| B1 | Prompt called Prime an "SUV"; the form mapped "SUV" → GatiXL | AI-parsed Prime calls silently became XL bookings | `toCategory("GatiPrime SUV") → GatiPrime` + API test |
| B2 | No-key placeholder sent `datetime`; the form reads `scheduledTime` | Schedule time never filled in | API test asserts `scheduledTime` |
| B3 | Model's `IMMEDIATE` written into a `NOW`/`PREBOOK` field | Booking type set to an invalid value | mapped in the form |
| B4 | Demand radar ignored HTTP errors | A rate-limit showed "Demand Level: undefined" | screen test with a 429 |
| B5 | Demand radar never showed the fallback label | An example forecast looked like a real one | screen test asserts "Not an AI forecast" |
| B6 | Fleet broadcast and WhatsApp claimed actions that don't exist | Operator believes messages were sent | screen tests |
| B7 | Two more real public figures in mock data (Imran Khan, Varun Grover) besides Sanjay Dutt | Real names in a product for sale | replaced with fictional names |
| B8 | `package-lock.json` drifted from `package.json` after cleanup | `npm ci` would fail on a fresh machine | caught by the bare-copy test, fixed |

## 3 · Verification actually run

| Check | Result |
|---|---|
| `npm run typecheck` (strict) | **0 errors** |
| `npm test` | **67/67** (was 28) — 8 files |
| Regression tests fail on old code | auto-dispatch by position → badge 0 instead of 1; a11y audit fails when one label is removed |
| `npm run build` | client + `dist/server.cjs` built |
| Production server / dev server | health ok · index 200 · page served |
| Bare copy (`npm ci` from the saved lockfile → typecheck → tests → build) | **pass** |
| FounderOS eject check | **ejectable ✓** (28 files) |

## 4 · Changes

| File | Change |
|---|---|
| `src/lib/dispatch.ts` (new) | `canServe`, `eligibleDrivers`, `findDriverFor`, `planAutoDispatch`, `assignBlockedReason`, `maxBookingNumber` |
| `src/lib/stats.ts` (new) | `computeStats`, `revenueByCategory` — every dashboard figure |
| `server/sanitize.ts` (new) | `sanitizeParsedCall`, `sanitizeDemand`, `toCategory` |
| `src/App.tsx` | computed stats; category-aware auto-dispatch; sequential booking ids (counter, collision-free) |
| `DispatchCommandCenter`, `QuickCallModal`, `PreBookingsPlanner`, `InteractiveMap` | shared dispatch rule; the map's *Assign* explains why it's blocked |
| `RevenueAnalytics` | breakdown from bookings, assumptions labelled, empty state |
| `server/api.ts` | sanitised model output, canonical `category`, prompt fences the caller's note |
| `Navbar`, `PassengerApp`, `DriverFleetManager`, `QuickCallModal` | accessible names, linked labels, switch semantics; honest broadcast + WhatsApp |
| `App.tsx`, `Navbar.tsx`, `data/mockData.ts` | other brands' names and real people's names removed |
| `types.ts` | `SystemStats` reflects computed figures; `DemandForecast` replaces `any` |
| `package.json` / lockfile | `vite` only in dependencies (it's needed at runtime); lockfile resynced |
| tests | `src/lib/*.test.ts`, `server/sanitize.test.ts`, `src/a11y.test.tsx`, `src/App.cycle4.test.tsx`; API tests extended |

## 5 · Decision for you

**The upgrade rule.** I chose: a GatiGo ride can go to a GatiPrime or GatiXL captain
(free upgrade); a GatiPrime ride to GatiXL; bikes and autos only to their own type. It's
one map in `src/lib/dispatch.ts` (`FREE_UPGRADES`) — tell me if your operation works
differently and it's a one-line change.

## 6 · Re-estimate (COO rule: re-plan from evidence)

Cycle 4 found eight bugs on top of the nine queued findings, so honesty and correctness
took the whole cycle. G6 (visual baselines) and G7 (persistence) move to cycle 5; the
handover pack (G8) becomes cycle 6.

| Cycle | Theme | Status |
|---|---|---|
| 1 · Make it honest | ✅ |
| 2 · Make it safe | ✅ |
| 3 · Make it tested | ✅ |
| 4 · Make it right | ✅ **this report** |
| 5 · Make it durable | G7 repository seam + persistence (bookings survive a restart), G6 visual baselines |
| 6 · Make it sellable | G8 README, deploy, demo video, handover pack |

## 7 · What I did NOT verify

- **Your machine** — run `npm install` inside `projects/gati-rides`, then `npm test` (expect 67).
- **A real browser** — screens tested in jsdom; no visual check (that's G6).
- **Real Gemini** — the sanitiser is tested against fakes; real replies not yet seen.
- **Screen-reader use end to end** — names are verified programmatically; nobody has
  driven the app with NVDA/VoiceOver yet.
