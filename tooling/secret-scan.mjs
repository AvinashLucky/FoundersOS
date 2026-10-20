#!/usr/bin/env node
/**
 * secret-scan — run before every push: `npm run secrets:check`.
 * Walks the repo (skipping dependencies, build output and the env files that are
 * meant to hold secrets and are git-ignored) and fails if any file contains
 * something shaped like an API key. Prints file + line + key TYPE only — never
 * the key itself — so the output is safe to paste anywhere.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", "test-results", "playwright-report", "out", ".turbo"]);
// Files that are SUPPOSED to hold secrets; they are git-ignored.
const SECRET_HOMES = [/^\.env$/, /^\.env\..*\.local$/, /^\.env\.local$/, /^\.env\.research$/];
const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|pdf|zip|skill|mp4|webm|lock)$/i;
const SHAPES = [
  ["Google key", /AQ\.[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}/],
  ["Groq key", /gsk_[A-Za-z0-9]{20,}/],
  ["OpenAI/OpenRouter/SiliconFlow key", /\bsk-[A-Za-z0-9-]{20,}/],
  ["Tavily key", /tvly-[A-Za-z0-9-]{20,}/],
  ["Mistral key", /mstrl_[A-Za-z0-9_]{20,}/],
  ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["Private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

const findings = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name) && !name.startsWith("browser-sessions")) walk(full);
      continue;
    }
    if (SECRET_HOMES.some((re) => re.test(name)) || BINARY.test(name) || st.size > 2_000_000) continue;
    const lines = readFileSync(full, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const [type, re] of SHAPES) {
        if (re.test(line)) findings.push(`${path.relative(ROOT, full)}:${i + 1}  ${type}`);
      }
    });
  }
}

walk(ROOT);
if (findings.length) {
  console.error(`\n✖ Possible secrets in ${findings.length} place(s) — move them to .env.local and rotate them:\n`);
  for (const f of findings) console.error(`  ${f}`);
  console.error("");
  process.exit(1);
}
console.log("✓ No key-shaped strings outside git-ignored env files.");
