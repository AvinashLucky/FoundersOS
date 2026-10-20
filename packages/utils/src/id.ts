/**
 * Prefixed, sortable-ish identifiers. Prefix makes IDs self-describing in logs
 * and URLs (e.g. `prj_a1b2…`); the random body uses the platform CSPRNG.
 * Format: `<prefix>_<26-char base32 random>`.
 */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz"; // Crockford-ish, no ambiguous chars

function randomBase32(length: number): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    // bytes[i] is defined for i < length; mask to alphabet size.
    out += ALPHABET[(bytes[i] as number) & 31];
  }
  return out;
}

/** Generate a prefixed id, e.g. newId("prj") → "prj_3f9k…". */
export function newId(prefix: string): string {
  if (!/^[a-z]{2,8}$/.test(prefix)) {
    throw new Error(`Invalid id prefix "${prefix}" (expected 2–8 lowercase letters)`);
  }
  return `${prefix}_${randomBase32(26)}`;
}

/** Validate that a value is an id with the expected prefix. */
export function isId(value: unknown, prefix: string): value is string {
  return typeof value === "string" && new RegExp(`^${prefix}_[0-9a-z]{26}$`).test(value);
}

/** A UUID v4 for cases requiring the standard format (external systems). */
export function uuid(): string {
  return globalThis.crypto.randomUUID();
}
