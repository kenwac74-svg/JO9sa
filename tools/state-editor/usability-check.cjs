'use strict';
// Exercises search-to-edit and the generation default flow on disposable QSPs.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require(process.env.JO9_PLAYWRIGHT||'playwright');
const {createServer}=require('./server.cjs'),{makeFixture}=require('./test-fixture.cjs'),registry=require('./registry.cjs');
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-state-usability-'));
  const out=path.resolve(process.env.JO9_BROWSER_OUTPUT||path.join(__dirname,'runtime','usability-check'));
  fs.mkdirSync(out,{recursive:true});
  const targets=['work','full'].map(id=>({id,label:id==='work'?'플레이 시험 사본':'배포 시험 사본',path:path.join(dir,id,'jack.qsp')}));
  const originals=new Map();
  const tiny=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=','base64');
  for(const target of targets){
    fs.mkdirSync(path.dirname(target.path),{recursive:true});const raw=makeFixture({unrelated:target.id+'-specific'});
    fs.writeFileSync(target.path,raw);originals.set(target.id,raw);
    for(const field of registry.inspect(raw).fields.filter(f=>f.kind==='icon')){
      const dest=path.join(path.dirname(target.path),field.value.replaceAll('\\','/'));
      fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,tiny);
    }
  }
  const {server}=createServer({targets,runtime:path.join(dir,'runtime')});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.JO9_BROWSER?{executablePath:process.env.JO9_BROWSER}:{})});
    const page=await browser.newPage({viewport:{width:1120,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.waitForFunction(()=>document.querySelector('#source-hash').textContent.length===64&&!document.querySelector('#save-project').disabled);
    assert.equal(await page.locator('#target-checks input:checked').count(),0);
    await page.locator('[data-view="effects"]').click();
    await page.locator('#field-search').fill('크게 늘어난');
    const result=page.locator('#search-results [data-search-field="state.3.tooltip"]');
    assert.equal(await result.count(),1,'Cross-tab search must expose the matching tooltip with a navigation control');
    assert((await result.innerText()).includes('상태표'));
    await result.getByRole('button',{name:'편집으로 이동'}).click();
    const tip=page.locator('[data-field-id="state.3.tooltip"]');
    assert(await tip.isVisible(),'Search result must navigate to the matching editor tab');
    assert(await tip.evaluate(el=>el===document.activeElement),'Search navigation must focus the exact editable field');
    await page.waitForFunction(()=>{const node=document.querySelector('[data-field-id="state.3.tooltip"]'),rect=node.getBoundingClientRect();return rect.top>=0&&rect.bottom<=innerHeight;});
    assert((await tip.getAttribute('aria-describedby')),'Editable controls must reference their explanation');
    const tipCard=page.locator('.field-card[data-search-field="state.3.tooltip"]');
    assert(await tipCard.locator('.field-tooltip').isVisible(),'Keyboard focus must expose the editing explanation');
    assert((await tipCard.innerText()).includes('편집 가능'),'Editable fields must have a text cue in addition to color');
    await page.screenshot({path:path.join(out,'search-to-tooltip.png')});
    await tipCard.screenshot({path:path.join(out,'tooltip-field.png')});
    await tip.fill('새 표시 문구');assert(await page.locator('#apply-button').isDisabled());
    await page.locator('#field-search').fill('');
    await page.locator('[data-view="defaults"]').click();
    const initial=page.locator('select[data-field-id="generation.milf.state"]');
    const typeCode=page.locator('input[data-field-id="generation.type.code"]');
    assert.equal(await typeCode.count(),1,'Generation type must have a direct text input');
    assert.equal(await page.locator('select[data-field-id="generation.type.code"]').count(),0,'Type code must not be a predefined dropdown');
    assert.equal(await typeCode.getAttribute('list'),null,'Type code must not be restricted by a predefined datalist');
    assert.equal(await typeCode.inputValue(),'','Type code must be typed by the user when no generation rule exists');
    await typeCode.fill('custom_mature');
    await page.locator('#save-project').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('프로젝트 저장 완료'));
    for(const target of targets)assert(fs.readFileSync(target.path).equals(originals.get(target.id)),'Saving a typed future type must not change QSP');
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#source-hash').textContent.length===64&&!document.querySelector('#save-project').disabled);
    await page.locator('#load-project').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('프로젝트 불러오기 완료'));
    await page.locator('[data-view="defaults"]').click();
    assert.equal(await typeCode.inputValue(),'custom_mature','Future codes must persist without a predefined list');
    await typeCode.fill('milf');
    assert.equal(await initial.inputValue(),'-1','Existing generation must remain the initial choice');
    assert((await initial.locator('option[value="3"]').innerText()).includes('크게 늘어난'));
    await initial.selectOption('3');
    for(const target of targets)await page.locator('#target-checks input[value="'+target.id+'"]').check();
    await page.locator('#save-project').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('프로젝트 저장 완료'));
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#source-hash').textContent.length===64&&!document.querySelector('#save-project').disabled);
    await page.locator('#load-project').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('프로젝트 불러오기 완료'));
    await page.locator('[data-view="defaults"]').click();
    assert.equal(await initial.inputValue(),'3','Saved numeric select drafts must reload as the same choice');
    assert.equal(await typeCode.inputValue(),'milf','Typed type code must persist in the saved project');
    for(const target of targets)await page.locator('#target-checks input[value="'+target.id+'"]').check();
    await page.locator('#preview-button').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('미리보기 완료'));
    const previewText=await page.locator('#preview-result').innerText();
    assert(previewText.includes('유형 코드')&&previewText.includes('milf'),'Preview must show the user-typed target code');
    await page.locator('[data-view="defaults"]').click();
    await initial.selectOption('2');
    assert(await page.locator('#apply-button').isDisabled(),'Changing a select must invalidate a prepared candidate');
    await initial.selectOption('3');
    await page.locator('#preview-button').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('미리보기 완료'));
    for(const target of targets)assert(fs.readFileSync(target.path).equals(originals.get(target.id)),'Preview must not write QSP');
    await page.locator('#apply-button').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('적용 완료'));
    for(const target of targets){const fields=registry.inspect(fs.readFileSync(target.path)).fields;assert.equal(fields.find(f=>f.id==='generation.milf.state').value,3);assert.equal(fields.find(f=>f.id==='generation.type.code').value,'milf');}
    await page.locator('[data-action="restore"]').first().click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('복원 완료'));
    for(const target of targets)assert(fs.readFileSync(target.path).equals(originals.get(target.id)),'Restore must return every original byte');
    await page.locator('#field-search').fill('not-a-real-state-field');
    assert((await page.locator('#search-results').innerText()).includes('없'));
    await page.locator('#field-search').fill('');
    for(const width of [1120,736,320]){
      await page.setViewportSize({width,height:900});
      for(const view of ['states','rules','defaults','effects','review']){
        await page.locator('[data-view="'+view+'"]').click();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow: '+width+'/'+view);
      }
      if(width===320)assert(await page.evaluate(()=>document.querySelector('main').getBoundingClientRect().top<document.querySelector('.review-sidebar').getBoundingClientRect().top),'Narrow sidebar layout must expose editing before apply/role panels');
      await page.locator('[data-view="defaults"]').click();
      await page.screenshot({path:path.join(out,'defaults-'+width+'.png'),fullPage:true});
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'usability-result.json'),JSON.stringify({status:'pass',pageErrors:errors,actualInstalledGameWritten:false,checks:['cross-tab search','exact-field focus','editable field explanation','initial source-preserving choice','numeric select project persistence','two independent candidate apply/restore','no result message','3 widths x 5 views']},null,2)+'\n');
    console.log('PASS: cross-tab search, focused editing, generation select/project/preview/apply/restore, 3 widths x 5 views.');
  }finally{
    if(browser)await browser.close();await new Promise(r=>server.close(r));
    assert(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
