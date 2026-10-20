import { describe, it, expect } from "vitest";
import { getProjectsRepository } from "../projects.repo";

// No MONGODB_URI in tests → the in-memory repository is used (deterministic).
const repo = getProjectsRepository();
const ws = () => `wsp_test_${Math.random().toString(36).slice(2, 8)}`;

describe("ProjectsRepository (in-memory)", () => {
  it("creates and lists a project in a workspace", async () => {
    const w = ws();
    const created = await repo.create(w, { name: "Ledger", domain: "fintech" });
    expect(created.id).toMatch(/^prj_/);
    expect(created.status).toBe("active");

    const list = await repo.list(w);
    expect(list.some((p) => p.id === created.id)).toBe(true);
  });

  it("gets a project by id", async () => {
    const w = ws();
    const created = await repo.create(w, { name: "Atlas", domain: "developer" });
    const got = await repo.get(w, created.id);
    expect(got?.name).toBe("Atlas");
  });

  it("isolates data between workspaces", async () => {
    const a = ws();
    const b = ws();
    const made = await repo.create(a, { name: "SecretA", domain: "creative" });
    const inB = await repo.get(b, made.id);
    expect(inB).toBeNull(); // workspace B cannot see workspace A's project
  });

  it("archives and restores a project (soft, reversible)", async () => {
    const w = ws();
    const created = await repo.create(w, { name: "Vault", domain: "fintech" });

    const archived = await repo.update(w, created.id, { status: "archived" });
    expect(archived?.status).toBe("archived");

    const restored = await repo.update(w, created.id, { status: "active" });
    expect(restored?.status).toBe("active");
  });

  it("update is workspace-scoped (cannot archive another workspace's project)", async () => {
    const a = ws();
    const b = ws();
    const made = await repo.create(a, { name: "Fort", domain: "developer" });
    const fromB = await repo.update(b, made.id, { status: "archived" });
    expect(fromB).toBeNull();

    const stillActive = await repo.get(a, made.id);
    expect(stillActive?.status).toBe("active");
  });

  it("paginates and filters the list", async () => {
    const w = ws();
    await repo.create(w, { name: "One", domain: "founder" });
    await repo.create(w, { name: "Two", domain: "founder" });
    const third = await repo.create(w, { name: "Three", domain: "founder" });
    await repo.update(w, third.id, { status: "archived" });

    const firstPage = await repo.list(w, { limit: 2 });
    expect(firstPage.length).toBe(2);

    const nextPage = await repo.list(w, { limit: 2, offset: 2 });
    expect(nextPage.length).toBeGreaterThan(0);
    expect(nextPage[0]?.id).not.toBe(firstPage[0]?.id);

    const archivedOnly = await repo.list(w, { status: "archived" });
    expect(archivedOnly.every((p) => p.status === "archived")).toBe(true);
    expect(archivedOnly.some((p) => p.id === third.id)).toBe(true);
  });
});
