"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateListingInput, Listing, ListingPlatform, ProjectIdea } from "./types";

/**
 * Freelance Studio data layer — React Query only (server data), no Redux.
 * Same JSON helper + key discipline as the projects feature.
 */
const KEYS = {
  listings: ["listings"] as const,
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Surface the server's honest message (validation, refusal, rate limit).
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

/** All listings in the workspace. */
export function useListings() {
  return useQuery({
    queryKey: KEYS.listings,
    queryFn: async () => json<Listing[]>(await fetch("/api/v1/listings")),
  });
}

/** Create a listing (optimistic — appears instantly, rolls back on failure). */
export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateListingInput) =>
      json<Listing>(
        await fetch("/api/v1/listings", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: KEYS.listings });
      const previous = qc.getQueryData<Listing[]>(KEYS.listings);
      const now = new Date().toISOString();
      const optimistic: Listing = {
        id: `tmp_${Date.now()}`,
        title: input.title.trim(),
        kind: input.kind,
        pitch: input.pitch.trim(),
        priceUsd: input.priceUsd ?? 0,
        platforms: input.platforms,
        posted: {},
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
      qc.setQueryData<Listing[]>(KEYS.listings, (list) => [optimistic, ...(list ?? [])]);
      return { previous };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.listings, ctx.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: KEYS.listings }),
  });
}

/** Toggle where a listing is posted (platform chip click). */
export function useTogglePosted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, platform, on }: { id: string; platform: ListingPlatform; on: boolean }) =>
      json<Listing>(
        await fetch(`/api/v1/listings/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ posted: { [platform]: on } }),
        }),
      ),
    onMutate: async ({ id, platform, on }) => {
      await qc.cancelQueries({ queryKey: KEYS.listings });
      const previous = qc.getQueryData<Listing[]>(KEYS.listings);
      qc.setQueryData<Listing[]>(KEYS.listings, (list) =>
        (list ?? []).map((l) => {
          if (l.id !== id) return l;
          const posted = { ...l.posted };
          if (on) posted[platform] = new Date().toISOString();
          else delete posted[platform];
          return {
            ...l,
            posted,
            status: Object.keys(posted).length > 0 ? "posted" : "draft",
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.listings, ctx.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: KEYS.listings }),
  });
}

/** Edit a listing's core fields (title, pitch, price, platforms). */
export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CreateListingInput> }) =>
      json<Listing>(
        await fetch(`/api/v1/listings/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        }),
      ),
    onSettled: () => void qc.invalidateQueries({ queryKey: KEYS.listings }),
  });
}

/** Delete a listing (optimistic — vanishes instantly, restored on failure). */
export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      json<{ id: string; deleted: boolean }>(
        await fetch(`/api/v1/listings/${id}`, { method: "DELETE" }),
      ),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.listings });
      const previous = qc.getQueryData<Listing[]>(KEYS.listings);
      qc.setQueryData<Listing[]>(KEYS.listings, (list) => (list ?? []).filter((l) => l.id !== id));
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.listings, ctx.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: KEYS.listings }),
  });
}

/** Ask the Idea Agent for scored project ideas in a niche. */
export function useIdeaAgent() {
  return useMutation({
    mutationFn: async (niche: string) =>
      json<{ niche: string; ideas: ProjectIdea[] }>(
        await fetch("/api/v1/ideas", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ niche }),
        }),
      ),
  });
}
