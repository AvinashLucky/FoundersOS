import type { AIProvider, CompletionInput, CompletionOutput, ModelSpec } from "../types";

/**
 * EchoProvider — a real, deterministic LOCAL provider so the agent loop runs
 * with zero API keys. It produces structured, role-aware text from the prompt
 * (not random filler), which is enough to demo and develop the whole loop.
 * When ANTHROPIC_API_KEY is set, the router uses the real provider instead.
 */
export class EchoProvider implements AIProvider {
  readonly key = "echo";

  async complete(input: CompletionInput, model: ModelSpec): Promise<CompletionOutput> {
    const intent = input.prompt.replace(/\s+/g, " ").trim();
    const role = input.system.replace(/\s+/g, " ").trim();
    const text = synthesize(role, intent);

    const tokensIn = estimateTokens(input.system + input.prompt);
    const tokensOut = estimateTokens(text);
    // Cost is computed from the chosen model's rate so the cost meter + analytics
    // show realistic numbers in dev. Real providers report their actual cost.
    const costUsd = ((tokensIn + tokensOut) / 1000) * model.costPer1k;

    return { text, tokensIn, tokensOut, costUsd, modelId: model.id };
  }
}

function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

/** Deterministic, role-flavoured output so each department reads distinctly. */
function synthesize(role: string, intent: string): string {
  const r = role.toLowerCase();
  if (r.includes("product")) {
    return `Scope for "${intent}": define the smallest valuable version, list 3 acceptance criteria, and defer everything non-essential to a follow-up.`;
  }
  if (r.includes("architect") || r.includes("engineering")) {
    return `Approach for "${intent}": reuse existing modules where possible, keep the data model small, and expose a thin typed API. Note one risk to watch.`;
  }
  if (r.includes("design")) {
    return `Experience for "${intent}": one focal action, clear empty/loading states, and on-brand styling via the active theme. Keep motion minimal.`;
  }
  if (r.includes("qa") || r.includes("security")) {
    return `Checks for "${intent}": validate all input, scope every query to the workspace, and add a happy-path test plus one edge case.`;
  }
  // CEO synthesis
  return `Here's the plan for "${intent}": ship a focused first version, reuse what we already have, keep it secure and on-brand, and remember the key decision so the next project starts ahead.`;
}
