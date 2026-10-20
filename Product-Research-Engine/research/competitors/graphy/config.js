/** Graphy (Unacademy) — RaKeGa reference: the platform creators use to sell courses + run live classes.
 *  Public pages only. Run: npm run crawl:gated -- graphy */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'graphy', name: 'Graphy', category: 'Creator platform: courses, live classes, webinars, apps',
  why: 'How live-class seats, recording, DRM and plan limits are packaged for a teacher',
  publicBaseUrl: 'https://graphy.com',
  follow: { max: 7, prefer: ['pricing', 'live', 'webinar', 'course', 'features', 'app', 'community'] },
});
