# Product Research Engine — START HERE

Portable competitor research (L1–L5). Copied out of Avion on 30 Sep 2026 so any
future project can start from it. **Move this whole folder anywhere; it doesn't
depend on Avion.**

> **For any AI model reading this:** read this README, `docs/L5-RESEARCH-KIT.md`
> and `docs/Product_Discovery_Engine_Plan.html`. **Do not read the crawler
> source** to "understand" it. The configs are ~800 lines each, and reading them
> is what burns a session in ten minutes. Run the commands and read the outputs.

---

## What's inside

```
Product-Research-Engine/
├── README.md                     ← you are here
├── package.json                  ← one dependency: playwright
├── research/                     ← the L1–L5 engine (keep this folder name)
│   ├── explorers/
│   │   ├── save-session-cdp.js   ★ THE login solution (~99 attempts to reach)
│   │   ├── crawl.js              ★ produces L1–L5 per competitor
│   │   ├── save-session.js       older launch-based session saver
│   │   ├── competitor-invideo*.js  early one-off InVideo crawlers (reference)
│   │   └── avion-crawler.js      crawls your OWN app (Avion example)
│   ├── lib/                      crawler-core.js · session-manager.js
│   ├── browser-sessions/         session scripts + .env template (NO saved logins)
│   └── competitors/
│       ├── _TEMPLATE/config.js   ← copy this for every new competitor
│       ├── heygen/ higgsfield/ invideo/ kling/ openart/ runway/   (working examples)
│       └── _final-README.md      how the cross-competitor synthesis is laid out
├── l5-gallery-and-editor/        newer, stricter tools: gallery URLs + editor-UI research
├── extras/video-structure-decoder/   media projects only: video → cut/pacing structure
├── projects/                     ← the 10 future products
│   ├── Future_AI_Projects_Roadmap.html   LumaPath · VoxRelay · LedgerWeave · IntentCart ·
│   │                                     MealMesh · WardWeave · VaultRelay · SourceWeave ·
│   │                                     ProofGate · FleetLens
│   └── AI_PRODUCT_STARTER_PROMPTS.md     Phase 0 (research) → Prompt A (plan) → B (build) → C (release)
└── docs/
    ├── L5-RESEARCH-KIT.md        the method: layers, login, L2 workflow format
    ├── Product_Discovery_Engine_Plan.html   research → opportunity → ₹ → paid pilot
    └── examples/                 Avion's research sheet, as a filled-in example
```

**Why the `research/` folder name must stay:** every script finds its files by
going two folders up, then into `research/…`. Keep that name and everything
works with no edits. (In Avion the folder was renamed, which broke it.)

---

## How the pieces fit

1. **Pick a product** from `projects/Future_AI_Projects_Roadmap.html`.
2. **Phase 0, research:** run this engine on the top 5–6 apps in that product's
   category (steps below), then price the manual work in ₹ using
   `docs/Product_Discovery_Engine_Plan.html`.
3. **Plan and build:** feed the L5 findings into Prompt A of
   `projects/AI_PRODUCT_STARTER_PROMPTS.md`, then Prompts B and C.

**The 7-run gate (added 2 Oct 2026).** Prefer `npm run crawl:gated -- <id> [flags]`
over `npm run crawl`. It runs the same crawler, then checks the output and records
the run in `gate/RUN-LEDGER.md`. After seven runs that pass the check *and* that you
review as useful, the engine gets integrated into FounderOS. Details:
`gate/README.md`.

## Setup — once per machine

```powershell
cd <wherever you moved Product-Research-Engine>
npm install
npx playwright install chromium
```

## Start a new project — five steps

**1 · Add competitors.** For each one:

```powershell
Copy-Item -Recurse research\competitors\_TEMPLATE research\competitors\<id>
```

Edit `research/competitors/<id>/config.js` — about 15 lines of facts (`id`, `name`,
`publicBaseUrl`, pages you know exist). `research/lib/site-config.js` builds the
sections: homepage, nav discovery, the pricing/course/feature pages it finds, and a
**generated Layer-1 UI map** at the end. The **folder name `<id>`** is what you pass
to the commands. Ready-made since 2026-10-12: `lovable`, `replit`, `atoms` (FounderOS
references) and `be10x`, `outskill`, `graphy` (RaKeGa references).

No window wanted (servers, CI)? Set `CRAWL_HEADLESS=1` first
(`$env:CRAWL_HEADLESS="1"` in PowerShell). Tests: `npm run test:configs`.

**2 · Log in: the method that works (Google included).**

```powershell
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process chrome -ErrorAction SilentlyContinue        # must print NOTHING

& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Temp\AvionResearch"
```

Log into every competitor **by hand** in that window. Then:

```powershell
npm run session -- <id1> <id2> <id3>
```

**3 · Crawl.** Public first, then logged in, then with network capture (L3):

```powershell
npm run crawl -- <id>
npm run crawl -- <id> --auth
npm run crawl -- <id> --auth --network
```

Output lands in `research/competitors/<id>/intelligence/` as the `L1`–`L5` files.

**4 · Fill L2 by hand where the crawler can't reach.** Canvas editors and
internal tools won't expose their workflows. Record each workflow step by step
in the format in `docs/L5-RESEARCH-KIT.md` §4, and count the steps, decisions
and waits.

**5 · Find the money.** Follow `docs/Product_Discovery_Engine_Plan.html`: job
postings + interviews → manual tasks → ₹ saved per month → top 3 → five client
conversations → a paid pilot.

---

## When something goes wrong

| You see | It means | Do |
|---|---|---|
| "Who's using Chrome?" profile picker | A Chrome was still running and ignored the launch settings | Run the `Stop-Process` line again; the next line must print nothing |
| `accounts.google.com/v3/signin/rejected` | You're in a browser Playwright opened, not the one from step 2 | Close it and start step 2 again |
| "Could not connect to Chrome" | Nothing is listening on port 9222 | Open `http://localhost:9222/json/version`; JSON back means it's running |
| "No config found — skipping" | The `research/` folder was renamed or moved | Put it back at the kit's top level |
| "STILL ON LOGIN PAGE" | That site isn't logged in yet in the step-2 window | Log in there, then run `npm run session` again |

---

## Deliberately NOT included

- **Saved logins** (`browser-sessions/*.json`, `.env.research`). They are live
  access to your competitor accounts and stay in Avion. Make fresh ones per
  project with step 2.
- **Avion's research results** (~80 MB of screenshots and L1–L5 findings). They
  stay in Avion; this kit is the engine, not the data.
- **Superseded scripts** (`save_auth.py` / `crawl.py` from 28 Sep in
  `Downloads\URL's Higgsfields`), which are inferior copies of
  `save-session-cdp.js`.

## Boundaries

- Only crawl what your own logged-in account can see.
- Never click Generate, Pay, Publish, or anything that spends credits.
- L3 records your own session's traffic. Don't call or build on a competitor's
  private endpoints.
- Learn the workflows; don't copy names, logos, text, images, code or overall
  look. Full list in the plan HTML, §13.

## Not verified

Files were copied as-is on 30 Sep 2026, with no code changed. The kit has not
been run from its new location. First run: `npm install`, then
`npm run crawl -- runway` (public mode, no login) as a smoke test.
