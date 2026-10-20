/**
 * Knowledge Graph — DOMAIN
 * ------------------------
 * Embeddings find *similar*; the graph finds *related, dependent, causal*.
 * Materialized in Postgres edge tables alongside pgvector (architecture §7).
 */

export type NodeKind =
  | "project" | "technology" | "component" | "idea" | "competitor"
  | "pattern" | "architecture" | "library" | "model" | "asset" | "decision";

export type EdgeKind =
  | "uses" | "depends-on" | "reuses" | "replaces" | "inspired-by"
  | "competes-with" | "solved-by" | "caused" | "belongs-to" | "evolved-from";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  weight: number;       // strength / confidence
  runId?: string;       // provenance
}

export interface GraphQuery {
  start: string;
  edge?: EdgeKind;
  maxHops?: number;     // bound multi-hop reasoning
}
