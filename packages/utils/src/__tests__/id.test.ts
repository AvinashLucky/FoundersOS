import { describe, it, expect } from "vitest";
import { newId, isId, uuid } from "../id";

describe("id", () => {
  it("creates prefixed ids of the expected shape", () => {
    const id = newId("prj");
    expect(id.startsWith("prj_")).toBe(true);
    expect(isId(id, "prj")).toBe(true);
  });

  it("rejects invalid prefixes", () => {
    expect(() => newId("BAD")).toThrow();
    expect(() => newId("x")).toThrow();
  });

  it("validates prefix mismatches", () => {
    expect(isId(newId("run"), "prj")).toBe(false);
    expect(isId("not-an-id", "prj")).toBe(false);
  });

  it("generates unique ids", () => {
    const set = new Set(Array.from({ length: 1000 }, () => newId("prj")));
    expect(set.size).toBe(1000);
  });

  it("produces standard uuids", () => {
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
