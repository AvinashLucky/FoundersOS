import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { createProjectSchema } from "@/server/validation/projects.schema";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";

/**
 * GET /api/v1/projects — list the current workspace's projects.
 * Supports ?limit=&offset=&status= (defaults return everything, newest first),
 * so the UI can paginate as workspaces grow.
 */
export async function GET(req: Request) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in to view projects", 401);

  const url = new URL(req.url);
  const limit = clampInt(url.searchParams.get("limit"), 1, 200);
  const offset = clampInt(url.searchParams.get("offset"), 0, 100_000);
  const statusParam = url.searchParams.get("status");
  const status = statusParam === "active" || statusParam === "archived" ? statusParam : undefined;

  const projects = await getProjectsRepository().list(session.workspaceId, {
    limit,
    offset,
    status,
  });
  return ok(projects);
}

/** POST /api/v1/projects — create a project in the current workspace. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in to create a project", 401);

  const limited = rateLimit("projects:create", session.workspaceId, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Too many projects created — retry in ${limited.retryAfterSec}s`, 429);
  }

  const body = await readJson(req);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return problem("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const project = await getProjectsRepository().create(session.workspaceId, parsed.data);
  return ok(project, 201);
}

function clampInt(raw: string | null, min: number, max: number): number | undefined {
  if (raw == null) return undefined;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return undefined;
  return Math.max(min, Math.min(max, n));
}
