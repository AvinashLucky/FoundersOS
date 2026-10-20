/**
 * session-manager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared session save/validate for competitor research.
 * One function per concern — no competitor-specific logic here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

function waitForEnter(prompt) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => { rl.close(); resolve(); });
  });
}

/**
 * saveManualSession
 * Opens a browser at `appUrl`, lets the user log in manually,
 * then saves the storage state to `sessionPath`.
 */
export async function saveManualSession({ appUrl, sessionPath, competitorName }) {
  console.log(`\n╔═══════════════════════════════════════════════════════╗`);
  console.log(`║  ${(competitorName + ' — Save Session').padEnd(53)}║`);
  console.log(`╚═══════════════════════════════════════════════════════╝\n`);
  // Stealth args — hides Playwright automation from Google/other OAuth providers.
  // Google detects navigator.webdriver and --enable-automation; these suppress both.
  const stealthArgs = [
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--start-maximized',
    '--no-sandbox',
  ];

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 50, args: stealthArgs });
    console.log(`Opening system Chrome (stealth mode) at: ${appUrl}\n`);
  } catch {
    browser = await chromium.launch({ headless: false, slowMo: 50, args: stealthArgs });
    console.log(`Opening Playwright Chromium (stealth mode) at: ${appUrl}\n`);
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });

  // Remove navigator.webdriver fingerprint before any page script runs
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
  });
  const page    = await context.newPage();

  await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);

  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  ⚠  DO NOT use "Continue with Google" — Google blocks it     │');
  console.log('│                                                              │');
  console.log('│  USE EMAIL LOGIN INSTEAD:                                    │');
  console.log('│    1. Type your email address in the field                   │');
  console.log('│    2. Click Continue                                         │');
  console.log('│    3. Enter the OTP / password sent to your email            │');
  console.log('│    4. Wait until the InVideo DASHBOARD is fully visible      │');
  console.log('│    5. Come back here and press ENTER                         │');
  console.log('└──────────────────────────────────────────────────────────────┘\n');

  await waitForEnter('Press ENTER once logged into the dashboard... ');

  const currentUrl = page.url();
  console.log(`\nCurrent URL: ${currentUrl}`);

  const loginPatterns = ['/login', '/auth', '/signup', '/sign-in', '/signin'];
  if (loginPatterns.some(p => currentUrl.includes(p))) {
    console.error('\n⚠  Still on login page — are you logged in? Re-run and try again.\n');
    await browser.close();
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  await context.storageState({ path: sessionPath });

  const raw    = fs.readFileSync(sessionPath, 'utf8');
  const state  = JSON.parse(raw);
  const sizeKB = (Buffer.byteLength(raw) / 1024).toFixed(1);

  console.log(`\n✅ Session saved → ${sessionPath}`);
  console.log(`   Cookies : ${state.cookies?.length ?? 0}`);
  console.log(`   Origins : ${state.origins?.length ?? 0}`);
  console.log(`   Size    : ${sizeKB} KB`);
  console.log(`\nRun crawler: node research/explorers/crawl.js ${path.basename(sessionPath, '.json')} --auth\n`);

  await browser.close();
}

/**
 * validateSession
 * Checks the current page URL is NOT a login/auth wall.
 * Returns true if session appears valid.
 */
export function validateSession(page, loginUrlPatterns = ['/login', '/auth', '/signup', '/sign-in']) {
  const url = page.url();
  return !loginUrlPatterns.some(p => url.includes(p));
}
