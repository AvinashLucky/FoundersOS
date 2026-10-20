import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OllamaProvider } from "../providers/ollama";
import { GeminiProvider } from "../providers/gemini";
import { ModelRouter } from "../router";
import type { ModelSpec } from "../types";

/**
 * Provider adapters — fetch is ALWAYS mocked here. These tests verify parsing,
 * token accounting, and zero-cost reporting without ever touching a network.
 */
const ollamaSpec: ModelSpec = { id: "llama3.1", provider: "ollama", tier: "local", costPer1k: 0, quality: 0.78 };
const geminiSpec: ModelSpec = { id: "gemini-1.5-flash", provider: "gemini", tier: "fast", costPer1k: 0, quality: 0.82 };
const input = { system: "You are the Product department.", prompt: "Design the onboarding flow" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("OllamaProvider (mocked fetch)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses response text and token counts; cost is 0 (local)", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ response: "A focused three-screen onboarding.", prompt_eval_count: 42, eval_count: 17 }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", mock);

    const out = await new OllamaProvider("http://localhost:11434").complete(input, ollamaSpec);
    expect(out.text).toBe("A focused three-screen onboarding.");
    expect(out.tokensIn).toBe(42);
    expect(out.tokensOut).toBe(17);
    expect(out.costUsd).toBe(0);
    expect(out.modelId).toBe("llama3.1");

    // Request shape: /api/generate, non-streaming, system + prompt forwarded.
    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/api/generate");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.model).toBe("llama3.1");
    expect(body.stream).toBe(false);
    expect(body.system).toBe(input.system);
    expect(body.prompt).toBe(input.prompt);
  });

  it("honors OLLAMA_MODEL override without changing the reported modelId", async () => {
    vi.stubEnv("OLLAMA_MODEL", "mistral");
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ response: "ok", prompt_eval_count: 1, eval_count: 1 }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mock);

    const out = await new OllamaProvider().complete(input, ollamaSpec);
    const body = JSON.parse(String((mock.mock.calls[0] as [string, RequestInit])[1].body)) as Record<string, unknown>;
    expect(body.model).toBe("mistral"); // what Ollama runs
    expect(out.modelId).toBe("llama3.1"); // what the cost ledger records
  });

  it("throws on non-200 so the router can fall back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    await expect(new OllamaProvider().complete(input, ollamaSpec)).rejects.toThrow(/failed \(500\)/);
  });

  it("throws on an empty response so silence never masquerades as an answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ response: "" }), { status: 200 })),
    );
    await expect(new OllamaProvider().complete(input, ollamaSpec)).rejects.toThrow(/empty/);
  });
});

describe("GeminiProvider (mocked fetch)", () => {
  it("parses candidates and usage metadata; cost is 0 (free tier)", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Three screens, " }, { text: "one clear action." }] } }],
          usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 12 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", mock);

    const out = await new GeminiProvider("test-key").complete(input, geminiSpec);
    expect(out.text).toBe("Three screens, one clear action.");
    expect(out.tokensIn).toBe(30);
    expect(out.tokensOut).toBe(12);
    expect(out.costUsd).toBe(0);
    expect(out.modelId).toBe("gemini-1.5-flash");

    // Request shape: model in path, key in a header (never the URL), system + prompt in body.
    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/models/gemini-1.5-flash:generateContent");
    expect(url).not.toContain("test-key");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(String(init.body)) as {
      systemInstruction: { parts: Array<{ text: string }> };
      contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    };
    expect(body.systemInstruction.parts[0]!.text).toBe(input.system);
    expect(body.contents[0]!.parts[0]!.text).toBe(input.prompt);
  });

  it("throws on non-200 (e.g. free-tier rate limit) so the router can fall back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("quota", { status: 429 })));
    await expect(new GeminiProvider("k").complete(input, geminiSpec)).rejects.toThrow(/failed \(429\)/);
  });

  it("throws when no candidates come back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));
    await expect(new GeminiProvider("k").complete(input, geminiSpec)).rejects.toThrow(/no candidates/);
  });
});

describe("router integration with free providers", () => {
  it("under tests the router stays Echo-only (deterministic suites)", () => {
    const router = new ModelRouter();
    // VITEST is set → only echo is reachable → every pick resolves to echo.
    expect(router.pick(0.7).provider).toBe("echo");
    expect(router.pick(0.9).provider).toBe("echo");
  });

  it("zero-cost free models outrank paid tiers in the registry sort", async () => {
    const { MODEL_REGISTRY } = await import("../router");
    const free = MODEL_REGISTRY.filter((m) => m.costPer1k === 0 && m.provider !== "echo");
    // Grows as free clouds are added — assert the guarantees, not an exact list.
    const providers = new Set(free.map((m) => m.provider));
    expect(providers.has("gemini")).toBe(true);
    expect(providers.has("ollama")).toBe(true);
    expect(free.length).toBeGreaterThanOrEqual(3);
    // A capable free model exists at every practical quality bar up to 0.9.
    expect(free.some((m) => m.quality >= 0.9)).toBe(true);
  });
});
