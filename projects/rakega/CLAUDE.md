# CLAUDE.md — RaKeGa

**RaKeGa** · product 11 · Web app + API (+ live rooms, video, payments)
Teach live, sell recorded AI courses, and deliver agency work through vetted developers, all on one platform.

This file is binding for all work inside `projects/rakega/`. Read it fully, then
`details/brief.md`, before your first edit in a session.

---

## 1 · Scope of this file

- This project is **standalone**. It lives inside the FounderOS repo folder for convenience
  only. If FounderOS's `CLAUDE.md` is also loaded, **this file wins for everything in this
  folder**: FounderOS's Next.js, MongoDB, `ModelRouter` and Echo rules do not apply here.
- Never import, require, or read code from outside this folder (`../../apps`,
  `@founderos/*`, sibling projects). Copy an idea if you need it; never link it.

## 2 · The three eject invariants (no lock-in — non-negotiable)

1. **No outside code.** Every dependency is in this project's own `package.json` files with
   real versions — never `workspace:`, never `file:` paths leaving the folder.
2. **No outside environment.** Only variables documented in `.env.example`. Nothing
   prefixed `FOUNDEROS_`.
3. **Runs from a bare copy.** `cp -r projects/rakega ~/anywhere`, then `npm install` +
   `npm run dev` in `backend/` and `frontend/` must work with FounderOS deleted.

## 3 · Layout and stack

```
rakega/
├── project.json      manifest FounderOS reads (keep delivery.status current)
├── frontend/         React web app (learner, teacher, client, developer, admin)
├── backend/          API + database + workers + webhooks
├── details/          brief.md · decisions.md · every planning/research/release document
├── .env.example      every variable either app reads, documented
└── README.md         how to run it standalone
```

- `frontend/` — React + TypeScript + Vite, Tailwind CSS, Framer Motion, TanStack Query. Port **5111**.
  Public course pages must be indexable: prerender them at build time (decide the tool in
  `details/ARCHITECTURE.md`); the logged-in app stays a SPA.
- `backend/` — Node.js + TypeScript + Express, zod on every input, Prisma + PostgreSQL, a
  Postgres-backed job table + worker for durable background work (video processing,
  recordings, emails). Port **4111**.
- **One application, four modules.** `frontend/src/modules/{live,learn,works,reach}` and the
  same in `backend/src/modules/`. Modules share auth, payments and the database, and talk
  through each module's exported service, never through each other's tables.
- **Provider seams, one interface each, swappable without touching features. Free first:**
  - `LiveRoomProvider`: LiveKit dev server (local) → LiveKit Cloud Build → self-hosted
    LiveKit; plus a YouTube-embed audience mode for free workshops.
  - `VideoHost`: local ffmpeg HLS → Cloudflare R2 → Bunny Stream.
  - `PaymentProvider`: Razorpay, test mode until launch.
  - `Notifier`: Telegram bot; WhatsApp later.
  - `Mailer`: SMTP; drafts only in development.
  - `ModelProvider`: see §5.

  Each seam has a simulated implementation for tests and offline demos, labelled
  "simulated" wherever it shows.
- **$0 until launch.** No paid service is required to run or test any module
  (`details/brief.md` §11). A paid provider is an option behind a seam, never a dependency.
- Pin versions you installed; commit lockfiles; record licences in `details/dependency-register.md`.

## 4 · Work order

Cycles, one theme each (`details/brief.md` §7). Founder review after every 3 cycles.
Every cycle ends with: typecheck clean, tests green, screens rendered and looked at,
`details/BUILD_STATUS.md` updated, `details/decisions.md` updated.

## 5 · Models and keys (free-first)

- One backend-only `ModelProvider`. Order: **Gemini** (`GEMINI_API_KEY`) → OpenAI-compatible
  free tiers (Groq, OpenRouter `:free`) → **Simulator** when no key is set.
- **Register only providers whose key exists.** Keys live in `backend/.env` only.
- Model output is untrusted: zod-validate, clamp, whitelist. Money, access to paid content,
  permissions, payouts and email sending decisions are **deterministic code**, never a model.
- Every AI call records model, tokens, cost and latency; `AI_BUDGET_USD_PER_RUN` caps a run.
- Tests mock `fetch`. Tests never touch the network.

## 6 · Engineering standards

- TypeScript strict, `noUncheckedIndexedAccess`; no `any`, no `@ts-ignore`.
- **Never leave a TODO, placeholder, stub, or dead branch.** Unfinished work goes in
  `BUILD_STATUS.md`.
- Roles enforced server-side: `learner`, `teacher`, `client`, `developer`, `reviewer`,
  `admin`. The review agent prepares delivery records; only a human `reviewer` approves. A learner can never reach a paid lesson they haven't bought — that is a test.
- Payments: trust **only** the verified Razorpay webhook signature, never the browser's
  "success" redirect. Idempotency key on every payment, enrolment and payout event.
- Video: playback URLs are signed and short-lived; raw storage URLs never reach the client.
- Live rooms: join tokens are minted server-side per user, per room, with an expiry and a
  role (speaker / audience). Seat limits enforced server-side.
- Every bug fix ships with the regression test that would have caught it.
- Files past ~300 lines get split by responsibility. Comments explain *why*.

## 7 · Design

- Use the `design-director` skill: `--industry education --context app` for the
  logged-in app, `--context site` for the public pages. Choose one direction; build only
  from its tokens in `design/`; keep `design/.history.json`.
- Every contrast check in `design/DESIGN.md` must pass before UI work starts.
- Every screen designs: loading · empty · success · error · permission-denied ·
  disconnected · timeout. An unstyled state is a defect. Live rooms also design:
  reconnecting · audio-only fallback · "class is full".
- WCAG AA, keyboard-complete, visible focus, `aria-live` on chat and status, captions on
  every recorded lesson. Mobile-first: most learners will watch on phones.

## 8 · Honesty rules

- Never invent learner counts, ratings, testimonials, placement claims, salaries or
  "certified by" badges. Show real numbers or nothing.
- No fake urgency: no countdown timers that reset, no "only 3 seats left" unless it is true.
- A free or low-price class teaches in full. Any paid offer gets at most 10 minutes, at the end.
- Test content follows `details/brief.md` §12. Every seed item has its licence recorded,
  and publishing a paid course containing a non-commercial ("NC") item is blocked in code,
  with a test. Never download or reuse videos or courses from other platforms.
- Synthetic data only in demos, labelled synthetic.
- Outreach (Reach agent) follows `details/brief.md` §6 exactly — a human approves sends,
  every email has an opt-out, and the suppression list is permanent.
- Never name or compare against other companies in product copy.

## 9 · Definition of done (per cycle)

Typecheck 0 errors · all tests green (with new tests for new logic) · every new screen
rendered at 390 px and 1280 px and looked at · five states designed · no secret in code or
logs · docs updated in the same change · "what I did not verify" written down plainly.
