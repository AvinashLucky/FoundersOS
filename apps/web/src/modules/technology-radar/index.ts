/**
 * Technology Radar — tracks the founder's stack + landscape; recommends migration
 * only when benefit beats switching cost (architecture §9; Bible P7: evolve, don't churn).
 */
export type RadarRing = "adopt" | "trial" | "hold" | "retire";

export interface TechSignal {
  name: string;
  ring: RadarRing;
  momentum: number;     // 0..1
  risk: number;         // 0..1
  /** Blast radius if adopted/retired, computed over the knowledge graph. */
  impact: number;       // estimated affected projects/components
  rationale: string;
}

export interface TechnologyRadarPort {
  scan(): Promise<TechSignal[]>;
  recommend(projectId: string): Promise<TechSignal[]>;
}
