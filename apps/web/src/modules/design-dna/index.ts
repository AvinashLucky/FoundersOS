/**
 * Design DNA — extracts a founder's visual language as PRINCIPLES, never copies.
 * Output is an abstract token+rules profile that cannot reconstruct any source
 * (architecture §8). Drives the Design Division so every screen stays on-brand.
 */
export interface DesignDNAProfile {
  spacingRhythm: number;            // base unit, px (e.g. 8)
  radiusScale: number[];           // e.g. [4,8,12,16,24]
  contrast: "low" | "medium" | "high";
  motion: "minimal" | "measured" | "expressive";
  typographyPairing: { display: string; body: string; mono: string };
  /** Provenance only — what influenced the profile, for auditability. Never raw assets. */
  influences: string[];
}

export interface DesignDNAPort {
  /** Lossy, generalizing extraction — by construction cannot copy a source. */
  extract(referenceIds: string[]): Promise<DesignDNAProfile>;
  current(projectId: string): Promise<DesignDNAProfile>;
}
