/**
 * research/competitors/kling/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Kling AI — Competitor Research Config
 * 🐟 Fish / 🧩 Engine — Next-gen video + image generation (Kuaishou)
 *
 * Public crawl: node research/explorers/crawl.js kling --public
 * Auth crawl:   node research/explorers/crawl.js kling
 *               (requires research/browser-sessions/kling.json)
 *
 * NOTE: kling.ai pricing page is JS-rendered — public crawl captures static
 * HTML only; pricing data may be minimal without JS execution.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default {
  id:               'kling',
  name:             'Kling AI',
  emoji:            '🐟',
  category:         'AI Video & Image Generation (Kuaishou)',
  appUrl:           'https://kling.ai/app',
  publicBaseUrl:    'https://kling.ai',
  loginUrlPatterns: ['/login', '/auth', '/signup', '/sign-in', '/account'],

  // ─── PUBLIC SECTIONS ─────────────────────────────────────────────────────

  publicSections: [

    {
      id: '01',
      label: 'Homepage — positioning, hero, Kling 3.0',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://kling.ai/');
        await dismissOverlays(page);
        await page.waitForTimeout(2000); // JS-heavy site
        await cap.ss(page, '01-home-fold', 'Homepage — above fold');
        await cap.ssFull(page, '01-home-full', 'Homepage — full page');
        await cap.snap(page, '01-home', 'Homepage — full text');
        await cap.snapStructured(page, '01-home');
        await page.evaluate(() => window.scrollBy(0, 800)); await page.waitForTimeout(700);
        await cap.ss(page, '01-home-features', 'Homepage — feature section');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(700);
        await cap.ss(page, '01-home-footer', 'Homepage — footer');

        const meta = await page.evaluate(() => ({
          title:       document.title,
          description: document.querySelector('meta[name="description"]')?.content,
          ogTitle:     document.querySelector('meta[property="og:title"]')?.content,
          keywords:    document.querySelector('meta[name="keywords"]')?.content,
        })).catch(() => ({}));
        await cap.snapJSON('01-seo-meta', meta);
        idx.add('HOMEPAGE', 'Hero + full page', page.url(), `Brand: "${meta.title}" | Keywords: "${meta.keywords?.slice(0, 100)}"`);
        log.info(`Title: ${meta.title}`);
      },
    },

    {
      id: '02',
      label: 'Pricing page — tiers, credits, limits',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/pricing',
          'https://kling.ai/dev/pricing',
          'https://klingai.com/pricing',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(4000); // JS-rendered pricing
            await dismissOverlays(page);
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (text.length > 200 && !page.url().includes('404')) {
              await cap.ss(page, '02-pricing-fold', 'Pricing — above fold');
              await cap.ssFull(page, '02-pricing-full', 'Pricing — full page');
              await cap.snap(page, '02-pricing', 'Pricing — full text');
              await cap.snapStructured(page, '02-pricing');
              idx.add('PRICING', 'Pricing page', page.url(), 'Tiers, credits, limits — may be JS-rendered');
              log.ok(`Pricing found: ${url} (${text.length} chars)`);
              return;
            }
          }
        }
        log.warn('Pricing page appears JS-rendered or not found — captured what was available');
      },
    },

    {
      id: '03',
      label: 'Kling 3.0 Video feature page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/feature/kling-video-3',
          'https://kling.ai/feature/kling-3-0',
          'https://kling.ai/blog/kling-3',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '03-kling3-fold', 'Kling 3.0 — hero');
              await cap.ssFull(page, '03-kling3-full', 'Kling 3.0 — full');
              await cap.snap(page, '03-kling3', 'Kling 3.0 — text');
              idx.add('MODEL', 'Kling 3.0 Video', page.url(), 'VIDEO 3.0, Omni, multi-shot, native audio, native 4K');
              log.ok(`Kling 3.0 page found: ${url}`);
              return;
            }
          }
        }
        log.warn('Kling 3.0 feature page not found');
      },
    },

    {
      id: '04',
      label: 'Motion Control feature page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/feature/ai-motion-control',
          'https://kling.ai/feature/motion-control',
          'https://kling.ai/feature/camera-control',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '04-motion-fold', 'Motion Control — hero');
              await cap.snap(page, '04-motion', 'Motion Control — text');
              idx.add('FEATURE', 'Motion Control', page.url(), 'Camera/object motion control for video generation');
              log.ok(`Motion Control found: ${url}`);
              return;
            }
          }
        }
        log.warn('Motion Control page not found');
      },
    },

    {
      id: '05',
      label: 'Image 3.0 / IMAGE feature page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/feature/kling-image-3',
          'https://kling.ai/feature/ai-image-generator',
          'https://kling.ai/feature/image',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '05-image-fold', 'Image 3.0 — hero');
              await cap.snap(page, '05-image', 'Image 3.0 — text');
              idx.add('FEATURE', 'Image 3.0', page.url(), 'IMAGE 3.0 Omni — 4K image generation');
              log.ok(`Image 3.0 found: ${url}`);
              return;
            }
          }
        }
        log.warn('Image 3.0 page not found');
      },
    },

    {
      id: '06',
      label: 'Quickstart / getting started page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/quickstart',
          'https://kling.ai/get-started',
          'https://kling.ai/docs',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '06-quickstart-fold', 'Quickstart — hero');
              await cap.snap(page, '06-quickstart', 'Quickstart — text');
              idx.add('EDUCATION', 'Quickstart', page.url(), 'Onboarding / getting started flow');
              log.ok(`Quickstart found: ${url}`);
              return;
            }
          }
        }
        log.warn('Quickstart page not found');
      },
    },

    {
      id: '07',
      label: 'API / Developer platform',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/dev',
          'https://kling.ai/api',
          'https://developer.klingai.com/',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '07-api-fold', 'API/Dev — hero');
              await cap.snap(page, '07-api', 'API/Dev — text');
              idx.add('PRODUCT', 'API / Developer', page.url(), 'API access, pricing, integration');
              log.ok(`API/Dev found: ${url}`);
              return;
            }
          }
        }
        log.warn('API/Dev page not found');
      },
    },

    {
      id: '08',
      label: 'Element Library / Effects feature',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/feature/element-library',
          'https://kling.ai/feature/effects',
          'https://kling.ai/feature/video-effects',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '08-effects-fold', 'Element Library/Effects — hero');
              await cap.snap(page, '08-effects', 'Element Library/Effects — text');
              idx.add('FEATURE', 'Element Library / Effects', page.url(), 'Element Library 3.0 — visual effects');
              log.ok(`Effects found: ${url}`);
              return;
            }
          }
        }
        log.warn('Element Library/Effects page not found');
      },
    },

    {
      id: '09',
      label: 'Features overview — all feature pages',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = ['https://kling.ai/feature', 'https://kling.ai/features'];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '09-features-fold', 'Features overview — fold');
              await cap.ssFull(page, '09-features-full', 'Features overview — full');
              await cap.snap(page, '09-features', 'Features overview — text');

              const featureLinks = await page.evaluate(() =>
                Array.from(document.querySelectorAll('a[href*="/feature/"]'))
                  .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
                  .filter(l => l.text)
                  .slice(0, 30)
              ).catch(() => []);

              await cap.snapJSON('09-feature-links', featureLinks);
              idx.add('NAVIGATION', 'Features overview', page.url(), `${featureLinks.length} feature pages discovered`);
              log.ok(`Features overview found: ${url}`);
              return;
            }
          }
        }
        log.warn('Features overview page not found');
      },
    },

    {
      id: '10',
      label: 'Nav link discovery — all public routes',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://kling.ai/');
        await page.waitForTimeout(2000);
        await dismissOverlays(page);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.href.includes('kling.ai') && l.text)
            .reduce((acc, l) => {
              if (!acc.find(x => x.href === l.href)) acc.push(l);
              return acc;
            }, [])
            .slice(0, 100)
        ).catch(() => []);
        await cap.snapJSON('10-nav-links', links);
        idx.add('NAVIGATION', 'All public nav links', page.url(), `${links.length} unique links found`);
        log.info(`Nav links: ${links.length}`);
        links.forEach(l => log.info(`  ${l.text} → ${l.href}`));
      },
    },

  ],

  // ─── AUTHENTICATED SECTIONS ──────────────────────────────────────────────
  // Requires research/browser-sessions/kling.json
  // Run: node research/explorers/crawl.js kling --auth
  //
  // UX REFERENCE FOCUS (per mission):
  //   - App workspace layout, sidebar nav, tool icons
  //   - Video/image gallery / explore feed (premium content for Avion empty-state ref)
  //   - Omni interface (unified multimodal)
  //   - Model selector UI (how they present multi-model choice)
  //   - Effects / preset gallery (style reference)
  //   - All-tools listing
  //   - Account/credits/billing
  //   - All popup/modal/upgrade gate states
  //   - Full DOM summary

  authSections: [

    {
      id: 'A01',
      label: 'App workspace — layout, sidebar, nav, DOM map',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Start at /app — the actual app, not the marketing homepage
        const urls = ['https://kling.ai/app', 'https://kling.ai/create', 'https://kling.ai/'];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 18000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/sign')) {
              // Full page screenshots — fold and full
              await cap.ss(page, 'A01-workspace-fold', 'App workspace — above fold');
              await cap.ssFull(page, 'A01-workspace-full', 'App workspace — full page');
              await cap.snap(page, 'A01-workspace', 'App workspace — full text');
              await cap.snapStructured(page, 'A01-workspace');

              // Sidebar nav items
              const navItems = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'nav a, [role="navigation"] a, aside a, [class*="sidebar"] a, [class*="nav"] a'
                ))
                  .map(el => ({
                    text: el.textContent?.trim().slice(0, 80),
                    href: el.href || '',
                  }))
                  .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
                  .slice(0, 40);
              }).catch(() => []);
              await cap.snapJSON('A01-nav-items', navItems);

              // All interactive UI elements
              const uiElements = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'button, [role="button"], [role="menuitem"], [role="tab"], [aria-label]'
                ))
                  .map(el => ({
                    text: (el.textContent?.trim() || el.getAttribute('aria-label') || '').slice(0, 80),
                    role: el.getAttribute('role') || el.tagName.toLowerCase(),
                    ariaLabel: el.getAttribute('aria-label') || '',
                  }))
                  .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
                  .slice(0, 100);
              }).catch(() => []);
              await cap.snapJSON('A01-ui-elements', uiElements);

              idx.add('AUTH:APP', 'Workspace layout + nav map', currentUrl, `${uiElements.length} elements, ${navItems.length} nav links`);
              log.ok(`Authenticated at: ${currentUrl}`);
              navItems.forEach(n => log.info(`  NAV: ${n.text} → ${n.href}`));
              return;
            }
          }
        }
        log.warn('Could not access authenticated workspace — session may have expired');
      },
    },

    {
      id: 'A02',
      label: 'Explore / community video gallery — premium content reference',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // This is the most important section for Avion UX reference:
        // The curated video gallery shows how Kling populates premium content
        const urls = [
          'https://kling.ai/app/explore',
          'https://kling.ai/explore',
          'https://kling.ai/app/gallery',
          'https://kling.ai/gallery',
          'https://kling.ai/app/works',
          'https://kling.ai/works',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!currentUrl.includes('/login') && text.length > 300) {
              await cap.ss(page, 'A02-gallery-fold', 'Gallery — above fold');
              await cap.ssFull(page, 'A02-gallery-full', 'Gallery — full page');
              await cap.snap(page, 'A02-gallery', 'Gallery — text content');

              // Scroll to load more content
              for (let i = 0; i < 3; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(1000);
              }
              await cap.ss(page, 'A02-gallery-scroll', 'Gallery — scrolled content');

              // Extract video cards / thumbnails metadata
              const cards = await page.evaluate(() => {
                return Array.from(document.querySelectorAll(
                  '[class*="card"], [class*="item"], [class*="video"], [class*="gallery"], article, figure'
                ))
                  .map(el => ({
                    text: el.textContent?.trim().slice(0, 120),
                    hasVideo: !!el.querySelector('video'),
                    hasImg: !!el.querySelector('img'),
                    className: el.className?.slice(0, 60) || '',
                  }))
                  .filter(x => x.text)
                  .slice(0, 30);
              }).catch(() => []);
              await cap.snapJSON('A02-gallery-cards', cards);

              idx.add('AUTH:GALLERY', 'Community / explore video gallery', currentUrl, `${cards.length} cards — premium content layout reference`);
              log.ok(`Gallery found: ${url} — ${cards.length} cards`);
              return;
            }
          }
        }
        log.warn('Gallery / explore page not found — check /app/explore');
      },
    },

    {
      id: 'A03',
      label: 'Omni interface — unified multimodal creation UI',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/app/omni/new',
          'https://kling.ai/app/omni',
          'https://kling.ai/omni',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/sign')) {
              await cap.ss(page, 'A03-omni-fold', 'Omni — interface fold');
              await cap.ssFull(page, 'A03-omni-full', 'Omni — full page');
              await cap.snap(page, 'A03-omni', 'Omni — text');

              // Model selector within Omni
              const modelOptions = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'select option, [role="option"], [data-value], [class*="model"], [class*="version"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 30);
              }).catch(() => []);
              await cap.snapJSON('A03-omni-models', modelOptions);

              idx.add('AUTH:OMNI', 'Omni unified creation interface', currentUrl, `Model options: ${modelOptions.join(', ')}`);
              log.ok(`Omni found: ${url}`);
              return;
            }
          }
        }
        log.warn('Omni interface not found');
      },
    },

    {
      id: 'A04',
      label: 'Video generation — model selector, control UI, settings panel',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/app/image-to-video/frame-mode/new',
          'https://kling.ai/app/video/new',
          'https://kling.ai/create/video',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/sign')) {
              await cap.ss(page, 'A04-video-fold', 'Video gen — interface fold');
              await cap.ssFull(page, 'A04-video-full', 'Video gen — full page');
              await cap.snap(page, 'A04-video', 'Video gen — text');

              // Extract model selector options — key UX reference
              const modelSelector = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'select, [role="listbox"], [class*="model-select"], [class*="version-select"]'
                ))
                  .flatMap(el => Array.from(el.querySelectorAll('option, [role="option"]')))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 25);
              }).catch(() => []);

              // Settings panel / parameter controls
              const controls = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'label, [class*="slider"], [class*="control"], [class*="param"], input[type="range"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 60) || el.getAttribute('aria-label') || '')
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 30);
              }).catch(() => []);

              await cap.snapJSON('A04-video-models', modelSelector);
              await cap.snapJSON('A04-video-controls', controls);
              idx.add('AUTH:VIDEO', 'Video gen interface + model selector', currentUrl, `Models: ${modelSelector.join(' | ')}`);
              log.ok(`Video gen: ${url} — ${modelSelector.length} model options`);
              modelSelector.forEach(m => log.info(`  MODEL: ${m}`));
              return;
            }
          }
        }
        log.warn('Video generation interface not accessible');
      },
    },

    {
      id: 'A05',
      label: 'Image generation — IMAGE 3.0 interface, style presets',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/app/image/new',
          'https://kling.ai/app/image',
          'https://kling.ai/create/image',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/sign')) {
              await cap.ss(page, 'A05-image-fold', 'Image gen — fold');
              await cap.ssFull(page, 'A05-image-full', 'Image gen — full');
              await cap.snap(page, 'A05-image', 'Image gen — text');

              // Style/preset chips
              const stylePresets = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[class*="style"], [class*="preset"], [class*="tag"], [class*="filter"], [role="tab"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 30);
              }).catch(() => []);
              await cap.snapJSON('A05-image-styles', stylePresets);

              idx.add('AUTH:IMAGE', 'Image gen IMAGE 3.0', currentUrl, `Presets: ${stylePresets.join(', ')}`);
              log.ok(`Image gen: ${url}`);
              return;
            }
          }
        }
        log.warn('Image generation not accessible');
      },
    },

    {
      id: 'A06',
      label: 'Effects / Special Effects gallery — VFX style presets',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/app/special-effects/new',
          'https://kling.ai/app/special-effects',
          'https://kling.ai/effects',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/sign')) {
              await cap.ss(page, 'A06-effects-fold', 'Effects gallery — fold');
              await cap.ssFull(page, 'A06-effects-full', 'Effects gallery — full');
              await cap.snap(page, 'A06-effects', 'Effects gallery — text');

              // Effect preset names — key design reference for Avion's style gallery
              const effectPresets = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[class*="effect"], [class*="preset"], [class*="template"], [class*="card"], figure'
                ))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 40);
              }).catch(() => []);
              await cap.snapJSON('A06-effect-presets', effectPresets);

              idx.add('AUTH:EFFECTS', 'Effects / VFX gallery', currentUrl, `${effectPresets.length} effect presets — style reference`);
              log.ok(`Effects gallery: ${url} — ${effectPresets.length} presets`);
              effectPresets.forEach(e => log.info(`  EFFECT: ${e}`));
              return;
            }
          }
        }
        log.warn('Effects gallery not accessible');
      },
    },

    {
      id: 'A07',
      label: 'All Tools page — complete tool listing and UI layout',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/app/all-tools',
          'https://kling.ai/app/tools',
          'https://kling.ai/tools',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!currentUrl.includes('/login') && text.length > 300) {
              await cap.ss(page, 'A07-all-tools-fold', 'All tools — fold');
              await cap.ssFull(page, 'A07-all-tools-full', 'All tools — full page');
              await cap.snap(page, 'A07-all-tools', 'All tools — text');

              // Tool cards
              const toolCards = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[class*="tool"], [class*="card"], [class*="item"], a[href*="/app/"]'
                ))
                  .map(el => ({
                    text: el.textContent?.trim().slice(0, 80),
                    href: el.href || '',
                  }))
                  .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
                  .slice(0, 40);
              }).catch(() => []);
              await cap.snapJSON('A07-tool-list', toolCards);

              idx.add('AUTH:TOOLS', 'All tools listing', currentUrl, `${toolCards.length} tools`);
              log.ok(`All tools: ${url} — ${toolCards.length} tools`);
              toolCards.forEach(t => log.info(`  TOOL: ${t.text}`));
              return;
            }
          }
        }
        log.warn('All-tools page not found');
      },
    },

    {
      id: 'A08',
      label: 'Element Library — character/style elements, consistency assets',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/app/element-library',
          'https://kling.ai/app/elements',
          'https://kling.ai/element-library',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!currentUrl.includes('/login') && text.length > 200) {
              await cap.ss(page, 'A08-elements-fold', 'Element Library — fold');
              await cap.ssFull(page, 'A08-elements-full', 'Element Library — full');
              await cap.snap(page, 'A08-elements', 'Element Library — text');

              // Character/element categories
              const categories = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[class*="category"], [class*="tag"], [role="tab"], [class*="filter"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 20);
              }).catch(() => []);
              await cap.snapJSON('A08-element-categories', categories);

              idx.add('AUTH:ELEMENTS', 'Element Library 3.0', currentUrl, `Categories: ${categories.join(', ')}`);
              log.ok(`Element Library: ${url}`);
              return;
            }
          }
        }
        log.warn('Element Library not accessible — may require higher plan or different URL');
      },
    },

    {
      id: 'A09',
      label: 'Upgrade gate / popup states — paywall modal capture',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Navigate to a feature likely to trigger an upgrade prompt
        const featureUrls = [
          'https://kling.ai/app/image-to-video/frame-mode/new',
          'https://kling.ai/app/omni/new',
        ];
        for (const url of featureUrls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            const currentUrl = page.url();
            if (currentUrl.includes('/login')) continue;

            // Try to trigger model upgrade gate
            const upgradeButton = await page.$('[class*="upgrade"], [data-upgrade], button:has-text("Upgrade"), button:has-text("Pro"), button:has-text("Premium")');
            if (upgradeButton) {
              await upgradeButton.click().catch(() => null);
              await page.waitForTimeout(2000);
              await cap.ss(page, 'A09-upgrade-modal', 'Upgrade gate modal — opened');
              await cap.snap(page, 'A09-upgrade-modal', 'Upgrade gate — text');

              const modalText = await page.evaluate(() => {
                const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="popup"], [class*="overlay"]');
                return modal ? modal.innerText?.slice(0, 1000) : document.body.innerText.slice(0, 1000);
              }).catch(() => '');
              await cap.snapJSON('A09-upgrade-content', { text: modalText });

              idx.add('AUTH:GATE', 'Upgrade gate / paywall modal', currentUrl, 'Paywall UI captured — design reference');
              log.ok('Upgrade gate modal captured');
            } else {
              // No upgrade button visible — still capture current state
              await cap.ss(page, 'A09-no-gate', 'No upgrade gate visible');
              log.info('No upgrade gate button found on this feature');
            }
            return;
          }
        }
        log.warn('Could not access features to trigger upgrade gate');
      },
    },

    {
      id: 'A10',
      label: 'Account / credits / billing — plan status and credit display',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://kling.ai/account',
          'https://kling.ai/app/account',
          'https://kling.ai/settings',
          'https://kling.ai/profile',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/sign')) {
              await cap.ss(page, 'A10-account', 'Account — UI');
              await cap.ssFull(page, 'A10-account-full', 'Account — full page');
              await cap.snap(page, 'A10-account', 'Account — text');

              const creditInfo = await page.evaluate(() => {
                const text = document.body.innerText;
                const creditMatches = text.match(/(\d[\d,]*)\s*(credit|token|coin|generation|kuai|point)/gi) || [];
                const planMatches = text.match(/(free|basic|standard|pro|premium|enterprise|unlimited)[^a-z]/gi) || [];
                const priceMatches = text.match(/\$[\d,.]+/g) || [];
                return {
                  credits: creditMatches,
                  plans: [...new Set(planMatches)],
                  prices: priceMatches,
                  textSnippet: text.slice(0, 2000),
                };
              }).catch(() => ({}));
              await cap.snapJSON('A10-account-data', creditInfo);

              idx.add('AUTH:ACCOUNT', 'Account / credits / billing', currentUrl, `Credits: ${creditInfo.credits?.join(', ')} | Plans: ${creditInfo.plans?.join(', ')}`);
              log.ok(`Account: ${url}`);
              return;
            }
          }
        }
        log.warn('Account page not accessible');
      },
    },

    {
      id: 'A11',
      label: 'Full DOM summary — all links, headings, page structure',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Return to app root for final DOM summary
        await goto(page, 'https://kling.ai/app');
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);

        await cap.ss(page, 'A11-summary', 'Final authenticated state');
        await cap.snap(page, 'A11-summary', 'Final auth DOM text');

        const summary = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.text && l.href.includes('kling'))
            .reduce((acc, l) => { if (!acc.find(x => x.href === l.href)) acc.push(l); return acc; }, [])
            .slice(0, 50);
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
            .map(h => h.textContent?.trim().slice(0, 80))
            .filter(Boolean).slice(0, 25);
          const pageTitle = document.title;
          const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
          return { pageUrl: window.location.href, pageTitle, metaDesc, links, headings };
        }).catch(() => ({}));

        await cap.snapJSON('A11-summary', summary);
        idx.add('AUTH:SUMMARY', 'Full authenticated DOM summary', page.url(), `${summary.links?.length} links | ${summary.headings?.length} headings`);
        log.info(`Final page: ${summary.pageTitle}`);
        log.info(`Headings: ${summary.headings?.join(' | ')}`);
        summary.links?.forEach(l => log.info(`  LINK: ${l.text} → ${l.href}`));
      },
    },

  ],
};
