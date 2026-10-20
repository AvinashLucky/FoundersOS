/**
 * crawl.js — Unified competitor research runner.
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   node research/explorers/crawl.js <competitor-id> [--public] [--auth] [--all] [--network]
 *
 * Examples:
 *   node research/explorers/crawl.js invideo --public
 *   node research/explorers/crawl.js invideo --auth
 *   node research/explorers/crawl.js invideo --auth --network   ← Layer 3 capture
 *   node research/explorers/crawl.js invideo --all
 *   node research/explorers/crawl.js heygen --all --network
 *
 * Output structure (5-layer intelligence):
 *   research/competitors/<id>/
 *     authenticated/
 *       screenshots/           ← Layer 1: UI surface
 *       snapshots/             ← Layer 1: DOM structure
 *       network/               ← Layer 3: Observable network behavior
 *         requests.json        ← All API requests observed
 *         endpoints.json       ← Deduplicated endpoint map
 *         workflow-sequences/  ← Per-workflow request chains
 *     intelligence/            ← Synthesis layer docs (written separately)
 *       L1-ui-map.md
 *       L2-behavior-map.md
 *       L3-network-map.md
 *       L4-content-intelligence.md
 *       L5-synthesis.md
 *
 * Adding a new competitor:
 *   1. Create research/competitors/<id>/config.js
 *   2. Run: node research/explorers/crawl.js <id> --public
 *   3. Login: node research/explorers/save-session.js <id>
 *   4. Run: node research/explorers/crawl.js <id> --auth --network
 * ─────────────────────────────────────────────────────────────────────────────
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

import {
  createLogger, createCapture, createIndex,
  goto, dismissOverlays, clickText, clickSel,
  probeVisible, discoverRoutes, probeLocks,
  launchBrowser, writeLogs,
} from '../lib/crawler-core.js';

import { validateSession } from '../lib/session-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../');

// ─── Args ────────────────────────────────────────────────────────────────────
const [,, competitorId, ...flags] = process.argv;
const runPublic    = flags.includes('--public')  || flags.includes('--all');
const runAuth      = flags.includes('--auth')    || flags.includes('--all');
const captureNet   = flags.includes('--network') || flags.includes('--all');

if (!competitorId || (!runPublic && !runAuth)) {
  console.error('\nUsage: node research/explorers/crawl.js <id> [--public] [--auth] [--all] [--network]\n');
  console.error('  --public    Run public (unauthenticated) sections only');
  console.error('  --auth      Run authenticated sections only');
  console.error('  --all       Run both public and authenticated');
  console.error('  --network   Enable Layer 3 network capture (API endpoints, request chains)\n');
  process.exit(1);
}

// ─── Load Competitor Config ──────────────────────────────────────────────────
const configPath = path.join(ROOT, 'research/competitors', competitorId, 'config.js');
if (!fs.existsSync(configPath)) {
  console.error(`\n❌ No config found at: ${configPath}`);
  console.error(`   Create research/competitors/${competitorId}/config.js\n`);
  process.exit(1);
}

const { default: config } = await import(pathToFileURL(configPath).href);

// ─── Paths ───────────────────────────────────────────────────────────────────
const baseOut     = path.join(ROOT, 'research/competitors', competitorId);
const authOut     = path.join(baseOut, 'authenticated');
const networkOut  = path.join(authOut, 'network');
const intelOut    = path.join(baseOut, 'intelligence');
const sessionPath = path.join(ROOT, 'research/browser-sessions', `${competitorId}.json`);

// ─── Layer 3: Network Capture ─────────────────────────────────────────────────
// Instruments page to record observable browser-side API traffic.
// ONLY records what the authenticated browser naturally sends/receives.
// Does NOT bypass auth, extract secrets, or access private infrastructure.
// Redacts cookies, auth tokens, API keys automatically.

const REDACT_HEADERS = new Set([
  'cookie', 'authorization', 'x-auth-token', 'x-api-key', 'x-session-token',
  'x-access-token', 'bearer', 'set-cookie', 'x-csrf-token',
]);

const SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
  '.css', '.map',
]);

function shouldSkipRequest(url) {
  try {
    const u = new URL(url);
    const ext = u.pathname.slice(u.pathname.lastIndexOf('.')).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) return true;
    // Skip analytics/tracking
    const skipHosts = ['google-analytics', 'googletagmanager', 'segment.io', 'sentry.io',
      'amplitude.com', 'mixpanel.com', 'intercom.io', 'hotjar.com', 'clarity.ms',
      'facebook.com/tr', 'doubleclick.net', 'ads.'];
    return skipHosts.some(h => u.hostname.includes(h) || u.href.includes(h));
  } catch { return false; }
}

function redactHeaders(headers = {}) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = REDACT_HEADERS.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return out;
}

function createNetworkCapture(netDir) {
  fs.mkdirSync(netDir, { recursive: true });
  const requests  = [];   // all observable requests
  const endpoints = {};   // deduplicated: method+path → {count, examples}

  return {
    attach(page) {
      page.on('request', req => {
        const url = req.url();
        if (shouldSkipRequest(url)) return;
        const method = req.method();
        const headers = redactHeaders(req.headers());
        let postData = null;
        try {
          const raw = req.postData();
          if (raw) {
            // Redact known secret fields from bodies
            postData = raw
              .replace(/"(password|token|secret|api_key|apiKey|access_token|refresh_token)":\s*"[^"]*"/g,
                       '"$1":"[REDACTED]"')
              .slice(0, 2000);
          }
        } catch {}

        const entry = {
          ts: Date.now(),
          method,
          url,
          resourceType: req.resourceType(),
          headers,
          postData,
          initiator: req.frame()?.url() || null,
        };
        requests.push(entry);

        // Endpoint deduplication — path without query/hash
        let key = '';
        try {
          const u = new URL(url);
          // Normalize dynamic IDs: /api/project/abc123 → /api/project/:id
          const normPath = u.pathname.replace(/\/[a-f0-9-]{8,}(?=\/|$)/gi, '/:id')
                                     .replace(/\/\d+(?=\/|$)/g, '/:id');
          key = `${method} ${u.origin}${normPath}`;
        } catch { key = `${method} ${url.slice(0, 80)}`; }

        if (!endpoints[key]) {
          endpoints[key] = { method, count: 0, examples: [], purpose: '' };
        }
        endpoints[key].count++;
        if (endpoints[key].examples.length < 3) {
          endpoints[key].examples.push(url.slice(0, 200));
        }
      });
    },

    flush(label = 'session') {
      // Write raw requests
      const reqPath = path.join(netDir, `${label}-requests.json`);
      fs.writeFileSync(reqPath, JSON.stringify(requests.slice(0, 500), null, 2));

      // Write deduplicated endpoint map
      const epPath = path.join(netDir, 'endpoints.json');
      const sorted = Object.entries(endpoints)
        .sort(([,a],[,b]) => b.count - a.count)
        .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});
      fs.writeFileSync(epPath, JSON.stringify(sorted, null, 2));

      // Write human-readable network map
      const mapLines = [
        `# Layer 3 — Network Map: ${config.name}`,
        `**Captured**: ${new Date().toISOString()}`,
        `**Total requests observed**: ${requests.length}`,
        `**Unique endpoints**: ${Object.keys(endpoints).length}`,
        '',
        '## Observable API Endpoints',
        '',
        '| Method | Endpoint Pattern | Calls | Purpose |',
        '|--------|-----------------|-------|---------|',
      ];
      for (const [ep, data] of Object.entries(sorted)) {
        mapLines.push(`| ${data.method} | \`${ep.replace(/^[A-Z]+ /, '')}\` | ${data.count} | ${data.purpose || 'NOT CLASSIFIED'} |`);
      }
      mapLines.push('', '## Evidence Standard', '');
      mapLines.push('All endpoints are OBSERVED FACTS from authenticated browser session.');
      mapLines.push('Auth tokens and cookies are REDACTED. No private server infrastructure accessed.');
      mapLines.push('Endpoint patterns are normalized (`:id` replaces dynamic segments).');
      mapLines.push('');
      mapLines.push('## Classification Key');
      mapLines.push('Classify each endpoint by inspecting the URL pattern and surrounding context:');
      mapLines.push('- **generation** — triggers AI generation job');
      mapLines.push('- **polling** — checks job/task status');
      mapLines.push('- **asset** — fetches generated output');
      mapLines.push('- **auth** — authentication/session');
      mapLines.push('- **account** — user profile/credits/billing');
      mapLines.push('- **config** — feature flags/settings');
      mapLines.push('- **analytics** — usage tracking');

      fs.writeFileSync(path.join(netDir, 'L3-network-map.md'), mapLines.join('\n'));

      console.log(`\n🌐 Network capture: ${requests.length} requests → ${Object.keys(endpoints).length} unique endpoints`);
      console.log(`   → ${reqPath}`);
      console.log(`   → ${epPath}`);
      return { requestCount: requests.length, endpointCount: Object.keys(endpoints).length };
    },

    reset() {
      requests.length = 0;
    },
  };
}

// ─── Run Sections Helper ──────────────────────────────────────────────────────
async function runSections(sections, toolkit) {
  const { log } = toolkit;
  for (const section of sections) {
    log.sec(`${section.id} — ${section.label}`);
    try {
      await section.run(toolkit);
    } catch (e) {
      log.warn(`Section "${section.id}" threw: ${e.message.slice(0, 100)}`);
    }
  }
}

// ─── Ensure intelligence/ stubs exist ────────────────────────────────────────
function ensureIntelligenceStubs(intelDir, competitorName) {
  fs.mkdirSync(intelDir, { recursive: true });

  const stubs = {
    'L1-ui-map.md': `# Layer 1 — UI Map: ${competitorName}\n**Status**: STUB — populate after crawl\n\n## Purpose\nComplete visible product surface map: every page, nav item, button, input, modal, state.\n\n## Coverage\n- [ ] Workspace / home\n- [ ] Primary navigation\n- [ ] Generation interfaces\n- [ ] Settings / account\n- [ ] Upgrade / paywall states\n- [ ] Empty states\n- [ ] Loading states\n- [ ] Error states\n\n## Elements\n*Populate from authenticated/snapshots/ after crawl.*\n`,
    'L1-ui-map.json': `{"competitor":"${competitorName}","status":"stub","elements":[],"pages":[],"modals":[]}\n`,
    'L2-behavior-map.md': `# Layer 2 — Behavior Map: ${competitorName}\n**Status**: STUB — populate after interaction testing\n\n## Purpose\nWhat happens when a real user operates the product. State transitions, not just labels.\n\n## Workflows to Document\n- [ ] Video generation: prompt → model → config → generate → result\n- [ ] Image generation: prompt → style → generate → result\n- [ ] Character/avatar workflow\n- [ ] Template/Director workflow\n- [ ] Export/download\n- [ ] Upgrade gate flow\n\n## Format\n\`\`\`\nSTATE_BEFORE → USER_ACTION → STATE_AFTER\n\`\`\`\n`,
    'L2-behavior-map.json': `{"competitor":"${competitorName}","status":"stub","workflows":[]}\n`,
    'L3-network-map.md': `# Layer 3 — Network Map: ${competitorName}\n**Status**: NOT CAPTURED — run with --network flag\n\n## How to Capture\n\`\`\`\nnode research/explorers/crawl.js ${competitorName.toLowerCase().replace(/[^a-z]/g, '')} --auth --network\n\`\`\`\n\n## Purpose\nObservable browser-side API traffic during authenticated usage.\nEndpoints, job creation, polling, asset delivery — the frontend/backend contract.\n\n## Evidence Standard\nAll endpoints must be OBSERVED FACTS. Tokens/cookies redacted.\n`,
    'L3-network-map.json': `{"competitor":"${competitorName}","status":"not_captured","endpoints":{}}\n`,
    'L4-content-intelligence.md': `# Layer 4 — Content Intelligence: ${competitorName}\n**Status**: PARTIAL — populate from crawl data\n\n## Purpose\nWhat they show users and how they package creation possibilities.\nFeatured content, templates, presets, styles, workflows, examples.\n\n## Sections\n### Featured / Trending Content\n*Populate from authenticated/snapshots/ gallery captures.*\n\n### Templates & Presets\n*List all observed templates, preset names, workflow types.*\n\n### Input → Output Patterns\n*What INPUT + WORKFLOW + MODEL = what OUTPUT?*\n\n### Trend Response System\nDoes the product have TREND → TEMPLATE → WORKFLOW → CREATION?\n- CONFIRMED / NOT OBSERVED / UNKNOWN\n`,
    'L4-content-intelligence.json': `{"competitor":"${competitorName}","status":"stub","templates":[],"presets":[],"featured_content":[],"workflow_patterns":[]}\n`,
    'L4-template-map.json': `{"competitor":"${competitorName}","status":"stub","templates":[]}\n`,
    'L5-synthesis.md': `# Layer 5 — Competitive Synthesis: ${competitorName}\n**Status**: PARTIAL — see REPORT.md for current analysis\n\n## 1. Product DNA\n*What is this product fundamentally optimized for?*\n\n## 2. Core Strengths (Top 10)\n*Populate after Layers 1-4 complete.*\n\n## 3. Core Weaknesses (Top 10)\n\n## 4. Hidden Strengths\n*Capabilities not obvious from homepage.*\n\n## 5. Workflow Advantages\n*What does it automate that others make users do manually?*\n\n## 6. Interaction Advantages\n*Which interactions feel exceptionally good?*\n\n## 7. AI Orchestration\n*Where does the system make decisions automatically?*\n\n## 8. Content Strategy\n*How does it teach users what they can create?*\n\n## 9. Trend Strategy\n*How does it exploit popular/viral creative formats?*\n\n## 10. Monetization Analysis\n*Credits, gates, upsells, subscription positioning.*\n`,
  };

  for (const [filename, content] of Object.entries(stubs)) {
    const p = path.join(intelDir, filename);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, content);
    }
  }
}

// ─── Public Phase ─────────────────────────────────────────────────────────────
if (runPublic && config.publicSections?.length) {
  console.log(`\n🔍 PUBLIC RESEARCH — ${config.name}`);
  const logLines = [];
  const log      = createLogger(logLines);
  const cap      = createCapture(path.join(baseOut, 'screenshots'), path.join(baseOut, 'snapshots'), log);
  const idx      = createIndex();
  const { browser, page } = await launchBrowser({ slowMo: 120 });

  const netCap = captureNet ? createNetworkCapture(networkOut) : null;
  if (netCap) { netCap.attach(page); log.info('🌐 Layer 3 network capture ACTIVE'); }

  const toolkit = { page, log, cap, idx, goto, dismissOverlays, clickText, clickSel, probeVisible, discoverRoutes, probeLocks, baseOut };

  await runSections(config.publicSections, toolkit);
  await browser.close();

  if (netCap) netCap.flush('public');

  writeLogs(baseOut, {
    competitorName: config.name,
    logLines,
    indexMd:  idx.toMarkdown(),
    ssDir:    path.join(baseOut, 'screenshots'),
    snDir:    path.join(baseOut, 'snapshots'),
    label:    'PUBLIC_CRAWL',
  });

  ensureIntelligenceStubs(intelOut, config.name);
}

// ─── Auth Phase ───────────────────────────────────────────────────────────────
if (runAuth && config.authSections?.length) {
  if (!fs.existsSync(sessionPath)) {
    console.error(`\n❌ No session file: ${sessionPath}`);
    console.error(`   Run first: node research/explorers/save-session.js ${competitorId}\n`);
    process.exit(1);
  }

  console.log(`\n🔐 AUTHENTICATED RESEARCH — ${config.name}${captureNet ? ' + 🌐 NETWORK CAPTURE' : ''}`);
  const logLines = [];
  const log      = createLogger(logLines);
  const cap      = createCapture(path.join(authOut, 'screenshots'), path.join(authOut, 'snapshots'), log);
  const idx      = createIndex();
  const { browser, page } = await launchBrowser({ sessionPath, slowMo: 100 });

  // ── Layer 3: Attach network listener before any navigation ─────────────────
  const netCap = captureNet ? createNetworkCapture(networkOut) : null;
  if (netCap) {
    netCap.attach(page);
    log.info('🌐 Layer 3 network capture ACTIVE — recording API traffic');
    log.info('   Auth tokens/cookies will be REDACTED in output');
  }

  // Validate session
  await goto(page, config.appUrl);
  if (!validateSession(page, config.loginUrlPatterns)) {
    log.warn('SESSION EXPIRED — redirected to login. Re-run: node research/explorers/save-session.js ' + competitorId);
    await browser.close();
    process.exit(1);
  }
  log.ok(`Session valid — authenticated at ${page.url()}`);

  const toolkit = {
    page, log, cap, idx, goto, dismissOverlays, clickText, clickSel,
    probeVisible, discoverRoutes, probeLocks,
    baseOut: authOut,
    // Expose network capture to sections that want to mark workflow boundaries
    netCap,
  };

  await runSections(config.authSections, toolkit);
  await browser.close();

  // Flush network data
  if (netCap) {
    const netStats = netCap.flush('auth');
    log.ok(`Network capture complete: ${netStats.requestCount} requests, ${netStats.endpointCount} endpoints`);
    // Copy L3 map into intelligence folder
    const l3src = path.join(networkOut, 'L3-network-map.md');
    const l3dst = path.join(intelOut, 'L3-network-map.md');
    fs.mkdirSync(intelOut, { recursive: true });
    if (fs.existsSync(l3src)) fs.copyFileSync(l3src, l3dst);
  }

  writeLogs(authOut, {
    competitorName: config.name,
    logLines,
    indexMd:  idx.toMarkdown(),
    ssDir:    path.join(authOut, 'screenshots'),
    snDir:    path.join(authOut, 'snapshots'),
    label:    'AUTHENTICATED_CRAWL',
  });

  ensureIntelligenceStubs(intelOut, config.name);

  if (captureNet) {
    console.log(`\n📁 Network data: research/competitors/${competitorId}/authenticated/network/`);
    console.log(`   → endpoints.json    (deduplicated API map)`);
    console.log(`   → auth-requests.json (all observed requests, tokens redacted)`);
    console.log(`   → L3-network-map.md  (human-readable — classify endpoints manually)`);
  }
}
