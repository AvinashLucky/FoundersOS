import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.join(ROOT, 'output');
// Keep reusable credentials OUTSIDE this OneDrive workspace by default.
export const AUTH = path.join(process.env.LOCALAPPDATA || ROOT, 'AvionCrawlerL5', 'auth');
const secretKey = /(?:token|secret|password|signature|credential|authorization|cookie|session|api.?key|^code$|^sig$|^policy$|key-pair-id|x-amz|x-goog)/i;
const mediaPath = /\.(mp4|webm|mov|m4v|m3u8|mpd)$/i;
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function safeURL(raw, base) {
  try {
    const u = new URL(raw, base);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    if (u.hostname === 'localhost' || /\.(local|localhost|internal)$/.test(u.hostname) || !u.hostname.includes('.') || /^[\d.]+$/.test(u.hostname) || u.hostname.includes(':')) return null;
    if ([...u.searchParams.keys()].some(k => secretKey.test(k))) return null;
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) u.searchParams.delete(key);
    }
    return u.href;
  } catch { return null; }
}
export function inScope(raw, site) {
  const clean = safeURL(raw);
  if (!clean) return false;
  const u = new URL(clean);
  return site.hosts.includes(u.hostname) && site.paths.some(p => new RegExp(p).test(u.pathname));
}
export function isVideoURL(raw) {
  const clean = safeURL(raw);
  if (!clean) return false;
  const u = new URL(clean);
  return mediaPath.test(u.pathname) ||
    (['www.youtube.com', 'youtube.com'].includes(u.hostname) &&
      ((u.pathname === '/watch' && !!u.searchParams.get('v')) || /^\/(shorts|embed)\/[^/]+/.test(u.pathname))) ||
    (u.hostname === 'youtu.be' && u.pathname.length > 1) ||
    (['vimeo.com', 'player.vimeo.com'].includes(u.hostname) && /^\/(video\/)?\d+/.test(u.pathname));
}
export function readOnlyRequest(method, rawURL, body = '') {
  const u = new URL(rawURL);
  if (/\/(generate|render|publish|checkout|subscribe|delete|upload|purchase)(?:\/|$)/i.test(u.pathname)) return false;
  if (/graphql/i.test(u.pathname)) {
    try {
      const payload = method === 'GET' ? { query: u.searchParams.get('query') } : JSON.parse(body);
      // Fail closed for persisted operations, batches and ambiguous payloads.
      return !Array.isArray(payload) && typeof payload.query === 'string' &&
        /^\s*(query\b|\{)/.test(payload.query) && !/\bmutation\b/.test(payload.query);
    } catch { return false; }
  }
  return ['GET', 'HEAD', 'OPTIONS'].includes(method);
}
export function atomicJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(`${file}.tmp`, file);
}
export function loadJSON(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8')); // Corruption is an error, not an empty checkpoint.
}
export function writeMaster(records) {
  fs.mkdirSync(OUT, { recursive: true });
  const urls = [...new Set(records.map(r => safeURL(r.url)).filter(Boolean))].sort();
  const file = path.join(OUT, 'creator_dna_video_master.txt');
  fs.writeFileSync(`${file}.tmp`, urls.length ? urls.join('\n') + '\n' : '');
  fs.renameSync(`${file}.tmp`, file);
  return urls.length;
}

// Conservative robots policy for the generic browser crawler: wildcard groups,
// longest rule wins, Allow wins equal-length ties. No override switch.
export function robotsAllowed(text, rawURL) {
  const groups = []; let group = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    const pos = line.indexOf(':'); if (pos < 0) continue;
    const key = line.slice(0, pos).trim().toLowerCase();
    const value = line.slice(pos + 1).trim();
    if (key === 'user-agent') {
      if (!group || group.rules.length) { group = { agents: [], rules: [] }; groups.push(group); }
      group.agents.push(value.toLowerCase());
    } else if (group && ['allow', 'disallow'].includes(key) && value) {
      group.rules.push({ value, allow: key === 'allow' });
    }
  }
  const u = new URL(rawURL); const target = u.pathname + u.search;
  const matching = groups.filter(g => g.agents.includes('*')).flatMap(g => g.rules).filter(r => {
    const end = r.value.endsWith('$');
    const raw = end ? r.value.slice(0, -1) : r.value;
    const pattern = raw.split('*').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    return new RegExp('^' + pattern + (end ? '$' : '')).test(target);
  }).sort((a, b) => b.value.length - a.value.length || Number(b.allow) - Number(a.allow));
  return !matching.length || matching[0].allow;
}

// Only page-rendered URLs. No hidden application stores, API replay, response
// bodies, cookies, screenshots, videos, or user-entered text are harvested.
export async function extractDOM(page) {
  return page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href]')].filter(a => a.getClientRects().length)
      .slice(0, 1500).map(a => ({ url: a.href,
        video: !!a.querySelector('video,source[type^="video/"]') || /\bvideo\b/i.test(a.getAttribute('aria-label') || '') }));
    const media = [...document.querySelectorAll('video,video source,iframe[src]')].map(el => ({
      url: el.currentSrc || el.src || el.getAttribute('data-src'),
      kind: el.tagName === 'IFRAME' ? 'embed' : 'media',
    })).filter(x => x.url);
    return { links, media };
  });
}
export function candidates(dom, pageURL, site) {
  const media = dom.media.map(m => ({ url: safeURL(m.url, pageURL), kind: m.kind }))
    .filter(m => m.url && isVideoURL(m.url));
  const links = dom.links.map(a => ({ ...a, url: safeURL(a.url, pageURL) })).filter(a => a.url);
  const videos = links.filter(a => isVideoURL(a.url) || (a.video && inScope(a.url, site) && a.url !== pageURL))
    .map(a => ({ url: a.url, kind: isVideoURL(a.url) ? 'media-link' : 'video-permalink' }));
  return { videos: [...media, ...videos], next: links.filter(a => inScope(a.url, site)).map(a => a.url) };
}
