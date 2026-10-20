# Gati Rides — Cycle 6 report · "Make it sellable"

**Run:** 2026-10-11 · Linux sandbox with a real Chromium, then a bare-copy reinstall.
**Status:** cycle 6 complete — **6 of 6 cycles done. Gati Rides v1 is ready to deploy and list.**

---

## 1 · What shipped

| Area | Delivered |
|---|---|
| **Operator login** | Password sign-in; HMAC-signed session cookie (HttpOnly, SameSite=Strict, Secure on HTTPS); 12 h sessions; lockout after 5 *failed* attempts; every `/api` route protected except health and sign-in; cross-site changes refused; sign-in screen, sign-out, expired-session handling |
| **Secure by default** | In production the server refuses to start without a strong password and session secret |
| **Production mode can't be skipped** | The built server is fixed to production at build time, so `npm start` is production on every OS — and login can't be bypassed by a missing variable |
| **README / runbook** | Replaces the AI Studio boilerplate: features, quick start, settings, scripts, architecture, API, deploying, backups, security, limits |
| **Deploy** | `Dockerfile` (+ volume for data, health check), `.dockerignore`, hosting options with current prices |
| **CI** | GitHub Actions: typecheck → tests → real-browser tests on every push; manual "Update visual baselines" workflow |
| **Sales** | `details/release/DEMO_SCRIPT.md` (3-minute demo), `details/release/LISTINGS.md` (Contra, Gumroad, Fiverr drafts) |

## 2 · Bugs found this cycle

| # | Bug | Fix + proof |
|---|---|---|
| E1 | **`npm start` didn't run in production mode** (it only set NODE_ENV in Docker) — it would start Vite's dev server *and skip the login requirement* | Build-time production flag; checked: with NODE_ENV unset, the build refuses to start without a password, enforces login (401 → 200), and serves the built page |
| E2 | My first login rate limit counted *successful* sign-ins — an operator signing in and out a few times would be locked out | Counts only failures; a success clears them. Regression test: 8 successful sign-ins in a row all pass |
| E3 | `dotenv` printed an advertising line in production logs | Silenced |
| E4 | The Dockerfile's `VOLUME` line is rejected by Railway, and Railway volumes are root-owned | Line removed; runbook says to set `RAILWAY_RUN_UID=0` if saving fails (from many Railway deployment fixes, not Railway's official docs — confirm when deploying) |

## 3 · Verification actually run

| Check | Result |
|---|---|
| Typecheck | **0 errors** |
| Unit, API and screen tests | **122/122** (was 103) |
| Real-browser tests | **22/22** — 18 visual baselines + 4 journeys (booking survives reload, keyboard, wrong password refused, sign-in/sign-out) — stable on re-run |
| Production with *only* production packages (the Docker runtime) | refuses without secrets; with them: health ok, 401 before login, 200 after, page served |
| Bare copy (`npm ci` → typecheck → all tests → browser tests incl. build) | **pass** |
| FounderOS eject check | **ejectable ✓** (50 files) |

## 4 · What I did NOT verify

- **Docker itself** — no Docker in this sandbox. Everything the image does (production-only
  install, build output, start command) was run without Docker; `docker build` was not.
- **GitHub Actions** — the workflows haven't run yet (no repo exists). The visual baselines
  were made on Ubuntu 22.04 in a sandbox; GitHub's runner may render fonts differently. If CI
  reports screenshot differences on the first run, use the "Update visual baselines" workflow.
- **Hosting** — not deployed anywhere yet. Prices in the README are from current published
  sources; check them before buying.
- **Your PC**, real Gemini replies, a screen reader, and two operators at once.

## 5 · Limits to state to buyers

One shared operator login (no individual accounts or roles) · one server process owns the
data file (several instances need the Postgres store) · approximate map positions for phoned-in
bookings · demand radar uses demo data · WhatsApp tickets and broadcasts not connected ·
**no licence chosen yet** — pick one before selling the source code.

## 6 · All cycles

| Cycle | Theme | Status |
|---|---|---|
| 1 | Make it honest | ✅ |
| 2 | Make it safe | ✅ |
| 3 | Make it tested | ✅ |
| 4 | Make it right | ✅ |
| 5 | Make it durable | ✅ |
| 6 | Make it sellable | ✅ **this report** |

**What remains is on your side:** install and run it on your PC, push to GitHub, deploy,
record the demo, post the listings, show it to a real operator. See `docs/YOUR-NEXT-STEPS.md`.
