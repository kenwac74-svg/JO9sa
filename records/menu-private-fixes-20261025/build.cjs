'use strict';
// Build only the three approved report/menu/layout fixes into a disposable candidate.
// WORK, Full, saves, settings and engine files are read-only inputs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const {buildRumorEdits}=require('./rumor-edits.cjs');
const {buildLayoutEdits}=require('./layout-edits.cjs');
const {buildPrivateMilkEdits}=require('./private-edits.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/menu-private-fixes-20261025',backup='G:/somi/JO9_work_backups/menu-private-fixes-20261025/jack.qsp';
const expected='38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed',id='2026-10-25_menu_private_reports';
const parseJson=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const protectedInputs=parseJson(__dirname+'/inputs.json');
function protect(){for(const p of protectedInputs)assert.equal(c.hash(fs.readFileSync(p.path)),p.sha256,'Protected input changed: '+p.path);}
assert.equal(fs.realpathSync(task).toLowerCase(),path.resolve(task).toLowerCase());
for(const p of [task+'/candidate.qsp',task+'/mods/'+id+'.json',__dirname+'/patch.json',__dirname+'/candidate.json'])assert(!fs.existsSync(p),'Refuse to overwrite candidate output: '+p);
const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),expected);assert.equal(c.hash(fs.readFileSync(backup)),expected);
const original=c.parse(raw);assert(c.serialize(original).equals(raw));qa.inspectWorld(raw);protect();
const d={...original,lines:original.lines.slice()};
const rumor=buildRumorEdits(original),layout=buildLayoutEdits(original),milk=buildPrivateMilkEdits(original);
assert.equal(rumor.length,7);assert.equal(layout.length,2);assert.equal(milk.length,6);
const fragments=[...rumor,...layout,...milk],changed=new Set(fragments.map(e=>e.location));
const expectedLocations=['jo9_buyer_rumors','master_stat','sjm_UI_UIadds','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen'];
assert.deepEqual([...changed].sort(),expectedLocations.slice().sort());
assert(!changed.has('snk_room_bridge'),'Bridge action whitelist is deferred');
function body(doc,n){const l=doc.locations.find(l=>l.name===n);assert(l);return c.shift(doc.lines[l.body],5);}
function setBody(doc,n,b){const l=doc.locations.find(l=>l.name===n);doc.lines[l.body]=c.shift(b,-5);}
const beforeBodies=new Map(expectedLocations.map(n=>[n,body(original,n)]));
for(const e of fragments){
 assert.equal(e.field,'body');assert.equal(e.count,1);assert(changed.has(e.location));
 const old=body(d,e.location);assert.equal(old.split(e.old).length-1,1,'Unique approved edit '+e.location);
 setBody(d,e.location,old.replace(e.old,()=>e.new));
}
assert.equal(buildLayoutEdits(d).length,0);assert.equal(buildPrivateMilkEdits(d).length,0);
const edits=[];
for(const location of expectedLocations){
 const old=beforeBodies.get(location),edited=body(d,location);assert.notEqual(edited,old);
 const next='! JO9 MOD START MENU_PRIVATE_REPORTS_20261025 | '+id+'\r\n'+edited+(edited.endsWith('\r\n')?'':'\r\n')+'! JO9 MOD END MENU_PRIVATE_REPORTS_20261025\r\n';
 setBody(d,location,next);edits.push({location,field:'body',old,new:next,count:1});
}
const changedLines=new Set(expectedLocations.map(n=>d.locations.find(l=>l.name===n).body));
assert.equal(d.locations.length,original.locations.length);assert.equal(d.lines.length,original.lines.length);
for(let i=0;i<d.lines.length;i++)if(!changedLines.has(i))assert.equal(d.lines[i],original.lines[i],'Unapproved QSP line changed at '+i);
const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
const replay={...original,lines:original.lines.slice()};
for(const e of edits){const old=body(replay,e.location);assert.equal(old,e.old);setBody(replay,e.location,e.new);}
assert(c.serialize(replay).equals(bytes),'Eight full-body patch entries must replay byte-identically');
protect();assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expected);
const after=c.hash(bytes),patch={id,before_sha256:expected,after_sha256:after,edits};
const patchText=JSON.stringify(patch,null,2)+'\n';
fs.writeFileSync(task+'/candidate.qsp',bytes,{flag:'wx'});
fs.writeFileSync(task+'/mods/'+id+'.json',patchText,{flag:'wx'});
fs.writeFileSync(__dirname+'/patch.json',patchText,{flag:'wx'});
const manifest={status:'CANDIDATE_STATIC_REPLAY_PASS',id,before:expected,after,source:game+'/jack.qsp',backup,task,candidate:task+'/candidate.qsp',locations:expectedLocations,approvedFragments:{rumor:rumor.length,inventoryGap:layout.length,milkReportLinks:milk.length,total:fragments.length},patchEntries:edits.length,locationCount:d.locations.length,checks:{sourceRoundtrip:true,candidateRoundtrip:true,worldStructure:true,patchReplay:true,onlyEightBodiesChanged:true,protectedInputs:protectedInputs.length,productionUnchanged:true},excluded:{bridgeAction135:'Deferred; no whitelist or feature restoration.',fogMonster:'Deferred discussion; no fog/monster mechanism or prose changes.',fontAndPotionOrder:'Unchanged; inventory removes only one blank group line in each branch.'},runtimeWritten:false,fullSynced:false,committed:false,pushed:false};
fs.writeFileSync(__dirname+'/candidate.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:manifest.status,before:expected,after,fragments:fragments.length,patchEntries:edits.length,locations:expectedLocations,protectedInputs:protectedInputs.length,runtimeWritten:false}));
