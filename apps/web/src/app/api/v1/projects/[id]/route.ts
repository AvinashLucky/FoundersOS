import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { updateProjectSchema } from "@/server/validation/projects.schema";
import { sameOrigin } from "@/server/security/rate-limit";

/** GET /api/v1/projects/:id — one project in the current workspace. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in to view this project", 401);

  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);
  return ok(project);
}

/** PATCH /api/v1/projects/:id — archive or restore a project (soft, reversible). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const parsed = updateProjectSchema.safeParse(await readJson(req));
  if (!parsed.success) return problem("VALIDATION", "Invalid update", 400);

  const project = await getProjectsRepository().update(session.workspaceId, params.id, parsed.data);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);
  return ok(project);
}
