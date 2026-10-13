const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {chromium}=require('playwright');
const scope={window:{},Date};vm.runInNewContext(fs.readFileSync('trip-plan.js','utf8'),scope);
const plan=scope.window.PTTripPlan,today=new Date(2026,9,12);
const jp={id:'jp',leadDays:210,timeline:[{d:-45,t:'notice'},{d:0,t:'departure'}]};
assert.equal(plan.parse('2026-02-30'),null);assert.equal(plan.parse('bad'),null);
assert.equal(plan.iso(plan.earliest(jp,{titer:true,blood:'2026-01-01'},today)),'2026-06-30');
assert.equal(plan.iso(plan.earliest({id:'fr',leadDays:122},{titer:true,blood:'2026-01-31'},today)),'2026-04-30');
assert.equal(plan.project(jp,{dep:'2026-10-12'},today).daysLeft,0);
assert.equal(plan.project(jp,{dep:'2026-10-11'},today).daysLeft,-1);
assert.equal(plan.project(jp,{dep:'2026-11-01'},today).tooSoon,true);

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PAWTRIP_TEST_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route(/cdn\.jsdelivr\.net/,r=>r.abort());const base=process.env.PAWTRIP_TEST_URL||'http://127.0.0.1:8766';
  await page.goto(base+'/mycard/');await page.locator('#myTripDate').waitFor();assert.equal(await page.locator('#myTripDate').inputValue(),'');
  assert.ok((await page.locator('#myTripSummary').innerText()).includes('출국일을 입력해 주세요'));
  const dep=await page.evaluate(()=>PTTripPlan.iso(new Date(Date.now()+300*86400000)));
  await page.locator('#myTripDate').fill(dep);await page.locator('#myTripDate').press('Tab');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pp3')).dep),dep);
  assert.ok((await page.locator('#myTripSummary').innerText()).includes('D-300'));
  await page.locator('.my-checklist').evaluate(el=>el.open=true);await page.locator('[data-my-check="0"]').check();
  assert.equal(await page.locator('#myTripProgress').getAttribute('value'),'1');
  await page.goto(base+'/#plan');await page.locator('#dep').waitFor();assert.equal(await page.locator('#dep').inputValue(),dep);
  await page.locator('#dest').selectOption('us');
  await page.goto(base+'/mycard/');assert.equal(await page.locator('#myCheckCountry').inputValue(),'us');assert.equal(await page.locator('#myTripDate').inputValue(),dep);
  assert.equal(await page.locator('#myTripProgress').getAttribute('value'),'0');
  assert.equal(await page.evaluate(()=>localStorage.getItem('pp3c-jp')),'[0]');
  const earlier=await page.evaluate(()=>PTTripPlan.iso(new Date(Date.now()+86400000)));
  await page.locator('#myCheckCountry').selectOption('jp');
  await page.locator('#myTripDate').fill(earlier);await page.locator('#myTripDate').press('Tab');assert.ok((await page.locator('#myTripSummary').innerText()).includes('희망 출국일보다 준비 기간이 짧아요'));
  const data=await page.evaluate(()=>fetch('/data.json').then(r=>r.json()));const country=data.countries.find(c=>c.id==='jp');
  await page.evaluate(count=>localStorage.setItem('pp3c-jp',JSON.stringify(Array.from({length:count},(_,i)=>i))),country.requirements.length);
  await page.reload();assert.ok((await page.locator('#myTripSummary').innerText()).includes('모든 준비사항을 체크했어요'));
  assert.ok((await page.locator('#myTripSummary').innerText()).includes('입국 허가를 의미하지 않습니다'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#wprogress').screenshot({path:'C:/Dev/PetPassport/mycard-trip-summary.png'});
  await page.locator('#myTripDate').fill('');await page.locator('#myTripDate').press('Tab');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pp3')).dep),'');
  assert.deepEqual(errors,[]);await context.close();console.log('PASS: shared dates, calendar boundaries, no date, D-day, progress, both-way calculator sync, country records, infeasible dates, all checked, clear date and mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
