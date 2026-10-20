import { ok, problem } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { getProjectFolderRegistry } from "@/server/project-folders/registry";
import { parseSlug, registryProblem } from "@/server/project-folders/guard";

/**
 * GET /api/v1/project-folders/:slug — live status of an owned folder:
 * which of its ports are answering right now. Stage 1 never starts anything.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const slug = parseSlug(params.slug);
  if ("error" in slug) return slug.error;

  const limited = rateLimit("project-folders:status", session.workspaceId, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) return problem("RATE_LIMITED", `Slow down — retry in ${limited.retryAfterSec}s`, 429);

  try {
    const status = await getProjectFolderRegistry().status(session.workspaceId, slug.slug);
    if (!status) return problem("NOT_FOUND", "Project folder not found", 404);
    return ok(status);
  } catch (err) {
    return registryProblem(err);
  }
}
