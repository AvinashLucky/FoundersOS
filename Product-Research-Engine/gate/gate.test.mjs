import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { countLeaves, inspectRun, MIN_MD_BYTES } from "./inspect.mjs";
import { appendRun, emptyLedger, gateStatus, renderMarkdown, reviewRun } from "./ledger.mjs";

const PUBLIC = { auth: false, network: false };
const NETWORK = { auth: true, network: true };
const richMd = (title) => `# ${title}\n\n${"Navigation, controls, modals and states observed. ".repeat(20)}\n`;
const richJson = JSON.stringify({ nav: ["Home", "Projects", "Settings"], controls: [{ id: "new", label: "New" }] });

function intelDir(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "gate-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(dir, name), content);
  return dir;
}

test("a fresh, substantial L1 passes a public run", async () => {
  const since = Date.now() - 1000;
  const dir = intelDir({ "L1-ui-map.md": richMd("L1"), "L1-ui-map.json": richJson });
  try {
    const r = await inspectRun(dir, since, PUBLIC, 0);
    assert.equal(r.verdict, "pass", r.reasons.join("; "));
    assert.equal(r.layers.L2.required, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("output left over from an earlier run is stale and fails", async () => {
  const dir = intelDir({ "L1-ui-map.md": richMd("L1"), "L1-ui-map.json": richJson });
  try {
    const old = new Date(Date.now() - 3_600_000);
    utimesSync(path.join(dir, "L1-ui-map.md"), old, old);
    utimesSync(path.join(dir, "L1-ui-map.json"), old, old);
    const r = await inspectRun(dir, Date.now(), PUBLIC, 0);
    assert.equal(r.verdict, "fail");
    assert.ok(r.reasons.some((x) => x.includes("stale")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a non-zero crawler exit fails even with good files", async () => {
  const dir = intelDir({ "L1-ui-map.md": richMd("L1"), "L1-ui-map.json": richJson });
  try {
    const r = await inspectRun(dir, Date.now() - 1000, PUBLIC, 1);
    assert.equal(r.verdict, "fail");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a stub, a tiny file, or invalid JSON fails", async () => {
  const cases = [
    { "L1-ui-map.md": `# L1 — Stub\n${"x".repeat(MIN_MD_BYTES)}`, "L1-ui-map.json": richJson },
    { "L1-ui-map.md": "# L1\nshort", "L1-ui-map.json": richJson },
    { "L1-ui-map.md": richMd("L1"), "L1-ui-map.json": "{ not json" },
  ];
  for (const files of cases) {
    const dir = intelDir(files);
    try {
      assert.equal((await inspectRun(dir, Date.now() - 1000, PUBLIC, 0)).verdict, "fail");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test("a network run requires L3", async () => {
  const dir = intelDir({ "L1-ui-map.md": richMd("L1"), "L1-ui-map.json": richJson });
  try {
    const r = await inspectRun(dir, Date.now() - 1000, NETWORK, 0);
    assert.equal(r.verdict, "fail");
    assert.ok(r.reasons.some((x) => x.startsWith("L3-network-map")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("countLeaves counts non-empty primitives only", () => {
  assert.equal(countLeaves({ a: ["x", "", null, 3], b: { c: true } }), 3);
});

const passRun = (competitor) => ({
  competitor,
  mode: PUBLIC,
  startedAt: "2026-10-02T00:00:00.000Z",
  finishedAt: "2026-10-02T00:01:00.000Z",
  durationSec: 60,
  exitCode: 0,
  verdict: "pass",
  reasons: [],
  layers: {},
});

test("the gate opens only at 7 runs that passed AND were reviewed useful", () => {
  const ledger = emptyLedger();
  for (let i = 0; i < 7; i += 1) appendRun(ledger, passRun(i < 4 ? "runway" : "kling"));
  appendRun(ledger, { ...passRun("openart"), verdict: "fail", reasons: ["crawler exited with code 1"] });

  for (let i = 1; i <= 6; i += 1) reviewRun(ledger, `R${i}`, "useful");
  assert.equal(gateStatus(ledger).open, false);
  assert.equal(gateStatus(ledger).awaitingReview, 1);

  reviewRun(ledger, "R8", "useful"); // a failed run never counts, even if marked useful
  assert.equal(gateStatus(ledger).counted, 6);

  reviewRun(ledger, "R7", "useful");
  const s = gateStatus(ledger);
  assert.equal(s.open, true);
  assert.deepEqual(s.competitors, ["kling", "runway"]);
  assert.match(renderMarkdown(ledger), /OPEN/);
});

test("reviews reject unknown runs and unknown statuses", () => {
  const ledger = emptyLedger();
  appendRun(ledger, passRun("runway"));
  assert.throws(() => reviewRun(ledger, "R9", "useful"));
  assert.throws(() => reviewRun(ledger, "R1", "great"));
});

test("every gate mode hands crawl.js a flag it runs (public used to pass none)", async () => {
  const { crawlerArgs } = await import("./args.mjs");
  assert.deepEqual(crawlerArgs("x", PUBLIC), ["x", "--public"]);
  assert.deepEqual(crawlerArgs("x", { auth: true, network: false }), ["x", "--auth"]);
  assert.deepEqual(crawlerArgs("x", NETWORK), ["x", "--auth", "--network"]);
});
