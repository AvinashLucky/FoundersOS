# Gati Rides — Stage 1 Inventory + Stage 2 Audit

**Run:** 2026-08-05 · **Method:** static read + real install, typecheck, build and live
server run in a Linux sandbox copy. Every claim below has command output behind it.
**No files were modified.**

---

## 1 · What this project is

**Gati Rides** — "super-premium ride automation, dispatch command center, and pre-booking
manager for cab fleets & Captains" (from `metadata.json`). Built in Google AI Studio.

| Aspect | Finding |
|---|---|
| Stack | React **19.0.1** · Vite **6** · Tailwind **4** · Express 4 · `@google/genai` 2.4 · motion 12 · lucide-react |
| Shape | SPA served by a custom Express server (`server.ts`) with Vite in middleware mode |
| Size | **3,797 LOC** across 24 files — substantial, not a toy |
| Entry | `server.ts` → Express :3000 → Vite middleware → `index.html` → `src/main.tsx` → `App.tsx` |
| Data | `src/data/mockData.ts` (361 lines) — all data is mock; no database |
| AI | 2 server-side routes calling `gemini-2.5-flash` |

### Components (9)

| File | LOC | Role |
|---|---|---|
| `QuickCallModal.tsx` | 489 | Phone-call → AI-parsed booking (the flagship feature) |
| `InteractiveMap.tsx` | 474 | Live map / vehicle positions |
| `PreBookingsPlanner.tsx` | 425 | Scheduled ride management |
| `DispatchCommandCenter.tsx` | 349 | Operator dispatch console |
| `DriverCaptainApp.tsx` | 297 | Driver-side view |
| `Navbar.tsx` | 253 | Shell navigation |
| `PassengerApp.tsx` | 251 | Rider-side view |
| `DriverFleetManager.tsx` | 228 | Fleet admin |
| `RevenueAnalytics.tsx` | 118 | Financial dashboard |

**Read:** four distinct personas already exist (passenger · driver · dispatcher · fleet
owner). That is ambitious for an MVP and is the first thing to challenge (§4).

### API surface (`server.ts`, 163 LOC)

| Route | Method | Behaviour |
|---|---|---|
| `/api/health` | GET | Static status |
| `/api/ai/parse-call` | POST | Call note → structured booking JSON via Gemini |
| `/api/ai/predict-demand` | POST | Location + hour → surge/demand recommendation |

---

## 2 · Verification actually performed

```
npm install          → 214 packages added, exit 0   (after one transient registry retry)
npx tsc --noEmit     → exit 0, ZERO type errors
npx vite build       → exit 0 · 1683 modules · JS 306 kB (85 kB gzip) · CSS 60 kB (9 kB gzip)
npx tsx server.ts    → "Gati Rides Server running on http://localhost:3000"
```

Live endpoint results:

| Call | Result |
|---|---|
| `GET /api/health` | `{"status":"ok","service":"Gati Rides Automation Core"}` |
| `POST /api/ai/parse-call` (real text, no key) | Returned full booking object, `parsedByAI:false` ✅ |
| `POST /api/ai/parse-call` `{}` | `{"error":"No call text provided"}` — 400 handled ✅ |
| `POST /api/ai/predict-demand` | Returned demand object — **no degraded flag** ⚠️ |
| `GET /` | Valid HTML shell, Vite client injected ✅ |

**Headline: the project is healthier than expected.** It compiles clean, builds clean, runs,
and every route responds. This is not a broken half-project — it is a working prototype
that needs hardening, not rescue.

---

## 3 · Findings

Severity: **BLOCKER** (stops monorepo work) · **BUG** (wrong behaviour) · **GAP** (missing
required practice) · **RISK** (will hurt later) · **POLISH**.

| # | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| F1 | BLOCKER | **Port 3000 collides with FounderOS web.** Both hard-code 3000; they can never run together. | `server.ts:11` `const PORT = 3000` | `const PORT = Number(process.env.PORT) \|\| 3001` |
| F2 | BLOCKER | **Package is named `react-example`.** Generic name in a workspace; breaks `--workspace <name>` targeting and reads unprofessional. | `package.json:2` | Rename to `gati-rides` |
| F3 | RISK | **React 19 vs FounderOS React 18.3.1**, and **Tailwind 4 vs 3**. npm will nest a second React under `apps/gati-rides/node_modules` — the single-node_modules ideal breaks for this app. | version diff | Accept the nest (npm handles it correctly) **or** align to React 19 monorepo-wide later. Do **not** force-flatten — that causes the duplicate-React hook crash. |
| F4 | BUG | **`predict-demand` fallback is not labelled degraded.** `parse-call` honestly returns `parsedByAI:false`; `predict-demand` returns invented numbers with no flag — a user cannot tell AI output from placeholder. Violates "label degraded output honestly". | live response above | Add `"source":"fallback"` (and `"source":"model"` on the real path) |
| F5 | BUG | **Malformed model JSON → 500 instead of fallback.** If Gemini returns unparseable text, `JSON.parse` throws into the outer catch and the user gets an error, even though a safe fallback exists two lines below. | `server.ts` both routes | Wrap `JSON.parse` in its own try/catch → fall through to the fallback |
| F6 | GAP | **No input validation and no rate limiting.** `textNote` is unbounded — a 2 MB body goes straight into a paid prompt. Free today (no key) but a real cost/abuse hole the moment a key lands. | `server.ts:30-34` | Zod schema + length cap (≤2000 chars) + per-IP rate limit |
| F7 | GAP | **TypeScript is not strict.** `strict`, `noUncheckedIndexedAccess` absent — the zero-error typecheck is therefore weaker than it looks. | `tsconfig.json` | Enable `strict`; expect and fix a wave of real errors |
| F8 | GAP | **`err: any` twice** — violates the no-`any` standard. | `server.ts` catch blocks | `err: unknown` + narrow |
| F9 | GAP | **Zero tests.** No test file, no runner, no script. | `find` | Vitest + the first 5 tests (see §5) |
| F10 | RISK | **All data is mock.** `mockData.ts` (361 lines) is the only source of truth; nothing persists. A demo survives this; a client does not. | `src/data/mockData.ts` | Repository seam now, storage later — same pattern as FounderOS |
| F11 | POLISH | **AI Studio leftovers**: README is Google's template, `metadata.json` is AI-Studio-only, `assets/.aistudio/` is dead. | files | Replace README, keep metadata only if redeploying to AI Studio |
| F12 | POLISH | `.env.example` documents AI-Studio secret injection that no longer applies locally. | `.env.example` | Rewrite for local + Vercel |

### What is already right (do not "fix" these)

- **The Gemini key never reaches the browser.** All AI calls are server-side. This is the
  single most important security decision in the app and it was made correctly.
- **Graceful degradation exists by design** — no key still returns a usable object. That
  instinct matches FounderOS doctrine exactly; F4 only asks for honest labelling.
- **Clean paste** — no `node_modules`, no lockfile, no committed `.env`. Nothing to clean.
- **It builds at 85 kB gzipped JS** for nine substantial screens. That is respectable.

---

## 4 · The strategic question (my honest read)

Four personas — passenger, driver, dispatcher, fleet owner — is **four products**. For a
sellable v1 I would ship **one**: the **Dispatch Command Center + QuickCall AI booking**.

Reasoning: `QuickCallModal` (489 LOC) is the only feature here that a competitor cannot
trivially copy and that saves a fleet owner real money — a phone call becomes a structured
booking without a human typing it. Passenger and driver apps are commodity; every ride
platform has them and yours cannot win on them without a real backend, payments, and live
GPS.

**Recommendation:** position Gati Rides as *"AI dispatch for cab fleets — your phone calls
become bookings automatically."* Keep the other three screens as a demo of the roadmap,
but harden and sell the dispatch loop. That is a $400–900 delivery today; four half-products
are worth $0.

---

## 5 · Fix order (my proposed cycle 1)

1. **F1 + F2** — port + name (5 min, unblocks the monorepo)
2. **F4 + F5** — honest degraded labelling + never-500-on-bad-JSON (30 min, doctrine)
3. **F6** — zod validation + input caps + rate limit (1 h, closes the cost hole)
4. **F7 + F8** — strict TypeScript and the errors it exposes (2 h, the real quality gate)
5. **F9** — Vitest + first tests: health, parse-call fallback shape, empty-body 400,
   malformed-JSON fallback, validation rejection (1 h)
6. **F11 + F12** — README, env, remove dead AI Studio files (30 min)

Cycle 1 target: **the app runs inside the monorepo, degrades honestly, validates input,
compiles strict, and has a green test suite.** No new features.

---

## 6 · What I did NOT verify

- **The UI.** I never rendered a single screen. All nine components are unexercised — no
  browser, no screenshots, no visual check. Everything above is compile-time and API-level.
- **Gemini's real behaviour.** No key was used; only fallback paths ran. The actual prompt
  quality, JSON reliability and cost per call are unknown.
- **Windows.** All runs were Linux. Nothing here proves it starts on your machine.
- **`InteractiveMap`** — 474 lines unread in detail; may hold hard-coded coordinates or a
  map key I have not seen.
- **Accessibility, responsiveness, performance under load** — untouched.

These gaps are why the next stage needs a browser, not another read.
