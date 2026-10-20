/**
 * Cycle Estimator — how many delivery cycles does this project need?
 * ─────────────────────────────────────────────────────────────────────────
 * A cycle count is not a feeling. It is a function of measurable surface area
 * and risk, scored the same way every time so two projects can be compared and
 * a client can be quoted honestly.
 *
 * The five cycles are fixed in purpose:
 *   1 Make it HONEST   — blockers; no output may mislead a user
 *   2 Make it SAFE     — validation, limits, strict types, secrets
 *   3 Make it TESTED   — unit + integration + the core journey e2e
 *   4 Make it BEAUTIFUL— tokens, visual baselines, accessibility AA
 *   5 Make it SELLABLE — docs, deploy, demo, price, handover
 *
 * A project stops at the cycle its risk justifies. Charging a client for
 * cycle 5 on a throwaway internal tool is padding; stopping at cycle 2 on a
 * client-facing product is negligence. This function draws that line with
 * numbers instead of instinct.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type Tier = "mid" | "high" | "premium";

/** Everything measured from the repo — no opinions, all countable. */
export interface ProjectSignals {
  /** Distinct screens/views a user can reach. */
  screens: number;
  /** Server routes / endpoints. */
  apiRoutes: number;
  /** Lines of source (excluding deps and generated output). */
  linesOfCode: number;
  /** Distinct user roles the product serves (rider, driver, admin…). */
  personas: number;
  /** External services: payments, maps, AI, email, storage, auth provider… */
  integrations: number;
  /** Existing automated tests. */
  testCount: number;
  /** Money moves through it. */
  handlesPayments: boolean;
  /** Stores personal data (names, phones, addresses, health, location). */
  handlesPersonalData: boolean;
  /** Live updates: sockets, polling, streaming, tracking. */
  realtime: boolean;
  /** A paying client or the public will use it (not an internal experiment). */
  clientFacing: boolean;
}

export interface CycleEstimate {
  tier: Tier;
  /** Total cycles this project should run. */
  cycles: number;
  /** 0-20ish; the raw complexity score behind the decision. */
  score: number;
  /** Human-readable reasons, biggest contributor first. */
  drivers: string[];
  /** Sessions of focused work, per cycle — a planning aid, not a promise. */
  sessionsPerCycle: number;
  /** "high" when signals are complete, "low" when key facts are unknown. */
  confidence: "low" | "medium" | "high";
}

/** Band a count into 0/1/2 points. */
function band(value: number, mid: number, high: number): number {
  if (value >= high) return 2;
  if (value >= mid) return 1;
  return 0;
}

export function estimateCycles(s: ProjectSignals): CycleEstimate {
  const parts: Array<{ points: number; reason: string }> = [];

  const screenPts = band(s.screens, 4, 9);
  if (screenPts) parts.push({ points: screenPts, reason: `${s.screens} screens to design, state and test` });

  const routePts = band(s.apiRoutes, 4, 11);
  if (routePts) parts.push({ points: routePts, reason: `${s.apiRoutes} API routes to guard and validate` });

  const locPts = band(s.linesOfCode, 2000, 8000);
  if (locPts) parts.push({ points: locPts, reason: `${s.linesOfCode.toLocaleString()} lines of existing code to understand` });

  const personaPts = s.personas >= 3 ? 2 : s.personas === 2 ? 1 : 0;
  if (personaPts) parts.push({ points: personaPts, reason: `${s.personas} distinct user roles — each needs its own journey` });

  const integrationPts = Math.min(2, s.integrations);
  if (integrationPts) parts.push({ points: integrationPts, reason: `${s.integrations} external service(s) that can fail or cost money` });

  // Risk multipliers — these are why cycles exist at all.
  if (s.handlesPayments) parts.push({ points: 3, reason: "handles payments — errors cost real money" });
  if (s.handlesPersonalData) parts.push({ points: 2, reason: "stores personal data — privacy and leak risk" });
  if (s.realtime) parts.push({ points: 2, reason: "realtime behaviour — hardest class of bug to reproduce" });
  if (s.clientFacing) parts.push({ points: 2, reason: "client-facing — reputation is on the line" });

  // Test debt: no safety net means every later change is a gamble.
  const testPts = s.testCount === 0 ? 2 : s.testCount < 20 ? 1 : 0;
  if (testPts) {
    parts.push({
      points: testPts,
      reason: s.testCount === 0 ? "zero tests — no regression safety net" : `${s.testCount} tests — thin coverage`,
    });
  }

  const score = parts.reduce((n, p) => n + p.points, 0);

  // Score → cycles. Never below 2 (honest + safe is the floor for anything
  // real), never above 5 (past that you are gold-plating, not de-risking).
  let cycles: number;
  if (score <= 3) cycles = 2;
  else if (score <= 6) cycles = 3;
  else if (score <= 10) cycles = 4;
  else cycles = 5;

  const tier: Tier = cycles <= 3 ? "mid" : cycles === 4 ? "high" : "premium";

  // Bigger codebases need longer cycles, not more of them.
  const sessionsPerCycle = s.linesOfCode > 8000 ? 3 : s.linesOfCode > 2500 ? 2 : 1;

  const drivers = parts.sort((a, b) => b.points - a.points).map((p) => p.reason);

  return { tier, cycles, score, drivers, sessionsPerCycle, confidence: "high" };
}

/** Cycle names, in order — used by reports and the UI. */
export const CYCLE_NAMES = [
  "Make it honest",
  "Make it safe",
  "Make it tested",
  "Make it beautiful",
  "Make it sellable",
] as const;

/** What remains after N completed cycles. */
export function remainingCycles(estimate: CycleEstimate, completed: number): {
  remaining: number;
  next: string | null;
  percentComplete: number;
} {
  const done = Math.max(0, Math.min(completed, estimate.cycles));
  const remaining = estimate.cycles - done;
  return {
    remaining,
    next: remaining > 0 ? (CYCLE_NAMES[done] ?? null) : null,
    percentComplete: Math.round((done / estimate.cycles) * 100),
  };
}
