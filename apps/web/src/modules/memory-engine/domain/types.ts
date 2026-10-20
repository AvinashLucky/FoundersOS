/**
 * Memory Engine — DOMAIN
 * ----------------------
 * Four layers (working · project · founder · graph). Curated, decaying, graph-linked
 * — not a chunk dump. Storage is hybrid (Mongo docs + Postgres/pgvector) behind a
 * single access layer; nothing here knows which store answers (architecture §6, §13).
 */

export type MemoryLayer = "working" | "project" | "founder" | "graph";

export type MemoryKind =
  | "decision" | "architecture" | "component" | "design" | "asset"
  | "research" | "testing" | "lesson" | "pattern" | "timeline";

export interface MemoryItem {
  id: string;
  layer: MemoryLayer;
  kind: MemoryKind;
  projectId?: string;
  summary: string;          // multi-granularity summaries are curation, not capture
  reuseValue: number;       // 0..1 — boosts retrieval rank
  confidence: number;       // 0..1
  createdAt: string;
  supersededBy?: string;    // forgetting on purpose: point to the replacement
}

export interface RecallQuery {
  text: string;
  projectId?: string;
  /** Budget-aware: return the smallest sufficient set, not everything. */
  maxItems?: number;
}

/** The single access-layer contract; hides the Mongo/Postgres seam. */
export interface MemoryAccess {
  remember(item: Omit<MemoryItem, "id" | "createdAt">): Promise<MemoryItem>;
  recall(query: RecallQuery): Promise<MemoryItem[]>;
  supersede(id: string, replacementId: string): Promise<void>;
}
