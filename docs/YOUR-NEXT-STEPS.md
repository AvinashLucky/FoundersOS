# Your next steps — backend, server, GitHub, deploy

Do these in order. Each step says how to check it worked. Use **PowerShell**.
If a step fails, copy the exact error into chat — don't skip ahead.

---

## Step 1 · Check your tools (2 min)

```powershell
node -v      # needs v20 or newer
npm -v
git --version
```

Missing git? Install from https://git-scm.com/download/win (defaults are fine), then reopen PowerShell.

## Step 2 · Install and test Gati Rides (10 min)

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS\projects\gati-rides"
npm install
npm run typecheck          # ✓ no output = no errors
npm test                   # ✓ "127 passed"
```

## Step 3 · Then fix FounderOS's install (5 min) — only after step 2

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS"
npm install
npm run doctor             # ✓ "Clean: a single hoisted node_modules"
```

## Step 4 · Gati's settings file (5 min)

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS\projects\gati-rides"
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `.env` in an editor and set:
- `GATI_OPERATOR_PASSWORD` — a password you'll remember, 10+ characters
- `GATI_SESSION_SECRET` — paste the long string the command printed
- `GEMINI_API_KEY` — optional: from https://aistudio.google.com/apikey (an *API key*, not the Gemini app subscription)

Never share or commit `.env`.

## Step 5 · Run it and look (5 min)

```powershell
npm run dev                # open http://localhost:3001
```

✓ You see the sign-in screen → sign in → Live Dispatch. Try **+ Call Intake**, **Auto-Dispatch
Queue**, and **Reset demo data** in the footer. Stop with `Ctrl+C`.

Optional browser tests (once per machine):

```powershell
npm run test:e2e:install
npm run test:e2e -- --update-snapshots     # first run creates your Windows baselines
npm run test:e2e                           # ✓ "22 passed"
```

## Step 6 · Protect your code from risky commands (2 min)

Create `FoundersOS\.claude\settings.json` with the JSON block in `docs/FOUNDER-BRIEF.md` §6.
In Claude Code, run `/status` — ✓ it lists the project settings file.

## Step 7 · GitHub — two private repositories (15 min)

On https://github.com/new create **two empty private repos** (no README, no .gitignore):
`founderos` and `gati-rides`.

**FounderOS** (Gati is excluded automatically — it gets its own repo):

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS"
git init
git add .
git status                 # ✓ no .env files, no node_modules, no projects/gati-rides
git commit -m "FounderOS: first commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/founderos.git
git push -u origin main
```

**Gati Rides:**

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS\projects\gati-rides"
git init
git add .
git status                 # ✓ no .env, no node_modules, no data/
git commit -m "Gati Rides v1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gati-rides.git
git push -u origin main
```

✓ On GitHub, open each repo → **Actions** tab → the CI run turns green.
If Gati's "Browser tests" step fails **only** on screenshot differences: Actions → "Update
visual baselines" → Run workflow → download the `visual-baselines` artifact → copy its PNGs
into `e2e/screens.spec.ts-snapshots/` → commit and push.

From now on, after each piece of work: `git add .` → `git commit -m "what changed"` → `git push`.

## Step 8 · Deploy Gati (30 min) — when you're ready to show it

Easiest: **Railway** (Hobby, ~$5/month, keeps data on a volume).
1. Sign in at https://railway.com with GitHub → New Project → Deploy from GitHub repo → `gati-rides`.
2. Variables: `GATI_OPERATOR_PASSWORD`, `GATI_SESSION_SECRET`, optional `GEMINI_API_KEY`,
   and `GATI_DATA_FILE=/app/data/gati-store.json`.
3. Add a **Volume** mounted at `/app/data`.
4. It builds from the `Dockerfile`. Open the public URL → ✓ sign-in screen.
5. If signing in works but the console shows "The dispatch data could not be saved": Railway
   mounts volumes as root — add the variable `RAILWAY_RUN_UID=0` and redeploy.

Alternative: Render Starter (~$7/month) + a disk at `/app/data`. Render's free tier works
for a quick look but **loses data** on every redeploy.

## Step 9 · Sell it (1–2 hours)

1. Record the 3-minute demo — `projects/gati-rides/details/release/DEMO_SCRIPT.md`.
2. Pick a licence for the source code before Gumroad.
3. Post from `details/release/LISTINGS.md` on Contra, Gumroad, Fiverr.
4. Show it to **one real cab operator** — their feedback decides version 2.

## Step 10 · FounderOS's own keys (10 min, later)

Create `apps/web/.env.local` from `apps/web/.env.example`, add `GEMINI_API_KEY` (and any free
keys), run `npm run dev:web`, open a project, run the company once. That's the first real AI
run of FounderOS (pending since August).

---

**Tell me after each step** — e.g. "step 2 done, 127 passed" or paste the error.
