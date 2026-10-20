/** Atoms (formerly MGX, by the MetaGPT team) — FounderOS's closest reference: role-based AI team.
 *  Public pages only. Run: npm run crawl:gated -- atoms */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'atoms', name: 'Atoms (ex-MGX)', category: 'Multi-agent "AI team" that researches, plans and builds apps',
  why: 'How a role-based agent team shows its roles, hand-offs and output to a non-technical founder',
  publicBaseUrl: 'https://atoms.dev',
  follow: { max: 7, prefer: ['pricing', 'agents', 'team', 'features', 'showcase', 'use-case'] },
});
