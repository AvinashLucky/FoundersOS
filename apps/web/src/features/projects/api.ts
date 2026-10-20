import type { Project, CreateProjectInput, UpdateProjectInput } from "./types";

/**
 * Projects data source.
 * ─────────────────────────────────────────────────────────────────────────
 * The UI talks to this `ProjectsApi` interface and never cares where the data
 * comes from. Two implementations:
 *   • LocalProjectsApi  — in-memory, works TODAY with no backend (for UI dev).
 *   • HttpProjectsApi    — calls your real /api/v1/projects (flip the switch
 *                          at the bottom once your backend is ready).
 * This is the seam where YOUR backend plugs in. Nothing else in the UI changes.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface ProjectsApi {
  list(): Promise<Project[]>;
  create(input: CreateProjectInput): Promise<Project>;
  get(id: string): Promise<Project>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
}

// ── 1) Local in-memory adapter (default for now) ──────────────────────────
class LocalProjectsApi implements ProjectsApi {
  private projects: Project[] = [
    {
      id: "prj_demo_atlas",
      name: "Atlas",
      domain: "developer",
      status: "active",
      summary: "Internal developer platform — the first project FounderOS remembers.",
      createdAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3_600_000).toISOString(),
    },
  ];

  async list(): Promise<Project[]> {
    await delay(220); // simulate network so loading states are visible in dev
    return [...this.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async create(input: CreateProjectInput): Promise<Project> {
    await delay(260);
    const now = new Date().toISOString();
    const project: Project = {
      id: `prj_${Math.random().toString(36).slice(2, 10)}`,
      name: input.name.trim(),
      domain: input.domain,
      status: "active",
      summary: input.summary?.trim() || "A new FounderOS project.",
      createdAt: now,
      updatedAt: now,
    };
    this.projects = [project, ...this.projects];
    return project;
  }

  async get(id: string): Promise<Project> {
    await delay(120);
    const found = this.projects.find((p) => p.id === id);
    if (!found) throw new Error(`Project ${id} not found`);
    return found;
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    await delay(160);
    const found = this.projects.find((p) => p.id === id);
    if (!found) throw new Error(`Project ${id} not found`);
    Object.assign(found, input, { updatedAt: new Date().toISOString() });
    return found;
  }
}

// ── 2) HTTP adapter (use once your backend exists) ────────────────────────
class HttpProjectsApi implements ProjectsApi {
  constructor(private readonly baseUrl = "/api/v1/projects") {}

  async list(): Promise<Project[]> {
    return this.json<Project[]>(await fetch(this.baseUrl));
  }
  async create(input: CreateProjectInput): Promise<Project> {
    return this.json<Project>(
      await fetch(this.baseUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  }
  async get(id: string): Promise<Project> {
    return this.json<Project>(await fetch(`${this.baseUrl}/${id}`));
  }
  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.json<Project>(
      await fetch(`${this.baseUrl}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  }

  private async json<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  }
}

// ── The active data source ────────────────────────────────────────────────
// Now LIVE: talks to /api/v1/projects (backed by MongoDB, or the server's
// in-memory store when MONGODB_URI isn't set). Swap back to `new LocalProjectsApi()`
// only for pure offline UI work.
export const projectsApi: ProjectsApi = new HttpProjectsApi();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
