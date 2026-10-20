# The 7-run gate — when the crawler earns its place in FounderOS

The crawler joins FounderOS only after it has produced real research **seven times**.
Until then it stays a standalone kit, and the ten products do their research with it
directly.

## What counts as one successful run

A run counts only when **both** are true:

1. **Machine check passes** (automatic, in `inspect.mjs`):
   - the crawler exited with code 0;
   - the required layer files exist **and were written during this run** — leftovers
     from an earlier crawl never count;
   - Markdown files are at least 600 bytes and don't open by calling themselves a stub;
   - JSON files parse and hold at least 5 real values.

   | Mode | Required layers | Reported only |
   |---|---|---|
   | public (`crawl:gated -- <id>`) | L1 | L2 · L3 · L4 · L5 |
   | auth (`--auth`) | L1 | L2 · L3 · L4 · L5 |
   | network (`--auth --network`) | L1 · L3 | L2 · L4 · L5 |

   L2 isn't required, because the kit itself says canvas editors and internal tools
   often need L2 recorded by hand (`docs/L5-RESEARCH-KIT.md` §4).

2. **You review it as useful.** Only a person can judge whether it's "that level" of
   research — the level Avion's research reached. Read the files, then record the verdict.

## Commands (from the Product-Research-Engine folder)

```powershell
npm run crawl:gated -- runway                 # public run, inspected and recorded
npm run crawl:gated -- kling --auth --network # logged-in run with network capture
npm run gate:review -- R1 useful "clear nav map, 40+ controls, states captured"
npm run gate:review -- R2 not-useful "only the landing page"
npm run gate:status
npm run test:gate                             # the gate's own tests
```

`crawl:gated` starts the crawler (`research/explorers/crawl.js`) with `--public`, `--auth` or
`--auth --network` (see `args.mjs`), then inspects what it wrote. Fixed 2026-10-12: public runs
used to pass no mode flag, so crawl.js printed its usage and every public run failed. Login setup is exactly as in the main README.

Every run is recorded in `gate/run-ledger.json` and rendered to `gate/RUN-LEDGER.md`:
the competitor, mode, timings, exit code, verdict, reasons, and your review.

## A suggested path to seven

1. **Smoke test** — `runway`, public (the README's own first-run suggestion).
2. **Two more existing configs** — e.g. `kling` and `openart`, public then `--auth`.
3. **Product research** — copy `_TEMPLATE` for the first product's three references
   (LedgerWeave: BlackLine · FloQast · Numeric, public pages only), and crawl those.

Seven counted runs across at least three competitors is a reasonable bar; the gate itself
only counts runs, so the spread is your call.

## When the gate opens

`gate:status` prints **OPEN**. Then the crawler gets integrated into FounderOS as the
Research stage of the Product Factory, and each product's output gets copied into its own
`projects/<slug>/details/research/`.

## Tuning

The size thresholds were set before any real output was inspected. If a run that is
clearly good fails on size alone, change `MIN_MD_BYTES` / `MIN_JSON_ITEMS` in
`inspect.mjs` and write the reason here. Never loosen the freshness rule — it is what
stops an old crawl from counting twice.
