import { randomUUID } from "node:crypto";
import type { RunResult } from "./types";
import { getRunsRepository, type RunRecord } from "../repositories/runs.repo";
import { getNotesRepository } from "../repositories/notes.repo";

/**
 * RECALL — the read side of project memory.
 * Fetches the newest decision notes and compacts them for prompt injection
 * (smallest-sufficient context: 5 notes, 200 chars each — memory should help,
 * not dominate the token budget).
 */
export async function recallMemory(
  workspaceId: string,
  projectId: string,
  limit = 5,
): Promise<string[]> {
  const notes = await getNotesRepository().list(workspaceId, projectId);
  return notes.slice(0, limit).map((n) => n.text.slice(0, 200));
}

/**
 * Persist a finished run + write its decision to project memory.
 * One function, two callers (the classic POST route and the SSE stream route),
 * so the "what happens after a run" logic can never drift between them.
 */
export async function persistRun(
  workspaceId: string,
  projectId: string,
  intent: string,
  result: RunResult & { plan?: { activated: string[]; skipped: string[]; rationale: string } },
): Promise<RunRecord> {
  const run: RunRecord = {
    id: `run_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    projectId,
    intent,
    answer: result.answer,
    costUsd: result.costUsd,
    tokens: result.tokens,
    durationMs: result.durationMs,
    departments: result.departments.map((d) => ({
      role: d.role,
      abbr: d.abbr,
      modelId: d.modelId,
      costUsd: d.costUsd,
    })),
    // The conversation, persisted: plan + initial takes + the debate itself,
    // so run history can replay the full transcript, not just the verdict.
    plan: result.plan,
    takes: result.departments
      .filter((d) => d.abbr !== "CEO")
      .map((d) => ({
        abbr: d.abbr,
        role: d.role,
        modelId: d.modelId,
        costUsd: d.costUsd,
        preview: d.output.slice(0, 220),
      })),
    debate: result.debate,
    createdAt: new Date().toISOString(),
  };

  await getRunsRepository().add(workspaceId, run);
  // Memory: remember the decision so the project compounds.
  await getNotesRepository().add(workspaceId, projectId, `Decision (${intent}): ${result.answer}`);

  return run;
}
