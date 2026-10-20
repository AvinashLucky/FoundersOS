import { getDb, hasMongo } from "../db/mongo";

/** A persisted run — one prompt → one answer, with cost + the side-channel. */
export interface RunRecord {
  id: string;
  projectId: string;
  intent: string;
  answer: string;
  costUsd: number;
  tokens: number;
  durationMs: number;
  departments: Array<{ role: string; abbr: string; modelId: string; costUsd: number }>;
  /** The COO's activation decision — saved so the conversation can replay. */
  plan?: { activated: string[]; skipped: string[]; rationale: string };
  /** Each department's initial position (preview), for the transcript. */
  takes?: Array<{ abbr: string; role: string; modelId: string; costUsd: number; preview: string }>;
  /** The debate round — who challenged whom, and how the tension read. */
  debate?: Array<{ from: string; to: string; stance: "support" | "challenge" | "concern"; text: string }>;
  createdAt: string;
}

type StoredRun = RunRecord & { workspaceId: string };
const strip = ({ workspaceId: _w, ...r }: StoredRun): RunRecord => r;

export interface RunsRepository {
  list(workspaceId: string, projectId: string): Promise<RunRecord[]>;
  add(workspaceId: string, run: RunRecord): Promise<RunRecord>;
  /** All runs in a workspace — powers analytics & spend. */
  listByWorkspace(workspaceId: string): Promise<RunRecord[]>;
}

class InMemoryRunsRepository implements RunsRepository {
  private runs: StoredRun[] = [];
  async list(workspaceId: string, projectId: string): Promise<RunRecord[]> {
    return this.runs
      .filter((r) => r.workspaceId === workspaceId && r.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(strip);
  }
  async add(workspaceId: string, run: RunRecord): Promise<RunRecord> {
    this.runs.unshift({ ...run, workspaceId });
    return run;
  }
  async listByWorkspace(workspaceId: string): Promise<RunRecord[]> {
    return this.runs.filter((r) => r.workspaceId === workspaceId).map(strip);
  }
}

class MongoRunsRepository implements RunsRepository {
  private async col() {
    const db = await getDb();
    const col = db.collection<StoredRun>("runs");
    await col.createIndex({ workspaceId: 1, projectId: 1, createdAt: -1 });
    return col;
  }
  async list(workspaceId: string, projectId: string): Promise<RunRecord[]> {
    const col = await this.col();
    return (await col.find({ workspaceId, projectId }).sort({ createdAt: -1 }).toArray()).map(strip);
  }
  async add(workspaceId: string, run: RunRecord): Promise<RunRecord> {
    const col = await this.col();
    await col.insertOne({ ...run, workspaceId });
    return run;
  }
  async listByWorkspace(workspaceId: string): Promise<RunRecord[]> {
    const col = await this.col();
    return (await col.find({ workspaceId }).toArray()).map(strip);
  }
}

const g = globalThis as unknown as { __runsRepo?: InMemoryRunsRepository };
const memoryRepo = (g.__runsRepo ??= new InMemoryRunsRepository());

export function getRunsRepository(): RunsRepository {
  return hasMongo() ? new MongoRunsRepository() : memoryRepo;
}
