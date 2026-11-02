'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),z=require('node:zlib'),crypto=require('node:crypto');
const ROOT=__dirname,REPO='G:/somi/JO9sa',GAME='G:/somi/Jack O Nine Tails v2.4_work/game';
const manifest=JSON.parse(fs.readFileSync(ROOT+'/assets-prepared.json','utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),sha=p=>hash(read(p));
a.equal(manifest.game,GAME);a.equal(manifest.assets.length,3);a(!fs.existsSync(ROOT+'/assets-installed.json'),'Already installed');
const normalized=p=>path.resolve(p).toLowerCase();
function authorize(p){
 const roots=[GAME,REPO+'/assets/json',REPO+'/resources/new'];
 a(roots.some(root=>normalized(p).startsWith(normalized(root)+path.sep)),'Outside approved asset roots: '+p);
 let parent=path.dirname(p);while(!fs.existsSync(parent))parent=path.dirname(parent);
 const actual=normalized(fs.realpathSync(parent));a(roots.some(root=>actual===normalized(root)||actual.startsWith(normalized(root)+path.sep)),'Linked target outside asset roots');
}
const outputs=[];
for(const item of manifest.assets){
 a.equal(sha(item.staged),item.sha256);a.equal(sha(GAME+'/'+item.source),item.sourceSha256);
 for(const target of [GAME+'/'+item.path,REPO+'/resources/new/'+item.path])outputs.push({target,source:item.staged,before:null,after:item.sha256});
}
outputs.push({target:GAME+'/'+manifest.json.path,source:manifest.json.staged,before:manifest.json.before,after:manifest.json.after});
outputs.push({target:REPO+'/assets/'+manifest.json.path,source:manifest.json.staged,before:null,after:manifest.json.after});
for(const x of manifest.protected)a.equal(sha(x.path),x.sha256,'Protected input changed: '+x.path);
for(const item of outputs){authorize(item.target);a.equal(fs.existsSync(item.target)?sha(item.target):null,item.before,'Existing output needs review: '+item.target);a.equal(sha(item.source),item.after);}
const beforeJSON=read(GAME+'/'+manifest.json.path);a.equal(hash(beforeJSON),manifest.json.before);
const recovery=ROOT+'/recovery';fs.mkdirSync(recovery,{recursive:true});
const archive=recovery+'/2583_galateya.before.json.gz';fs.writeFileSync(archive,z.gzipSync(beforeJSON,{level:9}),{flag:'wx'});a(z.gunzipSync(read(archive)).equals(beforeJSON));
const written=[];
for(const item of outputs){
 a.equal(fs.existsSync(item.target)?sha(item.target):null,item.before,'Concurrent asset edit: '+item.target);
 fs.mkdirSync(path.dirname(item.target),{recursive:true});const temporary=item.target+'.galateya-outfit.tmp';a(!fs.existsSync(temporary));
 fs.writeFileSync(temporary,read(item.source),{flag:'wx'});a.equal(sha(temporary),item.after);
 a.equal(fs.existsSync(item.target)?sha(item.target):null,item.before,'Concurrent asset edit before commit');
 fs.renameSync(temporary,item.target);a.equal(sha(item.target),item.after);written.push({path:item.target,sha256:item.after,bytes:fs.statSync(item.target).size});
}
const catalogRoot=GAME+'/modtools/catalog',ledger=catalogRoot+'/image_work/personal-patch/events.jsonl',ledgerBefore=read(ledger).toString('utf8');
const event=require(REPO+'/tools/text-workshop/personal-patch.cjs').create(GAME,catalogRoot).record({id:manifest.id,created:manifest.created,
 files:manifest.assets.map(x=>({path:x.path.slice('content/pic/'.length),before:null,after:x.sha256}))},'replace');
a(event,'Personal image event already existed unexpectedly');a(read(ledger).toString('utf8').startsWith(ledgerBefore),'Prior ledger entries were changed');
for(const x of manifest.protected)a.equal(sha(x.path),x.sha256,'Protected input changed after install: '+x.path);
const after=JSON.parse(read(GAME+'/'+manifest.json.path).toString('utf8')),before=JSON.parse(beforeJSON.toString('utf8'));
for(const [key,value] of Object.entries(before))a.deepEqual(after[key],value,'Existing property changed: '+key);
for(const key of ['fullmade','fullsecretary','fullmistress','indpack_title','indpack_naked','indpack_maid','indpack_secr','indpack_dom'])a(fs.existsSync(GAME+'/content/pic/'+after[key]+'.png'),'Image route missing: '+key);
const result={id:manifest.id,installedAt:new Date().toISOString(),status:'ASSETS_INSTALLED_PENDING_RUNTIME_TEST',written,jsonAdded:manifest.json.addedKeys,
 originalFieldsPreserved:Object.keys(before).length,sourceArtAndOriginalNakedPreserved:true,qspUnchanged:true,fullDistributionUnchanged:true,personalPatchEvent:event,
 trackedJson:REPO+'/assets/'+manifest.json.path,recovery:archive};
fs.writeFileSync(ROOT+'/assets-installed.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,files:written.length,originalFieldsPreserved:result.originalFieldsPreserved,qspUnchanged:true,fullDistributionUnchanged:true}));
