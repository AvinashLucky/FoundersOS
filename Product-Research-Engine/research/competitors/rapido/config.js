/** Rapido — Gati Rides reference (India rides: bike, auto, cab; captain side). Public pages only.
 *  Run: npm run crawl:gated -- rapido */
import { siteConfig } from '../../lib/site-config.js';
export default siteConfig({
  id: 'rapido', name: 'Rapido', category: 'Ride-hailing: bike taxi, auto, cab (India)',
  why: 'Ride categories, captain onboarding and earnings story, safety features, how fares are explained',
  publicBaseUrl: 'https://www.rapido.bike',
  follow: { max: 7, prefer: ['captain', 'safety', 'auto', 'cab', 'bike', 'fare', 'city'] },
});
