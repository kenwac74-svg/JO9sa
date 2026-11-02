'use strict';
const fs=require('fs'),crypto=require('crypto'),a=require('assert/strict');
const out=__dirname,game='G:/somi/Jack O Nine Tails v2.4_work/game',record=JSON.parse(fs.readFileSync(out+'/installation.json'));
const server=JSON.parse(fs.readFileSync(game+'/modtools/text-workshop/runtime/server.json')),base=new URL(server.url);
a(['127.0.0.1','localhost'].includes(base.hostname));a.equal(base.protocol,'http:');
(async()=>{
 const res=await fetch(new URL('catalog',base),{cache:'no-store',signal:AbortSignal.timeout(12000)});a(res.ok);
 const html=await res.text(),cfg=JSON.parse(html.match(/window\.JO9_CATALOG_BRIDGE\s*=\s*(\{[^;]+\});/)[1]);a.equal(new URL(cfg.url).origin,base.origin);
 const mob=JSON.parse(html.match(/window.JO9_MOB_SETS=(.*?);<\/script>/)[1]);
 let i=0;const checks=[];
 async function worker(){while(i<record.files.length){const f=record.files[i++],url=new URL('api/pic',base);url.searchParams.set('t',cfg.token);url.searchParams.set('p',f.path.replace(/^content\/pic\//,''));url.searchParams.set('v',Date.now());
  const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});a(r.ok,'HTTP '+r.status);
  const b=Buffer.from(await r.arrayBuffer());a.equal(crypto.createHash('sha256').update(b).digest('hex'),f.after,f.path);a.equal(b.readUInt32BE(16),150);a.equal(b.readUInt32BE(20),150);
  for(const e of mob.entries)if(e.portrait?.path===f.path)a.equal(e.portrait.sha256,f.after);
  checks.push({path:f.path,pass:true});
 }}
 await Promise.all(Array.from({length:4},worker));
 const result={pass:true,httpPngFiles:checks.length,matchingPngFiles:checks.length,dimensions:[150,150],metadataMatches:true,manualGamePlay:false,checks};
 fs.writeFileSync(out+'/live-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,httpPngFiles:checks.length,matchingPngFiles:checks.length,dimensions:[150,150]}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
