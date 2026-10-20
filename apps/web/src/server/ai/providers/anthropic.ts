import type { AIProvider, CompletionInput, CompletionOutput, ModelSpec } from "../types";

/**
 * AnthropicProvider — real Claude adapter (used when ANTHROPIC_API_KEY is set).
 * Same AIProvider shape as EchoProvider, so the router swaps them with no other
 * code change. A Gemini/OpenAI adapter would look identical.
 */
export class AnthropicProvider implements AIProvider {
  readonly key = "anthropic";
  constructor(private readonly apiKey: string) {}

  async complete(input: CompletionInput, model: ModelSpec): Promise<CompletionOutput> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: 1024,
        system: input.system,
        messages: [{ role: "user", content: input.prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic request failed (${res.status})`);
    }

    const data = (await res.json()) as {
      content: Array<{ text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = data.content?.map((c) => c.text ?? "").join("") ?? "";
    const tokensIn = data.usage?.input_tokens ?? 0;
    const tokensOut = data.usage?.output_tokens ?? 0;

    return {
      text,
      tokensIn,
      tokensOut,
      costUsd: ((tokensIn + tokensOut) / 1000) * model.costPer1k,
      modelId: model.id,
    };
  }
}
