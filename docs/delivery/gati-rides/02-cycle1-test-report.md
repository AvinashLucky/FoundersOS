# Gati Rides — Cycle 1 test report

**Run:** 2026-08-05, live in Chrome against `http://localhost:3001` on the founder's Windows
machine, driven by the FounderOS agent. **Method:** real browser, real clicks, real typing,
DOM + console + accessibility-tree inspection. No mocks, no simulation.

---

## 1 · Cycle model (agreed)

| Cycle | Purpose | Exit gate |
|---|---|---|
| **1 — Make it honest** | Blockers + truthfulness of AI output | app runs in monorepo; no output can mislead an operator |
| 2 — Make it safe | Validation, rate limits, strict TS | cost hole closed; `strict: true` compiles |
| 3 — Make it tested | Vitest + Playwright suites | core journey green in CI |
| 4 — Make it beautiful | Token conformance, visual diffs, a11y AA | zero unnamed controls; baselines locked |
| 5 — Make it sellable | README, deploy, demo video, price | a stranger can run it from the repo |

Tier → cycles: **mid = 1–3 · high = 1–4 · premium = 1–5.**
Gati Rides is scoped **high** (client-facing dispatch tool). This report closes **Cycle 1**.

---

## 2 · Test cases executed

| ID | Case | Steps | Expected | Actual | Result |
|---|---|---|---|---|---|
| T1 | App boots | Navigate to :3001 | Dispatch UI renders | Full command centre rendered, all widgets populated | **PASS** |
| T2 | Console clean on load | Read console | No errors | 0 errors, 0 warnings (19 messages, all Vite/React info) | **PASS** |
| T3 | Live metrics render | Inspect header cards | 4 KPI cards with values | 84 bookings · 5 pending · 7 captains · ₹41,995 | **PASS** |
| T4 | Dispatch feed renders | Inspect right panel | Booking cards with actions | 3+ cards, "Assign Captain (5 Nearby)" present | **PASS** |
| T5 | Map renders | Inspect map area | Vehicles, zones, surge labels | 8 vehicles, surge zones, heatmap/routes toggles | **PASS** |
| T6 | Call-intake modal opens | Click "+ Call Intake & AI Parse" | Modal opens | Opened with all fields + frequent-caller chips | **PASS** |
| T7 | **AI parse — provenance** | Type real call note → Auto-Parse | Fields filled **and** the source disclosed | *Before fix:* placeholder data shown as if parsed — **FAIL** → *After fix:* amber banner "Placeholder details — not parsed from this call" | **FIXED — PASS** |
| T8 | Vehicle inference | Note says "GatiXL" | Category = GatiXL | GatiXL (6-Seater SUV) selected | **PASS** |
| T9 | Degraded driver state | Request GatiXL with none idle | Honest empty state | "0 Available Cabs Nearby" + "No immediate GatiXL drivers idle right now. Will enter 'Pending Queue'" | **PASS** |
| T10 | API health | GET /api/health | 200 + status | `{"status":"ok","service":"Gati Rides Automation Core"}` | **PASS** |
| T11 | API empty body | POST /parse-call `{}` | 400 + message | `{"error":"No call text provided"}` | **PASS** |
| T12 | Port isolation | Start beside FounderOS | No collision | Runs on 3001; FounderOS keeps 3000 | **PASS** |
| T13 | Typecheck | `tsc --noEmit` | exit 0 | exit 0 | **PASS** |
| T14 | Production build | `vite build` | Succeeds | 1683 modules · JS 306 kB (85 kB gz) · CSS 60 kB (9 kB gz) | **PASS** |
| T15 | Accessible names | Read a11y tree | Every control named | **11 buttons + 1 checkbox unnamed** | **FAIL — cycle 4** |
| T16 | Page title | Read tab title | Product name | "My Google AI Studio App" | **FAIL — open** |

**Cycle 1 score: 14 of 16 passing.** Both failures are catalogued, neither is a blocker.

---

## 3 · The critical bug (T7) — worth its own section

**What happened.** I typed a genuine call note:

> "Ramesh calling from **Koramangala 5th block**, needs GatiXL to Kempegowda Airport T1
> tomorrow 5am, phone **9845012345**"

The form auto-filled:

| Field | Shown | Truth |
|---|---|---|
| Passenger | Caller Client | Ramesh |
| Phone | +91 98765 43210 | 9845012345 |
| Pickup | **Brigade Road, Bengaluru** | **Koramangala 5th block** |
| Fare | ₹1450 | unknown |

Those are the server's placeholder constants, presented as a successful parse.

**Why it mattered.** A dispatcher acting on this sends a cab **9 km to the wrong address**
and calls a stranger. The ride fails, the customer is lost, and nobody knows why — because
the screen said the AI had read the call. This is precisely the failure the doctrine names:
*silence must never masquerade as an answer.*

**Root cause.** Two layers, both at fault.
1. `server.ts` returned placeholders with no provenance field (`predict-demand` had none at all).
2. `QuickCallModal.tsx:86-100` applied `data.*` to the form and ignored everything else;
   the `catch` only did `console.error`, so a failure looked like a success.

**Fix applied (4 files, verified live).**
- Server: both AI routes now return `source: "model" | "fallback"` plus a human `notice`;
  a malformed model reply falls back instead of throwing a 500.
- Client: new `parseSource` / `parseNotice` / `parseError` state; an **amber banner** when
  the fill is a placeholder, a **green banner** when the AI genuinely parsed, and a **red
  alert** on failure. All three carry `role="alert"`/`role="status"` for screen readers.

**Evidence.** Re-ran the identical note in the same browser: the amber banner appeared —
*"Placeholder details — not parsed from this call. Placeholder booking — set GEMINI_API_KEY
for real call parsing."* Typecheck exit 0; HMR applied with zero console errors.

---

## 4 · Cycle 1 changes

| File | Change | Finding |
|---|---|---|
| `server.ts` | PORT → `process.env.PORT \|\| 3001` | F1 |
| `package.json` | `react-example` → `gati-rides`, v0.1.0, description | F2 |
| `server.ts` | Both AI routes label `source` + `notice` | F4 |
| `server.ts` | Guarded `JSON.parse`; malformed reply → fallback, never 500 | F5 |
| `QuickCallModal.tsx` | Provenance banners + real error state | F4 (client half) |

---

## 5 · What I did NOT verify

- **Five of nine screens.** Pre-Bookings & Radar, Captains & Fleet, Revenue, Captain Mobile
  App and Passenger Booking were never opened. Only Live Dispatch was exercised.
- **Real Gemini.** No key present — every AI path tested was the fallback. Prompt quality,
  JSON reliability and per-call cost remain unknown.
- **Saving a booking.** I never clicked "Save Call & Auto-Queue", so persistence and the
  dispatch-queue write are untested.
- **Responsive / mobile.** Tested at 1920×840 only.
- **Contrast ratios.** Noted visually as good; not measured.
- **`InteractiveMap` internals** — 474 lines still unread.

These are Cycle 2 and 3 scope, and they are written down rather than assumed.

---

## 6 · Recommended Cycle 2

1. Zod validation + 2000-char cap + per-IP rate limit on both AI routes (**closes the cost
   hole before a key is added — do this before the key, not after**)
2. `strict: true` in tsconfig and fix the resulting errors
3. Exercise the remaining five screens, same method, log findings
4. Page title + the 12 unnamed controls (small, visible, cheap)
5. First Vitest tests: the four API behaviours already proven by hand
