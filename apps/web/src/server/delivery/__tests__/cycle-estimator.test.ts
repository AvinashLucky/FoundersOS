import { describe, it, expect } from "vitest";
import {
  estimateCycles,
  remainingCycles,
  CYCLE_NAMES,
  type ProjectSignals,
} from "../cycle-estimator";

const base: ProjectSignals = {
  screens: 1,
  apiRoutes: 1,
  linesOfCode: 500,
  personas: 1,
  integrations: 0,
  testCount: 50,
  handlesPayments: false,
  handlesPersonalData: false,
  realtime: false,
  clientFacing: false,
};

describe("estimateCycles", () => {
  it("never returns fewer than 2 cycles — honest + safe is the floor", () => {
    expect(estimateCycles(base).cycles).toBe(2);
  });

  it("never returns more than 5 — past that is gold-plating, not de-risking", () => {
    const worst = estimateCycles({
      screens: 100,
      apiRoutes: 100,
      linesOfCode: 500_000,
      personas: 10,
      integrations: 10,
      testCount: 0,
      handlesPayments: true,
      handlesPersonalData: true,
      realtime: true,
      clientFacing: true,
    });
    expect(worst.cycles).toBe(5);
    expect(worst.tier).toBe("premium");
  });

  it("is monotonic — adding risk never reduces the cycle count", () => {
    const simple = estimateCycles(base);
    const riskier = estimateCycles({ ...base, handlesPayments: true, clientFacing: true });
    expect(riskier.score).toBeGreaterThan(simple.score);
    expect(riskier.cycles).toBeGreaterThanOrEqual(simple.cycles);
  });

  it("treats payments as the single heaviest risk", () => {
    const withPayments = estimateCycles({ ...base, handlesPayments: true });
    const withRealtime = estimateCycles({ ...base, realtime: true });
    expect(withPayments.score).toBeGreaterThan(withRealtime.score);
  });

  it("penalises zero tests more than thin tests", () => {
    const none = estimateCycles({ ...base, testCount: 0 });
    const thin = estimateCycles({ ...base, testCount: 10 });
    expect(none.score).toBeGreaterThan(thin.score);
  });

  it("explains itself — every estimate carries ordered, human reasons", () => {
    const e = estimateCycles({ ...base, screens: 9, clientFacing: true, testCount: 0 });
    expect(e.drivers.length).toBeGreaterThan(0);
    for (const d of e.drivers) expect(d.length).toBeGreaterThan(10);
    // Sorted by weight: the first reason is at least as heavy as the last.
    expect(e.drivers[0]).toBeTruthy();
  });

  it("scores Gati Rides as premium / 5 cycles from its measured signals", () => {
    const gati = estimateCycles({
      screens: 9,
      apiRoutes: 3,
      linesOfCode: 3797,
      personas: 4,
      integrations: 1,
      testCount: 0,
      handlesPayments: false,
      handlesPersonalData: true,
      realtime: true,
      clientFacing: true,
    });
    expect(gati.cycles).toBe(5);
    expect(gati.tier).toBe("premium");
    expect(gati.sessionsPerCycle).toBe(2);
  });

  it("rewards cutting scope with fewer sessions", () => {
    const full = estimateCycles({
      screens: 9, apiRoutes: 3, linesOfCode: 3797, personas: 4, integrations: 1,
      testCount: 0, handlesPayments: false, handlesPersonalData: true, realtime: true, clientFacing: true,
    });
    const focused = estimateCycles({
      screens: 4, apiRoutes: 3, linesOfCode: 2400, personas: 1, integrations: 1,
      testCount: 0, handlesPayments: false, handlesPersonalData: true, realtime: true, clientFacing: true,
    });
    expect(focused.score).toBeLessThan(full.score);
    expect(focused.cycles * focused.sessionsPerCycle).toBeLessThan(full.cycles * full.sessionsPerCycle);
  });
});

describe("remainingCycles", () => {
  it("reports progress as a percentage of the estimate", () => {
    const e = estimateCycles({ ...base, screens: 9, clientFacing: true, realtime: true, testCount: 0 });
    const r = remainingCycles(e, 1);
    expect(r.percentComplete).toBe(Math.round((1 / e.cycles) * 100));
    expect(r.remaining).toBe(e.cycles - 1);
    expect(r.next).toBe(CYCLE_NAMES[1]);
  });

  it("clamps over-completion instead of going negative", () => {
    const e = estimateCycles(base);
    const r = remainingCycles(e, 99);
    expect(r.remaining).toBe(0);
    expect(r.percentComplete).toBe(100);
    expect(r.next).toBeNull();
  });

  it("names five cycles in delivery order", () => {
    expect(CYCLE_NAMES).toHaveLength(5);
    expect(CYCLE_NAMES[0]).toContain("honest");
    expect(CYCLE_NAMES[4]).toContain("sellable");
  });
});
