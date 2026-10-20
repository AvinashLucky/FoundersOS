/** Lovable — FounderOS reference. Public pages only. Run: npm run crawl:gated -- lovable */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'lovable', name: 'Lovable', category: 'AI app builder (prompt → full-stack app)',
  why: 'How a prompt-to-app product explains plans, credits, ownership of code and its build flow',
  publicBaseUrl: 'https://lovable.dev',
  pages: [{ path: '/pricing', label: 'Pricing', tag: 'PRICING' }],
  follow: { max: 6, prefer: ['features', 'templates', 'guide', 'docs', 'enterprise', 'security'] },
});
