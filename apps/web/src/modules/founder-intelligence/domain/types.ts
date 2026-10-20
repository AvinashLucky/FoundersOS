/**
 * Founder Intelligence Layer — DOMAIN  (the third pillar)
 * ------------------------------------------------------
 * FounderOS improves your projects AND improves *you*. This module captures the
 * founder-level signals that compound over months: what to learn, what you decided,
 * where time goes, what to reuse, and what matters this week.
 */

export interface LearningSignal {
  skill: string;
  reason: string;          // derived from the work you actually did
  unlock: string;          // what mastering it would unlock
  priority: number;        // 0..1
}

export interface DecisionEntry {
  id: string;
  decision: string;
  reason: string;
  alternatives: string[];
  outcome?: "win" | "loss" | "mixed" | "pending";
  reviewDate: string;      // ISO — resurfaced for re-evaluation
}

export interface ProductivityInsight {
  area: string;            // project / division / activity
  share: number;           // 0..1 of attention
  trend: "up" | "down" | "flat";
}

export interface ReuseSuggestion {
  asset: string;
  fromProject: string;
  relevance: number;       // 0..1
}

/** The one calm Monday read. */
export interface WeeklyBrief {
  weekOf: string;
  progress: string[];
  risks: string[];
  opportunities: string[];
  modelUpdates: string[];
  costSuggestions: string[];
}
