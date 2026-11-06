'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,game='G:/somi/Jack O Nine Tails v2.4_work/game';
const raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw);
assert.equal(core.hash(raw),'c149e6b5728b3ec5ae4f5e508fa60b446bdca84644f3df9b84d70636672b19df');
assert.ok(core.serialize(doc).equals(raw));
const packs=[['faction','merge-patch.json'],['tax','sale-tax.patch.json'],['images','mods.json']];
const edits=[],components=[];
for(const [folder,file] of packs){
 const p=JSON.parse(fs.readFileSync(path.join(root,folder,file),'utf8'));
 const es=Array.isArray(p)?p:p.edits;
 const start=core.hash(core.serialize(doc));
 for(const e of es){
  assert.ok(e.old&&e.old!==e.new);assert.ok(e.count>0);
  const l=doc.locations.find(x=>x.name===e.location);assert.ok(l,e.location);
  const old=core.shift(doc.lines[l[e.field]],5);
  assert.equal(old.split(e.old).length-1,e.count,e.location+' exact old count');
  doc.lines[l[e.field]]=core.shift(old.split(e.old).join(e.new),-5);edits.push(e);
 }
 components.push({folder,file,start,after:core.hash(core.serialize(doc)),edits:es.length});
}
const candidate=core.serialize(doc);assert.ok(core.serialize(core.parse(candidate)).equals(candidate));
const patch={id:'2026-11-05_pending_work_batch',description:'Approved pending sale tax, faction UI, dual image registration and ID-scoped Isabella alias fixes.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
const before=core.parse(raw);
const changed=doc.locations.filter((l,i)=>doc.lines[l.body]!==before.lines[before.locations[i].body]).map(x=>x.name);
for(const e of [...edits].reverse()){
 const l=doc.locations.find(x=>x.name===e.location),s=core.shift(doc.lines[l[e.field]],5);
 assert.equal(s.split(e.new).length-1,e.count,e.location+' exact reverse count');
 doc.lines[l[e.field]]=core.shift(s.split(e.new).join(e.old),-5);
}
assert.ok(core.serialize(doc).equals(raw));
const out=path.join(root,'mods');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,patch.id+'.json'),JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(path.join(root,'candidate.qsp'),candidate);
const tracked=core.parse(fs.readFileSync('G:/somi/JO9sa/assets/runtime/2.4.1/jack.qsp'));
const stale=before.locations.filter(l=>{const t=tracked.locations.find(x=>x.name===l.name);return !t||before.lines[l.body]!==tracked.lines[t.body]||before.lines[l.desc]!==tracked.lines[t.desc];}).map(l=>l.name);
const report={baseline:patch.before_sha256,candidate:patch.after_sha256,components,edits:edits.length,changedLocations:changed,locationCount:doc.locations.length,roundtrip:true,reverseByteIdentical:true,preexistingWorkSourceDifferencesPreserved:stale,workWritten:false,fullTouched:false};
fs.writeFileSync(path.join(root,'integration.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
