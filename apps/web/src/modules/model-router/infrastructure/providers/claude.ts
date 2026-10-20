import type { AIProvider, CompletionRequest, CompletionResult, ModelRecord, Capability } from "../../domain/types";

/**
 * Claude adapter — INFRASTRUCTURE
 * -------------------------------
 * Reference implementation of the AIProvider contract. A Gemini, OpenAI, or
 * local-Llama adapter is the SAME shape — drop it in, register it, done.
 * Business logic never changes when providers are swapped.
 *
 * NOTE: network call intentionally stubbed; wire to the real SDK/HTTP in infra.
 */
export class ClaudeProvider implements AIProvider {
  readonly key = "anthropic";
  constructor(private readonly apiKey: string) {}

  capabilities(): Capability[] {
    return ["reasoning", "vision", "long-context", "tool-use", "code"];
  }

  async complete(req: CompletionRequest, model: ModelRecord): Promise<CompletionResult> {
    // const res = await fetch("https://api.anthropic.com/v1/messages", { ... apiKey ... signal: req.signal })
    const text = `[${model.id}] would answer: ${req.prompt.slice(0, 60)}…`;
    const tokensIn = Math.ceil(((req.system?.length ?? 0) + req.prompt.length) / 4);
    const tokensOut = Math.ceil(text.length / 4);
    return {
      text,
      modelId: model.id,
      tokensIn,
      tokensOut,
      costUsd: (tokensIn / 1000) * model.costPer1kInput + (tokensOut / 1000) * model.costPer1kOutput,
    };
  }

  async *stream(req: CompletionRequest, model: ModelRecord): AsyncIterable<string> {
    for (const chunk of `[${model.id}] streaming…`.split(" ")) yield chunk + " ";
  }

  async health(): Promise<boolean> {
    return Boolean(this.apiKey);
  }
}
