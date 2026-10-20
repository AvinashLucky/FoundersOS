import type { ProjectManifest } from "@/server/validation/project-manifest.schema";

/**
 * Project folders — the on-disk projects FounderOS builds (Track A).
 * These are the shapes the API returns and the UI renders. They are distinct
 * from `Project` (the FounderOS project *record*): a folder is the built,
 * ejectable codebase living in `projects/<slug>/`.
 */
export type { ProjectManifest };

export interface ProjectFolderCommand {
  label: string;
  /** A display-only, copy-ready command. Stage 1 never executes it. */
  command: string;
}

export interface ProjectFolder {
  slug: string;
  manifest: ProjectManifest;
  /** Repo-relative path, e.g. "projects/gati-rides". Never an absolute path. */
  path: string;
  commands: ProjectFolderCommand[];
}

/** An owned folder whose manifest could not be read is still listed — with its error. */
export interface OwnedProjectFolder {
  slug: string;
  folder: ProjectFolder | null;
  error: string | null;
}

export interface UnclaimedProjectFolder {
  slug: string;
  /** The manifest's name when it parses; null when it doesn't. */
  name: string | null;
}

export interface ProjectFolderListing {
  /** False when the projects/ directory can't be found — the degraded state. */
  available: boolean;
  owned: OwnedProjectFolder[];
  unclaimed: UnclaimedProjectFolder[];
}

export type AppPortState = "running" | "stopped";

export interface ProjectFolderStatus {
  slug: string;
  apps: Array<{ role: "frontend" | "backend"; port: number; state: AppPortState; install: InstallState }>;
  checkedAt: string;
}

/**
 * Whether an app's *own* node_modules holds every declared dependency.
 * "incomplete" means it only runs by borrowing packages from a parent folder
 * (e.g. FounderOS's root install) and will break when that install changes.
 */
export type InstallState =
  | { state: "complete" }
  | { state: "incomplete"; missing: string[] }
  | { state: "not-installed" }
  | { state: "unknown"; reason: string };

export type ClaimOutcome = "claimed" | "already-yours" | "owned-elsewhere" | "not-found";

export type EjectCheckId =
  | "apps-present"
  | "no-founderos-imports"
  | "no-escaping-imports"
  | "no-workspace-deps"
  | "no-founderos-env"
  | "env-documented"
  | "readme";

export interface EjectCheck {
  id: EjectCheckId;
  label: string;
  ok: boolean;
}

export interface EjectViolation {
  check: EjectCheckId;
  /** Project-relative file, when the violation points at one. */
  file: string | null;
  message: string;
}

export interface EjectReport {
  ok: boolean;
  checkedAt: string;
  filesScanned: number;
  /** True when the scan hit its file cap — the report then says so instead of claiming "clean". */
  truncated: boolean;
  checks: EjectCheck[];
  violations: EjectViolation[];
}
