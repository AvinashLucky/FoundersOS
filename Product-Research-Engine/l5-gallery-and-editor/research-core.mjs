import crypto from 'node:crypto';

// A checklist, not a claim of feature completeness. Extend after observed evidence.
export const PANELS = {
  media: ['Media'], timeline: ['Timeline', 'Timelines'], markers: ['Markers'],
  transitions: ['Transitions'], effects: ['Effects'], audio: ['Audio'],
  captions: ['Captions', 'Subtitles'], inspector: ['Inspector'],
  keyframes: ['Keyframes'], color: ['Color'], agent: ['Show agent'],
};
export const TOPICS = [...Object.keys(PANELS), 'range-edit', 'insert-replace', 'review', 'recovery'];
const secret = /(?:bearer\s+\S+|(?:token|password|secret|api[_-]?key|authorization|cookie)\s*[:=]\s*\S+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi;
export function redact(value) { return String(value).replace(secret, '[REDACTED]').slice(0, 500); }
export function digest(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20); }
export function safeLabel(value) {
  if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(value)) throw new Error('Use a lowercase state name, e.g. effects-blur.');
  return value;
}
export function researchURL(raw, site) {
  const u = new URL(raw);
  if (u.protocol !== 'https:' || u.username || u.password || !site.hosts.includes(u.hostname)) throw new Error('Unapproved site URL.');
  if (/login|signup|signin|sign-in|\/auth(?:\/|$)/i.test(u.pathname)) throw new Error('Use the separate manual login helper.');
  // A copied agentBrief URL can prefill/start work. Research never carries it forward.
  u.search = ''; u.hash = '';
  return u.href;
}
export function displayURL(raw) {
  const u = new URL(raw); u.search = ''; u.hash = '';
  u.pathname = u.pathname.replace(/\/workspace\/[^/]+/g, '/workspace/[PRIVATE]');
  return u.href;
}
export function allowRequest(method, raw, kind) {
  if (!['GET', 'HEAD'].includes(method) || kind === 'media') return false;
  let u; try { u = new URL(raw); } catch { return false; }
  if (!['https:', 'data:', 'blob:'].includes(u.protocol)) return false;
  if (/\.(mp4|webm|mov|mp3|wav|m3u8|mpd|m4s)(?:$)/i.test(u.pathname)) return false;
  if (/generate|render|publish|checkout|purchase|subscribe|delete|upload|export|mutation|invite|graphql/i.test(u.pathname + u.search)) return false;
  return true;
}
export function coverage(records) {
  return TOPICS.map(topic => {
    const seen = records.filter(r => r.topic === topic && r.status === 'captured');
    return { topic, status: seen.length ? 'observed-not-functionally-tested' : 'unknown',
      states: [...new Set(seen.map(r => r.state))], screenshots: [...new Set(seen.map(r => r.screenshot))] };
  });
}
export function makeReport(records, counts = {}) {
  const lines = ['# Editor research evidence', '',
    'Screenshots/DOM observations are not proof that rendering, paid AI or every preset works.',
    'No architecture inferred from private backend code. No media downloaded as assets.', '',
    `Blocked requests: ${counts.requests || 0}; blocked sockets: ${counts.sockets || 0}. Blocking can prevent app features from loading.`, '',
    '| Area | Evidence status | Captured states |', '|---|---|---|'];
  for (const row of coverage(records)) lines.push(`| ${row.topic} | ${row.status} | ${row.states.join(', ') || '—'} |`);
  lines.push('', '## Evidence');
  for (const r of records) lines.push(`- ${r.state}: ${r.status}${r.screenshot ? ` · [screenshot](${r.screenshot})` : ''}${r.reason ? ` · ${redact(r.reason)}` : ''}`);
  return lines.join('\n') + '\n';
}

// Visible UI only. No inputs, hidden app state, network payloads, cookies or storage.
export async function inspectPage(page, catalogueSelector) {
  return page.evaluate(({ catalogueSelector }) => {
    const visible = e => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none';
    const text = e => (e.getAttribute('aria-label') || e.innerText || e.getAttribute('title') || '').trim().slice(0, 250);
    const controls = [...document.querySelectorAll('button,[role="tab"],[role="button"],select,summary')]
      .filter(visible).slice(0, 500).map(e => ({ role: e.getAttribute('role') || e.tagName.toLowerCase(),
        label: text(e), disabled: e.matches(':disabled') || e.getAttribute('aria-disabled') === 'true',
        selected: e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-pressed') === 'true' }));
    const headings = [...document.querySelectorAll('h1,h2,h3,[role="heading"]')].filter(visible).map(text).slice(0, 80);
    const catalogue = catalogueSelector ? [...document.querySelectorAll(catalogueSelector)].filter(visible).map(text).filter(Boolean).slice(0, 300) : [];
    return { controls, headings, catalogue, catalogueConfigured: !!catalogueSelector,
      canvasCount: document.querySelectorAll('canvas,img[alt*="slate"],img[alt*="canvas"]').length,
      iframeCount: document.querySelectorAll('iframe').length,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      loginVisible: [...document.querySelectorAll('input[type="password"]')].some(visible) };
  }, { catalogueSelector });
}
export async function openPanel(page, topic) {
  if (!Object.hasOwn(PANELS, topic)) return { status: 'blocked', reason: 'Not an approved read-only panel.' };
  const options = [];
  for (const label of PANELS[topic]) for (const role of ['tab', 'button']) {
    const found = page.getByRole(role, { name: label, exact: true });
    for (const item of await found.all()) if (await item.isVisible() && await item.isEnabled()) options.push(item);
  }
  if (options.length !== 1) return { status: 'needs-guided-capture', reason: `Found ${options.length} unambiguous panel controls; no click attempted.` };
  await options[0].click({ timeout: 3000 });
  return { status: 'opened-unverified' };
}
