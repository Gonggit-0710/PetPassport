// Run against an isolated copy: PAWLOG_ADMIN_URL=http://127.0.0.1:8768
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.PAWTRIP_TEST_URL||'http://127.0.0.1:8766';
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/pawlog/');
   assert.equal(await page.locator('.post-card').count(),4);assert.match(await page.locator('h1').innerText(),/공이와 함께,\s*여행도 일상도\./);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const links=await page.locator('.post-card').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
   await page.screenshot({path:`C:/Dev/PetPassport/pawlog-list-${width}.png`,fullPage:true});
   for(const link of links){await page.goto(base+link);await page.locator('.story img').last().scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.story img')].every(x=>x.complete&&x.naturalWidth>0));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('.story script,.story iframe').count(),0)}
   await page.screenshot({path:`C:/Dev/PetPassport/pawlog-story-${width}.png`,fullPage:true});
  }
  await page.goto(base+'/mydog/');await page.locator('#navRail a[href="/pawlog/"]').waitFor({state:'attached'});
  const admin=process.env.PAWLOG_ADMIN_URL;if(!admin)throw Error('Set PAWLOG_ADMIN_URL to an isolated test editor, not the live editor.');
  await page.setViewportSize({width:1200,height:950});await page.goto(admin+'/admin/');
  await page.locator('#postList button').first().waitFor();
  assert.equal(await page.locator('#postList button').count(),4);
  await page.locator('#title').fill('공이의 일상 테스트');await page.locator('#slug').fill('test-gong-day');await page.locator('#excerpt').fill('산책을 다녀온 공이');await page.locator('#editor').fill('오늘도 함께 산책했어요.');
  await page.locator('#caption').fill('산책하는 공이');
  await page.locator('#photo').setInputFiles('C:/Dev/PawTrip4u_Blog/Images/01_jeju.jpg');
  await page.waitForFunction(()=>document.querySelector('#editor img'));
  await page.locator('#editor img').click();await page.locator('#caption').fill('공이와 함께, 여행도 일상도.');await page.locator('#photoCaption').click();
  assert.equal(await page.locator('#editor img').getAttribute('alt'),'공이와 함께, 여행도 일상도.');
  await page.locator('#photoUp').click();await page.locator('#photoDown').click();
  await page.locator('#saveDraft').click();await page.locator('#message').filter({hasText:'초안을 이 PC에 저장'}).waitFor();
  await page.reload();await page.locator('#draftList button').first().click();assert.equal(await page.locator('#title').inputValue(),'공이의 일상 테스트');
  await page.locator('#previewButton').click();assert.equal(await page.frameLocator('#preview').locator('h1').innerText(),'공이의 일상 테스트');
  await page.locator('#publish').click();await page.locator('#message').filter({hasText:'GitHub Desktop'}).waitFor();
  let response=await page.request.get(admin+'/pawlog/test-gong-day/');assert.equal(response.status(),200);assert.ok((await response.text()).includes('오늘도 함께 산책했어요.'));
  // Edit an existing imported post using its real version, then reject a stale update.
  const data=await (await page.request.get(admin+'/api/posts')).json();const p=data.posts.find(p=>p.slug==='test-gong-day');
  const token=await page.evaluate(()=>token);
  response=await page.request.post(admin+'/api/publish',{headers:{Origin:admin,'X-PawLog-Token':token},data:{post:{...p,title:'수정한 공이 이야기'},original:p.slug,version:p._version}});assert.equal(response.status(),200,await response.text());
  response=await page.request.post(admin+'/api/publish',{headers:{Origin:admin,'X-PawLog-Token':token},data:{post:p,original:p.slug,version:p._version}});assert.equal(response.status(),400);
  response=await page.request.post(admin+'/api/draft',{data:{post:p}});assert.equal(response.status(),403);
  response=await page.request.post(admin+'/api/publish',{headers:{Origin:admin,'X-PawLog-Token':token},data:{post:{...p,slug:'../privacy'},original:''}});assert.equal(response.status(),400);
  assert.equal((await page.request.get(admin+'/tools/blog_admin.py')).status(),404);
  await page.screenshot({path:'C:/Dev/PetPassport/pawlog-admin.png',fullPage:true});assert.deepEqual(errors,[]);
  console.log('PASS: four migrated posts and all photos, desktop/mobile layouts, PawLog navigation, upload/draft/reload/preview/publish/edit, stale edit rejection, CSRF and path protection.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
