/**
 * research/competitors/heygen/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HeyGen — Competitor Research Config
 * 🐊 Crocodile — Avatar video platform (30M users, $200M ARR, 85% Fortune 100)
 *
 * Public crawl: node research/explorers/crawl.js heygen --public
 * Auth crawl:   node research/explorers/crawl.js heygen
 *               (requires research/browser-sessions/heygen.json)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default {
  id:               'heygen',
  name:             'HeyGen',
  emoji:            '🐊',
  category:         'AI Avatar Video Platform',
  appUrl:           'https://app.heygen.com/',
  publicBaseUrl:    'https://www.heygen.com',
  loginUrlPatterns: ['/login', '/auth', '/signup', '/sign-in'],

  // ─── PUBLIC SECTIONS ─────────────────────────────────────────────────────

  publicSections: [

    {
      id: '01',
      label: 'Homepage — positioning, hero, social proof',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://www.heygen.com/');
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
      label: 'Pricing page — all tiers, credits, feature comparison',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://www.heygen.com/pricing');
        await dismissOverlays(page);
        await page.waitForTimeout(2000);
        await cap.ss(page, '02-pricing-fold', 'Pricing — above fold');
        await cap.ssFull(page, '02-pricing-full', 'Pricing — full page');
        await cap.snap(page, '02-pricing', 'Pricing — full text');
        await cap.snapStructured(page, '02-pricing');

        // Scroll through pricing table
        await page.evaluate(() => window.scrollBy(0, 1000)); await page.waitForTimeout(500);
        await cap.ss(page, '02-pricing-table', 'Pricing — feature comparison table');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500);
        await cap.ss(page, '02-pricing-bottom', 'Pricing — FAQs section');

        idx.add('PRICING', 'Full pricing page', page.url(),
          'Free $0 (3 vids/mo) | Creator $29/mo 600cr | Pro $49/mo 1000cr | Business $149/mo 1500cr | Enterprise');
        log.ok('Pricing page captured');
      },
    },

    {
      id: '03',
      label: 'Avatar V — identity verification, phoneme lip sync',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://www.heygen.com/avatars/avatar-v',
          'https://www.heygen.com/avatars/ai-video-avatar',
          'https://www.heygen.com/product/avatar',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '03-avatar-v-fold', 'Avatar V — hero');
              await cap.ssFull(page, '03-avatar-v-full', 'Avatar V — full');
              await cap.snap(page, '03-avatar-v', 'Avatar V — text');
              idx.add('PRODUCT', 'Avatar V', page.url(), '5-stage training, identity-verified, phoneme lip sync, 175+ languages');
              log.ok(`Avatar V page found: ${url}`);
              return;
            }
          }
        }
        log.warn('Avatar V page not found');
      },
    },

    {
      id: '04',
      label: 'Video Translation / Dubbing landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://www.heygen.com/translate',
          'https://www.heygen.com/translate/ai-dubbing',
          'https://www.heygen.com/localization',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '04-translate-fold', 'Video Translation — hero');
              await cap.ssFull(page, '04-translate-full', 'Video Translation — full');
              await cap.snap(page, '04-translate', 'Video Translation — text');
              idx.add('PRODUCT', 'Video Translation/Dubbing', page.url(), '175 languages, lip-sync dubbing, brand glossary');
              log.ok(`Translation page found: ${url}`);
              return;
            }
          }
        }
        log.warn('Translation page not found');
      },
    },

    {
      id: '05',
      label: 'AI Studio — text-based video editor',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://www.heygen.com/ai-studio',
          'https://www.heygen.com/tool/ai-video-generator',
          'https://www.heygen.com/product',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '05-studio-fold', 'AI Studio — hero');
              await cap.ssFull(page, '05-studio-full', 'AI Studio — full');
              await cap.snap(page, '05-studio', 'AI Studio — text');
              idx.add('PRODUCT', 'AI Studio', page.url(), 'Text-based editor, avatar + timeline + templates');
              log.ok(`AI Studio page found: ${url}`);
              return;
            }
          }
        }
        log.warn('AI Studio page not found');
      },
    },

    {
      id: '06',
      label: 'Video Agent landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://www.heygen.com/video-agent',
          'https://www.heygen.com/product/video-agent',
          'https://www.heygen.com/tool',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '06-video-agent-fold', 'Video Agent — hero');
              await cap.snap(page, '06-video-agent', 'Video Agent — text');
              idx.add('PRODUCT', 'Video Agent', page.url(), 'Idea-to-video automation agent');
              log.ok(`Video Agent page found: ${url}`);
              return;
            }
          }
        }
        log.warn('Video Agent page not found');
      },
    },

    {
      id: '07',
      label: 'Developer / API landing',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://developers.heygen.com/',
          'https://www.heygen.com/api',
          'https://developers.heygen.com/docs/quick-start',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '07-api-fold', 'API/Developer — hero');
              await cap.snap(page, '07-api', 'API/Developer — text');
              idx.add('PRODUCT', 'Developer / API', page.url(), 'HeyGen API, HyperFrames, streaming avatars');
              log.ok(`API page found: ${url}`);
              return;
            }
          }
        }
        log.warn('API/Developer page not found');
      },
    },

    {
      id: '08',
      label: 'AI Tools directory — all tools listed',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://www.heygen.com/tool');
        await dismissOverlays(page);
        await page.waitForTimeout(1500);
        await cap.ss(page, '08-tools-fold', 'AI Tools directory — fold');
        await cap.ssFull(page, '08-tools-full', 'AI Tools directory — full');
        await cap.snap(page, '08-tools', 'AI Tools directory — text');

        const tools = await page.evaluate(() => {
          const seen = new Set();
          return Array.from(document.querySelectorAll('a[href*="/tool/"]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.text && !seen.has(l.href) && seen.add(l.href))
            .slice(0, 40);
        }).catch(() => []);

        await cap.snapJSON('08-tool-links', tools);
        idx.add('PRODUCT', 'AI Tools directory', page.url(), `${tools.length} individual tools listed`);
        log.info(`Tool links: ${tools.length}`);
        tools.forEach(t => log.info(`  ${t.text} → ${t.href}`));
      },
    },

    {
      id: '09',
      label: 'Nav link discovery — all public routes',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://www.heygen.com/');
        await dismissOverlays(page);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => (l.href.includes('heygen.com') || l.href.includes('developers.heygen')) && l.text)
            .reduce((acc, l) => {
              if (!acc.find(x => x.href === l.href)) acc.push(l);
              return acc;
            }, [])
            .slice(0, 100)
        ).catch(() => []);
        await cap.snapJSON('09-nav-links', links);
        idx.add('NAVIGATION', 'All public nav links', page.url(), `${links.length} unique links found`);
        log.info(`Nav links discovered: ${links.length}`);
        links.forEach(l => log.info(`  ${l.text} → ${l.href}`));
      },
    },

  ],

  // ─── AUTHENTICATED SECTIONS ──────────────────────────────────────────────
  // Requires research/browser-sessions/heygen.json
  // Run: node research/explorers/crawl.js heygen

  authSections: [

    {
      id: 'A01',
      label: 'App workspace — DOM map, nav, primary actions',
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
        log.info(`Workspace elements: ${uiElements.length}`);
        uiElements.forEach(e => log.info(`  [${e.role}] ${e.text}`));
      },
    },

    {
      id: 'A02',
      label: 'Create flow — new video entry point',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Try to find and click a "Create" / "New Video" button
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        const createBtn = page.getByRole('button', { name: /create|new video|new project/i });
        const found = await createBtn.count();
        if (found > 0) {
          await createBtn.first().click().catch(() => null);
          await page.waitForTimeout(2000);
          await dismissOverlays(page);
        } else {
          // Try nav links
          await goto(page, 'https://app.heygen.com/create');
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
          await page.waitForTimeout(2000);
        }

        await cap.ss(page, 'A02-create', 'Create flow — entry');
        await cap.snap(page, 'A02-create', 'Create flow — text');

        const createOptions = await page.evaluate(() => {
          const seen = new Set();
          return Array.from(document.querySelectorAll('button, [role="button"], [role="option"], [role="menuitem"]'))
            .map(el => el.textContent?.trim().slice(0, 80))
            .filter(t => t && t.length > 2 && !seen.has(t) && seen.add(t))
            .slice(0, 30);
        }).catch(() => []);

        await cap.snapJSON('A02-create-options', createOptions);
        idx.add('AUTH:CREATE', 'Create flow options', page.url(), `${createOptions.length} options`);
        log.info(`Create options: ${createOptions.join(', ')}`);
      },
    },

    {
      id: 'A03',
      label: 'Avatar studio — avatar selection, templates',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://app.heygen.com/avatars',
          'https://app.heygen.com/studio',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A03-avatars', 'Avatar studio — gallery');
              await cap.snap(page, 'A03-avatars', 'Avatar studio — text');

              const avatarCount = await page.evaluate(() => {
                return document.querySelectorAll('[data-avatar], [class*="avatar"], img[alt*="avatar"]').length;
              }).catch(() => 0);

              idx.add('AUTH:AVATARS', 'Avatar studio', page.url(), `~${avatarCount} avatar elements visible`);
              log.ok(`Avatar studio found: ${url}`);
              return;
            }
          }
        }
        log.warn('Avatar studio not accessible');
      },
    },

    {
      id: 'A04',
      label: 'Video translation / dubbing — app interface',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://app.heygen.com/translate',
          'https://app.heygen.com/translation',
          'https://app.heygen.com/dubbing',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A04-translate', 'Translation interface');
              await cap.snap(page, 'A04-translate', 'Translation interface — text');

              const langOptions = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('option, [role="option"]'))
                  .map(el => el.textContent?.trim())
                  .filter(Boolean)
                  .slice(0, 50);
              }).catch(() => []);

              await cap.snapJSON('A04-languages', langOptions);
              idx.add('AUTH:TRANSLATE', 'Translation interface', page.url(), `${langOptions.length} language options`);
              log.ok(`Translation found: ${url}`);
              return;
            }
          }
        }
        log.warn('Translation interface not accessible');
      },
    },

    {
      id: 'A05',
      label: 'Credits / plan / billing — current account status',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = [
          'https://app.heygen.com/settings/billing',
          'https://app.heygen.com/billing',
          'https://app.heygen.com/settings',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(2000);
            const currentUrl = page.url();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
              await cap.ss(page, 'A05-billing', 'Billing/credits — UI');
              await cap.snap(page, 'A05-billing', 'Billing/credits — text');

              const creditInfo = await page.evaluate(() => {
                const text = document.body.innerText;
                const matches = text.match(/(\d[\d,]*)\s*(credit|generation)/gi);
                return { creditMatches: matches || [], textSnippet: text.slice(0, 2000) };
              }).catch(() => ({}));

              await cap.snapJSON('A05-credits', creditInfo);
              idx.add('AUTH:BILLING', 'Billing / credits', page.url(), `Credits: ${creditInfo.creditMatches?.join(', ')}`);
              log.ok(`Billing found: ${url}`);
              return;
            }
          }
        }
        log.warn('Billing/credits page not accessible');
      },
    },

    {
      id: 'A06',
      label: 'Feature gates — locked / premium features',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        const gates = await page.evaluate(() => {
          const lockKeywords = ['upgrade', 'pro', 'business', 'enterprise', 'locked', 'premium', 'unlock'];
          const seen = new Set();
          return Array.from(document.querySelectorAll('button, [role="button"], [aria-disabled="true"]'))
            .map(el => ({
              text: el.textContent?.trim().slice(0, 80),
              disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
              hasLockIcon: !!el.querySelector('svg, [class*="lock"], [class*="upgrade"]'),
            }))
            .filter(x => {
              if (!x.text || seen.has(x.text)) return false;
              seen.add(x.text);
              return x.disabled || lockKeywords.some(k => x.text.toLowerCase().includes(k));
            })
            .slice(0, 30);
        }).catch(() => []);

        await cap.snapJSON('A06-feature-gates', gates);
        await cap.ss(page, 'A06-gates', 'Feature gates visible');
        idx.add('AUTH:GATES', 'Feature gates / paywalls', page.url(), `${gates.length} gated elements`);
        log.info(`Feature gates: ${gates.length}`);
        gates.forEach(g => log.info(`  [${g.disabled ? 'LOCKED' : 'visible'}] ${g.text}`));
      },
    },

    {
      id: 'A07',
      label: 'Full authenticated DOM summary',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);
        await cap.ss(page, 'A07-summary', 'App — authenticated summary');
        await cap.snap(page, 'A07-summary', 'App — authenticated text');

        const summary = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim().slice(0, 60), href: a.href }))
            .filter(l => l.text)
            .slice(0, 40);
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(h => h.textContent?.trim().slice(0, 80))
            .filter(Boolean)
            .slice(0, 20);
          return { pageUrl: window.location.href, links, headings };
        }).catch(() => ({}));

        await cap.snapJSON('A07-summary', summary);
        idx.add('AUTH:SUMMARY', 'Full auth DOM summary', page.url(), `${summary.links?.length} links, ${summary.headings?.length} headings`);
        log.info(`Summary: ${summary.headings?.join(' | ')}`);
      },
    },

    // ─── UX REFERENCE SECTIONS (avatar gallery, templates, popups, onboarding) ─

    {
      id: 'A08',
      label: 'Avatar gallery — all avatar frames, styles, thumbnails',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // CRITICAL UX REFERENCE: How HeyGen presents avatar frames — the most premium part of their product
        // Reference for Avion's character/persona selection UI
        const urls = [
          'https://app.heygen.com/avatars',
          'https://app.heygen.com/personas',
          'https://app.heygen.com/create/avatar',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!currentUrl.includes('/login') && text.length > 200) {
              await cap.ss(page, 'A08-avatars-fold', 'Avatar gallery — fold');
              await cap.ssFull(page, 'A08-avatars-full', 'Avatar gallery — full page');
              await cap.snap(page, 'A08-avatars', 'Avatar gallery — text');

              // Scroll through all avatars
              for (let i = 0; i < 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(700);
              }
              await cap.ss(page, 'A08-avatars-scroll', 'Avatar gallery — scrolled view');

              // Avatar count and categories
              const avatarData = await page.evaluate(() => {
                const avatarEls = document.querySelectorAll('[data-avatar], [class*="avatar"], img[alt*="avatar"], [class*="persona"]');
                const categories = Array.from(document.querySelectorAll('[role="tab"], [class*="category"], [class*="filter"]'))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(Boolean);
                const avatarNames = Array.from(document.querySelectorAll('[class*="avatar-name"], [class*="persona-name"], figcaption'))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(Boolean);
                return { count: avatarEls.length, categories, names: avatarNames.slice(0, 30) };
              }).catch(() => ({}));
              await cap.snapJSON('A08-avatar-data', avatarData);

              idx.add('AUTH:AVATARS', 'Avatar gallery — all frames', currentUrl, `${avatarData.count} avatar elements | Categories: ${avatarData.categories?.join(', ')}`);
              log.ok(`Avatar gallery: ${url} — ${avatarData.count} avatars`);
              avatarData.names?.forEach(n => log.info(`  AVATAR: ${n}`));
              return;
            }
          }
        }
        log.warn('Avatar gallery not accessible');
      },
    },

    {
      id: 'A09',
      label: 'Video template gallery — premium video templates',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Premium curated video templates — reference for Avion's "populated" content sections
        const urls = [
          'https://app.heygen.com/templates',
          'https://app.heygen.com/template',
          'https://app.heygen.com/create/template',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const currentUrl = page.url();
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!currentUrl.includes('/login') && text.length > 200) {
              await cap.ss(page, 'A09-templates-fold', 'Template gallery — fold');
              await cap.ssFull(page, 'A09-templates-full', 'Template gallery — full');
              await cap.snap(page, 'A09-templates', 'Template gallery — text');

              // Scroll to load more
              for (let i = 0; i < 4; i++) {
                await page.evaluate(() => window.scrollBy(0, 900));
                await page.waitForTimeout(700);
              }
              await cap.ss(page, 'A09-templates-scroll', 'Template gallery — scrolled');

              // Template categories and names
              const templateData = await page.evaluate(() => {
                const seen = new Set();
                const categories = Array.from(document.querySelectorAll('[role="tab"], [class*="category"], [class*="filter"]'))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(t => t && !seen.has(t) && seen.add(t));
                const templates = Array.from(document.querySelectorAll('[class*="template"], [class*="card"], article'))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(t => t && t.length > 5)
                  .slice(0, 30);
                return { categories, templates };
              }).catch(() => ({}));
              await cap.snapJSON('A09-template-data', templateData);

              idx.add('AUTH:TEMPLATES', 'Video template gallery', currentUrl, `Categories: ${templateData.categories?.join(', ')} | ${templateData.templates?.length} templates`);
              log.ok(`Templates: ${url}`);
              return;
            }
          }
        }
        log.warn('Template gallery not accessible');
      },
    },

    {
      id: 'A10',
      label: 'Onboarding / first-run / opening interface',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // What does a new HeyGen user see on first login? The premium opening experience
        const urls = [
          'https://app.heygen.com/onboarding',
          'https://app.heygen.com/welcome',
          'https://app.heygen.com/get-started',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
            await page.waitForTimeout(2000);
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!page.url().includes('/login') && text.length > 200) {
              await cap.ss(page, 'A10-onboarding', 'Onboarding — opening screen');
              await cap.ssFull(page, 'A10-onboarding-full', 'Onboarding — full');
              await cap.snap(page, 'A10-onboarding', 'Onboarding — text');

              const steps = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('[class*="step"], [class*="onboard"], h2, h3, button'))
                  .map(el => el.textContent?.trim().slice(0, 80))
                  .filter(Boolean).slice(0, 15);
              }).catch(() => []);
              await cap.snapJSON('A10-onboarding-steps', steps);

              idx.add('AUTH:ONBOARDING', 'Onboarding / first-run', page.url(), `Steps: ${steps.join(' → ')}`);
              log.ok(`Onboarding: ${url}`);
              return;
            }
          }
        }
        // Fall back to app home
        await goto(page, 'https://app.heygen.com/');
        await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await cap.ss(page, 'A10-app-home', 'App home — authenticated initial state');
        await cap.ssFull(page, 'A10-app-home-full', 'App home — full');
        await cap.snap(page, 'A10-app-home', 'App home — text');
        idx.add('AUTH:ONBOARDING', 'App home (onboarding proxy)', page.url(), 'Initial authenticated state captured');
        log.info('Onboarding not found — captured app home as proxy');
      },
    },

    {
      id: 'A11',
      label: 'Upgrade gate / paywall modals — all popup states',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const testUrls = [
          'https://app.heygen.com/avatars',
          'https://app.heygen.com/create',
          'https://app.heygen.com/templates',
        ];
        for (const url of testUrls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            if (page.url().includes('/login')) continue;
            await dismissOverlays(page);

            await cap.ss(page, 'A11-pre-gate', `Pre-gate state — ${url.split('/').pop()}`);

            // Try triggering an upgrade prompt
            const upgradeEl = await page.$([
              'button:has-text("Upgrade")',
              'button:has-text("Get Pro")',
              '[class*="upgrade"]',
              'button:has-text("Unlock")',
              '[data-testid*="upgrade"]',
              '[class*="paywall"]',
            ].join(', '));

            if (upgradeEl) {
              await upgradeEl.click().catch(() => null);
              await page.waitForTimeout(2500);
              await cap.ss(page, 'A11-gate-modal', 'Upgrade gate modal — opened');
              await cap.ssFull(page, 'A11-gate-modal-full', 'Upgrade gate — full modal view');
              await cap.snap(page, 'A11-gate-modal', 'Upgrade gate — text');

              const gateContent = await page.evaluate(() => {
                const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="popup"]');
                const allGateCopy = document.body.innerText.match(/(upgrade|unlock|pro|business|enterprise|credit|limit)[^\n]{0,200}/gi) || [];
                return { modalText: modal?.innerText?.slice(0, 1500) || '', gateCopy: [...new Set(allGateCopy)].slice(0, 10) };
              }).catch(() => ({}));
              await cap.snapJSON('A11-gate-content', gateContent);

              idx.add('AUTH:GATE', 'Upgrade gate / paywall popup', page.url(), `Modal: "${gateContent.modalText?.slice(0, 100)}"`);
              log.ok('Upgrade gate captured');
              return;
            } else {
              log.info(`No upgrade button at ${url} — capturing gated elements`);
              const gatedEls = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('[aria-disabled="true"], [class*="locked"], [class*="disabled"]'))
                  .map(el => el.textContent?.trim().slice(0, 60))
                  .filter(Boolean).slice(0, 15);
              }).catch(() => []);
              if (gatedEls.length > 0) {
                await cap.snapJSON('A11-gated-elements', gatedEls);
                await cap.ss(page, 'A11-gated-state', 'Gated elements visible on page');
                idx.add('AUTH:GATE', 'Gated elements state', page.url(), `${gatedEls.length} gated elements`);
                log.ok(`Gated elements captured: ${gatedEls.join(', ')}`);
                return;
              }
            }
          }
        }
        log.warn('Could not trigger upgrade gate at any test URL');
      },
    },

    {
      id: 'A12',
      label: 'Explore / inspiration gallery — community video examples',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Reference for how HeyGen shows premium example videos to inspire creators
        const urls = [
          'https://app.heygen.com/explore',
          'https://app.heygen.com/inspiration',
          'https://app.heygen.com/showcase',
          'https://app.heygen.com/examples',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(4000);
            await dismissOverlays(page);
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!page.url().includes('/login') && text.length > 300) {
              await cap.ss(page, 'A12-explore-fold', 'Explore / inspiration — fold');
              await cap.ssFull(page, 'A12-explore-full', 'Explore — full');
              await cap.snap(page, 'A12-explore', 'Explore — text');

              for (let i = 0; i < 3; i++) {
                await page.evaluate(() => window.scrollBy(0, 900));
                await page.waitForTimeout(700);
              }
              await cap.ss(page, 'A12-explore-scroll', 'Explore — scrolled');

              idx.add('AUTH:EXPLORE', 'Explore / inspiration gallery', page.url(), 'Video gallery reference for Avion empty sections');
              log.ok(`Explore gallery: ${url}`);
              return;
            }
          }
        }
        log.warn('Explore gallery not found at any URL');
      },
    },

    {
      id: 'A13',
      label: 'Talking Photo / Photo Avatar — character frame UI',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Talking Photo is HeyGen's AI character creation from any still image
        // Key reference for Avion's character/persona system
        const urls = [
          'https://app.heygen.com/talking-photo',
          'https://app.heygen.com/photo-avatar',
          'https://app.heygen.com/create/talking-photo',
        ];
        for (const url of urls) {
          if (await goto(page, url)) {
            await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(3000);
            await dismissOverlays(page);
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            if (!page.url().includes('/login') && text.length > 200) {
              await cap.ss(page, 'A13-talking-photo-fold', 'Talking Photo — fold');
              await cap.ssFull(page, 'A13-talking-photo-full', 'Talking Photo — full');
              await cap.snap(page, 'A13-talking-photo', 'Talking Photo — text');

              const ui = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button, [class*="upload"], [class*="photo"], input[type="file"]'))
                  .map(el => el.textContent?.trim().slice(0, 60) || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '')
                  .filter(Boolean).slice(0, 15);
              }).catch(() => []);
              await cap.snapJSON('A13-talking-photo-ui', ui);

              idx.add('AUTH:CHARACTER', 'Talking Photo / Photo Avatar UI', page.url(), `UI elements: ${ui.join(' | ')}`);
              log.ok(`Talking Photo: ${url}`);
              return;
            }
          }
        }
        log.warn('Talking Photo not accessible');
      },
    },

  ],
};
