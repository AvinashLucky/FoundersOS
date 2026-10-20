# Pending works & API cost — status as of 2026-08-05

Single source of truth for what is unfinished. Verified against the repo, not from memory.

---

## PART 1 — API COST

### What has been spent so far: **$0.00**

Nothing has ever called a paid API. Every AI response you have seen in FounderOS and Gati
Rides came from the offline Echo provider or a labelled fallback. Verified: no key exists in
`apps/web/.env.local` (file absent) and `apps/gati-rides/.env.local` (absent).

### What it will cost once your keys land: **still $0, by design**

| Service | Tier you'll use | Cost | Limit to watch |
|---|---|---|---|
| **Google Gemini** (AI Studio key) | Free tier | **$0** | Per-minute + daily request caps |
| **Groq** | Free tier | **$0** | Per-minute token cap |
| **OpenRouter** (`:free` models) | Free tier | **$0** | Daily request cap |
| **Tavily** (research) | Free tier | **$0** | 1,000 searches/month |
| Anthropic / OpenAI | Paid — **not configured, not needed** | — | — |

**Why it stays at zero.** Every provider above has a genuine free tier for the volumes a
solo founder generates. The router is built to prefer them: all free models are registered at
`costPer1k: 0`, so the cheapest-capable sort picks them ahead of any paid tier automatically.

### Rough token volume (so you can sanity-check the free limits)

| Action | Approx. tokens | Notes |
|---|---|---|
| One Gati Rides call-parse | ~500 | short prompt in, small JSON out |
| One FounderOS company run | ~4,000–8,000 | 2–4 departments + debate + CEO |
| One research brief | ~3,000–6,000 | plus 3 Tavily searches |

Even 100 company runs a day sits inside Gemini/Groq free daily allowances. *Verify current
free-tier limits at the provider's own pricing page — these change and I will not invent
precise figures.*

### The three guards that keep a bill from appearing

1. **`RUN_BUDGET_USD=0.05`** — FounderOS degrades the model tier rather than exceed it.
2. **Rate limits** — FounderOS: 4–6 AI calls/min per workspace. Gati Rides: 12/min per IP
   (proven live: 12 × 200 then 429).
3. **Input caps** — Gati Rides rejects notes over 2,000 chars and bodies over 64 kb before
   a single token is spent.

**Only real risk:** adding a *paid* Anthropic or OpenAI key and removing the budget cap.
Don't do that until something is earning.

---

## PART 2 — PENDING WORKS

### 🔴 BLOCKER — I left this broken, fix first (2 minutes)

> **Updated 2026-10-10.** Gati Rides moved to `projects/gati-rides` (its own install, outside
> FounderOS's workspaces). Cycle 3 is done — see `gati-rides/04-cycle3-test-report.md`.

**Run this once on your PC — Gati's own install is incomplete** (16 packages it used to
borrow from FounderOS's root install; FounderOS now flags this on its card):

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS\projects\gati-rides"
npm install
npm run typecheck   # expect: no output = 0 errors
npm test            # expect: 122 passed
npm run test:e2e:install                  # once: downloads the test browser
npm run test:e2e -- --update-snapshots    # first run creates your Windows baselines
npm run dev         # http://localhost:3001 — data is saved to data/gati-store.json
```

Then run `npm install` once at the FounderOS root too, so its lockfile drops the old
`apps/gati-rides` entries. **Order matters:** Gati first, then root.

---

### Gati Rides — all 6 cycles done (2026-10-11) · your steps: `docs/YOUR-NEXT-STEPS.md`

| # | Work | Cycle | Why it matters |
|---|---|---|---|
| ~~G1–G4~~ | ✅ Strict errors 13→0 · 28 tests · every screen renders · save-call reaches dispatch · 2 state bugs fixed | 3 | Done 2026-10-10 |
| ~~F1–F9, G5~~ | ✅ Invented figures removed · one dispatch rule · validated AI output · 0 unnamed controls (was 16) · fake broadcast/WhatsApp made honest · 8 more bugs fixed · 67 tests | 4 | Done 2026-10-10 — `gati-rides/05-cycle4-report.md` |
| — | **Your call:** confirm the free-upgrade rule (GatiGo → Prime/XL, Prime → XL, bikes/autos own type only) | — | One map in `src/lib/dispatch.ts` |
| ~~G6, G7~~ | ✅ Server-side persistence (survives restart) · server enforces every dispatch rule · 18 visual baselines + 2 browser journeys · overflow fixed on all screens/widths · Revenue reachable on mobile · third-party photos and fake statuses removed · 103 + 20 tests | 5 | Done 2026-10-10 — `gati-rides/06-cycle5-report.md` |
| ~~G8~~ | ✅ Operator login (secure by default) · README/runbook · Dockerfile · CI workflows · demo script · listing drafts · 122 + 22 tests | 6 | Done 2026-10-11 — `gati-rides/07-cycle6-report.md` |
| — | **Your side:** install + test on your PC, `.env`, GitHub repos, deploy, record demo, choose a licence, post listings | — | `docs/YOUR-NEXT-STEPS.md` |

### FounderOS — 18% remaining

| # | Work | Why |
|---|---|---|
| F1 | **Run it once with real keys** | 92 tests pass but zero real AI runs — effectiveness unproven |
| F2 | P2 · Deploy + magic-link auth (Vercel + Atlas) | No live URL to show anyone |
| F3 | P3 · Design System v2 (Mission Control tokens app-wide) | Consistency + the premium bar |
| F4 | P4 · Reskin + export → Gumroad-ready zip | The step that turns work into product income |
| F5 | T2 · "Research this idea" button on Idea cards | Small, finishes the research loop |

### Not started (deliberately deferred)

Role Personas · Stack Advisor · n8n export bridge · Interview Command · Agent Studio ·
knowledge graph · billing. All blueprinted in `FounderOS-Future-Flagship-Plan.md`.

---

## PART 3 — RECOMMENDED ORDER

1. `npm install` in gati-rides — unblocks lint (2 min)
2. Add your keys to both `.env.local` files (5 min)
3. **Run FounderOS once** — prove or disprove the debate (10 min) ← *the highest-information action available*
4. Re-run the Gati call-parse — amber banner should turn green (2 min)
5. Then cycle 3: G1 → G2 → G3 → G4

Steps 1–4 take under 20 minutes and convert three "unknowns" into facts.
