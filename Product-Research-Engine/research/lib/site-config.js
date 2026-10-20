/**
 * research/lib/site-config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds a full competitor config from ~15 lines of facts, so a new reference
 * no longer means copying 440 lines of someone else's crawl (the old _TEMPLATE
 * was a byte-for-byte copy of runway/config.js — copying it crawled Runway).
 *
 * Seam: returns the same shape crawl.js already reads
 *   { id, name, appUrl, loginUrlPatterns, publicSections, authSections }
 * and every section uses only the toolkit crawl.js passes in
 *   { page, log, cap, idx, goto, dismissOverlays }.
 *
 * Public pages only, by design: pages a normal visitor sees. No guessing of
 * private routes, no network capture here (see docs/FOUNDER-BRIEF.md §4).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PREFER = ['pricing', 'plans', 'course', 'courses', 'program', 'workshop',
  'features', 'product', 'how-it-works', 'about', 'enterprise', 'teams', 'templates'];

/** Same-site check that also accepts subdomains (www., app.). */
export function sameSite(href, baseUrl) {
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    const base = new URL(baseUrl).hostname.replace(/^www\./, '');
    return host === base || host.endsWith(`.${base}`);
  } catch { return false; }
}

/**
 * Picks which discovered links to visit: same site, not already planned, not a
 * login/legal/asset link, ranked by how many preferred words the URL contains.
 * Pure — unit-tested in research/lib/site-config.test.mjs.
 */
export function pickLinks(links, { baseUrl, planned = [], prefer = DEFAULT_PREFER, max = 6 }) {
  const skip = /(login|signin|sign-in|signup|sign-up|register|auth|privacy|terms|cookie|legal|careers|\.pdf$|\.zip$|#)/i;
  const seen = new Set(planned.map((p) => normalise(p)));
  const scored = [];
  for (const l of links) {
    if (!l?.href || !sameSite(l.href, baseUrl) || skip.test(l.href)) continue;
    const key = normalise(l.href);
    if (seen.has(key)) continue;
    seen.add(key);
    const lower = l.href.toLowerCase();
    const score = prefer.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0);
    scored.push({ ...l, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, max);
}

function normalise(u) {
  try { const x = new URL(u); return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/$/, '')}`; }
  catch { return String(u); }
}

async function capturePage({ page, cap, idx, goto, dismissOverlays }, { url, key, label, tag }) {
  await goto(page, url);
  await dismissOverlays(page);
  await page.waitForTimeout(1500);
  await cap.ss(page, `${key}-fold`, `${label} — above fold`);
  await cap.ssFull(page, `${key}-full`, `${label} — full page`);
  await cap.snap(page, key, `${label} — full text`);
  await cap.snapStructured(page, key);
  const meta = await page.evaluate(() => {
    const txt = (el) => el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? '';
    const uniq = (a) => [...new Set(a.filter(Boolean))];
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content ?? null,
      h1: uniq(Array.from(document.querySelectorAll('h1')).map(txt)).slice(0, 3),
      h2: uniq(Array.from(document.querySelectorAll('h2')).map(txt)).slice(0, 15),
      buttons: uniq(Array.from(document.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="button"]')).map(txt)).slice(0, 25),
      forms: document.querySelectorAll('form').length,
      inputs: uniq(Array.from(document.querySelectorAll('input, select, textarea')).map((i) => i.getAttribute('aria-label') || i.getAttribute('placeholder') || i.getAttribute('name') || i.getAttribute('type'))).slice(0, 20),
      videos: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
    };
  }).catch(() => ({}));
  await cap.snapJSON(`${key}-meta`, meta);
  idx.add(tag, label, page.url(), meta.title ? `Title: "${meta.title}"` : 'captured');
  return { url: page.url(), label, tag, ...meta };
}

/**
 * Writes a real Layer-1 UI map from what this run saw — pages, headings, controls,
 * forms, navigation. Machine-generated and labelled so; L2 (step-by-step workflows)
 * still needs a person or a logged-in run. Pure — tested.
 */
export function renderL1({ name, base, pages, nav, at = new Date().toISOString() }) {
  const json = {
    competitor: name, status: 'generated', source: 'public crawl (site-config)', generatedAt: at, base,
    pages: pages.map((p) => ({ url: p.url, label: p.label, title: p.title ?? '', h1: p.h1 ?? [], h2: p.h2 ?? [],
      buttons: p.buttons ?? [], forms: p.forms ?? 0, inputs: p.inputs ?? [], videos: p.videos ?? 0 })),
    navigation: nav.map((l) => ({ text: l.text, href: l.href })),
  };
  const lines = [
    `# Layer 1 — UI Map: ${name}`,
    `**Status**: GENERATED from a public crawl on ${at.slice(0, 10)} — what a visitor sees, not the logged-in product.`,
    '',
    `## Navigation (${nav.length} same-site links)`,
    ...nav.slice(0, 40).map((l) => `- ${l.text} → ${l.href}`),
    '',
    `## Pages (${pages.length})`,
  ];
  for (const p of json.pages) {
    lines.push('', `### ${p.label}`, `${p.url}${p.title ? ` — "${p.title}"` : ''}`);
    if (p.h1.length) lines.push(`- **Headline:** ${p.h1.join(' / ')}`);
    if (p.h2.length) lines.push(`- **Sections:** ${p.h2.join(' · ')}`);
    if (p.buttons.length) lines.push(`- **Actions offered:** ${p.buttons.join(' · ')}`);
    if (p.forms || p.inputs.length) lines.push(`- **Forms:** ${p.forms} · inputs: ${p.inputs.join(', ') || '—'}`);
    if (p.videos) lines.push(`- **Embedded video players:** ${p.videos}`);
  }
  lines.push('', '## Not covered by this layer', '- Logged-in screens, empty/loading/error/paywall states — need an `--auth` run with your own account.', '');
  return { md: lines.join('\n'), json };
}

/**
 * @param {object} o
 * @param {string} o.id              folder name under research/competitors/
 * @param {string} o.name
 * @param {string} o.category
 * @param {string} o.publicBaseUrl   e.g. 'https://lovable.dev'
 * @param {string} [o.appUrl]        where a logged-in user lands (auth runs only)
 * @param {{path:string,label:string,tag?:string}[]} [o.pages]  pages you are sure exist
 * @param {{max?:number,prefer?:string[]}} [o.follow]           auto-visit discovered links
 * @param {string} [o.why]           one line: what we want to learn from this reference
 */
export function siteConfig(o) {
  if (!o?.id || !o?.name || !o?.publicBaseUrl) throw new Error('siteConfig needs id, name and publicBaseUrl');
  const base = o.publicBaseUrl.replace(/\/$/, '');
  const pages = [{ path: '/', label: 'Homepage', tag: 'HOMEPAGE' }, ...(o.pages ?? [])];
  const planned = pages.map((p) => base + p.path);
  let discovered = [];
  const seenPages = [];
  const record = (r) => { if (r) seenPages.push(r); return r; };

  const pageSections = pages.map((p, i) => {
    const id = String(i + 1).padStart(2, '0');
    return {
      id,
      label: p.label,
      run: async (t) => record(await capturePage(t, { url: base + p.path, key: `${id}-${slug(p.label)}`, label: p.label, tag: p.tag ?? 'PAGE' })),
    };
  });

  const navId = String(pages.length + 1).padStart(2, '0');
  const followId = String(pages.length + 2).padStart(2, '0');
  const l1Id = String(pages.length + 3).padStart(2, '0');

  return {
    id: o.id,
    name: o.name,
    emoji: o.emoji ?? '🔎',
    category: o.category ?? 'Reference',
    why: o.why ?? '',
    appUrl: o.appUrl ?? `${base}/`,
    publicBaseUrl: base,
    loginUrlPatterns: o.loginUrlPatterns ?? ['/login', '/auth', '/signup', '/sign-in'],

    publicSections: [
      ...pageSections,
      {
        id: navId,
        label: 'Nav link discovery — all public routes',
        run: async ({ page, log, cap, idx, goto, dismissOverlays }) => {
          await goto(page, `${base}/`);
          await dismissOverlays(page);
          const links = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a[href]'))
              .map((a) => ({ text: a.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60), href: a.href }))
              .filter((l) => l.text),
          ).catch(() => []);
          const unique = [...new Map(links.filter((l) => sameSite(l.href, base)).map((l) => [l.href, l])).values()].slice(0, 120);
          discovered = unique;
          await cap.snapJSON(`${navId}-nav-links`, unique);
          idx.add('NAVIGATION', 'All public nav links', page.url(), `${unique.length} unique same-site links`);
          log.info(`Nav links discovered: ${unique.length}`);
        },
      },
      {
        id: followId,
        label: 'Discovered pages — pricing, courses, features first',
        run: async (t) => {
          const picks = pickLinks(discovered, { baseUrl: base, planned, prefer: o.follow?.prefer, max: o.follow?.max ?? 6 });
          t.log.info(`Following ${picks.length} discovered pages`);
          for (const [n, l] of picks.entries()) {
            const key = `${followId}-${String(n + 1).padStart(2, '0')}-${slug(l.text || 'page')}`;
            await capturePage(t, { url: l.href, key, label: `Discovered — ${l.text || l.href}`, tag: 'DISCOVERED' })
              .then(record)
              .catch((e) => t.log.info(`  skipped ${l.href}: ${e.message}`));
          }
        },
      },
      {
        id: l1Id,
        label: 'Layer 1 — write the UI map from this run',
        run: async ({ log, idx, baseOut }) => {
          const { md, json } = renderL1({ name: o.name, base, pages: seenPages, nav: discovered });
          const dir = path.join(baseOut, 'intelligence');
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, 'L1-ui-map.md'), md);
          fs.writeFileSync(path.join(dir, 'L1-ui-map.json'), `${JSON.stringify(json, null, 2)}\n`);
          idx.add('LAYER-1', 'Generated UI map', base, `${seenPages.length} pages · ${discovered.length} nav links`);
          log.info(`L1 written: ${seenPages.length} pages, ${discovered.length} nav links`);
        },
      },
    ],

    // Logged-in study is opt-in and uses YOUR own account (save-session first).
    authSections: [
      {
        id: 'A01',
        label: 'App workspace — interactive elements map',
        run: async ({ page, log, cap, idx, dismissOverlays }) => {
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
          await dismissOverlays(page);
          await cap.ss(page, 'A01-workspace', 'App workspace — initial state');
          await cap.snap(page, 'A01-workspace', 'App workspace — text');
          const ui = await page.evaluate(() => {
            const seen = new Set();
            return Array.from(document.querySelectorAll('button, [role="button"], [role="menuitem"], [role="tab"], nav a, [aria-label]'))
              .map((el) => ({
                text: (el.textContent?.trim() || el.getAttribute('aria-label') || '').slice(0, 80),
                role: el.getAttribute('role') || el.tagName.toLowerCase(),
              }))
              .filter((x) => x.text && !seen.has(x.text) && seen.add(x.text))
              .slice(0, 120);
          }).catch(() => []);
          await cap.snapJSON('A01-workspace', ui);
          idx.add('AUTH:APP', 'Workspace element map', page.url(), `${ui.length} interactive elements`);
          log.info(`Elements: ${ui.length}`);
        },
      },
    ],
  };
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'page';
}
