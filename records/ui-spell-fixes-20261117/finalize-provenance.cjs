'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',H=__dirname;
const j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const patchPath=H+'/mods/2026-11-17_duplicato_person_id_and_actual_bottom_rim.json',patch=j(patchPath),edit=patch.edits.find(x=>x.location==='_layout');
const base=c.parse(fs.readFileSync(H+'/scoped-before.qsp')),body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const raw=fs.readFileSync(G+'/jack.qsp'),doc=c.parse(raw),old=body(doc,'_layout');
assert.equal(old,body(base,'_layout').replace(edit.old,()=>edit.new),'Layout changed; preserve edits');
edit.new='! JO9 MOD ACTUAL_BOTTOM_RIM_HALF_20261117: the source skin supplies the 10px bottom rim.\r\n';
const next=body(base,'_layout').replace(edit.old,()=>edit.new),loc=doc.locations.find(x=>x.name==='_layout');doc.lines[loc.body]=c.shift(next,-5);
const result=c.serialize(doc),after=c.parse(result);assert(c.serialize(after).equals(result));
for(const l of doc.locations)if(l.name!=='_layout')assert.equal(after.lines[l.body],doc.lines[l.body]);
assert.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),c.hash(raw));
patch.after_sha256=c.hash(result);
fs.writeFileSync(G+'/jack.qsp',result);fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',result);
for(const file of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){
 const d=j(file);d.sourceQspSha256=patch.after_sha256;for(const row of d.files||[])if(row.runtimePath==='jack.qsp'||row.path==='game/jack.qsp'){row.sha256=patch.after_sha256;row.bytes=result.length;}write(file,d);
}
write(patchPath,patch);fs.copyFileSync(patchPath,R+'/mods/'+path.basename(patchPath));
for(const file of ['verification.json','applied.json']){const d=j(H+'/'+file);d.after=patch.after_sha256;d.provenanceComment=true;write(H+'/'+file,d);}
process.stdout.write(JSON.stringify({hash:patch.after_sha256,change:'Retain a harmless provenance comment instead of an empty replacement, avoiding the legacy patch checker empty-string loop.'})+'\n');
