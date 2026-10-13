/* Isolated browser regression checks. Requires Playwright and a local site server. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {chromium} = require('playwright');

(async()=>{
  const base = process.env.PAWTRIP_TEST_URL || 'http://127.0.0.1:8766';
  const artifacts = process.env.PAWTRIP_TEST_ARTIFACTS || await fs.mkdtemp(path.join(os.tmpdir(),'pawtrip-card-'));
  await fs.mkdir(artifacts,{recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:process.env.PAWTRIP_TEST_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,serviceWorkers:'block'});
    const page = await context.newPage(); const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await context.route(/cdn\.jsdelivr\.net/,route=>route.abort());
    await context.addInitScript(()=>{
      Object.defineProperty(navigator,'canShare',{value:()=>true,configurable:true});
      Object.defineProperty(navigator,'share',{value:async data=>{window.__shared={name:data.files[0].name,type:data.files[0].type,size:data.files[0].size};},configurable:true});
    });
    await page.goto(base+'/mydog/');
    await page.locator('[data-example]').click();
    await page.getByRole('heading',{name:'예시 카드 · 가상 정보'}).waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('pt-wallet')),null,'sample must not become personal data');
    await page.locator('[data-use-example]').click();
    await page.locator('[type="submit"]').click();
    assert.equal(await page.locator('.medical-form').count(),1,'required fields block completion');
    await page.locator('[data-cancel]').click();

    const seed={name:'기존 강아지',breed:'나만의 믹스',neut:false,chip:'410000000000000',rabiesDate:'2026-01-01',titerDate:'2026-02-01',emer:'Hotel desk',customField:'preserve',cond:['heart'],alg:['chicken'],meds:'Original medicine'};
    await page.evaluate(seed=>{localStorage.setItem('pt-wallet',JSON.stringify(seed));localStorage.setItem('pp3c-jp','[0,2]');},seed);
    await page.reload();
    await page.locator('[data-create]').click();
    assert.equal(await page.locator('#mc-breed').inputValue(),'__other__');assert.equal(await page.locator('#mc-breedOther').inputValue(),'나만의 믹스');
    assert.equal(await page.locator('#mc-neutStatus').inputValue(),'unknown','legacy unchecked does not imply intact');
    await page.locator('#mc-breed').selectOption('푸들');
    await page.locator('#mc-sex').selectOption('f');await page.locator('#mc-neutStatus').selectOption('yes');
    await page.locator('#mc-name').fill('보리 / Bori');
    await page.locator('#mc-weight').fill('4.2');
    await page.locator('#mc-ownerTel').fill('+82 10-1234-5678');
    await page.locator('[name="condNone"]').check();
    assert.equal(await page.locator('[name="cond"][value="heart"]').isChecked(),false);
    const pngBytes=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=40;const g=c.getContext('2d');g.fillStyle='#e6854c';g.fillRect(0,0,40,40);return Array.from(Uint8Array.from(atob(c.toDataURL('image/png').split(',')[1]),ch=>ch.charCodeAt(0)));});
    await page.locator('#mc-photo').setInputFiles({name:'sample-photo.png',mimeType:'image/png',buffer:Buffer.from(pngBytes)});
    await page.locator('[type="submit"]').click();
    await page.waitForFunction(()=>{const b=document.querySelector('[data-download]');return b&&!b.disabled;});
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pt-wallet')));
    assert.equal(await page.locator('.medical-card').getAttribute('lang'),'ko','fresh Korean homepage creates Korean card');
    assert.match(await page.locator('.medical-card footer').innerText(),/수정일: /);
    assert.ok(!(await page.locator('.medical-card footer').innerText()).includes('Updated /'));
    assert.equal(saved.breed,'푸들');assert.equal(saved.sex,'f');assert.equal(saved.neut,true);assert.equal(saved.neutStatus,'yes');
    assert.equal(saved.chip,seed.chip); assert.equal(saved.rabiesDate,seed.rabiesDate);assert.equal(saved.titerDate,seed.titerDate);assert.equal(saved.customField,'preserve');assert.equal(saved.condNone,true);assert.deepEqual(saved.cond,[]);
    assert.equal(await page.evaluate(()=>localStorage.getItem('pp3c-jp')),'[0,2]');
    assert.equal(await page.locator('.medical-photo').evaluate(img=>img.complete&&img.naturalWidth>0),true);
    for(const lang of ['en','ja','zh','ko']){
      await page.locator(`[data-medical-lang="${lang}"]`).click();
      await page.waitForFunction(()=>!document.querySelector('[data-download]').disabled);
      if(lang==='en'){const text=await page.locator('[data-medical-card]').innerText();assert.ok(text.includes('Poodle / 푸들'));assert.ok(text.includes('Female · Spayed'));}
      const pending=page.waitForEvent('download');await page.locator('[data-download]').click();const download=await pending;
      assert.equal(download.suggestedFilename(),`pawtrip-medical-${lang}.png`);
      const dest=path.join(artifacts,download.suggestedFilename());await download.saveAs(dest);
      const bytes=await fs.readFile(dest);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.length>10000);
    }
    await page.locator('[data-share]').click();
    assert.equal((await page.evaluate(()=>window.__shared)).type,'image/png');
    await page.locator('#medicalFlow').screenshot({path:path.join(artifacts,'desktop.png')});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile must not scroll horizontally');
    await page.locator('#medicalFlow').screenshot({path:path.join(artifacts,'mobile.png')});

    // Inspect the real print document without opening the OS print dialog.
    await page.evaluate(()=>{HTMLIFrameElement.prototype.__printSetter=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');const original=HTMLIFrameElement.prototype.__printSetter;Object.defineProperty(HTMLIFrameElement.prototype,'srcdoc',{get:original.get,set(value){original.set.call(this,value);const loaded=this.onload;this.onload=async()=>{this.contentWindow.print=()=>{window.__printed=true;};await loaded();};},configurable:true});});
    await page.locator('[data-print]').click();
    await page.waitForFunction(()=>window.__printed);
    const printed=await page.locator('.medical-print-frame').contentFrame().locator('body').innerText();
    assert.ok(printed.includes('보리 / Bori'));assert.ok(!printed.includes('현지 동물병원 찾기'));
    await page.locator('.medical-print-frame').contentFrame().locator('.medical-card').screenshot({path:path.join(artifacts,'print-card.png')});
    const events=await page.evaluate(()=>window.dataLayer.map(e=>Array.from(e)).filter(e=>String(e[1]).startsWith('medical_')));
    for(const name of ['medical_create_complete','medical_image_download','medical_image_share','medical_print_request']) assert.ok(events.some(e=>e[1]===name),name+' is measured');
    for(const event of events) assert.ok(Object.keys(event[2]||{}).every(key=>key==='language'),'analytics exclude personal fields');

    await page.locator('[data-edit]').click();
    await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='pt-wallet') throw new Error('quota');return original.call(this,k,v);};});
    await page.locator('#mc-name').fill('저장 실패');await page.locator('[type="submit"]').click();
    await page.locator('[data-form-status]').filter({hasText:'저장하지 못했어요'}).waitFor();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pt-wallet')).name),'보리 / Bori');
    await page.reload();
    await page.evaluate(()=>{const w=JSON.parse(localStorage.getItem('pt-wallet'));w.condNote='긴 메모 long note '.repeat(60);localStorage.setItem('pt-wallet',JSON.stringify(w));});
    await page.reload();await page.locator('[data-preview]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-download]').disabled);
    const size=await page.locator('[data-export-image] img').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight}));
    assert.equal(size.width,1440);assert.ok(size.height>3000,'long notes expand instead of clipping');
    await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true}));
    await page.locator('[data-medical-lang="ja"]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-download]').disabled);
    assert.equal(await page.locator('[data-share]').isVisible(),false,'unsupported sharing has download fallback');
    await page.goto(base+'/#sos');
    await page.locator('#sosArt').waitFor();
    assert.ok((await page.locator('#sosArt').innerText()).includes('보리 / Bori'),'legacy SOS uses the same records');
    await page.goto(base+'/mydog/?edit=1');await page.locator('#w-sex').selectOption('m');await page.locator('#w-neutStatus').selectOption('yes');
    await page.goto(base+'/mydog/');await page.locator('[data-preview]').click();await page.locator('[data-medical-lang="en"]').click();
    assert.ok((await page.locator('[data-medical-card]').innerText()).includes('Male · Neutered'));
    await page.locator('[data-edit]').click();await page.locator('#mc-neutStatus').selectOption('no');await page.locator('[type="submit"]').click();
    await page.locator('[data-medical-card]').waitFor();assert.ok((await page.locator('[data-medical-card]').innerText()).includes('Male · Intact'));
    assert.deepEqual(errors,[]);
    await context.close();
    const offlineContext=await browser.newContext({acceptDownloads:true});
    const offlinePage=await offlineContext.newPage();
    await offlinePage.goto(base+'/mydog/');
    await offlinePage.evaluate(()=>navigator.serviceWorker.ready);
    await offlinePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await offlinePage.waitForFunction(async()=>!!(await caches.match('/medical-card.js')) && !!(await caches.match('/mydog/')));
    await offlinePage.evaluate(()=>localStorage.setItem('pt-wallet',JSON.stringify({name:'Offline dog',weight:'5',ownerTel:'+82 10-0000-0000'})));
    await offlineContext.setOffline(true);await offlinePage.reload();
    await offlinePage.locator('[data-preview]').click();
    await offlinePage.waitForFunction(()=>!document.querySelector('[data-download]').disabled);
    assert.ok((await offlinePage.locator('[data-medical-card]').innerText()).includes('Offline dog'));
    await offlineContext.close();
    console.log('PASS: sample isolation, required fields, existing records, health states, photo, four PNG languages, sharing and fallback, analytics privacy, mobile layout, print, storage failure, long notes, legacy SOS and offline export.');
    console.log('Artifacts: '+artifacts);
  } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
