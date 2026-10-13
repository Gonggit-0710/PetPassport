const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PAWTRIP_TEST_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  try{
    const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:true,viewport:{width:390,height:844}}),page=await context.newPage();const requests=[],errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route(/cdn\.jsdelivr\.net/,r=>r.abort());
    let responseStatus=503;
    await context.route('https://wallet.example/api/wallet-pass',async route=>{requests.push(route.request().postDataJSON());await route.fulfill(responseStatus===503?{status:503,contentType:'application/json',body:JSON.stringify({message:'Wallet 카드 발급 준비 중입니다. PNG 저장을 이용해 주세요.'})}:{status:200,contentType:'application/vnd.apple.pkpass',body:Buffer.from('PK\x03\x04mock-test-pass')});});
    const base=process.env.PAWTRIP_TEST_URL||'http://127.0.0.1:8766';
    await page.goto(base+'/mydog/');
    await page.evaluate(()=>localStorage.setItem('pt-wallet',JSON.stringify({name:'Bori',weight:'4.2',ownerTel:'+82 10-0000-0000',condNone:true,algNone:true,medsNone:true,rabiesDate:'2026-01-01',titerDate:'2026-02-01'})));
    await page.reload();await page.locator('[data-preview]').click();
    assert.equal(await page.locator('[data-wallet]').isDisabled(),true,'disabled without a service endpoint');
    await page.evaluate(()=>window.PAWTRIP_WALLET={endpoint:'https://wallet.example/api/wallet-pass'});
    await page.locator('[data-medical-lang="ja"]').click();
    await page.locator('[data-wallet]').click();
    assert.equal(requests.length,0);assert.equal(await page.locator('[data-wallet-generate]').isDisabled(),true,'consent required before sending');
    await page.locator('[data-wallet-consent]').check();await page.locator('[data-wallet-generate]').click();
    await page.locator('[data-wallet-status]').filter({hasText:'발급 준비 중'}).waitFor();
    assert.equal(requests.length,1);assert.equal(requests[0].language,'ja');assert.equal(requests[0].card.name,'Bori');
    assert.equal(requests[0].card.rabiesDate,undefined);assert.equal(requests[0].card.titerDate,undefined);
    responseStatus=200;await page.locator('[data-wallet-generate]').click();await page.locator('[data-wallet-open]').waitFor();
    const pending=page.waitForEvent('download');await page.locator('[data-wallet-open]').click();const download=await pending;assert.equal(download.suggestedFilename(),'pawtrip-my-card.pkpass');
    assert.equal(await page.locator('[data-download]').isDisabled(),false,'PNG is still available');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const events=await page.evaluate(()=>dataLayer.map(e=>Array.from(e)).filter(e=>String(e[1]).startsWith('medical_wallet_')));
    assert.ok(events.some(e=>e[1]==='medical_wallet_request'));assert.ok(events.some(e=>e[1]==='medical_wallet_download'));
    assert.ok(events.every(e=>Object.keys(e[2]||{}).every(k=>k==='language')));
    assert.deepEqual(errors,[]);await context.close();
    console.log('PASS: Wallet availability, explicit consent, bounded data selection, service errors, retry, PKPass download, analytics privacy and mobile layout. Backend response mocked; real iPhone installation remains pending.');
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
