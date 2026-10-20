"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** Side-channel department entry (which role ran, on which model, at what cost). */
export interface RunDepartment {
  role: string;
  abbr: string;
  modelId: string;
  costUsd: number;
}

/** How one department reacts to another's take in the debate round. */
export type Stance = "support" | "challenge" | "concern";

/** One debate message: `from` reviews `to`'s take. */
export interface DebateEntry {
  from: string;
  to: string;
  stance: Stance;
  text: string;
}

/** A department's initial position, saved for the conversation transcript. */
export interface RunTake {
  abbr: string;
  role: string;
  modelId: string;
  costUsd: number;
  preview: string;
}

/** A persisted run (mirrors the server's RunRecord). */
export interface RunRecord {
  id: string;
  projectId: string;
  intent: string;
  answer: string;
  costUsd: number;
  tokens: number;
  durationMs: number;
  departments: RunDepartment[];
  /** Saved conversation (older runs may not have these). */
  plan?: { activated: string[]; skipped: string[]; rationale: string };
  takes?: RunTake[];
  debate?: DebateEntry[];
  createdAt: string;
}

const keys = {
  runs: (projectId: string) => ["projects", projectId, "runs"] as const,
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

/** Run history for a project. */
export function useRuns(projectId: string) {
  return useQuery({
    queryKey: keys.runs(projectId),
    queryFn: async () => json<RunRecord[]>(await fetch(`/api/v1/projects/${projectId}/runs`)),
    enabled: Boolean(projectId),
  });
}

/** Run the company on an intent; refreshes history + memory on success. */
export function useRunIntent(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (intent: string) =>
      json<{ run: RunRecord }>(
        await fetch(`/api/v1/projects/${projectId}/runs`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ intent }),
        }),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.runs(projectId) });
      void qc.invalidateQueries({ queryKey: ["projects", projectId, "notes"] });
    },
  });
}
