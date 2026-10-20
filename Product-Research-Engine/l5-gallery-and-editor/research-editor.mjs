import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { chromium } from 'playwright';
import { uiSites } from './ui-sites.mjs';
import { AUTH, OUT, atomicJSON, loadJSON, robotsAllowed } from './core.mjs';
import { PANELS, TOPICS, redact, digest, safeLabel, researchURL, displayURL, allowRequest, coverage, makeReport, inspectPage, openPanel } from './research-core.mjs';

const args = process.argv.slice(2);
const value = (flag, fallback) => { const i = args.indexOf(flag); return i < 0 ? fallback : args[i + 1]; };
if (!args.length || args.includes('--help')) {
  console.log('node research-editor.mjs <invideo-editor|veed> --url <editor-url> [--auth] [--minutes 15] [--max-states 60]\nRead-only UI research. Owner-guided screenshots + allowlisted panel navigation; no generation or media downloads.\nUse --catalog-selector <CSS> for inspected visible tile labels; --scroll-selector <CSS> for an inspected catalogue container.\nCommands: open <panel>, capture <topic> <state>, scan <topic> <state>, note <topic> <observation>, status, quit.');
  process.exit(0);
}
const id = args[0], site = uiSites[id];
if (!site) throw new Error('Unknown UI research site. Gallery targets are separate.');
const url = researchURL(value('--url', site.seed), site);
function bound(flag, fallback, min, max) {
  const n = Number(value(flag, fallback));
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${flag}: ${min}..${max}`);
  return n;
}
const maxStates = bound('--max-states', 60, 1, 200), minutes = bound('--minutes', 15, 1, 60);
const maxScrolls = bound('--scrolls', 8, 1, 20);
const catalogueSelector = value('--catalog-selector', null), scrollSelector = value('--scroll-selector', null);
const folder = path.join(OUT, 'editor-research', id);
fs.mkdirSync(folder, { recursive: true });
const lockPath = path.join(folder, 'research.lock');
const lock = fs.openSync(lockPath, 'wx'); // No parallel writes; owner resolves stale lock after checking processes.
const recordsFile = path.join(folder, 'evidence.json');
const records = loadJSON(recordsFile, []);
const counts = { requests: 0, sockets: 0 };
const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
let browser, timer, page, stop = false, captured = 0;
const known = new Map(records.filter(r => r.status === 'captured').map(r => [r.state + ':' + r.hash, r]));
function flush() {
  atomicJSON(recordsFile, records);
  atomicJSON(path.join(folder, 'coverage.json'), coverage(records));
  fs.writeFileSync(path.join(folder, 'REPORT.md'), makeReport(records, counts));
  const entries = new Map();
  for (const r of records) for (const label of r.ui?.catalogue || []) {
    const key = r.topic + ':' + label;
    if (!entries.has(key)) entries.set(key, { topic: r.topic, label, evidence: r.screenshot, status: 'visible-label-not-tested' });
  }
  atomicJSON(path.join(folder, 'catalogue.json'), [...entries.values()]);
}
try {
  const state = path.join(AUTH, `${id}.json`);
  if (args.includes('--auth') && !fs.existsSync(state)) throw new Error(`Login yourself first: python save_auth.py ${id}`);
  browser = await chromium.launch({ channel: 'chrome', headless: false, chromiumSandbox: true });
  const context = await browser.newContext({ acceptDownloads: false, serviceWorkers: 'block',
    viewport: { width: 1440, height: 900 }, ...(args.includes('--auth') ? { storageState: state } : {}) });
  // Do not allow a stream to become an unguarded mutation channel.
  await context.routeWebSocket('**/*', socket => { counts.sockets++; socket.close(); });
  await context.route('**/*', route => {
    const req = route.request();
    if (req.isNavigationRequest() && req.frame() === req.frame().page().mainFrame()) {
      try { researchURL(req.url(), site); } catch { counts.requests++; return route.abort(); }
    }
    if (!allowRequest(req.method(), req.url(), req.resourceType())) { counts.requests++; return route.abort(); }
    return route.continue();
  });
  context.on('page', p => { if (page && p !== page) void p.close(); });
  page = await context.newPage();
  page.on('response', r => {
    if ([403, 429].includes(r.status()) && site.hosts.includes(new URL(r.url()).hostname)) {
      stop = true; console.log('Access/rate limit encountered; stopping, no retry.'); terminal.close();
    }
  });
  const policy = await context.request.get(new URL('/robots.txt', url).href, { timeout: 15000, maxRedirects: 0 });
  const allowed = policy.status() === 404 || policy.ok() && robotsAllowed(await policy.text(), url);
  await policy.dispose();
  if (!allowed) throw new Error('Robots policy denies research or is unavailable. Do not bypass.');
  timer = setTimeout(() => { stop = true; console.log('Time budget reached; evidence saved.'); terminal.close(); void browser?.close(); }, minutes * 60000);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  console.log('No screenshots yet. Use an approved scratch project. Hide private account details before capture.');
  console.log('Safe read-only requests only; sockets/media/mutations blocked. Some editors will not load: record the gap, do not disable safeguards.');
  console.log('Commands: open media | capture media library | scan effects blur | note markers needs range-marker check | status | quit');
  console.log('Panels: ' + Object.keys(PANELS).join(', '));
  async function capture(topic, stateName) {
    if (stop || captured >= maxStates) throw new Error('Capture budget reached.');
    safeLabel(stateName);
    const before = await inspectPage(page, catalogueSelector);
    if (before.loginVisible || /login|signup|signin|\/auth\b/i.test(page.url())) throw new Error('Login screen: no recording.');
    const ui = JSON.parse(JSON.stringify(before, (_k, v) => typeof v === 'string' ? redact(v) : v));
    const hash = digest({ ui, page: displayURL(page.url()) });
    const previous = known.get(stateName + ':' + hash);
    if (previous && !before.canvasCount) { console.log(`Unchanged: ${stateName}; reused ${previous.screenshot}`); return false; }
    const stamp = Date.now() + '-' + cryptoId();
    const screenshot = `${stateName}-${stamp}.png`;
    // Mask common credential/account fields. Owner must inspect images before sharing;
    // canvas content cannot be automatically redacted or semantically inventoried.
    await page.screenshot({ path: path.join(folder, screenshot), fullPage: false,
      mask: [page.locator('input,textarea,[contenteditable="true"],[autocomplete="username"],[data-testid*="avatar"],[aria-label*="account" i]')], maskColor: '#202020' });
    const record = { topic, state: stateName, status: 'captured', screenshot, hash, ui,
      source: displayURL(page.url()), observedAt: new Date().toISOString(),
      limitations: ['Observed UI, not a functional test', ...(before.canvasCount ? ['Canvas/stream: inspect screenshot manually; catalogue not comprehensive'] : []),
        ...(before.iframeCount ? ['Iframe interiors not inventoried'] : []), ...(!catalogueSelector ? ['No verified catalogue selector supplied'] : [])] };
    records.push(record); known.set(stateName + ':' + hash, record); captured++; flush();
    console.log(`Captured ${stateName}; ${ui.catalogue.length} visible catalogue labels. ${captured}/${maxStates}.`);
    return true;
  }
  while (!stop && captured < maxStates) {
    let command; try { command = (await terminal.question('research> ')).trim(); } catch { break; }
    const [action, topic, ...rest] = command.split(/\s+/);
    if (action === 'quit') break;
    if (action === 'status') { console.table(coverage(records).map(({ topic, status }) => ({ topic, status }))); continue; }
    if (!TOPICS.includes(topic)) { console.log('Choose topic: ' + TOPICS.join(', ')); continue; }
    try {
      if (action === 'open') {
        const before = digest(await inspectPage(page, catalogueSelector));
        const result = await openPanel(page, topic);
        if (result.status === 'opened-unverified') {
          await page.waitForTimeout(1200);
          const after = digest(await inspectPage(page, catalogueSelector));
          if (before === after) console.log('No observable DOM change. Inspect manually; no retry.');
          else console.log('DOM changed; inspect panel, then capture it explicitly.');
        } else { records.push({ topic, state: topic, ...result }); flush(); console.log(result.reason); }
      } else if (action === 'capture') await capture(topic, rest[0] || topic);
      else if (action === 'scan') {
        if (!catalogueSelector || !scrollSelector) throw new Error('Scan needs verified --catalog-selector and --scroll-selector; no guessed container scrolling.');
        const container = page.locator(scrollSelector);
        if (await container.count() !== 1) throw new Error('Scroll container is not unique.');
        let last = '', same = 0;
        for (let i = 0; i < maxScrolls && !stop && captured < maxStates; i++) {
          await capture(topic, `${rest[0] || topic}-${i + 1}`);
          const labels = digest((await inspectPage(page, catalogueSelector)).catalogue);
          same = labels === last ? same + 1 : 0; last = labels;
          if (same >= 2) break;
          const moved = await container.evaluate(el => { const was = el.scrollTop; el.scrollBy(0, Math.max(200, el.clientHeight * .8)); return el.scrollTop !== was; });
          if (!moved) break;
          await page.waitForTimeout(1200);
        }
      } else if (action === 'note') {
        records.push({ topic, state: topic + '-note', status: 'owner-observation-unverified', reason: redact(rest.join(' ')) }); flush();
      } else console.log('Unknown command; no action.');
    } catch (error) { console.log('Stopped this action: ' + redact(error.message)); }
  }
} finally {
  clearTimeout(timer); terminal.close(); flush();
  if (browser) await browser.close();
  fs.closeSync(lock); fs.unlinkSync(lockPath); // Only this process's lock, never research evidence.
  console.log('Report: ' + path.join(folder, 'REPORT.md'));
}
function cryptoId() { return Math.random().toString(36).slice(2, 8); }
