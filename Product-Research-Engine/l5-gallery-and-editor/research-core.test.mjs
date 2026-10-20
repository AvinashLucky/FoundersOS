import test from 'node:test';
import assert from 'node:assert/strict';
import { researchURL, displayURL, allowRequest, safeLabel, redact, coverage, digest, makeReport, openPanel } from './research-core.mjs';
import { uiSites } from './ui-sites.mjs';

test('editor URL drops agent prompts and only permits configured HTTPS hosts', () => {
  assert.equal(researchURL('https://ai.invideo.io/workspace/abc?agentBrief=Generate#EL1', uiSites['invideo-editor']), 'https://ai.invideo.io/workspace/abc');
  for (const raw of ['https://evil.ai.invideo.io/', 'http://ai.invideo.io/', 'https://u:p@ai.invideo.io/', 'https://ai.invideo.io/signup']) {
    assert.throws(() => researchURL(raw, uiSites['invideo-editor']));
  }
});
test('report URLs redact workspace identity and query values', () => {
  assert.equal(displayURL('https://ai.invideo.io/workspace/private-id/edit?token=secret#x'), 'https://ai.invideo.io/workspace/[PRIVATE]/edit');
});
test('all mutation verbs and ambiguous GraphQL are refused', () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) assert.equal(allowRequest(method, 'https://a.com/data', 'fetch'), false);
  assert.equal(allowRequest('GET', 'https://a.com/graphql?query=x', 'fetch'), false);
});
test('spending, uploads and media are refused even on GET', () => {
  for (const suffix of ['/generate', '/render-job', '/checkout', '/api?operation=publish', '/a.mp4?sig=x', '/audio.mp3', '/export']) {
    assert.equal(allowRequest('GET', 'https://a.com' + suffix, 'fetch'), false, suffix);
  }
  assert.equal(allowRequest('GET', 'https://a.com/stream', 'media'), false);
  assert.equal(allowRequest('GET', 'https://a.com/app.css', 'stylesheet'), true);
  assert.equal(allowRequest('GET', 'https://a.com/thumb.png', 'image'), true);
});
test('state labels cannot escape output folder', () => {
  for (const s of ['../secret', 'C:\\secret', 'a/b', '', 'x'.repeat(61)]) assert.throws(() => safeLabel(s));
  assert.equal(safeLabel('effects-blur-2'), 'effects-blur-2');
});
test('redaction removes common tokens and emails', () => {
  const value = redact('user@example.com token=abc Bearer xyz');
  for (const secret of ['user@example.com', 'abc', 'xyz']) assert.equal(value.includes(secret), false);
});
test('coverage separates captured, untested and missing areas', () => {
  const rows = coverage([{ topic: 'effects', state: 'blur', status: 'captured', screenshot: 'a.png' }, { topic: 'markers', state: 'markers', status: 'needs-guided-capture' }]);
  assert.equal(rows.find(r => r.topic === 'effects').status, 'observed-not-functionally-tested');
  assert.equal(rows.find(r => r.topic === 'markers').status, 'unknown');
  assert.match(makeReport([], { sockets: 2 }), /blocked sockets: 2/);
});
test('stable hashes permit reuse but detect catalogue changes', () => {
  assert.equal(digest(['A']), digest(['A'])); assert.notEqual(digest(['A']), digest(['B']));
});
test('openPanel rejects dangerous or unknown names before DOM access', async () => {
  assert.equal((await openPanel(null, 'Generate')).status, 'blocked');
  assert.equal((await openPanel(null, 'Export')).status, 'blocked');
});
test('ambiguous panel controls are never clicked', async () => {
  let clicks = 0;
  const fake = { getByRole: () => ({ all: async () => [{ isVisible: async () => true, isEnabled: async () => true, click: async () => clicks++ }] }) };
  assert.equal((await openPanel(fake, 'effects')).status, 'needs-guided-capture');
  assert.equal(clicks, 0);
});
