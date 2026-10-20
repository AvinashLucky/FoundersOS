/** Outskill — RaKeGa reference: free 2-day AI mastermind → cohort programmes. Public pages only.
 *  Run: npm run crawl:gated -- outskill */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'outskill', name: 'Outskill', category: 'AI upskilling: free live mastermind → paid cohorts',
  why: 'Live cohort format at large scale, programme pages, curriculum depth',
  publicBaseUrl: 'https://www.outskill.com',
  follow: { max: 7, prefer: ['mastermind', 'program', 'accelerator', 'course', 'curriculum', 'generalist', 'engineering'] },
});
