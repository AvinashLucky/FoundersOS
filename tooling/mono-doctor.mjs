#!/usr/bin/env node
/**
 * mono-doctor — keeps ONE node_modules at the repo root.
 *
 * Projects pasted in from AI Studio / Stitch / CodeSandbox usually arrive with
 * their own `node_modules` and lockfile. Inside an npm-workspaces monorepo those
 * nested copies are worse than useless: they shadow hoisted packages, duplicate
 * React (breaking hooks), and desync versions.
 *
 * This script REPORTS by default and only deletes with --fix, so it can never
 * surprise you.
 *
 *   node tooling/mono-doctor.mjs         # report
 *   node tooling/mono-doctor.mjs --fix   # remove nested node_modules + lockfiles
 */
import { readdirSync, existsSync, statSync, rmSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const FIX = process.argv.includes("--fix");
const WORKSPACE_DIRS = ["apps", "services", "packages", "plugins"];
const NESTED_LOCKFILES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

const findings = [];

function workspaceFolders() {
  const out = [];
  for (const group of WORKSPACE_DIRS) {
    const base = join(ROOT, group);
    if (!existsSync(base)) continue;
    for (const name of readdirSync(base)) {
      const dir = join(base, name);
      try {
        if (statSync(dir).isDirectory() && existsSync(join(dir, "package.json"))) out.push(dir);
      } catch {
        /* unreadable entry — skip */
      }
    }
  }
  return out;
}

function humanSize(dir) {
  // Cheap estimate: count top-level entries rather than walking the whole tree.
  try {
    return `${readdirSync(dir).filter((e) => !e.startsWith(".")).length} packages`;
  } catch {
    return "unknown size";
  }
}

const folders = workspaceFolders();

if (folders.length === 0) {
  console.log("No workspace packages found yet (apps/*, packages/*, …). Nothing to check.");
  process.exit(0);
}

console.log(`\nmono-doctor — checking ${folders.length} workspace package(s)\n`);

for (const dir of folders) {
  const rel = relative(ROOT, dir);
  const pkgPath = join(dir, "package.json");
  let name = rel;
  try {
    name = JSON.parse(readFileSync(pkgPath, "utf8")).name ?? rel;
  } catch {
    findings.push({ level: "error", rel, msg: "package.json is not valid JSON" });
  }

  const nm = join(dir, "node_modules");
  // Test runners leave an empty node_modules (or one holding only a .vite/.vitest cache)
  // in each package. That shadows nothing, so it isn't a finding; real packages are.
  const hasPackages = existsSync(nm) && readdirSync(nm).some((e) => !e.startsWith("."));
  if (hasPackages) {
    findings.push({
      level: "warn",
      rel,
      msg: `nested node_modules (${humanSize(nm)}) — shadows the hoisted root install`,
      path: nm,
    });
  }

  for (const lock of NESTED_LOCKFILES) {
    const lockPath = join(dir, lock);
    if (existsSync(lockPath)) {
      findings.push({
        level: "warn",
        rel,
        msg: `nested ${lock} — workspaces resolve from the ROOT lockfile only`,
        path: lockPath,
      });
    }
  }

  console.log(`  • ${name}  (${rel})`);
}

console.log("");

if (findings.length === 0) {
  console.log("✓ Clean: a single hoisted node_modules at the repo root. Nothing to fix.\n");
  process.exit(0);
}

for (const f of findings) {
  const tag = f.level === "error" ? "ERROR" : "WARN ";
  console.log(`  ${tag}  ${f.rel}: ${f.msg}`);
}
console.log("");

if (!FIX) {
  console.log("Run `node tooling/mono-doctor.mjs --fix` to remove the nested copies,");
  console.log("then `npm install` once at the repo root.\n");
  process.exit(1);
}

let removed = 0;
for (const f of findings) {
  if (!f.path) continue;
  try {
    rmSync(f.path, { recursive: true, force: true });
    console.log(`  removed  ${relative(ROOT, f.path)}`);
    removed++;
  } catch (err) {
    console.log(`  FAILED   ${relative(ROOT, f.path)} — ${err.message}`);
  }
}

console.log(`\n✓ Removed ${removed} item(s). Now run: npm install   (once, at the repo root)\n`);
