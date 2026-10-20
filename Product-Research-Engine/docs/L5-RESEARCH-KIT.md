# L5 Research Kit — competitor research as Phase 0 of every project
**28 Sep 2026 · reusable across Avion and every future product in `AI_PRODUCT_STARTER_PROMPTS.md`**

## Why this exists

The competitor crawler took ~24 hours and ~99 failed attempts to get working.
Then it was nearly lost: a later session rebuilt it from scratch because nobody
had written down that it existed. Meanwhile InVideo shipped an AI editing agent
(Agent Two) before Avion's editor was done.

Two lessons follow. **Research the top applications before building, not after.**
And **never solve the crawler twice.** This kit is the working engine, packaged
so any new project starts from it.

Everything below was read from the repo on 28 Sep. Nothing in it is remembered.

---

## 1 · The five layers

The engine produces these per competitor, in `competitors/<id>/intelligence/`:

| Layer | What it answers | Output | Avion status (12 Aug) |
|---|---|---|---|
| **L1 · UI Map** | What is on screen: nav, controls, modals, empty/loading/error/paywall states | `L1-ui-map.md/.json` | ✅ written for 5 |
| **L2 · Behavior** | **How a workflow actually runs**, step by step | `L2-behavior-map.md/.json` | ⚠ **stubs only** |
| **L3 · Network** | Which endpoints the UI calls, observed in your own session | `L3-network-map.md/.json` | ❌ never run |
| **L4 · Content** | Templates, presets, featured content, trend system | `L4-content-intelligence.md`, `L4-template-map.json` | ✅ written for 5 |
| **L5 · Synthesis** | What it means for us, and what we do about it | `L5-synthesis.md` | ✅ written for 5 |

Then one cross-competitor layer: `competitors/_final/FINAL-AVION-RESEARCH.md`
and `competitor-matrix.json`.

**The important gap:** for Avion, L2 is empty. L2 is the layer that captures a
competitor's *complex workflow*, which is the raw material for making it simple.
Avion has maps of competitors' screens and catalogues of their presets, but no
recorded step-by-step workflows. Fill L2 first.

---

## 2 · The engine: project-agnostic vs project-specific

**The engine** (copy as-is into any project; `research_Dont Read_Only_After_Approval/`):

| File | Job |
|---|---|
| `explorers/save-session-cdp.js` | **The login solution.** Attaches to Chrome you launched yourself and saves each site's session. |
| `explorers/crawl.js` | Runs the crawl, writes L1–L5 files. Flags: `--auth`, `--network` |
| `lib/crawler-core.js` | Shared crawl mechanics |
| `lib/session-manager.js` | Older launch-based session helper. Superseded for login (Google blocks it). |

**Project-specific** — the only thing you write per project:

`competitors/<id>/config.js`, one per competitor. The fields that matter:

```js
name:             'InVideo AI',
appUrl:           'https://ai.invideo.io/',
publicBaseUrl:    'https://invideo.io',
loginUrlPatterns: ['/login', '/auth', '/signup', '/sign-in'],
// + publicSections / authSections: what to visit and what to capture
```

Copy the closest existing config (Avion has six: heygen, higgsfield, invideo,
kling, openart, runway) and change the URLs and sections. **Don't write one
from a blank file.**

**Separate, newer tools** in `avion-crawler-l5/` (not the L1–L5 engine):
`research-editor.mjs` (guided editor-UI capture) and `crawl.mjs` (gallery URL
collection). They are stricter: GET requests only, and GraphQL and sockets are
blocked. Use them where that safety matters.

---

## 3 · The login method: the one that worked

```powershell
# 1 · kill every Chrome, background process included
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process chrome -ErrorAction SilentlyContinue          # must print NOTHING

# 2 · launch Chrome YOURSELF, with a debug port and a separate profile
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Temp\AvionResearch"

# 3 · in THAT window, log into every competitor by hand. Google works here.

# 4 · save sessions, then crawl
node research/explorers/save-session-cdp.js <id1> <id2> ...
node research/explorers/crawl.js <id> --auth
node research/explorers/crawl.js <id> --auth --network     # adds L3
```

**Symptoms and their meaning:**

- **"Who's using Chrome?" profile picker:** a Chrome survived step 1 and ignored
  the flags. Repeat step 1.
- **`accounts.google.com/v3/signin/rejected`:** you're in a browser Playwright
  launched, not the step-2 window. Start over at step 1.
- **Checking step 2:** `http://localhost:9222/json/version` returns JSON when it
  worked.
- **"No config found — skipping":** the script expects a `research/` folder. In
  Avion it was renamed, so create a junction once:
  `New-Item -ItemType Junction -Path research -Target "research_Dont Read_Only_After_Approval"`

**Why it works:** Google checks how the browser was *launched*. A browser
Playwright starts carries automation markers. A browser you started has none,
and Playwright only connects to it afterwards.

Saved sessions are live logins. Never share them, never paste them anywhere,
and keep them out of git.

---

## 4 · Turning complex workflows into easy ones: the L2 → L5 method

This is the point of the whole kit. For each competitor workflow:

**L2, record it exactly:**

```
Workflow: "Make a 30s product ad"
Step 1  Click New → modal: 4 options           (1 decision)
Step 2  Pick "AI video" → prompt box
Step 3  Type prompt → Generate                 (wait 90s)
Step 4  Preview → Edit → opens timeline
Step 5  Replace scene 3 → media picker → search → select
...
Total: 11 steps · 6 decisions · 2 waits · 1 paywall at step 8
```

Count steps, decisions, waits, dead ends and paywalls. Those numbers are the
evidence.

**L5, answer four questions per workflow:**

1. Which steps exist only because *their* product needs them, not the user?
2. Which decisions could have a sensible default?
3. Where does the user wait, and can that wait be moved or hidden?
4. **Our version: N steps.** State it as a number next to theirs.

"Their 11 steps → our 4" is a claim a demo can check. "Simpler than InVideo" is
not.

Mark every observation **OBSERVED** (seen in the crawl), **DOCUMENTED** (their
docs or demos), **INFERRED**, or **UNKNOWN**. This matches the evidence rules
already in `AI_PRODUCT_STARTER_PROMPTS.md`.

---

## 5 · Phase 0 for a new project, in order

1. **Pick 5–6 top applications** in the category. Include the one most likely to
   ship your feature first; for Avion, that was InVideo.
2. **Copy the engine** (§2) into the new project.
3. **Write one config per competitor**, starting from the closest Avion config.
4. **Log in once** by the §3 method and save all sessions in one pass.
5. **Crawl public first, then `--auth`, then `--auth --network`.**
6. **Fill L2 by hand where the crawler can't reach.** Canvas editors often
   won't expose their internals. Record the workflow yourself using the §4 format.
7. **Write L5 per competitor, then the `_final` synthesis.**
8. **Only then** run Prompt A in `AI_PRODUCT_STARTER_PROMPTS.md`, with the L5
   files as its input.

**Budget:** one competitor per model session. Tell the model to read only this
kit and the outputs, never the crawler source. Reading the source is what burns
a session in ten minutes.

---

## 6 · Boundaries (already in `AI_PRODUCT_STARTER_PROMPTS.md`)

- Crawl only what your own logged-in account can see. A public page is not
  permission to reach private areas.
- L3 is observation of your own session's traffic. Don't replay, call or build
  on a competitor's private endpoints.
- A UI doesn't reveal the backend. Don't claim to know their architecture.
- A missing feature on a public page doesn't prove the competitor lacks it.
- Never click Generate, Publish, pay, or anything that spends credits during a
  crawl. Use test projects.
- Their assets, code and layouts are references, not material. Learn the
  workflow, then design your own.

---

## 7 · Open items for Avion

- **L2 is empty for all six competitors.** It's the highest-value gap for "make
  complex workflows easy."
- **L3 never run.** Needs `--auth --network`.
- **Kling needs a re-crawl.** The `_final` README says it captured the wrong URL.
- **InVideo is at stub level**, and InVideo is the competitor that shipped the
  editing agent first.
- **The engine is not yet copied** into a standalone folder that future projects
  can take. It still lives inside Avion's approval-gated folder.

---

## Not verified

Assembled from files on 28 Sep. The L-layer status is from `FINAL-AVION-RESEARCH.md`
dated 12 Aug and may be stale. No commands in this kit were run by the session
that wrote it.
