/** Be10x — RaKeGa reference: low-price live AI workshops → paid courses. Public pages only.
 *  Run: npm run crawl:gated -- be10x */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'be10x', name: 'Be10x', category: 'AI-tools workshops and courses for working professionals (India)',
  why: 'Workshop funnel, course catalogue structure, certificate and trust signals',
  publicBaseUrl: 'https://be10x.in',
  follow: { max: 7, prefer: ['workshop', 'course', 'ai', 'certificate', 'mastery', 'program', 'business'] },
});
