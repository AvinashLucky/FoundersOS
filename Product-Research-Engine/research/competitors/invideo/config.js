/**
 * research/competitors/invideo/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * InVideo AI — Competitor Research Config
 * 🐊 Crocodile #1 — Video Creation Platform
 *
 * Only InVideo-specific routes, selectors, and section logic lives here.
 * All shared toolkit (goto, ss, snap, log, idx) is injected by crawl.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default {
  id:               'invideo',
  name:             'InVideo AI',
  emoji:            '🐊',
  category:         'Video Creation Platform',
  appUrl:           'https://ai.invideo.io/',
  publicBaseUrl:    'https://invideo.io',
  loginUrlPatterns: ['/login', '/auth', '/signup', '/sign-in'],

  // ─── PUBLIC SECTIONS ─────────────────────────────────────────────────────
  // No auth required. Run with: node research/explorers/crawl.js invideo --public

  publicSections: [

    {
      id: '01',
      label: 'Homepage — positioning, hero, social proof',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://invideo.io/');
        await dismissOverlays(page);
        await cap.ss(page, '01-home-fold', 'Homepage — above fold');
        await cap.snapStructured(page, '01-home');
        await cap.snap(page, '01-home', 'Homepage — full text');
        await page.evaluate(() => window.scrollBy(0, 700)); await page.waitForTimeout(700);
        await cap.ss(page, '01-home-features', 'Homepage — feature strip');
        await page.evaluate(() => window.scrollBy(0, 1200)); await page.waitForTimeout(700);
        await cap.ss(page, '01-home-social', 'Homepage — social proof / testimonials');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(700);
        await cap.ss(page, '01-home-footer', 'Homepage — footer / nav map');
        await cap.ssFull(page, '01-home-full', 'Homepage — full page');

        // SEO meta
        const meta = await page.evaluate(() => ({
          title:       document.title,
          description: document.querySelector('meta[name="description"]')?.content,
          ogTitle:     document.querySelector('meta[property="og:title"]')?.content,
          ogDesc:      document.querySelector('meta[property="og:description"]')?.content,
          keywords:    document.querySelector('meta[name="keywords"]')?.content,
        })).catch(() => ({}));
        await cap.snapJSON('01-seo-meta', meta);
        idx.add('HOMEPAGE', 'Hero + full page', page.url(), `Brand: "${meta.title}" | Desc: "${meta.description}"`);
        log.info(`Title: ${meta.title}`);
        log.info(`Description: ${meta.description}`);
      },
    },

    {
      id: '02',
      label: 'AI Video Generator landing page',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = ['https://invideo.io/make/ai-video-generator/', 'https://invideo.io/ai/', 'https://invideo.io/make/ai-video/'];
        for (const url of urls) {
          if (await goto(page, url)) {
            if (!page.url().includes('404')) {
              await dismissOverlays(page);
              await cap.ss(page, '02-ai-hero', 'AI Video Generator — hero');
              await cap.ssFull(page, '02-ai-full', 'AI Video Generator — full');
              await cap.snap(page, '02-ai', 'AI Video Generator — text');
              await cap.snapStructured(page, '02-ai');
              idx.add('PRODUCT', 'AI Video Generator', page.url(), 'Main product landing — prompts, workflow, models');
              log.ok(`AI video page found: ${url}`);
              return;
            }
          }
        }
        log.warn('AI video landing not found at any known URL');
      },
    },

    {
      id: '03',
      label: 'Pricing — all tiers, credit model',
      run: async ({ page, log, cap, idx, goto, clickText, dismissOverlays }) => {
        if (await goto(page, 'https://invideo.io/pricing/')) {
          await dismissOverlays(page);
          await cap.ss(page, '03-pricing-fold', 'Pricing — above fold');
          await cap.ssFull(page, '03-pricing-full', 'Pricing — full');
          await cap.snap(page, '03-pricing', 'Pricing — full text');
          await cap.snapStructured(page, '03-pricing');
          idx.add('PRICING', 'All tiers', page.url(), 'Pricing tiers, credit model, FAQ');

          // Try toggle
          const toggled = await clickText(page, 'Monthly') || await clickText(page, 'Annual') || await clickText(page, 'Yearly');
          if (toggled) { await cap.ss(page, '03-pricing-toggled', 'Pricing — after period toggle'); }
        }
      },
    },

    {
      id: '04',
      label: 'Templates / Make gallery',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        const urls = ['https://invideo.io/make/', 'https://invideo.io/templates/'];
        for (const url of urls) {
          if (await goto(page, url)) {
            await dismissOverlays(page);
            await cap.ss(page, '04-templates-fold', 'Templates — above fold');
            await cap.ssFull(page, '04-templates-full', 'Templates — full');
            await cap.snap(page, '04-templates', 'Templates — text');
            idx.add('TEMPLATES', 'Public gallery', page.url(), 'Template library — types, categories, volume');
            log.ok(`Templates page: ${url}`);
            return;
          }
        }
      },
    },

    {
      id: '05',
      label: 'Nav map — all public routes',
      run: async ({ page, log, cap, idx, goto, discoverRoutes }) => {
        await goto(page, 'https://invideo.io/');
        const navLinks = await page.evaluate(() =>
          Array.from(document.querySelectorAll('nav a, header a'))
            .map(a => ({ text: a.textContent.trim(), href: a.href }))
            .filter(a => a.text && a.href.startsWith('http'))
            .filter((a, i, arr) => arr.findIndex(x => x.href === a.href) === i)
            .slice(0, 40)
        ).catch(() => []);
        await cap.snapJSON('05-nav-map', navLinks);
        idx.add('NAV', 'Full nav map', 'invideo.io', `${navLinks.length} nav links discovered`);
        log.ok(`Nav map: ${navLinks.length} links`);
      },
    },

    {
      id: '06',
      label: 'Auth wall — sign-up & app entry (document only)',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        if (await goto(page, 'https://invideo.io/signup/')) {
          await dismissOverlays(page);
          await cap.ss(page, '06-signup', 'Sign-up page — documented, not submitted');
          await cap.snapStructured(page, '06-signup');
          idx.add('AUTH_WALL', 'Sign-up page', page.url(), 'Sign-up form documented — no submission');
          log.info('AUTH WALL: sign-up page documented. Stopping here.');
        }
        // App redirect wall
        if (await goto(page, 'https://ai.invideo.io/')) {
          await dismissOverlays(page);
          await cap.ss(page, '06-app-auth-wall', 'ai.invideo.io — auth redirect wall');
          idx.add('AUTH_WALL', 'App redirect', page.url(), 'ai.invideo.io requires auth');
          log.info('AUTH WALL: ai.invideo.io requires auth.');
        }
      },
    },

  ],

  // ─── AUTHENTICATED SECTIONS ───────────────────────────────────────────────
  // Requires: node research/explorers/save-session.js invideo
  // Run with: node research/explorers/crawl.js invideo --auth

  authSections: [

    // ── SHARED SPA WAIT ────────────────────────────────────────────────────────
    // InVideo is a React SPA at ai.invideo.io/workspace/{uuid}/agent-two.
    // Standard URL navigation often 404s or lands on wrong state.
    // Strategy: navigate to root → wait for redirect → interact with visible UI.

    {
      id: 'A01',
      label: 'Workspace entry — full DOM map, nav, visible text',
      run: async ({ page, log, cap, idx, dismissOverlays }) => {
        // Already at workspace from session validation in crawl.js.
        // Wait for full SPA hydration.
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);

        const wsUrl = page.url();
        log.info(`Workspace URL: ${wsUrl}`);
        idx.add('DASHBOARD', 'Workspace root', wsUrl, 'Authenticated entry — SPA workspace');

        await cap.ss(page, 'A01-workspace', 'Workspace — above fold');
        await cap.ssFull(page, 'A01-workspace-full', 'Workspace — full page');
        await cap.snap(page, 'A01-workspace', 'Workspace — all visible text');
        await cap.snapStructured(page, 'A01-workspace');

        // Comprehensive nav discovery — any clickable element in header/sidebar
        const navItems = await page.evaluate(() => {
          const seen = new Set();
          return Array.from(document.querySelectorAll(
            'header *, [role="navigation"] *, aside *, [role="menubar"] *, [role="menu"] *'
          ))
            .filter(el => {
              const t = el.textContent?.trim();
              return t && t.length > 0 && t.length < 60 && !seen.has(t) && seen.add(t);
            })
            .map(el => ({
              tag: el.tagName,
              text: el.textContent.trim(),
              role: el.getAttribute('role'),
              href: el.href || null,
              ariaLabel: el.getAttribute('aria-label'),
            }))
            .slice(0, 60);
        }).catch(() => []);
        await cap.snapJSON('A01-nav-items', navItems);
        log.ok(`Nav items: ${navItems.length} — ${navItems.map(n => n.text).slice(0, 8).join(' | ')}`);

        // All visible buttons on page
        const allButtons = await page.evaluate(() =>
          Array.from(document.querySelectorAll('button, [role="button"], a[href]'))
            .map(el => ({ text: el.textContent?.trim(), tag: el.tagName, href: el.href || null }))
            .filter(x => x.text && x.text.length > 0 && x.text.length < 80)
            .filter((x, i, a) => a.findIndex(y => y.text === x.text) === i)
            .slice(0, 50)
        ).catch(() => []);
        await cap.snapJSON('A01-all-buttons', allButtons);
        log.ok(`Buttons on page: ${allButtons.map(b => b.text).slice(0, 10).join(' | ')}`);
      },
    },

    {
      id: 'A02',
      label: 'Project library — discover projects list',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // InVideo workspace IS the project context. Try going to root for project list.
        const wsUrl = page.url();
        const wsId  = wsUrl.match(/workspace\/([^/]+)/)?.[1];

        // Try workspace root (strips /agent-two) to see project list
        const candidates = [
          wsId ? `https://ai.invideo.io/workspace/${wsId}` : null,
          'https://ai.invideo.io/',
        ].filter(Boolean);

        for (const url of candidates) {
          await goto(page, url, { wait: 3000 });
          await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
          await dismissOverlays(page);

          // Look for any project/video card elements
          const projects = await page.evaluate(() => {
            // Generic: any grid/list items that look like project cards
            const containers = document.querySelectorAll(
              '[role="listitem"], [role="gridcell"], article, [class*="project"], [class*="workspace"], [class*="video"]'
            );
            return Array.from(containers)
              .map(el => ({ text: el.textContent?.trim().slice(0, 100), tag: el.tagName }))
              .filter(x => x.text && x.text.length > 3)
              .slice(0, 20);
          }).catch(() => []);

          await cap.ss(page, 'A02-projects', `Project library — ${url}`);
          await cap.ssFull(page, 'A02-projects-full', 'Projects — full scroll');
          await cap.snap(page, 'A02-projects', 'Projects page — text');
          await cap.snapJSON('A02-project-cards', projects);
          idx.add('HOME', 'Project library', page.url(), `${projects.length} project items found`);
          log.ok(`Project items found: ${projects.length}`);
          if (projects.length > 0) return;
        }
        log.warn('Project list not found — workspace may show agent interface directly');
      },
    },

    {
      id: 'A03',
      label: 'Create / New Project — workflow entry',
      run: async ({ page, log, cap, idx, goto, dismissOverlays, probeVisible }) => {
        // Start from workspace root
        await goto(page, 'https://ai.invideo.io/', { wait: 3000 });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
        await dismissOverlays(page);
        await page.waitForTimeout(2000);

        await cap.ss(page, 'A03-before-create', 'Before create interaction');

        // Try every possible create entry point
        const createTexts = [
          'New project', 'New Project', 'Create project', 'Create Project',
          'Create video', 'Create Video', '+ New', 'New video', 'New Video',
          'Start creating', 'Get started', 'Create', 'New',
        ];

        let createFound = false;
        for (const text of createTexts) {
          try {
            const el = page.getByText(text, { exact: true }).first();
            if (await el.isVisible({ timeout: 1000 })) {
              log.ok(`Create button found: "${text}"`);
              await el.click({ timeout: 2000 });
              await page.waitForTimeout(2500);
              await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => null);
              createFound = true;
              break;
            }
          } catch { /* try next */ }
        }

        // Also try role=button with create-like labels
        if (!createFound) {
          try {
            const btn = page.getByRole('button', { name: /create|new|start/i }).first();
            if (await btn.isVisible({ timeout: 2000 })) {
              await btn.click();
              await page.waitForTimeout(2500);
              createFound = true;
              log.ok('Create button found via role=button + regex');
            }
          } catch { /* not found */ }
        }

        await dismissOverlays(page);
        await cap.ss(page, 'A03-create-entry', createFound ? 'Create flow — entered' : 'Create — diagnostic (no create button)');
        await cap.ssFull(page, 'A03-create-full', 'Create entry — full page');
        await cap.snap(page, 'A03-create-entry', 'Create entry — text');
        await cap.snapStructured(page, 'A03-create-entry');
        idx.add('CREATE', createFound ? 'Create flow entered' : 'Create entry (diagnostic)', page.url(), 'Workflow picker or agent prompt');

        // Probe ALL visible text labels — InVideo workflow types
        const workflowLabels = [
          'Film', 'Promo', 'Performance Ad', 'Product Ad', 'Microdrama',
          'AI Video', 'Text to Video', 'Template', 'Short', 'Reel',
          'YouTube', 'Instagram', 'TikTok', 'Agent', 'Script',
        ];
        const foundWf = await probeVisible(page, workflowLabels, 1000);
        await cap.snapJSON('A03-workflow-types', foundWf);
        log.ok(`Workflow types visible: ${foundWf.join(', ') || 'none — check diagnostic screenshot'}`);
      },
    },

    {
      id: 'A04',
      label: 'AI prompt / Agent Two interface',
      run: async ({ page, log, cap, idx, dismissOverlays }) => {
        // InVideo Agent Two = the workspace itself. The prompt IS the main UI.
        // We're likely already in the workspace — just inspect what's there.
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        // Deep form inspection — works for textarea, contenteditable, input
        const formState = await page.evaluate(() => {
          const ta = document.querySelector('textarea');
          const ce = document.querySelector('[contenteditable="true"]');
          const inp = document.querySelectorAll('input:not([type="hidden"])');
          const allInputLike = Array.from(inp).map(i => ({
            type: i.type, placeholder: i.placeholder, ariaLabel: i.getAttribute('aria-label')
          }));
          // Any element accepting text input
          const promptHint = Array.from(document.querySelectorAll('*')).find(el => {
            const t = el.textContent?.trim().toLowerCase() || '';
            return (t.includes('describe') || t.includes('prompt') || t.includes('what') || t.includes('tell'))
              && t.length < 120 && el.children.length === 0;
          });
          return {
            hasTextarea: !!ta,
            textareaPlaceholder: ta?.placeholder,
            hasContenteditable: !!ce,
            inputs: allInputLike,
            promptHint: promptHint?.textContent?.trim(),
          };
        }).catch(() => ({}));
        await cap.snapJSON('A04-prompt-form', formState);
        await cap.ss(page, 'A04-prompt', 'Prompt/Agent UI — current state');
        await cap.ssFull(page, 'A04-prompt-full', 'Prompt UI — full');
        await cap.snap(page, 'A04-prompt', 'Prompt UI — text');
        idx.add('CREATE', 'AI prompt interface', page.url(), `textarea:${formState.hasTextarea} | contenteditable:${formState.hasContenteditable} | hint:"${formState.promptHint}"`);
        log.ok(`Prompt form — textarea:${formState.hasTextarea}, hint:"${formState.promptHint || 'none'}"`);
      },
    },

    {
      id: 'A05',
      label: 'Workflow type selection — Film/Promo/Ad/Script',
      run: async ({ page, log, cap, idx, dismissOverlays }) => {
        // InVideo homepage shows Film/Promo/Performance Ad/Product Ad/Microdrama as workflow types.
        // These may appear as tabs, cards, or dropdown in the authenticated workspace.
        await page.waitForTimeout(1500);
        await dismissOverlays(page);

        // Broad text search for workflow types
        const workflowTypes = await page.evaluate(() => {
          const targets = ['Film', 'Promo', 'Performance Ad', 'Product Ad', 'Microdrama',
            'Script', 'Storyboard', 'Timeline', 'Template', 'Agent'];
          const found = [];
          const all = Array.from(document.querySelectorAll('button, [role="tab"], [role="option"], a, li, span, div'));
          for (const t of targets) {
            const el = all.find(e => e.textContent?.trim() === t);
            if (el) found.push({ text: t, tag: el.tagName, role: el.getAttribute('role') });
          }
          return found;
        }).catch(() => []);
        await cap.snapJSON('A05-workflow-types-found', workflowTypes);
        await cap.ss(page, 'A05-workflow-types', 'Workflow type options');
        idx.add('WORKFLOW', 'Type options', page.url(), workflowTypes.map(w => w.text).join(', ') || 'none found in current view');
        log.ok(`Workflow types in DOM: ${workflowTypes.map(w => w.text).join(', ') || 'none'}`);

        // Try clicking the first workflow type to see what happens
        if (workflowTypes.length > 0) {
          try {
            await page.getByText(workflowTypes[0].text, { exact: true }).first().click({ timeout: 2000 });
            await page.waitForTimeout(2000);
            await dismissOverlays(page);
            await cap.ss(page, 'A05-workflow-selected', `After clicking: ${workflowTypes[0].text}`);
            await cap.snap(page, 'A05-workflow-selected', `Workflow selected — ${workflowTypes[0].text}`);
            idx.add('WORKFLOW', `Selected: ${workflowTypes[0].text}`, page.url(), 'State after workflow type selection');
          } catch { log.warn(`Could not click workflow type: ${workflowTypes[0].text}`); }
        }
      },
    },

    {
      id: 'A06',
      label: 'Editor / project — open from workspace',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // The workspace URL itself IS the editor context.
        // Try navigating to the full workspace URL (already there after A01).
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        await cap.ss(page, 'A06-workspace-editor', 'Editor — workspace view');
        await cap.ssFull(page, 'A06-workspace-editor-full', 'Editor — full page');
        await cap.snap(page, 'A06-workspace-editor', 'Editor — text content');
        await cap.snapStructured(page, 'A06-editor');

        // Check for any project list to click into
        const projectLinks = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href*="workspace"], a[href*="project"], a[href*="video"]'))
            .map(a => ({ text: a.textContent?.trim(), href: a.href }))
            .filter(x => x.text && x.href)
            .slice(0, 10)
        ).catch(() => []);
        await cap.snapJSON('A06-project-links', projectLinks);

        if (projectLinks.length > 0) {
          log.ok(`Found ${projectLinks.length} project links — navigating to first`);
          await goto(page, projectLinks[0].href, { wait: 3000 });
          await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
          await page.waitForTimeout(2000);
          await dismissOverlays(page);
          await cap.ss(page, 'A06-project-open', 'Editor — project opened');
          await cap.ssFull(page, 'A06-project-open-full', 'Editor project — full');
          await cap.snap(page, 'A06-project-open', 'Editor project — text');
          idx.add('EDITOR', 'Project opened', page.url(), 'Full editor with project loaded');
        } else {
          log.warn('No project links found — workspace may be empty or agent-first');
          idx.add('EDITOR', 'Workspace (no project links)', page.url(), 'Workspace editor state — no project cards found');
        }
      },
    },

    {
      id: 'A07',
      label: 'All interactive UI elements — buttons, panels, tools',
      run: async ({ page, log, cap, idx, dismissOverlays }) => {
        await page.waitForTimeout(1500);
        await dismissOverlays(page);

        // Comprehensive button/tool discovery regardless of class names
        const uiElements = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll(
            'button, [role="button"], [role="menuitem"], [role="tab"], [role="option"], ' +
            '[aria-label], [title], input[type="submit"], input[type="button"]'
          ));
          const seen = new Set();
          return els
            .map(el => ({
              text: (el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 80),
              role: el.getAttribute('role') || el.tagName.toLowerCase(),
              ariaLabel: el.getAttribute('aria-label'),
              disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
            }))
            .filter(x => x.text && !seen.has(x.text) && seen.add(x.text))
            .slice(0, 60);
        }).catch(() => []);

        await cap.snapJSON('A07-all-ui-elements', uiElements);
        await cap.ss(page, 'A07-ui-state', 'Full UI — all interactive elements mapped');
        idx.add('UI_MAP', 'All buttons & tools', page.url(), `${uiElements.length} interactive elements`);
        log.ok(`UI elements: ${uiElements.length} — ${uiElements.slice(0,8).map(e=>e.text).join(' | ')}`);

        // AI-specific tool detection
        const aiKeywords = ['generate', 'ai', 'magic', 'regenerate', 'enhance', 'rewrite', 'suggest', 'agent', 'prompt', 'script', 'voice'];
        const aiTools = uiElements.filter(el =>
          aiKeywords.some(kw => el.text.toLowerCase().includes(kw) || (el.ariaLabel || '').toLowerCase().includes(kw))
        );
        await cap.snapJSON('A07-ai-tools', aiTools);
        log.ok(`AI tools: ${aiTools.map(t => t.text).join(', ') || 'none detected'}`);
        idx.add('AI_TOOLS', 'Detected AI elements', page.url(), aiTools.map(t => t.text).join(', ') || 'none');
      },
    },

    {
      id: 'A08',
      label: 'Export, download & sharing options',
      run: async ({ page, log, cap, idx, dismissOverlays }) => {
        await dismissOverlays(page);

        // Look for export/download anywhere on page
        const exportEls = await page.evaluate(() => {
          const keywords = ['export', 'download', 'share', 'publish', 'render', 'save as'];
          const all = Array.from(document.querySelectorAll('button, [role="button"], a, [role="menuitem"]'));
          return all
            .filter(el => keywords.some(kw => el.textContent?.toLowerCase().includes(kw) || el.getAttribute('aria-label')?.toLowerCase().includes(kw)))
            .map(el => ({ text: el.textContent?.trim(), ariaLabel: el.getAttribute('aria-label'), tag: el.tagName }))
            .filter(x => (x.text || x.ariaLabel))
            .slice(0, 10);
        }).catch(() => []);

        await cap.snapJSON('A08-export-elements', exportEls);
        await cap.ss(page, 'A08-before-export', 'Before export interaction');

        if (exportEls.length > 0) {
          log.ok(`Export elements found: ${exportEls.map(e => e.text || e.ariaLabel).join(', ')}`);
          // Click the first one to reveal export options
          try {
            const exportBtn = page.getByText(exportEls[0].text || '', { exact: false }).first();
            if (await exportBtn.isVisible({ timeout: 1500 })) {
              await exportBtn.click({ timeout: 2000 });
              await page.waitForTimeout(2000);
              await dismissOverlays(page);
              await cap.ss(page, 'A08-export-modal', 'Export modal / options');
              await cap.snap(page, 'A08-export-modal', 'Export modal — text');
              await cap.snapStructured(page, 'A08-export-modal');
              idx.add('EXPORT', 'Export options opened', page.url(), 'Export/download modal revealed');
            }
          } catch { log.warn('Could not click export element'); }
        } else {
          log.warn('No export/download elements found — may only appear inside a loaded project');
          await cap.ss(page, 'A08-export-diagnostic', 'Export diagnostic — current page state');
          idx.add('EXPORT', 'Not found at this state', page.url(), 'Export likely inside editor with project loaded');
        }
      },
    },

    {
      id: 'A09',
      label: 'Credits, plan & usage',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // InVideo uses a credit system. Credits often shown in header or settings.
        await page.waitForTimeout(1000);

        // Search the current page for credit info first
        const creditInfo = await page.evaluate(() => {
          const all = Array.from(document.querySelectorAll('*'));
          const creditEls = all.filter(el => {
            const t = el.textContent?.trim() || '';
            return (t.match(/\d+\s*credit/i) || t.match(/credit.*\d+/i)) && t.length < 100 && el.children.length <= 2;
          });
          return creditEls.map(el => ({ text: el.textContent?.trim(), tag: el.tagName })).slice(0, 5);
        }).catch(() => []);

        await cap.snapJSON('A09-credit-display', creditInfo);

        if (creditInfo.length > 0) {
          log.ok(`Credits visible: ${creditInfo.map(c => c.text).join(' | ')}`);
          await cap.ss(page, 'A09-credits-visible', 'Credits visible on current page');
          idx.add('CREDITS', 'Credit display found', page.url(), creditInfo[0]?.text || '');
        }

        // Try settings/account routes for full billing details
        const settingsRoutes = [
          'https://ai.invideo.io/settings',
          'https://ai.invideo.io/account',
          'https://ai.invideo.io/settings/billing',
          'https://ai.invideo.io/billing',
        ];
        for (const url of settingsRoutes) {
          await goto(page, url, { wait: 3000 });
          await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
          if (!page.url().includes('/login') && !page.url().includes('/signup')) {
            await dismissOverlays(page);
            await cap.ss(page, 'A09-settings-billing', `Settings/billing — ${url}`);
            await cap.ssFull(page, 'A09-settings-billing-full', 'Settings — full');
            await cap.snap(page, 'A09-settings-billing', 'Settings — text');
            await cap.snapStructured(page, 'A09-settings');
            idx.add('CREDITS', 'Settings/billing page', page.url(), 'Plan, credits, billing info');
            log.ok(`Settings page found: ${page.url()}`);
            return;
          }
        }

        // Fall back: open account menu to find settings link
        log.warn('Settings route not found via direct URL — will try via account menu in A15');
        await cap.ss(page, 'A09-settings-diagnostic', 'Settings not found — diagnostic');
      },
    },

    {
      id: 'A10',
      label: 'Account menu — open and map all options',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://ai.invideo.io/', { wait: 3000 });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        await cap.ss(page, 'A10-before-account', 'Before account menu — full header');

        // Multi-strategy account menu click
        // InVideo likely has an avatar or user icon — try all patterns
        const accountSelectors = [
          // By image (avatar)
          'img[alt*="avatar"], img[alt*="user"], img[alt*="profile"], img[alt*="photo"]',
          // By aria
          '[aria-label*="account" i], [aria-label*="profile" i], [aria-label*="user" i], [aria-label*="menu" i]',
          // By role
          'button[aria-haspopup], [role="button"][aria-haspopup]',
          // By position (last button in header)
          'header button:last-child, header [role="button"]:last-child',
          // By visual pattern
          '[class*="avatar"], [class*="user-menu"], [class*="account"]',
        ];

        let menuOpened = false;
        for (const sel of accountSelectors) {
          try {
            const els = page.locator(sel);
            const count = await els.count().catch(() => 0);
            for (let i = 0; i < Math.min(count, 3); i++) {
              try {
                const el = els.nth(i);
                if (await el.isVisible({ timeout: 800 })) {
                  await el.click({ timeout: 1500 });
                  await page.waitForTimeout(1200);
                  // Check if a dropdown/menu appeared
                  const menuAppeared = await page.evaluate(() =>
                    document.querySelector('[role="menu"], [role="listbox"], [class*="dropdown"], [class*="menu-open"]') !== null
                  ).catch(() => false);
                  if (menuAppeared) {
                    menuOpened = true;
                    log.ok(`Account menu opened via: ${sel}`);
                    break;
                  }
                }
              } catch { /* try next */ }
            }
            if (menuOpened) break;
          } catch { /* try next sel */ }
        }

        await cap.ss(page, 'A10-account-menu', menuOpened ? 'Account menu — open' : 'Account menu — diagnostic');
        await cap.snap(page, 'A10-account-menu', 'Account menu — text');

        if (menuOpened) {
          const menuItems = await page.evaluate(() =>
            Array.from(document.querySelectorAll('[role="menu"] *, [role="listbox"] *, [class*="dropdown"] *'))
              .map(el => ({ text: el.textContent?.trim(), href: el.href || null }))
              .filter(x => x.text && x.text.length > 0 && x.text.length < 60)
              .filter((x, i, a) => a.findIndex(y => y.text === x.text) === i)
              .slice(0, 20)
          ).catch(() => []);
          await cap.snapJSON('A10-menu-items', menuItems);
          log.ok(`Menu items: ${menuItems.map(m => m.text).join(', ')}`);
          idx.add('ACCOUNT', 'Profile menu open', page.url(), menuItems.map(m => m.text).join(', '));

          // Navigate to settings via menu if available
          const settingsItem = menuItems.find(m => /settings|profile|account|plan|billing/i.test(m.text));
          if (settingsItem?.href) {
            await goto(page, settingsItem.href, { wait: 3000 });
            await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
            await dismissOverlays(page);
            await cap.ss(page, 'A10-settings-via-menu', `Settings via menu — ${settingsItem.text}`);
            await cap.ssFull(page, 'A10-settings-full', 'Settings — full');
            await cap.snap(page, 'A10-settings-via-menu', 'Settings — text');
            idx.add('SETTINGS', `Settings via "${settingsItem.text}"`, page.url(), 'Account settings reached via menu');
            log.ok(`Settings found via menu: ${settingsItem.text} → ${page.url()}`);
          }
        } else {
          log.warn('Account menu did not open via any selector — check diagnostic screenshot');
          idx.add('ACCOUNT', 'Menu not opened', page.url(), 'Account menu trigger not found — see A10-before-account.png');
        }
        await page.keyboard.press('Escape').catch(() => null);
      },
    },

    {
      id: 'A11',
      label: 'Feature gates — lock, upgrade, premium indicators',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://ai.invideo.io/', { wait: 3000 });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        // Broad lock/gate detection — InVideo may use SVG lock icons, "Pro" badges, crown icons
        const gates = await page.evaluate(() => {
          const results = [];
          // Text-based detection
          const keywords = ['upgrade', 'pro', 'premium', 'unlock', 'get more', 'buy credits', 'top up', 'plan'];
          Array.from(document.querySelectorAll('button, span, div, a, p')).forEach(el => {
            const t = el.textContent?.trim().toLowerCase() || '';
            if (keywords.some(k => t.includes(k)) && t.length < 80 && el.children.length <= 1) {
              results.push({ text: el.textContent?.trim(), tag: el.tagName, type: 'text' });
            }
          });
          // SVG icons that might be lock/crown (check title or aria)
          Array.from(document.querySelectorAll('svg, img')).forEach(el => {
            const label = el.getAttribute('aria-label') || el.querySelector('title')?.textContent || el.getAttribute('alt') || '';
            if (/lock|crown|pro|premium|star/i.test(label)) {
              results.push({ text: label, tag: el.tagName, type: 'icon' });
            }
          });
          // Disabled buttons
          Array.from(document.querySelectorAll('button[disabled], [aria-disabled="true"]')).forEach(el => {
            const t = el.textContent?.trim();
            if (t) results.push({ text: t, tag: el.tagName, type: 'disabled' });
          });
          return results.filter((x, i, a) => a.findIndex(y => y.text === x.text) === i).slice(0, 30);
        }).catch(() => []);

        await cap.snapJSON('A11-feature-gates', gates);
        await cap.ss(page, 'A11-feature-gates', 'Feature gates — current page');
        idx.add('FEATURE_GATES', 'Lock/upgrade detection', page.url(), `${gates.length} indicators: ${gates.slice(0,3).map(g=>g.text).join(', ')}`);
        log.ok(`Feature gates: ${gates.length} — ${gates.slice(0,5).map(g=>`"${g.text}"[${g.type}]`).join(' | ')}`);
      },
    },

    {
      id: 'A12',
      label: 'Route & link discovery — all internal URLs',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://ai.invideo.io/', { wait: 3000 });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        // Collect ALL internal hrefs — this works even in SPAs with client-side routing
        const allRoutes = await page.evaluate(() => {
          const seen = new Set();
          const routes = [];
          document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;
            if (href && !href.includes('mailto:') && !href.includes('javascript:') && !seen.has(href)) {
              seen.add(href);
              routes.push({ href, text: a.textContent?.trim().slice(0, 60) });
            }
          });
          // Also check data-href / onClick navigation patterns
          document.querySelectorAll('[data-href], [data-url], [data-route]').forEach(el => {
            const href = el.getAttribute('data-href') || el.getAttribute('data-url') || el.getAttribute('data-route');
            if (href && !seen.has(href)) { seen.add(href); routes.push({ href, text: el.textContent?.trim().slice(0,60) }); }
          });
          return routes.slice(0, 80);
        }).catch(() => []);

        await cap.snapJSON('A12-all-routes', allRoutes);
        const internal = allRoutes.filter(r => r.href.includes('ai.invideo.io') || r.href.startsWith('/'));
        log.ok(`Routes discovered: ${allRoutes.length} total, ${internal.length} internal`);
        idx.add('ROUTES', 'Full route map', page.url(), `${internal.length} internal routes`);

        // Visit up to 8 unique internal routes we haven't seen
        const visited = new Set([page.url()]);
        let count = 0;
        for (const route of internal) {
          if (count >= 8) break;
          if (visited.has(route.href)) continue;
          visited.add(route.href);
          await goto(page, route.href, { wait: 2000 });
          await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => null);
          if (!page.url().includes('/login') && !page.url().includes('/signup')) {
            await dismissOverlays(page);
            const slug = route.href.replace('https://ai.invideo.io', '').replace(/\//g,'-').slice(0,25) || 'root';
            await cap.ss(page, `A12-route-${String(count).padStart(2,'0')}-${slug}`, `Route: ${route.text || route.href}`);
            idx.add('ROUTE', route.text || slug, route.href, `Discovered route`);
            count++;
          }
        }
        log.ok(`Probed ${count} discovered routes`);
      },
    },

    {
      id: 'A13',
      label: 'Voice, audio & music tools',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        await goto(page, 'https://ai.invideo.io/', { wait: 3000 });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await dismissOverlays(page);

        // Look for voice-related elements anywhere on current page
        const voiceEls = await page.evaluate(() => {
          const keywords = ['voice', 'audio', 'music', 'sound', 'tts', 'voiceover', 'narration', 'clone', 'speech'];
          const all = Array.from(document.querySelectorAll('button, a, [role="tab"], [role="menuitem"], span, div'));
          const seen = new Set();
          return all
            .filter(el => {
              const t = el.textContent?.trim().toLowerCase() || '';
              return keywords.some(k => t.includes(k)) && t.length < 80 && !seen.has(t) && seen.add(t);
            })
            .map(el => ({ text: el.textContent?.trim(), tag: el.tagName, href: el.href || null }))
            .slice(0, 15);
        }).catch(() => []);

        await cap.snapJSON('A13-voice-elements', voiceEls);
        await cap.ss(page, 'A13-voice-state', 'Voice/audio — current state');

        if (voiceEls.length > 0) {
          log.ok(`Voice elements: ${voiceEls.map(v=>v.text).join(', ')}`);
          idx.add('VOICE', 'Voice elements found', page.url(), voiceEls.map(v=>v.text).join(', '));
          // Try clicking first voice-related button
          try {
            await page.getByText(voiceEls[0].text, { exact: false }).first().click({ timeout: 2000 });
            await page.waitForTimeout(2000);
            await dismissOverlays(page);
            await cap.ss(page, 'A13-voice-panel', `Voice panel after clicking: ${voiceEls[0].text}`);
            await cap.snap(page, 'A13-voice-panel', 'Voice panel — text');
            idx.add('VOICE', 'Panel opened', page.url(), `Voice panel via "${voiceEls[0].text}"`);
          } catch { log.warn(`Could not click voice element: ${voiceEls[0].text}`); }
          await page.keyboard.press('Escape').catch(() => null);
        } else {
          log.warn('No voice elements on workspace root — voice likely inside create/editor flow');
          await cap.ss(page, 'A13-voice-diagnostic', 'Voice diagnostic — elements not found in current state');
          idx.add('VOICE', 'Not on this view', page.url(), 'Voice tools only inside editor/create flow');
        }
      },
    },

    {
      id: 'A14',
      label: 'Final overview — all text, full scroll, end state',
      run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
        // Go back to workspace root for final comprehensive capture
        await goto(page, 'https://ai.invideo.io/', { wait: 4000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
        await page.waitForTimeout(3000);
        await dismissOverlays(page);

        await cap.ss(page, 'A14-final-above-fold', 'Final — above fold');
        await cap.ssFull(page, 'A14-final-full', 'Final — full page');
        await cap.snap(page, 'A14-final', 'Final — complete text');

        // Final DOM summary
        const summary = await page.evaluate(() => ({
          url:           location.href,
          title:         document.title,
          totalElements: document.querySelectorAll('*').length,
          totalButtons:  document.querySelectorAll('button, [role="button"]').length,
          totalInputs:   document.querySelectorAll('input, textarea, [contenteditable]').length,
          totalLinks:    document.querySelectorAll('a[href]').length,
          bodyText:      document.body.innerText.slice(0, 2000),
        })).catch(() => ({}));
        await cap.snapJSON('A14-final-summary', summary);
        idx.add('FINAL', 'Complete capture', page.url(), `${summary.totalButtons} buttons | ${summary.totalLinks} links | ${summary.totalInputs} inputs`);
        log.ok(`Final state — URL: ${summary.url} | Buttons: ${summary.totalButtons} | Links: ${summary.totalLinks}`);
      },
    },

  ],
};
