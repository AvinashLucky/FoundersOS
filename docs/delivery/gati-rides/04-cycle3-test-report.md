# Gati Rides — Cycle 3 report · "Make it tested"

**Run:** 2026-10-09/10 · Linux sandbox copy with a real install, then a bare-copy
re-install from the saved files. **Status:** cycle 3 complete — **3 of 5 cycles done (60%).**

---

## 1 · Headline

- **13 strict TypeScript errors → 0**, each fixed at its cause (no suppressions).
- **First automated suite: 28 tests**, all passing — 15 API, 11 screens/journeys, 2 empty-fleet.
- **Two silent state bugs found and fixed**, each with a regression test proven to fail on
  the old code:
  1. **A captain accepting a ride did nothing.** The captain app reports
     `(bookingId, driverId)`; dispatch expects `(driverId, bookingId)`. Wiring one straight
     into the other swapped them, the driver lookup failed, and the accept was silently
     dropped. TypeScript couldn't catch it — both are strings.
  2. **Passengers could be shown a captain dispatch never assigned.** The passenger screen
     picked its own driver while dispatch matched separately; with no free captain in the
     category it showed the first driver in the list (even an offline one, or an invented
     "Ramesh Kumar" with a hard-coded vehicle). Now dispatch decides and the passenger sees
     exactly that — or "Finding your captain" when the ride is queued.
- **Gati now runs from a bare copy.** Copied out of FounderOS, `npm ci` → typecheck → 28/28 →
  build all pass with FounderOS absent.

## 2 · Verification actually run

| Check | Command | Result |
|---|---|---|
| Typecheck (strict, `noUncheckedIndexedAccess`) | `npm run typecheck` | **0 errors** (was 13) |
| Tests | `npm test` | **28/28** |
| Regression tests are real | suite run against the original `App.tsx` + `PassengerApp.tsx` | **3 fail on old code**, pass on new |
| Production build | `npm run build` | client + `dist/server.cjs` built |
| Production server | `NODE_ENV=production node dist/server.cjs` | `/api/health` ok · index 200 · labelled fallback parse |
| Dev server | `npx tsx server.ts` | `/api/health` ok · page title served |
| Bare copy | fresh folder, `npm ci` from the saved lockfile, then all of the above | **pass** |
| FounderOS eject check | verifier on `projects/gati-rides` | **ejectable ✓** (20 files) |

## 3 · Tests added

| Area | Tests | Covers |
|---|---|---|
| API (`server/api.test.ts`) | 15 | health · T17 5,000-char note · T18 wrong type · T19 hour range · T20 location required · 64 kb body → 413 · validator boundaries · T21 labelled demand fallback · labelled parse fallback · model reply passed through as `source:"model"` · unreadable reply degrades (no 500) · provider error hides internals (no key text leaks) · demand via model · T22 12/min then 429 + Retry-After · health not rate-limited |
| Screens (`src/App.test.tsx`) | 6 | G3 — every screen renders with **zero React errors**: Live Dispatch, Pre-Bookings, Captains & Fleet, Revenue, Captain Mobile App, Passenger Booking |
| Core journey | 2 | G4 — *Save Call & Auto-Queue* queues the ride when no captain is free (appears in Live Dispatch, badge +1) and auto-dispatches when one is |
| Regressions | 3 | captain accept updates dispatch · passenger sees "finding your captain" when none free · passenger sees the assigned captain's real vehicle |
| Empty fleet | 2 | captain view explains instead of crashing · passenger ride is queued, not given an invented captain |

## 4 · Changes

| File | Change | Why |
|---|---|---|
| `server/api.ts` (new) | All `/api` routes in `createApp({ getAi })`; model client injected; rate-limit windows per app instance | Testable without Vite, a port or a key; behaviour unchanged |
| `server.ts` | Now only wires Gemini, Vite/static and the port | Same runtime behaviour, smaller entry |
| `src/App.tsx` | Guarded auto-dispatch index; `handleAddBooking` returns the created booking; captain-accept argument order fixed; empty-fleet message | G1 + bugs 1–2 |
| `src/components/PassengerApp.tsx` | Categories as a typed lookup; shows dispatch's assignment (or "Finding your captain"); assigned captain's own vehicle; call button only with a real captain | G1 + bug 2 |
| `src/components/DriverCaptainApp.tsx` | `pendingBookings[0] ?? null` | G1 |
| `src/components/DriverFleetManager.tsx` | Verified-docs icon wrapped with `role="img"` + label (the icon no longer accepts `title`) | G1 |
| `src/components/PreBookingsPlanner.tsx` | Guarded first idle driver | G1 |
| `vitest.config.ts`, `*.test.ts(x)` (new) | Test setup + 28 tests | G2–G4 |
| `package.json` | `typecheck` + `test` scripts; dev-only: vitest, jsdom, Testing Library | No runtime dependency added |
| `package-lock.json` (new) | Lockfile for reproducible installs | Bare-copy guarantee |

## 5 · Found, not fixed — queued for cycles 4–5 (one theme per cycle)

| # | Finding | Cycle |
|---|---|---|
| F1 | **Dashboard numbers are inflated by constants** — bookings `+77`, revenue `+₹38,200` | 4 (honesty first) |
| F2 | **Other companies' brand names in the UI** ("Rapido / Zepto Captain View Mode", "Uber / Rapido Passenger View Mode", tab tooltips) — remove before selling | 4 |
| F3 | A real public figure's name in mock data ("Sanjay Dutt") — replace with fictional names | 4 |
| F4 | **Booking ids can collide** — `bk-` + a random 200–999; duplicates break assignment and React keys | 4 (with G7 repository seam) |
| F5 | Auto-dispatch ignores vehicle category (a bike booking can get an SUV captain) | 4 |
| F6 | Any-category match for GatiGo bookings (`|| category === 'GatiGo'`) — confirm it's intended upgrade logic | 4 |
| F7 | Model JSON is spread into the response unvalidated — validate the shape | 4 |
| F8 | Form labels not linked to inputs; auto-dispatch toggle has no accessible name (part of G5) | 4 |
| F9 | `predictResult` typed `any`; `vite` listed in both dependencies and devDependencies | 4 |

## 6 · What I did NOT verify

- **Your machine.** Everything ran in a Linux copy. Gati's own `node_modules` on your PC is
  incomplete (FounderOS now shows "install incomplete · 16 missing") — run `npm install`
  inside `projects/gati-rides` once, then `npm run typecheck`, `npm test`, `npm run dev`.
- **A real browser.** Screens were rendered in jsdom (DOM + React), not Chrome — no visual or
  layout check. Visual baselines are cycle 4 (G6).
- **Real Gemini.** The model path is tested with a fake client; real prompt quality is unknown.
- **Mobile layouts.** Not exercised.

## 7 · Cycle progress

| Cycle | Status |
|---|---|
| 1 · Make it honest | ✅ |
| 2 · Make it safe | ✅ |
| 3 · Make it tested | ✅ **this report** |
| 4 · Make it beautiful + correct | next — F1–F9, G5 accessible names, G6 visual baselines, G7 repository seam |
| 5 · Make it sellable | README, deploy, demo video, handover pack (G8) |
