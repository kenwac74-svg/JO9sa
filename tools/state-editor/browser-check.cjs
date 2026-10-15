'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require(process.env.JO9_PLAYWRIGHT||'playwright');
const {createServer}=require('./server.cjs'),{makeFixture}=require('./test-fixture.cjs'),registry=require('./registry.cjs');
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-state-browser-')),out=path.resolve(process.env.JO9_BROWSER_OUTPUT||path.join(__dirname,'runtime','browser-check'));
  fs.mkdirSync(out,{recursive:true});
  const a=path.join(dir,'work','jack.qsp'),b=path.join(dir,'full','jack.qsp');
  for(const file of[a,b])fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(a,makeFixture({unrelated:'work-specific'}));fs.writeFileSync(b,makeFixture({chance:7,unrelated:'full-specific'}));
  const aa=fs.readFileSync(a),bb=fs.readFileSync(b);
  const tiny=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=','base64');
  for(const file of[a,b])for(const field of registry.inspect(fs.readFileSync(file)).fields.filter(f=>f.kind==='icon')){const dest=path.join(path.dirname(file),field.value.replaceAll('\\','/'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,tiny);}
  for(const file of[a,b])fs.writeFileSync(path.join(path.dirname(file),'content','pic','replacement.png'),tiny);
  const{server}=createServer({targets:[{id:'work',label:'플레이 시험 사본',path:a},{id:'full',label:'배포 시험 사본',path:b}],runtime:path.join(dir,'runtime')});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,...(process.env.JO9_BROWSER?{executablePath:process.env.JO9_BROWSER}:{})}),page=await browser.newPage({viewport:{width:1024,height:900},colorScheme:'light'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const input=id=>page.locator('input[data-field-id="'+id+'"]'),view=name=>page.locator('[data-view="'+name+'"]').click();
  async function ready(){await page.waitForFunction(()=>document.querySelector('#source-hash').textContent.length===64&&!document.querySelector('#save-project').disabled);}
  async function statusContains(text){await page.waitForFunction(s=>document.querySelector('#status').textContent.includes(s),text);}
  async function chooseTargets(){for(const value of['work','full'])await page.locator('#target-checks input[value="'+value+'"]').check();}
  try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/');await ready();
    assert.equal(await input('state.4.label').inputValue(),'명기');assert((await page.locator('#source-path').innerText()).includes(a));assert.equal(await page.locator('#target-checks input:checked').count(),0);
    await chooseTargets();await page.locator('#cache-preview-button').click();await statusContains('캐시 갱신 후보');assert(await page.locator('#apply-button').isEnabled());await page.locator('#apply-button').click();await statusContains('적용 완료');await page.locator('[data-action="restore"]').first().click();await statusContains('복원 완료');assert(fs.readFileSync(a).equals(aa));assert(fs.readFileSync(b).equals(bb));
    await view('states');const originalIcon=await input('state.4.icon.main').inputValue();await input('state.4.icon.main').fill('content/pic/missing.png');const iconPreview=page.locator('[data-icon-preview-field="state.4.icon.main"]');await page.waitForFunction(()=>document.querySelector('[data-icon-preview-field="state.4.icon.main"]').textContent.includes('입력 경로 확인 필요'));assert.equal(await iconPreview.locator('img').count(),0);await page.locator('#preview-button').click();await statusContains('아이콘');assert(await page.locator('#apply-button').isDisabled());await view('states');await input('state.4.icon.main').fill('content/pic/replacement.png');await page.waitForFunction(()=>{const img=document.querySelector('[data-icon-preview-field="state.4.icon.main"] img');return img&&img.naturalWidth>0;});assert((await page.locator('[data-state-code="4"] .state-icon-origin').innerText()).includes('원본 아이콘'));await input('state.4.icon.main').fill(originalIcon);
    await view('rules');assert.equal(await input('discovery.chance').inputValue(),'5');await input('discovery.chance').fill('10');await chooseTargets();await page.locator('#preview-button').click();await statusContains('미리보기 완료');assert(await page.locator('#apply-button').isEnabled());assert(fs.readFileSync(a).equals(aa));assert(fs.readFileSync(b).equals(bb));
    await view('rules');await input('discovery.chance').fill('11');assert(await page.locator('#apply-button').isDisabled());await input('discovery.chance').fill('10');await view('states');await input('state.4.label').fill('시험 상태');await page.locator('#save-project').click();await statusContains('프로젝트 저장 완료');
    await page.reload();await ready();await page.locator('#load-project').click();await statusContains('프로젝트 불러오기 완료');assert.equal(await input('state.4.label').inputValue(),'시험 상태');await view('rules');assert.equal(await input('discovery.chance').inputValue(),'10');await chooseTargets();
    await page.locator('#preview-button').click();await statusContains('미리보기 완료');const preview=await page.locator('#preview-result').innerText();assert(preview.includes('플레이 시험 사본')&&preview.includes('배포 시험 사본'));assert(preview.includes('원본')&&preview.includes('7'));
    await page.locator('#apply-button').click();await statusContains('적용 완료');for(const f of[a,b])assert.equal(registry.inspect(fs.readFileSync(f)).fields.find(x=>x.id==='discovery.chance').value,10);assert(await page.locator('[data-action="restore"]').count()>0);await page.locator('[data-action="restore"]').first().click();await statusContains('복원 완료');assert(fs.readFileSync(a).equals(aa));assert(fs.readFileSync(b).equals(bb));
    await view('rules');await input('discovery.chance').fill('101');assert(await page.locator('#preview-button').isDisabled());await input('discovery.chance').fill('12');await chooseTargets();await page.locator('#preview-button').click();await statusContains('미리보기 완료');fs.writeFileSync(a,makeFixture({unrelated:'external write'}));await page.locator('#apply-button').click();await statusContains('원본 충돌');assert(await page.locator('#apply-button').isDisabled());assert(fs.readFileSync(b).equals(bb));
    await page.locator('#reload-source').click();await ready();await page.locator('#load-project').click();await statusContains('원본 충돌');
    await page.locator('#reload-source').click();await ready();await view('effects');await page.locator('#field-search').fill('XP');assert((await page.locator('#search-result').innerText()).includes('1/31'));await page.locator('#field-search').fill('');
    for(const width of[1024,736,320]){await page.setViewportSize({width,height:900});for(const name of['states','rules','defaults','effects','review']){await view(name);const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(m.scroll<=m.width,'horizontal overflow '+width+' '+name+': '+m.scroll);}await view('rules');await page.screenshot({path:path.join(out,'editor-'+width+'.png'),fullPage:true});}
    await page.setViewportSize({width:1024,height:900});await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:path.join(out,'editor-dark.png'),fullPage:true});
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({status:'pass',widths:[1024,736,320],views:['states','rules','defaults','effects','review'],interactions:['actual fixture source values','explicit target selection','preview invalidation','project save/reload','independent two-target apply','exact-byte restore','invalid input','stale candidate','stale project','current-state field search'],pageErrors:errors,actualInstalledGameWritten:false},null,2)+'\n');
    console.log('PASS: real GUI edit/preview/project/two-target apply/exact restore, conflicts, 3 widths x 5 views.');
  }finally{await browser.close();await new Promise(r=>server.close(r));assert(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
