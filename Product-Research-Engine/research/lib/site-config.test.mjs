/**
 * Guarantees for research/lib/site-config.js and every config built with it:
 * the template is generic (not a copy of a real competitor), every config loads
 * and has the shape crawl.js reads, and link picking stays on the site and
 * prefers the pages research needs. Run: npm run test:configs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { siteConfig, pickLinks, sameSite } from './site-config.js';

const COMPETITORS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../competitors');

test('the template is generic, not a copy of a real competitor', () => {
  const tpl = readFileSync(path.join(COMPETITORS, '_TEMPLATE/config.js'), 'utf8');
  for (const id of readdirSync(COMPETITORS).filter((d) => !d.startsWith('_'))) {
    const file = path.join(COMPETITORS, id, 'config.js');
    if (existsSync(file)) assert.notEqual(readFileSync(file, 'utf8'), tpl, `_TEMPLATE is identical to ${id}`);
  }
  assert.ok(!/runway/i.test(tpl), 'template still mentions runway');
});

test('every config loads, its id matches its folder, and it has the crawl.js shape', async () => {
  for (const id of readdirSync(COMPETITORS).filter((d) => !d.startsWith('_'))) {
    const file = path.join(COMPETITORS, id, 'config.js');
    if (!existsSync(file)) continue;
    const { default: c } = await import(pathToFileURL(file).href);
    assert.equal(c.id, id, `${id}: id mismatch`);
    assert.ok(c.name && c.appUrl, `${id}: name/appUrl`);
    assert.ok(Array.isArray(c.publicSections) && c.publicSections.length > 0, `${id}: publicSections`);
    for (const s of [...c.publicSections, ...(c.authSections ?? [])]) {
      assert.equal(typeof s.run, 'function', `${id}/${s.id}: run`);
      assert.ok(s.id && s.label, `${id}: section id/label`);
    }
    const ids = c.publicSections.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${id}: duplicate section ids`);
  }
});

test('siteConfig refuses a config without the essentials', () => {
  assert.throws(() => siteConfig({ id: 'x', name: 'X' }), /publicBaseUrl/);
});

test('sameSite accepts www and subdomains, rejects other sites', () => {
  assert.ok(sameSite('https://www.graphy.com/pricing', 'https://graphy.com'));
  assert.ok(sameSite('https://app.graphy.com/', 'https://graphy.com'));
  assert.ok(!sameSite('https://graphy.com.evil.io/', 'https://graphy.com'));
  assert.ok(!sameSite('not a url', 'https://graphy.com'));
});

test('pickLinks stays on site, skips login/legal, skips planned pages, ranks preferred pages first', () => {
  const links = [
    { text: 'Blog', href: 'https://x.com/blog' },
    { text: 'Pricing', href: 'https://x.com/pricing' },
    { text: 'Login', href: 'https://x.com/login' },
    { text: 'Privacy', href: 'https://x.com/privacy' },
    { text: 'Elsewhere', href: 'https://other.com/pricing' },
    { text: 'Courses', href: 'https://x.com/courses/ai' },
    { text: 'Home', href: 'https://x.com/' },
    { text: 'Pricing again', href: 'https://www.x.com/pricing/' },
  ];
  const picks = pickLinks(links, { baseUrl: 'https://x.com', planned: ['https://x.com/'], max: 5 });
  const hrefs = picks.map((p) => p.href);
  assert.deepEqual(hrefs.slice(0, 2).sort(), ['https://x.com/courses/ai', 'https://x.com/pricing']);
  assert.ok(!hrefs.some((h) => /login|privacy|other\.com/.test(h)));
  assert.ok(!hrefs.includes('https://x.com/'), 'planned homepage visited twice');
  assert.equal(hrefs.filter((h) => h.includes('pricing')).length, 1, 'duplicate pricing link');
});

test('renderL1 writes a real, labelled map — never a stub — from what the run saw', async () => {
  const { renderL1 } = await import('./site-config.js');
  const { md, json } = renderL1({
    name: 'X', base: 'https://x.com', at: '2026-10-12T00:00:00Z',
    nav: [{ text: 'Pricing', href: 'https://x.com/pricing' }],
    pages: [{ url: 'https://x.com/', label: 'Homepage', title: 'X', h1: ['Learn AI'], h2: ['Courses'], buttons: ['Join free'], forms: 1, inputs: ['email'], videos: 1 }],
  });
  assert.ok(!/stub/i.test(md));
  assert.ok(md.includes('GENERATED') && md.includes('Join free') && md.includes('Learn AI'));
  assert.equal(json.status, 'generated');
  assert.equal(json.pages[0].buttons[0], 'Join free');
});
