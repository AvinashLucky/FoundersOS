/**
 * Result<T, E> — explicit success/failure without exceptions for expected errors.
 * Use for domain operations that can fail in known ways; reserve `throw` for
 * truly exceptional, unrecoverable conditions. This keeps error handling visible
 * in the type signature (FounderOS engineering standard: never swallow errors).
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Narrowing helpers (useful in pipelines and tests). */
export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok;

/** Transform the success value, leaving errors untouched. */
export function map<T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

/** Chain fallible operations; short-circuits on the first error. */
export function flatMap<T, U, E>(r: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return r.ok ? fn(r.value) : r;
}

/** Unwrap or fall back to a default — never throws. */
export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

/** Run a throwing function and capture the outcome as a Result. */
export function fromThrowable<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/** Async variant of fromThrowable. */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await promise);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
