'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/menu-private-fixes-20261025';
const baseline='G:/somi/JO9_work_backups/menu-private-fixes-20261025/jack.qsp';
const expected='38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed';
const revision=process.argv[2]||'quota';assert(/^[a-z]+$/.test(revision));
const id='2026-10-25_menu_private_'+revision;
const target=task+'/candidate-'+revision+'.qsp',mods=task+'/mods-'+revision;
assert(!fs.existsSync(target));assert(!fs.existsSync(mods));
const inputs=JSON.parse(fs.readFileSync(__dirname+'/inputs.json','utf8').replace(/^\uFEFF/,''));
function protect(){for(const x of inputs)assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,x.path);}
protect();const raw=fs.readFileSync(baseline);assert.equal(c.hash(raw),expected);assert(fs.readFileSync(game+'/jack.qsp').equals(raw));
const source=c.parse(raw),d=c.parse(raw);qa.inspectWorld(raw);assert(c.serialize(source).equals(raw));
const helpers=[['rumor','./rumor-edits.cjs','buildRumorEdits'],['inventory','./layout-edits.cjs','buildLayoutEdits'],['milk','./private-edits.cjs','buildPrivateMilkEdits'],['quota','./tentacle-edits.cjs','buildTentacleEdits']];
if(revision==='final')helpers.push(['privateMenuNavigation','./bridge-ui-edits.cjs','buildBridgeUiEdits']);
const totals={},fragments=[];
for(const [label,file,fn]of helpers){const e=require(file)[fn](source);totals[label]=e.length;fragments.push(...e);}
const body=(doc,n)=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const set=(doc,n,s)=>{doc.lines[doc.locations.find(l=>l.name===n).body]=c.shift(s,-5);};
for(const e of fragments){assert.equal(e.count,1);const old=body(d,e.location);assert.equal(old.split(e.old).length-1,1,e.location);set(d,e.location,old.replace(e.old,()=>e.new));}
const locations=[...new Set(fragments.map(e=>e.location))],edits=[];
for(const n of locations){const old=body(source,n),next='! JO9 MOD START MENU_PRIVATE_QUOTA_20261025 | '+id+'\r\n'+body(d,n)+'\r\n! JO9 MOD END MENU_PRIVATE_QUOTA_20261025\r\n';set(d,n,next);edits.push({location:n,field:'body',old,new:next,count:1});}
const changed=new Set(locations.map(n=>d.locations.find(l=>l.name===n).body));
assert.equal(d.locations.length,source.locations.length);assert.equal(d.lines.length,source.lines.length);
for(let i=0;i<d.lines.length;i++)if(!changed.has(i))assert.equal(d.lines[i],source.lines[i]);
const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
const replay=c.parse(raw);for(const e of edits){assert.equal(body(replay,e.location),e.old);set(replay,e.location,e.new);}assert(c.serialize(replay).equals(bytes));
assert.equal(locations.includes('snk_room_bridge'),revision==='final');protect();
fs.mkdirSync(mods);const patch={id,before_sha256:expected,after_sha256:c.hash(bytes),edits};
fs.writeFileSync(target,bytes,{flag:'wx'});fs.writeFileSync(mods+'/'+id+'.json',JSON.stringify(patch,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(__dirname+'/patch-'+revision+'.json',JSON.stringify(patch,null,2)+'\n',{flag:'wx'});
const manifest={status:'CANDIDATE_STATIC_REPLAY_PASS',id,baseline,source:game+'/jack.qsp',before:expected,after:c.hash(bytes),candidate:target,mods,locations,fragments:totals,fragmentCount:fragments.length,patchEntries:edits.length,locationCount:d.locations.length,protectedInputs:inputs.length,runtimeWritten:false,private135:revision==='final'?'Original generic navigation restored; no lesson text, action or new filter':'Not restored in intermediate diagnostic candidate',checks:{worldStructure:true,roundtrip:true,patchReplay:true,unrelatedBodiesUnchanged:true,protectedInputsUnchanged:true}};
fs.writeFileSync(__dirname+'/candidate-'+revision+'.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(manifest));
