'use strict';
const fs=require('fs'),crypto=require('crypto'),a=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const r=JSON.parse(fs.readFileSync(repo+'/records/quest-combat-adopted-20261030/installation.json'));
const server=JSON.parse(fs.readFileSync(game+'/modtools/text-workshop/runtime/server.json'));
const base=new URL(server.url);a(['127.0.0.1','localhost'].includes(base.hostname));a.equal(base.protocol,'http:');
(async()=>{
 const page=await fetch(new URL('catalog',base),{cache:'no-store',signal:AbortSignal.timeout(12000)});a(page.ok);
 const html=await page.text(),cfg=JSON.parse(html.match(/window\.JO9_CATALOG_BRIDGE\s*=\s*(\{[^;]+\});/)[1]);a.equal(new URL(cfg.url).origin,base.origin);
 const mob=JSON.parse(html.match(/window.JO9_MOB_SETS=(.*?);<\/script>/)[1]);
 const checks=[];
 async function fetchPng(p,expected){
  const url=new URL('api/pic',base);url.searchParams.set('t',cfg.token);url.searchParams.set('p',p.replace(/^content\/pic\//,''));url.searchParams.set('v',Date.now());
  const res=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});a(res.ok,'HTTP '+res.status);const b=Buffer.from(await res.arrayBuffer());
  a.equal(crypto.createHash('sha256').update(b).digest('hex'),expected,p);a.equal(b.readUInt32BE(16),795);a.equal(b.readUInt32BE(20),596);return b;
 }
 for(const f of r.files){
  await fetchPng(f.path,f.after);
  const slots=mob.entries.flatMap(e=>[e.standing,e.defeat]).filter(s=>s?.path===f.path);a.equal(slots.length,1);a.equal(slots[0].sha256,f.after);a.equal(slots[0].imageRedraw.record,r.id);
  checks.push({path:f.path,pass:true});
 }
 a.equal(checks.length,9);a.equal(mob.summary.missingDefeat,r.summary.missingDefeatAfter);
 await fetchPng(r.heldRetained.path,r.heldRetained.sha256);
 const heldSlot=mob.entries.find(e=>e.key==='egeya').defeat;a.equal(heldSlot.path,r.heldRetained.path);a.equal(heldSlot.sha256,r.heldRetained.sha256);a.notEqual(heldSlot.imageRedraw?.record,r.id);
 const result={pass:true,httpPngFiles:10,matchingNewPngFiles:9,liveUpdatedSlots:9,heldEgeyaPreserved:true,missingDefeat:mob.summary.missingDefeat,actualGameplay:false,checks};
 fs.writeFileSync(here+'/live-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,httpPngFiles:10,matchingNewPngFiles:9,liveUpdatedSlots:9,heldEgeyaPreserved:true,actualGameplay:false}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
