/**
 * research/competitors/openart/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenArt — Competitor Research Config
 * 🐟 Fish — Multi-model creative suite (8M+ creators, 100+ models)
 *
 * Public crawl: node research/explorers/crawl.js openart --public
 * Auth crawl:   node research/explorers/crawl.js openart
 *               (requires research/browser-sessions/openart.json)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default {
  id:               'openart',
  name:             'OpenArt',
  emoji:            '🐟',
  category:         'Multi-Model AI Creator Suite',
  appUrl:           'https://openart.ai/suite/home',
  publicBaseUrl:    'https://openart.ai',
  loginUrlPatterns: ['/login', '/auth', '/signup', '/sign-in'],

  // ─── PUBLIC SECTIONS ─────────────────────────────────────────────────────

  publicSections: [

    {
      id: '01',
      label: 'Homepage — positioning, hero, social proof',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://openart.ai/');
        await dismissOverlays(page);
        await page.waitForTimeout(2000);
        await cap.ss(page, '01-home-fold', 'Homepage — above fold');
        await cap.ssFull(page, '01-home-full', 'Homepage — full page');
        await cap.snap(page, '01-home', 'Homepage — full text');
        await cap.snapStructured(page, '01-home');
        await page.evaluate(() => window.scrollBy(0, 800)); await page.waitForTimeout(600);
        await cap.ss(page, '01-home-features', 'Homepage — feature section');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(600);
        await cap.ss(page, '01-home-footer', 'Homepage — footer');

        const meta = await page.evaluate(() => ({
          title:       document.title,
          description: document.querySelector('meta[name="description"]')?.content,
          ogTitle:     document.querySelector('meta[property="og:title"]')?.content,
          ogDesc:      document.querySelector('meta[property="og:description"]')?.content,
        })).catch(() => ({}));
        await cap.snapJSON('01-seo-meta', meta);
        idx.add('HOMEPAGE', 'Hero + full page', page.url(), `Brand: "${meta.title}" | Desc: "${meta.description}"`);
        log.info(`Title: ${meta.title}`);
      },
    },

    {
      id: '02',
      label: 'OpenArt Suite landing — main product hub',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://openart.ai/suite');
        await dismissOverlays(page);
        await page.waitForTimeout(2000);
        await cap.ss(page, '02-suite-fold', 'Suite — above fold');
        await cap.ssFull(page, '02-suite-full', 'Suite — full page');
        await cap.snap(page, '02-suite', 'Suite — full text');
        await cap.snapStructured(page, '02-suite');

        const meta = await page.evaluate(() => ({
          title:       document.title,
          description: document.querySelector('meta[name="description"]')?.content,
        })).catch(() => ({}));

        idx.add('PRODUCT', 'OpenArt Suite hub', page.url(), `${meta.description}`);
        log.ok('Suite page captured');
      },
    },

    {
      id: '03',
      label: 'Pricing page — all tiers, credits, feature comparison',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://openart.ai/suite/pricing');
        await page.waitForTimeout(3000); // JS-rendered
        await dismissOverlays(page);
        await cap.ss(page, '03-pricing-fold', 'Pricing — above fold');
        await cap.ssFull(page, '03-pricing-full', 'Pricing — full page');
        await cap.snap(page, '03-pricing', 'Pricing — full text');
        await cap.snapStructured(page, '03-pricing');
        await page.evaluate(() => window.scrollBy(0, 1000)); await page.waitForTimeout(500);
        await cap.ss(page, '03-pricing-compare', 'Pricing — comparison table');

        idx.add('PRICING', 'Full pricing', page.url(),
          'Starter $13/mo 4000cr | Plus $27/mo 12000cr | Pro $44/mo 24000cr | Wonder $175/mo 106000cr');
        log.ok('Pricing page captured');
      },
    },

    {
      id: '04',
      label: 'Director — 9-preset video workflow tool',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/suite/director',
          'https://openart.ai/features/director',
          'https://openart.ai/director',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '04-director-fold', 'Director — hero');
              await cap.ssFull(page, '04-director-full', 'Director — full');
              await cap.snap(page, '04-director', 'Director — text');
              idx.add('PRODUCT', 'Director', page.url(),
                '9 presets: Short Film, Music Video, UGC Ads, Product Ads, Film Trailer, Social Content, Branding Ads, Explainer, Micro Drama');
              log.ok(`Director found: ${url}`);
              return;
            }
          }
        }
        log.warn('Director page not found');
      },
    },

    {
      id: '05',
      label: 'AI Character Builder feature page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/features/ai-character/',
          'https://openart.ai/feature/character-builder',
          'https://openart.ai/suite/character',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '05-character-fold', 'Character Builder — hero');
              await cap.ssFull(page, '05-character-full', 'Character Builder — full');
              await cap.snap(page, '05-character', 'Character Builder — text');
              idx.add('FEATURE', 'Character Builder', page.url(), 'Consistent AI characters across creations');
              log.ok(`Character Builder found: ${url}`);
              return;
            }
          }
        }
        log.warn('Character Builder page not found');
      },
    },

    {
      id: '06',
      label: '3D Worlds / OpenArt Worlds feature page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/feature/openart-worlds',
          'https://openart.ai/features/3d-world',
          'https://openart.ai/suite/worlds',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '06-worlds-fold', 'Worlds — hero');
              await cap.snap(page, '06-worlds', 'Worlds — text');
              idx.add('FEATURE', '3D Worlds', page.url(), 'AI-generated 3D world environments');
              log.ok(`Worlds found: ${url}`);
              return;
            }
          }
        }
        log.warn('Worlds page not found');
      },
    },

    {
      id: '07',
      label: 'AI Influencer / VFX features',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/features/ai-influencer',
          'https://openart.ai/feature/openart-vfx',
          'https://openart.ai/features/vfx',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '07-influencer-fold', 'AI Influencer/VFX — hero');
              await cap.snap(page, '07-influencer', 'AI Influencer/VFX — text');
              idx.add('FEATURE', 'AI Influencer / VFX', page.url(), 'Avatar-style influencer creation + video VFX');
              log.ok(`AI Influencer/VFX found: ${url}`);
              return;
            }
          }
        }
        log.warn('AI Influencer/VFX page not found');
      },
    },

    {
      id: '08',
      label: 'MCP integration / developer page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/mcp',
          'https://openart.ai/suite/mcp',
          'https://openart.ai/developers',
          'https://openart.ai/api',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '08-mcp-fold', 'MCP/API — hero');
              await cap.snap(page, '08-mcp', 'MCP/API — text');
              idx.add('PRODUCT', 'MCP / API', page.url(), 'OpenArt MCP integration for agent workflows');
              log.ok(`MCP/API found: ${url}`);
              return;
            }
          }
        }
        log.warn('MCP/API page not found');
      },
    },

    {
      id: '09',
      label: 'Community / Explore gallery',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/community',
          'https://openart.ai/explore',
          'https://openart.ai/feed',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForTimeout(2000);
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '09-community-fold', 'Community/Explore — fold');
              await cap.ssFull(page, '09-community-full', 'Community/Explore — full');
              await cap.snap(page, '09-community', 'Community/Explore — text');
              idx.add('COMMUNITY', 'Community Gallery', page.url(), 'User-generated content, discovery feed');
              log.ok(`Community found: ${url}`);
              return;
            }
          }
        }
        log.warn('Community page not found');
      },
    },

    {
      id: '10',
      label: 'Nav link discovery — all public routes',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://openart.ai/');
        await page.waitForTimeout(2000);
        await dismissOverlays(page);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.href.includes('openart.ai') && l.text)
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
  // Requires research/browser-sessions/openart.json
  // Run: node research/explorers/crawl.js openart

  authSections: [

    {
      id: 'A01',
      label: 'App workspace — DOM map, all tools, nav',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A01-workspace', 'Suite home — initial state');
        await cap.snap(page, 'A01-workspace', 'Suite home — text');

        const uiElements = await page.evaluate(() => {
          const seen = new Set();
          return Array.from(document.querySelectorAll(
            'button, [role="button"], [role="menuitem"], [role="tab"], [aria-label], nav a, [title]'
          ))
            .map(el => ({
              text: (el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 80),
              role: el.getAttribute('role') || el.tagName.toLowerCase(),
              ariaLabel: el.getAttribute('aria-label'),
            }))
            .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
            .slice(0, 80);
        }).catch(() => []);

        await cap.snapJSON('A01-workspace', uiElements);
        idx.add('AUTH:APP', 'Workspace DOM map', page.url(), `${uiElements.length} interactive elements`);
        log.info(`Elements: ${uiElements.length}`);
        uiElements.forEach(e => log.info(`  [${e.role}] ${e.text}`));
      },
    },

    {
      id: 'A02',
      label: 'Director — preset workflows inside app',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/suite/director',
          'https://openart.ai/suite/home',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A02-director', 'Director — app UI');
              await cap.snap(page, 'A02-director', 'Director — app text');

              // Capture preset names
              const presets = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[data-preset], [class*="preset"], [class*="workflow"], h3, h4, [role="button"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && t.length > 3 && !seen.has(t) && seen.add(t))
                  .slice(0, 30);
              }).catch(() => []);

              await cap.snapJSON('A02-presets', presets);
              idx.add('AUTH:DIRECTOR', 'Director presets', currentUrl, `${presets.length} presets: ${presets.join(', ')}`);
              log.ok(`Director found: ${url}`);
              return;
            }
          }
        }
        log.warn('Director not accessible in app');
      },
    },

    {
      id: 'A03',
      label: 'Video generation — models, controls',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/suite/video',
          'https://openart.ai/suite/create/video',
          'https://openart.ai/suite/home',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A03-video', 'Video generation — UI');
              await cap.snap(page, 'A03-video', 'Video generation — text');

              const models = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'option, [role="option"], [data-model], [aria-label*="model"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 30);
              }).catch(() => []);

              await cap.snapJSON('A03-video-models', models);
              idx.add('AUTH:VIDEO', 'Video generation', currentUrl, `${models.length} model options`);
              log.ok(`Video gen found: ${url}`);
              return;
            }
          }
        }
        log.warn('Video generation not accessible');
      },
    },

    {
      id: 'A04',
      label: 'Image generation — model selector, controls',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/suite/image',
          'https://openart.ai/create',
          'https://openart.ai/suite/create',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A04-image', 'Image generation — UI');
              await cap.snap(page, 'A04-image', 'Image generation — text');

              const controls = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'button, [role="button"], select, label, [aria-label]'
                ))
                  .map(el => (el.textContent?.trim() || el.getAttribute('aria-label') || '').slice(0, 60))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 40);
              }).catch(() => []);

              await cap.snapJSON('A04-image-controls', controls);
              idx.add('AUTH:IMAGE', 'Image generation', currentUrl, `${controls.length} controls`);
              log.ok(`Image gen found: ${url}`);
              return;
            }
          }
        }
        log.warn('Image generation not accessible');
      },
    },

    {
      id: 'A05',
      label: 'Character Builder — consistency tools',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/suite/character',
          'https://openart.ai/suite/characters',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A05-character', 'Character Builder — UI');
              await cap.snap(page, 'A05-character', 'Character Builder — text');
              idx.add('AUTH:CHARACTER', 'Character Builder', currentUrl, 'Consistent character creation');
              log.ok(`Character Builder found: ${url}`);
              return;
            }
          }
        }
        log.warn('Character Builder not accessible');
      },
    },

    {
      id: 'A06',
      label: 'Credits / plan status / billing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://openart.ai/suite/subscriptions',
          'https://openart.ai/suite/billing',
          'https://openart.ai/suite/settings',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(2000);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A06-billing', 'Billing/credits — UI');
              await cap.snap(page, 'A06-billing', 'Billing/credits — text');

              const creditInfo = await page.evaluate(() => {
                const text = document.body.innerText;
                const matches = text.match(/(\d[\d,]*)\s*(credit|generation|token)/gi);
                return { creditMatches: matches || [], textSnippet: text.slice(0, 2000) };
              }).catch(() => ({}));

              await cap.snapJSON('A06-credits', creditInfo);
              idx.add('AUTH:BILLING', 'Credits / billing', currentUrl, `${creditInfo.creditMatches?.join(', ')}`);
              log.ok(`Billing found: ${url}`);
              return;
            }
          }
        }
        log.warn('Billing/credits not accessible');
      },
    },

    {
      id: 'A07',
      label: 'Feature gates — locked / premium features',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        const gates = await page.evaluate(() => {
          const lockKeywords = ['upgrade', 'plus', 'pro', 'wonder', 'locked', 'premium', 'unlock', 'subscribe'];
          const seen = new Set();
          return Array.from(document.querySelectorAll('button, [role="button"], [aria-disabled="true"]'))
            .map(el => ({
              text: el.textContent?.trim().slice(0, 80),
              disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
            }))
            .filter(x => {
              if (!x.text || seen.has(x.text)) return false;
              seen.add(x.text);
              return x.disabled || lockKeywords.some(k => x.text.toLowerCase().includes(k));
            })
            .slice(0, 30);
        }).catch(() => []);

        await cap.snapJSON('A07-feature-gates', gates);
        idx.add('AUTH:GATES', 'Feature gates', page.url(), `${gates.length} gated elements`);
        log.info(`Gates: ${gates.map(g => g.text).join(', ')}`);
      },
    },

    {
      id: 'A08',
      label: 'Full authenticated DOM summary',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A08-summary', 'App — authenticated summary');
        await cap.snap(page, 'A08-summary', 'App — authenticated text');

        const summary = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.text).slice(0, 40);
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(h => h.textContent?.trim().slice(0, 80))
            .filter(Boolean).slice(0, 20);
          return { pageUrl: window.location.href, links, headings };
        }).catch(() => ({}));

        await cap.snapJSON('A08-summary', summary);
        idx.add('AUTH:SUMMARY', 'Full auth DOM summary', page.url(), `${summary.links?.length} links`);
        log.info(`Headings: ${summary.headings?.join(' | ')}`);
      },
    },

    // ─── UX REFERENCE SECTIONS (gallery, character frames, Director UI, popups) ─

    {
      id: 'A09',
      label: 'Explore / inspiration feed — premium AI video gallery',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // CRITICAL: OpenArt's explore feed shows premium curated AI content — reference for Avion's empty sections
        // Observed in A01: categories include Film & Stories, Animation, UGC, Anime, Gaming, etc.
        const urls = [
          'https://openart.ai/suite/explore',
          'https://openart.ai/explore',
          'https://openart.ai/suite/discover',
          'https://openart.ai/discover',
          'https://openart.ai/suite/feed',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!page.url().includes('/login') && text.length > 300) {
              await cap.ss(page, 'A09-explore-fold', 'Explore — fold');
              await cap.ssFull(page, 'A09-explore-full', 'Explore — full page');
              await cap.snap(page, 'A09-explore', 'Explore — text');

              // Scroll to load full feed
              for (let i = 0; i < 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 900));
                await page.waitForTimeout(700);
              }
              await cap.ss(page, 'A09-explore-scroll', 'Explore — scrolled gallery');

              // Category tabs and video cards
              const feedData = await page.evaluate(() => {
                const seen = new Set();
                const categories = Array.from(document.querySelectorAll('[role="tab"], [class*="category"], [class*="filter"], [class*="tag"]'))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(t => t && !seen.has(t) && seen.add(t)).slice(0, 20);
                const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="item"], article, figure'))
                  .map(el => ({ text: el.textContent?.trim().slice(0, 100), hasVideo: !!el.querySelector('video'), hasImg: !!el.querySelector('img') }))
                  .filter(x => x.text).slice(0, 30);
                return { categories, cards };
              }).catch(() => ({}));
              await cap.snapJSON('A09-feed-data', feedData);

              idx.add('AUTH:EXPLORE', 'Explore / inspiration feed', page.url(), `Categories: ${feedData.categories?.join(', ')} | ${feedData.cards?.length} cards`);
              log.ok(`Explore: ${url} — ${feedData.cards?.length} cards`);
              feedData.categories?.forEach(c => log.info(`  CATEGORY: ${c}`));
              return;
            }
          }
        }
        log.warn('Explore feed not found');
      },
    },

    {
      id: 'A10',
      label: 'Character gallery — all 23 preset characters + frame UI',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // CRITICAL: OpenArt has 23 preset AI characters — reference for Avion's persona system
        // Previously observed: Blake, Bram, Ethan, Freya, Jingles, Kane, Kira, Leo, Lola, Maeve,
        // Marcus, Marlowe, Misty, Noah, Nutmeg, Onyx, Prism, Riven, Rusty, Sandy, Tasha, Vera, Viola
        const urls = [
          'https://openart.ai/suite/character',
          'https://openart.ai/suite/characters',
          'https://openart.ai/suite/create/character',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!currentUrl.includes('/login') && text.length > 200) {
              await cap.ss(page, 'A10-characters-fold', 'Character gallery — fold');
              await cap.ssFull(page, 'A10-characters-full', 'Character gallery — full');
              await cap.snap(page, 'A10-characters', 'Character gallery — text');

              // Scroll through all characters
              for (let i = 0; i < 4; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(700);
              }
              await cap.ss(page, 'A10-characters-scroll', 'Character gallery — scrolled all');

              // Extract all character names and card data
              const chars = await page.evaluate(() => {
                const seen = new Set();
                const names = Array.from(document.querySelectorAll(
                  '[class*="character-name"], [class*="char-name"], figcaption, [class*="name"], [class*="card"] h3, [class*="card"] p'
                ))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(t => t && t.length > 1 && !seen.has(t) && seen.add(t)).slice(0, 30);
                const quickStarts = Array.from(document.querySelectorAll('[class*="quick"], [class*="start"], button'))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(Boolean).slice(0, 10);
                const totalCards = document.querySelectorAll('[class*="character"], [class*="card"], figure, article').length;
                return { names, quickStarts, totalCards };
              }).catch(() => ({}));
              await cap.snapJSON('A10-character-data', chars);

              idx.add('AUTH:CHARACTERS', 'Character gallery — all preset characters', currentUrl, `${chars.totalCards} cards | Names: ${chars.names?.join(', ')}`);
              log.ok(`Characters: ${url} — ${chars.totalCards} cards`);
              chars.names?.forEach(n => log.info(`  CHAR: ${n}`));
              return;
            }
          }
        }
        log.warn('Character gallery not accessible');
      },
    },

    {
      id: 'A11',
      label: 'Director interface — conversation UI, workflow types, chat design',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Director is OpenArt's Avion-equivalent — "Vibe Direct Your Next Video"
        // Reference for Avion's Create wizard conversation interface design
        const urls = [
          'https://openart.ai/suite/director',
          'https://openart.ai/suite/create/director',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login')) {
              await cap.ss(page, 'A11-director-fold', 'Director — opening interface');
              await cap.ssFull(page, 'A11-director-full', 'Director — full page');
              await cap.snap(page, 'A11-director', 'Director — text content');

              // Workflow type cards (Short Film, Music Video, UGC Ads, etc.)
              const workflows = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[class*="workflow"], [class*="template"], [class*="type"], [class*="card"], [class*="option"], h3, h4'
                ))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && t.length > 3 && !seen.has(t) && seen.add(t)).slice(0, 30);
              }).catch(() => []);

              // Chat / conversation UI elements
              const chatUI = await page.evaluate(() => {
                const ta = document.querySelector('textarea, [contenteditable="true"], [placeholder*="chat"], [placeholder*="describe"]');
                const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
                  .map(el => el.textContent?.trim().slice(0, 60)).filter(Boolean).slice(0, 15);
                const placeholder = ta?.getAttribute('placeholder') || '';
                return { hasChat: !!ta, placeholder, buttons };
              }).catch(() => ({}));

              await cap.snapJSON('A11-director-workflows', workflows);
              await cap.snapJSON('A11-director-chat-ui', chatUI);
              idx.add('AUTH:DIRECTOR', 'Director conversation interface', currentUrl, `Workflows: ${workflows.join(' | ')}`);
              log.ok(`Director: ${url}`);
              workflows.forEach(w => log.info(`  WORKFLOW: ${w}`));
              return;
            }
          }
        }
        log.warn('Director interface not accessible');
      },
    },

    {
      id: 'A12',
      label: 'Viral Seedance gallery — all preset videos + style names',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Viral Seedance 2.5 presets: Zombie Horror Movie, Streetwear Shoe Campaign, Artfall Viral,
        // The Barber Who Cut Everything, Spiderman, Retro Summer, Ticket-Flip, Insurance Ad
        // Reference for Avion's "Trending Styles" section
        const urls = [
          'https://openart.ai/suite',
          'https://openart.ai/suite/video',
          'https://openart.ai/suite/create/video',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            if (page.url().includes('/login')) continue;

            await cap.ss(page, 'A12-viral-fold', 'Viral presets — fold');
            await cap.ssFull(page, 'A12-viral-full', 'Viral presets — full page');
            await cap.snap(page, 'A12-viral', 'Viral presets — text');

            // Scroll to find the viral preset gallery section
            for (let i = 0; i < 4; i++) {
              await page.evaluate(() => window.scrollBy(0, 800));
              await page.waitForTimeout(600);
            }
            await cap.ss(page, 'A12-viral-gallery', 'Viral presets — gallery section');

            // Extract all preset / template names
            const presets = await page.evaluate(() => {
              const seen = new Set();
              return Array.from(document.querySelectorAll(
                '[class*="preset"], [class*="viral"], [class*="template"], [class*="card"] [class*="title"], [class*="item"] h4, [class*="style"]'
              ))
                .map(el => el.textContent?.trim().slice(0, 100))
                .filter(t => t && t.length > 3 && !seen.has(t) && seen.add(t)).slice(0, 40);
            }).catch(() => []);
            await cap.snapJSON('A12-viral-presets', presets);

            idx.add('AUTH:VIRAL', 'Viral Seedance gallery — all presets', page.url(), `${presets.length} presets: ${presets.join(' | ')}`);
            log.ok(`Viral presets: ${presets.length} found`);
            presets.forEach(p => log.info(`  PRESET: ${p}`));
            return;
          }
        }
        log.warn('Viral preset gallery not accessible');
      },
    },

    {
      id: 'A13',
      label: 'Upgrade gate modal — Plus unlock popup capture',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Observed in A07: "Upgrade To Plus To Unlock" gate exists — capture the full modal design
        const testUrls = [
          'https://openart.ai/suite',
          'https://openart.ai/suite/video',
          'https://openart.ai/suite/character',
        ];
        for (const url of testUrls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            if (page.url().includes('/login')) continue;
            await dismissOverlays(page);

            await cap.ss(page, 'A13-pre-gate', 'Pre-gate state');

            const upgradeEl = await page.$([
              'button:has-text("Upgrade")',
              'button:has-text("Upgrade To Plus")',
              'button:has-text("Unlock")',
              '[class*="upgrade"]',
              '[data-upgrade]',
            ].join(', '));

            if (upgradeEl) {
              await upgradeEl.click().catch(() => null);
              await page.waitForTimeout(2500);
              await cap.ss(page, 'A13-upgrade-modal', 'Upgrade modal — opened');
              await cap.ssFull(page, 'A13-upgrade-modal-full', 'Upgrade modal — full view');
              await cap.snap(page, 'A13-upgrade-modal', 'Upgrade modal — text');

              const gateContent = await page.evaluate(() => {
                const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="popup"], [class*="drawer"]');
                const planCards = Array.from(document.querySelectorAll('[class*="plan"], [class*="tier"], [class*="price"]'))
                  .map(el => el.textContent?.trim().slice(0, 100)).filter(Boolean).slice(0, 10);
                return { modalText: modal?.innerText?.slice(0, 2000) || '', planCards };
              }).catch(() => ({}));
              await cap.snapJSON('A13-gate-content', gateContent);

              idx.add('AUTH:GATE', 'Upgrade To Plus modal', page.url(), `Plans shown: ${gateContent.planCards?.join(' | ')}`);
              log.ok('Upgrade gate modal captured');
              return;
            } else {
              // Scroll to find hidden upgrade gates
              await page.evaluate(() => window.scrollBy(0, 800));
              await page.waitForTimeout(800);
              await cap.ss(page, 'A13-scrolled-gates', 'Scrolled state — gate hunt');
              log.info('No upgrade button found immediately — scrolled to hunt');
            }
          }
        }
        log.warn('Could not trigger upgrade gate modal');
      },
    },

  ],
};
