import type { ThemeId } from "@shared/config/themes";

/**
 * The Project shape the UI works with. This is the CONTRACT between frontend and
 * backend: your API must return objects of this shape from /api/v1/projects.
 * (It mirrors the `projects` MongoDB collection in the database design.)
 */
export interface Project {
  id: string;
  name: string;
  /** Domain picks the adaptive theme (fintech, health, creative, …). */
  domain: ThemeId;
  status: "active" | "archived";
  summary: string;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a project (what the Create dialog sends). */
export interface CreateProjectInput {
  name: string;
  domain: ThemeId;
  summary?: string;
}

/** Payload to patch a project — archive/restore for now. */
export interface UpdateProjectInput {
  status: "active" | "archived";
}
