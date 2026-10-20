# FounderOS — Launch Runbook, Market Truth & 21-Day Money Plan

**For:** Avinash · **Written:** 2026-08-01 · **Target:** first revenue before **21 Aug 2026**
**Companions:** `FounderOS-Flagship-Spec.md` (product bible) · `docs/16-environment-guide.md` (env)

---

## PART 1 — YOUR TURN OF WORK (do this first, ~40 minutes)

You already have: a Windows PC, **Ollama installed**, a **Gemini Pro key**, this repo.
You need: Node.js. That's the only download left.

### Step 1 · Install Node.js (10 min)
Download the **LTS** installer from nodejs.org (v20 or v22), run it, accept defaults.
Verify in a new PowerShell window:
```powershell
node --version    # expect v20.x or v22.x
npm --version
```

### Step 2 · Install the app's dependencies (5–10 min)
```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS\apps\web"
npm install
```

### Step 3 · Create your `.env.local` (5 min)
```powershell
copy .env.example .env.local
notepad .env.local
```
Fill only these four lines — leave everything else blank:
```
GEMINI_API_KEY=<paste your Gemini key>
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
AUTH_SECRET=<type any 32+ random characters>
```
> With a **Gemini Pro key**, add `GEMINI_MODEL_TIER=pro` later if we wire tier overrides;
> today the registry already routes `gemini-1.5-pro` to the CEO/frontier seats at $0.

### Step 4 · Start Ollama (2 min, optional but nice)
In its own PowerShell window:
```powershell
ollama pull llama3.1     # one time, ~5GB
ollama serve             # leave this window open
```
Not running? Nothing breaks — the router just uses Gemini, then Echo.

### Step 5 · Run the company (1 min)
```powershell
npm run dev
```
Open **http://localhost:3000** → sign in with any email → create a project →
type an intent → watch the departments debate. Then hit **`/demo`** and watch it
present itself.

### Step 6 · Sanity check (2 min)
```powershell
npm test        # expect 72/72 passing
npm run build   # expect a clean production build
```

**If something fails:** copy the exact error text to me. The three likely ones are
Node not on PATH (reopen PowerShell), OneDrive file-lock during `npm install`
(pause OneDrive sync, retry), or port 3000 in use (`npm run dev -- -p 3001`).

---

## PART 2 — MARKET TRUTH (honest, not flattering)

**Is this kind of product famous / going viral?** Yes and no, and the distinction is
your whole strategy.

- **The category is crowded.** There are 50+ AI agent builders. The AI-agent market was
  ~$7.6B in 2025 growing ~49%/yr. n8n, CrewAI, LangGraph own the code-first builder space;
  Dust, Sierra, Decagon own enterprise multi-agent; Make/Zapier own no-code automation.
- **So "another agent builder" has ~0% chance.** Competing head-on with n8n (open source,
  huge template library, self-hostable) or with Bolt/Cursor/Claude Code on coding is a
  losing fight, and you already said that isn't the job.
- **What is NOT crowded:** an opinionated *company* of role-specialised agents that
  **argue with each other in front of the user**, show **receipts** (which model, what cost,
  what memory), and hand back **one accountable decision**. Almost every competitor gives
  either a chat box or a node graph. Nobody sells "watch your company deliberate."
- **Your honest success rate.** As a venture competing with funded platforms: low
  single-digit percent — that's true for everyone. As **your own leverage engine**
  (earn from services/templates, prove your skill, win jobs and clients): high — 70%+,
  because it doesn't require beating anyone, only shipping consistently. **Judge FounderOS
  on income and opportunities it creates for you, not on beating n8n.**

**The line that wins rooms:** *"Most tools give you one AI. FounderOS gives you a company —
Product, Architecture, Design, QA, CEO — that disagrees in the open and shows its receipts."*

---

## PART 3 — THE MONEY PLAN (Aug 7 → Aug 21)

Realistic goal for 3 weeks: **₹15k–₹60k / $200–$700** from productised assets + one or two
small client jobs. Subscriptions/SaaS revenue in 3 weeks is not realistic — don't chase it.

### What you actually sell (highest → lowest odds)
1. **Templates & starter kits on Gumroad** ($29–$79). Fastest. You already own the
   ingredients: the Strata design system, the SSE streaming pattern, the agent-debate
   engine, the provider ladder. Package as: *"AI Agent Company Starter (Next.js) — multi-
   agent debate + streaming UI + free-model router."*
2. **Automation/agent setup services on Contra & Fiverr** ($75–$300/job). n8n workflow +
   an AI agent step for a small business. Use n8n's free templates as your delivery
   accelerant — it's open source and self-hostable; you keep the margin.
3. **The "receipts" content engine** — post the debate videos. Screen-record `/demo`.
   That's your viral surface, not a feature.

### The 15-day cadence (this is the whole plan)
| Days | Focus | Output |
|---|---|---|
| Aug 7–9 | **Ship assets** | Package Starter Kit #1 → Gumroad live. Set up Contra + Fiverr profiles with the demo video. |
| Aug 10–13 | **Post daily** | 1 short/day: a 30–60s screen-grab of the agents debating + one lesson. LinkedIn + X + YouTube Shorts + Instagram Reels. Same clip, 4 places. |
| Aug 14–16 | **Sell services** | 10 targeted Contra/Fiverr proposals/day for "AI automation setup". Price low first ($75), raise after 2 reviews. |
| Aug 17–19 | **Asset #2** | Second Gumroad product (n8n + AI agent workflow pack) + cross-post. |
| Aug 20–21 | **Close & count** | Follow up every lead; log revenue in the Freelance Studio board. |

**Non-negotiable:** one post per day from Aug 7. Consistency beats brilliance here — the
algorithm rewards frequency, and each post is a free lottery ticket on a client.

### Quick product ideas (agentic / ML / automation) — pick 2, not 8
- **Inbox-to-CRM agent** (n8n + LLM): classifies leads, drafts replies. Sells to agencies.
- **Content Repurposer**: one long video → 5 shorts + captions + posts. Evergreen demand.
- **Review-Reply agent** for local businesses (dentists, gyms, restaurants).
- **Resume/JD matcher** (ML-lite, embeddings): sells to recruiters and job seekers.
- **Weekly Ops Brief agent**: pulls sheets/Slack → one Monday summary. Enterprise-lite.
> All four are buildable in FounderOS in a day each, and all four are sellable twice:
> once as a service, once as a template.

---

## PART 4 — THE DIFFERENTIATOR TO BUILD NEXT (your real vision)

Your insight, stated precisely: *general AI tools reason as one mind; real work needs
many minds with different mandates.* The build that expresses it:

### 4.1 Role Personas ("mindset packs") — the flagship
Each department gets a **persona profile** distilled from how the top 5–15 practitioners in
that role actually think — as **principles, never as impersonation or quotes**:
- PM: Shreyas-style leverage thinking, JTBD, "smallest valuable version"
- Architecture: simplicity + reversibility, trade-off naming, failure-first
- Design: Rams/Apple restraint, motion-as-meaning, state completeness
- QA/Security: adversarial mindset, "what breaks at 3am"
- **New seats:** Growth/SEO, Marketing, ML Engineer, Forward-Deploy Engineer, COO, CFO
Implementation: `server/ai/personas.ts` — versioned principle sets injected into each
department's system prompt, selectable per project. Ethical rule: principles and public
craft, no cloned voices.

### 4.2 Stack Advisor (visual)
User brings an API key; FounderOS answers *"what should I build this with?"* with a visual
recommended stack, why each piece, cost per month, and a copy-paste setup guide. This is
the "we tell them how to get access and the best stack" feature you described.

### 4.3 Automation Bridge (n8n)
Don't rebuild n8n — **speak to it.** The company designs the workflow, then exports an
importable n8n JSON. FounderOS becomes the brain; n8n is the hands. This is the single
highest-leverage integration available to you.

### 4.4 Build order (after Aug 21)
1. Role Personas (2 days) — the differentiator
2. Stack Advisor (2 days) — the "wow" for clients
3. n8n Export Bridge (2 days) — the money multiplier
4. Deploy + magic-link (P2) — the live URL
5. Reskin/Export (P4) — turns every build into a sellable asset

---

## PART 5 — MODEL STRATEGY (who does what)

| Work | Model | Why |
|---|---|---|
| Deep architecture, refactors, this kind of planning | **Opus 5** | Highest reasoning, worth the cost on decisions |
| Feature implementation, tests, docs, repetitive builds | **Sonnet** | Fast and cheap; most of your build hours |
| In-app departments (PM/AR/UX/QA) | **Gemini flash / llama3.1** | Free, fast, good enough |
| In-app CEO synthesis | **Gemini 1.5 Pro** | Free at your tier, 0.90 quality — real decisions at $0 |
| Grok (when you get it) | Research/trend seat | Add as another provider adapter; the seam already exists |

**Rule:** plan with Opus, build with Sonnet, run the product on free models.

---

## PART 6 — THE 5 THINGS THAT MATTER MOST

1. **Run the app tomorrow.** Everything above is theory until you see the debate on screen.
2. **Post daily from Aug 7.** The demo video is your marketing; you already built it.
3. **Sell assets, not a platform.** Templates and setups pay in 3 weeks; SaaS doesn't.
4. **Build Role Personas next.** It's the only thing here nobody else is selling.
5. **Bridge to n8n, don't fight it.** Their 1000+ templates become your delivery speed.

*Judge this project by the income and doors it opens for you — that's the scoreboard that matters.*
