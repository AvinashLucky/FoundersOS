/**
 * save-invideo-session.js — SUPERSEDED
 * Use instead: node research/explorers/save-session.js invideo
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME SETUP: Opens app.invideo.io in a real Chromium browser.
 * You log in manually. We save the session. Never touches your normal Chrome.
 *
 * Run:  node research/browser-sessions/save-invideo-session.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const SESSION_PATH = path.join(__dirname, 'invideo.json');

function waitForEnter(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => { rl.close(); resolve(); });
  });
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   InVideo AI — Save Authenticated Session            ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log('This will open a Playwright Chromium window (NOT your normal Chrome).');
  console.log('Log in to InVideo with your account, then come back and press Enter.\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  await page.goto('https://app.invideo.io/', { waitUntil: 'domcontentloaded', timeout: 20000 });

  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│  Chromium browser is open at app.invideo.io         │');
  console.log('│  → Log in with your InVideo account                 │');
  console.log('│  → Wait until you see your dashboard                │');
  console.log('│  → Then come back here and press ENTER              │');
  console.log('└─────────────────────────────────────────────────────┘\n');

  await waitForEnter('Press ENTER once you are logged into the InVideo dashboard... ');

  // Verify we're in the app (not still on login page)
  const currentUrl = page.url();
  console.log(`\nCurrent URL: ${currentUrl}`);

  if (currentUrl.includes('/login') || currentUrl.includes('/signup') || currentUrl.includes('/auth')) {
    console.error('\n⚠  URL still looks like a login page. Are you sure you are logged in?');
    console.error('   Check the Chromium window and try again, or re-run the script.\n');
    await browser.close();
    process.exit(1);
  }

  console.log('\n💾 Saving session state...');
  await context.storageState({ path: SESSION_PATH });

  const raw    = fs.readFileSync(SESSION_PATH, 'utf8');
  const state  = JSON.parse(raw);
  const sizeKB = (Buffer.byteLength(raw, 'utf8') / 1024).toFixed(1);

  console.log(`\n✅ Session saved → ${SESSION_PATH}`);
  console.log(`   Cookies : ${state.cookies?.length ?? 0}`);
  console.log(`   Origins : ${state.origins?.length ?? 0}`);
  console.log(`   Size    : ${sizeKB} KB\n`);
  console.log('You can now run the authenticated crawler:');
  console.log('  node research/explorers/competitor-invideo-auth.js\n');

  await browser.close();
}

run().catch((err) => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
