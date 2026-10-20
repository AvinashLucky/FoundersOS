import { z } from "zod";
import { problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { runAgentLoop } from "@/server/ai/run-service";
import { persistRun, recallMemory } from "@/server/ai/persist-run";
import { safetyGate } from "@/server/ai/governors";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";

const runSchema = z.object({ intent: z.string().trim().min(3).max(1000) });

/**
 * POST /api/v1/projects/:id/runs/stream — run the company, LIVE.
 * Same contract as /runs but the response is a Server-Sent-Events stream:
 *
 *   event: department  data: {role, abbr, modelId, costUsd}   (×4, as each finishes)
 *   event: synthesis   data: {}                               (CEO starts writing)
 *   event: done        data: {run}                            (persisted RunRecord)
 *   event: error       data: {message}                        (loop failed)
 *
 * The founder watches departments light up as they actually finish — perceived
 * progress instead of a spinner. Persistence reuses persistRun, so a streamed
 * run and a classic run are indistinguishable in history/memory/cost.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  // Streamed runs share the same budget bucket as classic runs.
  const limited = rateLimit("runs", session.workspaceId, { limit: 6, windowMs: 60_000 });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Run budget: retry in ${limited.retryAfterSec}s`, 429);
  }

  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);

  const parsed = runSchema.safeParse(await readJson(req));
  if (!parsed.success) return problem("VALIDATION", "Describe what you want in a sentence", 400);
  const intent = parsed.data.intent;
  const { workspaceId } = session;

  // Safety gate — refuse before any model spends a token.
  const verdict = safetyGate(intent);
  if (!verdict.allowed) return problem("REFUSED", verdict.reason ?? "This intent was refused", 422);

  // Memory recall happens before the stream opens so a DB hiccup is a clean 500.
  const memory = await recallMemory(workspaceId, params.id);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        const result = await runAgentLoop(
          intent,
          (e) => {
            if (e.type === "plan") {
              send("plan", { activated: e.activated, skipped: e.skipped, rationale: e.rationale });
            } else if (e.type === "department") {
              send("department", {
                role: e.role,
                abbr: e.abbr,
                modelId: e.modelId,
                costUsd: e.costUsd,
                preview: e.preview,
              });
            } else if (e.type === "critique") {
              send("critique", { from: e.from, to: e.to, stance: e.stance, text: e.text });
            } else {
              send("synthesis", { degraded: e.degraded });
            }
          },
          { memory },
        );
        const run = await persistRun(workspaceId, params.id, intent, result);
        send("done", { run });
      } catch {
        send("error", { message: "The run failed. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
