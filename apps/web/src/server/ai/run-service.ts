import { ModelRouter, MODEL_REGISTRY } from "./router";
import { planActivation, type ActivationPlan } from "./activation";
import { ETHOS, affordableQuality, remainingUsd, runBudgetUsd } from "./governors";
import { generateDebate } from "./debate";
import type { DepartmentResult, RunResult, Stance } from "./types";

/**
 * The agent loop, v2 — effective, efficient, ethical, safe, governed.
 * ─────────────────────────────────────────────────────────────────────────
 *  1. ACTIVATE   — the COO wakes only the departments the intent needs
 *                  (token economy; ambiguous → full company).
 *  2. RECALL     — recent project memory is injected into every prompt, so
 *                  the company builds on past decisions instead of amnesia.
 *  3. EXECUTE    — activated departments run in parallel, each routed to the
 *                  cheapest capable model, each carrying the ETHOS clause.
 *  4. GOVERN     — a hard per-run budget: the CEO synthesis degrades to a
 *                  cheaper tier rather than exceeding the cap.
 *  5. SYNTHESIZE — one answer out, with the transparent side-channel.
 *
 * STREAMING: pass `onEvent` and the loop reports the plan, each department
 * completion (with an output preview), and synthesis start — the SSE route
 * forwards these so the founder watches the company genuinely work.
 * ─────────────────────────────────────────────────────────────────────────
 */
const DEPARTMENTS = [
  { role: "Product", abbr: "PM", system: "You are the Product department. Own the scope: what to build, for whom, and why. Be concise.", minQuality: 0.7 },
  { role: "Architecture", abbr: "AR", system: "You are the Architecture/Engineering department. Propose the simplest design that scales; name trade-offs.", minQuality: 0.85 },
  { role: "Design", abbr: "UX", system: "You are the Design department. Apply the project's identity; describe flows and states, not just screens.", minQuality: 0.7 },
  { role: "QA + Security", abbr: "QA", system: "You are the QA and Security department. List the top risks, edge cases, and the tests that would catch them.", minQuality: 0.7 },
] as const;

/** Progress events emitted while the loop runs (the SSE side-channel). */
export type RunEvent =
  | { type: "plan"; activated: string[]; skipped: string[]; rationale: string }
  | { type: "department"; role: string; abbr: string; modelId: string; costUsd: number; preview: string }
  | { type: "critique"; from: string; to: string; stance: Stance; text: string }
  | { type: "synthesis"; degraded: boolean };

export interface RunContext {
  /** Recent project memory (decision notes), newest first, already truncated. */
  memory?: string[];
}

export async function runAgentLoop(
  intent: string,
  onEvent?: (event: RunEvent) => void,
  context?: RunContext,
): Promise<RunResult & { plan: ActivationPlan }> {
  const started = Date.now();
  const router = new ModelRouter();
  const budget = { capUsd: runBudgetUsd(), spentUsd: 0 };

  // 1) ACTIVATE — minimum set, decided deterministically (zero cost).
  const plan = planActivation(intent);
  onEvent?.({ type: "plan", ...plan });
  const active = DEPARTMENTS.filter((d) => plan.activated.includes(d.abbr));

  // 2) RECALL — memory context shared by every prompt this run.
  const memoryBlock =
    context?.memory && context.memory.length > 0
      ? `\n\nProject memory (recent decisions — build on these, don't contradict them):\n${context.memory
          .map((m) => `- ${m}`)
          .join("\n")}`
      : "";

  // 3) EXECUTE — activated departments in parallel, cheapest capable model each.
  const departments: DepartmentResult[] = await Promise.all(
    active.map(async (d) => {
      const model = router.pick(d.minQuality);
      const out = await router.run(model, {
        system: d.system + ETHOS,
        prompt: intent + memoryBlock,
      });
      budget.spentUsd += out.costUsd;
      onEvent?.({
        type: "department",
        role: d.role,
        abbr: d.abbr,
        modelId: out.modelId,
        costUsd: out.costUsd,
        preview: out.text.slice(0, 220),
      });
      return { role: d.role, abbr: d.abbr, output: out.text, modelId: out.modelId, costUsd: out.costUsd };
    }),
  );

  // 4) DEBATE — departments challenge each other's takes (cheap tier).
  //    Critique events stream AFTER all departments and BEFORE synthesis.
  const debate = await generateDebate(router, intent, departments);
  budget.spentUsd += debate.costUsd;
  for (const entry of debate.entries) {
    onEvent?.({ type: "critique", from: entry.from, to: entry.to, stance: entry.stance, text: entry.text });
  }

  // 5) GOVERN — afford the best CEO we can within what's left of the cap.
  const desired = 0.9;
  const bar = affordableQuality(desired, remainingUsd(budget), MODEL_REGISTRY);
  const degraded = bar < desired;
  onEvent?.({ type: "synthesis", degraded });

  // 6) SYNTHESIZE — one answer that explicitly resolves the debate.
  const ceoModel = router.pick(bar);
  const brief = departments.map((d) => `- ${d.role}: ${d.output}`).join("\n");
  const debateBrief = debate.entries
    .map((e) => `- ${e.from} → ${e.to} [${e.stance}]: ${e.text}`)
    .join("\n");
  const synthesis = await router.run(ceoModel, {
    system:
      "You are the CEO. Synthesize the departments' work into ONE clear, decisive answer for the founder. " +
      "The departments debated each other below: you MUST explicitly resolve every challenge and concern — " +
      'name the disagreement and state your ruling and why (e.g. "Design and QA disagreed on X; I\'m choosing Y because …"). ' +
      "Do not paper over the tension; a decision that ignores the debate is a bad decision." +
      ETHOS,
    prompt: `Intent: ${intent}${memoryBlock}\n\nDepartment input:\n${brief}\n\nThe debate:\n${debateBrief || "- (no debate: only one department ran)"}`,
  });
  budget.spentUsd += synthesis.costUsd;

  const tokens = synthesis.tokensIn + synthesis.tokensOut;

  return {
    answer: synthesis.text,
    departments: [
      ...departments,
      { role: "CEO", abbr: "CEO", output: synthesis.text, modelId: synthesis.modelId, costUsd: synthesis.costUsd },
    ],
    debate: debate.entries,
    costUsd: round(budget.spentUsd),
    tokens,
    durationMs: Date.now() - started,
    plan,
  };
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
