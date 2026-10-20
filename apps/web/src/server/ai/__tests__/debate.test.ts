import { describe, it, expect } from "vitest";
import { generateDebate } from "../debate";
import { ModelRouter } from "../router";
import { runAgentLoop } from "../run-service";
import { persistRun } from "../persist-run";
import { getRunsRepository } from "../../repositories/runs.repo";
import type { DepartmentResult } from "../types";

// Offline via the EchoProvider — exercises the role-flavoured fallback voices.
const dept = (abbr: string, role: string): DepartmentResult => ({
  abbr,
  role,
  output: `${role} take on the intent.`,
  modelId: "local-echo",
  costUsd: 0,
});

describe("generateDebate", () => {
  it("needs at least two departments to debate", async () => {
    const { entries, costUsd } = await generateDebate(new ModelRouter(), "Ship it", [
      dept("PM", "Product"),
    ]);
    expect(entries).toEqual([]);
    expect(costUsd).toBe(0);
  });

  it("every critique targets another ACTIVATED department", async () => {
    const departments = [dept("PM", "Product"), dept("UX", "Design")];
    const { entries } = await generateDebate(new ModelRouter(), "Design the pricing page", departments);
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(["PM", "UX"]).toContain(e.from);
      expect(["PM", "UX"]).toContain(e.to);
      expect(e.from).not.toBe(e.to);
    }
  });

  it("guarantees tension — never a round of pure agreement", async () => {
    const departments = [
      dept("PM", "Product"),
      dept("AR", "Architecture"),
      dept("UX", "Design"),
      dept("QA", "QA + Security"),
    ];
    const { entries } = await generateDebate(new ModelRouter(), "Build the whole app", departments);
    expect(entries.some((e) => e.stance === "challenge" || e.stance === "concern")).toBe(true);
  });

  it("offline voices are distinct per department (not filler)", async () => {
    const departments = [dept("QA", "QA + Security"), dept("AR", "Architecture"), dept("UX", "Design")];
    const { entries } = await generateDebate(new ModelRouter(), "Migrate the database", departments);
    const texts = entries.map((e) => e.text);
    expect(new Set(texts).size).toBe(texts.length); // no duplicated lines
    for (const t of texts) expect(t.length).toBeGreaterThan(30); // substantive, not filler
  });
});

describe("debate persistence", () => {
  it("saves plan, takes and debate with the run and returns them in history", async () => {
    const ws = `wsp_test_${Math.random().toString(36).slice(2, 8)}`;
    const result = await runAgentLoop("Design the secure checkout api");
    const saved = await persistRun(ws, "prj_test", "Design the secure checkout api", result);

    expect(saved.debate).toBeDefined();
    expect(saved.debate!.length).toBeGreaterThan(0);
    expect(saved.plan?.activated).toEqual(result.plan.activated);
    expect(saved.takes?.length).toBe(result.plan.activated.length); // takes exclude the CEO
    expect(saved.takes?.every((t) => t.abbr !== "CEO")).toBe(true);

    const history = await getRunsRepository().list(ws, "prj_test");
    const replay = history.find((r) => r.id === saved.id);
    expect(replay?.debate?.length).toBe(saved.debate!.length);
    expect(replay?.plan?.rationale).toBeTruthy();
  });
});
