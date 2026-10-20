import { randomUUID } from "node:crypto";
import { ModelRouter } from "./router";
import { ETHOS } from "./governors";
import type { ListingKind, ListingPlatform, ProjectIdea } from "@features/freelance/types";

/**
 * Idea Agent — the Opportunity Radar seed (roadmap Phase 9, first slice).
 * ─────────────────────────────────────────────────────────────────────────
 * Give it a niche/audience and it returns 5 sellable project ideas, each
 * TRANSPARENTLY scored (demand · effort · fit · monetization) so the founder
 * decides with reasons, not vibes. It suggests only — it never starts work.
 *
 * With ANTHROPIC_API_KEY set the routed model does real ideation; offline it
 * falls back to curated templates specialized to the niche, honestly labeled
 * `source: "offline"`. Web-scale trend ingestion is the Phase 8/9 worker —
 * this module is the seam it will feed.
 * ─────────────────────────────────────────────────────────────────────────
 */
const WEIGHTS = { demand: 0.35, monetization: 0.3, fit: 0.2, effortInverse: 0.15 };

export async function generateIdeas(niche: string): Promise<ProjectIdea[]> {
  const router = new ModelRouter();
  const model = router.pick(0.85);

  const out = await router.run(model, {
    system:
      "You are the Market Scout of a virtual software company. You research the world's " +
      "marketplaces (Gumroad, Contra, Fiverr, Product Hunt) and propose sellable software " +
      "project ideas. Respond with STRICT JSON only — an array of exactly 5 objects with keys: " +
      `title (string), oneLiner (string), kind ("ai"|"system"|"app"|"web"|"ecommerce"), ` +
      "demand (1-10), effort (1-10), fit (1-10), monetization (1-10), " +
      `suggestedPriceUsd (number), platforms (array of "gumroad"|"contra"|"fiverr"), rationale (string). ` +
      "Ideas must be genuinely useful to real people, buildable by a solo founder, and honest " +
      "about effort. No hype, no trend-chasing without substance." +
      ETHOS,
    prompt: `Niche / audience: ${niche}\n\nReturn the JSON array now.`,
  });

  const parsed = parseIdeas(out.text);
  if (parsed.length > 0) return parsed;

  // Offline / unparseable → honest local templates specialized to the niche.
  return templateIdeas(niche);
}

/* ── Parsing (defensive: model output is untrusted input) ───────────────── */

const KINDS: ListingKind[] = ["ai", "system", "app", "web", "ecommerce"];
const PLATFORMS: ListingPlatform[] = ["gumroad", "contra", "fiverr"];

function parseIdeas(text: string): ProjectIdea[] {
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end <= start) return [];
    const raw = JSON.parse(text.slice(start, end + 1)) as unknown;
    if (!Array.isArray(raw)) return [];

    return raw
      .slice(0, 5)
      .map((item) => {
        const r = item as Record<string, unknown>;
        const clamp = (v: unknown) => Math.max(1, Math.min(10, Math.round(Number(v) || 5)));
        const scores = {
          demand: clamp(r.demand),
          effort: clamp(r.effort),
          fit: clamp(r.fit),
          monetization: clamp(r.monetization),
        };
        const kind = KINDS.includes(r.kind as ListingKind) ? (r.kind as ListingKind) : "app";
        const platforms = Array.isArray(r.platforms)
          ? (r.platforms.filter((p) => PLATFORMS.includes(p as ListingPlatform)) as ListingPlatform[])
          : [];
        const idea: ProjectIdea = {
          id: `idea_${randomUUID().replace(/-/g, "").slice(0, 10)}`,
          title: String(r.title ?? "").slice(0, 90),
          oneLiner: String(r.oneLiner ?? "").slice(0, 200),
          kind,
          scores,
          total: totalScore(scores),
          suggestedPriceUsd: Math.max(0, Math.min(100_000, Number(r.suggestedPriceUsd) || 49)),
          platforms: platforms.length > 0 ? platforms : ["gumroad"],
          rationale: String(r.rationale ?? "").slice(0, 400),
          source: "model",
        };
        return idea;
      })
      .filter((i) => i.title.length >= 3 && i.oneLiner.length >= 10)
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}

export function totalScore(s: { demand: number; effort: number; fit: number; monetization: number }): number {
  const total =
    s.demand * WEIGHTS.demand +
    s.monetization * WEIGHTS.monetization +
    s.fit * WEIGHTS.fit +
    (10 - s.effort) * WEIGHTS.effortInverse;
  return Math.round(total * 10) / 10;
}

/* ── Offline templates (no key configured — still useful, honestly labeled) ─ */

function templateIdeas(niche: string): ProjectIdea[] {
  const n = niche.trim();
  const seeds: Array<Omit<ProjectIdea, "id" | "total" | "source">> = [
    {
      title: `${cap(n)} AI Assistant Starter Kit`,
      oneLiner: `A ready-to-deploy AI chat assistant pre-trained on ${n} workflows, sold as a template.`,
      kind: "ai",
      scores: { demand: 8, effort: 4, fit: 8, monetization: 7 },
      suggestedPriceUsd: 79,
      platforms: ["gumroad", "fiverr"],
      rationale: `Template products for ${n} sell repeatedly with zero marginal cost; buyers want AI without building it.`,
    },
    {
      title: `${cap(n)} Client Portal`,
      oneLiner: `A white-label web app where ${n} businesses share progress, files, and invoices with clients.`,
      kind: "web",
      scores: { demand: 7, effort: 6, fit: 7, monetization: 8 },
      suggestedPriceUsd: 249,
      platforms: ["contra", "fiverr"],
      rationale: "Client portals are evergreen custom work — one build, many reskins per client.",
    },
    {
      title: `${cap(n)} Automation System`,
      oneLiner: `Done-for-you automation pipeline (intake → CRM → follow-ups) for ${n} teams.`,
      kind: "system",
      scores: { demand: 8, effort: 5, fit: 7, monetization: 8 },
      suggestedPriceUsd: 399,
      platforms: ["contra"],
      rationale: "Businesses pay for time saved; systems price on value, not hours.",
    },
    {
      title: `${cap(n)} Storefront Kit`,
      oneLiner: `A conversion-tuned ecommerce starter (catalog, checkout, email flows) themed for ${n}.`,
      kind: "ecommerce",
      scores: { demand: 6, effort: 5, fit: 6, monetization: 7 },
      suggestedPriceUsd: 129,
      platforms: ["gumroad"],
      rationale: "Niche storefront kits outsell generic themes because they speak the buyer's language.",
    },
    {
      title: `${cap(n)} Companion App`,
      oneLiner: `A focused mobile-first app solving the #1 recurring task ${n} people do weekly.`,
      kind: "app",
      scores: { demand: 7, effort: 7, fit: 6, monetization: 6 },
      suggestedPriceUsd: 49,
      platforms: ["gumroad", "contra"],
      rationale: "Single-task apps are shippable in weeks and validate demand before a bigger build.",
    },
  ];

  return seeds
    .map((s) => ({
      ...s,
      id: `idea_${randomUUID().replace(/-/g, "").slice(0, 10)}`,
      total: totalScore(s.scores),
      source: "offline" as const,
    }))
    .sort((a, b) => b.total - a.total);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
