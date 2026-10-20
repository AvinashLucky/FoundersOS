import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { InstallState } from "@features/project-folders/types";

/**
 * Install completeness for one app folder.
 * ─────────────────────────────────────────────────────────────────────────
 * Node resolves packages by walking *up* the directory tree, so an app inside
 * the FounderOS folder can run while its own node_modules is missing packages
 * — it silently borrows them from FounderOS's root install. That is exactly
 * how Gati Rides kept running after it left the workspaces, until the next
 * root install would have pruned what it was borrowing. This check looks only
 * at the app's *own* node_modules, never at what Node would resolve.
 * ─────────────────────────────────────────────────────────────────────────
 */

const DEP_FIELDS = ["dependencies", "devDependencies"] as const;
/** A package name: optional @scope/ then a name — anything else is never joined into a path. */
const PACKAGE_NAME = /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/i;

export async function inspectInstall(appDir: string): Promise<InstallState> {
  let pkg: unknown;
  try {
    pkg = JSON.parse(await readFile(path.join(appDir, "package.json"), "utf8"));
  } catch {
    return { state: "unknown", reason: "no readable package.json" };
  }
  if (typeof pkg !== "object" || pkg === null) return { state: "unknown", reason: "package.json is not an object" };

  const declared = new Set<string>();
  for (const field of DEP_FIELDS) {
    const deps = (pkg as Record<string, unknown>)[field];
    if (typeof deps === "object" && deps !== null) {
      for (const name of Object.keys(deps)) if (PACKAGE_NAME.test(name)) declared.add(name);
    }
  }

  const ownModules = path.join(appDir, "node_modules");
  if (declared.size > 0 && !existsSync(ownModules)) return { state: "not-installed" };

  const missing = [...declared]
    .filter((name) => !existsSync(path.join(ownModules, name, "package.json")))
    .sort();
  return missing.length === 0 ? { state: "complete" } : { state: "incomplete", missing };
}
