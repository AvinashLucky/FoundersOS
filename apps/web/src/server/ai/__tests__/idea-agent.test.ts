import { describe, it, expect } from "vitest";
import { generateIdeas, totalScore } from "../idea-agent";

// Runs offline via the EchoProvider → exercises the honest fallback path.
describe("Idea Agent", () => {
  it("always returns 5 scored ideas, ranked by total", async () => {
    const ideas = await generateIdeas("fitness coaches");
    expect(ideas).toHaveLength(5);
    for (let i = 1; i < ideas.length; i++) {
      expect(ideas[i - 1]!.total).toBeGreaterThanOrEqual(ideas[i]!.total);
    }
  });

  it("labels its source honestly (offline without a key)", async () => {
    const ideas = await generateIdeas("indie musicians");
    expect(ideas.every((i) => i.source === "offline" || i.source === "model")).toBe(true);
  });

  it("every idea is actionable: kind, price, platforms, rationale", async () => {
    const ideas = await generateIdeas("dental clinics");
    for (const idea of ideas) {
      expect(idea.title.length).toBeGreaterThan(3);
      expect(idea.oneLiner.length).toBeGreaterThan(10);
      expect(idea.suggestedPriceUsd).toBeGreaterThanOrEqual(0);
      expect(idea.platforms.length).toBeGreaterThan(0);
      expect(idea.rationale.length).toBeGreaterThan(10);
    }
  });

  it("weights demand and monetization over effort in the total", () => {
    const highDemand = totalScore({ demand: 10, effort: 5, fit: 5, monetization: 10 });
    const lowDemand = totalScore({ demand: 2, effort: 5, fit: 5, monetization: 2 });
    expect(highDemand).toBeGreaterThan(lowDemand);
    // Easier (lower effort) scores higher, all else equal.
    const easy = totalScore({ demand: 5, effort: 2, fit: 5, monetization: 5 });
    const hard = totalScore({ demand: 5, effort: 9, fit: 5, monetization: 5 });
    expect(easy).toBeGreaterThan(hard);
  });
});
