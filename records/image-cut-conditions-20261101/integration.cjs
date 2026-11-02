'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),rules=require('./image-cut-condition-rules.cjs');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',T=process.env.JO9_IC_HTTP_ROOT||'G:/Codex/tmp/image-cut-conditions-http-20261101';
async function main(){
 a(!fs.existsSync(T));fs.mkdirSync(T+'/game',{recursive:true});fs.mkdirSync(T+'/tools');fs.mkdirSync(T+'/catalog');fs.mkdirSync(T+'/runtime');
 const protectedQsp=[W+'/jack.qsp',F+'/jack.qsp'].map(p=>({p,hash:c.hash(fs.readFileSync(p))}));const initial=c.parse(fs.readFileSync(W+'/jack.qsp')),ic=initial.locations.find(l=>l.name==='interior_change');initial.lines[ic.body]=c.shift(rules.installBaseBody(c.shift(initial.lines[ic.body],5)),-5);const raw=c.serialize(initial);fs.writeFileSync(T+'/game/jack.qsp',raw);fs.symlinkSync(fs.realpathSync(W+'/content'),T+'/game/content','junction');
 for(const name of fs.readdirSync(R+'/tools/text-workshop'))if(/\.(cjs|js|ps1)$/.test(name)||name==='index.html')fs.copyFileSync(R+'/tools/text-workshop/'+name,T+'/tools/'+name);
 for(const name of ['server.cjs','image-cut-conditions.cjs','image-cut-condition-rules.cjs','catalog-cut-conditions.js'])fs.copyFileSync(__dirname+'/'+name,T+'/tools/'+name);
 const liveCatalog=W+'/modtools/catalog';for(const name of fs.readdirSync(liveCatalog))if(/\.(?:html|js|json)$/.test(name)&&fs.statSync(liveCatalog+'/'+name).isFile())fs.copyFileSync(liveCatalog+'/'+name,T+'/catalog/'+name);
 let child,browser,stderr='';const checks=[];const check=(name,condition)=>{a(condition,name);checks.push(name);};
 try{
  child=cp.spawn(process.execPath,[T+'/tools/server.cjs','--game-dir',T+'/game','--catalog-dir',T+'/catalog','--original-dir','G:/somi/JO9O/game','--runtime',T+'/runtime','--port','0'],{windowsHide:true,stdio:['ignore','pipe','pipe']});child.stderr.on('data',x=>stderr+=x);
  const state=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Fixture server timeout '+stderr)),20000);child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);reject(Error('Fixture server exit '+code+' '+stderr));});child.stdout.on('data',b=>{text+=b;const m=text.match(/\{[^\r\n]+\}/);if(m){clearTimeout(timer);resolve(JSON.parse(m[0]));}});});
  const html=await(await fetch(state.url+'catalog')).text(),cfg=JSON.parse(html.match(/window\.JO9_CATALOG_BRIDGE=(\{[^<]+\});<\/script>/)[1]);
  const call=async(action,data,headers={})=>{const r=await fetch(state.url+'api/catalog/cut-conditions/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-JO9-Token':cfg.token,...headers},body:JSON.stringify(data)});return{status:r.status,value:await r.json()};};
  check('addon is served and injected',html.includes('catalog-cut-conditions.js')&&(await fetch(state.url+'catalog-cut-conditions.js')).status===200);
  check('missing token is rejected',(await call('info',{path:'bg/beach.png'},{'X-JO9-Token':''})).status===403);
  check('foreign origin is rejected',(await call('info',{path:'bg/beach.png'},{Origin:'https://example.invalid'})).status===403);
  let i=(await call('info',{path:'bg/beach.png'})).value;check('real family is returned',i.family.items.some(x=>x.cutIndex===2));
  const rule={base:i.base,path:i.family.items.find(x=>x.cutIndex===2).path,morality:{min:-2,max:-0.5},money:{op:'ge',value:100},rank:0,reputation:0};
  const saved=await call('save',{base:i.base,before:i.qspHash,rules:[rule]});check('real HTTP transaction saves to fixture QSP',saved.status===200&&saved.value.qspHash!==i.qspHash);
  const latestRaw=fs.readFileSync(T+'/game/jack.qsp'),doc=c.parse(latestRaw);check('saved rules survive actual QSP readback',JSON.stringify(rules.readRules(c.shift(doc.lines[doc.locations.find(x=>x.name==='interior_change').body],5)))===JSON.stringify([rule]));
  check('stale QSP version is rejected',(await call('save',{base:i.base,before:i.qspHash,rules:[]})).status===400);
  check('stale request preserves file',fs.readFileSync(T+'/game/jack.qsp').equals(latestRaw));
  check('saving state reopens with exact values',JSON.stringify((await call('info',{path:i.base})).value.rules)===JSON.stringify([rule]));
  const clear=await call('save',{base:i.base,before:saved.value.qspHash,rules:[]});check('clear removes rules and restores original body',clear.status===200&&fs.readFileSync(T+'/game/jack.qsp').equals(raw));
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-first-run']});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/catalog-asset?*',r=>r.abort());await page.goto(state.url+'catalog?image=content%2Fpic%2Fbg%2Fbeach.png',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.JO9_IMAGE_CONDITIONS?.installed);
  await page.evaluate(()=>window.JO9_IMAGE_CONDITIONS.open('content/pic/bg/beach.png'));await page.waitForSelector('.jo9-image-condition-card');
  const card=page.locator('.jo9-image-condition-card').first();await card.locator('input[type=checkbox]').nth(0).check();await card.locator('input[type=checkbox]').nth(1).check();await card.locator('select').nth(0).selectOption('-2');await card.locator('select').nth(1).selectOption('-0.5');await card.locator('input[type=checkbox]').nth(2).check();await card.locator('input[type=number]').fill('100');await card.locator('select').nth(3).selectOption('0');await card.locator('select').nth(4).selectOption('0');
  await page.getByRole('button',{name:'조건 저장',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.jo9-image-condition-status')?.dataset.saved==='true');
  check('actual browser saves all four field kinds',JSON.stringify((await call('info',{path:i.base})).value.rules)===JSON.stringify([rule]));
  await page.screenshot({path:__dirname+'/integrated-condition-dialog.png'});
  await card.locator('input[type=checkbox]').nth(0).uncheck();await page.getByRole('button',{name:'조건 저장',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.jo9-image-condition-status')?.dataset.saved==='true');
  check('browser disabling rule restores original QSP',fs.readFileSync(T+'/game/jack.qsp').equals(raw));check('no browser page errors',errors.length===0);
  await page.getByRole('button',{name:'닫기',exact:true}).click();check('modal closes',await page.locator('.jo9-image-condition-overlay').count()===0);
  for(const row of protectedQsp)check('production unchanged '+row.p,c.hash(fs.readFileSync(row.p))===row.hash);
  fs.writeFileSync(__dirname+'/integration-report.json',JSON.stringify({pass:true,checks:checks.length,names:checks,serverErrors:stderr,browserErrors:errors,fixtureRoot:T,productionUnchanged:true},null,2));console.log(JSON.stringify({pass:true,checks:checks.length,productionUnchanged:true}));
 }finally{if(browser)await browser.close();if(child)child.kill();fs.writeFileSync(__dirname+'/integration-stderr.log',stderr);}
}
main().catch(e=>{fs.writeFileSync(__dirname+'/integration-failure.txt',e.stack);console.error(e.stack);process.exitCode=1;});
