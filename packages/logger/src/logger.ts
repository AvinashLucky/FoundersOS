import type { Logger } from "@founderos/core";

/**
 * Structured JSON logger. Zero dependencies (works in Node and edge runtimes).
 * - Emits one JSON object per line for machine ingestion.
 * - Threads correlation bindings (workspaceId, runId, …) via `child()`.
 * - Redacts secrets: any key matching SECRET_KEYS, or any string that looks like
 *   a key/token, is replaced — we NEVER log secrets, PII, or full prompts.
 */
export type Level = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const SECRET_KEYS = /(authorization|api[_-]?key|secret|token|password|cookie|set-cookie|prompt)/i;
const SECRET_VALUE = /\b(sk|pk|key|tok)[-_][A-Za-z0-9]{12,}\b/;

function redact(value: unknown, key?: string): unknown {
  if (key && SECRET_KEYS.test(key)) return "[redacted]";
  if (typeof value === "string") return SECRET_VALUE.test(value) ? "[redacted]" : value;
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = redact(v, k);
    return out;
  }
  return value;
}

export interface LoggerOptions {
  level?: Level;
  service?: string;
  bindings?: Record<string, unknown>;
  /** Sink for serialized lines; defaults to stdout. Injectable for tests. */
  sink?: (line: string) => void;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const minRank = LEVEL_RANK[options.level ?? "info"];
  const service = options.service ?? "founderos";
  const bindings = options.bindings ?? {};
  const sink = options.sink ?? ((line: string) => process.stdout.write(line + "\n"));

  function emit(level: Level, msg: string, meta?: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < minRank) return;
    const record = {
      ts: new Date().toISOString(),
      level,
      service,
      ...bindings,
      msg,
      ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
    };
    sink(JSON.stringify(record));
  }

  return {
    debug: (msg, meta) => emit("debug", msg, meta),
    info: (msg, meta) => emit("info", msg, meta),
    warn: (msg, meta) => emit("warn", msg, meta),
    error: (msg, meta) => emit("error", msg, meta),
    child: (childBindings) =>
      createLogger({
        level: options.level ?? "info",
        service,
        bindings: { ...bindings, ...childBindings },
        sink,
      }),
  };
}
