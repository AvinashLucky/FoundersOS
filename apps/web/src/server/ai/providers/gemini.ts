import type { AIProvider, CompletionInput, CompletionOutput, ModelSpec, Tier } from "../types";
import { EmptyCompletionError, KeyRing, withKeys } from "../keys";

/**
 * GeminiProvider — Google's hosted models, with a key pool per role.
 * The founder keeps separate key groups (worker · CEO/COO · complex work). Each
 * model tier draws from its own group first and borrows the others only when its
 * own keys are all resting, so heavy worker traffic can't starve the CEO seat and
 * one exhausted key never stops a run. Non-200 / empty answers throw so the
 * router's fallback chain takes over. The key travels in the `x-goog-api-key`
 * header (not the URL, which ends up in logs) and is never logged.
 */
export type GeminiKeyRings = Partial<Record<Tier, KeyRing>>;

export class GeminiProvider implements AIProvider {
  readonly key = "gemini";
  private readonly rings: GeminiKeyRings;

  /** A single key (legacy GEMINI_API_KEY) or one ring per tier. */
  constructor(keys: string | GeminiKeyRings) {
    if (typeof keys === "string") {
      const ring = new KeyRing([keys]);
      this.rings = { fast: ring, balanced: ring, frontier: ring, local: ring };
    } else {
      this.rings = keys;
    }
  }

  async complete(input: CompletionInput, model: ModelSpec): Promise<CompletionOutput> {
    const ring = this.rings[model.tier] ?? this.rings.balanced ?? this.rings.fast;
    if (!ring) throw new Error("Gemini has no key for this tier");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent`;

    return withKeys(ring, model.id, "Gemini", async (apiKey) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        }),
      });
      if (!res.ok) return { status: res.status };

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) throw new EmptyCompletionError("Gemini returned no candidates");

      return {
        status: 200,
        value: {
          text,
          tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
          tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
          costUsd: 0, // free tier
          modelId: model.id,
        },
      };
    });
  }
}
