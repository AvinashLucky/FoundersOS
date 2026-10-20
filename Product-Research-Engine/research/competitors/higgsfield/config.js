/**
 * research/competitors/higgsfield/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Higgsfield AI — Competitor Research Config
 * 🐊 Crocodile — AI-native creative suite (Cinema, Viral, Supercomputer)
 *
 * Public crawl: node research/explorers/crawl.js higgsfield --public
 * Auth crawl:   node research/explorers/crawl.js higgsfield
 *               (requires research/browser-sessions/higgsfield.json)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default {
  id:               'higgsfield',
  name:             'Higgsfield AI',
  emoji:            '🐊',
  category:         'AI-Native Creative Suite',
  appUrl:           'https://higgsfield.ai/',
  publicBaseUrl:    'https://higgsfield.ai',
  loginUrlPatterns: ['/login', '/auth', '/signup', '/sign-in'],

  // ─── PUBLIC SECTIONS ─────────────────────────────────────────────────────

  publicSections: [

    {
      id: '01',
      label: 'Homepage — positioning, hero, nav, social proof',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://higgsfield.ai/');
        await dismissOverlays(page);
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
      label: 'Pricing page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = ['https://higgsfield.ai/pricing', 'https://higgsfield.ai/plans'];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404') && !page.url().includes('home')) {
              await dismissOverlays(page);
              await page.waitForTimeout(3000); // JS-rendered pricing
              await cap.ss(page, '02-pricing-fold', 'Pricing — above fold');
              await cap.ssFull(page, '02-pricing-full', 'Pricing — full page');
              await cap.snap(page, '02-pricing', 'Pricing — full text');
              await cap.snapStructured(page, '02-pricing');
              idx.add('PRICING', 'Pricing page', page.url(), 'Tiers, credits, limits');
              log.ok(`Pricing found: ${url}`);
              return;
            }
          }
        }
        log.warn('Pricing page not found at any known URL — may be JS-rendered or gated');
      },
    },

    {
      id: '03',
      label: 'Supercomputer / AI agent landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/supercomputer',
          'https://higgsfield.ai/agent',
          'https://higgsfield.ai/ai-agent',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '03-supercomputer-fold', 'Supercomputer — hero');
              await cap.ssFull(page, '03-supercomputer-full', 'Supercomputer — full');
              await cap.snap(page, '03-supercomputer', 'Supercomputer — text');
              idx.add('PRODUCT', 'Supercomputer / AI Agent', page.url(), 'One superagent for entire creative stack');
              log.ok(`Supercomputer page found: ${url}`);
              return;
            }
          }
        }
        log.warn('Supercomputer/Agent page not found');
      },
    },

    {
      id: '04',
      label: 'Cinema Studio landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/cinema-studio',
          'https://higgsfield.ai/cinema',
          'https://higgsfield.ai/generate',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '04-cinema-fold', 'Cinema Studio — hero');
              await cap.ssFull(page, '04-cinema-full', 'Cinema Studio — full');
              await cap.snap(page, '04-cinema', 'Cinema Studio — text');
              idx.add('PRODUCT', 'Cinema Studio', page.url(), 'Cinema-quality video generation');
              log.ok(`Cinema Studio found: ${url}`);
              return;
            }
          }
        }
        log.warn('Cinema Studio page not found');
      },
    },

    {
      id: '05',
      label: 'Viral Presets landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/viral-presets',
          'https://higgsfield.ai/presets',
          'https://higgsfield.ai/templates',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '05-viral-fold', 'Viral Presets — hero');
              await cap.ssFull(page, '05-viral-full', 'Viral Presets — full');
              await cap.snap(page, '05-viral', 'Viral Presets — text');
              idx.add('PRODUCT', 'Viral Presets', page.url(), 'Social-media preset workflows');
              log.ok(`Viral Presets found: ${url}`);
              return;
            }
          }
        }
        log.warn('Viral Presets page not found');
      },
    },

    {
      id: '06',
      label: 'Marketing Studio / Product Ads landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/marketing-studio',
          'https://higgsfield.ai/marketing-studio/product',
          'https://higgsfield.ai/marketing',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '06-marketing-fold', 'Marketing Studio — hero');
              await cap.ssFull(page, '06-marketing-full', 'Marketing Studio — full');
              await cap.snap(page, '06-marketing', 'Marketing Studio — text');
              idx.add('PRODUCT', 'Marketing Studio', page.url(), 'Product ads + commercial video');
              log.ok(`Marketing Studio found: ${url}`);
              return;
            }
          }
        }
        log.warn('Marketing Studio page not found');
      },
    },

    {
      id: '07',
      label: 'MCP & CLI / Developer landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/mcp',
          'https://higgsfield.ai/developers',
          'https://higgsfield.ai/api',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '07-mcp-fold', 'MCP/API — hero');
              await cap.ssFull(page, '07-mcp-full', 'MCP/API — full');
              await cap.snap(page, '07-mcp', 'MCP/API — text');
              idx.add('PRODUCT', 'MCP & Developer Tools', page.url(), 'Claude integration, CLI access');
              log.ok(`MCP/Dev page found: ${url}`);
              return;
            }
          }
        }
        log.warn('MCP/Dev page not found');
      },
    },

    {
      id: '08',
      label: 'Academy / Education landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/academy',
          'https://higgsfield.ai/learn',
          'https://higgsfield.ai/tutorials',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '08-academy-fold', 'Academy — hero');
              await cap.snap(page, '08-academy', 'Academy — text');
              idx.add('EDUCATION', 'Academy', page.url(), 'Learning resources');
              log.ok(`Academy found: ${url}`);
              return;
            }
          }
        }
        log.warn('Academy page not found');
      },
    },

    {
      id: '09',
      label: 'Global Film Festival / Originals',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/originals',
          'https://higgsfield.ai/film-festival',
          'https://higgsfield.ai/festival',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '09-originals-fold', 'Originals/Festival — hero');
              await cap.snap(page, '09-originals', 'Originals/Festival — text');
              idx.add('COMMUNITY', 'Originals / Film Festival', page.url(), '$1M prize pool — community/creator strategy');
              log.ok(`Originals/Festival found: ${url}`);
              return;
            }
          }
        }
        log.warn('Originals/Festival page not found');
      },
    },

    {
      id: '10',
      label: 'Nav link discovery — all public routes',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://higgsfield.ai/');
        await dismissOverlays(page);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.href.includes('higgsfield.ai') && l.text)
            .reduce((acc, l) => {
              if (!acc.find(x => x.href === l.href)) acc.push(l);
              return acc;
            }, [])
            .slice(0, 80)
        ).catch(() => []);
        await cap.snapJSON('10-nav-links', links);
        idx.add('NAVIGATION', 'All public nav links', page.url(), `${links.length} unique links found`);
        log.info(`Nav links discovered: ${links.length}`);
        links.forEach(l => log.info(`  ${l.text} → ${l.href}`));
      },
    },

  ],

  // ─── AUTHENTICATED SECTIONS ──────────────────────────────────────────────
  // Requires research/browser-sessions/higgsfield.json
  // Run: node research/explorers/crawl.js higgsfield

  authSections: [

    {
      id: 'A01',
      label: 'App workspace — DOM map, nav, primary actions',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A01-workspace', 'App workspace — initial state');

        const uiElements = await page.evaluate(() => {
          const seen = new Set();
          return Array.from(document.querySelectorAll(
            'button, [role="button"], [role="menuitem"], [role="tab"], [aria-label], [title], nav a'
          ))
            .map(el => ({
              text: (el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 80),
              role: el.getAttribute('role') || el.tagName.toLowerCase(),
              ariaLabel: el.getAttribute('aria-label'),
              href: el.getAttribute('href'),
            }))
            .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
            .slice(0, 80);
        }).catch(() => []);

        await cap.snapJSON('A01-workspace', uiElements);
        await cap.snap(page, 'A01-workspace', 'App workspace — full text');
        idx.add('AUTH:APP', 'Workspace DOM map', page.url(), `${uiElements.length} interactive elements`);
        log.info(`Workspace elements: ${uiElements.length}`);
        uiElements.forEach(e => log.info(`  [${e.role}] ${e.text}`));
      },
    },

    {
      id: 'A02',
      label: 'Image generation — models, controls, UI',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/ai/image',
          'https://higgsfield.ai/generate/image',
          'https://higgsfield.ai/create',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A02-image-gen', 'Image generation — UI');
              await cap.snap(page, 'A02-image-gen', 'Image generation — text');

              const controls = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'button, [role="button"], select, input[type="range"], [role="slider"], [aria-label], label'
                ))
                  .map(el => ({
                    text: (el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').slice(0, 60),
                    type: el.tagName.toLowerCase(),
                  }))
                  .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
                  .slice(0, 60);
              }).catch(() => []);

              await cap.snapJSON('A02-image-controls', controls);
              idx.add('AUTH:IMAGE', 'Image generation UI', page.url(), `${controls.length} controls`);
              log.ok(`Image gen found: ${url}`);
              return;
            }
          }
        }
        log.warn('Image generation UI not accessible — may require different route');
      },
    },

    {
      id: 'A03',
      label: 'Video generation — models, Cinema Studio, controls',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/ai/video',
          'https://higgsfield.ai/generate/video',
          'https://higgsfield.ai/generate',
          'https://higgsfield.ai/cinema-studio',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A03-video-gen', 'Video generation — UI');
              await cap.snap(page, 'A03-video-gen', 'Video generation — text');

              const models = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll('[data-model], [data-value], option, [role="option"]'))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 40);
              }).catch(() => []);

              await cap.snapJSON('A03-video-models', models);
              idx.add('AUTH:VIDEO', 'Video generation UI', page.url(), `${models.length} model options visible`);
              log.ok(`Video gen found: ${url}`);
              return;
            }
          }
        }
        log.warn('Video generation UI not accessible');
      },
    },

    {
      id: 'A04',
      label: 'Supercomputer / AI agent — prompt interface',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/supercomputer',
          'https://higgsfield.ai/agent',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A04-supercomputer', 'Supercomputer — prompt UI');
              await cap.snap(page, 'A04-supercomputer', 'Supercomputer — text');

              const promptUI = await page.evaluate(() => {
                const ta = document.querySelector('textarea, [contenteditable="true"]');
                const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
                  .map(b => b.textContent?.trim().slice(0, 60))
                  .filter(Boolean).slice(0, 20);
                return { hasPromptInput: !!ta, placeholderText: ta?.getAttribute('placeholder'), buttons };
              }).catch(() => ({}));

              await cap.snapJSON('A04-supercomputer-ui', promptUI);
              idx.add('AUTH:AGENT', 'Supercomputer prompt interface', page.url(), 'Agent orchestration UI');
              log.ok(`Supercomputer UI found: ${url}`);
              return;
            }
          }
        }
        log.warn('Supercomputer/Agent UI not accessible');
      },
    },

    {
      id: 'A05',
      label: 'Viral Presets — preset gallery and controls',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://higgsfield.ai/viral-presets');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A05-viral-presets', 'Viral Presets — gallery');
        await cap.snap(page, 'A05-viral-presets', 'Viral Presets — text');

        const presets = await page.evaluate(() => {
          const seen = new Set();
          return Array.from(document.querySelectorAll('[data-preset], .preset, [class*="preset"], h3, h4'))
            .map(el => el.textContent?.trim().slice(0, 80))
            .filter(t => t && t.length > 3 && !seen.has(t) && seen.add(t))
            .slice(0, 30);
        }).catch(() => []);

        await cap.snapJSON('A05-presets', presets);
        idx.add('AUTH:PRESETS', 'Viral Presets gallery', page.url(), `${presets.length} preset names captured`);
        log.info(`Presets found: ${presets.length}`);
      },
    },

    {
      id: 'A06',
      label: 'Account / credits / plan status',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://higgsfield.ai/account',
          'https://higgsfield.ai/settings',
          'https://higgsfield.ai/profile',
          'https://higgsfield.ai/billing',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(2000);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A06-account', 'Account/credits — UI');
              await cap.snap(page, 'A06-account', 'Account/credits — text');

              const creditInfo = await page.evaluate(() => {
                const text = document.body.innerText;
                const matches = text.match(/(\d[\d,]*)\s*(credit|generation|token|coin)/gi);
                return { raw: text.slice(0, 2000), creditMatches: matches || [] };
              }).catch(() => ({}));

              await cap.snapJSON('A06-credits', creditInfo);
              idx.add('AUTH:ACCOUNT', 'Account / credits', page.url(), `Credit patterns: ${creditInfo.creditMatches?.join(', ')}`);
              log.ok(`Account page found: ${url}`);
              return;
            }
          }
        }
        log.warn('Account page not found');
      },
    },

    {
      id: 'A07',
      label: 'Full authenticated DOM summary',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://higgsfield.ai/');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A07-app-summary', 'App — authenticated full view');
        await cap.snap(page, 'A07-app-summary', 'App — authenticated text');

        const summary = await page.evaluate(() => {
          const allText = document.body.innerText;
          const links = Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.text)
            .slice(0, 40);
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(h => h.textContent?.trim().slice(0, 80))
            .filter(Boolean)
            .slice(0, 20);
          return { pageUrl: window.location.href, links, headings, textSnippet: allText.slice(0, 3000) };
        }).catch(() => ({}));

        await cap.snapJSON('A07-summary', summary);
        idx.add('AUTH:SUMMARY', 'Full auth DOM summary', page.url(), `${summary.links?.length} links, ${summary.headings?.length} headings`);
        log.info(`Summary captured — ${summary.links?.length} links`);
      },
    },

    // ─── UX REFERENCE SECTIONS (premium content, popups, galleries) ──────────

    {
      id: 'A08',
      label: 'Explore / community video gallery — premium content reference',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // KEY AVION REFERENCE: How Higgsfield populates their UI with premium AI-generated content
        // Higgsfield shows community videos with prompts — this is the model for Avion's empty sections
        const urls = [
          'https://higgsfield.ai/explore',
          'https://higgsfield.ai/gallery',
          'https://higgsfield.ai/community',
          'https://higgsfield.ai/works',
          'https://higgsfield.ai/feed',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (text.length > 300 && !page.url().includes('/login')) {
              await cap.ss(page, 'A08-gallery-fold', 'Community gallery — fold');
              await cap.ssFull(page, 'A08-gallery-full', 'Community gallery — full page');
              await cap.snap(page, 'A08-gallery', 'Community gallery — text');

              // Scroll to load more cards
              for (let i = 0; i < 4; i++) {
                await page.evaluate(() => window.scrollBy(0, 900));
                await page.waitForTimeout(800);
              }
              await cap.ss(page, 'A08-gallery-scroll', 'Community gallery — scrolled');

              // Extract video card data (title + prompt shown under each video)
              const videoCards = await page.evaluate(() => {
                return Array.from(document.querySelectorAll(
                  '[class*="card"], [class*="item"], [class*="video"], article, figure'
                ))
                  .map(el => ({
                    text: el.textContent?.trim().slice(0, 120),
                    hasVideo: !!el.querySelector('video'),
                    hasImg: !!el.querySelector('img'),
                  }))
                  .filter(x => x.text)
                  .slice(0, 30);
              }).catch(() => []);
              await cap.snapJSON('A08-video-cards', videoCards);

              idx.add('AUTH:GALLERY', 'Community / explore video gallery', page.url(), `${videoCards.length} video cards — premium content layout reference for Avion`);
              log.ok(`Gallery found: ${url} — ${videoCards.length} cards`);
              return;
            }
          }
        }
        log.warn('Community gallery not found — Higgsfield may require navigation from within app');
      },
    },

    {
      id: 'A09',
      label: 'Model selector — Cinema Studio model picker UI',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Capture HOW Higgsfield presents multi-model choice — design reference for Avion
        const urls = [
          'https://higgsfield.ai/cinema-studio',
          'https://higgsfield.ai/generate',
          'https://higgsfield.ai/ai/video',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (currentUrl.includes('/login') || currentUrl.includes('/auth')) continue;

            await cap.ss(page, 'A09-model-selector-fold', 'Model selector — fold view');
            await cap.ssFull(page, 'A09-model-selector-full', 'Model selector — full page');
            await cap.snap(page, 'A09-model-selector', 'Model selector — text');

            // Click model selector dropdown to open it
            const modelDropdown = await page.$('[class*="model"], [class*="select"], [data-model], select');
            if (modelDropdown) {
              await modelDropdown.click().catch(() => null);
              await page.waitForTimeout(1500);
              await cap.ss(page, 'A09-model-dropdown-open', 'Model selector — dropdown open');
            }

            // All model options visible
            const allModels = await page.evaluate(() => {
              const seen = new Set();
              return Array.from(document.querySelectorAll(
                '[role="option"], option, [data-model], [data-value], [class*="model-name"], [class*="model-item"]'
              ))
                .map(el => el.textContent?.trim().slice(0, 80))
                .filter(t => t && !seen.has(t) && seen.add(t))
                .slice(0, 40);
            }).catch(() => []);
            await cap.snapJSON('A09-all-models', allModels);

            idx.add('AUTH:MODELS', 'Model selector — all visible models', page.url(), allModels.join(' | '));
            log.ok(`Models visible: ${allModels.join(', ')}`);
            return;
          }
        }
        log.warn('Model selector not accessible');
      },
    },

    {
      id: 'A10',
      label: 'Onboarding / first-run / opening interface capture',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Capture what a new user sees when they first land on the app — onboarding flow
        const urls = [
          'https://higgsfield.ai/onboarding',
          'https://higgsfield.ai/welcome',
          'https://higgsfield.ai/get-started',
          'https://higgsfield.ai/app/onboarding',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(2000);
            const currentUrl = page.url();
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!currentUrl.includes('/login') && text.length > 200) {
              await cap.ss(page, 'A10-onboarding', 'Onboarding — opening screen');
              await cap.ssFull(page, 'A10-onboarding-full', 'Onboarding — full');
              await cap.snap(page, 'A10-onboarding', 'Onboarding — text');
              idx.add('AUTH:ONBOARDING', 'Onboarding / first-run interface', page.url(), 'Opening experience reference');
              log.ok(`Onboarding found: ${url}`);
              return;
            }
          }
        }
        // Fall back — capture initial app load state as proxy for onboarding
        await goto(page, 'https://higgsfield.ai/');
        await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await cap.ss(page, 'A10-app-initial', 'App initial load — authenticated');
        await cap.ssFull(page, 'A10-app-initial-full', 'App initial — full');
        await cap.snap(page, 'A10-app-initial', 'App initial — text');
        idx.add('AUTH:ONBOARDING', 'App initial authenticated state', page.url(), 'Opening experience proxy');
        log.info('Onboarding page not found — captured initial app state as proxy');
      },
    },

    {
      id: 'A11',
      label: 'Upgrade gate / paywall modals — all popup states',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Navigate to a feature likely to trigger upgrade prompts
        const testUrls = [
          'https://higgsfield.ai/cinema-studio',
          'https://higgsfield.ai/viral-presets',
          'https://higgsfield.ai/supercomputer',
        ];
        for (const url of testUrls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            if (page.url().includes('/login')) continue;
            await dismissOverlays(page);

            // Capture initial state
            await cap.ss(page, 'A11-pre-gate', `Before gate click — ${url.split('/').pop()}`);

            // Try clicking any upgrade/pro button
            const upgradeEl = await page.$([
              'button:has-text("Upgrade")',
              'button:has-text("Pro")',
              'button:has-text("Get Pro")',
              '[class*="upgrade"]',
              '[data-upgrade]',
              'button:has-text("Unlock")',
            ].join(', '));

            if (upgradeEl) {
              await upgradeEl.click().catch(() => null);
              await page.waitForTimeout(2500);
              await cap.ss(page, 'A11-gate-modal', 'Upgrade gate modal — triggered');
              await cap.ssFull(page, 'A11-gate-modal-full', 'Upgrade gate — full modal');
              await cap.snap(page, 'A11-gate-modal', 'Upgrade gate — text');

              const gateText = await page.evaluate(() => {
                const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="popup"], [class*="overlay"]');
                return modal?.innerText?.slice(0, 1500) || '';
              }).catch(() => '');
              await cap.snapJSON('A11-gate-content', { url, text: gateText });

              // Also look for all visible gated elements on page
              const allGates = await page.evaluate(() => {
                const lockKeywords = ['upgrade', 'pro', 'unlock', 'premium', 'locked'];
                return Array.from(document.querySelectorAll('button, [role="button"], [class*="upgrade"], [class*="lock"]'))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(t => t && lockKeywords.some(k => t.toLowerCase().includes(k)))
                  .slice(0, 20);
              }).catch(() => []);
              await cap.snapJSON('A11-all-gates', allGates);

              idx.add('AUTH:GATE', 'Upgrade gate / paywall modal', page.url(), `Gate triggered. Content: "${gateText.slice(0, 100)}"`);
              log.ok('Upgrade gate captured');
              return;
            } else {
              log.info(`No upgrade button found at ${url}`);
            }
          }
        }
        log.warn('Could not trigger upgrade gate at any test URL');
      },
    },

    {
      id: 'A12',
      label: 'Viral Presets expanded — full gallery + category browsing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Viral Presets is the most important design reference for Avion's style library
        const urls = [
          'https://higgsfield.ai/viral-presets',
          'https://higgsfield.ai/presets',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (text.length > 300) {
              await cap.ss(page, 'A12-viral-fold', 'Viral Presets — fold (first screen)');
              await cap.ssFull(page, 'A12-viral-full', 'Viral Presets — full gallery');
              await cap.snap(page, 'A12-viral', 'Viral Presets — text content');

              // Scroll through full gallery
              for (let i = 0; i < 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(700);
              }
              await cap.ss(page, 'A12-viral-bottom', 'Viral Presets — bottom of gallery');

              // Extract all preset names and categories
              const presets = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[class*="preset"], [class*="card"], [class*="item"], [class*="template"], h3, h4, [class*="title"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 100))
                  .filter(t => t && t.length > 3 && !seen.has(t) && seen.add(t))
                  .slice(0, 60);
              }).catch(() => []);

              // Category/filter tabs
              const categories = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  '[role="tab"], [class*="category"], [class*="filter"], [class*="tag"]'
                ))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(t => t && !seen.has(t) && seen.add(t))
                  .slice(0, 20);
              }).catch(() => []);

              await cap.snapJSON('A12-preset-names', presets);
              await cap.snapJSON('A12-preset-categories', categories);
              idx.add('AUTH:PRESETS', 'Viral Presets full gallery', page.url(), `${presets.length} presets | Categories: ${categories.join(', ')}`);
              log.ok(`Viral Presets: ${presets.length} presets across ${categories.length} categories`);
              presets.forEach(p => log.info(`  PRESET: ${p}`));
              return;
            }
          }
        }
        log.warn('Viral Presets gallery not accessible');
      },
    },

  ],
};
