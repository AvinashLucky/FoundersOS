import { ok, problem } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { getProjectFolderRegistry } from "@/server/project-folders/registry";
import { registryProblem } from "@/server/project-folders/guard";

/**
 * GET /api/v1/project-folders — the on-disk projects this workspace owns,
 * plus unclaimed folders (slug + name only). `available: false` = degraded.
 */
export async function GET() {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const limited = rateLimit("project-folders:read", session.workspaceId, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) return problem("RATE_LIMITED", `Slow down — retry in ${limited.retryAfterSec}s`, 429);

  try {
    return ok(await getProjectFolderRegistry().list(session.workspaceId));
  } catch (err) {
    return registryProblem(err);
  }
}
