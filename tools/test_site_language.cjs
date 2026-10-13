const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PAWTRIP_TEST_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  try{
    const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}}),page=await context.newPage();const errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route(/cdn\.jsdelivr\.net/,r=>r.abort());
    page.on('request',r=>{if(r.method()==='POST')external.push(r.url());});
    const base=process.env.PAWTRIP_TEST_URL||'http://127.0.0.1:8766';
    await page.goto(base+'/mydog/');await page.locator('[data-site-language]').waitFor();
    for(const [ui,card] of [['ko','ko'],['en','en'],['ja','ja'],['zh','zh-CN']]){
      await page.locator('[data-site-language]').selectOption(ui);
      await page.locator('[data-example]').click();
      assert.equal(await page.locator('.medical-card').getAttribute('lang'),card,'unselected card language follows current homepage language');
      assert.equal(await page.evaluate(()=>localStorage.getItem('pt-sos-lang')),null,'default does not overwrite an explicit card preference');
    }
    await page.reload();await page.locator('[data-site-language]').waitFor();
    await page.locator('[data-site-language]').selectOption('en');
    await page.getByRole('button',{name:'Create my card',exact:true}).waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('.topbar').isVisible(),true,'language is visible on desktop');
    await page.locator('[data-create]').click();await page.locator('#mc-name').fill('항공편 선택');await page.locator('#mc-weight').fill('4.2');await page.locator('#mc-ownerTel').fill('+82 10-0000-0000');
    await page.locator('#mc-breed').selectOption('푸들');await page.locator('#mc-sex').selectOption('f');await page.locator('#mc-neutStatus').selectOption('yes');
    await page.locator('[data-site-language]').selectOption('ja');
    await page.getByRole('button',{name:'カードを作成・確認',exact:true}).waitFor();
    assert.equal(await page.locator('#mc-name').inputValue(),'항공편 선택','draft user text is unchanged');assert.equal(await page.locator('#mc-breed').inputValue(),'푸들','option values stay canonical');
    await page.locator('[type="submit"]').click();await page.waitForFunction(()=>!document.querySelector('[data-download]').disabled);
    await page.locator('[data-medical-lang="en"]').click();await page.waitForFunction(()=>!document.querySelector('[data-download]').disabled);
    await page.locator('[data-site-language]').selectOption('zh');
    await page.getByRole('button',{name:'下载 PNG 图片',exact:true}).waitFor();
    const card=await page.locator('.medical-card').innerText();assert.ok(card.includes('항공편 선택'),'personal output not translated');assert.ok(card.includes('Female · Spayed'),'card output language is independent');
    assert.equal(await page.locator('.medical-card').getAttribute('lang'),'en');
    await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');assert.equal(await page.locator('[data-site-language]').inputValue(),'zh');
    await page.goto(base+'/countries/');await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');
    assert.ok((await page.locator('#navGroups').innerText()).includes('准备'));
    await page.goto(base+'/#flights');await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');
    await page.locator('[data-site-language]').selectOption('en');await page.waitForFunction(()=>document.querySelector('#navRail').textContent.includes('Prepare'));
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.goto(base+'/mydog/');await page.locator('[data-create]').waitFor();await page.screenshot({path:'C:/Dev/PetPassport/site-language-mobile.png'});
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'C:/Dev/PetPassport/site-language-desktop.png'});
    await page.locator('[data-site-language]').selectOption('ko');await page.getByRole('button',{name:'간단 정보 수정',exact:true}).waitFor();
    assert.equal(await page.locator('.site-language-note').isVisible(),false);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pt-wallet')).name),'항공편 선택');
    assert.deepEqual(external,[],'no data sent to translation services');assert.deepEqual(errors,[]);
    await context.close();console.log('PASS: four UI languages, persistence, desktop/mobile header, draft and stored values, independent card language, Korean restore and no translation requests.');
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
