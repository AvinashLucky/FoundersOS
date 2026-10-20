import { z } from "zod";
import { problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { getNotesRepository } from "@/server/repositories/notes.repo";
import { generateBlueprint } from "@/server/ai/blueprint-agent";
import { safetyGate } from "@/server/ai/governors";
import { rateLimit, sameOrigin } from "@/server/security/rate-limit";

const blueprintSchema = z.object({
  requirement: z.string().trim().min(10, "Describe the client's need in a sentence").max(2000),
  projectId: z.string().trim().min(1).max(60).optional(),
});

/**
 * POST /api/v1/blueprints — the Delivery Engine, streamed over SSE.
 *
 *   event: understanding | designing | pricing   data: {}
 *   event: done   data: {blueprint}   ← the sellable artifact
 *   event: error  data: {message}
 *
 * Same guard stack as every other surface: same-origin, session, rate limit
 * (4/min per workspace — this is a frontier-tier call), safety gate on the
 * requirement, project ownership verified before the stream opens. With a
 * projectId the blueprint's understanding + pricing persist to project memory,
 * so the company remembers what it quoted.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const limited = rateLimit("blueprints", session.workspaceId, { limit: 4, windowMs: 60_000 });
  if (!limited.ok) {
    return problem("RATE_LIMITED", `Blueprint budget: retry in ${limited.retryAfterSec}s`, 429);
  }

  const parsed = blueprintSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return problem("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }
  const { requirement, projectId } = parsed.data;
  const { workspaceId } = session;

  const verdict = safetyGate(requirement);
  if (!verdict.allowed) return problem("REFUSED", verdict.reason ?? "This request was refused", 422);

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
        const blueprint = await generateBlueprint(requirement, (e) => {
          if (e.type !== "done") send(e.type, {});
        });

        if (projectId) {
          await getNotesRepository().add(
            workspaceId,
            projectId,
            `Blueprint (${requirement.slice(0, 80)}): ${blueprint.understanding} ` +
              `Quoted ${blueprint.pricing.serviceUsd} as a service / ${blueprint.pricing.productUsd} as a product.`,
          );
        }

        send("done", { blueprint });
      } catch {
        send("error", { message: "Blueprint generation failed. Please try again." });
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
