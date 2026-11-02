'use strict';
const fs=require('fs'),crypto=require('crypto'),a=require('assert/strict');
const out=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const record=JSON.parse(fs.readFileSync(repo+'/records/dimaher-d-adopted-20261029/installation.json'));
const server=JSON.parse(fs.readFileSync(game+'/modtools/text-workshop/runtime/server.json'));
const base=new URL(server.url);a(['127.0.0.1','localhost'].includes(base.hostname));a.equal(base.protocol,'http:');
(async()=>{
 const page=await fetch(new URL('catalog',base),{cache:'no-store',signal:AbortSignal.timeout(12000)});a(page.ok);
 const html=await page.text(),cfg=JSON.parse(html.match(/window\.JO9_CATALOG_BRIDGE\s*=\s*(\{[^;]+\});/)[1]);a.equal(new URL(cfg.url).origin,base.origin);
 let i=0;const checks=[];
 async function worker(){while(i<record.files.length){const f=record.files[i++],url=new URL('api/pic',base);url.searchParams.set('t',cfg.token);url.searchParams.set('p',f.path.replace(/^content\/pic\//,''));url.searchParams.set('v',Date.now());
  const res=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});a(res.ok,'HTTP '+res.status);const b=Buffer.from(await res.arrayBuffer());a.equal(crypto.createHash('sha256').update(b).digest('hex'),f.after,f.path);a.equal(b.readUInt32BE(16),795);a.equal(b.readUInt32BE(20),596);checks.push({path:f.path,pass:true});
 }}
 await Promise.all(Array.from({length:4},worker));
 const result={pass:true,httpPngFiles:checks.length,matchingPngFiles:checks.length,liveSlots:2,checks};fs.writeFileSync(out+'/live-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,httpPngFiles:checks.length,matchingPngFiles:checks.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
