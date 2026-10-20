"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** A captured image in a project's visual memory. */
export interface VisualMemory {
  id: string;
  projectId: string;
  name: string;
  src: string;
  caption: string;
  createdAt: string;
}

const keys = { assets: (projectId: string) => ["projects", projectId, "assets"] as const };

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export function useAssets(projectId: string) {
  return useQuery({
    queryKey: keys.assets(projectId),
    queryFn: async () => json<VisualMemory[]>(await fetch(`/api/v1/projects/${projectId}/assets`)),
    enabled: Boolean(projectId),
  });
}

export function useAddAsset(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; src: string; caption: string }) =>
      json<VisualMemory>(
        await fetch(`/api/v1/projects/${projectId}/assets`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.assets(projectId) }),
  });
}

/** Read a File as a compressed data URL (resized to <= 1024px) for inline storage. */
export function fileToDataUrl(file: File, maxPx = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
