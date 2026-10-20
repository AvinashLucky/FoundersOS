/** LetsUpgrade — RaKeGa reference: free/low-cost live bootcamps; built its own live platform.
 *  Public pages only. Run: npm run crawl:gated -- letsupgrade */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'letsupgrade', name: 'LetsUpgrade', category: 'Live tech bootcamps + learning community (India)',
  why: 'Free bootcamp funnel, community features, and how their own live-class experience is presented',
  publicBaseUrl: 'https://letsupgrade.in',
  follow: { max: 7, prefer: ['bootcamp', 'course', 'program', 'community', 'live', 'certificate', 'ai'] },
});
