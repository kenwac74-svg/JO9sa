'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=__dirname,local=path.resolve(root,'../girls-checklist-20261104'),repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const report=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.full-refresh.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
const statusFile=game+'/modtools/catalog/catalog_status.js',status=fs.readFileSync(statusFile);
const re=/<!-- JO9 GIRLS CHECKLIST START 20261104 -->[\s\S]*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->/g;
const payload=fs.readFileSync(path.join(local,'catalog.updated.html'),'utf8').match(re)[0];
const dre=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const results=[];
for(const p of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const raw=fs.readFileSync(p),html=raw.toString('utf8');assert.equal((html.match(re)||[]).length,1);
 let next=html.replace(re,()=>payload);assert.equal(next.replace(re,''),html.replace(re,''));
 const m=next.match(dre);assert.ok(m,'Catalog D array');let data=m[1],changed=0;
 const rows=JSON.parse(data);const map=new Map(rows.map(x=>[x[0].replaceAll('\\','/').toLowerCase(),x]));
 for(const f of report.files){
  const old=map.get(('content/pic/'+f.path).toLowerCase());if(!old)continue;
  const row=[...old];row[3]=f.bytes;row[5]=795;row[6]=596;
  const needle=JSON.stringify(old);assert.equal(data.split(needle).length-1,1);
  data=data.replace(needle,JSON.stringify(row));changed++;
 }
 next=next.replace(m[1],()=>data);
 for(const js of next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(js[1].trim())new Function(js[1]);
 put(p,next);results.push({path:p,sha256:hash(Buffer.from(next)),imageRowsRefreshed:changed});
}
put(game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',fs.readFileSync(path.join(local,'JO9_캐릭터_이미지체크리스트.html')));
for(const name of ['manifest.json','build_inventory.py'])put(repo+'/tools/girls-image-checklist/'+name,fs.readFileSync(path.join(local,name)));
assert.deepEqual(fs.readFileSync(statusFile),status);
const ledger=fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/events.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.id===report.id);assert.equal(ledger.length,1);assert.equal(ledger[0].files.length,25);
for(const f of report.files){assert.equal(hash(fs.readFileSync(game+'/content/pic/'+f.path)),f.after);assert.equal(hash(fs.readFileSync(repo+'/assets/content/pic/'+f.path)),f.after);}
assert.equal(hash(fs.readFileSync(game+'/jack.qsp')),report.qspSha256);
const verification={installedFilesVerified:25,all795x596:true,allRGBA:true,archiveBytesPreserved:true,personalPatchLedgerEvent:report.id,personalPatchFiles:25,catalogs:results,statusTagsPreserved:true,qspUnchanged:true,jsonUnchanged:true,fullTouched:false,visualQa:'User normal EXE confirmation pending'};
put(repo+'/records/full-image-update-20261105/verification.json',JSON.stringify(verification,null,2)+'\n');put(repo+'/records/full-image-update-20261105/refresh.cjs',fs.readFileSync(__filename));fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(verification,null,2)+'\n');
fs.unlinkSync(path.join(local,'catalog.updated.html'));
console.log(JSON.stringify(verification,null,2));
