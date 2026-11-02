'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),a=require('assert/strict');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const P=__dirname,W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',baseUrl='http://127.0.0.1:3813/';
const h=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),fileUrl=p=>'file:///'+p.replaceAll('\\','/');
const inputs=[W+'/jack.qsp',F+'/jack.qsp',W+'/modtools/catalog/catalog_cuts.js'].map(p=>({path:p,sha256:h(p)}));
const paths=['content/pic/bg/beach.png','content/pic/characters/archmage_zephiros.png','content/pic/scene/arena_end.png'];
const bgFiles=fs.readdirSync(W+'/content/pic/bg'),noCutName=bgFiles.find(n=>/\.png$/i.test(n)&&!/[ (]\d+\)\.png$/i.test(n)&&!bgFiles.some(m=>m.toLowerCase().startsWith(n.slice(0,-4).toLowerCase()+' (')));
let owned,checks=0;
const assert=(v,msg)=>{checks++;a.ok(v,msg);};
(async()=>{try{
 owned=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await owned.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[],blocked=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{const req=route.request();if(req.method()==='POST'&&!/\/api\/catalog\/(?:cut-conditions\/info|cuts\/(?:info|families|file))$/.test(req.url())){blocked.push(new URL(req.url()).pathname);return route.abort('blockedbyclient');}return route.continue();});
 page.on('request',req=>{if(req.url().includes('/api/catalog/cut-conditions/'))requests.push({method:req.method(),path:new URL(req.url()).pathname,payload:JSON.parse(req.postData()||'{}')});});
 await page.goto(baseUrl+'catalog?image='+encodeURIComponent(paths[0]),{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.JO9_IMAGE_CONDITIONS?.installed,{timeout:30000});
 const addonResponse=await page.request.get(baseUrl+'catalog-cut-conditions.js'),addonRaw=await addonResponse.body();
 assert(addonResponse.status()===200,'addon served');assert(crypto.createHash('sha256').update(addonRaw).digest('hex')===h(P+'/catalog-cut-conditions.js'),'served addon matches inspected source');
 const injected=await page.locator('script[src="catalog-cut-conditions.js"]').count();assert(injected===1,'addon injected once');
 const snapshots=[];
 for(const target of paths){
   // Use the real catalog filters to display a single real card without changing data.
   await page.evaluate(target=>{const input=document.getElementById('q')||document.querySelector('input[type=search]');if(input){input.value=target.split('/').pop();input.dispatchEvent(new Event('input',{bubbles:true}));}else if(typeof window.render==='function')window.render();},target);
   const button=page.locator('[data-jo9-image-condition]').filter({hasText:'등장 조건 설정'});
   let exact=page.locator('[data-jo9-image-condition="'+target+'"]');
   if(await exact.count()===0){
    // A catalog category filter may hide another folder. Direct URL is read-only.
    await page.goto(baseUrl+'catalog?image='+encodeURIComponent(target),{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.JO9_IMAGE_CONDITIONS?.installed,{timeout:30000});exact=page.locator('[data-jo9-image-condition="'+target+'"]');
   }
   await exact.first().waitFor({state:'visible',timeout:20000});assert(await exact.count()>0,'actual '+target+' card has button');await exact.first().click();
   await page.waitForFunction(()=>window.JO9_IMAGE_CONDITIONS.state().open&&!window.JO9_IMAGE_CONDITIONS.state().loading,{timeout:30000});
   const info=await page.evaluate(()=>({state:JO9_IMAGE_CONDITIONS.state(),cards:[...document.querySelectorAll('.jo9-image-condition-card')].map(n=>({path:n.dataset.cutPath,legend:n.querySelector('legend').textContent,selects:[...n.querySelectorAll('select')].map(s=>({label:s.getAttribute('aria-label'),options:[...s.options].map(o=>({value:o.value,label:o.textContent}))})),number:n.querySelector('input[type=number]')?{min:n.querySelector('input[type=number]').min,step:n.querySelector('input[type=number]').step}:null})),hasBaseRule:!!document.querySelector('.jo9-image-condition-card[data-cut-path="'+JO9_IMAGE_CONDITIONS.state().base+'"]'),saveDisabled:document.querySelector('.jo9-image-condition-foot button:last-child').disabled}));
   assert(info.state.base===target.toLowerCase(),'normalized actual base');assert(info.state.rows>0,'actual B/C family present');assert(!info.hasBaseRule,'A fallback not editable');
   const first=info.cards[0];assert(first.selects[0].options.length===41&&first.selects[0].options[0].value==='-10'&&first.selects[0].options.at(-1).value==='10','morality half-step range');assert(first.selects[1].options.length===41,'max range same');
   assert(first.selects[2].options.map(o=>o.value).join(',')==='ge,le','money compares');assert(first.number.min==='0'&&first.number.step==='1','integer money input');
   assert(first.selects[3].options.length===7&&first.selects[3].options[0].label==='조건 없음','rank dropdown none plus six');assert(first.selects[4].options.length===7&&first.selects[4].options[0].label==='조건 없음','reputation dropdown none plus six');
   if(target===paths[0])await page.screenshot({path:P+'/live-condition-dialog.png'});
   snapshots.push({target,...info});await page.keyboard.press('Escape');assert(!(await page.evaluate(()=>JO9_IMAGE_CONDITIONS.state().open)),'escape closes actual modal');
 }
 if(noCutName){await page.evaluate(async target=>{await JO9_IMAGE_CONDITIONS.open(target);},'content/pic/bg/'+noCutName);const empty=await page.evaluate(()=>({state:JO9_IMAGE_CONDITIONS.state(),saveDisabled:document.querySelector('.jo9-image-condition-foot button:last-child').disabled,text:document.querySelector('[role=dialog]').textContent}));assert(empty.state.rows===0,'actual no-cut family');assert(empty.saveDisabled&&empty.text.includes('전환 컷 추가'),'actual empty guidance');snapshots.push({target:'content/pic/bg/'+noCutName,empty});await page.keyboard.press('Escape');}
 assert(requests.length>=3&&requests.every(r=>r.path.endsWith('/info')),'only read-only condition info requests');
 assert(!requests.some(r=>r.path.endsWith('/save')),'no condition writes');
 for(const input of inputs)assert(h(input.path)===input.sha256,'protected input unchanged: '+input.path);
 const report={pass:true,checks,baseUrl,addonSha256:crypto.createHash('sha256').update(addonRaw).digest('hex'),protectedInputs:inputs,infoRequests:requests.length,saveRequests:0,blockedNonReadOnlyRequests:blocked,pageErrors:errors,snapshots};
 fs.writeFileSync(P+'/live-ui-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,checks,infoRequests:requests.length,saveRequests:0,pageErrors:errors.length,workQspHash:inputs[0].sha256,fullQspHash:inputs[1].sha256}));
}catch(error){fs.writeFileSync(P+'/live-ui-report.json',JSON.stringify({pass:false,checks,error:String(error.stack||error)},null,2)+'\n');console.error(error);process.exitCode=1;}finally{if(owned)await owned.close();}})();
