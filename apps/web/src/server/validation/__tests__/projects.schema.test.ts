import { describe, it, expect } from "vitest";
import { createProjectSchema } from "../projects.schema";

describe("createProjectSchema", () => {
  it("accepts a valid project", () => {
    const r = createProjectSchema.safeParse({ name: "Ledger", domain: "fintech", summary: "Payments" });
    expect(r.success).toBe(true);
  });

  it("rejects a too-short name", () => {
    const r = createProjectSchema.safeParse({ name: "A", domain: "fintech" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown domain", () => {
    const r = createProjectSchema.safeParse({ name: "Valid", domain: "spaceship" });
    expect(r.success).toBe(false);
  });

  it("trims the name", () => {
    const r = createProjectSchema.safeParse({ name: "  Atlas  ", domain: "developer" });
    expect(r.success && r.data.name).toBe("Atlas");
  });
});
