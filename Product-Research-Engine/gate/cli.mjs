#!/usr/bin/env node
/**
 * The 7-run gate CLI.
 *
 *   npm run crawl:gated -- <id> [--auth] [--network]   run the crawler, inspect, record
 *   npm run gate:review -- <runId> useful|not-useful [note]
 *   npm run gate:status
 *
 * `run` starts the existing crawler (research/explorers/crawl.js) as a child
 * process with the flags crawl.js expects (see args.mjs) — it wraps the engine,
 * it doesn't change it.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crawlerArgs } from "./args.mjs";
import { inspectRun } from "./inspect.mjs";
import { appendRun, gateStatus, loadLedger, renderMarkdown, reviewRun, saveLedger } from "./ledger.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_JSON = path.join(KIT, "gate", "run-ledger.json");
const LEDGER_MD = path.join(KIT, "gate", "RUN-LEDGER.md");
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,40}$/;

async function persist(ledger) {
  await saveLedger(LEDGER_JSON, ledger);
  await writeFile(LEDGER_MD, renderMarkdown(ledger), "utf8");
}

function printStatus(ledger) {
  const s = gateStatus(ledger);
  console.log(`\nGate: ${s.counted}/${s.threshold} counted runs${s.open ? " — OPEN: cleared for FounderOS integration" : ""}`);
  console.log(`  awaiting review: ${s.awaitingReview} · failed: ${s.failed} · total: ${s.total}`);
  if (s.competitors.length) console.log(`  competitors counted: ${s.competitors.join(", ")}`);
  console.log(`  ledger: gate/RUN-LEDGER.md\n`);
}

function runCrawler(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join("research", "explorers", "crawl.js"), ...args], {
      cwd: KIT,
      stdio: "inherit",
    });
    child.on("error", () => resolve(-1));
    child.on("close", (code) => resolve(code ?? -1));
  });
}

async function cmdRun(argv) {
  const id = argv[0];
  const flags = argv.slice(1);
  const unknown = flags.filter((f) => f !== "--auth" && f !== "--network");
  if (!id || !ID_PATTERN.test(id) || unknown.length) {
    throw new Error("usage: npm run crawl:gated -- <competitor-id> [--auth] [--network]");
  }
  if (!existsSync(path.join(KIT, "research", "competitors", id, "config.js"))) {
    throw new Error(`no config at research/competitors/${id}/config.js — copy _TEMPLATE first`);
  }
  const mode = { auth: flags.includes("--auth") || flags.includes("--network"), network: flags.includes("--network") };

  const ledger = await loadLedger(LEDGER_JSON);
  const started = new Date();
  console.log(`\n▶ gated crawl: ${id} (${mode.network ? "auth+network" : mode.auth ? "auth" : "public"})\n`);
  const exitCode = await runCrawler(crawlerArgs(id, mode));
  const finished = new Date();

  const intelDir = path.join(KIT, "research", "competitors", id, "intelligence");
  const result = await inspectRun(intelDir, started.getTime(), mode, exitCode);
  const entry = appendRun(ledger, {
    competitor: id,
    mode,
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    durationSec: Math.round((finished.getTime() - started.getTime()) / 1000),
    exitCode,
    verdict: result.verdict,
    reasons: result.reasons,
    layers: Object.fromEntries(
      Object.entries(result.layers).map(([k, v]) => [k, { required: v.required, ok: v.ok, problems: v.problems }]),
    ),
  });
  await persist(ledger);

  console.log(`\n■ ${entry.id} · ${entry.verdict.toUpperCase()}`);
  for (const [layer, v] of Object.entries(result.layers)) {
    const absent = v.files.every((f) => !f.exists);
    if (v.ok) console.log(`  ✓ ${layer}${v.required ? " (required)" : ""}`);
    else if (v.required) console.log(`  ✕ ${layer} (required) — ${v.problems.join("; ")}`);
    else if (absent) console.log(`  · ${layer} — not produced (reported only)`);
    else console.log(`  ! ${layer} — ${v.problems.join("; ")} (reported only)`);
  }
  if (entry.verdict === "pass") {
    console.log(`\n  Read the files in research/competitors/${id}/intelligence/, then record your judgement:`);
    console.log(`  npm run gate:review -- ${entry.id} useful "what made it good"`);
  }
  printStatus(ledger);
  return entry.verdict === "pass" ? 0 : 1;
}

async function cmdReview(argv) {
  const [id, status, ...note] = argv;
  if (!id || !status) throw new Error("usage: npm run gate:review -- <runId> useful|not-useful [note]");
  const ledger = await loadLedger(LEDGER_JSON);
  const run = reviewRun(ledger, id, status, note.join(" "));
  await persist(ledger);
  console.log(`${run.id} marked ${status}${run.verdict === "fail" ? " (failed the automatic check — it still doesn't count)" : ""}`);
  printStatus(ledger);
  return 0;
}

async function cmdStatus() {
  printStatus(await loadLedger(LEDGER_JSON));
  return 0;
}

const [command, ...rest] = process.argv.slice(2);
const commands = { run: cmdRun, review: cmdReview, status: cmdStatus };
const handler = commands[command];
if (!handler) {
  console.error("commands: run <id> [--auth] [--network] · review <runId> useful|not-useful [note] · status");
  process.exit(2);
}
handler(rest)
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`✕ ${err.message}`);
    process.exit(1);
  });
