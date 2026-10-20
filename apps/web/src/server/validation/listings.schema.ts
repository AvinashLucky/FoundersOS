import { z } from "zod";

/** Kinds and platforms — kept in lockstep with features/freelance/types.ts. */
export const listingKindSchema = z.enum(["ai", "system", "app", "web", "ecommerce"]);
export const listingPlatformSchema = z.enum(["gumroad", "contra", "fiverr"]);

/** Validates POST /api/v1/listings. */
export const createListingSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(90),
  kind: listingKindSchema,
  pitch: z.string().trim().min(10, "Write at least a sentence of pitch").max(2000),
  priceUsd: z.number().min(0).max(100_000).optional(),
  platforms: z.array(listingPlatformSchema).min(1, "Pick at least one platform").max(3),
});

/**
 * Validates PATCH /api/v1/listings/:id.
 * `posted` toggles where the listing is live; status recomputes server-side.
 */
export const updateListingSchema = z.object({
  title: z.string().trim().min(3).max(90).optional(),
  pitch: z.string().trim().min(10).max(2000).optional(),
  priceUsd: z.number().min(0).max(100_000).optional(),
  platforms: z.array(listingPlatformSchema).min(1).max(3).optional(),
  /** platform → true (mark posted now) or false (unmark). */
  posted: z.record(listingPlatformSchema, z.boolean()).optional(),
});

/** Validates POST /api/v1/ideas (the Idea Agent). */
export const ideasRequestSchema = z.object({
  niche: z.string().trim().min(2, "Give the agent a niche or audience").max(200),
});

export type CreateListingBody = z.infer<typeof createListingSchema>;
export type UpdateListingBody = z.infer<typeof updateListingSchema>;
