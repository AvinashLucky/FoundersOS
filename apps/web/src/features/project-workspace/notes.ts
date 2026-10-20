"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** A single memory note (mirrors the server's Note shape). */
export interface Note {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
}

const keys = {
  notes: (projectId: string) => ["projects", projectId, "notes"] as const,
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

/** List a project's memory notes. */
export function useNotes(projectId: string) {
  return useQuery({
    queryKey: keys.notes(projectId),
    queryFn: async () => json<Note[]>(await fetch(`/api/v1/projects/${projectId}/notes`)),
    enabled: Boolean(projectId),
  });
}

/** Add a note, then refresh the list. */
export function useAddNote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) =>
      json<Note>(
        await fetch(`/api/v1/projects/${projectId}/notes`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
        }),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.notes(projectId) }),
  });
}
