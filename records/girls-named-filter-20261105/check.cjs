'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const local=path.resolve(__dirname,'../girls-checklist-20261104');
const data=JSON.parse(fs.readFileSync(local+'/manifest.json'));
const script=fs.readFileSync(local+'/catalog-girls-checklist.js','utf8');
new Function(script);
const named=new Set(data.characters.filter(c=>c.hasFixedName).map(c=>c.id));
assert.equal(named.size,107);assert.ok(named.has(1448)&&named.has(2571)&&named.has(3002));assert.ok(!named.has(2071)&&!named.has(2340));
const fixture={...data,gameRoot:'X:/JO9_SYNTHETIC',checklistStatus:{items:{},characterItems:{2571:['done'],2071:['done']}}};
const errors=[],checks=[];
async function main(){
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><meta charset="utf-8"><body><script>window.JO9_GIRLS_CHECKLIST='+JSON.stringify(fixture).replaceAll('<','\\u003c')+';</script><script>'+script.replaceAll('</script','<\\/script')+'</script></body>',{waitUntil:'domcontentloaded'});
 const root=page.locator('#jo9-girls-checklist'),namedToggle=root.locator('#jo9-girls-named-only');
 await namedToggle.check();await page.waitForFunction(()=>document.querySelector('#jo9-girls-checklist').textContent.includes('검색 결과 107명'));
 let ids=await root.locator('.gc-card').evaluateAll(es=>es.map(e=>Number(e.dataset.characterId)));assert.ok(ids.every(id=>named.has(id)));checks.push('Only explicit fixed names, including named random character Shiru');
 const search=root.locator('input[type=search]');await search.fill('이사벨라');assert.equal(await root.locator('.gc-card').count(),1);assert.equal(await root.locator('.gc-card').first().getAttribute('data-character-id'),'2571');
 await search.fill('2071');assert.equal(await root.locator('.gc-card').count(),0);checks.push('Search composes with named-only filter');
 await search.fill('');await root.locator('select[aria-label="캐릭터 정렬"]').selectOption('name');
 let names=await root.locator('.gc-card h3').allTextContents();const plain=names.map(n=>n.split(' · ').slice(1).join(' · '));assert.deepEqual(plain,[...plain].sort((a,b)=>a.localeCompare(b,'ko')));checks.push('Existing name sort preserved');
 await root.getByRole('button',{name:'다음',exact:true}).click();ids=await root.locator('.gc-card').evaluateAll(es=>es.map(e=>Number(e.dataset.characterId)));assert.ok(ids.length&&ids.every(id=>named.has(id)));checks.push('Pagination stays inside named set');
 await root.locator('.gc-status-filter[data-flag="done"]').click();assert.equal(await root.locator('.gc-card').count(),1);assert.equal(await root.locator('.gc-card').first().getAttribute('data-character-id'),'2571');checks.push('Character status tags compose without changing stored status');
 await namedToggle.uncheck();assert.equal(await root.locator('.gc-card').count(),2);checks.push('Unchecking restores unnamed tagged characters');
 assert.deepEqual(errors,[]);
 const report={status:'PASS',namedCharacters:named.size,checks,scriptErrors:errors,gameWrites:0,scope:'Headless UI with current WORK inventory and synthetic in-memory tags; no game/API writes'};
 fs.writeFileSync(__dirname+'/check-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
