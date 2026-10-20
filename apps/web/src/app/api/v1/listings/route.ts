import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getListingsRepository } from "@/server/repositories/listings.repo";
import { createListingSchema } from "@/server/validation/listings.schema";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";

/** GET /api/v1/listings — the workspace's freelance listings, newest first. */
export async function GET() {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);
  return ok(await getListingsRepository().list(session.workspaceId));
}

/** POST /api/v1/listings — create a listing (draft until posted somewhere). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const limited = rateLimit("listings:create", session.workspaceId, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Too many listings — retry in ${limited.retryAfterSec}s`, 429);
  }

  const parsed = createListingSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return problem("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid listing", 400);
  }

  const listing = await getListingsRepository().create(session.workspaceId, parsed.data);
  return ok(listing, 201);
}
