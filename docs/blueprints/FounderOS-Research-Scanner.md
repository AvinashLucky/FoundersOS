# FounderOS module: Reference Scanner

**Status:** planned. It starts when the crawler's 7-run gate opens
(`Product-Research-Engine/gate/`). **Written:** 2026-10-12.

## Why

Today a scan is manual: copy a template, edit a config, run a terminal command, read the
files. The founder's rule is that **every process proven by hand in a project becomes a
FounderOS module**, so it is never done by hand again. The scanner is the first one.

## The flow (what the founder sees)

1. In a project, click **Scan a reference** (it's also in the ⌘K palette).
2. A popup opens. Paste a link, choose **Public pages** or **With my login**, and press Enter.
3. **A browser window opens, launched and controlled by FounderOS.**
   - With login: you sign in yourself, and FounderOS shows "Signed in? Continue".
     The agent never types your password.
4. The agent scans. FounderOS streams live progress: page by page, a screenshot strip and a
   counter.
5. You get a **report card** containing:
   - the Layer-1 UI map;
   - a screenshot gallery;
   - a short AI summary marked "from N pages, M screenshots";
   - what was *not* covered.

   The report is saved to the project's memory and research folder.
6. **Useful / Not useful**: your review, recorded like the gate's review.

## How it's built (reuse first)

| Piece | Reuses |
|---|---|
| Config | `research/lib/site-config.js`. A config is just `{ id, name, publicBaseUrl }`, built from the pasted link with no template editing |
| Crawl + Layer 1 | The existing crawler and gate inspector, unchanged |
| Live progress | FounderOS's SSE pattern (`runs/stream`, `research`) |
| Summary | `ModelRouter`, cheap tier, budget-capped; Echo offline, labelled as such |
| Storage | The project's research folder + a project-memory note with the receipt (pages, time, model, cost) |
| UI | `features/research` gains a "Scan" mode; `shared/ui` Surface/Button; five states |

**"Browser inside FounderOS":** this ships in two steps.

- **v1** opens a real Chromium window driven by FounderOS on your machine. That's simple,
  and logins work normally.
- **v2** streams that window *into* the FounderOS page (Chrome DevTools screencast plus
  forwarded clicks and keys), so it looks like a browser tab inside FounderOS.

## Guards (non-negotiable)

- `sameOrigin` + session + rate limit (1 scan at a time per workspace); zod on the link.
- **http/https only; private, local and internal addresses refused.** Without this, a
  pasted link could make the server fetch internal URLs (SSRF).
- Saved logins stay on your machine (Playwright storage state), are never sent to a model
  or logged, and can be deleted per site in one click.
- No network capture by default. If a site blocks automation, the scan stops and says so.
  It never retries around a block.
- Public pages and your own account only. Never payments, OTP screens or other people's data.

## Done means

From one pasted link: scan → report in under 5 minutes; Layer 1 passes the gate's own
check; report saved with a receipt; all five states designed; tests for the URL guard
(public, private, IPv6 and localhost cases), config-from-link and report rendering.
