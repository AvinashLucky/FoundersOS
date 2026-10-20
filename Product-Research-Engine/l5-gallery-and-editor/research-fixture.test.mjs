import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { inspectPage, openPanel } from './research-core.mjs';

test('synthetic editor: panel navigation, catalogue labels, disabled states and capture', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    // Inline TEST fixture. No navigation, login, provider or external media.
    await page.setContent(`<main><h1>TEST editor</h1><button id="effects">Effects</button><button disabled>Export</button>
      <input value="PRIVATE INPUT"><div id="panel" hidden><h2>Video effects</h2><button class="preset">Blur</button><button class="preset">Sharpen</button></div>
      <script>document.getElementById('effects').onclick=()=>document.getElementById('panel').hidden=false</script></main>`);
    assert.equal((await inspectPage(page, '.preset')).catalogue.length, 0);
    assert.equal((await openPanel(page, 'effects')).status, 'opened-unverified');
    const visible = await inspectPage(page, '.preset');
    assert.deepEqual(visible.catalogue, ['Blur', 'Sharpen']);
    assert.equal(visible.controls.find(c => c.label === 'Export').disabled, true);
    assert.equal(JSON.stringify(visible).includes('PRIVATE INPUT'), false);
    const png = await page.screenshot({ mask: [page.locator('input')] });
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    await page.setContent('<canvas></canvas><input type="password">');
    const canvas = await inspectPage(page);
    assert.equal(canvas.canvasCount, 1); assert.equal(canvas.loginVisible, true);
  } finally { await browser.close(); }
});
