import type { DomainEvent, NewEvent } from "./events";
import type { WorkspaceId } from "./ids";

/**
 * Ports — the interfaces the domain depends on, implemented by infrastructure
 * (packages/db, etc.). The domain never imports a driver; it imports these.
 * This is the seam that lets storage be swapped without touching business logic.
 */

/** A workspace-scoped repository. Every method is implicitly tenant-isolated. */
export interface Repository<T extends { id: string }> {
  findById(workspaceId: WorkspaceId, id: string): Promise<T | null>;
  list(workspaceId: WorkspaceId, query?: Record<string, unknown>): Promise<T[]>;
  insert(entity: T): Promise<T>;
  update(workspaceId: WorkspaceId, id: string, patch: Partial<T>): Promise<T>;
  remove(workspaceId: WorkspaceId, id: string): Promise<void>;
}

/** Append-only event log (source of truth). Reads are per-aggregate, ordered. */
export interface EventLog {
  append(event: NewEvent): Promise<DomainEvent>;
  readAggregate(workspaceId: WorkspaceId, aggregateId: string): Promise<DomainEvent[]>;
  /** Stream events of given types for projector rebuilds. */
  readByType(workspaceId: WorkspaceId, types: string[]): Promise<DomainEvent[]>;
}

/** Injectable clock — makes time deterministic in tests. */
export interface Clock {
  nowIso(): string;
}

/** Injectable id factory — makes ids deterministic in tests. */
export interface IdGenerator {
  next(prefix: string): string;
}

/** Structured logger port (implemented by packages/logger). */
export interface Logger {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}
