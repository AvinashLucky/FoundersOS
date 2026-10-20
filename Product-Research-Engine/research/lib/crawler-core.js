/**
 * crawler-core.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared Playwright research toolkit.
 * Used by ALL competitor crawlers — never competitor-specific.
 *
 * Exports:
 *   createLogger(logLines)         → { ok, warn, info, sec }
 *   createCapture(ss_dir, sn_dir)  → { ss, ssFull, snap, snapJSON, snapStructured }
 *   createIndex()                  → { add, toMarkdown }
 *   goto(page, url, opts)
 *   dismissOverlays(page)
 *   clickText(page, text, timeout)
 *   clickSel(page, sel, label, timeout)
 *   probeVisible(page, texts)      → array of found texts
 *   discoverRoutes(page, host)     → array of URLs
 *   launchBrowser(sessionPath, viewport)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// ─── Logging ─────────────────────────────────────────────────────────────────

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

export function createLogger(logLines = []) {
  const ok   = (m) => { const l = `[OK]   ${ts()} — ${m}`; console.log('\x1b[32m'+l+'\x1b[0m'); logLines.push(l); };
  const warn = (m) => { const l = `[WARN] ${ts()} — ${m}`; console.log('\x1b[33m'+l+'\x1b[0m'); logLines.push(l); };
  const info = (m) => { const l = `[INFO] ${ts()} — ${m}`; console.log('\x1b[36m'+l+'\x1b[0m'); logLines.push(l); };
  const sec  = (t) => { const l = `\n${'─'.repeat(60)}\n## ${t}\n${'─'.repeat(60)}`; console.log('\x1b[35m'+l+'\x1b[0m'); logLines.push(l); };
  return { ok, warn, info, sec };
}

// ─── Screenshot & Snapshot ────────────────────────────────────────────────────

export function createCapture(ssDir, snDir, log) {
  fs.mkdirSync(ssDir, { recursive: true });
  fs.mkdirSync(snDir, { recursive: true });

  const { ok, warn } = log;

  async function ss(page, name, label) {
    await page.screenshot({ path: path.join(ssDir, `${name}.png`), fullPage: false }).catch(() => null);
    ok(`Screenshot → ${name}.png | ${label}`);
  }

  async function ssFull(page, name, label) {
    await page.screenshot({ path: path.join(ssDir, `${name}.png`), fullPage: true }).catch(() => null);
    ok(`Full screenshot → ${name}.png | ${label}`);
  }

  async function snap(page, name, label) {
    try {
      const text = await page.evaluate(() => {
        const skip = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','IFRAME']);
        const w = document.createTreeWalker(
          document.body || document.documentElement,
          NodeFilter.SHOW_TEXT,
          { acceptNode: n => {
              if (!n.textContent?.trim()) return NodeFilter.FILTER_REJECT;
              if (skip.has(n.parentElement?.tagName)) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );
        const lines = [];
        while (w.nextNode()) { const t = w.currentNode.textContent.trim(); if (t.length > 1) lines.push(t); }
        return [...new Set(lines)].join('\n');
      });
      fs.writeFileSync(path.join(snDir, `${name}.txt`), `# ${label}\nURL: ${page.url()}\n\n${text}`);
      ok(`Snapshot → ${name}.txt`);
    } catch (e) { warn(`Snapshot failed ${name}: ${e.message.slice(0,60)}`); }
  }

  async function snapJSON(name, data) {
    fs.writeFileSync(path.join(snDir, `${name}.json`), JSON.stringify(data, null, 2));
    ok(`JSON → ${name}.json`);
  }

  async function snapStructured(page, name) {
    const data = await page.evaluate(() => {
      const h   = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(el=>({tag:el.tagName,text:el.textContent.trim()})).filter(x=>x.text).slice(0,50);
      const btn = Array.from(document.querySelectorAll('button,[role="button"]')).map(el=>el.textContent.trim()).filter(t=>t&&t.length<80).slice(0,40);
      const inp = Array.from(document.querySelectorAll('input,textarea,select')).map(el=>({type:el.type||el.tagName,placeholder:el.placeholder,label:el.getAttribute('aria-label')})).slice(0,20);
      const lnk = Array.from(document.querySelectorAll('a[href]')).map(el=>({text:el.textContent.trim().slice(0,60),href:el.href})).filter(x=>x.text&&!x.href.includes('javascript:')).slice(0,30);
      return { url: location.href, title: document.title, headings: h, buttons: btn, inputs: inp, links: lnk };
    }).catch(() => null);
    if (data) { fs.writeFileSync(path.join(snDir, `${name}-struct.json`), JSON.stringify(data, null, 2)); ok(`Structured → ${name}-struct.json`); }
    return data;
  }

  return { ss, ssFull, snap, snapJSON, snapStructured };
}

// ─── State Index ──────────────────────────────────────────────────────────────

export function createIndex() {
  const entries = [];
  const add = (module, state, route, description) => entries.push({ module, state, route, description });
  const toMarkdown = () =>
    `| # | Module | State | Route | Description |\n|---|--------|-------|-------|-------------|\n` +
    entries.map((e,i) => `| ${i+1} | ${e.module} | ${e.state} | ${e.route} | ${e.description} |`).join('\n');
  const all = () => entries;
  return { add, toMarkdown, all };
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export async function goto(page, url, { timeout = 18000, wait = 2000 } = {}) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    if (wait) await page.waitForTimeout(wait);
    return true;
  } catch (e) {
    // warn handled by caller
    return false;
  }
}

export async function dismissOverlays(page) {
  const sels = [
    '[aria-label="Close"]','[aria-label="close"]','button.close',
    '[data-testid="modal-close"]','[data-testid="close-button"]',
    'button[class*="close"]','button[class*="dismiss"]',
    '#onetrust-reject-all-handler','button[id*="reject"]',
    '[class*="cookie"] button','[id*="cookie"] button',
  ];
  for (const sel of sels) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 500 })) { await el.click({ timeout: 500 }); await page.waitForTimeout(300); }
    } catch { /* expected */ }
  }
}

export async function clickText(page, text, timeout = 5000) {
  try { await page.getByText(text, { exact: true }).first().click({ timeout }); await page.waitForTimeout(700); return true; }
  catch {
    try { await page.getByText(text).first().click({ timeout: 3000 }); await page.waitForTimeout(700); return true; }
    catch { return false; }
  }
}

export async function clickSel(page, sel, timeout = 5000) {
  try { await page.locator(sel).first().click({ timeout }); await page.waitForTimeout(700); return true; }
  catch { return false; }
}

// ─── Probing Utilities ────────────────────────────────────────────────────────

/** Check which text labels from a list are currently visible on the page. */
export async function probeVisible(page, texts = [], timeout = 800) {
  const found = [];
  for (const text of texts) {
    try {
      if (await page.getByText(text).first().isVisible({ timeout })) found.push(text);
    } catch { /* not found */ }
  }
  return found;
}

/** Collect all internal links matching host. */
export async function discoverRoutes(page, host) {
  return page.evaluate((host) => {
    return [...new Set(
      Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(h => h.includes(host) && !h.includes('#') && !h.includes('mailto:'))
    )].slice(0, 60);
  }, host).catch(() => []);
}

/** Probe for feature-gate/lock indicators. */
export async function probeLocks(page) {
  return page.evaluate(() => {
    const sels = ['[class*="lock"]','[class*="premium"]','[class*="upgrade"]','[class*="paywall"]','[class*="locked"]','[aria-label*="Premium"]','[aria-label*="Upgrade"]'];
    const out = [];
    for (const sel of sels) {
      Array.from(document.querySelectorAll(sel)).slice(0,5).forEach(el => {
        out.push({ sel, text: el.textContent?.trim()?.slice(0,80), tag: el.tagName });
      });
    }
    return out.slice(0, 30);
  }).catch(() => []);
}

// ─── Browser Launch ───────────────────────────────────────────────────────────

export async function launchBrowser({ sessionPath, viewport = { width: 1440, height: 900 }, slowMo = 100 } = {}) {
  // CRAWL_HEADLESS=1 runs without a window (CI, servers, sandboxes). Default stays
  // headed so you can watch a crawl and step in on a login screen.
  const headless = process.env.CRAWL_HEADLESS === '1';
  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : slowMo, args: headless ? [] : ['--start-maximized'] });
  const ctxOpts = { viewport, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' };
  if (sessionPath && fs.existsSync(sessionPath)) ctxOpts.storageState = sessionPath;
  const context = await browser.newContext(ctxOpts);
  const page    = await context.newPage();
  return { browser, context, page };
}

// ─── Report Writing ───────────────────────────────────────────────────────────

export function writeLogs(outDir, { competitorName, logLines, indexMd, ssDir, snDir, label = 'CRAWL' }) {
  const logFile = path.join(outDir, `${label}_LOG.md`);
  const idxFile = path.join(outDir, `${label}_MASTER_INDEX.md`);

  const ssList = fs.existsSync(ssDir) ? fs.readdirSync(ssDir).map(f => `- \`${path.relative(outDir, path.join(ssDir, f))}\`` ) : [];
  const snList = fs.existsSync(snDir) ? fs.readdirSync(snDir).map(f => `- \`${path.relative(outDir, path.join(snDir, f))}\`` ) : [];

  fs.writeFileSync(logFile,
    `# ${competitorName} — ${label} Log\nDate: ${new Date().toISOString()}\n\n## Log\n\`\`\`\n${logLines.join('\n')}\n\`\`\`\n`
  );

  fs.writeFileSync(idxFile,
    `# ${competitorName} — ${label} Master Index\nDate: ${new Date().toISOString()}\n\n## States\n\n${indexMd}\n\n## Screenshots\n${ssList.join('\n')}\n\n## Snapshots\n${snList.join('\n')}\n`
  );

  console.log(`\n✅ ${label} complete → ${outDir}`);
}
