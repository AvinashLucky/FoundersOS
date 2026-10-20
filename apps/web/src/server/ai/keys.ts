/**
 * Key pools — many free keys behave like one big quota.
 * ─────────────────────────────────────────────────────────────────────────
 * Free tiers rate-limit per key. A founder with several keys (per role, per
 * account) should never see a run stop because ONE key hit its limit, so every
 * provider holds a KeyRing: it hands out keys in rotation, puts a key that hit a
 * limit on a short cool-down, and skips it until the cool-down ends.
 *
 * Keys are only ever read from env and passed to the vendor in a header. They
 * are never logged, returned to the client, or put in error messages.
 * ─────────────────────────────────────────────────────────────────────────
 */

type Env = Record<string, string | undefined>;

/**
 * Collect keys from env vars. Each var may hold one key or a comma/space/newline
 * separated list. Order is preserved (first var first), duplicates removed.
 */
export function readKeys(env: Env, names: readonly string[]): string[] {
  const out: string[] = [];
  for (const name of names) {
    for (const part of (env[name] ?? "").split(/[\s,]+/)) {
      const k = part.trim();
      if (k && !out.includes(k)) out.push(k);
    }
  }
  return out;
}

/** How long a key rests after each kind of refusal. */
export const COOL_DOWN_MS = {
  rateLimited: 60_000, // 429: the per-minute window usually resets within a minute
  rejected: 60 * 60_000, // 401/403: bad, revoked or not entitled — try again in an hour
  serverError: 15_000, // 5xx / network: brief pause
} as const;

export class KeyRing {
  private cursor = 0;
  private readonly restingUntil = new Map<string, number>();

  constructor(private readonly keys: readonly string[]) {}

  get size(): number {
    return this.keys.length;
  }

  /** Keys to try now, starting after the last one handed out (spreads load). */
  available(now = Date.now()): string[] {
    const n = this.keys.length;
    const ordered = Array.from({ length: n }, (_, i) => this.keys[(this.cursor + i) % n]!);
    this.cursor = n ? (this.cursor + 1) % n : 0;
    return ordered.filter((k) => (this.restingUntil.get(k) ?? 0) <= now);
  }

  rest(key: string, ms: number, now = Date.now()): void {
    this.restingUntil.set(key, now + ms);
  }
}

/** Map an HTTP status to how long that key should rest (undefined = not the key's fault). */
export function coolDownFor(status: number): number | undefined {
  if (status === 429) return COOL_DOWN_MS.rateLimited;
  if (status === 401 || status === 403) return COOL_DOWN_MS.rejected;
  if (status >= 500) return COOL_DOWN_MS.serverError;
  return undefined;
}

/**
 * Thrown when a model id doesn't exist or this account can't use it (404 on
 * every key). The router remembers it and stops wasting calls on that model.
 */
export class ModelUnavailableError extends Error {
  constructor(readonly modelId: string) {
    super(`Model ${modelId} is not available to these keys`);
    this.name = "ModelUnavailableError";
  }
}

/** The vendor answered 200 but with nothing usable. Never retried on another key. */
export class EmptyCompletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmptyCompletionError";
  }
}

/**
 * Try each available key in turn. A key that is refused rests and the next one
 * is tried; 404 on every key means the model itself is unavailable.
 */
export async function withKeys<T>(
  ring: KeyRing,
  modelId: string,
  label: string,
  attempt: (key: string) => Promise<{ status: number; value?: T }>,
): Promise<T> {
  const keys = ring.available();
  if (keys.length === 0) throw new Error(`${label}: every key is resting after a limit`);
  let notFound = 0;
  let lastStatus = 0;
  for (const key of keys) {
    let result: { status: number; value?: T };
    try {
      result = await attempt(key);
    } catch (err) {
      if (err instanceof EmptyCompletionError) throw err; // the model's answer, not the key's fault
      ring.rest(key, COOL_DOWN_MS.serverError);
      lastStatus = 0;
      continue;
    }
    if (result.status === 200 && result.value !== undefined) return result.value;
    lastStatus = result.status;
    if (result.status === 404) {
      notFound += 1;
      continue;
    }
    const ms = coolDownFor(result.status);
    if (ms === undefined) break; // 400 etc: the request is wrong, other keys won't help
    ring.rest(key, ms);
  }
  if (notFound === keys.length) throw new ModelUnavailableError(modelId);
  throw new Error(`${label} request failed (${lastStatus || "network"})`);
}
