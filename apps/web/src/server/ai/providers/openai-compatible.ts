import type { AIProvider, CompletionInput, CompletionOutput, ModelSpec } from "../types";
import { EmptyCompletionError, KeyRing, withKeys } from "../keys";

/**
 * OpenAICompatibleProvider — one adapter, many free clouds.
 * ─────────────────────────────────────────────────────────────────────────
 * Groq, OpenRouter, Mistral, SiliconFlow, Cerebras and most hosted providers
 * speak the OpenAI `/chat/completions` shape, so adding a cloud is ONE line in
 * the router — no new file. Each instance holds a KeyRing: a key that hits a
 * limit rests and the next key is used (see ../keys.ts).
 *
 * Cost is reported as 0: only free-tier model ids are registered for these
 * providers. Any non-200 on every key, an empty choice, or a network error
 * throws so the router's fallback chain (next model → Echo) takes over.
 * ─────────────────────────────────────────────────────────────────────────
 */
export class OpenAICompatibleProvider implements AIProvider {
  private readonly ring: KeyRing;

  constructor(
    readonly key: string,
    apiKeys: string | readonly string[],
    private readonly baseUrl: string,
    /** Vendor-specific extras (e.g. OpenRouter attribution headers). */
    private readonly extraHeaders: Record<string, string> = {},
    /** Env var that can override the registry model id (ids drift by vendor). */
    private readonly modelEnvVar?: string,
  ) {
    this.ring = new KeyRing(typeof apiKeys === "string" ? [apiKeys] : apiKeys);
  }

  async complete(input: CompletionInput, model: ModelSpec): Promise<CompletionOutput> {
    const modelName = (this.modelEnvVar ? process.env[this.modelEnvVar] : undefined) || model.id;

    return withKeys(this.ring, model.id, this.key, async (apiKey) => {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          ...this.extraHeaders,
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 1024,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.prompt },
          ],
        }),
      });
      if (!res.ok) return { status: res.status };

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content ?? "";
      if (!text) throw new EmptyCompletionError(`${this.key} returned an empty completion`);

      return {
        status: 200,
        value: {
          text,
          tokensIn: data.usage?.prompt_tokens ?? 0,
          tokensOut: data.usage?.completion_tokens ?? 0,
          costUsd: 0, // free tier
          modelId: model.id,
        },
      };
    });
  }
}
