import type { NextResponse } from "next/server";
import { problem } from "@/server/http";
import { projectSlugSchema } from "@/server/validation/project-manifest.schema";
import { OwnersIndexError } from "./registry";

/**
 * Shared route plumbing for /api/v1/project-folders/* — one place that turns
 * a bad slug or a registry failure into an honest problem response, so every
 * handler stays guard → validate → delegate → return.
 */

/** Validate a slug from the URL; returns the slug or a 400 response. */
export function parseSlug(raw: string): { slug: string } | { error: NextResponse } {
  const parsed = projectSlugSchema.safeParse(raw);
  return parsed.success
    ? { slug: parsed.data }
    : { error: problem("VALIDATION", "That isn't a valid project folder name", 400) };
}

/** Map a thrown registry error to a response. Never echoes paths or internals. */
export function registryProblem(err: unknown): NextResponse {
  if (err instanceof OwnersIndexError) return problem("OWNERS_INDEX", err.message, 500);
  return problem("PROJECT_FOLDERS", "Couldn't read the projects folder", 500);
}
