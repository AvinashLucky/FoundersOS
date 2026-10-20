/**
 * AVION — Save Authenticated Playwright Session (fixed)
 *
 * Run from project root:
 *   node research/browser-sessions/save-session.cjs
 *
 * Root cause of empty storageState:
 *   Supabase stores its session in localStorage (not cookies).
 *   We must wait for the Supabase auth key to exist in localStorage
 *   BEFORE calling context.storageState().
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const SESSION_PATH = path.resolve(__dirname, 'avion.json');
const AVION_ORIGIN = 'http://localhost:5173';

// Supabase project ref from backend/.env SUPABASE_URL
// https://beqdckjhguioplwxcwrl.supabase.co → ref = beqdckjhguioplwxcwrl
const SUPABASE_REF = 'beqdckjhguioplwxcwrl';
const SUPABASE_KEY = `sb-${SUPABASE_REF}-auth-token`;

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 min for manual login
const POLL_INTERVAL_MS = 1000;

async function waitForSupabaseAuth(page) {
  console.log(`\n⏳ Waiting for Supabase auth key in localStorage...`);
  console.log(`   Key: ${SUPABASE_KEY}\n`);

  const deadline = Date.now() + LOGIN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    // Must be on the Avion origin for localStorage to be readable
    const currentUrl = page.url();
    if (!currentUrl.startsWith(AVION_ORIGIN)) {
      process.stdout.write('.');
      await page.waitForTimeout(POLL_INTERVAL_MS);
      continue;
    }

    const authValue = await page.evaluate((key) => {
      // Try exact key first
      const val = localStorage.getItem(key);
      if (val) return val;

      // Fallback: scan all keys for sb-*-auth-token pattern
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
          return localStorage.getItem(k);
        }
      }
      return null;
    }, SUPABASE_KEY).catch(() => null);

    if (authValue) {
      try {
        const parsed = JSON.parse(authValue);
        // Valid Supabase session has access_token
        if (parsed?.access_token || parsed?.session?.access_token) {
          console.log('\n✅ Supabase auth token found in localStorage.');
          return authValue;
        }
      } catch {
        // Not JSON yet — still writing, keep polling
      }
    }

    process.stdout.write('.');
    await page.waitForTimeout(POLL_INTERVAL_MS);
  }

  return null;
}

(async () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   AVION — Save Authenticated Session (fixed)     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const dir = path.dirname(SESSION_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('🚀 Launching headed Chromium...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  console.log(`🌐 Opening ${AVION_ORIGIN}...\n`);
  await page.goto(AVION_ORIGIN, { waitUntil: 'domcontentloaded' });

  console.log('👤 Please complete your Google / Supabase login in the browser window.');
  console.log('   You have 5 minutes.\n');

  // Wait for Supabase to write the auth token to localStorage
  const authToken = await waitForSupabaseAuth(page);

  if (!authToken) {
    console.error('\n\n❌ FAILED: Supabase auth token never appeared in localStorage.');
    console.error('   Possible reasons:');
    console.error('   1. Login was not completed within 5 minutes.');
    console.error('   2. Supabase key name differs from: ' + SUPABASE_KEY);
    console.error('   3. Auth is stored in sessionStorage instead of localStorage.');
    console.error('\n   Checking sessionStorage as fallback...');

    // Check sessionStorage too
    const sessionVal = await page.evaluate((key) => {
      const v = sessionStorage.getItem(key);
      if (v) return { storage: 'sessionStorage', key, value: v };
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('sb-')) return { storage: 'sessionStorage', key: k, value: sessionStorage.getItem(k) };
      }
      // Dump all localStorage keys for debug
      const lsKeys = [];
      for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));
      return { storage: 'none', lsKeys };
    }, SUPABASE_KEY).catch(() => null);

    console.error('   Storage scan result:', JSON.stringify(sessionVal, null, 2));
    console.error('\n   Keeping browser open for manual inspection. Press Ctrl+C to exit.');
    await new Promise(() => {}); // keep alive
  }

  // Extra safety: wait 1s for any remaining writes to flush
  await page.waitForTimeout(1000);

  console.log('\n💾 Calling context.storageState()...');
  await context.storageState({ path: SESSION_PATH });

  // Validate the saved file
  if (!fs.existsSync(SESSION_PATH)) {
    console.error('❌ avion.json was not created on disk.');
    await browser.close();
    process.exit(1);
  }

  const raw = fs.readFileSync(SESSION_PATH, 'utf8');
  const state = JSON.parse(raw);
  const fileSizeKB = (Buffer.byteLength(raw) / 1024).toFixed(1);

  const hasCookies = Array.isArray(state.cookies) && state.cookies.length > 0;
  const hasOrigins = Array.isArray(state.origins) && state.origins.length > 0 &&
    state.origins.some(o => o.localStorage && o.localStorage.length > 0);

  console.log('\n══════════════════════════════════════════════════');
  console.log(`1. Auth detected:     ✅ Supabase localStorage key present`);
  console.log(`2. Storage saved:     ${SESSION_PATH}`);
  console.log(`3. File size:         ${fileSizeKB} KB`);
  console.log(`4. Cookies captured:  ${hasCookies ? '✅ ' + state.cookies.length + ' cookie(s)' : '⚠️  none (expected for Supabase)'}`);
  console.log(`   Origins captured:  ${hasOrigins ? '✅ localStorage data present' : '❌ EMPTY — save failed'}`);
  console.log('══════════════════════════════════════════════════\n');

  if (!hasOrigins && !hasCookies) {
    console.error('❌ CRITICAL: storageState is still empty after confirmed auth.');
    console.error('   This means Playwright context != the page context where login happened.');
    console.error('   Keeping browser open. Check the console for clues.');
    await new Promise(() => {});
  }

  console.log('🔒 Closing browser. Session is ready for E2E use.\n');
  await browser.close();
})();
