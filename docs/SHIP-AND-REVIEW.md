# Ship to GitHub + Vercel, then have Argon review it

## 1 · Before the first push (once)

1. **Rotate the keys** that were in `.env.example` (OpenRouter first, then Groq,
   Mistral, GLM, Tavily, Gemini). Put the new ones in `apps/web/.env.local` only.
2. Check that nothing secret is staged. Run both:
   ```powershell
   cd "...\FoundersOS"
   git init
   git add .
   git status
   ```
   `.env.local` must NOT be in the list.
3. Run `npm run secrets:check` (must say ✓) and `npm test`. The secret scan and the
   env-template test fail if a key is ever typed into a file that gets committed.

## 2 · GitHub

1. Create a private repo named `founderos` on github.com (no README).
2. Push:
   ```powershell
   git commit -m "FounderOS: failover router, Gati redesign, RaKeGa plan"
   git branch -M main
   git remote add origin https://github.com/<you>/founderos.git
   git push -u origin main
   ```
3. Gati Rides has its own repo (it is git-ignored here): run the same steps inside
   `projects\gati-rides`.

## 3 · Vercel (FounderOS web app only)

1. vercel.com → Add New → Project → import `founderos`.
2. Set **Root Directory** to `apps/web`. The framework (Next.js) is auto-detected.
3. Environment Variables: paste each line from `.env.local`. Use a new `AUTH_SECRET`
   for production.
4. Deploy.

**What works on Vercel:** sign-in, runs, debates, blueprints, research, and
failover across your keys.

**What does not:**
- Data resets without `MONGODB_URI`. Use a free MongoDB Atlas cluster to keep it.
- The *Built projects* scanner and the crawler need your PC's file system and a
  real browser. They stay local.
- Gati Rides is an Express server with a data file, so deploy it on Railway or
  Render (see its README), not Vercel.

## 4 · Argon (CEO) review

In the Gemini app, choose Argon, attach the GitHub repo (or upload a zip), and paste:

> You are the CEO and principal reviewer of FounderOS, a company-in-a-box: research →
> debate → build → prove → sell. Read `CLAUDE.md` (the law of this repo) and `docs/blueprints/FounderOS-Master-Plan.md` (the plan, incl. its §12 questions).
> Review in this order and be blunt:
> 1. Security: auth, CSRF, rate limits, workspace scoping, secrets.
> 2. Backend correctness: `apps/web/src/server/**`.
> 3. AI routing and failover: `server/ai/router.ts`, `keys.ts`.
> 4. UI/UX: every screen's loading/empty/error/success/degraded states.
> 5. What is promised in `docs/PROGRESS.md` but not in the code.
>
> For each finding give: file, line, severity (critical/high/medium/low), why it
> matters, and the smallest fix. Do not praise. End with the 5 changes you would
> make first.

Paste Argon's findings into a new file, `docs/reviews/argon-YYYY-MM-DD.md`. Then
tell Claude "fix the Argon review". Each fix ships with a test, per `CLAUDE.md` §10.
