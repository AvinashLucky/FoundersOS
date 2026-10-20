import { describe, it, expect } from "vitest";
import { runAgentLoop, type RunEvent } from "../run-service";

// Runs offline via the EchoProvider (no ANTHROPIC_API_KEY needed).
describe("runAgentLoop (v2 — governed loop)", () => {
  it("returns one synthesized answer plus the side-channel", async () => {
    const result = await runAgentLoop("Design the onboarding flow");
    expect(typeof result.answer).toBe("string");
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.departments.at(-1)?.abbr).toBe("CEO");
  });

  it("activates only the departments the intent needs (token economy)", async () => {
    const result = await runAgentLoop("Design the onboarding flow");
    // "design/onboarding/flow" → PM + UX, not the whole company.
    expect(result.plan.activated).toContain("PM");
    expect(result.plan.activated).toContain("UX");
    expect(result.plan.skipped).toContain("AR");
    // side-channel = activated departments + CEO
    expect(result.departments).toHaveLength(result.plan.activated.length + 1);
  });

  it("activates the full company for ambiguous intents", async () => {
    const result = await runAgentLoop("Help me with my startup");
    expect(result.plan.activated).toEqual(["PM", "AR", "UX", "QA"]);
    expect(result.plan.skipped).toHaveLength(0);
  });

  it("streams plan → departments → critiques → synthesis in order", async () => {
    const events: RunEvent[] = [];
    await runAgentLoop("Build the billing API", (e) => events.push(e));
    expect(events[0]?.type).toBe("plan");
    const types = events.map((e) => e.type);
    expect(types.lastIndexOf("department")).toBeLessThan(types.indexOf("synthesis"));
    // Critiques sit strictly between the last department and the synthesis.
    const firstCritique = types.indexOf("critique");
    const lastCritique = types.lastIndexOf("critique");
    expect(firstCritique).toBeGreaterThan(types.lastIndexOf("department"));
    expect(lastCritique).toBeLessThan(types.indexOf("synthesis"));
  });

  it("produces a debate with genuine tension (challenge or concern)", async () => {
    const result = await runAgentLoop("Design and build the checkout flow with security review");
    expect(result.debate.length).toBeGreaterThan(0);
    expect(result.debate.some((d) => d.stance === "challenge" || d.stance === "concern")).toBe(true);
    // Every message is between two DIFFERENT activated departments.
    for (const d of result.debate) {
      expect(d.from).not.toBe(d.to);
      expect(result.plan.activated).toContain(d.from);
      expect(result.plan.activated).toContain(d.to);
      expect(d.text.length).toBeGreaterThan(10);
    }
    // The debate never pollutes the departments side-channel.
    expect(result.departments).toHaveLength(result.plan.activated.length + 1);
  });

  it("injects project memory into the run context without failing", async () => {
    const result = await runAgentLoop("Improve the pricing page design", undefined, {
      memory: ["Decision: pricing has three tiers", "Decision: brand color is indigo"],
    });
    expect(result.answer.length).toBeGreaterThan(0);
  });

  it("reports a non-negative cost and timing", async () => {
    const result = await runAgentLoop("Plan a pricing page");
    expect(result.costUsd).toBeGreaterThanOrEqual(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.tokens).toBeGreaterThan(0);
  });
});
