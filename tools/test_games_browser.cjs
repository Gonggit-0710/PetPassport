const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PAWTRIP_TEST_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{
  const base=process.env.PAWTRIP_TEST_URL||'http://127.0.0.1:8766';
  const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route(/cdn\.jsdelivr\.net/,route=>route.abort());
  for(const url of ['/games/','/games/not-the-vacuum/','/games/not-the-vacuum/privacy/','/app-ads.txt']){
   const response=await context.request.get(base+url,{maxRedirects:0});assert.equal(response.status(),200,url);assert.equal(response.url(),base+url);
   if(url==='/app-ads.txt'){assert.ok(response.headers()['content-type'].startsWith('text/plain'));assert.equal(await response.text(),'google.com, pub-6262324542700705, DIRECT, f08c47fec0942fa0\n');}
  }
  // Install the travel site's real worker, then navigate to the game URLs.
  await page.goto(base+'/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   for(const anchor of ['ko','en']){
    await page.goto(base+'/games/not-the-vacuum/privacy/#'+anchor);
    await page.reload();await page.reload();
    assert.equal(await page.locator('script').count(),0);
    assert.equal(await page.locator('#ko').isVisible(),true);assert.equal(await page.locator('#en').isVisible(),true);
    await page.waitForFunction(id=>Math.abs(document.getElementById(id).getBoundingClientRect().top)<8,anchor);
    const top=await page.locator('#'+anchor).evaluate(el=>el.getBoundingClientRect().top);assert.ok(Math.abs(top)<8,'anchor scroll '+anchor+' '+top);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'policy mobile layout');
   }
   await page.goto(base+'/games/not-the-vacuum/');
   assert.equal(await page.locator('.pups img').count(),3);assert.ok(await page.locator('.pups img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'intro layout');
   await page.screenshot({path:`C:/Dev/PetPassport/game-intro-${width}.png`,fullPage:true});
   await page.goto(base+'/games/');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  const fresh=await browser.newContext();const privatePage=await fresh.newPage();await privatePage.goto(base+'/games/not-the-vacuum/privacy/#en');
  await privatePage.waitForFunction(()=>Math.abs(document.getElementById('en').getBoundingClientRect().top)<8);
  assert.ok(Math.abs(await privatePage.locator('#en').evaluate(el=>el.getBoundingClientRect().top))<8);
  const gameCache=await page.evaluate(async()=>{const names=await caches.keys(),found=[];for(const name of names){const cache=await caches.open(name);for(const request of await cache.keys())if(new URL(request.url).pathname.startsWith('/games/')||new URL(request.url).pathname==='/app-ads.txt')found.push(request.url);}return found;});
  assert.deepEqual(gameCache,[],'game pages do not enter travel worker cache');assert.deepEqual(errors,[]);
  await fresh.close();await context.close();console.log('PASS: four independent URLs, ad file MIME/content, ko/en anchors on PC/mobile with worker and fresh context, two languages visible, no policy scripts, artwork, layout and worker bypass.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
