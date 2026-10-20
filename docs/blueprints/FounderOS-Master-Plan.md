# FounderOS — Master Plan

**Owner:** Avinash · **Version:** 1.0 · **Date:** 2026-10-16
**Status:** for founder verification, then Argon (CEO review) via GitHub.
This is the single top-level plan. Detailed docs it points to stay the source for their
own topic; when they disagree with this file, this file wins until it is updated.

---

## 1 · Intent

**What we are building:** a company that runs on AI and earns money by delivering real
software and services, with FounderOS as the machine that runs it.

**For whom:**
- **First:** local and mid-size businesses in India (Andhra Pradesh first). They need
  websites, apps, leads and automation done properly, at a price they can pay.
- **Next:** clients on Fiverr, Contra and Gumroad worldwide.
- **Later:** founders who use FounderOS itself.

**The promise we keep:** honest work. Real tests, real numbers, no invented claims, code
the client owns. "AI-guided" means AI does the heavy lifting and a person approves
anything that touches money, client data, or production.

**North Star:** one client who pays and is glad they did, then the next one.

## 2 · What FounderOS is

A company in a box with six stages, each run by AI seats and checked by a person:

```
Research → Decide → Build → Prove → Sell → Maintain
```

| Stage | What happens | Output |
|---|---|---|
| **Research** | Study the reference products and the client's market from public sources and our own use; build the workflow "DNA" | Research files + cited brief |
| **Decide** | Seats debate in the open; the CEO resolves every challenge | Decision with receipts (model, cost, dissent) |
| **Build** | Starter kit + design pack + build cycles inside `projects/<slug>/` | A working project that runs without FounderOS |
| **Prove** | Typecheck, tests, browser tests, five screen states, secret scan, eject check | Verification report + screenshots |
| **Sell** | Listing, demo, proposal; Reach agent finds and writes to clients (a person approves sends) | Leads, proposals, paid orders |
| **Maintain** | Hosting, updates and fixes by bots as pull requests; a person merges | Uptime + monthly retainer |

## 3 · The moat (honest version)

Models are not a moat: everyone has them. UI is not a moat: it can be copied in a week.
What compounds and is hard to copy:

1. **The research library.** Every project adds a sector "DNA" file: workflows, states,
   rules, acceptance tests. The 10th clinic project starts with 9 projects of knowledge.
   This grows with every job and cannot be bought.
2. **Receipts and open dissent.** Clients see which model ran, the cost, who disagreed and
   why the CEO decided. This builds trust that black-box AI agencies cannot fake.
3. **No lock-in, proven.** The eject check proves the client can take the code and leave.
   That is exactly why they stay, and it sells to cautious clients.
4. **Near-zero running cost.** Free-first routing across many keys and providers with
   automatic failover, so AI cost per project stays close to ₹0 while competitors pay per
   token.
5. **Speed with quality.** Starter kits + design packs + automatic verification. Fast,
   because the boring 70% is already built and tested.
6. **Local distribution.** We are physically in the region we sell to, speak the
   language, meet clients in person, and get referrals between coaching centres, clinics
   and shops. A remote competitor can't do that.
7. **Teaching loop (RaKeGa).** What we build becomes what we teach, and learners become
   clients or developers. One flywheel feeds the other.

## 4 · How we make money

The prices below are **starting assumptions** to test with the first 5 clients. They are
not market data; adjust after real conversations.

| Stream | What the client gets | Price band (to validate) |
|---|---|---|
| Fast site | Landing or business site, 3–7 days | ₹8k–25k |
| Business app | Booking, CRM-lite, dashboard, portal | ₹40k–1.5L |
| AI assistant | Chat assistant answering from the client's documents | ₹25k–75k setup |
| Growth package | Meta/Google Ads setup + WhatsApp lead routing | ₹10k–30k setup + monthly |
| Care plan | Hosting, updates, fixes, uptime watch | ₹2k–10k / month |
| Digital products | Starter kits, templates, design packs on Gumroad/Contra | ₹500–5k each |
| RaKeGa courses | Basic / Advanced tiers | set at launch |

**Order of focus:**
1. Care plans (recurring).
2. Fast sites and business apps (cash now).
3. Digital products (passive).
4. Courses (after the platform is ready).

## 5 · The seats (AI company roles)

| Seat | Job | Model tier (keys) |
|---|---|---|
| CEO | Resolves debates, approves plans and final answers | Frontier (CEO/COO keys; Gemini 4 Argon when reachable) |
| COO | Splits work into cycles, tracks deadlines, routes tasks | Fast (worker keys) |
| Research | Reference DNA, market, competitors' public workflows | Balanced + web search (Tavily) |
| Product | Scope, acceptance criteria, what not to build | Balanced (complex-work keys) |
| Architect | Stack choice, data model, security plan | Balanced |
| Design | Picks the design pack, five states, accessibility | Balanced |
| Frontend / Backend | Build inside the project folder only | Fast → balanced |
| QA + Security | Tests, browser checks, secret scan, abuse cases | Fast |
| Release | Build, deploy, eject check, handover docs | Fast |
| Growth (Reach) | Finds leads, drafts emails, listings | Fast; a person approves every send |
| Maintenance | Watches uptime and updates; opens fix pull requests | Fast |

**Failover rule:** when a key hits its limit the next key is used; when a provider
refuses, the next model is used. Echo is the last resort and is labelled as Echo.

## 6 · Work process (every project, same steps)

| # | Step | Gate (must pass to continue) | Who approves |
|---|---|---|---|
| 0 | **Intake:** client need or own product idea → brief | Brief has goal, users, must-haves, budget band | Founder |
| 1 | **Research:** 3 references + market, public sources only | Research files exist, every claim cited | Research seat |
| 2 | **Decide:** debate → plan → quote | CEO resolved every challenge; quote within band | Founder |
| 3 | **Design:** 3 directions → one design pack | Contrast checks pass; founder or client picked one | Founder / client |
| 4 | **Build:** cycles 1–5 (skeleton · core workflow · edge cases · experience · verify) | Each cycle: typecheck 0, tests green, screens rendered at 390 px and 1280 px | QA seat |
| 5 | **Prove:** full verification | Five states, browser tests, secret scan, eject check | Founder |
| 6 | **Deliver:** handover or host on our server | Client can run it from the README; or it's live with SSL + backups | Founder |
| 7 | **Sell / list:** demo, listing, case study (with permission) | No invented numbers in any copy | Founder |
| 8 | **Maintain:** care plan | Fixes arrive as pull requests with tests | Founder merges |

**Founder review:** after every 3 cycles, in FounderOS chat.
**Decision log:** `details/decisions.md` in each project.

## 7 · Workflows

**A · Client project**
lead → call → brief → research → decision + quote → advance payment → design → build
cycles → verification → delivery → care plan.

**B · Own product** (Gati Rides, RaKeGa, sector apps)
idea → research DNA → plan → build cycles → listing on Gumroad/Contra/Fiverr → demo
video → first sale → iterate.

**C · Finding clients (Reach)**
- Pick a niche → find public business listings → research each business → draft one
  personalised email → **a person approves** → send (daily cap, one-click opt-out,
  permanent suppression list) → reply → call.
- Email only. No cold WhatsApp, SMS or calls.

**D · Research DNA**
- Reference links → crawler (public pages, or your own login) → UI map.
- Workflow notes (crawler, video of your own session, help pages) → DNA file → acceptance
  tests.
- The crawler joins FounderOS after 7 useful runs.

**E · Maintenance**
uptime alert or dependency update → Maintenance seat reproduces it → fix + test → pull
request → founder merges → deploy → note in the client log.

**F · Review loop**
push to GitHub → Argon (CEO) review → findings saved in `docs/reviews/` → Claude
(co-worker) checks each finding against the code → fixes with tests → next push.

## 8 · Non-negotiable rules

- **Legal research only.** We use public pages, docs, help centres, our own accounts and
  open-source code (licence checked). We never use pirated content, leaked or bought
  personal data, private APIs or hidden keys. We never copy logos, text or designs.
- **Honesty.** No invented clients, numbers, reviews or "100% same" claims. Degraded output
  is labelled.
- **Safety.**
  - Agents work only inside `projects/<slug>/`.
  - Destructive commands (delete, wipe, force-push, reset) are blocked.
  - Writes to files need approval.
  - Everything is in git.
- **Secrets.**
  - Keys live only in `.env.local` (git-ignored).
  - `npm run secrets:check` runs before every push.
  - Any key that leaks is rotated.
- **Quality.** Five screen states, tests for every fix, contrast checks, mobile-first.
- **Money and people.** A person approves payments, payouts, emails to strangers and
  production deploys.

## 9 · Technology

- **FounderOS:** Next.js (App Router), TypeScript strict, repository pattern (in-memory →
  MongoDB), SSE streaming, model router with key pools and failover.
- **Projects:** standalone folders, pnpm shared store, one starter kit per stack:
  web-react · web-next · web-static · java-spring · web-vue · web-angular.
- **Design:** design-director → design packs (themes, layouts, skeletons, motion,
  optional 3D); reskin = swap tokens + layout.
- **Runtime (to build):**
  - R1 project runner
  - R2 Docker sandbox
  - R3 browser tool
  - R4 MCP client
  - R5 tool-using agent loop with approvals
- **Hosting:** client's own host, or ours via Coolify on one server (free software;
  server free tier first, paid once a client pays). Kubernetes only past ~50 services.
- **Models:** Gemini (role keys; Argon as CEO when reachable), Groq, Mistral, GLM,
  OpenRouter free models, Echo offline. Tavily for web search.

## 10 · Roadmap

| When | FounderOS | Projects | Money |
|---|---|---|---|
| **Week 1** | Push to GitHub, Argon review, fix findings; R1 runner; R3 browser tool | Gati: deploy + demo video + listings | 3 listings live; Reach niche chosen |
| **Week 2** | pnpm switch; web-react starter kit from Gati; design packs v1 | RaKeGa cycle 1 (foundation) | First 20 personalised emails (approved) |
| **Weeks 3–4** | R2 sandbox; Preview tab; Coolify on a server | RaKeGa cycles 2–3; first client build | First paid project or care plan |
| **Month 2** | R4 MCP + R5 tool loop with approvals | web-next + web-static kits; 2 sector products | 3 care plans; Gumroad kit sales |
| **Month 3** | Maintenance bots on client apps; research library across 5 sectors | java-spring kit; RaKeGa launch | Recurring revenue covers hosting + keys |

**Job track runs in parallel every day** (`docs/FOUNDER-BRIEF.md` §9): income first.

## 11 · What we measure every week

- leads found · emails approved · replies · calls · proposals · wins
- revenue received · recurring revenue
- days from brief to delivery · tests passing · bugs reported after delivery
- AI cost per project (target close to ₹0) · runs that fell back to Echo

## 12 · Questions for Argon (CEO review)

1. Is the moat in §3 real, or which parts are weak?
2. Which revenue stream in §4 should come first for a solo founder with no capital?
3. What in the code contradicts this plan? Name file + line.
4. What is the single biggest risk to the 90-day roadmap?

## 13 · Before pushing to GitHub

```powershell
npm run secrets:check   # must say ✓
npm run typecheck
npm run test
git status              # .env.local, data/, browser-sessions must NOT appear
```

**Detailed docs:**
- `FOUNDER-BRIEF.md`
- `blueprints/FounderOS-Runtime-and-Factory-Plan.md`
- `blueprints/FounderOS-Research-Scanner.md`
- `projects/rakega/details/brief.md`
- `SHIP-AND-REVIEW.md`
- `research/references/`
