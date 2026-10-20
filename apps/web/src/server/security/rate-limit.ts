/**
 * Rate limiting + origin defense — the platform hardening seam.
 * ─────────────────────────────────────────────────────────────────────────
 * `rateLimit` is a fixed-window in-memory limiter, ideal for a single Next.js
 * instance (dev + small deploys). The interface is the contract: swap the
 * implementation for Redis (`INCR` + `EXPIRE`) when scaling out — callers
 * never change. `sameOrigin` blocks cross-site mutations (CSRF defense in
 * depth on top of SameSite=Lax cookies).
 * ─────────────────────────────────────────────────────────────────────────
 */

interface RateWindow {
  count: number;
  resetAt: number; // epoch ms when this window ends
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry (for the Retry-After header). */
  retryAfterSec: number;
  remaining: number;
}

// Survives hot-reload in dev, like the in-memory repositories.
const g = globalThis as unknown as { __rateWindows?: Map<string, RateWindow> };
const windows = (g.__rateWindows ??= new Map<string, RateWindow>());

/**
 * Consume one request from `bucket` for `key` (a workspace id or IP).
 * Example: rateLimit("runs", session.workspaceId, { limit: 6, windowMs: 60_000 })
 */
export function rateLimit(
  bucket: string,
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const id = `${bucket}:${key}`;
  const now = Date.now();
  let w: RateWindow | undefined = windows.get(id);

  if (!w || now >= w.resetAt) {
    w = { count: 0, resetAt: now + windowMs };
    windows.set(id, w);
  }

  w.count += 1;
  const ok = w.count <= limit;
  return {
    ok,
    retryAfterSec: ok ? 0 : Math.max(1, Math.ceil((w.resetAt - now) / 1000)),
    remaining: Math.max(0, limit - w.count),
  };
}

/** Test hook — clear all windows (never used by production code). */
export function resetRateLimits(): void {
  windows.clear();
}

/** Best-effort client key for unauthenticated routes (behind a proxy or not). */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/**
 * CSRF defense: on mutations, the Origin header (when the browser sends one)
 * must match the Host we're serving. Same-origin fetches always pass; a forged
 * cross-site form/fetch fails. Requests without Origin (curl, tests) pass —
 * they don't carry ambient cookies from a victim's browser session anyway.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
