/**
 * Model Router — DOMAIN
 * ---------------------
 * Pure, framework-free contracts. The whole point: every department reaches
 * intelligence through these types, so models are swappable commodities and no
 * business logic ever imports a vendor SDK directly.
 */

export type Tier = "local" | "fast" | "balanced" | "frontier";

export type Capability = "reasoning" | "vision" | "long-context" | "tool-use" | "code" | "embeddings";

export type PrivacyClass = "any" | "local-only";

/** A declarative registry record — adding a future model is data, not code. */
export interface ModelRecord {
  id: string;                 // e.g. "claude-sonnet", "gemini-flash", "local-llama"
  provider: string;           // adapter key
  tier: Tier;
  capabilities: Capability[];
  contextWindow: number;
  costPer1kInput: number;     // USD
  costPer1kOutput: number;    // USD
  /** Quality score per task type, 0..1. Drives "cheapest that clears the bar". */
  quality: Record<string, number>;
  privacy: PrivacyClass;
  healthy: boolean;
}

export interface TaskSpec {
  type: string;               // "classify" | "design" | "architecture" | "synthesis" | ...
  needs: Capability[];
  minQuality: number;         // 0..1 acceptance bar for this task
  latencyBudgetMs?: number;
  privacy?: PrivacyClass;
  /** Ordered fallback override; otherwise router derives one by tier. */
  fallback?: string[];
}

export interface CompletionRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export interface CompletionResult {
  text: string;
  modelId: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

/**
 * The stable adapter contract. Implement this once per provider; the router and
 * every agent depend only on this interface — never on a concrete SDK.
 * This is the single most important seam for 10-year longevity.
 */
export interface AIProvider {
  readonly key: string;
  capabilities(): Capability[];
  complete(req: CompletionRequest, model: ModelRecord): Promise<CompletionResult>;
  stream?(req: CompletionRequest, model: ModelRecord): AsyncIterable<string>;
  health(): Promise<boolean>;
}
