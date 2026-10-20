"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "./api";
import type { CreateProjectInput, UpdateProjectInput, Project } from "./types";

/**
 * React Query hooks = how the UI reads/writes SERVER data.
 * Query keys identify a cache entry; invalidating a key refetches it.
 */
const KEYS = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

/** Read the list of projects (cached, auto-loading/error states). */
export function useProjects() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => projectsApi.list(),
  });
}

/** Read one project. */
export function useProject(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => projectsApi.get(id),
    enabled: Boolean(id),
  });
}

/**
 * Create a project — OPTIMISTIC: the card appears instantly with a temp id,
 * is swapped for the server's copy on success, and rolls back on failure.
 */
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),

    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const previous = qc.getQueryData<Project[]>(KEYS.all);
      const now = new Date().toISOString();
      const optimistic: Project = {
        id: `tmp_${Date.now()}`,
        name: input.name.trim(),
        domain: input.domain,
        status: "active",
        summary: input.summary?.trim() || "A new FounderOS project.",
        createdAt: now,
        updatedAt: now,
      };
      qc.setQueryData<Project[]>(KEYS.all, (list) => [optimistic, ...(list ?? [])]);
      return { previous };
    },

    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.all, ctx.previous); // roll back
    },

    onSuccess: (created: Project) => {
      qc.setQueryData(KEYS.detail(created.id), created);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all }); // reconcile with server
    },
  });
}

/** Archive/restore a project — optimistic status flip with rollback. */
export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      projectsApi.update(id, input),

    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const previous = qc.getQueryData<Project[]>(KEYS.all);
      qc.setQueryData<Project[]>(KEYS.all, (list) =>
        (list ?? []).map((p) =>
          p.id === id ? { ...p, ...input, updatedAt: new Date().toISOString() } : p,
        ),
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.all, ctx.previous);
    },

    onSuccess: (updated: Project) => {
      qc.setQueryData(KEYS.detail(updated.id), updated);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
