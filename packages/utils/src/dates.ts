/**
 * Date helpers. All timestamps in FounderOS are ISO-8601 UTC strings at rest;
 * conversion to local time happens only at the presentation edge.
 */

/** Current instant as an ISO-8601 UTC string. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Add days to an ISO timestamp, returning a new ISO string (UTC-safe). */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ISO date: ${iso}`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/** True if `iso` is in the past relative to now (used for ledger review dates). */
export function isPast(iso: string): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) throw new Error(`Invalid ISO date: ${iso}`);
  return t < Date.now();
}
