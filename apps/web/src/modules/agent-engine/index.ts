/**
 * Agent Engine — PUBLIC API.
 * The COO orchestration loop, blackboard, and review-gate engine live under
 * application/ (see ARCHITECTURE.md §4). This barrel exposes only the domain
 * contracts other modules need.
 */
export type {
  Division, AgentRole, AgentStatus, GateVerdict, ReviewGate, TaskNode, Run,
} from "./domain/types";

/** Reference roster — the 3 executives + 13 specialists, as data. */
export { ROSTER } from "./domain/roster";
