/**
 * competitor-invideo.js — SUPERSEDED
 * Use instead: node research/explorers/crawl.js invideo --public
 * ─────────────────────────────────────────────────────────────────────────────
 * Crocodile Research — InVideo AI  (🐊 #1 Priority)
 *
 * SCOPE  : Public pages only. No authentication, no payment bypass.
 * OUTPUT : research/competitors/invideo/screenshots/
 *          research/competitors/invideo/snapshots/
 *          research/competitors/invideo/CRAWL_LOG.md
 *
 * Architecture: Playwright = HANDS, Claude = BRAIN, Files = MEMORY
 * ─────────────────────────────────────────────────────────────────────────────
 * Run: node research/explorers/competitor-invideo.js
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');
const OUT  = path.join(ROOT, 'research/competitors/invideo');
const SS   = path.join(OUT, 'screenshots');
const SN   = path.join(OUT, 'snapshots');

// ─── Setup ────────────────────────────────────────────────────────────────────
fs.mkdirSync(SS,  { recursive: true });
fs.mkdirSync(SN,  { recursive: true });

const LOG_LINES = [];
const CAPTURES  = [];
let   WARN_COUNT = 0;
let   OK_COUNT   = 0;

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
function ok(msg) {
  const line = `[OK]   ${ts()} — ${msg}`;
  console.log('\x1b[32m' + line + '\x1b[0m');
  LOG_LINES.push(line);
  OK_COUNT++;
}
function warn(msg) {
  const line = `[WARN] ${ts()} — ${msg}`;
  console.log('\x1b[33m' + line + '\x1b[0m');
  LOG_LINES.push(line);
  WARN_COUNT++;
}
function info(msg) {
  const line = `[INFO] ${ts()} — ${msg}`;
  console.log('\x1b[36m' + line + '\x1b[0m');
  LOG_LINES.push(line);
}
function section(title) {
  const line = `\n${'─'.repeat(60)}\n## ${title}\n${'─'.repeat(60)}`;
  console.log('\x1b[35m' + line + '\x1b[0m');
  LOG_LINES.push(line);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function screenshot(page, name, label) {
  const file = path.join(SS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false }).catch(() => null);
  CAPTURES.push({ name, label, file });
  ok(`Screenshot → ${name}.png (${label})`);
}

async function screenshotFull(page, name, label) {
  const file = path.join(SS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => null);
  CAPTURES.push({ name, label, file });
  ok(`Full screenshot → ${name}.png (${label})`);
}

async function saveSnapshot(page, name, label) {
  const file = path.join(SN, `${name}.txt`);
  try {
    const text = await page.evaluate(() => {
      // Strip nav/footer boilerplate, return meaningful text
      const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG']);
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => {
            if (!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
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
    ok(`Snapshot → ${name}.txt (${label})`);
  } catch (e) {
    warn(`Snapshot failed for ${name}: ${e.message}`);
  }
}

/** Dismiss cookie/GDPR banners + popups without accepting non-essential. */
async function dismissOverlays(page) {
  const selectors = [
    // Cookie decline
    '[id*="cookie"] button[class*="decline"]',
    '[id*="cookie"] button[class*="reject"]',
    'button[aria-label*="Reject"]',
    'button[aria-label*="Decline"]',
    // Generic close
    '[aria-label="Close"]',
    '[aria-label="close"]',
    'button.close',
    '.modal-close',
    // Common "Accept all" alternatives — we look for reject first
    '#onetrust-reject-all-handler',
  ];
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.click({ timeout: 800 });
        info(`Dismissed overlay via: ${sel}`);
        await page.waitForTimeout(500);
      }
    } catch { /* expected */ }
  }
}

/** Safe click by text content. */
async function clickText(page, text, { timeout = 5000 } = {}) {
  try {
    await page.getByText(text, { exact: true }).first().click({ timeout });
    await page.waitForTimeout(800);
    return true;
  } catch {
    // Try partial match
    try {
      await page.getByText(text).first().click({ timeout: 3000 });
      await page.waitForTimeout(800);
      return true;
    } catch {
      warn(`clickText failed: "${text}"`);
      return false;
    }
  }
}

/** Navigate with retry, return false on hard failure. */
async function goto(page, url, { waitUntil = 'domcontentloaded', timeout = 15000 } = {}) {
  try {
    await page.goto(url, { waitUntil, timeout });
    await page.waitForTimeout(1500);
    return true;
  } catch (e) {
    warn(`goto failed: ${url} — ${e.message.slice(0, 80)}`);
    return false;
  }
}

/** Extract structured page data as JSON snapshot. */
async function extractPageData(page, name) {
  const data = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => ({ tag: h.tagName, text: h.textContent.trim() }))
      .filter(h => h.text.length > 0)
      .slice(0, 50);
    const ctas = Array.from(document.querySelectorAll('button, a[href*="signup"], a[href*="sign-up"], a[href*="register"], a[href*="get-started"], a[href*="try"]'))
      .map(el => ({
        tag: el.tagName,
        text: el.textContent.trim(),
        href: el.href || null
      }))
      .filter(el => el.text.length > 0 && el.text.length < 60)
      .slice(0, 20);
    const pricing = Array.from(document.querySelectorAll('[class*="price"], [class*="plan"], [class*="tier"]'))
      .map(el => el.textContent.trim())
      .filter(t => t.length > 0 && t.length < 200)
      .slice(0, 10);
    const features = Array.from(document.querySelectorAll('[class*="feature"], li'))
      .map(el => el.textContent.trim())
      .filter(t => t.length > 5 && t.length < 150)
      .slice(0, 30);
    return { headings, ctas, pricing, features, title: document.title, url: location.href };
  }).catch(() => null);

  if (data) {
    fs.writeFileSync(
      path.join(SN, `${name}-structured.json`),
      JSON.stringify(data, null, 2)
    );
    ok(`Structured data → ${name}-structured.json`);
  }
  return data;
}

// ─── Research Checklist ───────────────────────────────────────────────────────
// Derived from: Avion Crocodile Research Framework
// For each InVideo page: capture positioning, CTA, workflow, limitations.

async function runResearch() {
  info('Launching Chromium — InVideo AI Competitor Research');
  info(`Output: ${OUT}`);

  const browser = await chromium.launch({
    headless: false,          // visible so you can see what's happening
    slowMo: 120,              // human-readable speed
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    locale: 'en-US',
  });

  const page = await context.newPage();

  // ── 01: Homepage ────────────────────────────────────────────────────────────
  section('01 — Homepage (invideo.io)');
  await goto(page, 'https://invideo.io/');
  await dismissOverlays(page);
  await screenshot(page, '01-homepage-above-fold', 'Homepage — above fold');
  await extractPageData(page, '01-homepage');
  await saveSnapshot(page, '01-homepage', 'Homepage — full text');

  // Scroll to reveal more sections
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(800);
  await screenshot(page, '01-homepage-features', 'Homepage — features section');

  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(800);
  await screenshot(page, '01-homepage-social-proof', 'Homepage — social proof / use cases');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  await screenshot(page, '01-homepage-footer', 'Homepage — footer / nav links');
  await screenshotFull(page, '01-homepage-full', 'Homepage — full page');

  // ── 02: AI Video Generator Landing ──────────────────────────────────────────
  section('02 — AI Video Generator (main product page)');
  const aiPages = [
    'https://invideo.io/ai-video-generator/',
    'https://invideo.io/make/ai-video/',
    'https://invideo.io/ai/',
  ];
  let aiLanded = false;
  for (const url of aiPages) {
    if (await goto(page, url)) {
      await dismissOverlays(page);
      await screenshot(page, '02-ai-video-hero', 'AI Video Generator — hero');
      await extractPageData(page, '02-ai-video');
      await saveSnapshot(page, '02-ai-video', 'AI Video Generator — text');
      await screenshotFull(page, '02-ai-video-full', 'AI Video Generator — full page');
      aiLanded = true;
      break;
    }
  }
  if (!aiLanded) warn('AI video page not found at any known URL');

  // ── 03: Features Page ────────────────────────────────────────────────────────
  section('03 — Features');
  const featurePages = [
    'https://invideo.io/features/',
    'https://invideo.io/product/',
  ];
  for (const url of featurePages) {
    if (await goto(page, url)) {
      await dismissOverlays(page);
      await screenshot(page, '03-features-hero', 'Features — hero');
      await screenshotFull(page, '03-features-full', 'Features — full page');
      await extractPageData(page, '03-features');
      await saveSnapshot(page, '03-features', 'Features — text');
      break;
    }
  }

  // ── 04: Pricing ──────────────────────────────────────────────────────────────
  section('04 — Pricing');
  if (await goto(page, 'https://invideo.io/pricing/')) {
    await dismissOverlays(page);
    await screenshot(page, '04-pricing-hero', 'Pricing — above fold');
    await screenshotFull(page, '04-pricing-full', 'Pricing — full page');
    await extractPageData(page, '04-pricing');
    await saveSnapshot(page, '04-pricing', 'Pricing — full text');

    // Try monthly/annual toggle
    const toggleClicked = await clickText(page, 'Monthly') ||
                          await clickText(page, 'Annual') ||
                          await clickText(page, 'Yearly');
    if (toggleClicked) {
      await screenshot(page, '04-pricing-toggled', 'Pricing — after toggle');
    }
  }

  // ── 05: Templates ────────────────────────────────────────────────────────────
  section('05 — Templates Gallery');
  const templatePages = [
    'https://invideo.io/make/',
    'https://invideo.io/templates/',
    'https://invideo.io/video-templates/',
  ];
  for (const url of templatePages) {
    if (await goto(page, url)) {
      await dismissOverlays(page);
      await screenshot(page, '05-templates-hero', 'Templates — hero');
      await screenshotFull(page, '05-templates-full', 'Templates — full page');
      await saveSnapshot(page, '05-templates', 'Templates — text');
      break;
    }
  }

  // ── 06: How It Works / Workflow ───────────────────────────────────────────────
  section('06 — How It Works / Workflow');
  const workflowPages = [
    'https://invideo.io/how-it-works/',
    'https://invideo.io/workflow/',
    'https://invideo.io/make/ai-script-to-video/',
  ];
  for (const url of workflowPages) {
    if (await goto(page, url)) {
      await dismissOverlays(page);
      await screenshot(page, '06-workflow-hero', 'Workflow — hero');
      await screenshotFull(page, '06-workflow-full', 'Workflow — full page');
      await saveSnapshot(page, '06-workflow', 'Workflow — text');
      break;
    }
  }

  // ── 07: Use Cases / Solutions ─────────────────────────────────────────────────
  section('07 — Use Cases / Target Audiences');
  const useCasePages = [
    'https://invideo.io/use-cases/',
    'https://invideo.io/solutions/',
    'https://invideo.io/for-marketing/',
    'https://invideo.io/for-business/',
    'https://invideo.io/for-youtube/',
  ];
  for (const url of useCasePages) {
    const slug = url.split('/').filter(Boolean).pop();
    if (await goto(page, url)) {
      await dismissOverlays(page);
      await screenshot(page, `07-usecase-${slug}`, `Use Case — ${slug}`);
      await saveSnapshot(page, `07-usecase-${slug}`, `Use Case — ${slug}`);
      // Only need first 2
      if (useCasePages.indexOf(url) >= 1) break;
    }
  }

  // ── 08: Blog (Content Strategy Signal) ───────────────────────────────────────
  section('08 — Blog (content positioning signal)');
  if (await goto(page, 'https://invideo.io/blog/')) {
    await dismissOverlays(page);
    await screenshot(page, '08-blog-index', 'Blog — index');
    await saveSnapshot(page, '08-blog-index', 'Blog — index text');
    // Grab the 1st post
    try {
      const firstPost = await page.locator('article a, .post-card a, h2 a').first().getAttribute('href');
      if (firstPost) {
        const postUrl = firstPost.startsWith('http') ? firstPost : `https://invideo.io${firstPost}`;
        await goto(page, postUrl);
        await screenshot(page, '08-blog-post1', 'Blog — first post');
        await saveSnapshot(page, '08-blog-post1', 'Blog — first post text');
      }
    } catch { warn('Could not navigate to first blog post'); }
  }

  // ── 09: Sign-Up Wall Documentation ───────────────────────────────────────────
  section('09 — Sign-Up / Auth Wall (document, do NOT proceed past)');
  if (await goto(page, 'https://invideo.io/signup/')) {
    await dismissOverlays(page);
    await screenshot(page, '09-signup-page', 'Sign-up page — WALL (not entered)');
    await extractPageData(page, '09-signup');
    await saveSnapshot(page, '09-signup', 'Sign-up page — text');
    info('AUTH WALL: Documented sign-up page. Stopping here — no auth bypass.');
  }

  // Document app.invideo.io login wall
  if (await goto(page, 'https://app.invideo.io/')) {
    await dismissOverlays(page);
    await screenshot(page, '09-app-auth-wall', 'App redirect — auth wall');
    info('AUTH WALL: app.invideo.io redirects to login. Documented.');
  }

  // ── 10: Comparison / vs. Pages ────────────────────────────────────────────────
  section('10 — Comparison Pages (self-positioning)');
  const vsPages = [
    'https://invideo.io/vs/invideo-vs-descript/',
    'https://invideo.io/vs/invideo-vs-lumen5/',
    'https://invideo.io/vs/invideo-vs-pictory/',
    'https://invideo.io/vs/',
    'https://invideo.io/alternatives/',
  ];
  for (const url of vsPages) {
    if (await goto(page, url)) {
      await dismissOverlays(page);
      const slug = url.split('/').filter(Boolean).pop();
      await screenshot(page, `10-vs-${slug}`, `Comparison — ${slug}`);
      await saveSnapshot(page, `10-vs-${slug}`, `Comparison — ${slug} text`);
      await extractPageData(page, `10-vs-${slug}`);
      if (vsPages.indexOf(url) >= 1) break; // 2 pages max
    }
  }

  // ── 11: Navigation Crawl (map what exists) ────────────────────────────────────
  section('11 — Full Nav Map');
  await goto(page, 'https://invideo.io/');
  const navLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('nav a, header a'))
      .map(a => ({ text: a.textContent.trim(), href: a.href }))
      .filter(a => a.text.length > 0 && a.href.startsWith('http'))
      .filter((a, i, arr) => arr.findIndex(x => x.href === a.href) === i)
      .slice(0, 40);
  }).catch(() => []);
  fs.writeFileSync(
    path.join(SN, 'nav-map.json'),
    JSON.stringify(navLinks, null, 2)
  );
  ok(`Nav map → nav-map.json (${navLinks.length} links found)`);

  // ── 12: SEO / Meta Intelligence ───────────────────────────────────────────────
  section('12 — SEO & Meta Intelligence');
  await goto(page, 'https://invideo.io/');
  const meta = await page.evaluate(() => {
    const get = (sel) => document.querySelector(sel)?.content || null;
    return {
      title:       document.title,
      description: get('meta[name="description"]'),
      ogTitle:     get('meta[property="og:title"]'),
      ogDesc:      get('meta[property="og:description"]'),
      ogImage:     get('meta[property="og:image"]'),
      twitterCard: get('meta[name="twitter:card"]'),
      keywords:    get('meta[name="keywords"]'),
      canonical:   document.querySelector('link[rel="canonical"]')?.href || null,
    };
  }).catch(() => ({}));
  fs.writeFileSync(path.join(SN, 'seo-meta.json'), JSON.stringify(meta, null, 2));
  ok('SEO meta → seo-meta.json');
  info(`Title: ${meta.title}`);
  info(`Description: ${meta.description}`);

  // ─── Cleanup ──────────────────────────────────────────────────────────────────
  await browser.close();
  info('Browser closed.');

  // ─── Write CRAWL_LOG.md ───────────────────────────────────────────────────────
  section('Writing CRAWL_LOG.md');
  const summary = `# InVideo AI — Crawl Log
Date: ${new Date().toISOString()}
OK: ${OK_COUNT}  |  WARN: ${WARN_COUNT}

## Captures
${CAPTURES.map(c => `- **${c.label}** → screenshots/${c.name}.png`).join('\n')}

## Log
\`\`\`
${LOG_LINES.join('\n')}
\`\`\`
`;
  fs.writeFileSync(path.join(OUT, 'CRAWL_LOG.md'), summary);
  console.log('\n\x1b[32m✓ Crawl complete.\x1b[0m');
  console.log(`  OK:   ${OK_COUNT}`);
  console.log(`  WARN: ${WARN_COUNT}`);
  console.log(`  Output: ${OUT}`);
  console.log('\nNext: Open screenshots, read snapshots, then run analysis prompt.\n');
}

runResearch().catch((err) => {
  console.error('\x1b[31m[FATAL]', err, '\x1b[0m');
  process.exit(1);
});
