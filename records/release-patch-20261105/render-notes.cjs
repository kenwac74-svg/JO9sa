'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const profile='G:/Codex/tmp/jo9-patch-20261105/html-qa';
 const context=await chromium.launchPersistentContext(profile,{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,viewport:{width:1150,height:900},deviceScaleFactor:1});
 const results=[];
 try{
  const page=await context.newPage();
  for(const lang of ['KO','EN']){
   const p=path.join(__dirname,'notes','RELEASE_NOTES_'+lang+'.html');
   await page.goto(pathToFileURL(p).href,{waitUntil:'load'});
   await page.evaluate(()=>Promise.all(Array.from(document.images).map(i=>i.decode())));
   const info=await page.evaluate(()=>({images:document.images.length,decoded:[...document.images].every(i=>i.complete&&i.naturalWidth>0),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,externalAssets:[...document.querySelectorAll('[src],[href]')].filter(e=>/^(?:https?:)?\/\//.test(e.getAttribute('src')||e.getAttribute('href'))).length,title:document.title,height:document.documentElement.scrollHeight}));
   if(!info.decoded||info.horizontalOverflow||info.externalAssets)throw Error('Document layout check failed: '+lang);
   await page.screenshot({path:path.join(__dirname,'notes-preview-'+lang+'.png'),fullPage:true});results.push({lang,...info});
  }
  fs.writeFileSync(path.join(__dirname,'notes-browser-check.json'),JSON.stringify({status:'PASS',documents:results},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',documents:results.map(r=>({lang:r.lang,images:r.images,horizontalOverflow:r.horizontalOverflow,height:r.height}))}));
 }finally{await context.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
