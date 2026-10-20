# Reference studies — what we learn from six products

**Written:** 2026-10-12 · **For internal learning only.**
FounderOS's rule still holds: we never benchmark against or name other companies in
product code, copy or marketing (`CLAUDE.md` §1). These notes help us decide what *we*
build. They never go on a landing page.

**FounderOS note (founder's decision, 2026-10-12):** FounderOS is not positioned against
Atoms, Lovable or Replit, and isn't measured by them. We take **ideas for features and
modules** from them (and fill what they're missing), built our own way, never copying their
screens, words or product. The three files below are background reading for that only, and
are left out of the crawl list.

Feature ideas picked so far, each rebuilt the FounderOS way:
- **Talk vs act:** a debate-only run and a build run, chosen up front.
- **Checkpoints with undo:** every agent action can be reverted (also guards against "one
  command wipes my code").
- **Cost before you run:** an estimate plus a confirm step on top of the budget cap.
- **Live preview:** the built project running inside FounderOS.
- **One-click deploy:** a deploy flow that still passes the eject check.
- **Missing in the references, FounderOS's own:** open debate with dissent, receipts, the
  Reference Scanner, and projects that run without FounderOS.

| For | Reference | Why this one | File |
|---|---|---|---|
| FounderOS | Atoms (formerly MGX, by the MetaGPT team) | Closest idea: a role-based AI "team" that plans and builds | [atoms.md](atoms.md) |
| FounderOS | Lovable | The best-known prompt → full-stack app builder | [lovable.md](lovable.md) |
| FounderOS | Replit (Agent) | Build + run + host in one place, with an agent that works on its own | [replit.md](replit.md) |
| RaKeGa | Be10x | Low-price live AI workshops → paid courses, at very large scale in India | [be10x.md](be10x.md) |
| RaKeGa | Outskill | Free live "mastermind" → paid cohorts (the "Skill it" type you mentioned) | [outskill.md](outskill.md) |
| RaKeGa | Graphy | The platform many Indian creators use to sell courses and run live classes | [graphy.md](graphy.md) |

**How sure are these?** Desk research from public sources on 2026-10-12. Prices are mostly
third-party figures that often disagree; each file says so. User-review points are one
group of reviewers' opinions, labelled as such. Next step: run the crawler on each one
(public pages only) and correct these notes from what it captures:

**Gati Rides references** (crawler configs ready; studies written after the first runs):

| Reference | Why |
|---|---|
| Rapido | Indian rides: bike/auto/cab categories, captain side, safety, fare explanations |
| Uber (India pages) | Ride options, safety toolkit, scheduled rides, fleet/business pages |
| TaxiCaller | Dispatch software for taxi operators. This is what Gati actually is, so it's the closest reference |

Zepto was skipped: it is quick-commerce, not rides. Its lesson (promised ETA shown up front)
is already in Gati's queue design.

**Run all seven on your PC** (public pages only, one after another, about 2–4 min each):

```powershell
cd Product-Research-Engine
foreach ($id in 'taxicaller','rapido','uber','be10x','outskill','graphy','letsupgrade') { npm run crawl:gated -- $id }
npm run gate:status
```

Then read each `research/competitors/<id>/intelligence/L1-ui-map.md` and record
`npm run gate:review -- R<n> useful "why"`. If a site blocks automated visits, or its terms
forbid them, don't retry or work around it: read those pages yourself in a normal browser.

```powershell
cd Product-Research-Engine
npm run crawl:gated -- atoms      # then lovable, replit, be10x, outskill, graphy
```
