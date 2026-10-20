import type { WorkspaceId } from "./ids";

/**
 * Domain events — the append-only source of truth (architecture tenet T5).
 * Mongo/Postgres/graph read models are projections of this stream, so memory,
 * the decision ledger, and the project timeline all derive from one log.
 */
export interface DomainEvent<T extends string = string, P = unknown> {
  readonly id: string;
  readonly type: T;
  readonly workspaceId: WorkspaceId;
  /** Aggregate this event belongs to (projectId, runId, …). */
  readonly aggregateId: string;
  readonly payload: P;
  readonly at: string; // ISO-8601 UTC
  /** Monotonic per-aggregate version for ordering & optimistic concurrency. */
  readonly version: number;
  /** Correlates a chain of events across services (one founder request). */
  readonly correlationId: string;
}

/** Canonical event type names. Extend additively — never repurpose a name. */
export const EVENT_TYPES = {
  ProjectCreated: "project.created",
  ProjectArchived: "project.archived",
  RunStarted: "run.started",
  RunCompleted: "run.completed",
  DecisionRecorded: "decision.recorded",
  MemoryWritten: "memory.written",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/** Input to append an event; id/version/at are assigned by the event log. */
export type NewEvent<P = unknown> = Omit<DomainEvent<EventType, P>, "id" | "version" | "at">;
