import { z } from "zod";
import { problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { getNotesRepository } from "@/server/repositories/notes.repo";
import { runResearch } from "@/server/ai/research-agent";
import { safetyGate } from "@/server/ai/governors";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";

const researchSchema = z.object({
  topic: z.string().trim().min(3).max(300),
  projectId: z.string().trim().min(1).max(60).optional(),
});

/**
 * POST /api/v1/research — the Research Agent, streamed over SSE.
 *
 *   event: query    data: {query}                 (×3, as searches launch)
 *   event: hits     data: {query, count}          (per search completion)
 *   event: distill  data: {}                      (model starts the brief)
 *   event: done     data: {brief}                 (cited ResearchBrief)
 *   event: error    data: {message}
 *
 * Guards match the run routes: same-origin, session, rate limit (4/min per
 * workspace — searches + a model call cost real money), safety gate on the
 * topic. With projectId, the brief's summary + sources persist to project
 * memory so future runs build on the research.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const limited = rateLimit("research", session.workspaceId, { limit: 4, windowMs: 60_000 });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Research budget: retry in ${limited.retryAfterSec}s`, 429);
  }

  const parsed = researchSchema.safeParse(await readJson(req));
  if (!parsed.success) return problem("VALIDATION", "Give the agent a topic (3+ characters)", 400);
  const { topic, projectId } = parsed.data;
  const { workspaceId } = session;

  const verdict = safetyGate(topic);
  if (!verdict.allowed) return problem("REFUSED", verdict.reason ?? "This topic was refused", 422);

  // Validate project ownership BEFORE the stream opens (clean 404, no half-runs).
  if (projectId) {
    const project = await getProjectsRepository().get(workspaceId, projectId);
    if (!project) return problem("NOT_FOUND", "Project not found", 404);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        const brief = await runResearch(topic, (e) => {
          if (e.type === "query") send("query", { query: e.query });
          else if (e.type === "hits") send("hits", { query: e.query, count: e.count });
          else if (e.type === "distill") send("distill", {});
        });

        // Memory: research compounds like decisions do.
        if (projectId) {
          const topSources = brief.sources.slice(0, 3).map((s) => s.url).join(" · ");
          await getNotesRepository().add(
            workspaceId,
            projectId,
            `Research (${topic}): ${brief.summary}${topSources ? ` Sources: ${topSources}` : ""}`,
          );
        }

        send("done", { brief });
      } catch {
        send("error", { message: "Research failed. Please try again." });
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
