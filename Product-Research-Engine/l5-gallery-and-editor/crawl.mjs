import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { sites } from './sites.mjs';
import { AUTH, OUT, atomicJSON, loadJSON, writeMaster, safeURL, inScope, robotsAllowed, extractDOM, candidates, delay, readOnlyRequest } from './core.mjs';

const args = process.argv.slice(2);
function value(flag, fallback) { const n = args.indexOf(flag); return n < 0 ? fallback : args[n + 1]; }
function bound(flag, fallback, min, max) {
  const n = Number(value(flag, fallback));
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${flag}: expected ${min}..${max}`);
  return n;
}
if (args.includes('--help') || !args.length) {
  console.log('node crawl.mjs <site|all> [--pages 8] [--scrolls 3] [--delay-ms 1200] [--auth] [--fresh]\nDefault: public-only, headed Chrome, one page, no media downloads. --auth requires a prior gated public result.');
  process.exit(0);
}
const ids = args[0] === 'all' ? Object.keys(sites) : [args[0]];
if (ids.some(id => !sites[id])) throw new Error('Unknown site');
const pageLimit = bound('--pages', 8, 1, 100);
const scrollLimit = bound('--scrolls', 3, 0, 12);
const gap = bound('--delay-ms', 1200, 1000, 30000);
const useAuth = args.includes('--auth');
const evidenceFile = path.join(OUT, 'url_evidence.json');
fs.mkdirSync(OUT, { recursive: true });
// Fail closed on simultaneous runs; do not race shared output/checkpoints.
const lockPath = path.join(OUT, 'crawl.lock');
let lock;
try { lock = fs.openSync(lockPath, 'wx'); } catch { throw new Error('Another crawl or stale crawl.lock exists. Verify no crawler is running before removing its lock.'); }
let browser;
try {
  const evidence = loadJSON(evidenceFile, []);
  const known = new Set(evidence.map(r => r.site + '|' + r.url));
  browser = await chromium.launch({ channel: 'chrome', headless: false });
  for (const id of ids) {
    const site = sites[id];
    const reportFile = path.join(OUT, `${id}.status.json`);
    const publicReport = loadJSON(path.join(OUT, `${id}.public.json`), null);
    if (useAuth && publicReport?.status !== 'auth-required') {
      console.log(`${id}: auth skipped; first establish that the public gallery is gated.`); continue;
    }
    const session = path.join(AUTH, `${id}.json`);
    if (useAuth && !fs.existsSync(session)) {
      console.log(`${id}: manual login needed. Run python save_auth.py ${id}`); continue;
    }
    const checkpointFile = path.join(OUT, `${id}.${useAuth ? 'auth' : 'public'}.checkpoint.json`);
    const checkpoint = args.includes('--fresh') ? null : loadJSON(checkpointFile, null);
    const queue = checkpoint?.queue || [site.seed];
    const visited = new Set(checkpoint?.visited || []);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 },
      acceptDownloads: false, serviceWorkers: 'block', ...(useAuth ? { storageState: session } : {}) });
    const report = { site: id, mode: useAuth ? 'authenticated' : 'public', startedAt: new Date().toISOString(),
      status: 'complete', pages: [], newURLs: 0, blockedMediaRequests: 0, limitations: ['DOM-visible URLs only; no canvas/API-backed extraction; URL collection is not rights clearance.'] };
    let stop = null;
    // All operations are navigation/scroll. Block media transfers and suspicious
    // mutation endpoints, including GraphQL mutations; do not capture payloads.
    await context.route('**/*', async route => {
      const req = route.request(); const u = new URL(req.url());
      if (req.isNavigationRequest() && req.frame() === req.frame().page().mainFrame() && !inScope(u.href, site)) {
        stop = /login|signin|sign-in|\/auth(?:\/|$)|accounts\.google/i.test(u.href) ? 'auth-required' : 'redirect-out-of-scope';
        return route.abort();
      }
      if (['media', 'image', 'font'].includes(req.resourceType()) || /\.(mp4|webm|m3u8|mpd|m4s|ts)(?:$|\?)/i.test(u.href)) {
        report.blockedMediaRequests++; return route.abort();
      }
      if (!readOnlyRequest(req.method(), u.href, req.postData() || '')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on('response', response => {
      if ([403, 429].includes(response.status()) && site.hosts.includes(new URL(response.url()).hostname))
        stop = response.status() === 429 ? 'rate-limited' : 'access-blocked';
    });
    const robotsCache = new Map();
    async function allowed(url) {
      const origin = new URL(url).origin;
      if (!robotsCache.has(origin)) {
        await delay(gap);
        try {
          const r = await context.request.get(origin + '/robots.txt', { timeout: 15000, maxRedirects: 0 });
          robotsCache.set(origin, r.status() === 404 ? '' : r.ok() ? await r.text() : null);
          await r.dispose();
        } catch { robotsCache.set(origin, null); }
      }
      const policy = robotsCache.get(origin);
      return policy !== null && robotsAllowed(policy, url);
    }
    try {
      let count = 0;
      while (queue.length && count < pageLimit && !stop) {
        const url = queue.shift();
        if (visited.has(url) || !inScope(url, site)) continue;
        if (!await allowed(url)) { stop = 'robots-blocked-or-unavailable'; queue.unshift(url); break; }
        await delay(gap);
        let response;
        try { response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 }); }
        catch { stop ||= 'navigation-failed'; queue.unshift(url); break; }
        if (stop) { queue.unshift(url); break; }
        if (!response?.ok()) { stop = 'http-error'; queue.unshift(url); break; }
        await delay(gap);
        const body = (await page.locator('body').innerText({ timeout: 7000 }).catch(() => '')).slice(0, 20000);
        if (/verify (you are|you're) human|unusual traffic|captcha|access denied|checking your browser/i.test(body)) {
          stop = 'manual-challenge'; queue.unshift(url); break;
        }
        let pageCount = 0; let roundsWithoutNew = 0;
        for (let round = 0; round <= scrollLimit && !stop; round++) {
          const found = candidates(await extractDOM(page), page.url(), site);
          let added = 0;
          for (const item of found.videos) {
            const key = id + '|' + item.url;
            if (!known.has(key)) {
              known.add(key); evidence.push({ ...item, site: id, sourcePage: safeURL(page.url()),
                observedAt: new Date().toISOString(), access: useAuth ? 'authenticated-gallery' : 'public', rights: 'not-verified' });
              added++; report.newURLs++; pageCount++;
            }
          }
          for (const next of found.next) if (!visited.has(next) && !queue.includes(next) && next !== url && queue.length < 200) queue.push(next);
          atomicJSON(evidenceFile, evidence); writeMaster(evidence);
          roundsWithoutNew = added ? 0 : roundsWithoutNew + 1;
          if (roundsWithoutNew >= 2 || round === scrollLimit) break;
          await page.mouse.wheel(0, 650); await delay(gap);
        }
        // Login buttons alone do NOT mean a public gallery is gated.
        if (pageCount === 0 && /(?:sign in|log in|login).{0,60}(?:to (?:view|continue|access|see)|required)/i.test(body)) {
          stop = 'auth-required'; queue.unshift(url); break;
        }
        visited.add(url); count++;
        report.pages.push({ url: safeURL(page.url()), newURLs: pageCount });
        atomicJSON(checkpointFile, { queue, visited: [...visited] });
      }
      report.status = stop || (queue.length ? 'page-budget-reached' : report.newURLs ? 'complete' : 'no-new-video-urls');
    } finally {
      atomicJSON(checkpointFile, { queue, visited: [...visited] });
      report.finishedAt = new Date().toISOString();
      atomicJSON(reportFile, report);
      if (!useAuth) atomicJSON(path.join(OUT, `${id}.public.json`), report);
      await context.close();
      console.log(`${id}: ${report.status}; ${report.newURLs} new URLs; ${report.pages.length} pages. See output/${id}.status.json`);
    }
  }
  console.log(`Master: ${writeMaster(evidence)} unique URLs. No media was saved.`);
} finally {
  if (browser) await browser.close();
  fs.closeSync(lock); fs.unlinkSync(lockPath);
}
