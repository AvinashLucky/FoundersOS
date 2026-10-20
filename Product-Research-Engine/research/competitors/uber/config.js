/** Uber (India pages) — Gati Rides reference. Public pages only.
 *  Run: npm run crawl:gated -- uber */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'uber', name: 'Uber', category: 'Ride-hailing + driver platform',
  why: 'Ride options, safety toolkit, scheduled rides, driver-side requirements, business/fleet pages',
  publicBaseUrl: 'https://www.uber.com',
  pages: [
    { path: '/in/en/ride/', label: 'Ride (India)', tag: 'PRODUCT' },
    { path: '/in/en/safety/', label: 'Safety (India)', tag: 'SAFETY' },
  ],
  follow: { max: 5, prefer: ['/in/en/', 'reserve', 'fleet', 'drive', 'business', 'safety'] },
});
