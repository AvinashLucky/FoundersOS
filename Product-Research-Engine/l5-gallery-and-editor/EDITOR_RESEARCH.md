# Editor research — a usable evidence collection mode

27 Sep. Separate from gallery crawling and the Avion app. No generation, uploads, exports or publishing. No competitor media downloads. Existing gallery output/auth behavior stays separate.

## Run in PowerShell, from this folder

```powershell
node --test core.test.mjs research-core.test.mjs
node --test research-fixture.test.mjs
node research-editor.mjs --help
```

For a gated editor, sign in yourself once in the helper's Chrome window:

```powershell
python save_auth.py invideo-editor
# Or: python save_auth.py veed
node research-editor.mjs invideo-editor --url "YOUR_EDITOR_URL" --auth
```

Use the site's public route without `--auth` when it exposes the desired UI. The research URL drops query/fragment values, including `agentBrief`, to avoid replaying a prompt. You may need to open your existing scratch timeline manually. This runner does not reuse the Codex browser session or read `browser-sessions/` or `playwright-auth.json`.

No recordings during login. Auth remains under LOCALAPPDATA outside OneDrive using the existing helper; never share that state. Screenshots are not guaranteed to redact arbitrary canvas text: use TEST projects, hide account details, inspect before sharing. Inputs/common account widgets are masked automatically.

## Actual workflow

1. Open a panel with `open media`. Only a unique, visible enabled button/tab with an exact approved label can be clicked. Unknown/ambiguous controls stop; no guessed coordinates, retries or “click every button”.
2. Inspect the visible result, then `capture media library`. Screenshots and visible controls/heading/state labels are stored together. For canvas-only UI, open the panel by hand and capture it. This is guided evidence, not a fabricated DOM inventory.
3. For a catalogue, first identify its actual tile and scrolling-container selectors from the rendered DOM. Restart with `--catalog-selector ".verified-tile" --scroll-selector ".verified-scroll-container"`, replacing those example selectors. Run `scan transitions catalogue`. It captures and deduplicates visible entries while scrolling; stops at the end, repeated content or the budget. No selectors means no automatic catalogue-completeness claim.
4. `note markers range-markers still need checking` preserves a gap without claiming verification. `status` shows coverage; `quit` saves the report. Repeated identical DOM captures reuse evidence; canvas states are recaptured because their pixels can change without DOM changes.

Topics: Media, Timeline, Markers, Transitions, Effects, Audio, Captions, Inspector, Keyframes, Color, Agent, range editing, insert/replace, Review and recovery. Each topic can have many named states. Capture empty/selected/multiselect/disabled states, settings and transitions between panels—not just landing pages. Missing states remain unknown.

The catalogue is a list of **observed labels**, not copied implementations, downloaded presets or tested render outputs. Video/audio effects should be separate named captures. Visible catalogue totals do not prove the entire library was collected.

## Outputs and hard bounds

`output/editor-research/<site>/` (gitignored):

- PNG screenshots; `evidence.json` with source, timestamp, measured viewport, DOM labels and limitations.
- `catalogue.json`: deduplicated entries and screenshot provenance.
- `coverage.json`, `REPORT.md`: observed versus missing states, blocked controls and request/socket counts.
- Existing evidence is retained; a lock prevents concurrent writes. After a crash, verify no runner is alive before manually clearing its lock. Never remove the whole output folder.

Defaults: one page, 15 minutes, 60 screenshots, eight scroll rounds with 1.2 seconds between scrolls. Explicit caps: 60 minutes/200 captures/20 scroll rounds. These are work budgets, not “100% research”. No feature is marked functional merely because it was captured. No zoom/mobile work unless it answers the specific design question.

## Safety limitation that matters for InVideo

Only GET/HEAD resources are allowed, with mutation/media endpoints blocked; GraphQL and sockets are blocked. No requests/response bodies, credentials, headers or network recordings are stored. Respect robots policy, access denial and rate limits. This can stop a canvas/remote editor from loading. Do not disable safeguards to force it through: record the limitation and use owner-supplied screenshots/recording plus public documentation. The runner is not proof of zero possible side effects for every unknown GET endpoint; use an approved scratch project. It never programmatically applies edits or calls paid actions.

## Turn research into an Avion decision

For each capability record: creator task → input/selection → control → visible result → duration/undo behavior → evidence → Avion decision → acceptance test. Separate OBSERVED, DOCUMENTED and UNKNOWN. Private architecture stays unknown.

Research execution order:
1. Manual edit: import → full clip → split/range → ripple/delete → insert/replace → preview.
2. Visual craft: selected-object tools → layers/keyframes → effects → transition handles/duration.
3. Sound/story: markers → captions → sound library versus processors → mix.
4. AI and agent: scope/context → proposal → affected clips → accept/reject → undo/recovery. Study demos; do not execute billable prompts.
5. Delivery: inspect settings only; prove Avion's own output with TEST media later.

## YouTube research already obtained (no need to re-fetch)

[Official Agent Two demonstration](https://www.youtube.com/watch?v=QiV6CIVRAbQ), transcript read 27 Sep:

| Timestamp | Presented workflow | Avion research question |
|---|---|---|
| 1:17–1:51 | Rough cut checked against project context/shot list | Can suggestions point to exact missing beats without silently editing? |
| 1:57–2:38 | Missing B-roll generated and placed | Can existing owned footage satisfy the gap first? Keep generation separate |
| 2:46–3:23 | Lighting/motion references guide shots | Which parts are local effects and which require synthesis? |
| 3:29–4:01 | Ad structure reused for different products | How does persistent DNA map structure onto the user's own assets? |

For additional editing tutorials, choose one ad breakdown and one narrative editing breakdown with demonstrable before/after decisions. Record source URL, creator, observation date and visible view count if ranking by views; never label a search result “top viewed” without that evidence. Read available transcripts, annotate selected timestamps and techniques; do not download footage or collect a hundred redundant tutorials. Cap the initial research set at three useful demos, then turn lessons into one testable Edit design.

## Status

28 Sep verification: `node --test avion-crawler-l5/core.test.mjs avion-crawler-l5/research-core.test.mjs avion-crawler-l5/research-fixture.test.mjs` passed **17/17**, including headless system Chrome with synthetic inline TEST content (no site navigation). Runner syntax check and `--help` succeeded. Scoped `git diff --check` passed. The CLI imports and calls `inspectPage`, `openPanel`, `coverage`, and `makeReport`; these are not test-only helpers.

No full authenticated competitor crawl, complete preset inventory, or Avion redesign is claimed. Actual login/session reuse, network-policy compatibility and full CLI capture loop on a competitor remain unverified. The next deliverable from a live run is the evidence folder—not another speculative plan. Independent review and owner acceptance remain pending.
