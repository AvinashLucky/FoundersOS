/**
 * Agent Engine — DOMAIN
 * ---------------------
 * The org as data. Agents are stateless role-functions over shared memory
 * (architecture: §1.2). Divisions, gates, and runs are described here as pure types.
 */

export type Division =
  | "executive" | "product" | "design" | "engineering" | "qa"
  | "security" | "knowledge" | "research" | "growth" | "automation";

export type AgentStatus = "idle" | "active" | "reviewing" | "done" | "blocked";

export interface AgentRole {
  id: string;
  name: string;
  division: Division;
  /** Default model tier; overridable by the router per task. */
  defaultTier: "local" | "fast" | "balanced" | "frontier";
  /** Divisions this agent reviews (gate ownership). */
  reviews: Division[];
}

export type GateVerdict = "pass" | "revise" | "block";

export interface ReviewGate {
  owner: Division;
  criteria: string;
  verdict: GateVerdict;
  rationale?: string;
}

export interface TaskNode {
  id: string;
  role: string;            // AgentRole id
  dependsOn: string[];
  status: AgentStatus;
}

export interface Run {
  id: string;
  intent: string;
  projectId: string;
  graph: TaskNode[];
  gates: ReviewGate[];
  status: "planning" | "running" | "reviewing" | "synthesizing" | "done";
  costUsd: number;
}
