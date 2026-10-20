import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Session & workspace.
 * ─────────────────────────────────────────────────────────────────────────
 * Real cookie-based sessions (httpOnly, the secure part) with a simplified
 * sign-in: an email creates a stable user + workspace. Same email → same
 * workspace every time, so your data persists. To go to production, swap
 * `signInWithEmail` for magic-link/OAuth and sign/encrypt the cookie payload —
 * everything else (scoping, guards) stays the same.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface Session {
  userId: string;
  workspaceId: string;
  email: string;
}

const COOKIE = "fos_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Deterministic id from a string (so an email always maps to the same workspace). */
function hashId(prefix: string, input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${prefix}_${(h >>> 0).toString(36).padStart(7, "0")}`;
}

export function sessionFromEmail(email: string): Session {
  const normalized = email.trim().toLowerCase();
  return {
    email: normalized,
    userId: hashId("usr", normalized),
    workspaceId: hashId("wsp", normalized),
  };
}

// HMAC-signed cookie: payload.signature. A tampered payload fails verification,
// so a user can't forge a different workspaceId. Set AUTH_SECRET in production.
const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function encode(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(raw: string): Session | null {
  try {
    const [payload, sig] = raw.split(".");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null; // reject forged cookies
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return s && s.userId && s.workspaceId ? (s as Session) : null;
  } catch {
    return null;
  }
}

/** Read the current session (server components & route handlers). */
export function getSession(): Session | null {
  const raw = cookies().get(COOKIE)?.value;
  return raw ? decode(raw) : null;
}

/** Write the session cookie (route handlers / server actions only). */
export function writeSession(session: Session): void {
  cookies().set(COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSession(): void {
  cookies().delete(COOKIE);
}

/** Guard for route handlers: returns the session or throws a 401-tagged error. */
export function requireSession(): Session {
  const s = getSession();
  if (!s) {
    const err = new Error("Authentication required") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return s;
}
