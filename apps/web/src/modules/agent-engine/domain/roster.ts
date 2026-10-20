import type { AgentRole } from "./types";

/** The virtual company, as data: 3 executives + 13 specialists. */
export const ROSTER: AgentRole[] = [
  // Executive Office
  { id: "ceo", name: "CEO Agent", division: "executive", defaultTier: "frontier", reviews: [] },
  { id: "coo", name: "COO Agent", division: "executive", defaultTier: "balanced", reviews: ["product", "engineering", "design", "qa", "security", "automation"] },
  { id: "cto", name: "CTO Agent", division: "executive", defaultTier: "frontier", reviews: ["engineering", "security"] },
  // Product
  { id: "pm", name: "Product Manager", division: "product", defaultTier: "balanced", reviews: ["design", "engineering"] },
  { id: "ba", name: "Business Analyst", division: "product", defaultTier: "fast", reviews: [] },
  // Design
  { id: "ux", name: "UX Lead", division: "design", defaultTier: "balanced", reviews: ["product"] },
  { id: "ui", name: "UI Designer", division: "design", defaultTier: "balanced", reviews: [] },
  // Engineering
  { id: "arch", name: "System Architect", division: "engineering", defaultTier: "frontier", reviews: ["engineering", "security"] },
  { id: "dev", name: "Senior Developer", division: "engineering", defaultTier: "balanced", reviews: [] },
  // QA
  { id: "qa", name: "QA Engineer", division: "qa", defaultTier: "balanced", reviews: ["engineering"] },
  { id: "auto", name: "Automation Tester", division: "qa", defaultTier: "fast", reviews: [] },
  // Security
  { id: "sec", name: "Security Architect", division: "security", defaultTier: "balanced", reviews: ["engineering", "automation"] },
  // Knowledge
  { id: "mem", name: "Memory Manager", division: "knowledge", defaultTier: "fast", reviews: [] },
  { id: "curator", name: "Knowledge Curator", division: "knowledge", defaultTier: "fast", reviews: [] },
  // Research
  { id: "comp", name: "Competitor Researcher", division: "research", defaultTier: "fast", reviews: [] },
  // Growth
  { id: "writer", name: "Content Writer", division: "growth", defaultTier: "fast", reviews: [] },
  // Automation
  { id: "cost", name: "Cost Controller", division: "automation", defaultTier: "local", reviews: ["automation"] },
];
