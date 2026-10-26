'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const root=__dirname,baseFile=path.join(root,'inputs/baseline.qsp'),raw=fs.readFileSync(baseFile),doc=core.parse(raw);
assert.equal(core.hash(raw),'1e911ced3798826e8cd1f35ed1e4115e9fd6450a9fdecaeb231b5f6885c1abb4');
assert.deepEqual(core.serialize(doc),raw);
const allowed=new Set(['#dynamic','$newloc','jo9_meiki_willing']),paths=process.argv.slice(2);assert.equal(paths.length,2);
const outdir=path.join(root,'mods');fs.mkdirSync(outdir,{recursive:true});
const chain=[];
for(const [i,file] of paths.entries()){
 const p=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));assert(!p.add_locations?.length,'No new locations in requested repairs');
 p.before_sha256=core.hash(core.serialize(doc));
 for(const e of p.edits){assert(allowed.has(e.location));assert.equal(e.field,'body');const l=doc.locations.find(l=>l.name===e.location);assert(l);let s=core.shift(doc.lines[l.body],5);assert(e.old.length);assert.equal(s.split(e.old).length-1,e.count,e.location+' exact old count');s=s.split(e.old).join(e.new);doc.lines[l.body]=core.shift(s,-5);}
 p.after_sha256=core.hash(core.serialize(doc));const dest=path.join(outdir,String(i+1).padStart(2,'0')+'_'+path.basename(file));fs.writeFileSync(dest,JSON.stringify(p,null,2)+'\n');chain.push({id:p.id,file:dest,before:p.before_sha256,after:p.after_sha256,locations:p.edits.map(e=>e.location)});
}
const candidate=core.serialize(doc);qa.inspectWorld(candidate);const old=core.parse(raw);const changed=[];
for(let i=0;i<doc.lines.length;i++)if(old.lines[i]!==doc.lines[i]){const l=doc.locations.find(l=>l.body===i);assert(l&&allowed.has(l.name),'Unrelated field changed '+i);changed.push({name:l.name,oldLines:core.shift(old.lines[i],5).split('\r\n').length,newLines:core.shift(doc.lines[i],5).split('\r\n').length});}
assert.deepEqual([...new Set(changed.map(x=>x.name))].sort(),[...allowed].sort());
fs.writeFileSync(path.join(root,'candidate.qsp'),candidate);
fs.writeFileSync(path.join(root,'integration.json'),JSON.stringify({before:core.hash(raw),after:core.hash(candidate),locations:doc.locations.length,newLocations:0,otherQspFieldsIdentical:true,changed,chain},null,2));
console.log(JSON.stringify({before:core.hash(raw),after:core.hash(candidate),changed,patches:chain.map(p=>p.id)}));