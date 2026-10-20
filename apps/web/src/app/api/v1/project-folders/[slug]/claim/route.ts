import { ok, problem } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";
import { getProjectFolderRegistry } from "@/server/project-folders/registry";
import { parseSlug, registryProblem } from "@/server/project-folders/guard";

/** POST /api/v1/project-folders/:slug/claim — attach an unclaimed folder to this workspace. */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const slug = parseSlug(params.slug);
  if ("error" in slug) return slug.error;

  const limited = rateLimit("project-folders:claim", session.workspaceId, { limit: 10, windowMs: 60_000 });
  if (!limited.ok) return problem("RATE_LIMITED", `Too many claims — retry in ${limited.retryAfterSec}s`, 429);

  try {
    const outcome = await getProjectFolderRegistry().claim(session.workspaceId, slug.slug);
    if (outcome === "not-found") return problem("NOT_FOUND", "Project folder not found", 404);
    if (outcome === "owned-elsewhere") {
      return problem("CONFLICT", "Another workspace already owns this folder", 409);
    }
    return ok({ slug: slug.slug, outcome });
  } catch (err) {
    return registryProblem(err);
  }
}
