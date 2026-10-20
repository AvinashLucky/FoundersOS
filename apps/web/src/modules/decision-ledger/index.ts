/**
 * Decision Ledger — institutional memory of judgment. Every major decision with
 * its reasoning and a review date; superseded decisions point to their replacement
 * (architecture §11). Resurfaced on the review date by a scheduled sweep.
 */
export interface LedgerEntry {
  id: string;
  projectId?: string;
  decision: string;
  reason: string;
  alternatives: string[];
  tradeoffs: string;
  impact: string;
  reviewDate: string;       // ISO
  reusableKnowledge?: string;
  supersededBy?: string;
  runId?: string;           // provenance
}

export interface DecisionLedgerPort {
  record(entry: Omit<LedgerEntry, "id">): Promise<LedgerEntry>;
  due(beforeISO: string): Promise<LedgerEntry[]>;   // decisions up for re-evaluation
  supersede(id: string, replacementId: string): Promise<void>;
}
