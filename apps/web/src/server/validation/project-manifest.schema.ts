import { z } from "zod";
import { domainSchema } from "./projects.schema";

/**
 * project.json — the manifest every on-disk project carries (Track A).
 * ─────────────────────────────────────────────────────────────────────────
 * A manifest is a file that a human, a coding agent or a model may have
 * edited, so it is untrusted input (CLAUDE.md §8.7): parsed strictly, paths
 * confined to the project, commands whitelisted. Stage 1 only *displays*
 * commands; the Stage 2 runner will execute them, which is why the
 * whitelist exists from day one rather than being retrofitted.
 * The manifest is inert on eject — a standalone copy can ignore or delete it.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Folder name under projects/: lowercase letters, digits, hyphens. */
export const projectSlugSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,62}$/, "Use lowercase letters, digits and hyphens");

/** A path inside the project: relative, no traversal, no absolute or drive paths. */
export const projectRelativeDirSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine(
    (p) =>
      !p.startsWith("/") &&
      !p.startsWith("\\") &&
      !/^[a-zA-Z]:/.test(p) &&
      !p.split(/[\\/]/).includes(".."),
    "Must be a relative path inside the project",
  );

/**
 * Commands a runner may execute — package-manager verbs only. No shell
 * operators, no arguments beyond a script name, so model output can never
 * smuggle `&& rm -rf` into a command line.
 */
export const projectCommandSchema = z
  .string()
  .trim()
  .regex(
    /^(npm|pnpm|yarn) (install|ci|start|test|run [a-z0-9][a-z0-9:_-]{0,40})$/,
    "Only package-manager commands are allowed (e.g. `npm run dev`)",
  );

const appSchema = z
  .object({
    dir: projectRelativeDirSchema,
    install: projectCommandSchema,
    dev: projectCommandSchema,
    port: z.number().int().min(1024).max(65535),
  })
  .strict();

const isoDate = z.string().datetime();

export const projectManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^prj_[a-z0-9_]{2,40}$/, "id must look like prj_name"),
    name: z.string().trim().min(2).max(60),
    domain: domainSchema,
    summary: z.string().trim().max(280),
    layout: z.enum(["single", "split"]),
    apps: z.object({ frontend: appSchema, backend: appSchema.nullable() }).strict(),
    runtime: z
      .object({
        node: z.string().trim().min(1).max(20),
        packageManager: z.enum(["npm", "pnpm", "yarn"]),
      })
      .strict(),
    client: z
      .object({ name: z.string().trim().max(80), contact: z.string().trim().max(120) })
      .strict(),
    delivery: z
      .object({
        status: z.enum(["planned", "in-progress", "delivered", "maintained"]),
        pricedUsd: z.number().min(0).max(1_000_000).nullable(),
        deliveredAt: isoDate.nullable(),
      })
      .strict(),
    provenance: z
      .object({
        blueprintRunId: z.string().trim().max(80).nullable(),
        createdAt: isoDate,
        detailsDir: projectRelativeDirSchema,
      })
      .strict(),
    eject: z.object({ standalone: z.boolean(), verifiedAt: isoDate.nullable() }).strict(),
  })
  .strict()
  .superRefine((m, ctx) => {
    if (m.layout === "split" && m.apps.backend === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apps", "backend"],
        message: "A split layout needs a backend app",
      });
    }
    if (m.layout === "single" && m.apps.backend !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apps", "backend"],
        message: "A single layout has no separate backend — use layout \"split\"",
      });
    }
    if (m.apps.backend && m.apps.backend.port === m.apps.frontend.port) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apps", "backend", "port"],
        message: "Frontend and backend need different ports",
      });
    }
  });

export type ProjectManifest = z.infer<typeof projectManifestSchema>;
export type ProjectAppSpec = ProjectManifest["apps"]["frontend"];
