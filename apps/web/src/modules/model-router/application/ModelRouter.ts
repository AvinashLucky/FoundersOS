import type {
  AIProvider, ModelRecord, TaskSpec, CompletionRequest, CompletionResult,
} from "../domain/types";

/**
 * Model Router — APPLICATION
 * --------------------------
 * Deterministic logic wrapping probabilistic models (architecture tenet T7).
 * Picks the *lowest-cost model that clears the bar*, not the strongest one,
 * and escalates along a fallback chain only on failure.
 */
export class ModelRouter {
  private readonly providers = new Map<string, AIProvider>();
  constructor(private readonly registry: ModelRecord[]) {}

  registerProvider(p: AIProvider): void {
    this.providers.set(p.key, p);
  }

  /** Score and select the cheapest capable model for a task. */
  pick(task: TaskSpec): ModelRecord {
    const candidates = this.registry
      .filter((m) => m.healthy)
      .filter((m) => task.needs.every((c) => m.capabilities.includes(c)))
      .filter((m) => (task.privacy === "local-only" ? m.privacy === "local-only" : true))
      .filter((m) => (m.quality[task.type] ?? 0) >= task.minQuality)
      .sort((a, b) => estCost(a) - estCost(b));

    const chosen = candidates[0];
    if (!chosen) throw new Error(`No capable model for task "${task.type}" at quality ${task.minQuality}`);
    return chosen;
  }

  /** Run a task with automatic fallback escalation on failure. */
  async run(task: TaskSpec, req: CompletionRequest): Promise<CompletionResult> {
    const chain = this.buildChain(task);
    let lastErr: unknown;
    for (const model of chain) {
      const provider = this.providers.get(model.provider);
      if (!provider) continue;
      try {
        return await provider.complete(req, model);
      } catch (err) {
        lastErr = err; // escalate to next model in the chain
      }
    }
    throw new Error(`All models failed for "${task.type}": ${String(lastErr)}`);
  }

  private buildChain(task: TaskSpec): ModelRecord[] {
    if (task.fallback?.length) {
      return task.fallback
        .map((id) => this.registry.find((m) => m.id === id))
        .filter((m): m is ModelRecord => Boolean(m));
    }
    // Default: cheapest capable first, then escalate up the tiers.
    const order = ["local", "fast", "balanced", "frontier"];
    return this.registry
      .filter((m) => m.healthy && task.needs.every((c) => m.capabilities.includes(c)))
      .filter((m) => (m.quality[task.type] ?? 0) >= task.minQuality)
      .sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier) || estCost(a) - estCost(b));
  }
}

function estCost(m: ModelRecord): number {
  // Rough blended estimate for ranking; real accounting happens per-call.
  return m.costPer1kInput * 0.4 + m.costPer1kOutput * 0.6;
}
