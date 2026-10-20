/**
 * research/competitors/runway/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Runway — Competitor Research Config
 * 🐊 Crocodile — Foundation video model + creative platform (60M users)
 *
 * Public crawl: node research/explorers/crawl.js runway --public
 * Auth crawl:   node research/explorers/crawl.js runway
 *               (requires research/browser-sessions/runway.json)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default {
  id:               'runway',
  name:             'Runway',
  emoji:            '🐊',
  category:         'Foundation AI Video Model + Creative Platform',
  appUrl:           'https://app.runwayml.com/',
  publicBaseUrl:    'https://runway.com',
  loginUrlPatterns: ['/login', '/auth', '/signup', '/sign-in'],

  // ─── PUBLIC SECTIONS ─────────────────────────────────────────────────────

  publicSections: [

    {
      id: '01',
      label: 'Homepage — positioning, hero, three platforms',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runwayml.com/');
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
      label: 'Pricing page — all tiers and credit table',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runway.com/pricing');
        await dismissOverlays(page);
        await page.waitForTimeout(2000);
        await cap.ss(page, '02-pricing-fold', 'Pricing — above fold');
        await cap.ssFull(page, '02-pricing-full', 'Pricing — full page');
        await cap.snap(page, '02-pricing', 'Pricing — full text');
        await cap.snapStructured(page, '02-pricing');
        await page.evaluate(() => window.scrollBy(0, 1000)); await page.waitForTimeout(500);
        await cap.ss(page, '02-pricing-table', 'Pricing — model credit table');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500);
        await cap.ss(page, '02-pricing-faq', 'Pricing — FAQs');

        idx.add('PRICING', 'Full pricing page', page.url(),
          'Free 125cr (one-time) | Standard $12/mo 625cr | Pro $28/mo 2250cr | Max $76/mo 9500cr | Enterprise');
        log.ok('Pricing page captured');
      },
    },

    {
      id: '03',
      label: 'Product overview — Gen-4.5, Agent, Characters, Aleph',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runway.com/product');
        await dismissOverlays(page);
        await page.waitForTimeout(1500);
        await cap.ss(page, '03-product-fold', 'Product — hero');
        await cap.ssFull(page, '03-product-full', 'Product — full');
        await cap.snap(page, '03-product', 'Product — text');
        idx.add('PRODUCT', 'Product overview', page.url(), 'Gen-4.5, Agent, Characters, Aleph, Workflows, MCP');
        log.ok('Product page captured');
      },
    },

    {
      id: '04',
      label: 'Agent landing — autonomous creative agent',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runway.com/product/agent');
        await dismissOverlays(page);
        await page.waitForTimeout(1500);
        await cap.ss(page, '04-agent-fold', 'Agent — hero');
        await cap.ssFull(page, '04-agent-full', 'Agent — full');
        await cap.snap(page, '04-agent', 'Agent — text');
        idx.add('PRODUCT', 'Agent', page.url(), 'Autonomous creative agent — multi-step task execution');
        log.ok('Agent page captured');
      },
    },

    {
      id: '05',
      label: 'Gen-4.5 research page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://runway.com/research/introducing-runway-gen-4.5',
          'https://runway.com/research/gen-4',
          'https://runway.com/product/gen-4',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '05-gen45-fold', 'Gen-4.5 — hero');
              await cap.ssFull(page, '05-gen45-full', 'Gen-4.5 — full');
              await cap.snap(page, '05-gen45', 'Gen-4.5 — text');
              idx.add('MODEL', 'Gen-4.5', page.url(), 'Flagship video model — world consistency, lighting, physics');
              log.ok(`Gen-4.5 page found: ${url}`);
              return;
            }
          }
        }
        log.warn('Gen-4.5 page not found at expected URLs');
      },
    },

    {
      id: '06',
      label: 'Aleph 2.0 — video editing model',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://runway.com/product/aleph-2',
          'https://runway.com/research/aleph',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '06-aleph-fold', 'Aleph 2.0 — hero');
              await cap.snap(page, '06-aleph', 'Aleph 2.0 — text');
              idx.add('MODEL', 'Aleph 2.0', page.url(), 'In-context video-to-video editing');
              log.ok(`Aleph 2.0 found: ${url}`);
              return;
            }
          }
        }
        log.warn('Aleph 2.0 page not found');
      },
    },

    {
      id: '07',
      label: 'Characters landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runway.com/product/characters');
        await dismissOverlays(page);
        await page.waitForTimeout(1500);
        await cap.ss(page, '07-characters-fold', 'Characters — hero');
        await cap.snap(page, '07-characters', 'Characters — text');
        idx.add('PRODUCT', 'Characters', page.url(), 'Consistent character creation across videos');
        log.ok('Characters page captured');
      },
    },

    {
      id: '08',
      label: 'Workflows / Dev platform',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = ['https://runway.com/workflows', 'https://dev.runwayml.com/'];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '08-workflows-fold', 'Workflows/Dev — hero');
              await cap.snap(page, '08-workflows', 'Workflows/Dev — text');
              idx.add('PRODUCT', 'Workflows / Dev platform', page.url(), 'API, automation, recipes, MCP');
              log.ok(`Workflows/Dev found: ${url}`);
              return;
            }
          }
        }
        log.warn('Workflows/Dev page not found');
      },
    },

    {
      id: '09',
      label: 'Research hub — GWM-1, publications',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runway.com/research');
        await dismissOverlays(page);
        await page.waitForTimeout(1500);
        await cap.ss(page, '09-research-fold', 'Research hub — fold');
        await cap.ssFull(page, '09-research-full', 'Research hub — full');
        await cap.snap(page, '09-research', 'Research hub — text');
        idx.add('RESEARCH', 'Research hub', page.url(), 'GWM-1, General World Models, publications');
        log.ok('Research hub captured');
      },
    },

    {
      id: '10',
      label: 'Enterprise / Studios landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runway.com/enterprise');
        await dismissOverlays(page);
        await cap.ss(page, '10-enterprise-fold', 'Enterprise — hero');
        await cap.snap(page, '10-enterprise', 'Enterprise — text');
        idx.add('ENTERPRISE', 'Enterprise landing', page.url(), 'Custom credits, SSO, analytics, Lionsgate partnership');
        log.ok('Enterprise page captured');
      },
    },

    {
      id: '11',
      label: 'Nav link discovery — all public routes',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://runwayml.com/');
        await dismissOverlays(page);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => (l.href.includes('runway.com') || l.href.includes('runwayml.com')) && l.text)
            .reduce((acc, l) => {
              if (!acc.find(x => x.href === l.href)) acc.push(l);
              return acc;
            }, [])
            .slice(0, 100)
        ).catch(() => []);
        await cap.snapJSON('11-nav-links', links);
        idx.add('NAVIGATION', 'All public nav links', page.url(), `${links.length} unique links found`);
        log.info(`Nav links discovered: ${links.length}`);
        links.forEach(l => log.info(`  ${l.text} → ${l.href}`));
      },
    },

  ],

  // ─── AUTHENTICATED SECTIONS ──────────────────────────────────────────────
  // Requires research/browser-sessions/runway.json
  // Run: node research/explorers/crawl.js runway

  authSections: [

    {
      id: 'A01',
      label: 'App workspace — DOM map, all tools, nav',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A01-workspace', 'App workspace — initial state');
        await cap.snap(page, 'A01-workspace', 'App workspace — text');

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
      label: 'Video generation — Gen-4.5 interface',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://app.runwayml.com/video-tools/teams/home/ai-tools/gen-4',
          'https://app.runwayml.com/video-tools/teams/home/ai-tools',
          'https://app.runwayml.com/home',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A02-gen45', 'Gen-4.5 interface');
              await cap.snap(page, 'A02-gen45', 'Gen-4.5 — text');

              const controls = await page.evaluate(() => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(
                  'button, [role="button"], select, input, textarea, [aria-label]'
                ))
                  .map(el => ({
                    text: (el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').slice(0, 60),
                    type: el.tagName.toLowerCase(),
                  }))
                  .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
                  .slice(0, 40);
              }).catch(() => []);

              await cap.snapJSON('A02-gen45-controls', controls);
              idx.add('AUTH:VIDEO', 'Gen-4.5 interface', page.url(), `${controls.length} controls`);
              log.ok(`Video gen interface found: ${url}`);
              return;
            }
          }
        }
        log.warn('Video generation interface not accessible');
      },
    },

    {
      id: 'A03',
      label: 'All AI tools — complete tool list',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://app.runwayml.com/home');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A03-all-tools', 'All AI tools — gallery');
        await cap.snap(page, 'A03-all-tools', 'All AI tools — text');

        const tools = await page.evaluate(() => {
          const seen = new Set();
          return Array.from(document.querySelectorAll('h1, h2, h3, h4, [data-tool], [class*="tool-name"], [class*="model"]'))
            .map(el => el.textContent?.trim().slice(0, 80))
            .filter(t => t && t.length > 2 && !seen.has(t) && seen.add(t))
            .slice(0, 60);
        }).catch(() => []);

        await cap.snapJSON('A03-tool-list', tools);
        idx.add('AUTH:TOOLS', 'All AI tools list', page.url(), `${tools.length} tool/model names`);
        log.info(`Tools: ${tools.join(', ')}`);
      },
    },

    {
      id: 'A04',
      label: 'Credits / plan status',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://app.runwayml.com/settings/billing',
          'https://app.runwayml.com/billing',
          'https://app.runwayml.com/settings',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(2000);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login')) {
              await cap.ss(page, 'A04-billing', 'Billing — UI');
              await cap.snap(page, 'A04-billing', 'Billing — text');

              const creditInfo = await page.evaluate(() => {
                const text = document.body.innerText;
                const matches = text.match(/(\d[\d,]*)\s*(credit|generation)/gi);
                return { creditMatches: matches || [], textSnippet: text.slice(0, 2000) };
              }).catch(() => ({}));

              await cap.snapJSON('A04-credits', creditInfo);
              idx.add('AUTH:BILLING', 'Credits / billing', page.url(), `${creditInfo.creditMatches?.join(', ')}`);
              log.ok(`Billing found: ${url}`);
              return;
            }
          }
        }
        log.warn('Billing not accessible');
      },
    },

    {
      id: 'A05',
      label: 'Feature gates — what requires upgrade',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        const gates = await page.evaluate(() => {
          const lockKeywords = ['upgrade', 'pro', 'max', 'enterprise', 'locked', 'premium', 'unlock'];
          const seen = new Set();
          return Array.from(document.querySelectorAll('button, [role="button"], [aria-disabled="true"], [disabled]'))
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

        await cap.snapJSON('A05-feature-gates', gates);
        idx.add('AUTH:GATES', 'Feature gates', page.url(), `${gates.length} gated features`);
        log.info(`Gates: ${gates.map(g => g.text).join(', ')}`);
      },
    },

    {
      id: 'A06',
      label: 'Full authenticated DOM summary',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A06-summary', 'App — summary screenshot');
        await cap.snap(page, 'A06-summary', 'App — summary text');

        const summary = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.text).slice(0, 40);
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(h => h.textContent?.trim().slice(0, 80))
            .filter(Boolean).slice(0, 20);
          return { pageUrl: window.location.href, links, headings };
        }).catch(() => ({}));

        await cap.snapJSON('A06-summary', summary);
        idx.add('AUTH:SUMMARY', 'Full auth DOM summary', page.url(), `${summary.links?.length} links`);
        log.info(`Headings: ${summary.headings?.join(' | ')}`);
      },
    },

  ],
};
