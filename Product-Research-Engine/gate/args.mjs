/**
 * Turns a gate mode into the flags crawl.js actually understands.
 * crawl.js runs nothing without --public / --auth / --all, so a gated
 * "public" run must pass --public explicitly — before 2026-10-12 it passed
 * only the id, crawl.js printed its usage and every public run failed.
 */
export function crawlerArgs(id, mode) {
  if (mode.network) return [id, "--auth", "--network"];
  if (mode.auth) return [id, "--auth"];
  return [id, "--public"];
}
