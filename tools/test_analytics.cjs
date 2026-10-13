// Production-domain simulation: GA requests are stubbed; no test visits reach Google.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PAWTRIP_TEST_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    let loads = 0;
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'www.googletagmanager.com') {
        loads++;
        return route.fulfill({ contentType: 'text/javascript', body: '' });
      }
      if (url.hostname !== 'pawtrip.us' && url.hostname !== '127.0.0.1') return route.abort();
      const file = path.join(__dirname, '..', '_site', url.pathname, url.pathname.endsWith('/') ? 'index.html' : '');
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' }[path.extname(file)] || 'application/octet-stream';
      return route.fulfill({ contentType: type, body: fs.readFileSync(file) });
    });
    const page = await context.newPage();
    const posts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'search-index.json'), 'utf8')).filter(p => p.g === 'PawLog').map(p => p.u);
    for (const route of ['/pawlog/', ...posts, '/mydog/']) {
      const before = loads;
      await page.goto('https://pawtrip.us' + route + '?private=test#private');
      const events = await page.evaluate(() => (window.dataLayer || []).map(x => Array.from(x)).filter(x => x[0] === 'event' && x[1] === 'page_view'));
      assert.equal(events.length, 1, route);
      assert.equal(events[0][2].page_path, route);
      assert.equal(events[0][2].page_location, 'https://pawtrip.us' + route);
      assert.match(events[0][2].page_title, route === '/mydog/' ? /^PawTrip · My Dog$/ : /^PawTrip · PawLog/);
      assert.equal(loads - before, 1);
    }
    const before = loads;
    await page.goto('http://127.0.0.1/pawlog/');
    assert.equal(loads, before, 'localhost must not load GA');
    assert.equal(await page.evaluate(() => (window.dataLayer || []).length), 0);
    await page.goto('https://pawtrip.us/games/not-the-vacuum/privacy/');
    assert.equal(loads, before, 'game policy must not load GA');
    console.log('GA: PawLog list/posts and My Dog titles, canonical paths, localhost exclusion, game-policy exclusion passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
