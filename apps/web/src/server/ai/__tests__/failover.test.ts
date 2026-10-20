import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyRing, ModelUnavailableError, readKeys } from "../keys";
import { ModelRouter, buildProviders, geminiRings, providerStatus } from "../router";
import { GeminiProvider } from "../providers/gemini";
import { OpenAICompatibleProvider } from "../providers/openai-compatible";
import { EchoProvider } from "../providers/echo";
import type { AIProvider, CompletionInput, ModelSpec } from "../types";

/*
 * The founder's rule: "if one key hits its limit, loop to the next key or model —
 * never stop the work." These tests pin that down without touching the network.
 */

const input: CompletionInput = { system: "You are the CEO.", prompt: "Plan the launch" };
const flash: ModelSpec = { id: "gemini-2.5-flash", provider: "gemini", tier: "fast", costPer1k: 0, quality: 0.84 };
const ok = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("readKeys", () => {
  it("reads single keys and comma/newline lists, in order, without duplicates", () => {
    const env = { A: "k1, k2\nk3", B: "k2", C: "" };
    expect(readKeys(env, ["A", "B", "C", "MISSING"])).toEqual(["k1", "k2", "k3"]);
  });
});

describe("KeyRing", () => {
  it("rotates the starting key and skips a key while it rests", () => {
    const ring = new KeyRing(["a", "b", "c"]);
    expect(ring.available(0)).toEqual(["a", "b", "c"]);
    expect(ring.available(0)).toEqual(["b", "c", "a"]);
    ring.rest("c", 1000, 0);
    expect(ring.available(500)).toEqual(["a", "b"]);
    expect(ring.available(1500)).toContain("c");
  });
});

describe("a key that hits its limit hands over to the next key", () => {
  it("Gemini: 429 on the first key, answer from the second — the run never notices", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("quota", { status: 429 })).mockResolvedValueOnce(ok("done"));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GeminiProvider({ fast: new KeyRing(["first", "second"]) });
    const out = await provider.complete(input, flash);
    expect(out.text).toBe("done");
    const keysUsed = fetchMock.mock.calls.map(([, init]) => (init as RequestInit & { headers: Record<string, string> }).headers["x-goog-api-key"]);
    expect(keysUsed).toEqual(["first", "second"]);
  });

  it("OpenAI-compatible: 429 then success on the next key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("limit", { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const groq = new OpenAICompatibleProvider("groq", ["g1", "g2"], "https://api.groq.com/openai/v1");
    const spec: ModelSpec = { id: "openai/gpt-oss-120b", provider: "groq", tier: "fast", costPer1k: 0, quality: 0.86 };
    expect((await groq.complete(input, spec)).text).toBe("ok");
  });

  it("404 on every key means the model itself is unavailable (e.g. gemini-4-argon not rolled out yet)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 404 })));
    const provider = new GeminiProvider({ frontier: new KeyRing(["a", "b"]) });
    const argon: ModelSpec = { id: "gemini-4-argon", provider: "gemini", tier: "frontier", costPer1k: 0, quality: 0.97 };
    await expect(provider.complete(input, argon)).rejects.toBeInstanceOf(ModelUnavailableError);
  });
});

describe("Gemini keys per role", () => {
  it("each tier uses its own role keys first and borrows the others last", () => {
    const rings = geminiRings({
      GEMINI_API_KEYS_WORKER: "w1",
      GEMINI_API_KEYS_CEO_COO: "c1",
      GEMINI_API_KEYS_COMPLEX_WORKS: "x1",
    });
    expect(rings?.fast?.available(0)[0]).toBe("w1");
    expect(rings?.frontier?.available(0)[0]).toBe("c1");
    expect(rings?.balanced?.available(0)[0]).toBe("x1");
    expect(rings?.frontier?.size).toBe(3);
  });

  it("no Gemini keys at all → no Gemini provider", () => {
    expect(geminiRings({})).toBeNull();
    expect(buildProviders({}).has("gemini")).toBe(false);
  });

  it("registers every provider whose key exists (outside tests)", () => {
    const map = buildProviders({ GEMINI_API_KEYS_WORKER: "w", GROQ_API_KEY: "g", MISTRAL_API_KEY: "m", GLM_API_KEY: "z", OPENROUTER_API_KEY: "o" });
    for (const key of ["gemini", "groq", "mistral", "glm", "openrouter", "echo"]) expect(map.has(key)).toBe(true);
  });

  it("status shows key counts, never key material", () => {
    const status = providerStatus({ GEMINI_API_KEYS_WORKER: "secret-a,secret-b", GEMINI_API_KEYS_CEO_COO: "secret-c" });
    expect(JSON.stringify(status)).not.toContain("secret");
    expect(status.find((p) => p.key === "gemini")?.keys).toBe(3);
  });
});

describe("the router walks the chain instead of dropping to Echo", () => {
  const failing = (key: string, err: Error = new Error(`${key} failed (429)`)): AIProvider => ({
    key,
    complete: vi.fn().mockRejectedValue(err),
  });
  const answering = (key: string): AIProvider => ({
    key,
    complete: vi.fn(async (_i: CompletionInput, m: ModelSpec) => ({ text: `from ${key}`, tokensIn: 1, tokensOut: 1, costUsd: 0, modelId: m.id })),
  });

  it("a failed model hands the task to the next reachable model", async () => {
    const router = new ModelRouter(new Map<string, AIProvider>([["echo", new EchoProvider()], ["gemini", failing("gemini")], ["groq", answering("groq")]]));
    const out = await router.run(router.pick(0.84), input);
    expect(out.text).toBe("from groq");
    expect(out.modelId).toBe("openai/gpt-oss-120b"); // the receipt names the model that really answered
  });

  it("only when every model refuses does Echo answer — and the receipt says Echo", async () => {
    const router = new ModelRouter(new Map<string, AIProvider>([["echo", new EchoProvider()], ["gemini", failing("gemini")], ["groq", failing("groq")]]));
    const out = await router.run(router.pick(0.84), input);
    expect(out.modelId).toBe("local-echo");
    expect(out.costUsd).toBe(0);
  });

  it("a model that 404s is skipped on later runs instead of being retried every time", async () => {
    const gemini: AIProvider = {
      key: "gemini",
      complete: vi.fn(async (_i: CompletionInput, m: ModelSpec) => {
        if (m.id === "gemini-4-argon") throw new ModelUnavailableError(m.id);
        return { text: "pro answered", tokensIn: 1, tokensOut: 1, costUsd: 0, modelId: m.id };
      }),
    };
    const router = new ModelRouter(new Map<string, AIProvider>([["echo", new EchoProvider()], ["gemini", gemini]]));
    const first = await router.run(router.pick(0.95), input);
    expect(first.modelId).not.toBe("gemini-4-argon");
    expect(router.pick(0.95).id).not.toBe("gemini-4-argon"); // remembered as unavailable
  });
});
