import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { chromium } from 'playwright';
import { sites } from './sites.mjs';
import { uiSites } from './ui-sites.mjs';
import { AUTH, OUT, loadJSON, inScope } from './core.mjs';
const id = process.argv[2]; const site = sites[id] || uiSites[id];
const isUI = !!uiSites[id];
if (!site) throw new Error('Usage: python save_auth.py <veed|invideo-editor|heygen|higgsfield|invideo|kling|openart>');
if (!site.manualLoginRequested && loadJSON(path.join(OUT, `${id}.public.json`), null)?.status !== 'auth-required')
  throw new Error('Run public crawl first. Login is enabled only for a demonstrated gallery gate.');
// --cdp attaches ONLY after the owner has logged into separately launched research Chrome.
const attach = process.argv.includes('--cdp');
const browser = attach
  ? await chromium.connectOverCDP('http://127.0.0.1:9222')
  : await chromium.launch({ channel: 'chrome', headless: false, chromiumSandbox: true });
const context = attach ? browser.contexts()[0] : await browser.newContext({ acceptDownloads: false });
if (!context) throw new Error('Research Chrome context not found.');
const page = attach ? context.pages().find(p => inScope(p.url(), site)) : await context.newPage();
const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
try {
  if (!page) throw new Error('Open the signed-in target site in research Chrome first. No session saved.');
  if (!attach) await page.goto(site.seed, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`LOGIN NOW: ${id}. Use this Chrome window. Nothing is being recorded.`);
  console.log('Enter credentials yourself. Do not bypass browser/security warnings. If OAuth refuses this browser, use a site-offered email flow or stop.');
  console.log(`After login, return to the ${isUI ? 'site dashboard' : 'gallery'}. Session cookies/storage grant account access and will be saved locally, outside OneDrive.`);
  const answer = await terminal.question('Press ENTER (or type SAVE) only after login completes. Type CANCEL to cancel: ');
  if (!['', 'SAVE'].includes(answer.trim())) { console.log('Cancelled; no session saved.'); }
  else {
    const targetPage = context.pages().filter(p => inScope(p.url(), site)).at(-1);
    if (!targetPage) throw new Error('Not at an approved site page. No session saved.');
    const gate = targetPage.getByRole('dialog').filter({ hasText: /sign in|log in|login/i });
    if (await gate.count() || await targetPage.locator('input[type="password"]').count()) throw new Error('Login form remains visible. No session saved.');
    fs.mkdirSync(AUTH, { recursive: true });
    const dest = path.join(AUTH, `${id}.json`);
    // Origin data limited to the target service, excluding OAuth providers.
    const state = await context.storageState({ indexedDB: true });
    state.origins = state.origins.filter(o => site.hosts.includes(new URL(o.origin).hostname));
    state.cookies = state.cookies.filter(c => site.hosts.some(host => host === c.domain.replace(/^\./, '') || host.endsWith('.' + c.domain.replace(/^\./, ''))));
    if (!state.cookies.length && !state.origins.length) throw new Error('No target session state found.');
    fs.writeFileSync(dest, JSON.stringify(state), { mode: 0o600 });
    console.log(`Saved ${id} session locally. Never share or commit this file.`);
    console.log(isUI ? `Ready: node research-editor.mjs ${id} --url <editor-url> --auth` : `Resume: node crawl.mjs ${id} --auth`);
  }
} finally { terminal.close(); await browser.close(); }
