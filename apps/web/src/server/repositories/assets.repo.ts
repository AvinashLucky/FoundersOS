import { randomUUID } from "node:crypto";
import { getDb, hasMongo } from "../db/mongo";

/**
 * Visual memory — screenshots/images attached to a project (Phase 5 seed).
 * In dev we store a small data-URL inline; in production this becomes an object
 * storage key (S3/R2) with only the URL kept here. The `caption` is the human
 * meaning; when a vision key is configured, an analysis can enrich it later.
 */
export interface VisualMemory {
  id: string;
  projectId: string;
  name: string;
  /** data:image/...;base64 (dev) or an object-storage URL (prod). */
  src: string;
  caption: string;
  createdAt: string;
}

type Stored = VisualMemory & { workspaceId: string };
const strip = ({ workspaceId: _w, ...a }: Stored): VisualMemory => a;

export interface AssetsRepository {
  list(workspaceId: string, projectId: string): Promise<VisualMemory[]>;
  add(workspaceId: string, projectId: string, input: { name: string; src: string; caption: string }): Promise<VisualMemory>;
}

class InMemoryAssetsRepository implements AssetsRepository {
  private items: Stored[] = [];
  async list(workspaceId: string, projectId: string): Promise<VisualMemory[]> {
    return this.items
      .filter((a) => a.workspaceId === workspaceId && a.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(strip);
  }
  async add(workspaceId: string, projectId: string, input: { name: string; src: string; caption: string }) {
    const asset: Stored = {
      id: `vis_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      workspaceId, projectId, name: input.name, src: input.src,
      caption: input.caption, createdAt: new Date().toISOString(),
    };
    this.items.unshift(asset);
    return strip(asset);
  }
}

class MongoAssetsRepository implements AssetsRepository {
  private async col() {
    const db = await getDb();
    const col = db.collection<Stored>("visual_memory");
    await col.createIndex({ workspaceId: 1, projectId: 1, createdAt: -1 });
    return col;
  }
  async list(workspaceId: string, projectId: string): Promise<VisualMemory[]> {
    const col = await this.col();
    return (await col.find({ workspaceId, projectId }).sort({ createdAt: -1 }).toArray()).map(strip);
  }
  async add(workspaceId: string, projectId: string, input: { name: string; src: string; caption: string }) {
    const col = await this.col();
    const asset: Stored = {
      id: `vis_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      workspaceId, projectId, name: input.name, src: input.src,
      caption: input.caption, createdAt: new Date().toISOString(),
    };
    await col.insertOne(asset);
    return strip(asset);
  }
}

const g = globalThis as unknown as { __assetsRepo?: InMemoryAssetsRepository };
const memoryRepo = (g.__assetsRepo ??= new InMemoryAssetsRepository());

export function getAssetsRepository(): AssetsRepository {
  return hasMongo() ? new MongoAssetsRepository() : memoryRepo;
}
