const fs=require('fs'),path=require('path'),a=require('assert/strict');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const p=__dirname,browser='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async()=>{let owned;try{
 owned=await chromium.launch({executablePath:browser,headless:true});
 const page=await owned.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(new URL('file:///'+path.join(p,'catalog-condition-browser-fixture.html').replaceAll('\\','/')).href);
 await page.waitForFunction(()=>document.getElementById('qa-result')?.dataset.status,{timeout:15000});
 const report=await page.locator('#qa-result').evaluate(n=>({status:n.dataset.status,...JSON.parse(n.textContent)}));report.errors=errors;
 fs.writeFileSync(path.join(p,'browser-fixture-dom.html'),await page.content());fs.writeFileSync(path.join(p,'browser-test-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));a.equal(report.status,'PASS');a.equal(errors.length,0);
 await page.evaluate(async()=>{window.qaEmpty=false;await JO9_IMAGE_CONDITIONS.open('content/pic/scene/test.png');});
 await page.screenshot({path:path.join(p,'condition-dialog-preview.png')});
 await page.setViewportSize({width:520,height:850});await page.screenshot({path:path.join(p,'condition-dialog-mobile-preview.png')});
}catch(error){console.error(error);process.exitCode=1;}finally{if(owned)await owned.close();}})();
