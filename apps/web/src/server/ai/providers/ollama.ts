import type { AIProvider, CompletionInput, CompletionOutput, ModelSpec } from "../types";

/**
 * OllamaProvider — a REAL local model, zero keys, zero cost.
 * Talks to a locally running Ollama daemon (`ollama serve`, default port 11434).
 * Same AIProvider shape as every other adapter, so the router swaps it in with
 * no business-logic change. If Ollama isn't running, the fetch throws and the
 * router's existing fallback takes over — registering this provider is always
 * harmless.
 *
 * Model resolution: OLLAMA_MODEL overrides the registry id, so a founder who
 * pulled `mistral` or `llama3.2` doesn't need to touch the registry.
 */
export class OllamaProvider implements AIProvider {
  readonly key = "ollama";

  constructor(private readonly baseUrl = process.env.OLLAMA_URL ?? "http://localhost:11434") {}

  async complete(input: CompletionInput, model: ModelSpec): Promise<CompletionOutput> {
    const modelName = process.env.OLLAMA_MODEL ?? model.id;

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        system: input.system,
        prompt: input.prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed (${res.status})`);
    }

    const data = (await res.json()) as {
      response?: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const text = data.response ?? "";
    if (!text) throw new Error("Ollama returned an empty response");

    return {
      text,
      tokensIn: data.prompt_eval_count ?? 0,
      tokensOut: data.eval_count ?? 0,
      costUsd: 0, // local inference is free
      modelId: model.id,
    };
  }
}
