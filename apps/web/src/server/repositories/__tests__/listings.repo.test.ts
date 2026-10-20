import { describe, it, expect } from "vitest";
import { getListingsRepository } from "../listings.repo";

// No MONGODB_URI in tests → the in-memory repository is used (deterministic).
const repo = getListingsRepository();
const ws = () => `wsp_test_${Math.random().toString(36).slice(2, 8)}`;

const input = {
  title: "AI Assistant Starter Kit",
  kind: "ai" as const,
  pitch: "A ready-to-deploy AI assistant template for coaches.",
  priceUsd: 79,
  platforms: ["gumroad" as const, "fiverr" as const],
};

describe("ListingsRepository (in-memory)", () => {
  it("creates a draft listing", async () => {
    const w = ws();
    const l = await repo.create(w, input);
    expect(l.id).toMatch(/^lst_/);
    expect(l.status).toBe("draft");
    expect(l.posted).toEqual({});
  });

  it("marking a platform posted flips status to posted; unmarking flips back", async () => {
    const w = ws();
    const l = await repo.create(w, input);

    const live = await repo.update(w, l.id, { posted: { gumroad: true } });
    expect(live?.status).toBe("posted");
    expect(live?.posted.gumroad).toBeTruthy();

    const draft = await repo.update(w, l.id, { posted: { gumroad: false } });
    expect(draft?.status).toBe("draft");
    expect(draft?.posted.gumroad).toBeUndefined();
  });

  it("isolates listings between workspaces", async () => {
    const a = ws();
    const b = ws();
    const made = await repo.create(a, input);
    const fromB = await repo.update(b, made.id, { posted: { gumroad: true } });
    expect(fromB).toBeNull();
  });

  it("edits fields and bumps updatedAt", async () => {
    const w = ws();
    const l = await repo.create(w, input);
    const edited = await repo.update(w, l.id, { title: "Renamed Kit", priceUsd: 99 });
    expect(edited?.title).toBe("Renamed Kit");
    expect(edited?.priceUsd).toBe(99);
  });
});
