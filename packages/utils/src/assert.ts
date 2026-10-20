/**
 * invariant — fail fast on programmer errors (conditions that should never happen).
 * Use for internal consistency checks, NOT for validating external input
 * (use zod/Result for that). Throws a clearly-labelled error.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violation: ${message}`);
  }
}

/** Exhaustiveness guard for discriminated unions — compile error if a case is missed. */
export function assertNever(value: never, label = "value"): never {
  throw new Error(`Unexpected ${label}: ${JSON.stringify(value)}`);
}
