import { randomUUID } from "node:crypto";
import { ModelRouter } from "./router";
import { ETHOS } from "./governors";

/**
 * Blueprint Agent — the Delivery Engine.
 * ─────────────────────────────────────────────────────────────────────────
 * The bridge between "the company debated" and "the client paid".
 * Input: a client requirement in plain language.
 * Output: a SolutionBlueprint — a document you can quote from, build from,
 * and hand to a buyer:
 *
 *   · the agentic LOOP (who/what runs at each step, with tools and outputs)
 *   · the ML/GenAI systems required (and honestly, where none is needed)
 *   · the tech stack, with why + monthly cost + free-tier reality
 *   · milestones with day estimates
 *   · risks stated plainly
 *   · pricing bands for service vs product
 *   · a proof post draft (daily-posting fuel)
 *
 * Ethics are structural, not decorative: the offline path is clearly labeled,
 * costs are never invented as precise figures, and the agent refuses to claim
 * capabilities the stack doesn't have.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface LoopStep {
  /** Which role/agent owns this step. */
  role: string;
  /** What it does, in one line. */
  action: string;
  /** Tool/service it uses (e.g. "Gemini flash", "n8n webhook", "pgvector"). */
  tool: string;
  /** What it hands to the next step. */
  output: string;
}

export interface StackChoice {
  layer: string;
  choice: string;
  why: string;
  /** Honest band, not a fake precise number. */
  monthlyCost: string;
}

export interface Milestone {
  phase: string;
  deliverable: string;
  days: number;
}

export interface SolutionBlueprint {
  id: string;
  requirement: string;
  /** One-paragraph read-back of what the client actually needs. */
  understanding: string;
  agenticLoop: LoopStep[];
  mlSystems: string[];
  techStack: StackChoice[];
  milestones: Milestone[];
  risks: string[];
  pricing: {
    serviceUsd: string;
    productUsd: string;
    rationale: string;
  };
  /** Ready-to-post proof content — feeds the daily posting habit. */
  postDraft: string;
  source: "model" | "offline";
  costUsd: number;
  createdAt: string;
}

export type BlueprintEvent =
  | { type: "understanding" }
  | { type: "designing" }
  | { type: "pricing" }
  | { type: "done" };

export async function generateBlueprint(
  requirement: string,
  onEvent?: (e: BlueprintEvent) => void,
): Promise<SolutionBlueprint> {
  const router = new ModelRouter();
  let costUsd = 0;

  onEvent?.({ type: "understanding" });
  onEvent?.({ type: "designing" });

  // Frontier-ish bar: this is the artifact a client pays for.
  const model = router.pick(0.85);
  const out = await router.run(model, {
    system:
      "You are the Solutions Architect of an AI product studio. Turn the client requirement " +
      "into a delivery blueprint. Respond with STRICT JSON only, keys: " +
      "understanding (string, 2-3 sentences reading back the real need), " +
      "agenticLoop (array of 3-7 {role, action, tool, output}), " +
      "mlSystems (array of strings; if classical software suffices, say so plainly instead of inventing ML), " +
      "techStack (array of 4-7 {layer, choice, why, monthlyCost}; monthlyCost as an honest band like \"$0 (free tier)\" or \"$20-40\"), " +
      "milestones (array of 3-5 {phase, deliverable, days}), " +
      "risks (array of 3-5 strings), " +
      "pricing ({serviceUsd, productUsd, rationale} - ranges like \"$400-900\", priced on outcome not hours), " +
      "postDraft (a 60-90 word first-person build-in-public post about shipping this, no hashtags spam, no hype). " +
      "Prefer free tiers and boring reliable choices. Never invent precise costs or fake benchmarks." +
      ETHOS,
    prompt: `Client requirement: ${requirement}\n\nReturn the JSON now.`,
  });
  costUsd += out.costUsd;

  onEvent?.({ type: "pricing" });
  const parsed = parseBlueprint(out.text);

  const blueprint: SolutionBlueprint = {
    id: `bp_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    requirement,
    ...(parsed ?? offlineBlueprint(requirement)),
    source: parsed ? "model" : "offline",
    costUsd: Math.round(costUsd * 1e6) / 1e6,
    createdAt: new Date().toISOString(),
  };

  onEvent?.({ type: "done" });
  return blueprint;
}

/* ── Parsing (model output is untrusted input) ──────────────────────────── */

type BlueprintCore = Omit<SolutionBlueprint, "id" | "requirement" | "source" | "costUsd" | "createdAt">;

function parseBlueprint(text: string): BlueprintCore | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const r = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;

    const strArr = (v: unknown, max = 6) =>
      Array.isArray(v)
        ? v.map((x) => String(x).slice(0, 300)).filter((s) => s.length > 3).slice(0, max)
        : [];

    const loop: LoopStep[] = Array.isArray(r.agenticLoop)
      ? r.agenticLoop
          .map((s) => {
            const o = s as Record<string, unknown>;
            return {
              role: String(o.role ?? "").slice(0, 60),
              action: String(o.action ?? "").slice(0, 200),
              tool: String(o.tool ?? "").slice(0, 80),
              output: String(o.output ?? "").slice(0, 160),
            };
          })
          .filter((s) => s.role.length > 1 && s.action.length > 3)
          .slice(0, 7)
      : [];

    const stack: StackChoice[] = Array.isArray(r.techStack)
      ? r.techStack
          .map((s) => {
            const o = s as Record<string, unknown>;
            return {
              layer: String(o.layer ?? "").slice(0, 40),
              choice: String(o.choice ?? "").slice(0, 60),
              why: String(o.why ?? "").slice(0, 200),
              monthlyCost: String(o.monthlyCost ?? "—").slice(0, 40),
            };
          })
          .filter((s) => s.layer.length > 1 && s.choice.length > 1)
          .slice(0, 8)
      : [];

    const milestones: Milestone[] = Array.isArray(r.milestones)
      ? r.milestones
          .map((s) => {
            const o = s as Record<string, unknown>;
            const days = Number(o.days);
            return {
              phase: String(o.phase ?? "").slice(0, 60),
              deliverable: String(o.deliverable ?? "").slice(0, 200),
              days: Number.isFinite(days) ? Math.max(1, Math.min(120, Math.round(days))) : 3,
            };
          })
          .filter((m) => m.phase.length > 1)
          .slice(0, 6)
      : [];

    const p = (r.pricing ?? {}) as Record<string, unknown>;
    const core: BlueprintCore = {
      understanding: String(r.understanding ?? "").slice(0, 900),
      agenticLoop: loop,
      mlSystems: strArr(r.mlSystems, 5),
      techStack: stack,
      milestones,
      risks: strArr(r.risks, 5),
      pricing: {
        serviceUsd: String(p.serviceUsd ?? "—").slice(0, 40),
        productUsd: String(p.productUsd ?? "—").slice(0, 40),
        rationale: String(p.rationale ?? "").slice(0, 300),
      },
      postDraft: String(r.postDraft ?? "").slice(0, 800),
    };

    // A blueprint without a loop or a stack isn't sellable — reject it.
    return core.understanding.length >= 30 && loop.length >= 2 && stack.length >= 2 ? core : null;
  } catch {
    return null;
  }
}

/* ── Offline blueprint — a real, usable skeleton, honestly labeled ──────── */

function offlineBlueprint(requirement: string): BlueprintCore {
  const short = requirement.length > 70 ? `${requirement.slice(0, 70)}…` : requirement;
  return {
    understanding:
      `Offline blueprint for "${short}". Without a model key this is a proven default shape rather ` +
      `than a bespoke design: an intake step, an AI reasoning step with a review gate, and a delivery ` +
      `step that writes results where the client already works. Add a free model key (Gemini or Groq) ` +
      `and re-run for a requirement-specific design.`,
    agenticLoop: [
      { role: "Intake", action: "Receive the request and normalise it into a typed task", tool: "Webhook / form → n8n", output: "Validated task record" },
      { role: "Researcher", action: "Gather the context the decision needs", tool: "Search API + vector recall", output: "Cited context bundle" },
      { role: "Specialist", action: "Produce the draft output for the task", tool: "Gemini flash / Groq llama", output: "Draft artifact" },
      { role: "Reviewer", action: "Check the draft against rules, risks and tone; request one revision max", tool: "Second model pass with a rubric", output: "Approved or revised artifact" },
      { role: "Delivery", action: "Write the result where the client works and log the receipt", tool: "n8n → Sheets/CRM/email", output: "Delivered artifact + audit row" },
    ],
    mlSystems: [
      "Embeddings + vector store for recall (only if the client has a document corpus)",
      "Lightweight classifier for routing/triage (rules first; train only if volume justifies it)",
      "No custom model training required for v1 — hosted LLMs cover this need",
    ],
    techStack: [
      { layer: "Frontend", choice: "Next.js + Tailwind", why: "One framework for UI and API routes; fast to ship and to hand over", monthlyCost: "$0 (Vercel hobby)" },
      { layer: "Automation", choice: "n8n (self-hosted or cloud)", why: "Open source, 1000+ connectors — never rebuild integrations by hand", monthlyCost: "$0 self-hosted / ~$20 cloud" },
      { layer: "AI", choice: "Gemini free tier + Groq", why: "Real reasoning at zero cost; swap providers behind one interface", monthlyCost: "$0 (free tiers)" },
      { layer: "Data", choice: "MongoDB Atlas free / Postgres", why: "Free tier covers early volume; migrate only when it hurts", monthlyCost: "$0–$15" },
      { layer: "Delivery", choice: "Vercel + GitHub", why: "Push-to-deploy, preview URLs for client review", monthlyCost: "$0" },
    ],
    milestones: [
      { phase: "Discovery", deliverable: "Signed-off requirement + success metric", days: 1 },
      { phase: "Loop build", deliverable: "Working agentic loop on real sample data", days: 4 },
      { phase: "Review gates", deliverable: "Quality rubric + failure handling + logs", days: 2 },
      { phase: "Handover", deliverable: "Deployed system, walkthrough video, runbook", days: 2 },
    ],
    risks: [
      "Scope creep from 'can it also…' — fix the loop's boundaries in writing",
      "Model output quality on edge cases — mitigated by the review gate and one revision cap",
      "Provider rate limits — mitigated by a fallback chain across free providers",
      "Client data sensitivity — keep secrets in env, never in prompts or logs",
    ],
    pricing: {
      serviceUsd: "$400–$900",
      productUsd: "$49–$149",
      rationale:
        "Priced on the outcome (hours saved per week), not on build hours. The same loop resells as a " +
        "template at product price, so the second client costs a fraction of the first.",
    },
    postDraft:
      `Built an agentic loop today for "${short}". Five steps: intake → research → draft → review gate → ` +
      `delivery, with the review step allowed exactly one revision so it can't spiral. Running on free-tier ` +
      `models with a fallback chain, so it costs nothing to operate and never hard-fails. The interesting ` +
      `part wasn't the AI — it was deciding where a human still signs off.`,
  };
}

/** Render a blueprint as portable Markdown — the client-facing deliverable. */
export function blueprintToMarkdown(b: SolutionBlueprint): string {
  const lines: string[] = [];
  lines.push(`# Solution Blueprint`, "", `**Requirement:** ${b.requirement}`, "");
  lines.push(`_Generated ${new Date(b.createdAt).toLocaleString()} · ${b.source === "offline" ? "offline template" : "AI-designed"}_`, "");
  lines.push(`## Understanding`, "", b.understanding, "");
  lines.push(`## Agentic loop`, "");
  lines.push(`| # | Role | Action | Tool | Output |`, `|---|---|---|---|---|`);
  b.agenticLoop.forEach((s, i) => lines.push(`| ${i + 1} | ${s.role} | ${s.action} | ${s.tool} | ${s.output} |`));
  lines.push("", `## ML / GenAI systems`, "");
  b.mlSystems.forEach((m) => lines.push(`- ${m}`));
  lines.push("", `## Tech stack`, "");
  lines.push(`| Layer | Choice | Why | Monthly cost |`, `|---|---|---|---|`);
  b.techStack.forEach((s) => lines.push(`| ${s.layer} | ${s.choice} | ${s.why} | ${s.monthlyCost} |`));
  lines.push("", `## Milestones`, "");
  b.milestones.forEach((m) => lines.push(`- **${m.phase}** (${m.days}d) — ${m.deliverable}`));
  lines.push("", `## Risks`, "");
  b.risks.forEach((r) => lines.push(`- ${r}`));
  lines.push("", `## Pricing`, "");
  lines.push(`- **As a service:** ${b.pricing.serviceUsd}`);
  lines.push(`- **As a product/template:** ${b.pricing.productUsd}`);
  lines.push(`- ${b.pricing.rationale}`, "");
  lines.push(`## Proof post draft`, "", b.postDraft, "");
  return lines.join("\n");
}
