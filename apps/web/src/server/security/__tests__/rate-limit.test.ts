import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimits, sameOrigin, clientKey } from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests under the limit and blocks over it", () => {
    const opts = { limit: 3, windowMs: 60_000 };
    expect(rateLimit("t", "k", opts).ok).toBe(true);
    expect(rateLimit("t", "k", opts).ok).toBe(true);
    expect(rateLimit("t", "k", opts).ok).toBe(true);

    const blocked = rateLimit("t", "k", opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks keys independently (one workspace can't exhaust another)", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(rateLimit("t", "a", opts).ok).toBe(true);
    expect(rateLimit("t", "a", opts).ok).toBe(false);
    expect(rateLimit("t", "b", opts).ok).toBe(true); // different key, fresh budget
  });

  it("tracks buckets independently (runs vs auth budgets don't mix)", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(rateLimit("runs", "k", opts).ok).toBe(true);
    expect(rateLimit("auth", "k", opts).ok).toBe(true);
  });

  it("resets after the window passes", () => {
    const opts = { limit: 1, windowMs: 1 }; // 1ms window
    expect(rateLimit("t", "k", opts).ok).toBe(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(rateLimit("t", "k", opts).ok).toBe(true);
        resolve();
      }, 5);
    });
  });
});

describe("sameOrigin", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://localhost/api", { headers });

  it("passes when Origin matches Host", () => {
    expect(sameOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(true);
  });

  it("rejects a cross-site Origin", () => {
    expect(sameOrigin(req({ origin: "https://evil.example", host: "localhost:3000" }))).toBe(false);
  });

  it("passes when Origin is absent (non-browser clients)", () => {
    expect(sameOrigin(req({ host: "localhost:3000" }))).toBe(true);
  });

  it("rejects a malformed Origin", () => {
    expect(sameOrigin(req({ origin: "not a url", host: "localhost:3000" }))).toBe(false);
  });
});

describe("clientKey", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const req = new Request("http://x/", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientKey(req)).toBe("1.2.3.4");
  });

  it("falls back to 'local' with no proxy headers", () => {
    expect(clientKey(new Request("http://x/"))).toBe("local");
  });
});
