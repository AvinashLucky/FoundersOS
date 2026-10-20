/**
 * Minimum-set activation — the COO's first decision.
 * ─────────────────────────────────────────────────────────────────────────
 * Every department costs tokens (= money + latency). Instead of always waking
 * the whole company, the COO scores each department's relevance to the intent
 * and activates only what's needed:
 *   • Product is ALWAYS active — someone must own scope.
 *   • A department activates when the intent hits its vocabulary.
 *   • Ambiguous intent (no hits anywhere) → the full company runs; wrongly
 *     skipping a needed department is worse than spending a little more.
 * Deterministic and pure: no model call, zero cost, fully unit-testable.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface ActivationPlan {
  /** Department abbrs that will run (always includes PM). */
  activated: string[];
  /** Department abbrs deliberately left on standby. */
  skipped: string[];
  /** One human sentence: why this set (shown live in the run UI). */
  rationale: string;
}

const VOCAB: Record<string, string[]> = {
  AR: [
    "api", "backend", "database", "schema", "architecture", "system", "code", "build",
    "integrate", "integration", "deploy", "infra", "auth", "scale", "performance",
    "endpoint", "server", "cache", "queue", "migration", "refactor", "bug", "technical",
    "stack", "sdk", "webhook", "pipeline",
  ],
  UX: [
    "design", "ui", "ux", "screen", "page", "flow", "onboarding", "landing", "brand",
    "layout", "visual", "color", "animation", "logo", "typography", "wireframe",
    "prototype", "dashboard", "mobile", "responsive", "icon", "theme",
  ],
  QA: [
    "test", "testing", "security", "secure", "quality", "risk", "compliance", "audit",
    "privacy", "vulnerability", "review", "edge case", "reliability", "accessibility",
    "gdpr", "safety", "validate",
  ],
};

/** Score how many of a department's vocabulary terms the intent mentions. */
function score(intent: string, terms: string[]): number {
  const text = ` ${intent.toLowerCase()} `;
  return terms.reduce((n, t) => (text.includes(t) ? n + 1 : n), 0);
}

export function planActivation(intent: string): ActivationPlan {
  const scores = Object.entries(VOCAB).map(([abbr, terms]) => ({
    abbr,
    hits: score(intent, terms),
  }));

  const relevant = scores.filter((s) => s.hits > 0).map((s) => s.abbr);

  // Ambiguous intent → full company (never guess a department away).
  if (relevant.length === 0) {
    return {
      activated: ["PM", "AR", "UX", "QA"],
      skipped: [],
      rationale: "Broad intent — the COO activated the full company to cover every angle.",
    };
  }

  const activated = ["PM", ...relevant];
  const skipped = scores.filter((s) => s.hits === 0).map((s) => s.abbr);
  return {
    activated,
    skipped,
    rationale: `COO activated ${activated.join(", ")} for this intent; ${skipped.join(", ")} on standby (token economy).`,
  };
}
