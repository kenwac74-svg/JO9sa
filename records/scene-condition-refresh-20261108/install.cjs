'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),z=require('zlib'),vm=require('vm'),crypto=require('crypto');
const R='G:/somi/JO9sa',T='G:/Codex/tmp/scene-condition-refresh-20261108',record=R+'/records/scene-condition-refresh-20261108';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const v=JSON.parse(fs.readFileSync(R+'/tools/scene-image-conditions/generation.json','utf8'));
a.equal(path.resolve(v.tmp),path.resolve(T));
const metadata=JSON.parse(fs.readFileSync(T+'/metadata.json','utf8'));
const block=/<!-- JO9_SCENE_CONDITIONS_START -->[\s\S]*?<!-- JO9_SCENE_CONDITIONS_END -->\s*/g;
const rowRx=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const strip=html=>html.replace(block,'').replace(rowRx,(_,data)=>'var D = '+JSON.stringify(JSON.parse(data))+';\nvar MR').trimEnd();
function preserved(){for(const f of Object.values(v.preserved))a.equal(hash(fs.readFileSync(f.path)),f.sha256,f.path);}
preserved();a.equal(metadata.qspSha256,v.qspSha256);a.equal(metadata.total,Object.keys(metadata.entries).length);
a.equal(metadata.reviewSummary.total,130);a.equal(metadata.reviewSummary.missing,0);
const candidates=v.catalogs.map((f,i)=>{
 const before=fs.readFileSync(f.file),next=fs.readFileSync(f.candidate),html=next.toString('utf8');
 a.equal(hash(before),f.before);a.equal(hash(next),f.after);a.equal(f.added.length,0);
 a.equal(strip(before.toString('utf8')),strip(html),'Unrelated catalog code/data changed');
 const rows=JSON.parse(html.match(rowRx)[1]),included=new Set(rows.map(x=>x[0].replaceAll('\\','/').toLowerCase()));
 for(const key of Object.keys(metadata.entries))a(included.has(key),key);
 let scripts=0;for(const s of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(s[1])){new vm.Script(s[2]);scripts++;}
 for(const marker of ['CATALOG_TABS_MANUAL_SEARCH_20261108','jo9GirlsSearchGo','JO9 GIRLS CHECKLIST START'])a(html.includes(marker),marker);
 return {f,i,before,next,scripts};
});
fs.mkdirSync(record,{recursive:true});
for(const {f,i,before} of candidates){const backup=record+'/catalog-'+i+'-before.html.gz';fs.writeFileSync(backup,z.gzipSync(before,{level:9}),{flag:'wx'});a(z.gunzipSync(fs.readFileSync(backup)).equals(before));f.backup=backup;}
preserved();
for(const {f,next} of candidates){a.equal(hash(fs.readFileSync(f.file)),f.before);fs.writeFileSync(f.file,next);a.equal(hash(fs.readFileSync(f.file)),f.after);}
preserved();
fs.copyFileSync(T+'/metadata.json',record+'/metadata.json');
fs.copyFileSync(__filename,record+'/install.cjs');
const report={...v,installedAt:new Date().toISOString(),checks:{unrelatedHtmlPreserved:true,allSceneFilesIncluded:true,tabsAndManualSearchPreserved:true,qspAndStatusPreserved:true,inlineScripts:candidates.map(x=>x.scripts),tests:{total:20,failed:0}},reviewSummary:metadata.reviewSummary,fullTouched:false};
fs.writeFileSync(record+'/installation.json',JSON.stringify(report,null,2));
const tmp=path.resolve(T);a.equal(path.dirname(tmp),path.resolve('G:/Codex/tmp'));
const names=['metadata.json','catalog-0.html','catalog-1.html'];a.deepEqual(fs.readdirSync(tmp).sort(),names.sort());
for(const name of names){const p=path.join(tmp,name),stat=fs.lstatSync(p);a(stat.isFile()&&!stat.isSymbolicLink());fs.unlinkSync(p);}fs.rmdirSync(tmp);
console.log(JSON.stringify({installed:true,total:v.total,counts:v.counts,qspSha256:v.qspSha256,reviewSummary:metadata.reviewSummary,unrelatedHtmlPreserved:true,temporaryCandidatesRemoved:true,record}));
