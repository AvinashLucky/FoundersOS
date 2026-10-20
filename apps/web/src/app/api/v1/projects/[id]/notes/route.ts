import { z } from "zod";
import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { getNotesRepository } from "@/server/repositories/notes.repo";

const addNoteSchema = z.object({ text: z.string().trim().min(1).max(2000) });

/** GET /api/v1/projects/:id/notes — this project's memory notes. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  // Ensure the project belongs to the caller's workspace before exposing notes.
  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);

  return ok(await getNotesRepository().list(session.workspaceId, params.id));
}

/** POST /api/v1/projects/:id/notes — add a note to this project's memory. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);

  const parsed = addNoteSchema.safeParse(await readJson(req));
  if (!parsed.success) return problem("VALIDATION", "Note text is required", 400);

  const note = await getNotesRepository().add(session.workspaceId, params.id, parsed.data.text);
  return ok(note, 201);
}
