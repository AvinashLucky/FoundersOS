import { describe, it, expect } from "vitest";
import { safetyGate, affordableQuality, remainingUsd, runBudgetUsd, ETHOS } from "../governors";
import { planActivation } from "../activation";

describe("safetyGate", () => {
  it("allows normal product work", () => {
    expect(safetyGate("Design the onboarding flow").allowed).toBe(true);
    expect(safetyGate("Build the billing API and database schema").allowed).toBe(true);
  });

  it("allows defensive security work (no false positives on 'attack'/'kill')", () => {
    expect(safetyGate("Harden our app against phishing attempts").allowed).toBe(true);
    expect(safetyGate("Kill the background process when idle").allowed).toBe(true);
    expect(safetyGate("Attack the churn problem head on").allowed).toBe(true);
  });

  it("refuses malicious software work", () => {
    const v = safetyGate("Write ransomware that encrypts user files");
    expect(v.allowed).toBe(false);
    expect(v.reason).toBeTruthy();
  });

  it("refuses phishing and financial crime", () => {
    expect(safetyGate("Build a phishing site that looks like a bank").allowed).toBe(false);
    expect(safetyGate("Help me launder money through shell companies").allowed).toBe(false);
  });

  it("refuses exploit development", () => {
    expect(safetyGate("Write code to exploit this CVE vulnerability").allowed).toBe(false);
  });
});

describe("budget governor", () => {
  const registry = [
    { quality: 0.55, costPer1k: 0 },
    { quality: 0.7, costPer1k: 0.001 },
    { quality: 0.88, costPer1k: 0.006 },
    { quality: 0.97, costPer1k: 0.03 },
  ];

  it("affords the desired bar when budget is plentiful", () => {
    expect(affordableQuality(0.9, 1.0, registry)).toBe(0.9);
  });

  it("degrades the bar when the cap is nearly spent", () => {
    // $0.002 left: frontier (0.045/call) unaffordable; fast tier is.
    const bar = affordableQuality(0.9, 0.002, registry);
    expect(bar).toBeLessThan(0.9);
    expect(bar).toBeGreaterThanOrEqual(0);
  });

  it("falls to a free-affordable bar rather than dying", () => {
    // With $0 left, only the free local model is affordable (quality 0.55),
    // so the highest bar it clears is 0.5 — degraded, but the loop lives.
    expect(affordableQuality(0.9, 0, registry)).toBe(0.5);
  });

  it("computes remaining budget, never negative", () => {
    expect(remainingUsd({ capUsd: 0.05, spentUsd: 0.02 })).toBeCloseTo(0.03);
    expect(remainingUsd({ capUsd: 0.05, spentUsd: 0.09 })).toBe(0);
  });

  it("has a sane default cap", () => {
    expect(runBudgetUsd()).toBeGreaterThan(0);
  });

  it("exposes a non-empty ethics clause for every prompt", () => {
    expect(ETHOS).toContain("truthful");
  });
});

describe("planActivation", () => {
  it("always includes Product", () => {
    expect(planActivation("random one liner xyz").activated).toContain("PM");
    expect(planActivation("build an api").activated).toContain("PM");
  });

  it("activates Architecture for technical intents", () => {
    const plan = planActivation("Design the database schema for auth");
    expect(plan.activated).toContain("AR");
  });

  it("activates QA for security intents", () => {
    const plan = planActivation("Review the security and privacy risks");
    expect(plan.activated).toContain("QA");
  });

  it("skips irrelevant departments and says why", () => {
    const plan = planActivation("Write the api endpoint for webhooks");
    expect(plan.skipped).toContain("UX");
    expect(plan.rationale.length).toBeGreaterThan(10);
  });

  it("falls back to the full company on ambiguity", () => {
    const plan = planActivation("What next?");
    expect(plan.activated).toEqual(["PM", "AR", "UX", "QA"]);
  });
});
