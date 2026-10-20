# FOUNDER BRIEF — the one file to read first

**Owner:** Avinash · **Written:** 2026-10-10 · **Update this file, don't start a new one.**
Every session (Claude, Cowork, any model) reads this before doing anything.

---

## 1 · Where we are, honestly

- 17 months without a job; no revenue yet from Avion or FounderOS.
- What *does* exist and can be shown today:
  - **Gati Rides**: a cab dispatch app, v1 complete (6/6 cycles, 127 + 34 browser tests).
    **Paused 2026-10-12.**
  - **RaKeGa**: AI academy + agency with your CTO relative. Planned in
    `projects/rakega/details/brief.md`. **Active, in parallel with FounderOS.**
  - **FounderOS** — agent company with debate, receipts, project registry, eject check, 141 tests.
  - **design-director** — our own design skill (genome → 3 directions → accessible tokens).
  - **10 product folders** with briefs and rules (`projects/README.md`).
- What's missing: **git/version control, anything run on your own PC, any real user, any income.**

## 2 · What FounderOS is (in your words, made precise)

A client names a reference product (an app, site or tool that already works). FounderOS's
agents research it, debate it, and build **our own enhanced version** for that client —
local, mid-level or premium — in any sector. Same process every time, in cycles.

- **No bluffing.** No "100% same". The honest, measurable target is **80–90% of the
  observable behaviour on the core workflows**, proven by acceptance tests and a fidelity
  report (checks passed ÷ checks written). The backend is our own, built to public rules.
- **The market proves the model:** AJIO after Flipkart, Zepto after Blinkit, Rapido after
  Uber — the same *category workflows*, rebuilt their own way, winning on a few chosen
  advantages. That is exactly what we do: learn the workflow, never copy the product.

## 3 · "Future Anticipated" — the meaning

*Anticipated* = expected before it arrives. A future-anticipated product is designed for a
need we expect around 2027–2032 (from public signals: agentic shopping, voice-to-action,
continuous finance close…) but **proven useful now** with a working v1. It means better
performance, reliability and workflows — not just a futuristic look.

## 4 · Research rules (what's legitimate, what's not)

**Use (all legitimate, together they reach ~80–85% of a working product):**
crawler on public pages + your own logged-in account (screens, flows, states) · help centres
· release notes / app-store "what's new" · tutorials and vendor demos · job postings and
engineering blogs (tech stack) · **published** developer APIs through our own accounts ·
sector standards (FHIR, ICD-10, LOINC, ABDM, NABH/NABL, SEBI, NSE/BSE, RBI) · open-source
systems of the same kind (OpenMRS, Bahmni, OpenELIS — licence checked) · **3 expert
interviews per sector** (future clients double as experts).

**Never:** mapping or calling a company's private API · probing beyond what normal use
shows · black-box hammering of someone else's live service · implementing patented methods
(patents tell us what to *avoid*) · copying code, text, images, logos or layouts · putting
another brand's name in our product · real people's data or photos. Research the
**workflow**, never their backend.

**Personal data (India, DPDP):** public business listings are fine for finding clients;
never patient/health data; never scraped phone numbers for calls/SMS (TRAI DND rules).
Not legal advice — check before relying on it.

## 5 · The Video Research Agent (your idea — approved with guardrails)

You record **your own** session using a reference app; the agent extracts what the crawler
can't reach, asks you when unsure, and the video is deleted after.

- Extracts: screens, steps, decisions, waits, error states, timings → L2 workflow files.
- Your own account and your own session only. Pause recording on payments, OTPs, bank
  details, other people's names or numbers.
- Processed locally or with your own model key; the recording and frames are deleted when
  the task closes, and the receipt says so.
- Network activity from your session is noted as *context* ("this step waits on a server
  call") — never as an API map to reuse or call.

## 6 · How agents must behave (FounderOS law)

**Safety first — no single prompt can destroy your work:**
1. Everything lives in **git** (local + private GitHub). Nothing is unrecoverable.
2. Agents **refuse** destructive commands (delete folders, wipe data, force-push, reset)
   unless the user confirms twice, by name, after the agent states exactly what will be lost.
3. Claude Code denies the most dangerous commands outright. **You save this file yourself**
   as `FoundersOS\.claude\settings.json` (Claude isn't allowed to write there), then run
   `/status` in Claude Code to confirm it loaded:

   ```json
   {
     "$schema": "https://json.schemastore.org/claude-code-settings.json",
     "permissions": {
       "deny": [
         "Bash(rm -rf *)", "Bash(rm -r *)", "Bash(rm -fr *)",
         "Bash(git push --force *)", "Bash(git push -f *)",
         "Bash(git reset --hard *)", "Bash(git clean *)", "Bash(git checkout -- *)",
         "Bash(npm run doctor:fix)",
         "Read(./.env)", "Read(./apps/web/.env.local)",
         "Read(./projects/gati-rides/.env)", "Read(./projects/gati-rides/.env.local)"
       ]
     }
   }
   ```

   A deny list catches common forms, not every possible phrasing — git (point 1) is the
   real safety net.

**No "You're right, I missed it" loops:**
1. **Say it when the request is wrong** — with the reason — before doing anything.
2. **Hold a correct position.** Change only for a new fact or a clear decision, and say
   which. Never flip just because the user pushed back.
3. **Write the acceptance check first.** "Done means: ___." Iterations are judged against it.
4. **Three refinements on the same item → stop.** Show the three versions, ask which
   criterion is failing, record the decision in the project's decision log.
5. **Decision log per project** (`details/decisions.md`): what was decided, why, by whom —
   so the next session doesn't re-open settled questions.

**It should feel like a mini MNC:** seats (CEO, COO, Product, Research, Design, Architect,
Frontend, Backend, QA, Security, Release, Growth) discuss in the open, disagree with reasons,
the CEO decides, receipts show who said what.

## 7 · The same process for every project

Brief → research (§4, §5) → 3 design directions (design-director) → plan with acceptance
tests → cycles: **1 Skeleton · 2 Core workflow · 3 Exceptions · 4 Experience · 5 Verify &
package** (7/9/14 for more) → fidelity report → listing on Fiverr / Contra / Gumroad.
Every project: own folder, own install, eject check green, git, CI, README with backend +
frontend setup and how to get each API key.

## 8 · The project list (10+ sectors)

| Sector | Project | Status |
|---|---|---|
| Travel / cabs | **Gati Rides** | v1 ready · paused |
| Education + agency | **RaKeGa** | planned · active |
| Finance / CA | LedgerWeave | brief ready |
| Banking | VaultRelay | brief ready |
| Voice / service | VoxRelay | brief ready |
| Labs | LumaPath | brief ready |
| Hospitals | WardWeave | brief ready |
| Shopping / e-commerce | IntentCart | brief ready |
| Food delivery | MealMesh | brief ready |
| Procurement | SourceWeave | brief ready |
| AI ops / evaluation | FleetLens · ProofGate | brief ready |
| Automobiles (bike/car service tools) | *to define* | new |
| Learning / tech learning platform | *to define* | new |

**One at a time to income.** A second project starts only when the previous one is listed
for sale.

## 9 · Getting a job in 21 days (in parallel — income first)

Your profile: 4 years as a UI/React developer, now AI-assisted full-stack building, shipped
systems with real tests. Interviews will test you **without** AI, so the work is: be able to
explain Gati end to end in your own words.

| Role to apply for | Fit | Typical India pay (2026, published ranges) |
|---|---|---|
| **Frontend / React engineer (AI-enabled)** | best fit now | ~₹10–17 LPA for 3–5 yrs; up to ~₹20 at product firms |
| **AI automation specialist** (agents, n8n, LLM workflows) | strong fit | ~₹12–25 LPA for 2–4 yrs (blog-sourced) |
| **AI solutions / implementation engineer** | good, needs coding rounds | ~₹12–25 LPA (proxy data, thin) |
| Forward-deployed engineer | stretch: heavier coding interviews | ~₹18–28 LPA 0–2 yrs at startups/GCCs |
| Associate AI product manager | stretch: needs PM evidence | ~₹12 LPA at 0–3 yrs PM experience |

**Ask:** ₹12–16 LPA for frontend/AI-automation roles; don't go below ~₹10 LPA. Higher at
product companies and GCCs than at IT-services firms. Verify against current postings on
Naukri / LinkedIn / AmbitionBox before each negotiation — the ranges above are from
aggregators and blogs, not audited data.

**Daily for 21 days:** 10 applications · 1 hour explaining one Gati module aloud without AI
(dispatch rules, persistence, tests) · 30 min React/JS fundamentals (your Dev Interview
Mastery app) · 1 post showing real work (screenshots + one sentence).

**Your pitch in one line:** "I build and ship AI-assisted web products with real tests and
honest data — here's a dispatch system I took from 0 to 123 tests and server persistence."

## 10 · Next actions, in order

Updated 2026-10-12. RaKeGa and FounderOS run in parallel; Gati is paused.

1. **Decide R1–R5** in `projects/rakega/details/brief.md` §9 (name, first niche, prices,
   reviewers, course 1 recording).
2. **Run the crawler on your PC** for the six references (`npm run crawl:gated -- be10x`,
   and so on). Read each result and record `gate:review`. These are your first real gate runs.
3. **RaKeGa cycle 1 (Foundation)** starts after step 1. Your relative records course 1
   in parallel.
4. **FounderOS:** build the Track A Stage 2 runner (the honest gap in all three FounderOS
   reference studies). RaKeGa Works is its first real customer.
5. **Job track** (§9) every day in parallel.
6. Gati, when resumed: `docs/YOUR-NEXT-STEPS.md` (install, deploy, list) + redesign Pass B.

## Sources for §9 salary ranges

[Eventbeep frontend 2026](https://www.eventbeep.com/en/career-guides/frontend-developer-salary-in-india) ·
[Codegnan React 2026](https://codegnan.com/blogs/reactjs-developer-salary-in-india/) ·
[upGrad frontend](https://www.upgrad.com/blog/front-end-developer-salary-in-india-for-freshers-experienced/) ·
[AI automation salary guide](https://ai-automation.in/ai-automation-salary-guide-2026-entry-level-to-senior-pay-rates/) ·
[GrowAI AI automation jobs](https://growai.in/ai-automation-jobs-india-2026/) ·
[FDE vs AI solutions engineer](https://fde.academy/blog/ai-solutions-engineer-salary-vs-fde) ·
[360 Digital Transformation FDE](https://www.360digitaltransformation.com/blogs/guides/forward-deployed-engineer-salary-india) ·
[Simplilearn AI PM 2026](https://www.simplilearn.com/ai-product-manager-salary-article)
