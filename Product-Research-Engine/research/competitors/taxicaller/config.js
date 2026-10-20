/** TaxiCaller — Gati Rides reference: dispatch software for taxi operators (closest to what Gati is).
 *  Public pages only. Run: npm run crawl:gated -- taxicaller */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'taxicaller', name: 'TaxiCaller', category: 'Taxi dispatch software for fleet operators',
  why: 'Dispatcher console features, auto-dispatch rules, pre-bookings, driver app, pricing for operators',
  publicBaseUrl: 'https://www.taxicaller.com',
  follow: { max: 7, prefer: ['dispatch', 'features', 'pricing', 'driver', 'booking', 'fleet', 'operator'] },
});
