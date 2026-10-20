import type { WorkspaceId, UserId, ProjectId, RunId } from "./ids";

/** Domain entities — the shared shapes every layer agrees on. Persistence-agnostic. */

export type Plan = "solo" | "founder" | "studio" | "enterprise";
export type Role = "owner" | "admin" | "member" | "viewer";

/** The seven adaptive project identities (Strata adaptive theme system). */
export type ThemeId =
  | "founder" | "fintech" | "health" | "creative" | "media" | "commerce" | "developer";

export interface Auditable {
  readonly createdAt: string; // ISO-8601 UTC
  readonly updatedAt: string;
  readonly schemaVersion: number;
}

export interface Workspace extends Auditable {
  readonly id: WorkspaceId;
  name: string;
  plan: Plan;
  ownerId: UserId;
  settings: {
    /** Per-task routing weight overrides; empty = platform defaults. */
    routingWeights: Record<string, number>;
    /** Monthly spend ceiling in USD; null = unlimited (governed elsewhere). */
    monthlyBudgetUsd: number | null;
  };
}

export interface User extends Auditable {
  readonly id: UserId;
  email: string;
  name: string;
  workspaceIds: WorkspaceId[];
  preferences: { theme: ThemeId };
}

export type ProjectStatus = "active" | "archived";

export interface Project extends Auditable {
  readonly id: ProjectId;
  readonly workspaceId: WorkspaceId;
  name: string;
  /** Domain selects the adaptive identity (FinTech, Healthcare, …). */
  domain: ThemeId;
  status: ProjectStatus;
  summary: string;
  /** Current lifecycle stage (1..13 per the project lifecycle). */
  stage: number;
}

export type RunStatus = "planning" | "running" | "reviewing" | "synthesizing" | "done" | "failed";

export interface Run extends Auditable {
  readonly id: RunId;
  readonly workspaceId: WorkspaceId;
  readonly projectId: ProjectId;
  intent: string;
  status: RunStatus;
  costUsd: number;
}
