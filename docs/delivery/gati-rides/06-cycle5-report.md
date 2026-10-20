# Gati Rides — Cycle 5 report · "Make it durable"

**Run:** 2026-10-10 · Linux sandbox with a real Chromium, then a bare-copy reinstall.
**Status:** cycle 5 complete — **5 of 6 cycles done.** Next: cycle 6, "Make it sellable".

---

## 1 · Headline

- **Data survives restarts (G7).** Bookings, captains and settings now live on the server,
  saved to `data/gati-store.json` with atomic writes. Proven with a real production server:
  create a booking, kill the process, start a new one — the booking is there.
- **The server is the authority.** One set of domain operations (`src/domain/operations.ts`)
  enforces every rule server-side: no busy or wrong-vehicle captain, no re-assigning a
  dispatched ride, no going off duty mid-ride. The UI's suggestions can no longer be bypassed.
- **Real-browser checks (G6).** 18 visual baselines (6 screens × 360/768/1280 px) plus two
  real journeys, all in Chromium against the production build.
- **The browser found what simulated tests couldn't:** a page that scrolled sideways on every
  screen at 1024–1280 px and on phones, no way to reach Revenue on phones and tablets, and
  third-party image requests. All fixed and now guarded.

## 2 · Found and fixed this cycle

| # | Finding | Fix |
|---|---|---|
| D1 | **Horizontal overflow** — +140 px at 1280 px and +167 px at 1024 px on every screen (header too wide); +38–70 px at 360 px | Responsive header (full tabs from 1280 px, compact bar below), wrapping filter row. 6 screens × 5 widths now clean |
| D2 | **Revenue unreachable on phones and tablets** — missing from the mobile tab bar | Added; mobile labels aligned with desktop names |
| D3 | **Stock photos of real people hot-linked from Unsplash** as the fictional captains' faces — breaks offline, calls a third party on every visit | Self-contained initials avatars; no external requests |
| D4 | **"Grid Active"** pulsing status that measured nothing | Removed |
| D5 | **"Direct Payout Ready"** — no payouts exist | Replaced with "Demo data · no payouts connected" |
| D6 | **"Avg ETA: 4.2 Mins"** hard-coded; **"3 Nearby"** with no distance data | ETA removed; counts now say "free captains" |
| D7 | Switch labelled "Auto Match" on screen but "Auto-dispatch" to screen readers | One name: Auto-dispatch |
| D8 | Identical "Set Offline" buttons for every captain | Each names its captain ("Set Offline: Vikram Singh") |
| D9 | "Passsenger Booking" typo | Fixed |
| D10 | Labels that became untrue once data persisted ("resets on reload", "this session") | Updated |
| D11 | Phoned-in bookings stored a random distance and duration | No longer invented; left empty until route data exists |

## 3 · Verification actually run

| Check | Result |
|---|---|
| `npm run typecheck` | **0 errors** |
| Unit + screen tests (`npm test`) | **103/103** — was 67 |
| Browser tests (`npm run test:e2e`) | **20/20** — 18 visual baselines + 2 journeys, stable on re-run |
| Overflow sweep | 6 screens × 360/768/1024/1280/1536 px — **30/30 clean** |
| Restart survival (production server, process killed) | **booking present after restart** |
| Bare copy (`npm ci` from the saved lockfile → typecheck → all tests → browser tests incl. build) | **pass** |
| FounderOS eject check | **ejectable ✓** (44 files) |

A note on honesty about my own process: one bare-copy run first failed because my copy
command excluded *every* folder named `data`, including `src/data/`. The project was fine;
the harness was wrong, and the re-run with the corrected exclusion passed.

## 4 · Architecture now

```
Browser ── GatiApi (HttpGatiApi) ──► Express routes (server/state-routes.ts)
                                        │  validate (server/validate-booking.ts)
                                        ▼
                         domain operations (src/domain/operations.ts) ── same code ── LocalGatiApi (tests)
                                        │
                                        ▼
                         GatiStore (server/store.ts): JsonFileStore · MemoryStore
```

Routes: `GET /api/state` · `POST /api/bookings` · `POST /api/bookings/:id/assign` ·
`POST /api/dispatch/auto` · `POST /api/drivers/:id/toggle-duty` · `PUT /api/settings` ·
`POST /api/demo/reset`. Writes are rate-limited (60/min/IP), serialised and atomic; an
unreadable data file is reported and never overwritten.

## 5 · Known limits (stated plainly)

- **No authentication.** Anyone who can reach the server can change its data. Fine on your
  own machine; required before any public deployment (cycle 6 decides: basic operator login).
- **Single server process.** The JSON store assumes one process owns the file. More than one
  instance needs the Postgres implementation behind the same `GatiStore` interface.
- **Map positions of phoned-in bookings are approximate** — there's no address lookup yet.
- **Visual baselines are per operating system.** The committed ones are Linux; on Windows run
  `npm run test:e2e:install` once, then `npm run test:e2e -- --update-snapshots` to create
  yours. The Linux baselines show emoji as boxes (no emoji font there); Windows renders them.
- **Demand surges** still come from the seed data, not from bookings.

## 6 · What I did NOT verify

- **Your PC.** Run inside `projects/gati-rides`: `npm install`, `npm test` (expect 103),
  `npm run test:e2e:install`, `npm run test:e2e -- --update-snapshots`, then `npm run dev`.
- **Real Gemini** replies.
- **A screen reader** end to end.
- **Multiple operators at once** in different browsers (the server serialises writes and the
  app refreshes on focus, but no live push between tabs).

## 7 · Cycle progress

| Cycle | Status |
|---|---|
| 1 · Make it honest | ✅ |
| 2 · Make it safe | ✅ |
| 3 · Make it tested | ✅ |
| 4 · Make it right | ✅ |
| 5 · Make it durable | ✅ **this report** |
| 6 · Make it sellable | next — operator login, README/runbook, deploy config, demo script/video, handover pack |
