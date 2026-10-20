/**
 * The roadmap, as data — single source for the Boardroom lanes.
 * Mirrors docs/blueprints/FounderOS-Flagship-Spec.md; when the spec changes,
 * change THIS file in the same commit (code and docs never drift).
 */
export type LaneId = "past" | "present" | "future";

export interface RoadmapItem {
  id: string;
  title: string;
  detail: string;
  department: string;
}

export const ROADMAP: Record<LaneId, { label: string; note: string; items: RoadmapItem[] }> = {
  past: {
    label: "Shipped",
    note: "12 systems · verified by tests",
    items: [
      { id: "s-loop", title: "The Loop v2 — activation → debate → CEO ruling", detail: "Streamed live over SSE", department: "AI Research" },
      { id: "s-debate", title: "Agent Debate + Conversation replay", detail: "4-phase transcript, saved with every run", department: "Design" },
      { id: "s-gov", title: "Governors — safety gate · budget cap · ETHOS", detail: "Refusal before a token is spent", department: "Security · FinOps" },
      { id: "s-mem", title: "Compounding memory", detail: "Decisions + research recalled into the next run", department: "AI Research" },
      { id: "s-research", title: "Research Agent — cited briefs", detail: "Search seam: live with a key, honest offline seed without", department: "Research" },
      { id: "s-freelance", title: "Freelance Studio + Idea Agent", detail: "Scored ideas → listings → posting board", department: "Growth" },
      { id: "s-platform", title: "Analytics · spend trend · ⌘K · hardening · tenancy", detail: "+ 6 more platform systems", department: "Platform · Data" },
    ],
  },
  present: {
    label: "In flight",
    note: "the money path",
    items: [
      { id: "p2", title: "P2 · Deploy + real auth", detail: "Vercel · Atlas · magic-link — a live URL", department: "Platform" },
      { id: "p3", title: "P3 · Design System v2", detail: "Mission Control becomes the whole app", department: "Design" },
      { id: "p4", title: "P4 · Reskin + Export", detail: "One build → themed variants → Gumroad-ready zip", department: "Growth" },
      { id: "t2", title: "T2 · Research from Idea cards", detail: "One click from scouted idea to cited brief", department: "Research" },
    ],
  },
  future: {
    label: "Horizon",
    note: "blueprints ready",
    items: [
      { id: "f-graph", title: "Knowledge Graph", detail: "Relational reasoning across projects", department: "AI Research" },
      { id: "f-dna", title: "Design DNA", detail: "Learn the founder's visual language as principles", department: "Design" },
      { id: "f-radar", title: "Technology & Opportunity Radars", detail: "Scheduled sweeps, net-benefit recommendations", department: "Research" },
      { id: "f-brief", title: "Founder Intelligence — weekly brief", detail: "The company reports to you, calmly, once a week", department: "Data" },
      { id: "f-billing", title: "Billing & plans", detail: "Usage-metered, BYO-key economics", department: "FinOps" },
      { id: "f-teams", title: "Teams · workers · native publishing", detail: "Multi-user workspaces, queues, marketplace APIs", department: "Platform" },
    ],
  },
};

/** Preset intents for the run theater — chosen to trigger distinct activations. */
export const THEATER_INTENTS = [
  "Design the onboarding flow",
  "Build the billing API and database schema",
  "Review the security and privacy risks before launch",
  "Plan the pricing page",
] as const;
