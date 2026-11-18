'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const ROOT='G:/somi/JO9sa',GAME='G:/somi/Jack O Nine Tails v2.4_work/game',HERE=__dirname;
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const read=p=>fs.readFileSync(p),hash=b=>core.hash(b),write=(p,obj)=>fs.writeFileSync(p,JSON.stringify(obj,null,2)+'\n');
const spellDir=path.resolve(HERE,'../duplicato-id-fix-20261117'),uiDir=path.resolve(HERE,'../bottom-border-half-20261117');
const proof=json(spellDir+'/green.json'),replacements=json(spellDir+'/candidate/mods.json'),ui=json(uiDir+'/verification.json'),layoutEdit=json(uiDir+'/qsp-edit.json');
layoutEdit.new='! JO9 MOD ACTUAL_BOTTOM_RIM_HALF_20261117: the source skin supplies the 10px bottom rim.\r\n';
assert.equal(proof.passed,proof.total);assert.equal(proof.errors.length,0);
const raw=read(GAME+'/jack.qsp'),doc=core.parse(raw),body=(d,n)=>core.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
for(const [n,h] of Object.entries(proof.sourceBodyHashes))assert.equal(hash(Buffer.from(body(doc,n))),h,'Tested code changed: '+n);
const before=new Map(),edits=[];
for(const [name,text] of Object.entries(replacements)){
 assert.equal(hash(Buffer.from(text)),proof.testedBodyHashes[name]);
 assert(!/(?<!\r)\n|\r(?!\n)/.test(text),'Malformed candidate line endings: '+name);
 const old=body(doc,name);before.set(name,old);edits.push({location:name,field:'body',old,new:text,count:1,patchId:'DUPLICATO_OPTIONAL_PERSON_ID_20261117'});
}
const oldLayout=body(doc,'_layout');assert.equal(oldLayout.split(layoutEdit.old).length-1,1);before.set('_layout',oldLayout);edits.push(layoutEdit);
for(const edit of edits){const l=doc.locations.find(x=>x.name===edit.location);const b=body(doc,edit.location);assert.equal(b.split(edit.old).length-1,edit.count);doc.lines[l.body]=core.shift(b.replace(edit.old,()=>edit.new),-5);}
const output=core.serialize(doc),after=core.parse(output);assert(core.serialize(after).equals(output));
const original=core.parse(raw);assert.equal(after.locations.length,original.locations.length);
for(const loc of original.locations){const a=after.locations.find(x=>x.name===loc.name);assert.equal(after.lines[a.desc],original.lines[loc.desc]);if(!before.has(loc.name))assert.equal(after.lines[a.body],original.lines[loc.body]);}
const inverse=core.parse(output);for(const [name,text] of before){const l=inverse.locations.find(x=>x.name===name);inverse.lines[l.body]=core.shift(text,-5);}assert(core.serialize(inverse).equals(raw));
const scopeLines=['QSPGAME','Spell and bottom-frame scope','',core.shift(String(before.size),-5)];
for(const [name,text] of before)scopeLines.push(core.shift(name,-5),'',core.shift(text,-5),core.shift('0',-5));scopeLines.push('');
fs.mkdirSync(HERE+'/mods',{recursive:true});fs.writeFileSync(HERE+'/scoped-before.qsp',Buffer.from(scopeLines.join('\r\n'),'utf16le'));
const patch={id:'2026-11-17_duplicato_person_id_and_actual_bottom_rim',description:'Accept optional zero relationship IDs for valid active actors, retain stale selection checks and original spell costs, connect its Roman icon, and remove the obsolete bottom-frame overlay.',status:'APPROVED',before_sha256:hash(raw),after_sha256:hash(output),edits};
write(HERE+'/mods/'+patch.id+'.json',patch);
const changedScope=core.parse(fs.readFileSync(HERE+'/scoped-before.qsp'));
for(const edit of edits){const l=changedScope.locations.find(x=>x.name===edit.location);changedScope.lines[l.body]=core.shift(body(changedScope,edit.location).replace(edit.old,()=>edit.new),-5);}
const scope=core.serialize(changedScope);
assert.equal(require(ROOT+'/tools/qa/check-qsp-marker-boundaries.cjs').inspectMarkerBoundaries(scope).issues.length,0);
assert.equal(require(ROOT+'/tools/qa/check-qsp-line-endings.cjs').inspect(scope).issues.length,0);
assert(!body(after,'_layout').includes('jo9_scene_bottom_frame'));
const resources=[
 {runtimePath:'content/pic/ui/grimdark/bg.png',source:uiDir+'/game/content/pic/ui/grimdark/bg.png',before:ui.sourceSha256,repositoryPath:'assets/content/pic/ui/grimdark/bg.png',category:'runtime-image'},
 {runtimePath:'css/base.css',source:uiDir+'/game/css/base.css',before:ui.cssBeforeSha256,repositoryPath:'assets/css-2.4/base.css',category:'runtime-css'},
 ...['Duplicato_Essentia.png','Duplicato_Essentia_gray.png'].map(n=>({runtimePath:'content/pic/ui/legacy_overhaul/'+n,source:spellDir+'/icons/'+n,before:null,repositoryPath:'assets/content/pic/ui/legacy_overhaul/'+n,category:'runtime-image'}))
];
for(const row of resources){const target=GAME+'/'+row.runtimePath;assert.equal(fs.existsSync(target)?hash(read(target)):null,row.before,'Resource changed: '+target);row.sha256=hash(read(row.source));row.bytes=fs.statSync(row.source).size;}
const staticProof={before:hash(raw),after:hash(output),affectedLocations:[...before.keys()],allOtherLocationsPreserved:true,inverse:true,roundtrip:true,changedScopeMarkers:true,changedScopeLineEndings:true,spellChecks:proof.total,spellErrors:0,rim:{oldHeight:20,newHeight:10,width:1280,canvas:[1280,800]},newSavedFields:0,saveMigrationRequired:false,resources:resources.map(({source,...rest})=>rest)};
write(HERE+'/verification.json',staticProof);
if(!process.argv.includes('--apply')){process.stdout.write(JSON.stringify({prepared:true,before:staticProof.before,after:staticProof.after,locations:staticProof.affectedLocations})+'\n');process.exit(0);}
const metadataPath=ROOT+'/assets/runtime-source-2.4.1.json',inventoryPath=ROOT+'/assets/runtime-manifests/2.4.2-work.json';
const metadata=json(metadataPath),inventory=json(inventoryPath);
for(const obj of [metadata,inventory]){obj.sourceQspSha256=staticProof.after;obj.latestDuplicatoAndRimFix={date:'2026-11-17',record:'records/duplicato-id-fix-20261117/REPORT_KO.md',optionalPersonIds:true,spellIcon:true,actualBottomRimHeight:10,newSavedFields:0};}
const qspRow=metadata.files.find(x=>x.runtimePath==='jack.qsp');Object.assign(qspRow,{sha256:staticProof.after,bytes:output.length});
Object.assign(inventory.files.find(x=>x.path==='game/jack.qsp'),{sha256:staticProof.after,bytes:output.length});
for(const row of resources){
 const metaRow=metadata.files.find(x=>x.runtimePath===row.runtimePath),invRow=inventory.files.find(x=>x.path==='game/'+row.runtimePath);
 const m={runtimePath:row.runtimePath,repositoryPath:row.repositoryPath,bytes:row.bytes,sha256:row.sha256};if(metaRow)Object.assign(metaRow,m);else metadata.files.push(m);
 const i={path:'game/'+row.runtimePath,repositoryPath:row.repositoryPath,bytes:row.bytes,sha256:row.sha256,category:row.category};if(invRow)Object.assign(invRow,i);else inventory.files.push(i);
}
assert.equal(hash(read(GAME+'/jack.qsp')),staticProof.before,'WORK changed before install; rerun on fresh source');
const snapshots=[];
function put(file,bytes){const p=path.resolve(file);snapshots.push({file:p,previous:fs.existsSync(p)?read(p):null,installed:hash(bytes)});fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);}
try{
 put(GAME+'/jack.qsp',output);put(ROOT+'/assets/runtime/2.4.1/jack.qsp',output);
 for(const row of resources){const b=read(row.source);put(GAME+'/'+row.runtimePath,b);put(ROOT+'/'+row.repositoryPath,b);}
 put(metadataPath,Buffer.from(JSON.stringify(metadata,null,2)+'\n'));put(inventoryPath,Buffer.from(JSON.stringify(inventory,null,2)+'\n'));
 fs.copyFileSync(HERE+'/mods/'+patch.id+'.json',ROOT+'/mods/'+patch.id+'.json');
 assert(read(GAME+'/jack.qsp').equals(read(ROOT+'/assets/runtime/2.4.1/jack.qsp')));
 for(const row of resources)assert.equal(hash(read(GAME+'/'+row.runtimePath)),row.sha256);
 write(HERE+'/applied.json',{...staticProof,installed:true,fullAndZipUnchanged:true,saveFilesUnchanged:true});
 process.stdout.write(JSON.stringify({installed:true,hash:staticProof.after,spellChecks:proof.total,rimHeight:10})+'\n');
}catch(error){
 for(const entry of snapshots.reverse())if(fs.existsSync(entry.file)&&hash(read(entry.file))===entry.installed){if(entry.previous===null)fs.unlinkSync(entry.file);else fs.writeFileSync(entry.file,entry.previous);}throw error;
}
