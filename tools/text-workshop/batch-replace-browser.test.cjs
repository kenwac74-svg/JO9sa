'use strict';
// Real browser coverage for the checkbox selection, review, and approved transaction boundaries.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.JO9_PLAYWRIGHT_MODULE||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const core=require('./core.cjs');
const artifacts=path.resolve(__dirname,'..','browser-qa');
fs.mkdirSync(artifacts,{recursive:true});
const browserReports=[];

function fixture(){
 const rows=Array.from({length:235},(_,i)=>`*pl '사과 ${String(i).padStart(3,'0')}, 사과!'`).join('\n');
 const locations=[['묶음',rows],['다른 위치',"*pl '사과 밖의 문장.'\n*pl '다른 사과 문장.'"],['보안',`*pl '사과 <img src=x onerror="window.__batchInjected=true"> 안전 확인.'`],['특수 문자',"*pl 'A.* A.* 적용 전.'\n$path='catalog/path.png'"]];
 const lines=['QSPGAME','browser fixture','',core.shift(String(locations.length),-5)];
 for(const [name,body] of locations)lines.push(core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5));
 lines.push('');return Buffer.from(lines.join('\r\n'),'utf16le');
}

async function launch(t,name){
 const dir=fs.mkdtempSync(path.join(artifacts,'fixture-')),game=path.join(dir,'game'),runtime=path.join(dir,'runtime'),target=path.join(game,'jack.qsp');
 fs.mkdirSync(game);const before=fixture();fs.writeFileSync(target,before);
 // The existing editor preloads its emoji picker even while it is closed.
 const emojiDir=path.join(game,'content','pic','ui','dialogue_emoji');fs.mkdirSync(emojiDir,{recursive:true});
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
 for(const [id] of require('./editing-tools.js').icons)fs.writeFileSync(path.join(emojiDir,id+'.png'),png);
 const child=spawn(process.execPath,[path.join(__dirname,'server.cjs'),'--game-dir',game,'--runtime',runtime,'--catalog-dir',path.join(dir,'catalog'),'--original-dir',path.join(dir,'original')],{stdio:['ignore','pipe','pipe']});
 let errors='',browser,page;child.stderr.on('data',b=>errors+=b);
 const report={name,started:new Date().toISOString(),consoleErrors:[],knownConsoleErrors:[],pageErrors:[],httpErrors:[],checks:[]};browserReports.push(report);
 t.after(async()=>{
  if(page&&!page.isClosed())await page.screenshot({path:path.join(artifacts,name+'-final.png'),fullPage:true}).catch(()=>{});
  if(browser)await browser.close();
  if(child.exitCode===null){const ended=new Promise(resolve=>child.once('exit',resolve));child.kill();await ended;}
  const resolved=path.resolve(dir);assert(resolved.startsWith(artifacts+path.sep));fs.rmSync(resolved,{recursive:true,force:true});
  fs.writeFileSync(path.join(artifacts,'browser-report.json'),JSON.stringify(browserReports,null,2)+'\n');
 });
 const ready=await new Promise((resolve,reject)=>{
  let out='';const timer=setTimeout(()=>reject(Error(errors||'fixture server startup timeout')),15000);
  child.once('error',reject);child.once('exit',()=>{clearTimeout(timer);reject(Error(errors||'fixture server exited'));});
  child.stdout.on('data',b=>{out+=b;if(out.includes('\n')){clearTimeout(timer);resolve(JSON.parse(out.trim()));}});
 });
 browser=await chromium.launch({executablePath:process.env.JO9_BROWSER_EXE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-first-run','--no-default-browser-check']});
 report.browser=browser.version();const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});page=await context.newPage();page.setDefaultTimeout(10000);
 page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error'){const item={text:m.text(),location:m.location()};if(item.location.url.endsWith('/favicon.ico'))report.knownConsoleErrors.push(item);else report.consoleErrors.push(item);}});
 page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({status:r.status(),url:r.url()});});
 await page.goto(ready.url,{waitUntil:'networkidle'});
 if(await page.locator('#aiCollapse').count()&&(await page.locator('#aiCollapse').textContent())==='접기')await page.locator('#aiCollapse').click();
 assert.equal(await page.locator('#batchReplaceBox').count(),1,'The word batch replace controls must exist in the served editor');
 await page.locator('#batchReplaceBox > summary').click();
 const token=await page.evaluate(()=>token);
 const api=async(route,data)=>{const res=await fetch(ready.url+route,{method:data===undefined?'GET':'POST',headers:{'X-JO9-Token':token,...(data===undefined?{}:{'Content-Type':'application/json'})},body:data===undefined?undefined:JSON.stringify(data)});assert.equal(res.status,200,await res.clone().text());return res.json();};
 return {page,before,target,runtime,report,api};
}

async function requestFromClick(page,selector,pathname,method='GET'){
 const response=page.waitForResponse(r=>new URL(r.url()).pathname===pathname&&r.request().method()===method);
 await page.locator(selector).click();const res=await response;assert.equal(res.status(),200,await res.text());return res.json();
}
async function search(page,query,location,replacement){
 await page.locator('#bulkQuery').fill(query);await page.locator('#bulkLocation').fill(location);await page.locator('#bulkReplacement').fill(replacement);
 const result=await requestFromClick(page,'#bulkSearch','/api/batch/search');
 await page.waitForFunction(n=>document.querySelectorAll('#bulkResults input[data-bulk-id]').length===n,result.results.length);
 return result;
}
async function assertDisabled(page,selector){assert.equal(await page.locator(selector).isDisabled(),true,selector+' must prevent an invalid apply');}
async function prepare(page){return requestFromClick(page,'#bulkPreview','/api/batch/preview','POST');}

test('browser: selecting all spans 235 rows, excludes a later-page checkbox, and applies one reversible transaction',async t=>{
 const app=await launch(t,'all-pages'),{page,before,target,runtime,report}=app;
 const found=await search(page,'사과','묶음','배');assert.equal(found.total,235);assert.equal(found.occurrences,470);
 assert.equal(await page.locator('#bulkResults input[data-bulk-id]:checked').count(),0);await assertDisabled(page,'#bulkPreview');
 await page.locator('#bulkSelectAll').check();
 const later=await requestFromClick(page,'#bulkNext','/api/batch/search');assert.equal(later.offset,50);
 await page.waitForFunction(()=>document.querySelector('#bulkResults input[data-bulk-id]')?.checked===true);
 const except=page.locator('#bulkResults input[data-bulk-id]').nth(7);await except.uncheck();
 assert.match(await page.locator('#bulkCount').textContent(),/234/);
 await page.locator('#bulkQuery').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'all-pages-controls.png')});
 const prepared=await prepare(page);assert.equal(prepared.count,234);assert.equal(prepared.occurrences,468);assert.equal(prepared.totalChanges,234);assert.equal(prepared.changes.length,50);
 await page.locator('#bulkReview').waitFor({state:'visible'});await assertDisabled(page,'#bulkApply');
 assert.deepEqual(fs.readFileSync(target),before,'search, checkbox changes, and preview must never write the QSP');
 assert.equal(fs.readdirSync(path.join(runtime,'backups')).length,0,'no backup should be created before approved apply');
 let review=prepared;for(let i=0;i<4;i++)review=await requestFromClick(page,'#bulkReviewNext','/api/batch/preview');
 assert.equal(review.offset,200);assert.equal(review.changes.length,34);assert.match(await page.locator('#bulkReviewPage').textContent(),/5/);
 await page.screenshot({path:path.join(artifacts,'all-pages-review.png'),fullPage:true});
 await page.locator('#bulkReview').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'all-pages-review-viewport.png')});
 await page.locator('#bulkApproved').check();
 const applied=await requestFromClick(page,'#bulkApply','/api/apply','POST');assert.equal(applied.kind,'batch');assert.equal(applied.count,234);assert.equal(applied.occurrences,468);
 const after=fs.readFileSync(target),entries=core.entries(core.parse(after));
 assert.equal(entries.filter(e=>e.location==='묶음'&&e.text.includes('배')).length,234);
 assert.deepEqual(entries.filter(e=>e.location==='묶음'&&e.text.includes('사과')).map(e=>e.text),['사과 057, 사과!']);
 assert.deepEqual(entries.filter(e=>e.location==='다른 위치').map(e=>e.text),['사과 밖의 문장.','다른 사과 문장.']);
 const history=await app.api('api/history');assert.equal(history.length,1);assert.equal(history[0].kind,'batch');
 const backups=fs.readdirSync(path.join(runtime,'backups'));assert.equal(backups.filter(n=>n.endsWith('.qsp')).length,1);assert.equal(backups.filter(n=>n.endsWith('.json')).length,1);
 await page.locator('#historyBox > summary').click();await page.locator('#history').getByRole('button',{name:'수정 기록 내보내기'}).waitFor();
 const downloadPromise=page.waitForEvent('download');await page.locator('#history').getByRole('button',{name:'수정 기록 내보내기'}).click();
 const download=await downloadPromise,exportPath=path.join(artifacts,'all-pages-export.json');await download.saveAs(exportPath);
 const exported=JSON.parse(fs.readFileSync(exportPath,'utf8'));assert.equal(exported.before_sha256,core.hash(before).toUpperCase());assert.equal(exported.after_sha256,core.hash(after).toUpperCase());assert.ok(exported.edits.length>0);
 const replay=core.parse(before);
 for(const edit of exported.edits){
  const location=replay.locations.find(l=>l.name===edit.location);assert.ok(location,'export location exists in original');
  const field=location[edit.field],text=core.shift(replay.lines[field],5);assert.equal(text.split(edit.old).length-1,1,'export context is unique');
  replay.lines[field]=core.shift(text.replace(edit.old,()=>edit.new),-5);
 }
 assert.deepEqual(core.serialize(replay),after,'exported edits replay to every applied byte');report.exportedEdits=exported.edits.length;
 page.once('dialog',dialog=>dialog.accept());
 await requestFromClick(page,'#history button:first-of-type','/api/restore','POST');assert.deepEqual(fs.readFileSync(target),before,'history restore must recover every original byte');
 report.checks.push('235 matches / 470 occurrences; default selection empty','all pages selected with row 057 excluded','review paginated to page 5; no writes before approval','234 rows / 468 occurrences applied; one backup and history record','UI export produced valid hashes and replays exactly; UI restore recovered exact bytes');
 assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.consoleErrors,[]);report.passed=true;
});

test('browser: query, replacement, scope, and selection changes invalidate approval; markup stays literal',async t=>{
 const app=await launch(t,'invalidation'),{page,before,target,report}=app;
 const found=await search(page,'사과','보안','배$&');assert.equal(found.total,1);
 const row=page.locator('#bulkResults input[data-bulk-id]');await row.check();
 assert.equal(await page.locator('#bulkResults img, #bulkResults script').count(),0);assert.match(await page.locator('#bulkResults').textContent(),/<img src=x/);assert.equal(await page.evaluate(()=>window.__batchInjected),undefined);
 let prepared=await prepare(page);assert.equal(prepared.count,1);assert.ok(prepared.changes[0].new.includes('배$&'));
 await page.locator('#bulkApproved').check();await page.locator('#bulkReplacement').fill('새 배');await assertDisabled(page,'#bulkApply');assert.equal(await page.locator('#bulkApproved').isChecked(),false);
 prepared=await prepare(page);await page.locator('#bulkApproved').check();await row.uncheck();await assertDisabled(page,'#bulkApply');await assertDisabled(page,'#bulkPreview');
 await row.check();await prepare(page);await page.locator('#bulkApproved').check();await page.locator('#bulkQuery').fill('안전');await assertDisabled(page,'#bulkApply');
 await search(page,'사과','보안','배');await row.check();await prepare(page);await page.locator('#bulkApproved').check();await page.locator('#bulkLocation').fill('묶음');await assertDisabled(page,'#bulkApply');
 await search(page,'사과','보안','배');await row.check();await prepare(page);await page.locator('#bulkApproved').check();await page.locator('#viewMode').selectOption('all');await assertDisabled(page,'#bulkApply');
 const literal=await search(page,'A.*','특수 문자','');assert.equal(literal.total,1);await page.locator('#bulkResults input[data-bulk-id]').check();const empty=await prepare(page);assert.equal(empty.occurrences,2);assert.equal(empty.changes[0].new,'  적용 전.');
 assert.deepEqual(fs.readFileSync(target),before,'invalidated previews and deletion review must not write');
 report.checks.push('source HTML displayed literally without executable elements','literal $& replacement preserved','replacement, checkbox, query, location, and mode invalidate approval','empty replacement removes literal A.* twice in preview');
 assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.consoleErrors,[]);report.passed=true;
});
