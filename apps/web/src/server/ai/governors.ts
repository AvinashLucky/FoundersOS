/**
 * Run governors — the three brakes every autonomous loop needs.
 * ─────────────────────────────────────────────────────────────────────────
 * 1. SAFETY GATE  — refuse clearly harmful intents before any model runs
 *    (defense-in-depth: providers also refuse, but we never even spend the
 *    tokens, and the refusal reason is honest and immediate).
 * 2. BUDGET CAP   — every run has a hard USD ceiling (RUN_BUDGET_USD, default
 *    $0.05). Spend is checked mid-run; the CEO synthesis degrades to a cheaper
 *    tier rather than blowing the cap. Cost runaway becomes impossible.
 * 3. ETHOS        — one shared ethics clause appended to every department's
 *    system prompt, so honesty/uncertainty/IP-respect is uniform policy,
 *    not per-prompt luck.
 * All pure functions — unit-testable without a model in sight.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Appended to every system prompt — company policy, not per-agent luck. */
export const ETHOS =
  " Operate ethically: be truthful; state assumptions and uncertainty explicitly; " +
  "never fabricate data, citations, or numbers; respect privacy and intellectual property; " +
  "if the request is harmful or unethical, refuse and say why instead of complying.";

/* ── 1 · Safety gate ────────────────────────────────────────────────────── */

export interface SafetyVerdict {
  allowed: boolean;
  /** Founder-facing reason when blocked. */
  reason?: string;
}

// Conservative phrase list: things no department should ever work on.
// Phrases (not single words) to keep false positives low — "kill the process"
// or "attack the problem" must still pass.
const BLOCKED: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(build|make|create|design)\b.{0,40}\b(bomb|explosive|bioweapon|nerve agent)\b/i, label: "weapons" },
  { pattern: /\b(malware|ransomware|keylogger|spyware|botnet)\b/i, label: "malicious software" },
  { pattern: /\b(phishing (site|page|email|campaign)|credential harvest)/i, label: "phishing" },
  { pattern: /\b(launder money|money laundering|counterfeit (money|currency|documents))\b/i, label: "financial crime" },
  { pattern: /\b(steal|exfiltrate)\b.{0,30}\b(credentials|passwords|credit card)/i, label: "data theft" },
  { pattern: /\bexploit\b.{0,30}\b(vulnerability|cve|zero.?day)\b/i, label: "exploit development" },
];

export function safetyGate(intent: string): SafetyVerdict {
  for (const { pattern, label } of BLOCKED) {
    if (pattern.test(intent)) {
      return {
        allowed: false,
        reason: `This intent looks like ${label}, which the company won't work on. Rephrase if this is a defensive or legitimate need — e.g. "harden our app against phishing".`,
      };
    }
  }
  return { allowed: true };
}

/* ── 2 · Budget cap ─────────────────────────────────────────────────────── */

export function runBudgetUsd(): number {
  const raw = Number(process.env.RUN_BUDGET_USD);
  return Number.isFinite(raw) && raw > 0 ? raw : 0.05;
}

export interface BudgetState {
  capUsd: number;
  spentUsd: number;
}

/** Remaining budget, never negative. */
export function remainingUsd(b: BudgetState): number {
  return Math.max(0, b.capUsd - b.spentUsd);
}

/**
 * Given what's left, the highest quality bar we can still afford for one more
 * call (~1.5k tokens estimated). Returns the desired bar when affordable,
 * otherwise steps down — the run ALWAYS produces an answer, just cheaper.
 */
export function affordableQuality(
  desired: number,
  remaining: number,
  registry: Array<{ quality: number; costPer1k: number }>,
  estTokens = 1500,
): number {
  const bars = [desired, 0.85, 0.7, 0.5, 0];
  for (const bar of bars) {
    const cheapest = registry
      .filter((m) => m.quality >= bar)
      .sort((a, b) => a.costPer1k - b.costPer1k)[0];
    if (cheapest && (cheapest.costPer1k * estTokens) / 1000 <= remaining) return bar;
  }
  return 0; // even free/local — the loop degrades gracefully, never dies
}
