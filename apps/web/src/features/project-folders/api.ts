import type {
  ClaimOutcome,
  EjectReport,
  ProjectFolderListing,
  ProjectFolderStatus,
} from "./types";

/**
 * Project-folders data source — the only place the UI touches
 * /api/v1/project-folders. Server problems ({ code, message }) surface as
 * Error messages so the UI can show the server's honest reason.
 */
const BASE = "/api/v1/project-folders";

async function json<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  let message = `Request failed (${res.status})`;
  try {
    const body: unknown = await res.json();
    if (typeof body === "object" && body !== null && "message" in body && typeof body.message === "string") {
      message = body.message;
    }
  } catch {
    // Non-JSON error body — keep the status message.
  }
  throw new Error(message);
}

const post = (url: string) => fetch(url, { method: "POST" });

export const projectFoldersApi = {
  list: async () => json<ProjectFolderListing>(await fetch(BASE)),
  status: async (slug: string) => json<ProjectFolderStatus>(await fetch(`${BASE}/${encodeURIComponent(slug)}`)),
  claim: async (slug: string) =>
    json<{ slug: string; outcome: ClaimOutcome }>(await post(`${BASE}/${encodeURIComponent(slug)}/claim`)),
  ejectCheck: async (slug: string) =>
    json<EjectReport>(await post(`${BASE}/${encodeURIComponent(slug)}/eject-check`)),
};
