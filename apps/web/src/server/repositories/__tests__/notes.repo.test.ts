import { describe, it, expect } from "vitest";
import { getNotesRepository } from "../notes.repo";

const repo = getNotesRepository();
const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

describe("NotesRepository (in-memory)", () => {
  it("adds and lists notes for a project", async () => {
    const ws = id("wsp");
    const prj = id("prj");
    await repo.add(ws, prj, "First decision");
    await repo.add(ws, prj, "Second decision");
    const list = await repo.list(ws, prj);
    expect(list).toHaveLength(2);
    expect(list[0]?.text).toBe("Second decision"); // newest first
  });

  it("scopes notes to (workspace, project)", async () => {
    const ws = id("wsp");
    await repo.add(ws, id("prj"), "belongs to project X");
    const other = await repo.list(ws, id("prj")); // a different project
    expect(other).toHaveLength(0);
  });
});
