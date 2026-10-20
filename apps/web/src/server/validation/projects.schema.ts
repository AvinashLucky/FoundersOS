import { z } from "zod";

/** The seven adaptive identities — kept in lockstep with the UI theme list. */
export const domainSchema = z.enum([
  "founder", "fintech", "health", "creative", "media", "commerce", "developer",
]);

/** Validates the POST /api/v1/projects body. */
export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  domain: domainSchema,
  summary: z.string().trim().max(280).optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;

/** Validates PATCH /api/v1/projects/:id — status changes (archive/restore). */
export const updateProjectSchema = z.object({
  status: z.enum(["active", "archived"]),
});

export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;
