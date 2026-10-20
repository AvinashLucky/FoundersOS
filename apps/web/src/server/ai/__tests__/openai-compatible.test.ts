import { describe, it, expect, vi, afterEach } from "vitest";
import { OpenAICompatibleProvider } from "../providers/openai-compatible";
import { providerStatus, MODEL_REGISTRY } from "../router";
import type { ModelSpec } from "../types";

/** fetch is ALWAYS mocked — these tests never touch the network. */
const groqSpec: ModelSpec = {
  id: "llama-3.3-70b-versatile",
  provider: "groq",
  tier: "fast",
  costPer1k: 0,
  quality: 0.86,
};
const input = { system: "You are the QA department.", prompt: "Review the checkout flow" };

function okResponse(content: string, promptTokens = 20, completionTokens = 9) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens },
    }),
    { status: 200 },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("OpenAICompatibleProvider (mocked fetch)", () => {
  it("parses the completion and reports zero cost", async () => {
    const mock = vi.fn().mockResolvedValue(okResponse("Three risks, ranked."));
    vi.stubGlobal("fetch", mock);

    const provider = new OpenAICompatibleProvider("groq", "k", "https://api.groq.com/openai/v1");
    const out = await provider.complete(input, groqSpec);

    expect(out.text).toBe("Three risks, ranked.");
    expect(out.tokensIn).toBe(20);
    expect(out.tokensOut).toBe(9);
    expect(out.costUsd).toBe(0);
    expect(out.modelId).toBe("llama-3.3-70b-versatile");
  });

  it("sends OpenAI-shaped chat messages to the right endpoint with auth", async () => {
    const mock = vi.fn().mockResolvedValue(okResponse("ok"));
    vi.stubGlobal("fetch", mock);

    await new OpenAICompatibleProvider("groq", "secret-key", "https://api.groq.com/openai/v1").complete(
      input,
      groqSpec,
    );

    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret-key");
    const body = JSON.parse(String(init.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe("llama-3.3-70b-versatile");
    expect(body.messages[0]).toEqual({ role: "system", content: input.system });
    expect(body.messages[1]).toEqual({ role: "user", content: input.prompt });
  });

  it("honors the model env override (vendors retire model ids)", async () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.1-8b-instant");
    const mock = vi.fn().mockResolvedValue(okResponse("ok"));
    vi.stubGlobal("fetch", mock);

    const out = await new OpenAICompatibleProvider(
      "groq",
      "k",
      "https://api.groq.com/openai/v1",
      {},
      "GROQ_MODEL",
    ).complete(input, groqSpec);

    const body = JSON.parse(String((mock.mock.calls[0] as [string, RequestInit])[1].body)) as {
      model: string;
    };
    expect(body.model).toBe("llama-3.1-8b-instant"); // what the vendor runs
    expect(out.modelId).toBe("llama-3.3-70b-versatile"); // what the ledger records
  });

  it("forwards vendor-specific headers (OpenRouter attribution)", async () => {
    const mock = vi.fn().mockResolvedValue(okResponse("ok"));
    vi.stubGlobal("fetch", mock);

    await new OpenAICompatibleProvider("openrouter", "k", "https://openrouter.ai/api/v1", {
      "x-title": "FounderOS",
    }).complete(input, groqSpec);

    const headers = (mock.mock.calls[0] as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers["x-title"]).toBe("FounderOS");
  });

  it("throws on non-200 (rate limit) so the router falls back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("limit", { status: 429 })));
    const provider = new OpenAICompatibleProvider("groq", "k", "https://api.groq.com/openai/v1");
    await expect(provider.complete(input, groqSpec)).rejects.toThrow(/groq request failed \(429\)/);
  });

  it("throws on an empty completion so silence never passes as an answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 })),
    );
    const provider = new OpenAICompatibleProvider("groq", "k", "https://api.groq.com/openai/v1");
    await expect(provider.complete(input, groqSpec)).rejects.toThrow(/empty completion/);
  });
});

describe("providerStatus", () => {
  it("never leaks key material — only booleans and public hints", () => {
    vi.stubEnv("GEMINI_API_KEY", "super-secret-value");
    const serialized = JSON.stringify(providerStatus());
    expect(serialized).not.toContain("super-secret-value");
    expect(serialized).toContain("GEMINI_API_KEY"); // the NAME is fine to show
  });

  it("reports a provider live exactly when its key is present", () => {
    vi.stubEnv("GROQ_API_KEY", "");
    expect(providerStatus().find((p) => p.key === "groq")?.live).toBe(false);
    vi.stubEnv("GROQ_API_KEY", "k");
    expect(providerStatus().find((p) => p.key === "groq")?.live).toBe(true);
  });

  it("treats Ollama as OPT-IN so an absent local model can't poison routing", () => {
    vi.stubEnv("OLLAMA_URL", "");
    vi.stubEnv("OLLAMA_ENABLED", "");
    expect(providerStatus().find((p) => p.key === "ollama")?.live).toBe(false);
    vi.stubEnv("OLLAMA_URL", "http://localhost:11434");
    expect(providerStatus().find((p) => p.key === "ollama")?.live).toBe(true);
  });

  it("always reports Echo as live (the floor)", () => {
    expect(providerStatus().find((p) => p.key === "echo")?.live).toBe(true);
  });
});

describe("registry", () => {
  it("offers a free model at every practical quality bar", () => {
    const free = MODEL_REGISTRY.filter((m) => m.costPer1k === 0 && m.provider !== "echo");
    for (const bar of [0.7, 0.8, 0.85, 0.9]) {
      expect(free.some((m) => m.quality >= bar)).toBe(true);
    }
  });

  it("keeps paid tiers available but never cheaper than free ones", () => {
    const paid = MODEL_REGISTRY.filter((m) => m.costPer1k > 0);
    expect(paid.length).toBeGreaterThan(0);
    const cheapestPaid = Math.min(...paid.map((m) => m.costPer1k));
    expect(cheapestPaid).toBeGreaterThan(0);
  });
});
