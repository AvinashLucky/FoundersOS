/**
 * Typed domain errors. Every failure that crosses a boundary is one of these,
 * carrying a stable `code` (for clients/logs) and an HTTP status hint. Never
 * throw raw strings; never expose internal messages to the founder unfiltered.
 */
export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "BUDGET_EXCEEDED"
  | "PROVIDER_FAILURE"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  BUDGET_EXCEEDED: 402,
  PROVIDER_FAILURE: 502,
  INTERNAL: 500,
};

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** Safe, structured context for logs — never put secrets here. */
  readonly context: Readonly<Record<string, unknown>>;

  constructor(code: ErrorCode, message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = STATUS[code];
    this.context = Object.freeze({ ...context });
  }

  /** Shape returned to API clients (problem+json style); never leaks internals. */
  toProblem(): { code: ErrorCode; message: string; status: number } {
    return { code: this.code, message: this.message, status: this.status };
  }
}

/** Convenience constructors for the common cases. */
export const Errors = {
  validation: (msg: string, ctx?: Record<string, unknown>) => new DomainError("VALIDATION", msg, ctx),
  unauthorized: (msg = "Authentication required") => new DomainError("UNAUTHORIZED", msg),
  forbidden: (msg = "Not permitted") => new DomainError("FORBIDDEN", msg),
  notFound: (what: string) => new DomainError("NOT_FOUND", `${what} not found`),
  conflict: (msg: string) => new DomainError("CONFLICT", msg),
  budget: (msg = "Run budget exceeded") => new DomainError("BUDGET_EXCEEDED", msg),
  provider: (msg: string, ctx?: Record<string, unknown>) => new DomainError("PROVIDER_FAILURE", msg, ctx),
  internal: (msg = "Internal error") => new DomainError("INTERNAL", msg),
} as const;

export function isDomainError(e: unknown): e is DomainError {
  return e instanceof DomainError;
}
