import { z } from "zod";
import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getProjectsRepository } from "@/server/repositories/projects.repo";
import { getAssetsRepository } from "@/server/repositories/assets.repo";

// ~1.5MB cap on the inline data-URL (dev). Object storage removes this limit (prod).
const MAX_SRC = 1_500_000;

const addAssetSchema = z.object({
  name: z.string().trim().min(1).max(120),
  src: z.string().trim().max(MAX_SRC).refine((s) => s.startsWith("data:image/") || s.startsWith("http"), {
    message: "src must be an image data URL or URL",
  }),
  caption: z.string().trim().max(280).optional(),
});

/** GET /api/v1/projects/:id/assets — this project's visual memory. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);
  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);
  return ok(await getAssetsRepository().list(session.workspaceId, params.id));
}

/** POST /api/v1/projects/:id/assets — capture an image into visual memory. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);
  const project = await getProjectsRepository().get(session.workspaceId, params.id);
  if (!project) return problem("NOT_FOUND", "Project not found", 404);

  const parsed = addAssetSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return problem("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid image", 400);
  }

  const asset = await getAssetsRepository().add(session.workspaceId, params.id, {
    name: parsed.data.name,
    src: parsed.data.src,
    caption: parsed.data.caption ?? "",
  });
  return ok(asset, 201);
}
