import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ProjectManifest } from "@/server/validation/project-manifest.schema";
import type {
  EjectCheck,
  EjectCheckId,
  EjectReport,
  EjectViolation,
} from "@features/project-folders/types";
import { displayPath, isInside, resolveInside } from "./paths";

/**
 * Eject verifier — Principle 2 ("no lock-in") made testable.
 * ─────────────────────────────────────────────────────────────────────────
 * A project must run from a bare copy with FounderOS deleted. This scans the
 * project statically and reports every way it could still depend on
 * FounderOS: imports, workspace-protocol deps, paths that escape the folder,
 * FounderOS env vars, undocumented env, and a missing standalone README.
 * It verifies; it never rewrites source. Static analysis can't prove a
 * project *runs* — the gate runner (plan step 3) adds install/build for that.
 * ─────────────────────────────────────────────────────────────────────────
 */

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "out", "coverage", ".turbo"]);
const SOURCE_EXT = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);
const MAX_FILES = 4000;
const MAX_FILE_BYTES = 1_000_000;

/** Provided by every Node/Vite runtime — never need documenting. */
const RUNTIME_ENV = new Set(["NODE_ENV", "PORT", "MODE", "DEV", "PROD", "SSR", "BASE_URL"]);
/** Variables only FounderOS defines; a project needing one is not standalone. */
const FOUNDEROS_ENV = new Set(["RUN_BUDGET_USD"]);
const FOUNDEROS_ENV_PREFIX = "FOUNDEROS_";

const IMPORT_PATTERNS: RegExp[] = [
  /\bfrom\s*["']([^"'\n]+)["']/g,
  /\bimport\s*\(\s*["']([^"'\n]+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"'\n]+)["']\s*\)/g,
  /\bimport\s+["']([^"'\n]+)["']/g,
];
const ENV_PATTERNS: RegExp[] = [
  /\b(?:process\.env|import\.meta\.env)\.([A-Z_][A-Z0-9_]*)/g,
  /\bprocess\.env\[\s*["']([A-Z_][A-Z0-9_]*)["']\s*\]/g,
];
const DEP_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const;

const LABELS: Record<EjectCheckId, string> = {
  "apps-present": "Every app folder has its own package.json",
  "no-founderos-imports": "No @founderos/* imports",
  "no-escaping-imports": "No imports reach outside the project",
  "no-workspace-deps": "No workspace: or out-of-project file: dependencies",
  "no-founderos-env": "No FounderOS environment variables",
  "env-documented": "Every env var is documented in .env.example",
  readme: "Standalone README present",
};

interface ScanState {
  files: string[];
  truncated: boolean;
}

async function walk(dir: string, state: ScanState): Promise<void> {
  if (state.files.length >= MAX_FILES) {
    state.truncated = true;
    return;
  }
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Symlinks are never followed: they are the classic way out of a sandbox.
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await walk(full, state);
    } else if (entry.isFile() && SOURCE_EXT.has(path.extname(entry.name))) {
      if (state.files.length >= MAX_FILES) {
        state.truncated = true;
        return;
      }
      state.files.push(full);
    }
  }
}

function matchAll(source: string, patterns: RegExp[]): string[] {
  const out: string[] = [];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) {
      const captured = m[1];
      if (captured) out.push(captured);
    }
  }
  return out;
}

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

/** Names declared in an .env.example — `KEY=` lines, commented `# KEY=` lines count as documented. */
export function parseEnvExample(text: string): Set<string> {
  const names = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*#?\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=/.exec(line);
    if (m?.[1]) names.add(m[1]);
  }
  return names;
}

function appDirs(manifest: ProjectManifest): string[] {
  const dirs = [manifest.apps.frontend.dir];
  if (manifest.apps.backend) dirs.push(manifest.apps.backend.dir);
  return [...new Set(dirs)];
}

/** Verify a project folder against the eject invariants. */
export async function verifyEject(projectDir: string, manifest: ProjectManifest): Promise<EjectReport> {
  const violations: EjectViolation[] = [];
  const add = (check: EjectCheckId, file: string | null, message: string) =>
    violations.push({ check, file, message });
  const rel = (file: string) => displayPath(projectDir, file);

  // 1 · App folders and their package.json dependencies.
  const documentedEnv = parseEnvExample((await readIfExists(path.join(projectDir, ".env.example"))) ?? "");
  for (const dir of appDirs(manifest)) {
    const appDir = resolveInside(projectDir, dir);
    if (!appDir) {
      add("apps-present", null, `App folder "${dir}" escapes the project`);
      continue;
    }
    const pkgPath = path.join(appDir, "package.json");
    const pkgText = await readIfExists(pkgPath);
    if (pkgText === null) {
      add("apps-present", rel(pkgPath), `App folder "${dir}" has no package.json`);
      continue;
    }
    let pkg: unknown;
    try {
      pkg = JSON.parse(pkgText);
    } catch {
      add("apps-present", rel(pkgPath), "package.json is not valid JSON");
      continue;
    }
    if (typeof pkg !== "object" || pkg === null) continue;
    const record = pkg as Record<string, unknown>;
    for (const field of DEP_FIELDS) {
      const deps = record[field];
      if (typeof deps !== "object" || deps === null) continue;
      for (const [name, spec] of Object.entries(deps as Record<string, unknown>)) {
        if (typeof spec !== "string") continue;
        if (spec.startsWith("workspace:")) {
          add("no-workspace-deps", rel(pkgPath), `${name} uses the workspace: protocol`);
        } else if (spec.startsWith("file:") || spec.startsWith("link:")) {
          const target = spec.replace(/^(file|link):/, "");
          if (!isInside(projectDir, path.resolve(appDir, target))) {
            add("no-workspace-deps", rel(pkgPath), `${name} points outside the project (${spec})`);
          }
        }
        if (name.startsWith("@founderos/")) {
          add("no-founderos-imports", rel(pkgPath), `${name} is a FounderOS package`);
        }
      }
    }
    // An app's own .env.example also documents variables.
    if (appDir !== projectDir) {
      const appEnv = await readIfExists(path.join(appDir, ".env.example"));
      if (appEnv) for (const n of parseEnvExample(appEnv)) documentedEnv.add(n);
    }
  }

  // 2 · Source scan: imports and env usage.
  const state: ScanState = { files: [], truncated: false };
  await walk(projectDir, state);
  const envUses = new Map<string, string>(); // var → first file using it

  for (const file of state.files) {
    const info = await stat(file);
    if (info.size > MAX_FILE_BYTES) continue;
    const source = await readFile(file, "utf8");

    for (const spec of matchAll(source, IMPORT_PATTERNS)) {
      if (spec === "@founderos" || spec.startsWith("@founderos/")) {
        add("no-founderos-imports", rel(file), `imports ${spec}`);
      } else if (spec.startsWith(".")) {
        if (!isInside(projectDir, path.resolve(path.dirname(file), spec))) {
          add("no-escaping-imports", rel(file), `imports ${spec}, which is outside the project`);
        }
      } else if (path.isAbsolute(spec) || /^[a-zA-Z]:[\\/]/.test(spec)) {
        add("no-escaping-imports", rel(file), `imports an absolute path (${spec})`);
      }
    }
    for (const name of matchAll(source, ENV_PATTERNS)) {
      if (!envUses.has(name)) envUses.set(name, rel(file));
    }
  }

  for (const [name, file] of envUses) {
    if (name.startsWith(FOUNDEROS_ENV_PREFIX) || FOUNDEROS_ENV.has(name)) {
      add("no-founderos-env", file, `reads ${name}, a FounderOS variable`);
    } else if (!RUNTIME_ENV.has(name) && !documentedEnv.has(name)) {
      add("env-documented", file, `reads ${name}, which .env.example doesn't document`);
    }
  }

  // 3 · Standalone README.
  const rootEntries = await readdir(projectDir);
  if (!rootEntries.some((n) => n.toLowerCase() === "readme.md")) {
    add("readme", null, "No README.md explaining how to run the project on its own");
  }

  const failed = new Set(violations.map((v) => v.check));
  const checks: EjectCheck[] = (Object.keys(LABELS) as EjectCheckId[]).map((id) => ({
    id,
    label: LABELS[id],
    ok: !failed.has(id),
  }));

  return {
    ok: violations.length === 0 && !state.truncated,
    checkedAt: new Date().toISOString(),
    filesScanned: state.files.length,
    truncated: state.truncated,
    checks,
    violations,
  };
}
