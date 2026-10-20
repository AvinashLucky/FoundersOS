import { describe, it, expect } from "vitest";
import { generateBlueprint, blueprintToMarkdown, type BlueprintEvent } from "../blueprint-agent";

// Offline via Echo — exercises the honest fallback path end to end.
const REQ = "A dental clinic wants missed calls turned into booked appointments automatically";

describe("Blueprint Agent (offline seam)", () => {
  it("produces a complete, sellable blueprint", async () => {
    const b = await generateBlueprint(REQ);
    expect(b.id).toMatch(/^bp_/);
    expect(b.requirement).toBe(REQ);
    expect(b.understanding.length).toBeGreaterThan(50);
    expect(b.agenticLoop.length).toBeGreaterThanOrEqual(3);
    expect(b.techStack.length).toBeGreaterThanOrEqual(3);
    expect(b.milestones.length).toBeGreaterThanOrEqual(3);
    expect(b.risks.length).toBeGreaterThan(0);
    expect(b.mlSystems.length).toBeGreaterThan(0);
  });

  it("every loop step names a role, a tool and a handoff — no vague steps", async () => {
    const b = await generateBlueprint(REQ);
    for (const s of b.agenticLoop) {
      expect(s.role.length).toBeGreaterThan(1);
      expect(s.action.length).toBeGreaterThan(5);
      expect(s.tool.length).toBeGreaterThan(1);
      expect(s.output.length).toBeGreaterThan(3);
    }
  });

  it("prices the work both ways and explains why", async () => {
    const b = await generateBlueprint(REQ);
    expect(b.pricing.serviceUsd).toMatch(/\$/);
    expect(b.pricing.productUsd).toMatch(/\$/);
    expect(b.pricing.rationale.length).toBeGreaterThan(20);
  });

  it("includes a proof-post draft for the daily posting habit", async () => {
    const b = await generateBlueprint(REQ);
    expect(b.postDraft.length).toBeGreaterThan(60);
  });

  it("labels the offline path honestly instead of pretending it is bespoke", async () => {
    const b = await generateBlueprint(REQ);
    expect(b.source).toBe("offline");
    expect(b.understanding.toLowerCase()).toContain("offline");
  });

  it("streams understanding → designing → pricing → done", async () => {
    const events: BlueprintEvent[] = [];
    await generateBlueprint(REQ, (e) => events.push(e));
    expect(events.map((e) => e.type)).toEqual(["understanding", "designing", "pricing", "done"]);
  });

  it("renders portable Markdown with every section a client expects", async () => {
    const md = blueprintToMarkdown(await generateBlueprint(REQ));
    for (const heading of [
      "# Solution Blueprint",
      "## Understanding",
      "## Agentic loop",
      "## ML / GenAI systems",
      "## Tech stack",
      "## Milestones",
      "## Risks",
      "## Pricing",
    ]) {
      expect(md).toContain(heading);
    }
  });

  it("keeps costs honest — bands, never invented precision", async () => {
    const b = await generateBlueprint(REQ);
    expect(b.costUsd).toBeGreaterThanOrEqual(0);
    for (const s of b.techStack) expect(s.monthlyCost.length).toBeGreaterThan(0);
  });
});
