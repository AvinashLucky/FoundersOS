# Gati Rides — Cycle 2 report · "Make it safe"

**Run:** 2026-08-05 · Live browser on `localhost:3001` + API abuse tests + strict compiler.
**Status:** Cycle 2 complete. **2 of 5 cycles done — 40%.**

---

## 1 · Headline

Two defects were found that a manual reviewer would not have caught, and both are now fixed
and verified live:

1. **TypeScript was never checking the UI.** `@types/react` was missing from the project, so
   every component compiled as implicit `any`. Cycle 1's "zero type errors" was hollow.
2. **A dead filter was silently hiding rides.** The Pre-Bookings "Scheduled" filter compared
   a booking's *status* against `'PREBOOK'`, which is a *booking type* — a comparison that
   can never be true. Scheduled rides were being dropped from the operator's view.

Plus the cost hole is closed: input caps, body limits and rate limiting are live and proven
under abuse **before** any paid key is added.

---

## 2 · Tests executed this cycle

| ID | Case | Expected | Actual | Result |
|---|---|---|---|---|
| T17 | 5,000-char call note | 400, rejected before any AI call | `{"error":"Call note is too long (max 2000 characters)."}` 400 | **PASS** |
| T18 | `textNote` sent as a number | 400, type rejected | `{"error":"No call text provided"}` 400 | **PASS** |
| T19 | `hour: 99` | 400, range rejected | `{"error":"Hour must be a number between 0 and 23"}` 400 | **PASS** |
| T20 | Missing `location` | 400, required field | `{"error":"A location is required"}` 400 | **PASS** |
| T21 | Valid demand request | 200 + labelled fallback | 200, `source:"fallback"` + notice | **PASS** |
| T22 | 15 rapid AI calls (limit 12/min) | 12 × 200, then 429 | `200×12` then `429 429 429` + `Retry-After: 60` | **PASS** |
| T23 | Page title | Product name | "Gati Rides — AI Dispatch & Call Automation" | **PASS** |
| T24 | Strict TypeScript enabled | Real errors surface | 1,393 → **14 genuine errors** after adding React types | **PASS (measured)** |
| T25 | Pre-Bookings screen renders | Table + risk banner | 3 rides, "1 Scheduled Pre-Booking At Risk" banner | **PASS** |
| T26 | **SCHEDULED filter** | Returns scheduled rides | Before: dead comparison. After: all 3 rides incl. unassigned "Tomorrow 07:00" | **FIXED — PASS** |

**Cycle 2: 10 of 10 passing.**

---

## 3 · The two defects, in detail

### D1 · TypeScript was inspecting nothing (silent, systemic)

`package.json` listed `@types/node` and `@types/express` but **not** `@types/react`. Without
those declarations every `.tsx` file fell back to implicit `any`: props unchecked, hooks
unchecked, event handlers unchecked.

Evidence — enabling `strict` produced **1,393 errors**, the first being:

```
src/App.tsx(1,44): error TS7016: Could not find a declaration file for module 'react'.
```

After installing `@types/react` + `@types/react-dom`, the count fell to **14 real errors**.
The other 1,379 were cascade noise from the missing declarations.

The 14 remaining are genuine and worth fixing in Cycle 3 — mostly array access that can
return `undefined` and is used without a guard, e.g. `App.tsx:119` `const drv =
availableDrivers[index]` followed by `drv.id`. **That is a live crash risk** when the driver
list is shorter than expected (exactly what happens when few drivers are online).

**Fixed:** types added to `package.json`; `strict`, `noUncheckedIndexedAccess` and
`noImplicitOverride` enabled in `tsconfig.json`.

### D2 · The Scheduled filter could never match (silent, operational)

```ts
// before — always false
if (filterStatus === 'SCHEDULED') return b.status === 'PREBOOK' || b.status === 'DISPATCHED';
```

`BookingStatus` is `PENDING_ASSIGNMENT | DISPATCHED | ON_TRIP | COMPLETED | CANCELLED |
AT_RISK`. `PREBOOK` belongs to `BookingType`. The compiler flagged it the moment strict mode
was on (`TS2367: This comparison appears to be unintentional`), and no mock booking has that
status — confirming dead code.

**Consequence:** an operator filtering "Scheduled" saw only already-dispatched rides. Any
scheduled-but-unassigned booking — precisely the ones that need attention — was invisible.

**Fixed:** compare the correct field (`b.bookingType === 'PREBOOK'`). Verified live: the
filter now returns all three rides including the unassigned "Tomorrow 07:00 AM" booking.

---

## 4 · Changes in Cycle 2

| File | Change | Why |
|---|---|---|
| `server.ts` | `validateCallNote` — type + 3…2000 char bounds | Cost + abuse |
| `server.ts` | `validateDemandQuery` — location ≤120, hour 0–23 | Cost + abuse |
| `server.ts` | `express.json({ limit: "64kb" })` | Reject megabytes at the door |
| `server.ts` | Fixed-window rate limit, 12/min per IP, on all `/api/ai` | Bill protection |
| `server.ts` | `err: any` → `err: unknown`; provider internals no longer returned to client | Type safety + leak prevention |
| `tsconfig.json` | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` | Real checking |
| `package.json` | Added `@types/react`, `@types/react-dom` | The root cause of D1 |
| `index.html` | Real title + description + theme colour | Branding, SEO, share previews |
| `PreBookingsPlanner.tsx` | Scheduled filter compares `bookingType` | D2 |

**No new runtime dependency was added.** Two routes do not justify a schema library; the
validators are 30 lines and fully typed.

---

## 5 · Cycle progress

| Cycle | Status |
|---|---|
| 1 · Make it honest | ✅ complete — no output can mislead an operator |
| 2 · Make it safe | ✅ complete — validated, rate-limited, strictly typed |
| 3 · Make it tested | ⏭ next — 14 strict errors + first automated suite |
| 4 · Make it beautiful | pending — 12 unnamed controls, visual baselines |
| 5 · Make it sellable | pending — README, deploy, demo, handover |

**40% complete** against the estimator's 5-cycle plan.

---

## 6 · What I did NOT verify

- **The 14 strict errors are catalogued but not yet fixed** — they compile-fail today. Cycle 3.
- **Three screens still unopened**: Captains & Fleet, Revenue, Captain Mobile App, Passenger
  Booking. Only Live Dispatch and Pre-Bookings have been exercised.
- **Saving a booking** — "Save Call & Auto-Queue" is still never clicked.
- **Real Gemini** — no key; only fallback paths tested. Prompt quality and per-call cost unknown.
- **Rate limiting is per-instance memory** — correct for one server, needs Redis if scaled.
- **Mobile / responsive** — tested at 1920×842 only.

---

## 7 · Recommended Cycle 3

1. Fix the 14 strict errors, starting with the `undefined` array access in `App.tsx:119`
   (crash risk when few drivers are online)
2. First automated suite: the 10 API behaviours already proven by hand become regression tests
3. Open the remaining screens and log findings
4. Click "Save Call & Auto-Queue" and verify the booking reaches the dispatch queue
