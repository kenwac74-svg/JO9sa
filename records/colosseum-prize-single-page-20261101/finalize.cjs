'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const REC=R+'/records/colosseum-prize-single-page-20261101',T='G:/Codex/tmp/colosseum-prize-single-page-20261101',N='G:/Codex/tmp/colosseum-prize-single-page-20261101-native',REL='G:/Codex/tmp/colosseum-prize-single-page-release-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const v=j(REC+'/verification.json'),p=j(REC+'/prepared.json'),current=fs.readFileSync(W+'/jack.qsp'),baseline=z.gunzipSync(fs.readFileSync(v.backup));
a.equal(c.hash(current),v.after);a.equal(c.hash(baseline),v.before);a.equal(hash(F+'/jack.qsp'),v.fullUnchanged);
const world=qa.inspectWorld(current),before=c.parse(baseline),after=c.parse(current);a.equal(before.lines.length,after.lines.length);
const changed=[];for(let i=0;i<after.lines.length;i++)if(after.lines[i]!==before.lines[i])changed.push(i);
a.deepEqual(changed,[after.locations.find(x=>x.name==='interaction_city').body]);
const saves=fs.readdirSync(W+'/save').filter(n=>/\.sav$/i.test(n)).sort().map(n=>{const s=fs.statSync(W+'/save/'+n);return{name:n,bytes:s.size,mtimeMs:s.mtimeMs};});
const installedAt=fs.statSync(REC+'/verification.json').mtimeMs;
const saveChanges=p.saveMetadata.flatMap(old=>{const now=saves.find(x=>x.name===old.name);return JSON.stringify(old)===JSON.stringify(now)?[]:[{name:old.name,before:old,after:now}];});
// Installation already verified all save metadata. Observe later autosaves without restoring or editing them.
for(const item of saveChanges){a(/^auto_/.test(item.name));a(item.after&&item.after.mtimeMs>installedAt,'Save drift was not after the install check');}
const green=j(REC+'/green-report.json');a.equal(green.pass,true);a.equal(green.sourceSha256,v.after);a(green.newRulesPass&&green.renderPass&&green.nativeCompleted);
const gate=j(REC+'/release-report.json');a.equal(gate.verdict,'PASS');a.equal(gate.checks.find(x=>x.name==='inputs-readable').detail.candidate,v.after);a.equal(v.officialEnginePaths,9);
for(const name of fs.readdirSync(__dirname))if(fs.statSync(path.join(__dirname,name)).isFile()&&name!=='finalize.cjs'){
 const dest=path.join(REC,name);fs.copyFileSync(path.join(__dirname,name),dest);a.equal(hash(dest),hash(path.join(__dirname,name)));
}
fs.copyFileSync(__filename,REC+'/finalize.cjs');
const cleaned={files:0,bytes:0,junctions:0,roots:[]},parent=path.resolve('G:/Codex/tmp');
const allowedLinks=new Set(['content','css','fonts','json'].map(n=>fs.realpathSync(W+'/'+n).toLowerCase()));
function clean(target,root){
 const resolved=path.resolve(target);a(resolved===root||resolved.startsWith(root+path.sep));const s=fs.lstatSync(resolved);
 if(s.isSymbolicLink()){
  a(allowedLinks.has(fs.realpathSync(resolved).toLowerCase()),'Unexpected link target: '+resolved);
  try{fs.unlinkSync(resolved);}catch(e){if(!['EPERM','EISDIR'].includes(e.code))throw e;fs.rmdirSync(resolved);}
  cleaned.junctions++;return;
 }
 if(s.isDirectory()){for(const name of fs.readdirSync(resolved))clean(path.join(resolved,name),root);fs.rmdirSync(resolved);}
 else{cleaned.files++;cleaned.bytes+=s.size;fs.unlinkSync(resolved);}
}
for(const target of [T,N,REL]){
 const root=path.resolve(target);a.equal(path.dirname(root),parent);a(root.includes('colosseum-prize-single-page'));if(fs.existsSync(root)){a(!fs.lstatSync(root).isSymbolicLink());clean(root,root);cleaned.roots.push(root);}
}
for(const name of v.createdInGameBackups){a(/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(name));const target=W+'/'+name;a.equal(hash(target),v.before);a.equal(c.hash(z.gunzipSync(fs.readFileSync(v.backup))),v.before);cleaned.files++;cleaned.bytes+=fs.statSync(target).size;fs.unlinkSync(target);}
a.equal(hash(W+'/jack.qsp'),v.after);a.equal(hash(F+'/jack.qsp'),v.fullUnchanged);
const final={status:'PASS',sha256:v.after,payoutMultiplier:2,minimumPayout:100,examples:[{old:50,new:100},{old:112,new:224}],resultPages:1,nativeCases:4,officialEnginePaths:9,world,changedCodeLines:changed.length,unchangedSaveMetadataAtInstall:p.saveMetadata.length,unchangedSaveMetadataAtFinal:p.saveMetadata.length-saveChanges.length,laterAutosaveChangesObserved:saveChanges,saveFilesWrittenByThisTask:0,fullQspUnchanged:true,backupRestoresExactly:true,cleanup:cleaned};
fs.writeFileSync(REC+'/final-verification.json',JSON.stringify(final,null,2)+'\n');
fs.writeFileSync(REC+'/cleanup.json',JSON.stringify(cleaned,null,2)+'\n');
console.log(JSON.stringify(final));
