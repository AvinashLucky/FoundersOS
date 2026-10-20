import { existsSync } from "node:fs";
import { readdir, readFile, realpath, rename, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { z } from "zod";
import {
  projectManifestSchema,
  projectSlugSchema,
  type ProjectManifest,
} from "@/server/validation/project-manifest.schema";
import type {
  ClaimOutcome,
  EjectReport,
  OwnedProjectFolder,
  ProjectFolder,
  ProjectFolderListing,
  ProjectFolderStatus,
  UnclaimedProjectFolder,
} from "@features/project-folders/types";
import { verifyEject } from "./eject";
import { inspectInstall } from "./install";
import { defaultProjectsRoot, isInside, resolveInside } from "./paths";

/**
 * Project-folder registry — Track A, Stage 1 ("detect & direct").
 * ─────────────────────────────────────────────────────────────────────────
 * Reads `projects/<slug>/project.json`, reports which ports answer, verifies
 * eject invariants, and records which workspace owns which folder. It never
 * spawns processes: long-lived dev servers don't belong inside a Next.js
 * request (that is Stage 2's local runner).
 *
 * Workspace scoping (CLAUDE.md §6): ownership lives in `projects/.owners.json`,
 * *outside* every project, so an ejected copy carries nothing of FounderOS.
 * A folder nobody owns is listed by slug + name only and must be claimed
 * before its details, status or eject report are visible. First claim wins —
 * this is a local, single-machine store (see known issues).
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface ProjectFolderRegistry {
  list(workspaceId: string): Promise<ProjectFolderListing>;
  get(workspaceId: string, slug: string): Promise<ProjectFolder | null>;
  claim(workspaceId: string, slug: string): Promise<ClaimOutcome>;
  status(workspaceId: string, slug: string): Promise<ProjectFolderStatus | null>;
  /** Runs the eject verifier; on a clean report stamps `eject.verifiedAt` in the manifest. */
  verifyEject(workspaceId: string, slug: string): Promise<EjectReport | null>;
}

export class OwnersIndexError extends Error {
  constructor() {
    super("projects/.owners.json is unreadable — fix or delete it to re-claim folders");
    this.name = "OwnersIndexError";
  }
}

const OWNERS_FILE = ".owners.json";
const ownersSchema = z.object({
  version: z.literal(1),
  owners: z.record(projectSlugSchema, z.string().min(1).max(64)),
});
type OwnersIndex = z.infer<typeof ownersSchema>;

type ManifestRead = { ok: true; manifest: ProjectManifest } | { ok: false; error: string };

/** Is anything accepting TCP connections on this local port? */
export function probePort(port: number, timeoutMs = 350): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" });
    const done = (open: boolean) => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

function commandsFor(slug: string, m: ProjectManifest): ProjectFolder["commands"] {
  const cd = (dir: string) => (dir === "." ? `cd projects/${slug}` : `cd projects/${slug}/${dir}`);
  const out: ProjectFolder["commands"] = [
    { label: "Install", command: `${cd(m.apps.frontend.dir)} && ${m.apps.frontend.install}` },
    { label: m.apps.backend ? "Run frontend" : "Run", command: `${cd(m.apps.frontend.dir)} && ${m.apps.frontend.dev}` },
  ];
  if (m.apps.backend) {
    out.push({ label: "Install backend", command: `${cd(m.apps.backend.dir)} && ${m.apps.backend.install}` });
    out.push({ label: "Run backend", command: `${cd(m.apps.backend.dir)} && ${m.apps.backend.dev}` });
  }
  return out;
}

class DiskProjectFolderRegistry implements ProjectFolderRegistry {
  /** Serialises owner-index writes so two claims can't interleave. */
  private writeChain: Promise<unknown> = Promise.resolve();

  constructor(private readonly root: string | null) {}

  private available(): boolean {
    return this.root !== null && existsSync(this.root);
  }

  /** Resolve a slug to its folder, rejecting bad slugs and symlinked escapes. */
  private async folderPath(slug: string): Promise<string | null> {
    if (!this.root || !projectSlugSchema.safeParse(slug).success) return null;
    const dir = path.join(this.root, slug);
    try {
      const [realRoot, realDir] = await Promise.all([realpath(this.root), realpath(dir)]);
      return realDir !== realRoot && isInside(realRoot, realDir) ? dir : null;
    } catch {
      return null;
    }
  }

  private async slugs(): Promise<string[]> {
    if (!this.root || !this.available()) return [];
    const entries = await readdir(this.root, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && projectSlugSchema.safeParse(e.name).success)
      .map((e) => e.name)
      .sort();
  }

  private async readOwners(): Promise<OwnersIndex> {
    if (!this.root) return { version: 1, owners: {} };
    let text: string;
    try {
      text = await readFile(path.join(this.root, OWNERS_FILE), "utf8");
    } catch {
      return { version: 1, owners: {} }; // no index yet — nothing claimed
    }
    try {
      const parsed = ownersSchema.safeParse(JSON.parse(text));
      if (parsed.success) return parsed.data;
    } catch {
      // fall through
    }
    // A corrupt index must not silently reset ownership (that would let anyone re-claim).
    throw new OwnersIndexError();
  }

  private async writeOwners(index: OwnersIndex): Promise<void> {
    if (!this.root) return;
    const file = path.join(this.root, OWNERS_FILE);
    const tmp = `${file}.tmp`;
    await writeFile(tmp, `${JSON.stringify(index, null, 2)}\n`, "utf8");
    await rename(tmp, file); // atomic replace
  }

  private async readManifest(dir: string): Promise<ManifestRead> {
    let text: string;
    try {
      text = await readFile(path.join(dir, "project.json"), "utf8");
    } catch {
      return { ok: false, error: "No project.json in this folder" };
    }
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false, error: "project.json is not valid JSON" };
    }
    const parsed = projectManifestSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = issue?.path.join(".") || "manifest";
      return { ok: false, error: `project.json · ${where}: ${issue?.message ?? "invalid"}` };
    }
    return { ok: true, manifest: parsed.data };
  }

  private toFolder(slug: string, manifest: ProjectManifest): ProjectFolder {
    return { slug, manifest, path: `projects/${slug}`, commands: commandsFor(slug, manifest) };
  }

  /** The owned folder + manifest, or null when not owned by this workspace / unreadable. */
  private async owned(workspaceId: string, slug: string): Promise<{ dir: string; manifest: ProjectManifest } | null> {
    const dir = await this.folderPath(slug);
    if (!dir) return null;
    const owners = await this.readOwners();
    if (owners.owners[slug] !== workspaceId) return null;
    const read = await this.readManifest(dir);
    return read.ok ? { dir, manifest: read.manifest } : null;
  }

  async list(workspaceId: string): Promise<ProjectFolderListing> {
    if (!this.available()) return { available: false, owned: [], unclaimed: [] };
    const owners = await this.readOwners();
    const owned: OwnedProjectFolder[] = [];
    const unclaimed: UnclaimedProjectFolder[] = [];

    for (const slug of await this.slugs()) {
      const owner = owners.owners[slug];
      if (owner && owner !== workspaceId) continue; // another workspace's folder: invisible
      const dir = await this.folderPath(slug);
      if (!dir) continue;
      const read = await this.readManifest(dir);
      if (owner === workspaceId) {
        owned.push(
          read.ok
            ? { slug, folder: this.toFolder(slug, read.manifest), error: null }
            : { slug, folder: null, error: read.error },
        );
      } else {
        unclaimed.push({ slug, name: read.ok ? read.manifest.name : null });
      }
    }
    return { available: true, owned, unclaimed };
  }

  async get(workspaceId: string, slug: string): Promise<ProjectFolder | null> {
    const hit = await this.owned(workspaceId, slug);
    return hit ? this.toFolder(slug, hit.manifest) : null;
  }

  async claim(workspaceId: string, slug: string): Promise<ClaimOutcome> {
    const run = async (): Promise<ClaimOutcome> => {
      if (!(await this.folderPath(slug))) return "not-found";
      const index = await this.readOwners();
      const owner = index.owners[slug];
      if (owner === workspaceId) return "already-yours";
      if (owner) return "owned-elsewhere";
      await this.writeOwners({ version: 1, owners: { ...index.owners, [slug]: workspaceId } });
      return "claimed";
    };
    const result = this.writeChain.then(run, run);
    this.writeChain = result.catch(() => undefined);
    return result;
  }

  async status(workspaceId: string, slug: string): Promise<ProjectFolderStatus | null> {
    const hit = await this.owned(workspaceId, slug);
    if (!hit) return null;
    const { frontend, backend } = hit.manifest.apps;
    const specs = backend
      ? ([["frontend", frontend], ["backend", backend]] as const)
      : ([["frontend", frontend]] as const);
    const apps: ProjectFolderStatus["apps"] = [];
    for (const [role, spec] of specs) {
      const appDir = resolveInside(hit.dir, spec.dir);
      apps.push({
        role,
        port: spec.port,
        state: (await probePort(spec.port)) ? "running" : "stopped",
        install: appDir ? await inspectInstall(appDir) : { state: "unknown", reason: "app folder escapes the project" },
      });
    }
    return { slug, apps, checkedAt: new Date().toISOString() };
  }

  async verifyEject(workspaceId: string, slug: string): Promise<EjectReport | null> {
    const hit = await this.owned(workspaceId, slug);
    if (!hit) return null;
    const report = await verifyEject(hit.dir, hit.manifest);
    if (report.ok) {
      const stamped: ProjectManifest = {
        ...hit.manifest,
        eject: { ...hit.manifest.eject, verifiedAt: report.checkedAt },
      };
      await writeFile(path.join(hit.dir, "project.json"), `${JSON.stringify(stamped, null, 2)}\n`, "utf8");
    }
    return report;
  }
}

/** Build a registry over an explicit root (tests) — null root means "no projects/ found". */
export function createProjectFolderRegistry(root: string | null): ProjectFolderRegistry {
  return new DiskProjectFolderRegistry(root);
}

const g = globalThis as unknown as { __projectFolderRegistry?: { root: string | null; registry: ProjectFolderRegistry } };

/** The app-wide registry, rebuilt only if the projects root changes. */
export function getProjectFolderRegistry(): ProjectFolderRegistry {
  const root = defaultProjectsRoot();
  if (!g.__projectFolderRegistry || g.__projectFolderRegistry.root !== root) {
    g.__projectFolderRegistry = { root, registry: createProjectFolderRegistry(root) };
  }
  return g.__projectFolderRegistry.registry;
}
