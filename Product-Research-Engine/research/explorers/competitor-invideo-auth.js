/**
 * competitor-invideo-auth.js — SUPERSEDED
 * Use instead: node research/explorers/crawl.js invideo --auth
 * ─────────────────────────────────────────────────────────────────────────────
 * Crocodile Research — InVideo AI (🐊 #1 Priority) — AUTHENTICATED PHASE
 *
 * PREREQUISITES:
 *   1. Run save-invideo-session.js first → research/browser-sessions/invideo.json
 *   2. Node + Playwright installed
 *
 * SCOPE:
 *   Systematically explores the authenticated InVideo app.
 *   Does NOT bypass auth, does NOT generate expensive content,
 *   does NOT modify any Avion source code.
 *
 * OUTPUT:
 *   research/competitors/invideo/authenticated/screenshots/
 *   research/competitors/invideo/authenticated/snapshots/
 *   research/competitors/invideo/authenticated/AUTHENTICATED_CRAWL_LOG.md
 *   research/competitors/invideo/authenticated/AUTHENTICATED_MASTER_INDEX.md
 *
 * Run: node research/explorers/competitor-invideo-auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../');
const SESSION   = path.join(ROOT, 'research/browser-sessions/invideo.json');
const OUT       = path.join(ROOT, 'research/competitors/invideo/authenticated');
const SS        = path.join(OUT, 'screenshots');
const SN        = path.join(OUT, 'snapshots');

// ─── Guard ────────────────────────────────────────────────────────────────────
if (!fs.existsSync(SESSION)) {
  console.error('\n❌ Session file not found:', SESSION);
  console.error('   Run first: node research/browser-sessions/save-invideo-session.js\n');
  process.exit(1);
}

fs.mkdirSync(SS, { recursive: true });
fs.mkdirSync(SN, { recursive: true });

// ─── Logging ──────────────────────────────────────────────────────────────────
const LOG   = [];
const INDEX = [];   // master index entries
let   OK_N  = 0;
let   WN    = 0;

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const ok   = (m) => { const l = `[OK]   ${ts()} — ${m}`; console.log('\x1b[32m'+l+'\x1b[0m'); LOG.push(l); OK_N++; };
const warn = (m) => { const l = `[WARN] ${ts()} — ${m}`; console.log('\x1b[33m'+l+'\x1b[0m'); LOG.push(l); WN++; };
const info = (m) => { const l = `[INFO] ${ts()} — ${m}`; console.log('\x1b[36m'+l+'\x1b[0m'); LOG.push(l); };
const sec  = (t) => { const l = `\n${'─'.repeat(64)}\n## ${t}\n${'─'.repeat(64)}`; console.log('\x1b[35m'+l+'\x1b[0m'); LOG.push(l); };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ss(page, name, label) {
  const file = path.join(SS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false }).catch(() => null);
  ok(`Screenshot → ${name}.png | ${label}`);
  return { name, label, file };
}

async function ssFull(page, name, label) {
  const file = path.join(SS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => null);
  ok(`Full screenshot → ${name}.png | ${label}`);
  return { name, label, file };
}

/** Save visible text of the page to a snapshot file. */
async function snap(page, name, label) {
  const file = path.join(SN, `${name}.txt`);
  try {
    const text = await page.evaluate(() => {
      const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IFRAME']);
      const walker = document.createTreeWalker(
        document.body || document.documentElement,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => {
            if (!n.textContent?.trim()) return NodeFilter.FILTER_REJECT;
            if (skip.has(n.parentElement?.tagName)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      const lines = [];
      while (walker.nextNode()) {
        const t = walker.currentNode.textContent.trim();
        if (t.length > 1) lines.push(t);
      }
      return [...new Set(lines)].join('\n');
    });
    fs.writeFileSync(file, `# ${label}\nURL: ${page.url()}\n\n${text}`);
    ok(`Snapshot → ${name}.txt`);
  } catch (e) {
    warn(`Snapshot failed for ${name}: ${e.message.slice(0, 80)}`);
  }
}

/** Save structured data (headings, buttons, inputs, pricing) to JSON. */
async function snapStructured(page, name) {
  const data = await page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('h1,h2,h3,h4'))
      .map(el => ({ tag: el.tagName, text: el.textContent.trim() }))
      .filter(x => x.text).slice(0, 60);
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(el => el.textContent.trim())
      .filter(t => t.length > 0 && t.length < 80)
      .slice(0, 40);
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
      .map(el => ({ type: el.type || el.tagName, placeholder: el.placeholder, label: el.getAttribute('aria-label') }))
      .slice(0, 20);
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(el => ({ text: el.textContent.trim().slice(0, 60), href: el.href }))
      .filter(x => x.text && !x.href.includes('javascript:')).slice(0, 30);
    return { url: location.href, title: document.title, headings: h, buttons: btns, inputs, links };
  }).catch(() => null);
  if (data) {
    fs.writeFileSync(path.join(SN, `${name}-struct.json`), JSON.stringify(data, null, 2));
    ok(`Structured JSON → ${name}-struct.json`);
  }
  return data;
}

/** Navigate, wait for network idle, dismiss overlays. Returns false on failure. */
async function goto(page, url, { timeout = 18000 } = {}) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(2000);
    await dismissOverlays(page);
    return true;
  } catch (e) {
    warn(`goto failed: ${url} — ${e.message.slice(0, 60)}`);
    return false;
  }
}

async function dismissOverlays(page) {
  const sels = [
    '[aria-label="Close"]', '[aria-label="close"]', 'button.close',
    '[data-testid="modal-close"]', '[data-testid="close-button"]',
    'button[class*="close"]', 'button[class*="dismiss"]',
    '#onetrust-reject-all-handler', 'button[id*="reject"]',
  ];
  for (const sel of sels) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 600 })) {
        await el.click({ timeout: 600 });
        await page.waitForTimeout(400);
      }
    } catch { /* expected */ }
  }
}

/** Click element by text — try exact first, then partial. */
async function clickText(page, text, timeout = 5000) {
  try {
    await page.getByText(text, { exact: true }).first().click({ timeout });
    await page.waitForTimeout(700);
    return true;
  } catch {
    try {
      await page.getByText(text).first().click({ timeout: 3000 });
      await page.waitForTimeout(700);
      return true;
    } catch {
      warn(`clickText failed: "${text}"`);
      return false;
    }
  }
}

/** Click by CSS selector. */
async function clickSel(page, sel, label = sel, timeout = 5000) {
  try {
    await page.locator(sel).first().click({ timeout });
    await page.waitForTimeout(700);
    return true;
  } catch {
    warn(`clickSel failed: ${label}`);
    return false;
  }
}

/** Record an index entry. */
function indexEntry(module, state, route, description) {
  INDEX.push({ module, state, route, description, ts: ts() });
}

// ─── Main Research ────────────────────────────────────────────────────────────

async function run() {
  info('Launching Playwright with InVideo session...');
  info(`Session: ${SESSION}`);
  info(`Output : ${OUT}`);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    storageState: SESSION,
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // ── 01: Entry Point & Session Validation ─────────────────────────────────────
  sec('01 — Entry Point / Session Validation');
  await goto(page, 'https://app.invideo.io/');
  const landingUrl = page.url();
  info(`Landed at: ${landingUrl}`);

  if (landingUrl.includes('/login') || landingUrl.includes('/auth') || landingUrl.includes('/signup')) {
    warn('SESSION EXPIRED or INVALID — redirected to login. Re-run save-invideo-session.js first.');
    await ss(page, '01-session-expired', 'Session expired — auth wall');
    await browser.close();
    process.exit(1);
  }

  await ss(page, '01-dashboard-entry', 'Dashboard — entry point');
  await snap(page, '01-dashboard', 'Dashboard — initial view');
  await snapStructured(page, '01-dashboard');
  indexEntry('DASHBOARD', 'Entry point', landingUrl, 'First authenticated view of app.invideo.io');
  ok('Session valid — authenticated research starting');

  // ── 02: Dashboard — Full Exploration ─────────────────────────────────────────
  sec('02 — Dashboard Layout & Navigation');
  await ssFull(page, '02-dashboard-full', 'Dashboard — full page scroll');

  // Capture all sidebar/nav items
  const navItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('nav a, nav button, aside a, aside button, [class*="sidebar"] a, [class*="sidebar"] button, [class*="nav"] a'))
      .map(el => ({ text: el.textContent?.trim(), href: el.href || null, tag: el.tagName }))
      .filter(x => x.text && x.text.length > 0 && x.text.length < 60)
      .slice(0, 40);
  }).catch(() => []);
  fs.writeFileSync(path.join(SN, '02-nav-items.json'), JSON.stringify(navItems, null, 2));
  ok(`Nav map → 02-nav-items.json (${navItems.length} items)`);

  // ── 03: My Projects / Home ─────────────────────────────────────────────────
  sec('03 — My Projects / Home / Recent');
  const homePaths = [
    'https://app.invideo.io/home',
    'https://app.invideo.io/dashboard',
    'https://app.invideo.io/projects',
    'https://app.invideo.io/',
  ];
  let homeFound = false;
  for (const url of homePaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '03-home', `Home — ${url}`);
        await snap(page, '03-home', 'Home/Projects page');
        await snapStructured(page, '03-home');
        indexEntry('HOME', 'My Projects', page.url(), 'Project library / home screen');
        homeFound = true;
        break;
      }
    }
  }
  if (!homeFound) warn('Could not navigate to home/projects — dashboard URL may be root');

  // ── 04: Create Flow Entry ─────────────────────────────────────────────────────
  sec('04 — Create Flow — Entry & Workflow Selection');
  const createPaths = [
    'https://app.invideo.io/create',
    'https://app.invideo.io/new',
    'https://app.invideo.io/generate',
    'https://app.invideo.io/ai',
  ];
  let createFound = false;
  for (const url of createPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '04-create-entry', `Create entry — ${url}`);
        await snap(page, '04-create-entry', 'Create entry / workflow picker');
        await snapStructured(page, '04-create-entry');
        indexEntry('CREATE', 'Workflow selection', page.url(), 'Entry point for new video creation');
        createFound = true;
        break;
      }
    }
  }

  // Also try clicking a "Create" or "+" button from dashboard
  if (!createFound) {
    await goto(page, 'https://app.invideo.io/');
    const createClicked =
      await clickSel(page, 'button[class*="create"]', 'Create button') ||
      await clickText(page, 'Create') ||
      await clickText(page, 'New video') ||
      await clickText(page, '+ New') ||
      await clickSel(page, '[data-testid="create-button"]', 'Create testid') ||
      await clickSel(page, 'a[href*="create"]', 'Create link');
    if (createClicked) {
      await page.waitForTimeout(1500);
      await ss(page, '04-create-entry', 'Create entry — via button click');
      await snap(page, '04-create-entry', 'Create entry via button');
      indexEntry('CREATE', 'Entry via button', page.url(), 'Reached create flow via dashboard button');
    }
  }

  // ── 05: Create Flow — Workflow Types ──────────────────────────────────────────
  sec('05 — Create Flow — Workflow Types & Options');
  // Document what workflow types are available (AI video, template, etc.)
  await ssFull(page, '05-create-workflows-full', 'Create — all workflow options');
  await snapStructured(page, '05-create-workflows');

  // Try each workflow type
  const workflowOptions = [
    { text: 'AI Video', name: 'ai-video' },
    { text: 'Text to Video', name: 'text-to-video' },
    { text: 'Template', name: 'template' },
    { text: 'YouTube', name: 'youtube' },
    { text: 'Short', name: 'short' },
    { text: 'Reel', name: 'reel' },
    { text: 'Film', name: 'film' },
    { text: 'Promo', name: 'promo' },
    { text: 'Ad', name: 'ad' },
  ];
  for (const opt of workflowOptions) {
    try {
      const btn = page.getByText(opt.text).first();
      if (await btn.isVisible({ timeout: 1500 })) {
        await ss(page, `05-workflow-${opt.name}-visible`, `Workflow option visible: ${opt.text}`);
        ok(`Workflow option found: ${opt.text}`);
        indexEntry('CREATE', `Workflow: ${opt.text}`, page.url(), `Workflow option "${opt.text}" exists in create flow`);
      }
    } catch { /* not present */ }
  }

  // ── 06: AI Video Creation — Prompt Step ───────────────────────────────────────
  sec('06 — AI Video Creation — Prompt / Input Step');
  // Try clicking into the AI video creation flow
  const aiFlowPaths = [
    'https://app.invideo.io/ai-video',
    'https://app.invideo.io/create/ai',
    'https://app.invideo.io/create/text-to-video',
  ];
  let aiFlowPage = page;
  let aiFlowFound = false;

  for (const url of aiFlowPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        aiFlowFound = true;
        break;
      }
    }
  }

  // If direct URL didn't work, try from dashboard
  if (!aiFlowFound) {
    await goto(page, 'https://app.invideo.io/');
    // Try "AI Video" option
    aiFlowFound =
      await clickText(page, 'AI Video') ||
      await clickText(page, 'Text to Video') ||
      await clickText(page, 'Create AI Video') ||
      await clickSel(page, '[data-type="ai-video"]', 'AI video type');
    if (aiFlowFound) await page.waitForTimeout(1500);
  }

  if (aiFlowFound || true) { // Always screenshot current state
    await ss(page, '06-ai-prompt-entry', 'AI Video — prompt input step');
    await ssFull(page, '06-ai-prompt-full', 'AI Video — prompt full');
    await snap(page, '06-ai-prompt', 'AI Video — prompt step text');
    await snapStructured(page, '06-ai-prompt');
    indexEntry('CREATE', 'AI prompt input', page.url(), 'AI video creation prompt/input step');

    // Inspect the prompt form
    const promptForm = await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      const inputs   = Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type, placeholder: i.placeholder, name: i.name
      }));
      const selects  = Array.from(document.querySelectorAll('select')).map(s => ({
        name: s.name, options: Array.from(s.options).map(o => o.text).slice(0, 10)
      }));
      const dropdowns = Array.from(document.querySelectorAll('[class*="dropdown"], [class*="select"], [class*="picker"]'))
        .map(el => el.textContent?.trim()).filter(t => t && t.length < 100).slice(0, 10);
      return { hasTextarea: !!textarea, textareaPlaceholder: textarea?.placeholder, inputs, selects, dropdowns };
    }).catch(() => ({}));
    fs.writeFileSync(path.join(SN, '06-prompt-form.json'), JSON.stringify(promptForm, null, 2));
    ok('Prompt form structure → 06-prompt-form.json');
  }

  // ── 07: Workflow Options — Platform / Format Selectors ────────────────────────
  sec('07 — Platform & Format Options in Create Flow');
  // Look for platform/format dropdowns/tabs
  const platformSelectors = [
    '[class*="platform"]', '[class*="format"]', '[class*="aspect"]',
    '[data-testid*="platform"]', '[aria-label*="platform"]',
  ];
  for (const sel of platformSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await ss(page, `07-platform-${sel.replace(/[^a-z]/gi, '-')}`, `Platform selector: ${sel}`);
        ok(`Platform selector found: ${sel}`);
      }
    } catch { /* not visible */ }
  }

  // Screenshot any dropdowns
  await ss(page, '07-create-options', 'Create — platform/format options area');

  // ── 08: Templates Browser ─────────────────────────────────────────────────────
  sec('08 — Templates Browser');
  const templatePaths = [
    'https://app.invideo.io/templates',
    'https://app.invideo.io/template',
    'https://app.invideo.io/browse',
  ];
  for (const url of templatePaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '08-templates-hero', 'Templates — hero');
        await ssFull(page, '08-templates-full', 'Templates — full page');
        await snap(page, '08-templates', 'Templates — text');
        await snapStructured(page, '08-templates');
        indexEntry('TEMPLATES', 'Template browser', page.url(), 'Template library inside app');

        // Template filters / categories
        const categories = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('[class*="category"], [class*="filter"], [class*="tag"], [class*="tab"]'))
            .map(el => el.textContent?.trim()).filter(t => t && t.length < 50).slice(0, 20);
        }).catch(() => []);
        fs.writeFileSync(path.join(SN, '08-template-categories.json'), JSON.stringify(categories, null, 2));
        ok(`Template categories → 08-template-categories.json (${categories.length} found)`);
        break;
      }
    }
  }

  // ── 09: AI Editor / Studio ────────────────────────────────────────────────────
  sec('09 — AI Editor / Studio (if project exists)');
  // Try to open an existing project (without creating new expensive content)
  const editorPaths = [
    'https://app.invideo.io/studio',
    'https://app.invideo.io/editor',
    'https://app.invideo.io/workspace',
  ];
  for (const url of editorPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '09-editor', `Editor — ${url}`);
        await snap(page, '09-editor', 'Editor/Studio');
        await snapStructured(page, '09-editor');
        indexEntry('EDITOR', 'Editor/Studio', page.url(), 'Video editor workspace');
        break;
      }
    }
  }

  // Try clicking any existing project card from home
  await goto(page, 'https://app.invideo.io/');
  try {
    const projectCard = page.locator('[class*="project"], [class*="video-card"], [class*="card"]').first();
    if (await projectCard.isVisible({ timeout: 3000 })) {
      await ss(page, '09-project-card', 'Project card — before click');
      await projectCard.click({ timeout: 3000 });
      await page.waitForTimeout(2000);
      await ss(page, '09-editor-from-project', 'Editor — opened from project card');
      await snap(page, '09-editor-from-project', 'Editor — opened from existing project');
      await snapStructured(page, '09-editor-from-project');
      indexEntry('EDITOR', 'Opened from project card', page.url(), 'Editor state from clicking project in dashboard');
    }
  } catch { warn('No project cards found or click failed'); }

  // ── 10: Timeline / Edit Interface ─────────────────────────────────────────────
  sec('10 — Timeline & Edit Controls');
  // If we're in an editor, scroll to reveal timeline
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => null);
  await page.waitForTimeout(800);
  await ss(page, '10-timeline-area', 'Timeline area / bottom of editor');

  // Look for timeline-specific elements
  const timelineEls = await page.evaluate(() => {
    const tl = document.querySelector('[class*="timeline"], [class*="Timeline"], [data-testid*="timeline"]');
    return tl ? { found: true, classes: tl.className, html: tl.innerHTML.slice(0, 500) } : { found: false };
  }).catch(() => ({ found: false }));
  fs.writeFileSync(path.join(SN, '10-timeline-probe.json'), JSON.stringify(timelineEls, null, 2));
  ok('Timeline probe → 10-timeline-probe.json');

  // ── 11: AI Tools Panel ────────────────────────────────────────────────────────
  sec('11 — AI Tools Panel & Features');
  const aiToolSelectors = [
    'button[class*="ai"]', '[data-testid*="ai"]', 'button[class*="magic"]',
    '[aria-label*="AI"]', '[class*="ai-tool"]',
  ];
  for (const sel of aiToolSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await el.click({ timeout: 1000 });
        await page.waitForTimeout(800);
        await ss(page, `11-ai-tool-${sel.replace(/[^a-z0-9]/gi, '-').slice(0, 20)}`, `AI tool: ${sel}`);
        ok(`AI tool clicked: ${sel}`);
        // Dismiss anything that opened
        await dismissOverlays(page);
      }
    } catch { /* not found */ }
  }

  // Click any visible AI-related buttons (magic box, regenerate, etc.)
  const aiButtonTexts = ['Magic Box', 'Regenerate', 'AI Edit', 'Auto-enhance', 'AI Voice', 'Add AI'];
  for (const text of aiButtonTexts) {
    try {
      const btn = page.getByText(text).first();
      if (await btn.isVisible({ timeout: 800 })) {
        ok(`AI button visible: "${text}"`);
        indexEntry('AI_TOOLS', `Button: ${text}`, page.url(), `AI tool button "${text}" found in UI`);
        await ss(page, `11-ai-btn-${text.replace(/ /g,'-').toLowerCase()}`, `AI button: ${text}`);
      }
    } catch { /* not present */ }
  }

  // ── 12: Voice / Audio Features ────────────────────────────────────────────────
  sec('12 — Voice & Audio');
  const voicePaths = [
    'https://app.invideo.io/voices',
    'https://app.invideo.io/voice',
    'https://app.invideo.io/audio',
  ];
  for (const url of voicePaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '12-voices', 'Voice library');
        await snap(page, '12-voices', 'Voice library — text');
        indexEntry('VOICE', 'Voice library', page.url(), 'Voice/audio selection interface');
        break;
      }
    }
  }

  // ── 13: Assets / Media Library ────────────────────────────────────────────────
  sec('13 — Assets & Media Library');
  const assetPaths = [
    'https://app.invideo.io/assets',
    'https://app.invideo.io/media',
    'https://app.invideo.io/library',
    'https://app.invideo.io/stock',
  ];
  for (const url of assetPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '13-assets', 'Assets/Media library');
        await ssFull(page, '13-assets-full', 'Assets full');
        await snap(page, '13-assets', 'Assets — text');
        await snapStructured(page, '13-assets');
        indexEntry('ASSETS', 'Media library', page.url(), 'Stock/asset media browser');
        break;
      }
    }
  }

  // ── 14: Export / Download Flow ────────────────────────────────────────────────
  sec('14 — Export & Download Options');
  // Look for export from any open editor state
  const exportTexts = ['Export', 'Download', 'Publish', 'Share', 'Export video'];
  for (const text of exportTexts) {
    try {
      const btn = page.getByText(text).first();
      if (await btn.isVisible({ timeout: 800 })) {
        await ss(page, `14-export-btn-${text.toLowerCase().replace(/ /g,'-')}`, `Export button: ${text}`);
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(1500);
        await ss(page, `14-export-modal-${text.toLowerCase().replace(/ /g,'-')}`, `Export modal: ${text}`);
        await snap(page, `14-export-modal`, 'Export modal — options');
        await snapStructured(page, '14-export-modal');
        indexEntry('EXPORT', `Modal via "${text}"`, page.url(), 'Export/download options modal');
        await dismissOverlays(page);
        break;
      }
    } catch { /* not visible */ }
  }

  // ── 15: Publish / Distribution ────────────────────────────────────────────────
  sec('15 — Publish & Distribution');
  const publishPaths = [
    'https://app.invideo.io/publish',
    'https://app.invideo.io/distribute',
    'https://app.invideo.io/social',
  ];
  for (const url of publishPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '15-publish', 'Publish/distribution page');
        await snap(page, '15-publish', 'Publish — text');
        indexEntry('PUBLISH', 'Distribution', page.url(), 'Publish/social distribution options');
        break;
      }
    }
  }

  // ── 16: Credits, Limits & Usage ───────────────────────────────────────────────
  sec('16 — Credits & Usage Dashboard');
  const creditPaths = [
    'https://app.invideo.io/credits',
    'https://app.invideo.io/usage',
    'https://app.invideo.io/billing',
    'https://app.invideo.io/account/billing',
    'https://app.invideo.io/subscription',
  ];
  for (const url of creditPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '16-credits', 'Credits/billing page');
        await ssFull(page, '16-credits-full', 'Credits full');
        await snap(page, '16-credits', 'Credits/usage — text');
        await snapStructured(page, '16-credits');
        indexEntry('CREDITS', 'Credits & usage', page.url(), 'Credit balance, usage, and limits screen');
        break;
      }
    }
  }

  // Also check for credit display in any nav/header
  await goto(page, 'https://app.invideo.io/');
  const creditInHeader = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const creditEl = all.find(el => {
      const t = el.textContent?.trim().toLowerCase() || '';
      return (t.includes('credit') || t.includes('minute')) && t.length < 60 && el.children.length === 0;
    });
    return creditEl ? { text: creditEl.textContent?.trim(), class: creditEl.className } : null;
  }).catch(() => null);
  if (creditInHeader) {
    ok(`Credit display found in UI: "${creditInHeader.text}"`);
    fs.writeFileSync(path.join(SN, '16-credit-display.json'), JSON.stringify(creditInHeader, null, 2));
    indexEntry('CREDITS', 'Credit display in header', 'app root', `Credit indicator: "${creditInHeader.text}"`);
  } else {
    warn('No credit display found in header/nav');
  }

  // ── 17: Settings & Account ────────────────────────────────────────────────────
  sec('17 — Settings & Account');
  const settingsPaths = [
    'https://app.invideo.io/settings',
    'https://app.invideo.io/account',
    'https://app.invideo.io/profile',
    'https://app.invideo.io/settings/account',
    'https://app.invideo.io/settings/profile',
  ];
  for (const url of settingsPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '17-settings', 'Settings page');
        await ssFull(page, '17-settings-full', 'Settings — full');
        await snap(page, '17-settings', 'Settings — text');
        await snapStructured(page, '17-settings');
        indexEntry('SETTINGS', 'Account settings', page.url(), 'User account/settings screen');
        break;
      }
    }
  }

  // ── 18: Onboarding / New User Flow ────────────────────────────────────────────
  sec('18 — Onboarding / Tutorial Detection');
  const onboardPaths = [
    'https://app.invideo.io/onboarding',
    'https://app.invideo.io/welcome',
    'https://app.invideo.io/get-started',
    'https://app.invideo.io/tutorial',
  ];
  for (const url of onboardPaths) {
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, '18-onboarding', `Onboarding — ${url}`);
        await snap(page, '18-onboarding', 'Onboarding — text');
        indexEntry('ONBOARDING', 'Onboarding flow', page.url(), 'User onboarding/tutorial screen');
        break;
      }
    }
  }

  // ── 19: Free vs Paid — Feature Gate Probing ──────────────────────────────────
  sec('19 — Feature Gate / Lock Detection');
  await goto(page, 'https://app.invideo.io/');
  // Look for paywall/lock indicators
  const locks = await page.evaluate(() => {
    const lockSelectors = [
      '[class*="lock"]', '[class*="premium"]', '[class*="upgrade"]', '[class*="pro"]',
      '[class*="paywall"]', '[class*="locked"]', '[aria-label*="Premium"]',
      '[aria-label*="Upgrade"]', 'button[disabled]',
    ];
    const results = [];
    for (const sel of lockSelectors) {
      const els = Array.from(document.querySelectorAll(sel)).slice(0, 5);
      els.forEach(el => {
        results.push({
          sel,
          text: el.textContent?.trim()?.slice(0, 80),
          tag: el.tagName,
          classes: el.className?.slice(0, 100),
        });
      });
    }
    return results.slice(0, 30);
  }).catch(() => []);
  fs.writeFileSync(path.join(SN, '19-feature-gates.json'), JSON.stringify(locks, null, 2));
  ok(`Feature gate probe → 19-feature-gates.json (${locks.length} potential locks)`);
  await ss(page, '19-feature-gates', 'Feature gates visible on current page');

  // ── 20: Deep Dive — App Routes Discovery ──────────────────────────────────────
  sec('20 — Route / URL Discovery');
  // Collect all internal links from the app
  const appLinks = await page.evaluate(() => {
    return [...new Set(
      Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(h => h.includes('app.invideo.io') && !h.includes('#') && !h.includes('mailto:'))
    )].slice(0, 50);
  }).catch(() => []);
  fs.writeFileSync(path.join(SN, '20-app-routes.json'), JSON.stringify(appLinks, null, 2));
  ok(`App routes → 20-app-routes.json (${appLinks.length} unique routes found)`);

  // Probe each discovered route (first 10 only — be conservative)
  const probeRoutes = appLinks.slice(0, 10);
  for (let i = 0; i < probeRoutes.length; i++) {
    const url = probeRoutes[i];
    const slug = url.replace('https://app.invideo.io/', '').replace(/\//g, '-').slice(0, 30) || 'root';
    if (await goto(page, url)) {
      if (!page.url().includes('/login')) {
        await ss(page, `20-route-${String(i).padStart(2,'0')}-${slug}`, `Route: ${url}`);
        indexEntry('ROUTE_DISCOVERY', slug, url, `Discovered route: ${url}`);
      }
    }
  }

  // ── 21: Modals & Overlays ────────────────────────────────────────────────────
  sec('21 — Modal & Dropdown States');
  await goto(page, 'https://app.invideo.io/');

  // Try to open any visible modals by clicking action buttons
  const modalTriggers = [
    { text: 'Import', name: 'import' },
    { text: 'Upload', name: 'upload' },
    { text: 'Brand kit', name: 'brand-kit' },
    { text: 'Team', name: 'team' },
    { text: 'Help', name: 'help' },
    { text: 'Feedback', name: 'feedback' },
  ];
  for (const trigger of modalTriggers) {
    try {
      const btn = page.getByText(trigger.text).first();
      if (await btn.isVisible({ timeout: 800 })) {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        await ss(page, `21-modal-${trigger.name}`, `Modal: ${trigger.text}`);
        await snap(page, `21-modal-${trigger.name}`, `Modal — ${trigger.text}`);
        indexEntry('MODALS', `${trigger.text} modal`, page.url(), `Modal state for "${trigger.text}"`);
        await dismissOverlays(page);
        await page.waitForTimeout(500);
      }
    } catch { /* not visible */ }
  }

  // ── 22: Account Menu / User Profile ──────────────────────────────────────────
  sec('22 — Account Menu & User Profile');
  await goto(page, 'https://app.invideo.io/');
  // Click avatar/profile menu (usually top-right)
  const profileTriggers = [
    '[class*="avatar"]', '[class*="profile"]', '[aria-label*="account"]',
    '[aria-label*="profile"]', '[data-testid*="avatar"]', 'img[alt*="avatar"]',
  ];
  for (const sel of profileTriggers) {
    if (await clickSel(page, sel, `Profile trigger: ${sel}`, 2000)) {
      await page.waitForTimeout(800);
      await ss(page, '22-account-menu', 'Account/profile dropdown');
      await snap(page, '22-account-menu', 'Account menu — text');
      indexEntry('ACCOUNT', 'Profile menu', page.url(), 'User profile/account dropdown menu');
      await dismissOverlays(page);
      break;
    }
  }

  // ── 23: Final Overview ────────────────────────────────────────────────────────
  sec('23 — Final State Overview');
  await goto(page, 'https://app.invideo.io/');
  await ssFull(page, '23-final-dashboard', 'Final dashboard overview');
  await snap(page, '23-final-dashboard', 'Final dashboard — complete text');

  // ─── Cleanup & Write Logs ─────────────────────────────────────────────────────
  await browser.close();
  info('Browser closed. Writing logs...');

  // AUTHENTICATED_CRAWL_LOG.md
  const crawlLog = `# InVideo AI — Authenticated Crawl Log
Date: ${new Date().toISOString()}
OK: ${OK_N}  |  WARN: ${WN}

## Session Used
${SESSION}

## Output
${OUT}

## Log
\`\`\`
${LOG.join('\n')}
\`\`\`
`;
  fs.writeFileSync(path.join(OUT, 'AUTHENTICATED_CRAWL_LOG.md'), crawlLog);
  ok('AUTHENTICATED_CRAWL_LOG.md written');

  // AUTHENTICATED_MASTER_INDEX.md
  const masterIndex = `# InVideo AI — Authenticated Research Master Index
Date: ${new Date().toISOString()}
Total states indexed: ${INDEX.length}

## State Index

| # | Module | State | Route | Description |
|---|--------|-------|-------|-------------|
${INDEX.map((e, i) => `| ${i+1} | ${e.module} | ${e.state} | ${e.route} | ${e.description} |`).join('\n')}

## Screenshot Reference

${fs.readdirSync(SS).map(f => `- \`authenticated/screenshots/${f}\``).join('\n')}

## Snapshot Reference

${fs.readdirSync(SN).map(f => `- \`authenticated/snapshots/${f}\``).join('\n')}
`;
  fs.writeFileSync(path.join(OUT, 'AUTHENTICATED_MASTER_INDEX.md'), masterIndex);
  ok('AUTHENTICATED_MASTER_INDEX.md written');

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  InVideo AI — Authenticated Research Complete');
  console.log('═'.repeat(60));
  console.log(`  OK    : ${OK_N}`);
  console.log(`  WARN  : ${WN}`);
  console.log(`  States: ${INDEX.length}`);
  console.log(`  Output: ${OUT}`);
  console.log('\nNext step: say "InVideo auth crawl is done. Analyze and write REPORT.md"\n');
}

run().catch((err) => {
  console.error('\n\x1b[31m[FATAL]', err.message, '\x1b[0m');
  console.error(err.stack);
  process.exit(1);
});
