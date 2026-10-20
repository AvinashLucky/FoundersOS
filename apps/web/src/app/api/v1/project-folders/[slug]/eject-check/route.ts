import { ok, problem } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";
import { getProjectFolderRegistry } from "@/server/project-folders/registry";
import { parseSlug, registryProblem } from "@/server/project-folders/guard";

/**
 * POST /api/v1/project-folders/:slug/eject-check — verify the project can
 * leave FounderOS. A clean report stamps `eject.verifiedAt` in its manifest,
 * which is why this is a POST (it writes) and is CSRF-guarded.
 */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const slug = parseSlug(params.slug);
  if ("error" in slug) return slug.error;

  // A full source scan is the most expensive thing here — keep it deliberate.
  const limited = rateLimit("project-folders:eject", session.workspaceId, { limit: 6, windowMs: 60_000 });
  if (!limited.ok) return problem("RATE_LIMITED", `Retry the eject check in ${limited.retryAfterSec}s`, 429);

  try {
    const report = await getProjectFolderRegistry().verifyEject(session.workspaceId, slug.slug);
    if (!report) return problem("NOT_FOUND", "Project folder not found", 404);
    return ok(report);
  } catch (err) {
    return registryProblem(err);
  }
}
