/**
 * research/competitors/_TEMPLATE/config.js — copy this folder to research/competitors/<id>/
 * and change the facts below. Everything else (sections, nav discovery, following the
 * pricing/course/feature pages) is built by research/lib/site-config.js.
 *
 * Public run:  npm run crawl:gated -- <id>
 * Only list pages in `pages` that you have seen exist; the crawler discovers the rest.
 * Need a page-specific interaction (a tab, a filter)? Write that one section by hand
 * and append it: export default { ...base, publicSections: [...base.publicSections, mySection] }.
 */
import { siteConfig } from '../../lib/site-config.js';

export default siteConfig({
  id: 'example-id',                       // must match the folder name
  name: 'Example Product',
  category: 'What kind of product this is',
  why: 'One line: what we want to learn from it',
  publicBaseUrl: 'https://example.com',
  pages: [
    // { path: '/pricing', label: 'Pricing', tag: 'PRICING' },
  ],
  follow: { max: 6 },
});
