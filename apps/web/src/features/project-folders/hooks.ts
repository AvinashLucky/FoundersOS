"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectFoldersApi } from "./api";

/**
 * Server state for project folders (TanStack Query — CLAUDE.md §5).
 * Claims are not optimistic: ownership is a security decision, so the UI
 * waits for the server's verdict instead of guessing and rolling back.
 */
export const projectFolderKeys = {
  all: ["project-folders"] as const,
  status: (slug: string) => ["project-folders", slug, "status"] as const,
};

export function useProjectFolders() {
  return useQuery({ queryKey: projectFolderKeys.all, queryFn: projectFoldersApi.list });
}

/** Live port status — re-probed every 8s while the card is on screen. */
export function useProjectFolderStatus(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: projectFolderKeys.status(slug),
    queryFn: () => projectFoldersApi.status(slug),
    enabled,
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
  });
}

export function useClaimProjectFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => projectFoldersApi.claim(slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectFolderKeys.all }),
  });
}

export function useEjectCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => projectFoldersApi.ejectCheck(slug),
    // A clean report stamps verifiedAt in the manifest — refresh the listing.
    onSuccess: (report) => {
      if (report.ok) void qc.invalidateQueries({ queryKey: projectFolderKeys.all });
    },
  });
}
