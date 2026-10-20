/**
 * save-session-cdp.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects to YOUR already-running Chrome (via CDP) and saves Playwright
 * storageState for each competitor you're logged into.
 *
 * HOW TO USE:
 *   Step 1 — Launch Chrome with remote debugging (ONE TIME):
 *     "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Temp\AvionResearch"
 *     (use "Google Chrome" or "chrome" in your Start menu shortcut, with those flags)
 *
 *   Step 2 — In that Chrome window, log into each competitor normally.
 *             Magic links work fine here — you're in your real browser.
 *
 *   Step 3 — Run this script:
 *     node research/explorers/save-session-cdp.js heygen higgsfield runway kling openart
 *
 *   Step 4 — Run the crawls:
 *     node research/explorers/crawl.js heygen --auth
 *     node research/explorers/crawl.js higgsfield --auth
 *     etc.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../');

const competitors = process.argv.slice(2);

if (!competitors.length) {
  console.log('\nUsage: node research/explorers/save-session-cdp.js <id> [<id2> ...]\n');
  console.log('  Example: node research/explorers/save-session-cdp.js heygen runway higgsfield kling openart\n');
  console.log('  Requires Chrome running with --remote-debugging-port=9222\n');
  process.exit(1);
}

// ── Connect to existing Chrome via CDP ───────────────────────────────────────

console.log('\n🔗 Connecting to Chrome at 127.0.0.1:9222 ...');
let browser;
const endpoints = ['http://127.0.0.1:9222', 'http://localhost:9222'];
for (const endpoint of endpoints) {
  try {
    browser = await chromium.connectOverCDP(endpoint);
    console.log(`✅ Connected via ${endpoint}`);
    break;
  } catch {
    // try next
  }
}
if (!browser) {
  console.error('\n❌ Could not connect to Chrome.\n');
  console.error('   Steps:');
  console.error('   1. Close ALL Chrome windows first');
  console.error('   2. Run: & "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
  console.error('   3. Wait 3 seconds for Chrome to fully open');
  console.error('   4. Re-run this script\n');
  process.exit(1);
}
console.log('✅ Connected to Chrome\n');

const [defaultContext] = browser.contexts();
if (!defaultContext) {
  console.error('❌ No browser context found — is Chrome fully open?\n');
  try { await browser.close(); } catch { /* CDP connection — close is optional */ }
  process.exit(1);
}

// ── Save session for each competitor ─────────────────────────────────────────

for (const id of competitors) {
  const configPath  = path.join(ROOT, 'research/competitors', id, 'config.js');
  const sessionPath = path.join(ROOT, 'research/browser-sessions', `${id}.json`);

  if (!fs.existsSync(configPath)) {
    console.log(`⚠  [${id}] No config found at ${configPath} — skipping`);
    continue;
  }

  let config;
  try {
    const { default: c } = await import(pathToFileURL(configPath).href);
    config = c;
  } catch (err) {
    console.log(`⚠  [${id}] Could not load config: ${err.message} — skipping`);
    continue;
  }

  console.log(`─── ${config.name} (${id}) ───────────────────────────────`);
  console.log(`    App URL: ${config.appUrl}`);

  // Find an existing page at the app domain, or open a new one
  const appDomain = new URL(config.appUrl).hostname;
  let page = defaultContext.pages().find(p => {
    try { return new URL(p.url()).hostname.includes(appDomain.split('.').slice(-2).join('.')); }
    catch { return false; }
  });

  if (!page) {
    console.log(`    → No existing tab found for ${appDomain}, opening new tab...`);
    page = await defaultContext.newPage();
  } else {
    console.log(`    → Found existing tab: ${page.url()}`);
  }

  try {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  } catch {
    console.log(`    → Navigation timeout (continuing anyway...)`);
  }

  const currentUrl = page.url();
  const loginPatterns = config.loginUrlPatterns || ['/login', '/auth', '/signup', '/sign-in'];

  if (loginPatterns.some(p => currentUrl.includes(p))) {
    console.log(`    ⚠  STILL ON LOGIN PAGE: ${currentUrl}`);
    console.log(`    → Log into ${config.name} in Chrome first, then re-run this script.\n`);
    continue;
  }

  console.log(`    ✓  Logged in at: ${currentUrl}`);

  // Save the full context storageState (all cookies + localStorage for all origins)
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  await defaultContext.storageState({ path: sessionPath });

  const raw    = fs.readFileSync(sessionPath, 'utf8');
  const state  = JSON.parse(raw);
  const sizeKB = (Buffer.byteLength(raw) / 1024).toFixed(1);

  console.log(`    ✅ Saved → ${sessionPath}`);
  console.log(`       Cookies : ${state.cookies?.length ?? 0}`);
  console.log(`       Origins : ${state.origins?.length ?? 0}`);
  console.log(`       Size    : ${sizeKB} KB\n`);
}

try { await browser.close(); } catch { /* CDP connection — close is optional */ }

console.log('═══════════════════════════════════════════════════════');
console.log('Sessions saved. Now run the crawls:');
for (const id of competitors) {
  console.log(`  node research/explorers/crawl.js ${id} --auth`);
}
console.log('═══════════════════════════════════════════════════════\n');
