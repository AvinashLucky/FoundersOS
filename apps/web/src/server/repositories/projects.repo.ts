import { randomUUID } from "node:crypto";
import { getDb, hasMongo } from "../db/mongo";
import type { CreateProjectBody, UpdateProjectBody } from "../validation/projects.schema";
import type { Project } from "@features/projects/types";

/**
 * Projects repository — the data-access boundary. The route handlers depend on
 * this interface, never on Mongo directly, so swapping the store changes nothing
 * upstream. Two implementations are chosen automatically by `getProjectsRepository`.
 * Every method is workspace-scoped: data is always isolated per workspace.
 */
export interface ProjectsRepository {
  list(workspaceId: string, opts?: ListOptions): Promise<Project[]>;
  create(workspaceId: string, input: CreateProjectBody): Promise<Project>;
  get(workspaceId: string, id: string): Promise<Project | null>;
  /** Patch a project (archive/restore). Returns null when not found. */
  update(workspaceId: string, id: string, patch: UpdateProjectBody): Promise<Project | null>;
}

/** Pagination + filtering for list(). Defaults: everything, newest first. */
export interface ListOptions {
  limit?: number;
  offset?: number;
  status?: Project["status"];
}

function page<T>(items: T[], opts?: ListOptions): T[] {
  const offset = Math.max(0, opts?.offset ?? 0);
  const limit = Math.max(1, Math.min(200, opts?.limit ?? 200));
  return items.slice(offset, offset + limit);
}

function newProject(workspaceId: string, input: CreateProjectBody): Project & { workspaceId: string } {
  const now = new Date().toISOString();
  return {
    id: `prj_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    workspaceId,
    name: input.name,
    domain: input.domain,
    status: "active",
    summary: input.summary?.trim() || "A new FounderOS project.",
    createdAt: now,
    updatedAt: now,
  };
}

const strip = <T extends { workspaceId?: string; _id?: unknown }>(doc: T): Project => {
  const { workspaceId: _w, _id: _i, ...rest } = doc as Record<string, unknown>;
  return rest as unknown as Project;
};

// ── In-memory (default when no MONGODB_URI) ───────────────────────────────
class InMemoryProjectsRepository implements ProjectsRepository {
  private store = new Map<string, Array<Project & { workspaceId: string }>>();

  private bucket(workspaceId: string) {
    let b = this.store.get(workspaceId);
    if (!b) {
      b = [newProject(workspaceId, { name: "Atlas", domain: "developer", summary: "Your first project — FounderOS remembers it." })];
      this.store.set(workspaceId, b);
    }
    return b;
  }

  async list(workspaceId: string, opts?: ListOptions): Promise<Project[]> {
    const all = [...this.bucket(workspaceId)]
      .filter((p) => (opts?.status ? p.status === opts.status : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(strip);
    return page(all, opts);
  }
  async create(workspaceId: string, input: CreateProjectBody): Promise<Project> {
    const p = newProject(workspaceId, input);
    this.bucket(workspaceId).unshift(p);
    return strip(p);
  }
  async get(workspaceId: string, id: string): Promise<Project | null> {
    const found = this.bucket(workspaceId).find((p) => p.id === id);
    return found ? strip(found) : null;
  }
  async update(workspaceId: string, id: string, patch: UpdateProjectBody): Promise<Project | null> {
    const found = this.bucket(workspaceId).find((p) => p.id === id);
    if (!found) return null;
    found.status = patch.status;
    found.updatedAt = new Date().toISOString();
    return strip(found);
  }
}

// ── MongoDB (used when MONGODB_URI is set) ────────────────────────────────
class MongoProjectsRepository implements ProjectsRepository {
  private async col() {
    const db = await getDb();
    const col = db.collection<Project & { workspaceId: string }>("projects");
    await col.createIndex({ workspaceId: 1, status: 1, updatedAt: -1 });
    return col;
  }
  async list(workspaceId: string, opts?: ListOptions): Promise<Project[]> {
    const col = await this.col();
    const filter = opts?.status ? { workspaceId, status: opts.status } : { workspaceId };
    const docs = await col
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(Math.max(0, opts?.offset ?? 0))
      .limit(Math.max(1, Math.min(200, opts?.limit ?? 200)))
      .toArray();
    return docs.map(strip);
  }
  async create(workspaceId: string, input: CreateProjectBody): Promise<Project> {
    const col = await this.col();
    const p = newProject(workspaceId, input);
    await col.insertOne(p);
    return strip(p);
  }
  async get(workspaceId: string, id: string): Promise<Project | null> {
    const col = await this.col();
    const doc = await col.findOne({ workspaceId, id });
    return doc ? strip(doc) : null;
  }
  async update(workspaceId: string, id: string, patch: UpdateProjectBody): Promise<Project | null> {
    const col = await this.col();
    const doc = await col.findOneAndUpdate(
      { workspaceId, id },
      { $set: { status: patch.status, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );
    return doc ? strip(doc) : null;
  }
}

// Singleton in-memory store (survives hot-reload via globalThis).
const g = globalThis as unknown as { __projectsRepo?: InMemoryProjectsRepository };
const memoryRepo = (g.__projectsRepo ??= new InMemoryProjectsRepository());

export function getProjectsRepository(): ProjectsRepository {
  return hasMongo() ? new MongoProjectsRepository() : memoryRepo;
}
