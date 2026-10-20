import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Path confinement for on-disk projects.
 * ─────────────────────────────────────────────────────────────────────────
 * Every path FounderOS touches inside `projects/` goes through `resolveInside`,
 * so a slug or manifest field can never walk out of its folder. This is the
 * same boundary the native Build Engine and Workers will rely on later.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** The nearest ancestor whose package.json declares npm workspaces — the monorepo root. */
export function findRepoRoot(start: string = process.cwd()): string | null {
  let dir = path.resolve(start);
  for (;;) {
    const pkg = path.join(dir, "package.json");
    if (existsSync(pkg)) {
      try {
        const parsed: unknown = JSON.parse(readFileSync(pkg, "utf8"));
        if (typeof parsed === "object" && parsed !== null && "workspaces" in parsed) return dir;
      } catch {
        // An unreadable package.json is not the root marker — keep climbing.
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Where on-disk projects live. FOUNDEROS_PROJECTS_DIR overrides it (tests, custom layouts). */
export function defaultProjectsRoot(): string | null {
  const override = process.env.FOUNDEROS_PROJECTS_DIR;
  if (override) return path.resolve(override);
  const root = findRepoRoot();
  return root ? path.join(root, "projects") : null;
}

/** True when `target` is `base` itself or sits underneath it. */
export function isInside(base: string, target: string): boolean {
  const rel = path.relative(path.resolve(base), path.resolve(target));
  if (rel === "") return true;
  return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

/** Resolve `rel` under `base`; null when the result would escape `base`. */
export function resolveInside(base: string, rel: string): string | null {
  const target = path.resolve(base, rel);
  return isInside(base, target) ? target : null;
}

/** Forward-slash relative path for display — never leaks an absolute machine path. */
export function displayPath(base: string, target: string): string {
  return path.relative(base, target).split(path.sep).join("/");
}
