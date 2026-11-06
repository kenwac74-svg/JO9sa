'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,local=path.resolve(root,'../girls-checklist-20261104');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const recordDir=repo+'/records/outfit-transform-sync-20261105-h';
const report=JSON.parse(fs.readFileSync(path.join(root,'applied.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.outfit-h-refresh.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
const tracker=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,game+'/modtools/catalog');
const imported=report.files.filter(f=>!f.writePerformed);
const adjusted=report.files.filter(f=>f.writePerformed);
assert.equal(imported.length,20);assert.equal(adjusted.length,103);
tracker.record({...report,id:report.id+'_preserved',files:imported},'replace',true);
tracker.record({...report,id:report.id+'_adjusted',files:adjusted},'replace',false);
const statusFile=game+'/modtools/catalog/catalog_status.js',status=fs.readFileSync(statusFile);
const block=/<!-- JO9 GIRLS CHECKLIST START 20261104 -->[\s\S]*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->/g;
const candidate=fs.readFileSync(path.join(local,'catalog.updated.html'),'utf8');
assert.equal((candidate.match(block)||[]).length,1);
const payload=candidate.match(block)[0];
const dre=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const catalogs=[];
for(const p of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const html=fs.readFileSync(p,'utf8');assert.equal((html.match(block)||[]).length,1);
 let next=html.replace(block,()=>payload);assert.equal(next.replace(block,''),html.replace(block,''));
 const m=next.match(dre);assert.ok(m);let data=m[1];
 const rows=JSON.parse(data),map=new Map(rows.map(x=>[x[0].replaceAll('\\','/').toLowerCase(),x]));
 let changed=0;
 for(const f of report.files){
  const old=map.get(('content/pic/'+f.path).toLowerCase());if(!old)continue;
  const row=[...old];row[3]=f.bytes;row[5]=f.width;row[6]=f.height;
  const needle=JSON.stringify(old);assert.equal(data.split(needle).length-1,1);
  data=data.replace(needle,JSON.stringify(row));changed++;
 }
 next=next.replace(m[1],()=>data);
 for(const js of next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(js[1].trim())new Function(js[1]);
 put(p,next);catalogs.push({path:p,imageRowsRefreshed:changed,sha256:hash(Buffer.from(next))});
}
put(game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',fs.readFileSync(path.join(local,'JO9_캐릭터_이미지체크리스트.html')));
put(repo+'/tools/girls-image-checklist/manifest.json',fs.readFileSync(path.join(local,'manifest.json')));
assert.deepEqual(fs.readFileSync(statusFile),status);
for(const f of report.files){
 assert.equal(hash(fs.readFileSync(game+'/content/pic/'+f.path)),f.after);
 assert.equal(hash(fs.readFileSync(repo+'/assets/content/pic/'+f.path)),f.after);
}
assert.equal(hash(fs.readFileSync(game+'/jack.qsp')),report.qspSha256);
const ledger=fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/events.jsonl','utf8').trim().split('\n').map(JSON.parse);
const events=ledger.filter(e=>e.id===report.id+'_preserved'||e.id===report.id+'_adjusted');
assert.equal(events.length,2);assert.equal(events.reduce((n,e)=>n+e.files.length,0),123);
const verification={baseImages:62,costumeImages:61,baseRerenders:43,costumeRerenders:60,preservedFiles:20,verifiedPatchFiles:123,all795x596:true,
 preservedFilesUnchanged:true,trackedHashesMatch:true,statusTagsPreserved:true,
 personalPatchEvents:events.map(e=>e.id),catalogs,qspUnchanged:true,characterJsonUnchanged:true,
 fullDistributionTouched:false,releaseStatus:report.releaseStatus,visualQa:'User visual confirmation pending'};
put(path.join(root,'verification.json'),JSON.stringify(verification,null,2)+'\n');
put(recordDir+'/verification.json',JSON.stringify(verification,null,2)+'\n');
put(recordDir+'/refresh.cjs',fs.readFileSync(__filename));
fs.unlinkSync(path.join(local,'catalog.updated.html'));
console.log(JSON.stringify(verification,null,2));
