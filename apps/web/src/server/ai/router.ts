import type { AIProvider, CompletionInput, CompletionOutput, ModelSpec, Tier } from "./types";
import { EchoProvider } from "./providers/echo";
import { AnthropicProvider } from "./providers/anthropic";
import { OllamaProvider } from "./providers/ollama";
import { GeminiProvider } from "./providers/gemini";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import { KeyRing, ModelUnavailableError, readKeys } from "./keys";

/**
 * Model Router — model sovereignty.
 * Picks the cheapest model that clears the task's quality bar, then runs it
 * through the matching provider. Unreachable providers are never picked, and
 * any failure degrades to the local EchoProvider — so a run never hard-fails.
 *
 * FREE-FIRST LADDER. Every hosted free tier reports costPer1k 0, so the
 * cheapest-capable sort prefers them over paid tiers automatically:
 *   Gemini flash/pro · Groq (llama-3.3-70b) · OpenRouter free models · Ollama
 * A provider is only registered when its key exists (Ollama: only when
 * explicitly enabled), which matters — an unreachable-but-registered provider
 * would win the sort, fail, and silently drop every run to Echo.
 *
 * FAILOVER (2026-10-16). A failure no longer drops straight to Echo: run() walks
 * a chain — the picked model, then every other reachable model cheapest-first —
 * and only reaches Echo when all of them refuse. Each provider also rotates its
 * own key pool (./keys.ts), so one exhausted key never stops a run. A model that
 * 404s on every key is remembered as unavailable for a while and skipped.
 */
const REGISTRY_LIST: ModelSpec[] = [
  // Always available, zero setup.
  { id: "local-echo", provider: "echo", tier: "local", costPer1k: 0, quality: 0.55 },
  // Free hosted tiers (registered only when their key is present).
  // Gemini: worker keys serve "fast", complex-work keys "balanced", CEO/COO keys
  // "frontier". gemini-4-argon is rolling out gradually; until a key can reach it,
  // it 404s, is marked unavailable, and the chain moves to the next model.
  { id: "gemini-2.5-flash", provider: "gemini", tier: "fast", costPer1k: 0, quality: 0.84 },
  { id: "gemini-2.5-pro", provider: "gemini", tier: "balanced", costPer1k: 0, quality: 0.91 },
  { id: "gemini-4-argon", provider: "gemini", tier: "frontier", costPer1k: 0, quality: 0.97 },
  { id: "openai/gpt-oss-120b", provider: "groq", tier: "fast", costPer1k: 0, quality: 0.86 },
  { id: "mistral-small-latest", provider: "mistral", tier: "fast", costPer1k: 0, quality: 0.8 },
  { id: "THUDM/GLM-4-9B-0414", provider: "glm", tier: "fast", costPer1k: 0, quality: 0.74 },
  { id: "meta-llama/llama-3.3-70b-instruct:free", provider: "openrouter", tier: "balanced", costPer1k: 0, quality: 0.84 },
  // Local (opt-in via OLLAMA_URL / OLLAMA_ENABLED).
  { id: "llama3.1", provider: "ollama", tier: "local", costPer1k: 0, quality: 0.78 },
  // Paid tiers.
  { id: "claude-haiku", provider: "anthropic", tier: "fast", costPer1k: 0.001, quality: 0.7 },
  { id: "claude-sonnet", provider: "anthropic", tier: "balanced", costPer1k: 0.006, quality: 0.88 },
  { id: "claude-opus", provider: "anthropic", tier: "frontier", costPer1k: 0.03, quality: 0.97 },
];
export const MODEL_REGISTRY: ModelSpec[] = REGISTRY_LIST;
const REGISTRY = REGISTRY_LIST;

const TIER_ORDER: Tier[] = ["local", "fast", "balanced", "frontier"];
const ECHO_SPEC = REGISTRY_LIST[0]!;

type Env = Record<string, string | undefined>;

/** Env var names, in priority order. Any var may hold a comma-separated list of keys. */
export const KEY_VARS = {
  geminiWorker: ["GEMINI_API_KEYS_WORKER"],
  geminiCeoCoo: ["GEMINI_API_KEYS_CEO_COO"],
  geminiComplex: ["GEMINI_API_KEYS_COMPLEX_WORKS"],
  geminiShared: ["GEMINI_API_KEY", "GEMINI_API_KEYS"],
  groq: ["GROQ_API_KEY", "GROQ_API_KEYS"],
  mistral: ["MISTRAL_API_KEY", "MISTRAL_API_KEYS"],
  glm: ["GLM_API_KEY", "GLM_API_KEYS"],
  openrouter: ["OPENROUTER_API_KEY", "OPENROUTER_API_KEYS"],
} as const;

/**
 * One ring per Gemini tier: the tier's own role keys first, then the shared key,
 * then the other roles' keys — borrowed only when its own are all resting.
 */
export function geminiRings(env: Env): Partial<Record<Tier, KeyRing>> | null {
  const worker = readKeys(env, KEY_VARS.geminiWorker);
  const ceo = readKeys(env, KEY_VARS.geminiCeoCoo);
  const complex = readKeys(env, KEY_VARS.geminiComplex);
  const shared = readKeys(env, KEY_VARS.geminiShared);
  if (worker.length + ceo.length + complex.length + shared.length === 0) return null;
  const ring = (...groups: string[][]) => new KeyRing([...new Set(groups.flat())]);
  return {
    fast: ring(worker, shared, complex, ceo),
    balanced: ring(complex, shared, ceo, worker),
    frontier: ring(ceo, complex, shared, worker),
    local: ring(worker, shared, complex, ceo),
  };
}

const keyCount = (env: Env, vars: readonly string[]) => readKeys(env, vars).length;

/** Which providers are live right now, and why — powers the status endpoint. */
export function providerStatus(env: Env = process.env): Array<{
  key: string;
  label: string;
  live: boolean;
  /** How many keys are configured (a count, never the keys). */
  keys: number;
  cost: "free" | "paid";
  envVar: string;
  hint: string;
}> {
  const gemini =
    keyCount(env, KEY_VARS.geminiWorker) +
    keyCount(env, KEY_VARS.geminiCeoCoo) +
    keyCount(env, KEY_VARS.geminiComplex) +
    keyCount(env, KEY_VARS.geminiShared);
  const row = (key: string, label: string, n: number, cost: "free" | "paid", envVar: string, hint: string) => ({
    key, label, live: n > 0, keys: n, cost, envVar, hint,
  });
  return [
    row("gemini", "Google Gemini", gemini, "free", "GEMINI_API_KEYS_WORKER · _CEO_COO · _COMPLEX_WORKS (or GEMINI_API_KEY)", "aistudio.google.com/apikey — keys per role; CEO/COO keys power the frontier seat"),
    row("groq", "Groq", keyCount(env, KEY_VARS.groq), "free", "GROQ_API_KEY", "console.groq.com/keys — free plan, fastest inference"),
    row("mistral", "Mistral", keyCount(env, KEY_VARS.mistral), "free", "MISTRAL_API_KEY", "console.mistral.ai — free Experiment plan"),
    row("glm", "GLM (SiliconFlow)", keyCount(env, KEY_VARS.glm), "free", "GLM_API_KEY (+ GLM_BASE_URL, GLM_MODEL)", "cloud.siliconflow.com — free GLM model"),
    row("openrouter", "OpenRouter", keyCount(env, KEY_VARS.openrouter), "free", "OPENROUTER_API_KEY", "openrouter.ai/keys — only :free model ids are used, so credit is never spent"),
    { key: "ollama", label: "Ollama (local)", live: ollamaEnabled(env), keys: 0, cost: "free" as const, envVar: "OLLAMA_URL", hint: "Opt-in: needs a capable PC running `ollama serve`" },
    row("anthropic", "Anthropic Claude", keyCount(env, ["ANTHROPIC_API_KEY"]), "paid", "ANTHROPIC_API_KEY", "console.anthropic.com — paid tiers"),
    { key: "echo", label: "Echo (offline)", live: true, keys: 0, cost: "free" as const, envVar: "—", hint: "Built-in deterministic fallback; always available" },
  ];
}

/** Ollama is OPT-IN: a registered-but-unreachable local model poisons routing. */
function ollamaEnabled(env: Env = process.env): boolean {
  return Boolean(env.OLLAMA_URL) || env.OLLAMA_ENABLED === "1";
}

export function buildProviders(env: Env = process.env): Map<string, AIProvider> {
  const map = new Map<string, AIProvider>();

  // Echo is ALWAYS registered — the floor the loop can never fall through.
  map.set("echo", new EchoProvider());

  // Under Vitest, register ONLY Echo so suites stay deterministic on any machine.
  if (env.VITEST) return map;

  const rings = geminiRings(env);
  if (rings) map.set("gemini", new GeminiProvider(rings));

  const compatible = (key: string, vars: readonly string[], baseUrl: string, modelVar: string, headers: Record<string, string> = {}) => {
    const keys = readKeys(env, vars);
    if (keys.length) map.set(key, new OpenAICompatibleProvider(key, keys, baseUrl, headers, modelVar));
  };
  compatible("groq", KEY_VARS.groq, "https://api.groq.com/openai/v1", "GROQ_MODEL");
  compatible("mistral", KEY_VARS.mistral, "https://api.mistral.ai/v1", "MISTRAL_MODEL");
  compatible("glm", KEY_VARS.glm, env.GLM_BASE_URL || "https://api.siliconflow.com/v1", "GLM_MODEL");
  compatible("openrouter", KEY_VARS.openrouter, "https://openrouter.ai/api/v1", "OPENROUTER_MODEL", {
    "http-referer": env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "x-title": "FounderOS",
  });

  if (ollamaEnabled(env)) map.set("ollama", new OllamaProvider());

  const anthropic = env.ANTHROPIC_API_KEY;
  if (anthropic) map.set("anthropic", new AnthropicProvider(anthropic));

  return map;
}

/** Models that 404'd on every key rest here, process-wide, so no run keeps retrying them. */
const UNAVAILABLE_FOR_MS = 30 * 60_000;
const unavailableUntil = new Map<string, number>();

export class ModelRouter {
  constructor(private readonly providers: Map<string, AIProvider> = buildProviders()) {}

  private usable(m: ModelSpec, now: number): boolean {
    return this.providers.has(m.provider) && (unavailableUntil.get(m.id) ?? 0) <= now;
  }

  /** True when a real (non-Echo) provider is configured — used by the UI. */
  hasRealProvider(): boolean {
    return [...this.providers.keys()].some((k) => k !== "echo");
  }

  /**
   * Cheapest model whose quality clears the bar — considering only models whose
   * provider is actually registered, so a keyless setup routes Echo instead of
   * "picking" an unreachable model and silently degrading every run.
   */
  pick(minQuality = 0.8): ModelSpec {
    const now = Date.now();
    const reachable = REGISTRY.filter((m) => this.usable(m, now));
    const candidates = reachable
      .filter((m) => m.quality >= minQuality)
      .sort(
        (a, b) => a.costPer1k - b.costPer1k || TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
      );
    // Nothing clears the bar → the best reachable model (graceful degrade).
    return candidates[0] ?? [...reachable].sort((a, b) => b.quality - a.quality)[0]!;
  }

  /**
   * The order run() tries models in: the picked one, then every other usable
   * model — first those within 0.1 of its quality, cheapest first, then the rest
   * best-first. Echo is the floor and is added by run() itself.
   */
  fallbackChain(model: ModelSpec, now = Date.now()): ModelSpec[] {
    const others = REGISTRY.filter((m) => m.provider !== "echo" && m.id !== model.id && this.usable(m, now));
    const close = others
      .filter((m) => m.quality >= model.quality - 0.1)
      .sort((a, b) => a.costPer1k - b.costPer1k || b.quality - a.quality);
    const rest = others.filter((m) => !close.includes(m)).sort((a, b) => b.quality - a.quality);
    const first = model.provider !== "echo" && this.usable(model, now) ? [model] : [];
    return [...first, ...close, ...rest];
  }

  /**
   * Run a completion. Walks the fallback chain until a model answers; only when
   * every reachable model refuses does it use Echo — labelled as Echo, so the
   * receipt never claims a model that didn't run.
   */
  async run(model: ModelSpec, input: CompletionInput): Promise<CompletionOutput> {
    for (const candidate of this.fallbackChain(model)) {
      const provider = this.providers.get(candidate.provider);
      if (!provider) continue;
      try {
        return await provider.complete(input, candidate);
      } catch (err) {
        if (err instanceof ModelUnavailableError) {
          unavailableUntil.set(candidate.id, Date.now() + UNAVAILABLE_FOR_MS);
        }
      }
    }
    return this.providers.get("echo")!.complete(input, ECHO_SPEC);
  }
}
