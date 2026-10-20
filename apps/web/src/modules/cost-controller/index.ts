/**
 * Cost Controller — budgets, spend ledger, and the "stop in time" governor.
 * Cost is a design input, not a bill (tenet T4; architecture §16).
 */
export interface Budget {
  runId: string;
  ceilingUsd: number;
  spentUsd: number;
}

export interface CostEntry {
  runId: string;
  taskId: string;
  modelId: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export interface CostControllerPort {
  allocate(runId: string, ceilingUsd: number): Budget;
  record(entry: CostEntry): void;
  /** True while the run may continue; false forces "ship best draft with caveats". */
  ok(runId: string): boolean;
}
