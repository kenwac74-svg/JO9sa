'use strict';
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa',record=repo+'/records/felicity-size-match-20261105';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const applied=JSON.parse(fs.readFileSync(__dirname+'/applied.json'));
const text=fs.readFileSync(game+'/modtools/catalog/catalog_workshop_config.js','utf8').replace(/^\uFEFF/,'');
const cfg=JSON.parse(text.match(/window.JO9_CATALOG_BRIDGE\s*=\s*([\s\S]*?);?\s*$/)[1].replace(/;$/,''));
assert.ok(['localhost','127.0.0.1'].includes(new URL(cfg.url).hostname));
const get=url=>new Promise((resolve,reject)=>{const q=http.get(url,r=>{const chunks=[];r.on('data',b=>chunks.push(b));r.on('end',()=>{if(r.statusCode!==200)return reject(Error('HTTP '+r.statusCode));resolve(Buffer.concat(chunks));});});q.on('error',reject);q.setTimeout(10000,()=>q.destroy(Error('Timeout')));});
(async()=>{
 const checks=[];
 for(const f of applied.files){
  const u=new URL('/api/catalog-asset',cfg.url);u.searchParams.set('t',cfg.token);u.searchParams.set('original','0');u.searchParams.set('p',f.runtimePath);
  const b=await get(u);assert.equal(hash(b),f.after);assert.equal(b.readUInt32BE(16),795);assert.equal(b.readUInt32BE(20),596);
  checks.push({path:f.runtimePath,dimensions:[795,596],liveHttpHashMatches:true});
 }
 const html=await get(new URL('/catalog?girlssets=1&v=felicity_20261105',cfg.url));assert.ok(html.includes(Buffer.from('jo9-girls-named-only')));assert.ok(html.includes(Buffer.from('펠리시티')));
 const tracker=fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/events.jsonl','utf8').trim().split('\n').map(JSON.parse);
 const event=tracker.find(x=>x.id===applied.id);assert.equal(event.files.length,5);
 assert.equal(hash(fs.readFileSync(game+'/jack.qsp')),applied.qspSha256);
 assert.equal(hash(fs.readFileSync(game+'/json/slaves/2572_felicity.json')),applied.jsonSha256);
 const report={status:'PASS',pngAndLiveAssetChecks:checks,catalogServed:true,patchLedgerFiles:5,actualGameEXEVisualConfirmation:'pending user'};
 for(const dst of [__dirname+'/live-check.json',record+'/live-check.json'])fs.writeFileSync(dst,JSON.stringify(report,null,2)+'\n');
 for(const f of ['prepare.py','check-live.cjs'])fs.copyFileSync(__dirname+'/'+f,record+'/'+f);
 console.log(JSON.stringify({status:report.status,livePngMatches:checks.length,patchLedgerFiles:5,catalogServed:true,actualEXE:'not run'}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
