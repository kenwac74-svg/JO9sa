'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),a=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ROOT=__dirname,build=JSON.parse(fs.readFileSync(ROOT+'/build-report.en.json','utf8')),file=build.file,html=fs.readFileSync(file,'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
const qsp=['G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'],before=Object.fromEntries(qsp.map(f=>[f,hash(f)]));
let checks=0;const check=(v,m)=>{checks++;a.ok(v,m);};
const temporary='G:/Codex/tmp/release-guide-en-preview-20261101';let browser;
(async()=>{try{
 check(!fs.existsSync(temporary),'Dedicated browser temporary folder must be new');fs.mkdirSync(temporary,{recursive:true});
 check(Buffer.byteLength(html)<600*1024,'Self-contained HTML below 600 KiB');
 check(!/(?:src|href)\s*=\s*["'](?:https?:|\/\/|file:)/i.test(html),'No external resource or absolute file references');
 check(!/(?:G:\\|C:\\|127\.0\.0\.1|JO9sa\/|JO9sa\\|jo9_cruel_mercy)/i.test(html),'No private paths, local server or hidden variable identifiers');
 check(!/<(?:iframe|object|embed|form)\b/i.test(html),'No embedded executable content or forms');
 browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,env:{...process.env,TMP:temporary,TEMP:temporary}});
 const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1}),page=await context.newPage(),errors=[],network=[];
 page.on('pageerror',e=>errors.push(String(e)));await page.route(/^https?:/,r=>{network.push(r.request().url());return r.abort();});
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(pathToFileURL(file).href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>{im.loading='eager';return im.decode();}));});
 check(await page.locator('img').count()===3,'Three embedded illustrations after moving in-development stock out of highlights');
 const imgs=await page.locator('img').evaluateAll(ns=>ns.map(n=>({src:n.src.slice(0,22),w:n.naturalWidth,h:n.naturalHeight,alt:n.alt,display:n.getBoundingClientRect().width})));
 for(const im of imgs){check(im.src.startsWith('data:image/webp;base64'),'Image embedded as WebP');check(im.w>0&&im.w<=640,'Source image constrained to 640px');check(im.alt.length>8,'Image has descriptive alt text');}
 check(await page.locator('nav a').count()===3,'Three requested document sections');
 for(const anchor of await page.locator('a').evaluateAll(ns=>ns.map(n=>n.getAttribute('href')))){check(anchor.startsWith('#'),'All links stay inside single file');check(await page.locator(anchor).count()===1,'Internal anchor resolves');}
 check(await page.locator('html').getAttribute('lang')==='en','English document language');
 check(await page.locator('#expand240').innerText()==='Expand all','English expand button');
 check(await page.locator('#changes240 details').count()===7,'Seven full cumulative change categories');
 check(await page.locator('#changes240 li').count()===48,'All 48 cumulative update items present');
 check(await page.locator('#fixes li').count()===36,'36 grouped bugfix items');check(await page.locator('.other-list li').count()===11,'Eleven other changes');
 check(!await page.locator('.feature-grid').innerText().then(s=>/Agrabah|Fresh Fruit|Agrabah Wine/i.test(s)),'Unfinished Agrabah stock is absent from highlights');
 check(await page.locator('.other-list').innerText().then(s=>/Agrabah special inventory \(in development\)/i.test(s)),'Agrabah stock is explicitly in-development in other changes');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Desktop has no horizontal overflow');
 await page.screenshot({path:ROOT+'/preview-desktop.en.png'});await page.locator('.feature-grid').screenshot({path:ROOT+'/preview-updates.en.png'});
 await page.locator('#expand240').click();check(await page.locator('#changes240 details[open]').count()===7,'Expand all works');check(await page.locator('#expand240').getAttribute('aria-expanded')==='true','Expanded button state accessible');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Expanded desktop has no overflow');
 await page.locator('#changes240 details').first().screenshot({path:ROOT+'/preview-cumulative.en.png'});
 await page.locator('#expand240').click();check(await page.locator('#changes240 details[open]').count()===0,'Collapse all works');
 const first=page.locator('#changes240 summary').first();await first.focus();await page.keyboard.press('Enter');check(await page.locator('#changes240 details[open]').count()===1,'Native keyboard toggle works');await first.press('Enter');
 await page.locator('nav a[href="#fixes"]').click();check(new URL(page.url()).hash==='#fixes','Bugfix section navigation works');check(await page.locator('#fixes').evaluate(el=>Math.abs(el.getBoundingClientRect().top-78)<8),'Navigation scrolls to bugfix section');await page.screenshot({path:ROOT+'/preview-fixes.en.png'});
 const mobile=[];
 for(const width of [390,360]){await page.setViewportSize({width,height:844});await page.goto(pathToFileURL(file).href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile '+width+' has no overflow');if(width===390)await page.screenshot({path:ROOT+'/preview-mobile.en.png'});await page.locator('#expand240').click();check(await page.locator('#changes240 details[open]').count()===7,'Mobile expand all '+width);check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Expanded mobile '+width+' has no overflow');mobile.push(width);}
 check(errors.length===0,'No browser JavaScript errors');check(network.length===0,'No HTTP or HTTPS requests');
 for(const [f,h]of Object.entries(before))check(hash(f)===h,'Game QSP unchanged');for(const asset of build.embedded_images)check(hash('G:/somi/Jack O Nine Tails v2.4_work/game/'+asset.source)===asset.source_sha256,'Original illustration unchanged');
 const report={pass:true,checks,html_bytes:Buffer.byteLength(html),html_sha256:hash(file),images:imgs.map(({src,...x})=>x),desktop:1280,mobile,http_requests:network,page_errors:errors,cumulative_groups:7,cumulative_items:48,bugfix_items:36,other_items:11,qsp_unchanged:true,source_images_unchanged:true};fs.writeFileSync(ROOT+'/verification.en.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }catch(error){fs.writeFileSync(ROOT+'/verification.en.json',JSON.stringify({pass:false,checks,error:String(error.stack||error)},null,2)+'\n');console.error(error);process.exitCode=1;}finally{if(browser)await browser.close();const abs=path.resolve(temporary);a.equal(abs.toLowerCase(),path.resolve('G:/Codex/tmp/release-guide-en-preview-20261101').toLowerCase());if(fs.existsSync(abs)){a(!fs.lstatSync(abs).isSymbolicLink());fs.rmSync(abs,{recursive:true,force:true});}}})();
