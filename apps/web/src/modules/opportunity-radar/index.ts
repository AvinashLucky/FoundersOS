/**
 * Opportunity Radar — fuses internal graph gaps + external trends + founder fit.
 * Suggests; never auto-starts work (architecture §10, tenet T8).
 */
export interface Opportunity {
  title: string;
  kind: "saas" | "agency" | "freelance" | "automation" | "revenue";
  scores: { demand: number; effort: number; fit: number; timing: number; reuse: number }; // each 0..1
  rationale: string;
  confidence: number;   // 0..1; decays if ignored
}

export interface OpportunityRadarPort {
  discover(founderId: string): Promise<Opportunity[]>;
}
