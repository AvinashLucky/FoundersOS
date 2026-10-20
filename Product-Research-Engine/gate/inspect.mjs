/**
 * Output inspector for one crawler run.
 * ─────────────────────────────────────────────────────────────────────────
 * Decides, from the files alone, whether a crawl produced real research:
 * the required layer files exist, were written *during this run* (not left
 * over from an earlier one), are not stubs, and carry substance. It never
 * reads or changes the crawler itself. Whether the research is *useful* is
 * a human judgement recorded separately (see ledger.mjs).
 *
 * Thresholds were set before any real output was inspected in this kit.
 * If a clean run fails on size alone, change the constant below and note
 * why in gate/README.md — never loosen the freshness rule.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/** File names per layer, as documented in docs/L5-RESEARCH-KIT.md §1. */
export const LAYER_FILES = {
  L1: ["L1-ui-map.md", "L1-ui-map.json"],
  L2: ["L2-behavior-map.md", "L2-behavior-map.json"],
  L3: ["L3-network-map.md", "L3-network-map.json"],
  L4: ["L4-content-intelligence.md", "L4-template-map.json"],
  L5: ["L5-synthesis.md"],
};

export const MIN_MD_BYTES = 600;
export const MIN_JSON_ITEMS = 5;
/** Filesystems round mtimes; allow a little slack before the run's start. */
export const FRESH_TOLERANCE_MS = 2000;
/** A layer whose opening says it is a stub is not research. */
const STUB_HEAD = /\b(stub|placeholder|not yet (captured|run)|requires crawl run)\b/i;

/** L1 always; L3 when the run captured network traffic. L2/L4/L5 are reported, not required. */
export function requiredLayers(mode) {
  return mode.network ? ["L1", "L3"] : ["L1"];
}

/** Count non-empty primitive values anywhere in a JSON value (capped). */
export function countLeaves(value, cap = 100_000) {
  let n = 0;
  const stack = [value];
  while (stack.length > 0 && n < cap) {
    const v = stack.pop();
    if (Array.isArray(v)) stack.push(...v);
    else if (v !== null && typeof v === "object") stack.push(...Object.values(v));
    else if (typeof v === "string" ? v.trim() !== "" : v !== null && v !== undefined) n += 1;
  }
  return n;
}

export async function inspectFile(dir, name, sinceMs) {
  const file = path.join(dir, name);
  let info;
  try {
    info = await stat(file);
  } catch {
    return { name, exists: false };
  }
  const result = {
    name,
    exists: true,
    bytes: info.size,
    fresh: info.mtimeMs >= sinceMs - FRESH_TOLERANCE_MS,
  };
  const text = await readFile(file, "utf8");
  if (name.endsWith(".json")) {
    try {
      result.jsonValid = true;
      result.items = countLeaves(JSON.parse(text));
    } catch {
      result.jsonValid = false;
      result.items = 0;
    }
  } else {
    result.stub = STUB_HEAD.test(text.slice(0, 500));
  }
  return result;
}

/** Problems with one file, as human-readable reasons. Empty = fine. */
export function fileProblems(f) {
  if (!f.exists) return [`${f.name} is missing`];
  const out = [];
  if (!f.fresh) out.push(`${f.name} was not written by this run (stale)`);
  if (f.name.endsWith(".json")) {
    if (!f.jsonValid) out.push(`${f.name} is not valid JSON`);
    else if (f.items < MIN_JSON_ITEMS) out.push(`${f.name} holds only ${f.items} values (< ${MIN_JSON_ITEMS})`);
  } else {
    if (f.bytes < MIN_MD_BYTES) out.push(`${f.name} is ${f.bytes} bytes (< ${MIN_MD_BYTES})`);
    if (f.stub) out.push(`${f.name} says it is a stub`);
  }
  return out;
}

/**
 * Inspect a finished run.
 * @param {string} intelDir  research/competitors/<id>/intelligence
 * @param {number} sinceMs   when the run started (epoch ms)
 * @param {{auth: boolean, network: boolean}} mode
 * @param {number} exitCode  the crawler's exit code (-1 if killed)
 */
export async function inspectRun(intelDir, sinceMs, mode, exitCode) {
  const required = requiredLayers(mode);
  const reasons = [];
  if (exitCode !== 0) reasons.push(`crawler exited with code ${exitCode}`);

  const layers = {};
  for (const [layer, names] of Object.entries(LAYER_FILES)) {
    const files = [];
    for (const name of names) files.push(await inspectFile(intelDir, name, sinceMs));
    const problems = files.flatMap(fileProblems);
    const isRequired = required.includes(layer);
    layers[layer] = { required: isRequired, ok: problems.length === 0, files, problems };
    if (isRequired) reasons.push(...problems);
  }

  return { verdict: reasons.length === 0 ? "pass" : "fail", reasons, layers };
}
