/** Replit (Agent) — FounderOS reference. Public pages only. Run: npm run crawl:gated -- replit */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'replit', name: 'Replit', category: 'Cloud IDE + autonomous build agent + hosting',
  why: 'How effort-based agent billing, plan mode and deploy are presented to non-developers',
  publicBaseUrl: 'https://replit.com',
  pages: [{ path: '/pricing', label: 'Pricing', tag: 'PRICING' }],
  follow: { max: 6, prefer: ['agent', 'ai', 'deploy', 'teams', 'enterprise', 'security'] },
});
