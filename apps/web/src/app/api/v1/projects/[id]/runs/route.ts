import { z } from "zod";
import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { getRunsRepository } from "@/server/repositories/runs.repo";
import { runAgentLoop } from "@/server/ai/run-service";
import { persistRun, recallMemory } from "@/server/ai/persist-run";
import { safetyGate } from "@/server/ai/governors";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";

const runSchema = z.object({ intent: z.string().trim().min(3).max(1000) });

/** GET /api/v1/projects/:id/runs — run history for this project (?limit=). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);
  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);

  const limitRaw = new URL(req.url).searchParams.get("limit");
  const limit = limitRaw ? Math.max(1, Math.min(100, Number.parseInt(limitRaw, 10) || 20)) : undefined;

  const runs = await getRunsRepository().list(session.workspaceId, params.id);
  return ok(limit ? runs.slice(0, limit) : runs);
}

/**
 * POST /api/v1/projects/:id/runs — run the company on an intent.
 * Executes the agent loop, persists the run, and writes the decision to the
 * project's memory so future runs start ahead. Returns one answer + side-channel.
 * Rate-limited per workspace: runs cost real money.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const limited = rateLimit("runs", session.workspaceId, { limit: 6, windowMs: 60_000 });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Run budget: retry in ${limited.retryAfterSec}s`, 429);
  }

  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);

  const parsed = runSchema.safeParse(await readJson(req));
  if (!parsed.success) return problem("VALIDATION", "Describe what you want in a sentence", 400);

  // Safety gate — refuse harmful intents before any model spends a token.
  const verdict = safetyGate(parsed.data.intent);
  if (!verdict.allowed) return problem("REFUSED", verdict.reason ?? "This intent was refused", 422);

  // Memory recall — the company builds on its past decisions.
  const memory = await recallMemory(session.workspaceId, params.id);

  const result = await runAgentLoop(parsed.data.intent, undefined, { memory });
  const run = await persistRun(session.workspaceId, params.id, parsed.data.intent, result);

  return ok({ run, result }, 201);
}
