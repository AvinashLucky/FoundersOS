/**
 * AI layer — contracts.
 * The whole system reaches models through `AIProvider`, so providers are
 * swappable and the run logic never imports a vendor SDK. `ModelSpec` is the
 * registry record the router scores on (tier + cost + capability).
 */
export type Tier = "local" | "fast" | "balanced" | "frontier";

export interface ModelSpec {
  id: string;
  provider: string;
  tier: Tier;
  /** USD per 1k tokens (blended) — used for cost accounting + routing. */
  costPer1k: number;
  /** Quality score 0..1 per task type; drives "cheapest that clears the bar". */
  quality: number;
}

export interface CompletionInput {
  system: string;
  prompt: string;
}

export interface CompletionOutput {
  text: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  modelId: string;
}

export interface AIProvider {
  readonly key: string;
  complete(input: CompletionInput, model: ModelSpec): Promise<CompletionOutput>;
}

/** One department's contribution inside a run (the "company at work"). */
export interface DepartmentResult {
  role: string;
  abbr: string;
  output: string;
  modelId: string;
  costUsd: number;
}

/** How one department reacts to another's take in the debate round. */
export type Stance = "support" | "challenge" | "concern";

/** One debate message: `from` reviews `to`'s take and pushes back or agrees. */
export interface DebateEntry {
  from: string;
  to: string;
  stance: Stance;
  text: string;
}

/** The final result of a run: one answer + the transparent side-channel. */
export interface RunResult {
  answer: string;
  departments: DepartmentResult[];
  /** The debate round — departments challenging each other before the CEO decides. */
  debate: DebateEntry[];
  costUsd: number;
  tokens: number;
  durationMs: number;
}
