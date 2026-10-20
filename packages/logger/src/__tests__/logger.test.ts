import { describe, it, expect } from "vitest";
import { createLogger } from "../logger";

function capture() {
  const lines: string[] = [];
  return { lines, sink: (l: string) => lines.push(l) };
}

describe("createLogger", () => {
  it("emits structured JSON with service + msg", () => {
    const { lines, sink } = capture();
    createLogger({ sink, service: "test" }).info("hello", { a: 1 });
    const rec = JSON.parse(lines[0] as string);
    expect(rec).toMatchObject({ level: "info", service: "test", msg: "hello", a: 1 });
    expect(typeof rec.ts).toBe("string");
  });

  it("respects the minimum level", () => {
    const { lines, sink } = capture();
    const log = createLogger({ sink, level: "warn" });
    log.info("skip");
    log.warn("keep");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string).msg).toBe("keep");
  });

  it("redacts secret keys and key-like values", () => {
    const { lines, sink } = capture();
    createLogger({ sink }).info("auth", { apiKey: "sk-abcdefghijklmno", nested: { token: "x" }, plain: "ok" });
    const rec = JSON.parse(lines[0] as string);
    expect(rec.apiKey).toBe("[redacted]");
    expect(rec.nested.token).toBe("[redacted]");
    expect(rec.plain).toBe("ok");
  });

  it("threads child bindings", () => {
    const { lines, sink } = capture();
    createLogger({ sink }).child({ runId: "run_1" }).info("x");
    expect(JSON.parse(lines[0] as string).runId).toBe("run_1");
  });
});
