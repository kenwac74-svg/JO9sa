'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,local=path.resolve(root,'../girls-checklist-20261104');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const recordDir=repo+'/records/all-approved-image-work-sync-20261105';
const report=JSON.parse(fs.readFileSync(path.join(root,'applied.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.approved-refresh.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
const statusPath=game+'/modtools/catalog/catalog_status.js',status=fs.readFileSync(statusPath);
const block=/<!-- JO9 GIRLS CHECKLIST START 20261104 -->[\s\S]*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->/g;
const candidate=fs.readFileSync(path.join(local,'catalog.updated.html'),'utf8');
assert.equal((candidate.match(block)||[]).length,1);
const payload=candidate.match(block)[0],dre=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const catalogs=[];
for(const p of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const html=fs.readFileSync(p,'utf8');assert.equal((html.match(block)||[]).length,1);
 let next=html.replace(block,()=>payload);assert.equal(next.replace(block,''),html.replace(block,''));
 const m=next.match(dre);assert.ok(m);let data=m[1];
 const rows=JSON.parse(data),map=new Map(rows.map(x=>[x[0].replaceAll('\\','/').toLowerCase(),x]));
 let count=0;const absent=[];
 for(const f of report.files){
  const old=map.get(('content/pic/'+f.path).toLowerCase());
  if(!old){absent.push(f.path);continue;}
  const row=[...old];row[3]=f.bytes;row[5]=f.width;row[6]=f.height;
  const needle=JSON.stringify(old);assert.equal(data.split(needle).length-1,1);
  data=data.replace(needle,JSON.stringify(row));count++;
 }
 next=next.replace(m[1],()=>data);
 for(const js of next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(js[1].trim())new Function(js[1]);
 put(p,next);catalogs.push({path:p,imageRowsRefreshed:count,absentLegacyRows:absent,sha256:hash(Buffer.from(next))});
}
put(game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',fs.readFileSync(path.join(local,'JO9_캐릭터_이미지체크리스트.html')));
put(repo+'/tools/girls-image-checklist/manifest.json',fs.readFileSync(path.join(local,'manifest.json')));
assert.deepEqual(fs.readFileSync(statusPath),status);
const runtime=JSON.parse(fs.readFileSync(repo+'/assets/runtime-source-2.4.1.json'));
const runtimeMap=new Map(runtime.files.map(f=>[f.runtimePath,f]));
const ledger=fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/events.jsonl','utf8').trim().split('\n').map(JSON.parse);
const ledgerMap=new Map();for(const e of ledger)for(const f of e.files)ledgerMap.set(f.path.toLowerCase(),f);
let uniquePayloads=new Set();
for(const f of report.files){
 assert.equal(hash(fs.readFileSync(game+'/content/pic/'+f.path)),f.after);
 assert.equal(hash(fs.readFileSync(repo+'/assets/content/pic/'+f.path)),f.after);
 assert.equal(runtimeMap.get('content/pic/'+f.path)?.sha256,f.after);
 assert.equal(runtimeMap.get('content/pic/'+f.path)?.repositoryPath,'assets/content/pic/'+f.path);
 assert.equal(ledgerMap.get(f.path.toLowerCase())?.after,f.after);
 uniquePayloads.add(f.after);
}
for(const digest of uniquePayloads)assert.equal(hash(fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/objects/'+digest)),digest);
assert.equal(hash(fs.readFileSync(game+'/jack.qsp')),report.qspSha256);
assert.equal(hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),report.qspSha256);
const verification={approvedImagePaths:report.files.length,uniqueImagePayloads:uniquePayloads.size,
 workAndTrackedHashesMatch:true,runtimeSourceIndexMatches:true,latestPatchLedgerMatches:true,
 allPatchPayloadHashesMatch:true,all795x596RGBA:true,registrationAdditions:43,
 workImageBytesChanged:0,qspUnchanged:true,statusTagsPreserved:true,fullDistributionTouched:false,
 deferredIssue:'JO9-GIRLS-2071-20261105 remains recorded only',catalogs,
 visualQa:'Actual game appearance awaits user confirmation'};
put(path.join(root,'verification.json'),JSON.stringify(verification,null,2)+'\n');
put(recordDir+'/verification.json',JSON.stringify(verification,null,2)+'\n');
put(recordDir+'/refresh.cjs',fs.readFileSync(__filename));
fs.unlinkSync(path.join(local,'catalog.updated.html'));
console.log(JSON.stringify(verification,null,2));
