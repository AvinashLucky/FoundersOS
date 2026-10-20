import { ok, problem, readJson } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { getListingsRepository } from "@/server/repositories/listings.repo";
import { updateListingSchema } from "@/server/validation/listings.schema";
import { sameOrigin } from "@/server/security/rate-limit";

/**
 * PATCH /api/v1/listings/:id — edit a listing or toggle where it's posted.
 * `posted: { gumroad: true }` marks it live on Gumroad (status recomputes).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const parsed = updateListingSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return problem("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid update", 400);
  }

  const listing = await getListingsRepository().update(session.workspaceId, params.id, parsed.data);
  if (!listing) return problem("NOT_FOUND", "Listing not found", 404);
  return ok(listing);
}

/** DELETE /api/v1/listings/:id — remove a listing (workspace-scoped). */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return problem("FORBIDDEN", "Cross-origin request rejected", 403);
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const removed = await getListingsRepository().remove(session.workspaceId, params.id);
  if (!removed) return problem("NOT_FOUND", "Listing not found", 404);
  return ok({ id: params.id, deleted: true });
}
