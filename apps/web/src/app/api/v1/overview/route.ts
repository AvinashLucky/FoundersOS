import { ok, problem } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { getRunsRepository } from "@/server/repositories/runs.repo";
import { getNotesRepository } from "@/server/repositories/notes.repo";

/**
 * GET /api/v1/overview — workspace analytics & spend.
 * Aggregates projects, runs, memories, and cost for the signed-in workspace.
 * Powers the Overview dashboard (the "whole company at a glance" view).
 */
export async function GET() {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);
  const ws = session.workspaceId;

  const projects = await getProjectsRepository().list(ws);
  const runs = await getRunsRepository().listByWorkspace(ws);

  // Memory count = notes across all projects.
  const notesRepo = getNotesRepository();
  const memoryCounts = await Promise.all(projects.map((p) => notesRepo.list(ws, p.id)));
  const memories = memoryCounts.reduce((sum, list) => sum + list.length, 0);

  const spendUsd = runs.reduce((sum, r) => sum + r.costUsd, 0);
  const recentRuns = [...runs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((r) => ({ id: r.id, intent: r.intent, costUsd: r.costUsd, createdAt: r.createdAt }));

  // Spend by tier-ish bucket (derived from model id) for a simple cost breakdown.
  const spendByModel: Record<string, number> = {};
  for (const r of runs) {
    for (const d of r.departments) {
      spendByModel[d.modelId] = (spendByModel[d.modelId] ?? 0) + d.costUsd;
    }
  }

  // Spend over time — the last 14 days, zero-filled so the chart has a full axis.
  const spendByDay: Array<{ day: string; costUsd: number; runs: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    spendByDay.push({ day: d.toISOString().slice(0, 10), costUsd: 0, runs: 0 });
  }
  const byDay = new Map(spendByDay.map((e) => [e.day, e]));
  for (const r of runs) {
    const entry = byDay.get(r.createdAt.slice(0, 10));
    if (entry) {
      entry.costUsd = Math.round((entry.costUsd + r.costUsd) * 1e6) / 1e6;
      entry.runs += 1;
    }
  }

  return ok({
    projects: projects.length,
    runs: runs.length,
    memories,
    spendUsd: Math.round(spendUsd * 1e6) / 1e6,
    avgRunCostUsd: runs.length ? Math.round((spendUsd / runs.length) * 1e6) / 1e6 : 0,
    spendByModel,
    spendByDay,
    recentRuns,
  });
}
