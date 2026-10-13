// Regression: visible parent alone does not detect a flex-collapsed logo.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.PAWTRIP_TEST_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    for (const colorScheme of ['light','dark']) {
      const context = await browser.newContext({colorScheme, serviceWorkers:'block'});
      const page = await context.newPage();
      for (const width of [320,375,390,430,600,768,1024,1440]) {
        await page.setViewportSize({width,height:900});
        for (const route of ['/','/mydog/','/countries/jp/']) {
          await page.goto((process.env.PAWTRIP_TEST_URL || 'http://127.0.0.1:8766') + route);
          await page.locator('.site-language select').waitFor();
          const logo = page.locator('.topbar-row>.logo');
          const artwork = logo.locator('svg,img').first();
          assert.ok(await artwork.isVisible(), `${colorScheme} ${width} ${route}`);
          const box = await artwork.boundingBox();
          assert.ok(box.width >= 100 && box.height >= 25, 'logo must retain its real dimensions');
          if (await artwork.evaluate(e => e.tagName === 'IMG')) {
            await page.waitForFunction(() => document.querySelector('.topbar-row .logo img').naturalWidth > 0);
            const source = await artwork.evaluate(e => e.currentSrc);
            assert.ok(source.includes(`logo-${colorScheme}.svg`));
          }
          assert.ok(await page.locator('.my-card-button').isVisible());
          if (width < 1024) assert.ok(await page.locator('#navGroups .pawlog-nav').isVisible());
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          if (width <= 600) {
            const brand = await logo.boundingBox(), controls = await page.locator('.topbar-right').boundingBox();
            assert.ok(brand.y + brand.height <= controls.y, 'brand row precedes the controls');
            const groups = await page.locator('#navGroups').boundingBox();
            assert.ok(controls.y + controls.height <= groups.y, 'navigation must not overlap the controls');
          }
          if (width === 390 && route === '/') {
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({path:`C:/Dev/PetPassport/mobile-brand-${colorScheme}.png`});
          }
        }
      }
      await context.close();
    }
    console.log('PASS: brand artwork retains size, light/dark assets, My Dog/PawLog visible, eight widths and three routes.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
