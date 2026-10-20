import { describe, it, expect } from "vitest";
import { runResearch, type ResearchEvent } from "../research-agent";

// No TAVILY_API_KEY in tests → the offline fixture provider (deterministic).
describe("Research Agent (offline seam)", () => {
  it("produces a complete brief: summary, competitors, demand, risks, opportunities", async () => {
    const brief = await runResearch("AI assistants for fitness coaches");
    expect(brief.topic).toBe("AI assistants for fitness coaches");
    expect(brief.summary.length).toBeGreaterThan(50);
    expect(brief.competitors.length).toBeGreaterThan(0);
    expect(brief.demand.length).toBeGreaterThan(10);
    expect(brief.risks.length).toBeGreaterThan(0);
    expect(brief.opportunities.length).toBeGreaterThan(0);
  });

  it("always carries sources — no uncited research", async () => {
    const brief = await runResearch("client portals for dental clinics");
    expect(brief.sources.length).toBeGreaterThan(0);
    for (const s of brief.sources) {
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.title.length).toBeGreaterThan(3);
    }
  });

  it("labels offline research honestly", async () => {
    const brief = await runResearch("ecommerce kits for indie musicians");
    expect(brief.source).toBe("offline");
    expect(brief.summary.toLowerCase()).toContain("offline");
  });

  it("streams query → hits → distill → done in order", async () => {
    const events: ResearchEvent[] = [];
    await runResearch("automation systems for real estate agents", (e) => events.push(e));
    const types = events.map((e) => e.type);
    expect(types[0]).toBe("query");
    expect(types.filter((t) => t === "query")).toHaveLength(3);
    expect(types.filter((t) => t === "hits")).toHaveLength(3);
    expect(types.indexOf("distill")).toBeGreaterThan(types.lastIndexOf("hits"));
    expect(types.at(-1)).toBe("done");
  });

  it("deduplicates sources and reports non-negative cost", async () => {
    const brief = await runResearch("newsletter tools for chefs");
    const urls = brief.sources.map((s) => s.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(brief.costUsd).toBeGreaterThanOrEqual(0);
    expect(brief.id).toMatch(/^res_/);
  });
});
