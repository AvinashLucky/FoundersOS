/**
 * AVION — Save Authenticated Playwright Session
 *
 * WHY THIS APPROACH:
 *   Google intentionally blocks OAuth in Playwright Chromium (detects automation).
 *   This is permanent — browser flags don't fix it reliably.
 *
 *   Solution: bypass Google entirely.
 *   1. Sign in via Supabase's email/password REST API (pure Node.js, no browser).
 *   2. Inject the returned session into Playwright's localStorage via addInitScript.
 *      addInitScript runs BEFORE any page script — before Supabase JS even initializes.
 *   3. Avion's AuthContext.tsx calls getSession() on mount, reads from localStorage,
 *      finds the injected session, and renders fully authenticated.
 *   4. Save storageState — all future Playwright research runs load this directly.
 *
 * ONE-TIME SETUP (Supabase Dashboard only, zero code changes):
 *   1. Authentication → Providers → Email → Enable
 *   2. Authentication → Users → Add User → create research@yourdomain.com
 *   3. Copy .env.research.template → .env.research, fill in credentials
 *
 * RUN (from project root):
 *   node research/browser-sessions/save-session.js
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────────

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#'))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
}

// Read Supabase public config from main .env
const mainEnv      = parseEnvFile(path.join(__dirname, '../../.env'));
const SUPABASE_URL = mainEnv.VITE_SUPABASE_URL;
const SUPABASE_KEY = mainEnv.VITE_SUPABASE_ANON_KEY;

// Read research credentials from .env.research (gitignored)
const researchEnvPath  = path.join(__dirname, '.env.research');
const researchEnv      = parseEnvFile(researchEnvPath);
const RESEARCH_EMAIL    = researchEnv.RESEARCH_EMAIL;
const RESEARCH_PASSWORD = researchEnv.RESEARCH_PASSWORD;

const STORAGE_KEY  = `sb-beqdckjhguioplwxcwrl-auth-token`;
const SESSION_PATH = path.join(__dirname, 'avion.json');
const AVION_URL    = 'http://localhost:5173';

// ── Guard ─────────────────────────────────────────────────────────────────────

function validateConfig() {
  const missing = [];
  if (!SUPABASE_URL)      missing.push('VITE_SUPABASE_URL (missing from .env)');
  if (!SUPABASE_KEY)      missing.push('VITE_SUPABASE_ANON_KEY (missing from .env)');
  if (!RESEARCH_EMAIL)    missing.push('RESEARCH_EMAIL (missing from .env.research)');
  if (!RESEARCH_PASSWORD) missing.push('RESEARCH_PASSWORD (missing from .env.research)');

  if (missing.length) {
    console.error('\n❌ Missing configuration:');
    missing.forEach(m => console.error(`   - ${m}`));
    if (!fs.existsSync(researchEnvPath)) {
      console.error(`\n   Create: research/browser-sessions/.env.research`);
      console.error(`   Template: research/browser-sessions/.env.research.template\n`);
    }
    process.exit(1);
  }
}

// ── Step 1: Authenticate via Supabase REST (no browser, no Google) ────────────

async function getSupabaseSession() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
    },
    body: JSON.stringify({ email: RESEARCH_EMAIL, password: RESEARCH_PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase auth failed (${res.status}): ${body}`);
  }

  const session = await res.json();

  if (!session.access_token) {
    throw new Error(`No access_token in response: ${JSON.stringify(session)}`);
  }

  return session;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   AVION — Save Authenticated Session             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  validateConfig();

  // Step 1: Get session from Supabase (pure Node, no browser, no Google)
  console.log('🔑 Signing in via Supabase email/password...');
  const session = await getSupabaseSession();
  const expiresIn = session.expires_in ?? 3600;
  console.log(`✅ Session obtained. Valid for ${Math.round(expiresIn / 60)} minutes.\n`);

  // Step 2: Launch Playwright and inject session into localStorage
  console.log('🚀 Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // addInitScript runs BEFORE any page JS — sets localStorage before
  // Supabase JS initializes, so getSession() finds it immediately.
  await context.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key: STORAGE_KEY, value: JSON.stringify(session) });

  const page = await context.newPage();
  console.log(`🌐 Opening ${AVION_URL}...`);
  await page.goto(AVION_URL, { waitUntil: 'domcontentloaded' });

  // Step 3: Wait for Avion's AuthContext to process the session
  // AuthContext.tsx → getSession() → reads localStorage → setSession() → renders
  console.log('⏳ Waiting for Avion to recognize session (3 s)...');
  await page.waitForTimeout(3000);

  // Step 4: Confirm session survived (Avion shouldn't overwrite it)
  const confirmed = await page.evaluate((key) => {
    try {
      return !!JSON.parse(localStorage.getItem(key))?.access_token;
    } catch { return false; }
  }, STORAGE_KEY);

  if (!confirmed) {
    const lsKeys = await page.evaluate(() => Object.keys(localStorage)).catch(() => []);
    console.error('\n❌ Session was NOT found in localStorage after page load.');
    console.error('   Supabase may have rejected or cleared the injected session.');
    console.error('   localStorage keys present:', lsKeys);
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Session confirmed in localStorage.\n');

  // Step 5: Save storageState for all future Playwright research runs
  const dir = path.dirname(SESSION_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log('💾 Saving storageState...');
  await context.storageState({ path: SESSION_PATH });

  // Step 6: Validate the saved file
  const raw     = fs.readFileSync(SESSION_PATH, 'utf8');
  const state   = JSON.parse(raw);
  const sizeKB  = (Buffer.byteLength(raw, 'utf8') / 1024).toFixed(1);
  const hasData = state.origins?.some(o => o.localStorage?.length > 0);

  if (!hasData) {
    console.error('❌ avion.json was saved but origins are empty.');
    console.error('   This is unexpected — the session was in localStorage.');
    console.error('   Raw file:', raw);
    await browser.close();
    process.exit(1);
  }

  console.log('══════════════════════════════════════════════════');
  console.log(`1. Auth method:    Supabase email/password (no Google)`);
  console.log(`2. Session saved:  ${SESSION_PATH}`);
  console.log(`3. File size:      ${sizeKB} KB`);
  console.log(`4. Origins:        ✅ localStorage data captured`);
  console.log(`5. Cookies:        ${state.cookies?.length ?? 0} (Supabase uses localStorage, not cookies)`);
  console.log('══════════════════════════════════════════════════');
  console.log('\n✅ Done. Future Playwright scripts load avion.json directly.\n');

  await browser.close();
}

run().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
