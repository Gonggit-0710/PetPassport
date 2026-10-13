const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/cdn\.jsdelivr\.net|google-analytics|googletagmanager/,r=>r.abort());
 await page.addInitScript(()=>{if(!localStorage.getItem('pt-trips'))localStorage.setItem('pt-trips',JSON.stringify([{id:'test-existing',seq:1,date:'2025-09-01',from:'ICN',to:'NRT'}]));});
 const base=process.env.PAWTRIP_TEST_URL||'http://127.0.0.1:8766';
 await page.goto(base+'/#trips');await page.waitForURL('**/mydog/#trips');await page.locator('#legForm').waitFor();
 assert.ok(await page.locator('#wtrips').evaluate(e=>e.open));assert.ok((await page.locator('#wtrips .legs').innerText()).includes('ICN → NRT'));
 assert.equal(await page.locator('#medicalFlow').count(),1);assert.equal(await page.locator('#navRail a[href="/#trips"]').count(),0);assert.equal(await page.locator('[data-group="mypet"]').count(),0);
 assert.equal(await page.locator('#navRail .pawlog-nav').evaluate(e=>getComputedStyle(e).color),'rgb(255, 107, 91)');
 assert.equal(await page.locator('#navRail a.rl').first().evaluate(e=>getComputedStyle(e).color),'rgb(34, 35, 38)');
 await page.locator('#lgTo').fill('LAX');await page.locator('#legForm [type="submit"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pt-trips')).length===2);
 await page.locator('#legForm').waitFor();assert.equal(await page.locator('#medicalFlow').count(),1,'adding trip does not replace My Card');
 await page.locator('#rcMake').click();await page.locator('#rcOut img').waitFor();
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('pt-trips')));const added=records.find(x=>x.id!=='test-existing');
 page.once('dialog',d=>d.accept());await page.locator(`[data-rmleg="${added.id}"]`).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pt-trips')).length===1);assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('pt-trips'))))[0].id,'test-existing');
 await page.reload();await page.locator('#legForm').waitFor();assert.ok((await page.locator('#wtrips .legs').innerText()).includes('ICN → NRT'));
 await page.goto(base+'/mycard/?edit=1#backup');await page.waitForURL('**/mydog/?edit=1#backup');await page.locator('#main > .page-head h1').filter({hasText:'반려견 정보 입력'}).waitFor();
 await page.goto(base+'/mycard/#trips');await page.waitForURL('**/mydog/#trips');await page.locator('#legForm').waitFor();assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('pt-trips'))))[0].id,'test-existing');
 await page.goto(base+'/');await page.locator('#navRail .pawlog-nav').waitFor();await page.screenshot({path:'C:/Dev/PetPassport/navigation-desktop.png'});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.equal(await page.locator('#navGroups [data-group]').count(),2);assert.ok(await page.locator('#navGroups .pawlog-nav').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.screenshot({path:'C:/Dev/PetPassport/navigation-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS: legacy trip redirect, embedded records/create/delete/recap/reload, My Card preservation, separate PawLog and brand colors, PC/mobile navigation.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
