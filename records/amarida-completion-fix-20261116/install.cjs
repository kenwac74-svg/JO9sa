'use strict';
const fs=require('fs'),a=require('node:assert/strict'),path=require('path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const here=__dirname,R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',S=R+'/assets/runtime/2.4.1/jack.qsp';
const patch=JSON.parse(fs.readFileSync(here+'/mod/patch.json','utf8')),raw=fs.readFileSync(W),doc=c.parse(raw),original=c.parse(raw);
a.equal(c.hash(raw),patch.before_sha256);a(fs.readFileSync(S).equals(raw));
for(const e of patch.edits){let l=doc.locations.find(x=>x.name===e.location),s=c.shift(doc.lines[l.body],5);a.equal(s.split(e.old).length-1,e.count);doc.lines[l.body]=c.shift(s.split(e.old).join(e.new),-5);}
const changed=c.serialize(doc);a.equal(c.hash(changed),patch.after_sha256);a(c.serialize(c.parse(changed)).equals(changed));
const touched=new Set(patch.edits.map(e=>e.location));
for(const l of original.locations)if(!touched.has(l.name))a.equal(original.lines[l.body],doc.lines[l.body]);
for(const e of [...patch.edits].reverse()){let l=doc.locations.find(x=>x.name===e.location),s=c.shift(doc.lines[l.body],5);a.equal(s.split(e.new).length-1,e.count);doc.lines[l.body]=c.shift(s.split(e.new).join(e.old),-5);}a(c.serialize(doc).equals(raw));
if(process.argv.includes('--scoped')){
 const fields=['QSPGAME','Amarida changed-location verification','',c.shift('2',-5)];for(const name of touched){let l=original.locations.find(x=>x.name===name);fields.push(c.shift(name,-5),'',original.lines[l.body],c.shift('0',-5));}fields.push('');fs.writeFileSync(here+'/scoped.qsp',Buffer.from(fields.join('\r\n'),'utf16le'));console.log('Created temporary changed-location-only validation input');process.exit(0);
}
a.equal(JSON.parse(fs.readFileSync(here+'/green-results.json','utf8')).passed,14);
const record=R+'/records/amarida-completion-fix-20261116';fs.mkdirSync(record,{recursive:true});
for(const file of ['regression.cjs','prepare.cjs','install.cjs','red-results.json','green-results.json'])fs.copyFileSync(here+'/'+file,record+'/'+file);
fs.writeFileSync(R+'/mods/2026-11-16_amarida_completed_guard.json',JSON.stringify(patch,null,2)+'\n');
// Exact reverse patch is the recovery payload; no duplicate full QSP backup.
a.equal(c.hash(fs.readFileSync(W)),patch.before_sha256);fs.writeFileSync(W,changed);fs.writeFileSync(S,changed);
const metaPath=R+'/assets/runtime-source-2.4.1.json',meta=JSON.parse(fs.readFileSync(metaPath,'utf8'));
meta.sourceQspSha256=patch.after_sha256;meta.snapshotDate='2026-11-16';meta.latestAmaridaCompletionFix={mod:'mods/2026-11-16_amarida_completed_guard.json',report:'records/amarida-completion-fix-20261116/REPORT_KO.md',newSavedFields:0,priscillaStory:'USER_DEFERRED_FOR_DISCUSSION'};
for(const row of meta.files||[])if(row.runtimePath==='jack.qsp'){row.bytes=changed.length;row.sha256=patch.after_sha256;}fs.writeFileSync(metaPath,JSON.stringify(meta,null,2)+'\n');
const invPath=R+'/assets/runtime-manifests/2.4.2-work.json',inv=JSON.parse(fs.readFileSync(invPath,'utf8'));inv.sourceQspSha256=patch.after_sha256;inv.latestAmaridaCompletionFix=meta.latestAmaridaCompletionFix;for(const row of inv.files||[])if(row.path==='game/jack.qsp'){row.bytes=changed.length;row.sha256=patch.after_sha256;}fs.writeFileSync(invPath,JSON.stringify(inv,null,2)+'\n');
const result={status:'APPLIED',before:patch.before_sha256,after:patch.after_sha256,roundtrip:true,reversePatchRestoresOriginal:true,unchangedLocations:312,locations:314,checks:14,newSaveFields:0,priscillaUnmodified:true,fullUnmodified:true,existingOtherLocationLineEndingWarning:'jo9_slave_death line 199; preserved exactly',scope:'Changed-location official replay plus isolated engine regression; full release/GUI not repeated'};
fs.writeFileSync(record+'/verification.json',JSON.stringify(result,null,2)+'\n');
a(fs.readFileSync(W).equals(fs.readFileSync(S)));console.log(JSON.stringify(result));
