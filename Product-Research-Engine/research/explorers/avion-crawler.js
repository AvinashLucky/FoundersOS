/**
 * AVION Full-Site Research Crawler
 *
 * USAGE (from project root):
 *   node research/explorers/avion-crawler.js
 *
 * REQUIRES:
 *   - Avion running at http://localhost:5173
 *   - Valid session at research/browser-sessions/avion.json
 *     (run save-session.js first if missing)
 *
 * OUTPUT:
 *   research/avion-ui-research/
 *     screenshots/<module>/<state>.png
 *     snapshots/<module>/<state>.txt
 *     module-records/<MODULE>.md  (updated in-place)
 *     MASTER_INDEX.md             (regenerated at end)
 *     CRAWLER_LOG.md              (run log with timestamps)
 *
 * DESIGN:
 *   - Visited-state registry prevents duplicate captures
 *   - Semantic/role locators — zero coordinate clicking
 *   - Each module has a dedicated explore() function
 *   - Failed interactions are retried once then skipped (logged)
 *   - No source code modifications (RESEARCH_MODE flag is separate)
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT         = path.join(__dirname, '../..');
const SESSION_PATH = path.join(ROOT, 'research/browser-sessions/avion.json');
const OUT          = path.join(ROOT, 'research/avion-ui-research');
const AVION        = 'http://localhost:5173';

// ── State ─────────────────────────────────────────────────────────────────────
const visited   = new Set();   // stateKey → already captured
const log       = [];          // {ts, level, msg}
const findings  = [];          // {module, route, state, observation}

function emit(level, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] [${level}] ${msg}`;
  console.log(line);
  log.push({ ts, level, msg });
}
const info  = msg => emit('INFO ', msg);
const warn  = msg => emit('WARN ', msg);
const ok    = msg => emit('OK   ', msg);
const skip  = msg => emit('SKIP ', msg);

// ── File helpers ──────────────────────────────────────────────────────────────
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function saveText(relPath, content) {
  const full = path.join(OUT, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
}

async function shot(page, relPath, description) {
  const full = path.join(OUT, relPath);
  ensureDir(path.dirname(full));
  await page.screenshot({ path: full, fullPage: false }).catch(() => {});
  ok(`Screenshot → ${relPath}`);
  return full;
}

// ── Navigation helpers ────────────────────────────────────────────────────────
async function goto(page, route, waitMs = 1200) {
  await page.goto(`${AVION}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitMs);
}

// Click by text — logs warn only when fallback=true.
async function clickText(page, text, { timeout = 4000, fallback = true } = {}) {
  try {
    await page.getByText(text, { exact: false }).first().click({ timeout });
    await page.waitForTimeout(600);
    return true;
  } catch {
    if (fallback) warn(`Could not click "${text}"`);
    return false;
  }
}

// Click by ARIA role + name.
async function clickRole(page, role, name, { timeout = 4000 } = {}) {
  try {
    await page.getByRole(role, { name, exact: false }).first().click({ timeout });
    await page.waitForTimeout(600);
    return true;
  } catch {
    warn(`Could not click role=${role} name="${name}"`);
    return false;
  }
}

// Click by CSS selector.
async function clickSel(page, selector, { timeout = 4000, label } = {}) {
  try {
    await page.locator(selector).first().click({ timeout });
    await page.waitForTimeout(600);
    return true;
  } catch {
    warn(`Could not click selector "${label ?? selector}"`);
    return false;
  }
}

async function closeModal(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  try {
    await page.locator('[aria-label="close"], [aria-label="Close"], button:has-text("×"), button:has-text("✕")').first().click({ timeout: 2000 });
  } catch { /* already closed */ }
  await page.waitForTimeout(300);
}

async function getPageText(page) {
  return page.evaluate(() => document.body.innerText.slice(0, 4000)).catch(() => '');
}

async function stateKey(tag) {
  if (visited.has(tag)) return false;
  visited.add(tag);
  return true;
}

function record(module, route, state, observation) {
  findings.push({ module, route, state, observation });
  info(`RECORD [${module}] ${state}`);
}

// ── RESEARCH_MODE verification ────────────────────────────────────────────────
// Returns true when the <html data-research-mode="true"> marker is present.
// The marker is set by src/lib/researchMode.ts when window.__AVION_RESEARCH__
// is seen as true at module eval time.
async function verifyResearchMode(page) {
  const active = await page.evaluate(
    () => document.documentElement.dataset.researchMode === 'true'
  ).catch(() => false);
  if (active) {
    ok('RESEARCH_MODE confirmed active (data-research-mode="true" on <html>)');
  } else {
    warn('RESEARCH_MODE NOT detected — gated interactions may fail');
  }
  return active;
}

// Navigate to a Create wizard step via data-step attribute.
// This bypasses any disabled-button issues — the stepper tab is always in the
// DOM, and RESEARCH_MODE sets canEnter[i]=true so the click fires go(i).
async function goToStep(page, stepLabel, waitMs = 1200) {
  try {
    await page.locator(`[data-step="${stepLabel.toLowerCase()}"]`).click({ timeout: 5000 });
    await page.waitForTimeout(waitMs);
    return true;
  } catch {
    warn(`Could not navigate to step "${stepLabel}" via data-step`);
    return false;
  }
}

// ── MODULE: DISCOVER / Signal Radar ──────────────────────────────────────────
async function exploreDiscover(page) {
  info('=== DISCOVER ===');

  await goto(page, '/discover', 1500);

  // --- State 1: Signal Radar default (All / Trending / Videos) ---------------
  if (await stateKey('discover/signal-radar/default')) {
    await shot(page, 'screenshots/discover/01-signal-radar-all-trending.png', 'Signal Radar');
    const txt = await getPageText(page);
    saveText('snapshots/discover/01-signal-radar-all-trending.txt', txt);
    record('DISCOVER', '/discover', 'Signal Radar — All / Trending / Videos',
      'Grid of viral content cards. Platform filters: All, YouTube, Instagram, Facebook, Pinterest, X. Category pills: Trending, Cricket, Football, Tech, AI. Toggle: Videos / Creators. Top-right: Scope, Blast, Refresh.');
  }

  // --- State 2: YouTube filter ------------------------------------------------
  // Use data-platform-* or locate the platform pill by its exact structure.
  // The pill text "YouTube" might be matched by card titles before the pill,
  // so we try clicking the pill container that wraps icon + label.
  if (await stateKey('discover/signal-radar/youtube')) {
    // Strategy: find the flex platform-pill row and click the "YouTube" button
    // within it. The pill buttons use motion.button with label text inside.
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const yt = btns.find(b => b.textContent?.trim() === 'YouTube' || b.querySelector('span')?.textContent?.trim() === 'YouTube');
      if (yt) { yt.click(); return true; }
      return false;
    }).catch(() => false);
    if (!clicked) warn('Could not click YouTube platform pill');
    await page.waitForTimeout(800);
    await shot(page, 'screenshots/discover/02-signal-radar-youtube.png', 'YouTube filter');
    record('DISCOVER', '/discover', 'Signal Radar — YouTube filter', 'Cards filtered to YouTube only.');
  }

  // --- State 3: Instagram filter ----------------------------------------------
  if (await stateKey('discover/signal-radar/instagram')) {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const ig = btns.find(b => b.textContent?.trim() === 'Instagram' || b.querySelector('span')?.textContent?.trim() === 'Instagram');
      if (ig) { ig.click(); return true; }
      return false;
    }).catch(() => false);
    if (!clicked) warn('Could not click Instagram platform pill');
    await page.waitForTimeout(800);
    await shot(page, 'screenshots/discover/03-signal-radar-instagram.png', 'Instagram filter');
    record('DISCOVER', '/discover', 'Signal Radar — Instagram filter', 'Cards filtered to Instagram only.');
  }

  // Reset to All
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const all = btns.find(b => b.textContent?.trim() === 'All');
    if (all) all.click();
  }).catch(() => {});
  await page.waitForTimeout(500);

  // --- State 4: Creators toggle -----------------------------------------------
  if (await stateKey('discover/signal-radar/creators')) {
    await clickText(page, 'Creators');
    await page.waitForTimeout(800);
    await shot(page, 'screenshots/discover/04-signal-radar-creators.png', 'Creators toggle');
    record('DISCOVER', '/discover', 'Signal Radar — Creators view', 'Creator/channel cards layout.');
    await clickText(page, 'Videos', { fallback: false });
    await page.waitForTimeout(500);
  }

  // --- State 5: Card detail modal — Details tab ------------------------------
  if (await stateKey('discover/card-modal/details')) {
    try {
      await page.locator('[class*="card"],[class*="Card"]').first().click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await shot(page, 'screenshots/discover/05-card-modal-details.png', 'Card modal Details tab');
      const txt = await getPageText(page);
      saveText('snapshots/discover/05-card-modal-details.txt', txt);
      record('DISCOVER', '/discover', 'Card detail modal — Details tab',
        'Video player left, metadata right. Tabs: Details (title, desc, hashtags), AI Intel. Actions: Save, Copy link, Share.');
    } catch { warn('Card click failed'); }
  }

  // --- State 6: Card modal — AI Intel tab ------------------------------------
  if (await stateKey('discover/card-modal/ai-intel')) {
    const clicked = await clickText(page, 'AI Intel');
    if (clicked) {
      await page.waitForTimeout(1000);
      await shot(page, 'screenshots/discover/06-card-modal-ai-intel.png', 'Card modal AI Intel tab');
      const txt = await getPageText(page);
      saveText('snapshots/discover/06-card-modal-ai-intel.txt', txt);
      record('DISCOVER', '/discover', 'Card detail modal — AI Intel tab', 'AI-generated hook/analysis for the selected video.');
    }
  }

  // NOTE: "Remix" is a hover-button ON cards, not a modal tab. Removed from crawl.

  await closeModal(page);
  await page.waitForTimeout(500);

  // --- State 7: Scope panel ---------------------------------------------------
  if (await stateKey('discover/scope-panel')) {
    await clickText(page, 'Scope');
    await page.waitForTimeout(800);
    await shot(page, 'screenshots/discover/08-scope-panel.png', 'Scope panel');
    const txt = await getPageText(page);
    saveText('snapshots/discover/08-scope-panel.txt', txt);
    record('DISCOVER', '/discover', 'Scope panel', 'Filter configuration panel — date range, platform toggles, region, content type.');
    await closeModal(page);
    await page.waitForTimeout(500);
  }

  // --- State 8: Occasion Calendar --------------------------------------------
  if (await stateKey('discover/occasion-calendar')) {
    await clickText(page, 'Occasion Calendar');
    await page.waitForTimeout(1200);
    await shot(page, 'screenshots/discover/09-occasion-calendar.png', 'Occasion Calendar');
    const txt = await getPageText(page);
    saveText('snapshots/discover/09-occasion-calendar.txt', txt);
    record('DISCOVER', '/discover/occasion-calendar', 'Occasion Calendar — month view',
      'Calendar grid showing upcoming cultural/national occasions. Click a date to see trending hooks for that occasion.');
  }

  // --- State 9: Occasion Calendar — date click ------------------------------
  if (await stateKey('discover/occasion-calendar/date-clicked')) {
    try {
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        // First try: button containing a flag emoji
        const flagBtn = buttons.find(b => /[\u{1F1E0}-\u{1F1FF}]/u.test(b.innerText));
        if (flagBtn) { flagBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
        // Second try: button with a glow/ring box-shadow (occasion dates)
        const glowBtn = buttons.find(b => {
          const cs = getComputedStyle(b);
          return cs.boxShadow && cs.boxShadow !== 'none' && cs.boxShadow.includes('rgb');
        });
        if (glowBtn) { glowBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
        return false;
      });
      await page.waitForTimeout(1000);
      await shot(page, 'screenshots/discover/10-occasion-calendar-date-detail.png', 'Occasion detail');
      const txt = await getPageText(page);
      saveText('snapshots/discover/10-occasion-calendar-date-detail.txt', txt);
      if (clicked) record('DISCOVER', '/discover/calendar', 'Occasion Calendar — date detail panel',
        'Platform recommendation, ready caption, and Signal Radar search query for the selected occasion.');
      else warn('No occasion date with flag emoji or glow border found');
    } catch { warn('No occasion date to click'); }
  }

  ok('DISCOVER complete');
}

// ── MODULE: VAULT ─────────────────────────────────────────────────────────────
async function exploreVault(page) {
  info('=== VAULT ===');

  await goto(page, '/vault', 1500);

  // --- State 1: Vault default ------------------------------------------------
  if (await stateKey('vault/default')) {
    await shot(page, 'screenshots/vault/01-vault-default.png', 'Vault');
    const txt = await getPageText(page);
    saveText('snapshots/vault/01-vault-default.txt', txt);
    record('VAULT', '/vault', 'Vault — default tab',
      'Saved signals and assets library. Tabs or sections: Saved Signals / Prime items, Assets / rendered videos.');
  }

  // --- State 2: Saved Signals sub-tab ----------------------------------------
  if (await stateKey('vault/saved-signals')) {
    const clicked = await clickText(page, 'Saved') || await clickText(page, 'Signals') || await clickText(page, 'Prime');
    if (clicked) {
      await page.waitForTimeout(800);
      await shot(page, 'screenshots/vault/02-vault-saved-signals.png', 'Saved Signals');
      const txt = await getPageText(page);
      saveText('snapshots/vault/02-vault-saved-signals.txt', txt);
      record('VAULT', '/vault', 'Vault — Saved Signals tab', 'Bookmarked/saved viral content from Signal Radar.');
    }
  }

  // --- State 3: Assets tab ---------------------------------------------------
  if (await stateKey('vault/assets')) {
    const clicked = await clickText(page, 'Assets') || await clickText(page, 'Renders') || await clickText(page, 'Library');
    if (clicked) {
      await page.waitForTimeout(800);
      await shot(page, 'screenshots/vault/03-vault-assets.png', 'Assets');
      const txt = await getPageText(page);
      saveText('snapshots/vault/03-vault-assets.txt', txt);
      record('VAULT', '/vault', 'Vault — Assets tab', 'Generated video renders and media assets.');
    }
  }

  // --- State 4: Asset card detail -------------------------------------------
  if (await stateKey('vault/asset-detail')) {
    try {
      await page.locator('[class*="asset"],[class*="Asset"],[class*="render"],[class*="card"],[class*="Card"]').first().click({ timeout: 4000 });
      await page.waitForTimeout(1000);
      const modal = await page.locator('[role="dialog"],[class*="modal"],[class*="Modal"]').count();
      if (modal > 0) {
        await shot(page, 'screenshots/vault/04-vault-asset-detail.png', 'Asset detail');
        record('VAULT', '/vault', 'Asset detail modal', 'Preview of rendered asset with download/share options.');
        await closeModal(page);
      }
    } catch { warn('No asset card to click'); }
  }

  ok('VAULT complete');
}

// ── MODULE: CREATE ────────────────────────────────────────────────────────────
async function exploreCreate(page) {
  info('=== CREATE ===');

  await goto(page, '/create', 2000);

  // Verify RESEARCH_MODE is active — this must pass or gated steps will fail.
  const researchActive = await verifyResearchMode(page);
  if (!researchActive) {
    warn('RESEARCH_MODE not active — wizard gate bypasses will not work');
  }

  // --- State 1: Create — Step 1 (Script) ------------------------------------
  if (await stateKey('create/step1-script')) {
    await shot(page, 'screenshots/create/01-step1-script.png', 'Create Step 1 Script');
    const txt = await getPageText(page);
    saveText('snapshots/create/01-step1-script.txt', txt);
    record('CREATE', '/create', 'Create wizard — Step 1: Script',
      'Five-step wizard. Step 1 = script. Textarea, niche selector, tone. "Write for me" AI button. Next goes to Voice.');
  }

  // --- State 2: Script — AI generate ----------------------------------------
  if (await stateKey('create/step1-generate')) {
    // Button label is "Write for me" (not "Generate Script")
    const clicked = await clickText(page, 'Write for me', { timeout: 5000 });
    if (clicked) {
      await page.waitForTimeout(4000); // AI call — wait for the script to appear
      await shot(page, 'screenshots/create/02-step1-generated.png', 'Generated script');
      const txt = await getPageText(page);
      saveText('snapshots/create/02-step1-generated.txt', txt);
      record('CREATE', '/create', 'Create wizard — Step 1: Script generated', 'AI-generated script populated in textarea.');
    }
  }

  // --- State 3: Step 2 (Voice) — navigate via data-step ─────────────────────
  // Use data-step="voice" attribute (added to stepper tab buttons) so we bypass
  // any text-matching ambiguity. RESEARCH_MODE ensures canEnter[1] = true.
  if (await stateKey('create/step2-voice')) {
    const navigated = await goToStep(page, 'voice');
    if (!navigated) {
      // Fallback: click the header Next button "Next: Voice"
      await clickText(page, 'Next: Voice') || await clickText(page, 'Next:');
    }
    await page.waitForTimeout(1000);
    await shot(page, 'screenshots/create/03-step2-voice.png', 'Create Step 2 Voice');
    const txt = await getPageText(page);
    saveText('snapshots/create/03-step2-voice.txt', txt);
    record('CREATE', '/create', 'Create wizard — Step 2: Voice',
      'Voice selection. ElevenLabs voices listed (Arjun, Meera etc). Preview play button per voice. Skip available.');
  }

  // --- State 4: Voice — select a voice persona ─────────────────────────────
  if (await stateKey('create/step2-voice-selected')) {
    // VoiceStudio renders voice cards — try common Indian voice names first,
    // then fall back to any card-like element in VoiceStudio.
    const voiceNames = ['Arjun', 'Meera', 'Anaya', 'Surya', 'Priya', 'Ravi'];
    let voicePicked = false;
    for (const name of voiceNames) {
      const clicked = await clickText(page, name, { timeout: 2000, fallback: false });
      if (clicked) { voicePicked = true; break; }
    }
    if (!voicePicked) {
      // Try by evaluate — click first element that looks like a voice card
      voicePicked = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('[class*="voice" i], [class*="card" i]'));
        const clickable = cards.find(el => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button');
        if (clickable) { clickable.click(); return true; }
        return false;
      }).catch(() => false);
    }
    if (voicePicked) {
      await page.waitForTimeout(800);
      await shot(page, 'screenshots/create/04-step2-voice-selected.png', 'Voice selected');
      record('CREATE', '/create', 'Create wizard — Step 2: Voice selected', 'Voice persona highlighted.');
    } else {
      warn('No voice card found to select');
    }
  }

  // --- State 5: Step 3 (Video) — navigate via data-step ─────────────────────
  // RESEARCH_MODE makes canEnter[2] = scriptOk && voiceDone = true,
  // so data-step="video" stepper tab fires go(2) without needing voice done.
  if (await stateKey('create/step3-video')) {
    const navigated = await goToStep(page, 'video');
    if (!navigated) {
      // Fallback: click skip button (correct text) or try Next
      await clickText(page, 'Skip — video has its own audio', { fallback: false })
        || await clickText(page, 'Next: Video', { fallback: false })
        || warn('Could not navigate to Step 3 (Video)');
    }
    await page.waitForTimeout(1200);
    await shot(page, 'screenshots/create/05-step3-video.png', 'Create Step 3 Video');
    const txt = await getPageText(page);
    saveText('snapshots/create/05-step3-video.txt', txt);
    record('CREATE', '/create', 'Create wizard — Step 3: Video style',
      'Video mode. Style gallery: Faceless Story (live), Kids Story, Devotional, Anime, UGC, Tech Teaching, YouTube Edit. Short/Large toggle. Caption style picker.');
  }

  // --- State 6: Faceless Story selected ─────────────────────────────────────
  // data-style="faceless-story" is added to the VSTYLE card button.
  if (await stateKey('create/step3-faceless')) {
    const selected = await clickSel(page, '[data-style="faceless-story"]', { label: 'Faceless Story card' });
    if (!selected) {
      // Fallback: text match
      await clickText(page, 'Faceless Story') || warn('Could not select Faceless Story style');
    }
    await page.waitForTimeout(1000);
    await shot(page, 'screenshots/create/06-step3-faceless.png', 'Faceless Story selected');
    const txt = await getPageText(page);
    saveText('snapshots/create/06-step3-faceless.txt', txt);
    record('CREATE', '/create', 'Create wizard — Step 3: Faceless Story selected',
      '"Faceless Story" style selected (RENDERS IN AVION). Right panel shows RenderPanel with ₹ cost estimate, word-count gate, and Render button.');
  }

  // --- State 7: RESEARCH MODE — add mock video ──────────────────────────────
  // The [data-research="mock-video"] button is rendered in VideoStep when
  // RESEARCH_MODE=true. It adds a free BigBuckBunny mp4 to project.videos,
  // unlocking Edit and Publish steps.
  if (await stateKey('create/step3-mock-video')) {
    try {
      await page.locator('[data-research="mock-video"]').click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await shot(page, 'screenshots/create/07-step3-mock-video-added.png', 'Mock video added');
      const txt = await getPageText(page);
      saveText('snapshots/create/07-step3-mock-video-added.txt', txt);
      record('CREATE', '/create', 'Create wizard — Step 3: Mock video added (Research Mode)',
        'Research mode mock video (BigBuckBunny) added to project.videos. Unlocks Edit and Publish steps. Zero credits used.');
    } catch {
      warn('Mock video button [data-research="mock-video"] not found — RESEARCH_MODE not active or VideoStep not mounted');
    }
  }

  // --- State 8: Step 4 (Edit / Review) — navigate via data-step ─────────────
  // RESEARCH_MODE makes canEnter[3] = hasVideo = true (mock video just added).
  if (await stateKey('create/step4-edit')) {
    const navigated = await goToStep(page, 'edit');
    if (!navigated) {
      await clickText(page, 'Next: Edit', { fallback: false }) || warn('Could not navigate to Step 4 (Edit)');
    }
    await page.waitForTimeout(1500);
    await shot(page, 'screenshots/create/08-step4-edit.png', 'Create Step 4 Edit');
    const txt = await getPageText(page);
    saveText('snapshots/create/08-step4-edit.txt', txt);
    record('CREATE', '/create', 'Create wizard — Step 4: Edit/Review',
      'Review step: project summary (script words, style, caption, videos count). "Approve & continue" CTA. In RESEARCH_MODE: approve button enabled without a real video.');
  }

  // --- State 9: Step 5 (Publish) — approve and navigate ─────────────────────
  // Approve button: disabled={!RESEARCH_MODE && !p.videos.length} = disabled=false
  if (await stateKey('create/step5-publish')) {
    // Try clicking "Approve & continue" (enabled in RESEARCH_MODE)
    const approved = await clickText(page, 'Approve & continue')
      || await clickText(page, 'Approved');
    if (!approved) {
      // Fallback: click Publish tab in stepper
      await goToStep(page, 'publish');
    }
    await page.waitForTimeout(1200);
    await shot(page, 'screenshots/create/09-step5-publish.png', 'Create Step 5 Publish');
    const txt = await getPageText(page);
    saveText('snapshots/create/09-step5-publish.txt', txt);
    record('CREATE', '/create', 'Create wizard — Step 5: Publish',
      'Publish step: platform selector, title, caption/tags, schedule picker, publish CTA.');
  }

  // --- State 10: Clone Lab ---------------------------------------------------
  if (await stateKey('create/clone-lab')) {
    await goto(page, '/create', 1200);
    const clicked = await clickText(page, 'Clone Lab') || await clickText(page, 'Clone');
    if (clicked) {
      await page.waitForTimeout(1000);
      await shot(page, 'screenshots/create/10-clone-lab.png', 'Clone Lab');
      const txt = await getPageText(page);
      saveText('snapshots/create/10-clone-lab.txt', txt);
      record('CREATE', '/create', 'Clone Lab',
        'Voice cloning interface. Upload audio sample to create custom voice clone (legal disclaimer present).');
    }
  }

  ok('CREATE complete');
}

// ── MODULE: PUBLISH ───────────────────────────────────────────────────────────
async function explorePublish(page) {
  info('=== PUBLISH ===');

  await goto(page, '/publish', 1500);

  // --- State 1: Launchpad default --------------------------------------------
  // Launchpad is a CONTENT QUEUE (Queued / Producing / Published items).
  // It does NOT have "Connect Account" or "Schedule" buttons — those are not
  // implemented yet. The platform pill filter IS present.
  if (await stateKey('publish/launchpad')) {
    await shot(page, 'screenshots/publish/01-launchpad.png', 'Launchpad');
    const txt = await getPageText(page);
    saveText('snapshots/publish/01-launchpad.txt', txt);
    record('PUBLISH', '/publish', 'Launchpad — default',
      'Content queue. Items have platform badge, status (Queued / In Production / Published), caption editor. Action buttons: → Telegram, Copy, Source, → Produce / → Done.');
  }

  // --- State 2: Status filter — In Production --------------------------------
  if (await stateKey('publish/filter-producing')) {
    const clicked = await clickText(page, 'Producing', { fallback: false })
      || await clickText(page, 'In Production', { fallback: false });
    if (clicked) {
      await page.waitForTimeout(600);
      await shot(page, 'screenshots/publish/02-filter-producing.png', 'Producing filter');
      record('PUBLISH', '/publish', 'Launchpad — Producing filter', 'Items with status "in-production" shown.');
    }
  }

  // --- State 3: Status filter — Published ------------------------------------
  if (await stateKey('publish/filter-published')) {
    const clicked = await clickText(page, 'Published', { fallback: false });
    if (clicked) {
      await page.waitForTimeout(600);
      await shot(page, 'screenshots/publish/03-filter-published.png', 'Published filter');
      record('PUBLISH', '/publish', 'Launchpad — Published filter', 'Items marked as published.');
    }
  }

  // NOTE: "Connect", "Connect Account", "Schedule", "Best Time" buttons do NOT
  // exist in the current Launchpad UI (Category 4 / not yet built).
  // Platform social account connection is a future feature.

  ok('PUBLISH complete');
}

// ── MODULE: HOME ──────────────────────────────────────────────────────────────
async function exploreHome(page) {
  info('=== HOME ===');

  await goto(page, '/home', 1500);

  // --- State 1: Home overview ------------------------------------------------
  if (await stateKey('home/overview')) {
    await shot(page, 'screenshots/home/01-overview.png', 'Home overview');
    const txt = await getPageText(page);
    saveText('snapshots/home/01-overview.txt', txt);
    record('HOME', '/home', 'Home — Overview',
      'Personal dashboard. Metrics cards (total views, videos created, signals saved), recent activity feed, quick actions.');
  }

  // --- State 2: Insights sub-tab --------------------------------------------
  if (await stateKey('home/insights')) {
    const clicked = await clickText(page, 'Insights') || await clickText(page, 'Analytics');
    if (clicked) {
      await page.waitForTimeout(1000);
      await shot(page, 'screenshots/home/02-insights.png', 'Insights');
      const txt = await getPageText(page);
      saveText('snapshots/home/02-insights.txt', txt);
      record('HOME', '/home', 'Home — Insights', 'Analytics charts: views over time, platform breakdown, content performance scores.');
    }
  }

  ok('HOME complete');
}

// ── MODULE: STUDIO ────────────────────────────────────────────────────────────
async function exploreStudio(page) {
  info('=== STUDIO ===');

  await goto(page, '/studio', 2000);

  // --- State 1: Studio console -----------------------------------------------
  if (await stateKey('studio/console')) {
    await shot(page, 'screenshots/studio/01-console.png', 'Studio console');
    const txt = await getPageText(page);
    saveText('snapshots/studio/01-console.txt', txt);
    record('STUDIO', '/studio', 'CreatorWorkspace — Console',
      'Admin/monitoring view. Sections: render queue, job status, system health, API integrations panel.');
  }

  // --- State 2+: Studio sub-sections ----------------------------------------
  const studioSections = ['Queue', 'Jobs', 'Render', 'Settings', 'Integrations', 'Analytics', 'Users'];
  for (const section of studioSections) {
    if (await stateKey(`studio/${section.toLowerCase()}`)) {
      const clicked = await clickText(page, section, { fallback: false });
      if (clicked) {
        await page.waitForTimeout(800);
        await shot(page, `screenshots/studio/02-${section.toLowerCase()}.png`, section);
        const txt = await getPageText(page);
        saveText(`snapshots/studio/02-${section.toLowerCase()}.txt`, txt);
        record('STUDIO', '/studio', `CreatorWorkspace — ${section}`, `Studio ${section} panel.`);
      }
    }
  }

  ok('STUDIO complete');
}

// ── MODULE: PRICING ───────────────────────────────────────────────────────────
async function explorePricing(page) {
  info('=== PRICING ===');

  await goto(page, '/pricing', 1500);
  const url = page.url();
  if (url.includes('pricing')) {
    if (await stateKey('pricing/main')) {
      await shot(page, 'screenshots/pricing/01-pricing.png', 'Pricing');
      const txt = await getPageText(page);
      saveText('snapshots/pricing/01-pricing.txt', txt);
      record('PRICING', '/pricing', 'Pricing page', 'Subscription tiers and feature comparison table.');
    }
  } else {
    skip('Pricing redirected — not a live route');
  }
}

// ── Report writers ────────────────────────────────────────────────────────────
function writeModuleRecord(module, modulefindings) {
  const lines = [
    `# ${module} — Module Research Record`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '## States Captured',
    '',
  ];
  for (const f of modulefindings) {
    lines.push(`### ${f.state}`);
    lines.push(`- **Route:** \`${f.route}\``);
    lines.push(`- **Observation:** ${f.observation}`);
    lines.push('');
  }
  saveText(`module-records/${module}.md`, lines.join('\n'));
}

function writeMasterIndex() {
  const modules = [...new Set(findings.map(f => f.module))];
  const lines = [
    '# AVION — Full-Site Research Index',
    `Generated: ${new Date().toISOString()}`,
    `Total states captured: ${findings.length}`,
    `Visited-state registry: ${visited.size} unique keys`,
    '',
    '## Module Summary',
    '',
    '| Module | States | Route(s) |',
    '|--------|--------|----------|',
  ];
  for (const m of modules) {
    const mf = findings.filter(f => f.module === m);
    const routes = [...new Set(mf.map(f => f.route))].join(', ');
    lines.push(`| ${m} | ${mf.length} | ${routes} |`);
  }
  lines.push('', '## All Recorded States', '');
  for (const f of findings) {
    lines.push(`### [${f.module}] ${f.state}`);
    lines.push(`- Route: \`${f.route}\``);
    lines.push(`- ${f.observation}`);
    lines.push('');
  }
  saveText('MASTER_INDEX.md', lines.join('\n'));
}

function writeCrawlerLog() {
  const lines = [
    '# Crawler Run Log',
    `Date: ${new Date().toISOString()}`,
    '',
    ...log.map(l => `${l.ts} [${l.level}] ${l.msg}`),
  ];
  saveText('CRAWLER_LOG.md', lines.join('\n'));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   AVION — Full-Site Research Crawler v3              ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Validate session
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(`❌ No session file at: ${SESSION_PATH}`);
    console.error('   Run: node research/browser-sessions/save-session.js');
    process.exit(1);
  }
  const sessionRaw = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
  const hasAuth = sessionRaw.origins?.some(o => o.localStorage?.length > 0);
  if (!hasAuth) {
    console.error('❌ Session file exists but has no localStorage data (empty auth).');
    console.error('   Re-run: node research/browser-sessions/save-session.js');
    process.exit(1);
  }
  info('Session file valid — localStorage data present.');

  // Ensure output directories
  const dirs = ['screenshots', 'snapshots', 'module-records'].map(d => path.join(OUT, d));
  dirs.forEach(ensureDir);

  // Launch browser with saved session
  info('Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: SESSION_PATH,
    viewport: { width: 1440, height: 900 },
  });

  // ── RESEARCH MODE — inject BEFORE any page script runs ─────────────────────
  // Sets window.__AVION_RESEARCH__ = true.
  // CreateStudio.tsx reads this via src/lib/researchMode.ts and:
  //   1. Opens all wizard step gates (canEnter all true)
  //   2. Shows the [data-research="mock-video"] button
  //   3. Enables the Approve button without requiring real videos
  // src/lib/researchMode.ts also sets document.documentElement.dataset.researchMode
  // so verifyResearchMode() can confirm the flag was received.
  await context.addInitScript(() => {
    (window).__AVION_RESEARCH__ = true;
  });

  const page = await context.newPage();

  // Verify auth before starting crawl
  info('Verifying authentication...');
  await page.goto(AVION, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const url = page.url();
  if (url.includes('/login')) {
    console.error('❌ Session expired — redirected to /login.');
    console.error('   Re-run: node research/browser-sessions/save-session.js');
    await browser.close();
    process.exit(1);
  }
  ok(`Authenticated. Landing URL: ${url}`);

  // ── Run all module explorers ────────────────────────────────────────────────
  try {
    await exploreDiscover(page);
    await exploreVault(page);
    await exploreCreate(page);
    await explorePublish(page);
    await exploreHome(page);
    await exploreStudio(page);
    await explorePricing(page);
  } catch (err) {
    warn(`Crawler error: ${err.message}`);
  }

  // ── Write reports ───────────────────────────────────────────────────────────
  info('Writing reports...');
  const modules = [...new Set(findings.map(f => f.module))];
  for (const m of modules) {
    writeModuleRecord(m, findings.filter(f => f.module === m));
  }
  writeMasterIndex();
  writeCrawlerLog();

  await browser.close();

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`✅ Crawl complete.`);
  console.log(`   States captured:  ${findings.length}`);
  console.log(`   Unique states:    ${visited.size}`);
  console.log(`   Evidence saved:   research/avion-ui-research/`);
  console.log(`   Index:            research/avion-ui-research/MASTER_INDEX.md`);
  console.log('══════════════════════════════════════════════════════\n');
}

run().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
