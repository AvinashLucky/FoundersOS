import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { generateIdeas } from "@/server/ai/idea-agent";
import { safetyGate } from "@/server/ai/governors";
import { ideasRequestSchema } from "@/server/validation/listings.schema";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";

/**
 * POST /api/v1/ideas — the Idea Agent.
 * { niche } → 5 scored, sellable project ideas (suggestions only — the agent
 * never starts work). Safety-gated and rate-limited like runs: ideation costs
 * real tokens when a key is configured.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const limited = rateLimit("ideas", session.workspaceId, { limit: 6, windowMs: 60_000 });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Idea budget: retry in ${limited.retryAfterSec}s`, 429);
  }

  const parsed = ideasRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return problem("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }

  const verdict = safetyGate(parsed.data.niche);
  if (!verdict.allowed) return problem("REFUSED", verdict.reason ?? "This niche was refused", 422);

  const ideas = await generateIdeas(parsed.data.niche);
  return ok({ niche: parsed.data.niche, ideas });
}
