import { z } from "zod";
import { ok, problem, readJson } from "@/server/http";
import { getSession, writeSession, clearSession, sessionFromEmail } from "@/server/auth/session";
import { rateLimit, clientKey, sameOrigin } from "@/server/security/rate-limit";

const signInSchema = z.object({ email: z.string().trim().email() });

/** GET /api/v1/auth — the current user, or 401. */
export async function GET() {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Not signed in", 401);
  return ok({ userId: session.userId, workspaceId: session.workspaceId, email: session.email });
}

/**
 * POST /api/v1/auth — sign in with an email (dev). Issues the session cookie.
 * Rate-limited per client (10/min): sign-in is the classic brute-force target.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);

  const limited = rateLimit("auth:signin", clientKey(req), { limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Too many sign-in attempts — retry in ${limited.retryAfterSec}s`, 429);
  }

  const parsed = signInSchema.safeParse(await readJson(req));
  if (!parsed.success) return problem("VALIDATION", "A valid email is required", 400);

  const session = sessionFromEmail(parsed.data.email);
  writeSession(session);
  return ok({ userId: session.userId, workspaceId: session.workspaceId, email: session.email });
}

/** DELETE /api/v1/auth — sign out. */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  clearSession();
  return ok({ ok: true });
}
