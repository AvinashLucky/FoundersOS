# RaKeGa — product brief and plan

**Written:** 2026-10-12 · **Owner:** Avinash (builder) with a CTO relative (lead teacher)
**Status:** planned · Gati Rides paused · runs in parallel with FounderOS

---

## 1 · The name

"RakeGa Tech Solutions Innovations" is four generic words after the real one. The
strong part is **RaKeGa**: short, ownable, and no company by that name showed up in a
web search (2026-10-12). That is not a legal clearance; check it yourself before you spend
money (see the checks at the end of this section).

**Recommendation: keep RaKeGa as the brand and name each zone by what it does.**

| Use | Name |
|---|---|
| Brand | **RaKeGa** (say it "Ra-Ke-Ga") |
| Legal entity, if you register one | RaKeGa Technologies Pvt Ltd (or LLP) |
| Module: teach and run live classes | **RaKeGa Live** |
| Module: recorded courses + AI tutor | **RaKeGa Learn** |
| Module: agency services + developers earn | **RaKeGa Works** |
| Client-finding agent | **RaKeGa Reach** |

If you'd rather not use RaKeGa, here are three original alternatives. I have not checked
whether they are available.

- **Prayoga**: Sanskrit/Telugu for "practice, application". It fits "learn by doing".
- **Kalpa Labs**: "kalpa" means a plan or design. It fits the agency side.
- **TenfoldWorks**: plain English, says "multiply what you can do".

**Checks before you pay for anything:**

1. Search the name in the trademark registry ([IP India public search](https://tmrsearch.ipindia.gov.in/)), classes 41 (education) and 42 (software).
2. Search the company name on the MCA name-availability page.
3. Buy the domain (.com or .in) and the Instagram and YouTube handles on the same day.

**Decided 2026-10-12: RaKeGa.**

## 2 · What RaKeGa is

**One application, one login, four modules**: Live, Learn, Works and Reach. A single
React app and a single API share one database, one account system and one payment
system. A person's role decides which modules they see.

- A learner sees Learn and Live.
- A client sees Works.
- A developer sees their Works jobs.
- You (admin) see everything, including Reach.

The modules are folders inside the same codebase (`frontend/src/modules/live`, `learn`,
`works`, `reach`; the same in `backend/`), not separate apps. That keeps one deploy and
one bill, and lets a learner later become a client without a second account.

1. **Live (teach).** Your relative teaches live classes of 200–500 people, records them,
   and the recording becomes a course lesson automatically. There's no separate upload step.
2. **Learn (courses).** Recorded courses on AI, prompting, agents, automation, Meta and
   Google Ads, and AI video. They cover school students and juniors through business
   owners and senior professionals. Each course gets an AI tutor that answers only from
   that course's own material.
3. **Works (services).** Clients order websites, apps, ads, videos, automation and
   courses. A small trusted group of reviewers checks every delivery. Independent
   developers can join, take work and earn. FounderOS is the delivery engine behind this
   zone (§8).
4. **Reach (clients).** An agent that finds businesses that fit, writes one honest,
   personalised email to each, and sends it only after a human approves. It is not a
   bulk-mail tool.

Who it's for:

| Person | Wants |
|---|---|
| Learner (student, junior, professional, business owner) | Learn a skill they can use this week |
| Teacher (your relative, later guest teachers) | Teach once, reach hundreds, get paid |
| Client (a business) | A result: leads, a website, an automation |
| Developer (independent) | Paid work with clear scope and fair, on-time pay |
| Reviewer (your trusted people) | See and approve every delivery |

The proposal PDF you shared (Pitchwell Studio → Nischalarna Yoga) is used here only for
its service list: posters, Meta Ads, reels, click-to-WhatsApp, website,
registration→WhatsApp routing, Meta lead forms, social management, Google Ads and
performance reporting. That becomes the starting catalogue for RaKeGa Works. The PDF in
the upload has one page, the cover. The service list comes from your earlier pitch.

## 3 · Live module: classes for 200–500, honest numbers

**First, a correction.** Zoom is not as expensive at this size as it feels. Its 500-seat
webinar add-on is quoted at about **$690–1,140 a year, plus a host licence** (third-party
figures, 2026; Zoom also quotes custom prices). Running live rooms ourselves costs money too,
mostly for video bandwidth. **The reason to build our own is not cost.** It is:

- the recording becomes a course lesson automatically;
- learners join inside RaKeGa with no Zoom app;
- the brand stays ours;
- attendance and Q&A data stay with us;
- transcripts feed the AI tutor.

**How it works: "Stage + Audience".**

- **Stage:** the teacher, plus up to about 10 people invited on stage (raise hand →
  promoted), on real-time WebRTC through **LiveKit**. Delay is under half a second.
- **Audience:** everyone else watches the same class as a stream through a CDN. It runs
  about 5–10 seconds behind, which is fine for a lecture. Chat, Q&A, polls and raise-hand
  run on our own websocket, so interaction stays instant.
- **Recording:** LiveKit's recording export saves the class. A background job uploads it
  to Bunny Stream and adds it to the course as a draft lesson for the teacher to publish.

Why the split: sending real-time video to 500 people is the expensive part. Moving the
audience to a CDN cuts that cost several times over. The exact audience path is chosen and
load-tested in cycle 3: LiveKit HLS export → storage → CDN. Until then, the CDN cost below
is an estimate based on Bunny's published CDN rates, not a tested setup.

**Cost per month (4 classes × 90 min × 500 people), estimated from published prices on 2026-10-12:**

| Setup | Main costs | Estimate |
|---|---|---|
| Everyone on LiveKit Cloud (Ship plan) | $50 plan (150k participant-minutes and 250 GB included), then $0.0005/min and $0.12/GB. One class at ~1 Mbps ≈ 45,000 min and ~340 GB | **~$120–200/month** |
| Stage on LiveKit + audience on CDN | $50 plan + ~340 GB × 4 at Bunny's Asia rate of $0.03/GB ≈ $40 | **~$60–100/month** |
| Self-hosted LiveKit later (same code) | One server + its bandwidth | Decide after 3 months of real numbers |

For comparison, Zoom with a 500-seat webinar and host licence comes to about $75–110/month.

**Free or near-free paths, from cheapest to most capable.** All of them sit behind the
same `LiveRoomProvider` seam, so switching costs no rewrite.

| Path | Cost | Seats | Good for | Catch |
|---|---|---|---|---|
| **LiveKit dev server on your PC** (open source) | $0 | Your machine's limit | All development and testing | Not reachable by real learners |
| **LiveKit Cloud "Build" plan** | $0 | 100 at once, 5,000 participant-minutes a month | Small real batches (e.g. 2 classes × 40 people × 60 min) | Not 200; minutes run out fast |
| **Free workshops streamed through YouTube Live (unlisted), embedded in RaKeGa** | $0 | Effectively unlimited | Free or cheap public workshops of any size; chat, Q&A and polls stay on our site | YouTube player and branding; an unlisted link can be shared, so never use it for paid content |
| **Self-hosted LiveKit on an Oracle Cloud "Always Free" VM** | $0 if you get the free VM | Probably 100–200 at low bitrate, **unproven until load-tested** | Paid batches under 200 at $0 | Free-VM capacity is often unavailable; Oracle can reclaim idle VMs; a 2026 blog reports the free ARM allowance being cut. 10 TB/month of free outbound data covers about 70 classes of 200 × 90 min at ~1 Mbps |
| LiveKit Cloud Ship + CDN audience | ~$60–200/month | 500+ | After launch, when a client or learners pay | — |

**So: yes, everything stays at $0 until launch.** Develop on the local server. Run real free
workshops through YouTube embed. Run paid batches under 100 on the free cloud plan, or
under ~200 on a free Oracle VM once load-tested. Paying for live video starts only when
paying learners make it worthwhile. These are estimates from published
prices; the first real class gives the real number. Seat limits are enforced server-side,
and "class is full" is a designed screen.

## 4 · Learn module: recorded courses

- **Video hosting behind a `VideoHost` seam, free first:**
  1. **Development: local files.** Our backend uses ffmpeg to cut each upload into an HLS
     stream and serves it itself. Cost: $0.
  2. **Launch: Cloudflare R2.** The free tier is 10 GB of storage with free egress
     (third-party figures; check Cloudflare's page). That is roughly 10 hours of 720p
     course video, served through short-lived signed links. Cost: $0 at small scale.
  3. **Growth: Bunny Stream.** Storage is about $0.01/GB and delivery in Asia about
     $0.03/GB, with automatic encoding. Move here when the library or audience outgrows R2.

  DRM ($99/month on Bunny) stays off until piracy is a measured problem.
- **Test content during development** (no recording needed, §12): open-licence videos and
  course material, each with its licence recorded.
- **Course shape:** course → modules → lessons (video + notes + a task).
  - Progress tracking, quiz and certificate.
  - The certificate states exactly what was completed. It never claims accreditation
    RaKeGa doesn't have.
- **Levels:** Starter (students, juniors) · Working (professionals) · Owner (business
  owners). Same topics, different examples and depth.
- **AI tutor per course:**
  - Answers only from that course's transcripts and notes, and cites the lesson and
    timestamp.
  - Says "not covered in this course" instead of guessing.
  - Runs on the cheap model tier.

**Launch with 5, add one at a time (10 total):**

| # | Course | Why first |
|---|---|---|
| 1 | Prompting that works, for every level | Entry point for everyone |
| 2 | Claude for real work and coding | Your relative's strongest skill |
| 3 | AI agents and automation workflows (no-code to code) | Highest demand from businesses |
| 4 | Meta Ads from zero to first leads | Matches the agency services |
| 5 | Making videos with AI (scripts, generation, editing) | Big creator demand |
| 6 | Google Ads basics to first conversions | |
| 7 | Instagram growth and automation (within platform rules) | |
| 8 | YouTube channel automation (within platform rules) | |
| 9 | Build a business website with AI in a weekend | |
| 10 | AI for business owners: where it pays, where it doesn't | |

During development every course is filled with **open-licence test content** (§12). Real
courses are recorded only when the platform is ready, so recording never blocks the build.

**Two tiers per course (R3):**

| Tier | Includes |
|---|---|
| **Basic** | Recorded lessons · notes · AI tutor · quiz · completion certificate |
| **Advanced** | Basic + live cohort sessions · projects reviewed by a person · community · recordings of every session |

Prices are set at launch. Until then everything runs in Razorpay test mode.

## 5 · Works module: services + developers earn

- **Catalogue:** fixed-scope packages with price bands, not "contact us for everything".
  The full service list:

| Group | Services |
|---|---|
| **Build** | Websites and landing pages · web apps · **mobile apps (Android/iOS)** · e-commerce stores · business dashboards |
| **AI & automation** | AI chatbots and agents for a business · automation workflows · lead routing (form/registration → WhatsApp or CRM) · Meta lead forms connected to follow-up |
| **Ads & growth** | **Meta Ads** · **Google Ads** · click-to-WhatsApp ads · social media management · basic SEO · monthly performance reports |
| **Content** | Posters and creatives · reels and short videos · **AI-generated videos** · **YouTube channel setup and automation** · **Instagram automation** (within each platform's rules) |
| **Teaching for clients** | Courses made for a client (script, record, edit, host on RaKeGa) · AI workshops for companies and colleges · team training |
| **Care** | Hosting and maintenance plans · monthly retainers |

  Each one becomes a package with scope, deliverables, a timeline and a price band.
  "YouTube/Instagram automation" means scheduling, replies and reporting through the
  platforms' official tools. It never means buying followers or fake engagement, which
  breaks platform rules and gets client accounts banned.
- **Flow:** client picks a package or describes a need → brief → a reviewer confirms
  scope and price → a developer accepts → milestones → reviewer approves each delivery →
  client signs off.
- **Reviewer (R4): you, for now, helped by a review agent.**
  - When a milestone is submitted, the agent checks it against the package checklist
    (pages present, links work, mobile layout, ad account connected, and so on).
  - It then sends you a **delivery record** (what was delivered, checklist result, links,
    screenshots) on **Telegram**.
  - You approve or reject with one tap. The decision is saved on the order.
  - The agent never approves anything itself.
  - Telegram's bot API is free and quick to set up. WhatsApp can come later: it needs Meta
    business verification, and messages the business starts are charged per message.
    Replies inside a customer's 24-hour window are free.
- **Developers:**
  - Join with a short profile plus one real piece of work.
  - Each first job is supervised by a reviewer.
  - A developer's reputation is built only from completed, approved work.
- **Money, start simple:** in v1 the client pays RaKeGa (Razorpay) and RaKeGa pays the
  developer manually against approved milestones.
  - Automatic split payouts and escrow wait until there's real volume.
  - **Before money flows to third parties through the platform, ask a CA** about TDS, GST
    and payout rules. This is not legal or tax advice.

## 6 · Reach module: finding clients without spamming

Goal: a few well-chosen businesses each day get one email that is clearly about *them*.

**How it works:**

1. **Pick a niche.** **First niche (R2): coaching institutes and training centres in
   Vizianagaram, Visakhapatnam and Vijayawada.** They need steady student leads (ads,
   WhatsApp routing, a proper website), and they are natural partners for AI courses, so one
   niche feeds both Works and Learn. They're also local enough to meet in person.
2. **Find businesses from public sources only.** That means business listings, their own
   websites, and the business contact address or form they publish. Never bought lists,
   never personal phone numbers.
3. **Research each business.** Look at its public website and pages (what's missing,
   such as no booking form, slow site or no ads), write down the reason it was picked,
   and match it to one RaKeGa Works package.
4. **Draft one email per business.** It says who we are, why them, one specific
   observation, one offer, the full sender name and address, and a one-click opt-out.
5. **A human approves every email** for the first 200. After that, auto-send only for
   templates that have been approved.
6. **Send:**
   - From your own domain, with SPF, DKIM and DMARC set up.
   - At most `OUTREACH_DAILY_CAP` emails a day (start at 20).
   - At most one follow-up, and never after an opt-out.
7. **Keep a suppression list:** opt-outs are permanent and checked before every send.
   Replies go to a real inbox.

**Never:** WhatsApp, SMS or calls to people who haven't asked (TRAI rules apply to those
channels), scraped personal data, fake "Re:" subjects, invented case studies.

**Law, in short:** India has no blanket ban on B2B cold email. The DPDP Act still applies
to personal data, though, so be transparent, offer an opt-out, keep a reason per contact
and don't scrape. Emailing EU or UK businesses brings GDPR and PECR into play. Confirm
with a lawyer before scaling. Sources: [DPDP cold-email guide](https://puzzleinbox.com/blog/cold-email-india-dpdp-act-2026) ·
[echai.ventures](https://echai.ventures/startingup/cold-outreach/is-it-legal-to-cold-email-people-in-india-and-do-i-need-their-consent-first) ·
[EY on the DPDP Act and Rules](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/pdf/2025/11/dpdp-act-and-rules.pdf).

## 7 · Cycles

Five cycles make the MVP. Then 7 or 9 cycles for more. Founder review after cycles 3 and 5.

| Cycle | Theme | Done means |
|---|---|---|
| 1 | **Foundation** | Sign-in, 6 roles enforced on the server, Razorpay test payments with verified webhook, design direction chosen, all states designed |
| 2 | **Learn** | Upload → HLS → signed playback (local, then R2); course/module/lesson; Basic/Advanced tiers; progress; open-licence test course end to end |
| 3 | **Live** | Stage + Audience room on the local LiveKit server, load-tested with simulated viewers; YouTube-embed mode for free workshops; chat/Q&A/raise-hand; recording → draft lesson automatically |
| 4 | **Works** | Full service catalogue; client brief → reviewer → developer → milestones; review agent → Telegram delivery record → your one-tap approval; developer profiles |
| 5 | **Reach + verify** | Reach agent with human approval, caps, opt-out and suppression; full verification; public launch pages |
| 6–7 | AI tutor per course; certificates; analytics for the teacher |
| 8–9 | Developer payouts automation (after CA advice); self-hosted live rooms if the numbers say so |

## 8 · How RaKeGa and FounderOS help each other

- **RaKeGa Works is FounderOS's first real customer.** Each client order becomes a
  FounderOS run: the debated blueprint, then the built project folder, then delivery.
  What breaks there is what FounderOS fixes next.
- **RaKeGa Learn teaches the method FounderOS uses.** Course 3 (agents and automation)
  can be taught from real FounderOS runs.
- **Reach finds clients for both.**

## 9 · Decisions (recorded 2026-10-12)

| # | Decision | Status |
|---|---|---|
| R1 | Brand | **RaKeGa**, with modules Live · Learn · Works · Reach |
| R2 | First niche for Reach | **Coaching institutes and training centres in Vizianagaram, Visakhapatnam and Vijayawada** (my pick, as you asked) |
| R3 | Course pricing shape | **Basic and Advanced** tiers (§4); amounts set at launch |
| R4 | Who checks deliveries | **You**, with a review agent that sends delivery records to Telegram (WhatsApp later) |
| R5 | Course recording | **Not now.** Development uses open-licence test content (§12) |
| R6 | Spending | **$0 until launch** (§11); paid tiers only when paying learners or clients justify them |

## 10 · References studied

Be10x, Outskill and Graphy: see `docs/research/references/` in the FounderOS repo. LetsUpgrade has a crawler config too; it reportedly built its own live platform because learners tired of Meet/Zoom, the same direction as RaKeGa Live. We study
how they work and never copy their pages, words, prices or design. Crawler configs for all
three are in `Product-Research-Engine/research/competitors/`.

## 11 · Free until launch

Everything below costs nothing while building and testing:

| Need | Free option during development | Free option at small launch |
|---|---|---|
| Code, database, API | Your PC: Node + PostgreSQL (local install or Docker) | Postgres: Neon free tier (about 0.5–1 GB, sleeps when idle) |
| Live classes | LiveKit dev server on your PC | LiveKit Cloud Build (100 at once) · YouTube Live embed for free workshops · Oracle free VM (load-test first) |
| Recorded video | Local files + ffmpeg HLS | Cloudflare R2 free tier (10 GB, free egress) |
| Frontend hosting | `npm run dev` | A free static host (Cloudflare Pages or similar) |
| AI tutor and agents | Labelled simulator, or your free Gemini key | Gemini free tier, with the per-run budget cap |
| Payments | Razorpay **test mode** (no real money) | Razorpay charges only a fee per real payment |
| Delivery records | Telegram bot | Telegram bot |
| Reach emails | Drafts only; nothing sent in development | Your own domain's mailbox, at low volume |

**The one cost you can't avoid at launch is a domain name** (a small yearly fee), and you
need it anyway for a trustworthy brand and for email deliverability. Free tiers change
often; each one is checked again on the day we deploy.

Your plan is sound: build to 100% at $0, deploy, show it working, then ask a client or
investor to fund the paid tiers. The honest limit is that free tiers cap scale (100 live
seats, 10 GB of video, a small database), so the demo must be presented as "proven at
small scale", not "ready for 500".

## 12 · Test content during development (no recording)

Use only content whose licence allows it, and record the licence for every item in
`backend/seed/content-manifest.json` (title, source URL, licence, attribution).

| Use | Source | Licence | Allowed |
|---|---|---|---|
| Test videos (player, upload, HLS, live recording) | Blender Foundation open movies: *Big Buck Bunny*, *Sintel*, *Tears of Steel* | CC BY | Any use, with attribution |
| Sample course structure and notes | MIT OpenCourseWare | CC BY-NC-SA | **Development and testing only, never in a paid course** |
| Lessons in your own voice | Short screen recordings you make yourself | Yours | Anything |

**Rule, enforced in code:** a course can't be published as paid if it contains any seed
item whose licence includes "NC" (non-commercial). Publishing is blocked with the reason
shown. Videos from YouTube channels, or courses from other platforms, are never
downloaded or reused, even for testing.
