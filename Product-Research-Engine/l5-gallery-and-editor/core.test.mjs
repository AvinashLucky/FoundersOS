import test from 'node:test';
import assert from 'node:assert/strict';
import { safeURL, inScope, isVideoURL, robotsAllowed, candidates, readOnlyRequest } from './core.mjs';
import { sites } from './sites.mjs';
test('reject credentials, local URLs and signed URLs; preserve content IDs', () => {
  for (const u of ['file:///C:/secret', 'http://example.com/a.mp4', 'https://localhost/a', 'https://127.0.0.1/a', 'https://u:p@example.com/a', 'https://example.com/a?X-Amz-Signature=x', 'https://example.com/a?token=x']) assert.equal(safeURL(u), null);
  assert.equal(safeURL('https://www.youtube.com/watch?v=abc&utm_source=x#part'), 'https://www.youtube.com/watch?v=abc');
});
test('gallery scope excludes homepage, editor, lookalike hosts', () => {
  assert.equal(inScope(sites.higgsfield.seed, sites.higgsfield), true);
  for (const u of ['https://higgsfield.ai/', 'https://higgsfield.ai/ai/video', 'https://higgsfield.ai.evil.com/community']) assert.equal(inScope(u, sites.higgsfield), false);
});
test('video filtering does not collect image/help links', () => {
  assert.equal(isVideoURL('https://example.com/a.jpg'), false);
  assert.equal(isVideoURL('https://example.com/a.mp4'), true);
  assert.equal(isVideoURL('https://www.youtube.com/watch?v=x'), true);
  assert.equal(isVideoURL('https://www.youtube.com/'), false);
});
test('robots wildcard, allow precedence and unrelated groups', () => {
  const rules = 'User-agent: *\nDisallow: /private\nAllow: /private/public\nDisallow: /*?secret=*\nUser-agent: other\nDisallow: /';
  assert.equal(robotsAllowed(rules, 'https://x.com/private/a'), false);
  assert.equal(robotsAllowed(rules, 'https://x.com/private/public/a'), true);
  assert.equal(robotsAllowed(rules, 'https://x.com/a?secret=x'), false);
  assert.equal(robotsAllowed(rules, 'https://x.com/community'), true);
});
test('extract video evidence and keep traversal on-gallery', () => {
  const result = candidates({ media: [{ url: 'blob:local', kind: 'media' }, { url: 'https://cdn.example.com/v.mp4', kind: 'media' }],
    links: [{ url: '/community/film/123', video: true }, { url: '/pricing', video: false }] }, sites.higgsfield.seed, sites.higgsfield);
  assert.equal(result.videos.length, 2);
  assert.deepEqual(result.next, ['https://higgsfield.ai/community/film/123']);
});
test('paid mutations and ambiguous GraphQL operations fail closed', () => {
  assert.equal(readOnlyRequest('POST', 'https://example.com/api/generate', '{}'), false);
  assert.equal(readOnlyRequest('GET', 'https://example.com/api/publish?id=1'), false);
  assert.equal(readOnlyRequest('POST', 'https://example.com/graphql', '{"query":"mutation { buy }"}'), false);
  assert.equal(readOnlyRequest('POST', 'https://example.com/graphql', '{"operationName":"Generate","extensions":{}}'), false);
  assert.equal(readOnlyRequest('POST', 'https://example.com/graphql', '{"query":"query { publicGallery { url } }"}'), true);
  assert.equal(readOnlyRequest('GET', 'https://example.com/community'), true);
});
