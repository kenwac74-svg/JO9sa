'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const base='G:/somi/Jack O Nine Tails v2.4_work/game/save/22talk.sav',output=path.join(__dirname,'듀플리카토_친밀도테스트_20261117.sav');
assert(!fs.existsSync(output),'Do not overwrite an existing test save');
const raw=fs.readFileSync(base),originalHash=core.hash(raw),s=codec.parse(raw);
assert(codec.serialize(s).equals(raw),'Original exact round trip');
assert.equal(codec.dec(s.lines[10]),'main_screen');
assert.equal(+codec.value(s,'slave_state')[0],1);assert.equal(+codec.value(s,'assistant_state')[0],1);
assert.equal(+codec.value(s,'slave_type')[0],2583);assert.equal(+codec.value(s,'assistant_type')[0],1214);
assert.equal(+codec.value(s,'assistant','cook_affinity')[0],1);assert.equal(+codec.value(s,'slave','cook_affinity')[0],0);
assert.equal(+codec.value(s,'slave','jo9_duplicato_received')[0],0);assert.equal(+codec.value(s,'already_done_today','jo9_duplicato')[0],0);
const originalVars=s.vars.map(v=>core.hash(Buffer.from(JSON.stringify(v)))),changes=[];
function set(name,key,n){
 name=name.toUpperCase();const v=s.vars.find(v=>v.name===name);assert(v,'Missing existing variable '+name);let at=0;
 if(key!==undefined){key=key.toUpperCase();const entry=v.idx.find(x=>x[1]===key);if(entry)at=entry[0];else{at=v.values.length;v.values.push(['0','']);v.idx.push([at,key]);v.idx.sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:0);}}
 if(!v.values.length)v.values.push(['0','']);const prior=v.values[at].slice();v.values[at][0]=String(n);changes.push({name,key,before:prior,after:v.values[at].slice()});
}
set('slave','0',80);set('assistant','0',80);set('npc_progress','Priscilla_duplicato',1);set('assistant','cook_affinity_revealed',2);
// This copy should demonstrate the normal one-AP cost, not the base save's free-AP cheat.
set('cheat_inf_en',undefined,0);
const data=codec.serialize(s),check=codec.parse(data),changed=new Set(changes.map(x=>x.name));
assert(codec.serialize(check).equals(data),'Candidate exact round trip');
assert.deepEqual(check.lines.slice(0,check.start),s.lines.slice(0,s.start),'Native header, UI and load callback preserved');
for(const [index,v]of check.vars.entries()){if(!changed.has(v.name))assert.equal(core.hash(Buffer.from(JSON.stringify(v))),originalVars[index],'Unrelated variable '+v.name);for(const [i]of v.idx)assert(i>=0&&i<v.values.length);}
assert.equal(check.vars.length,originalVars.length);assert.equal(core.hash(fs.readFileSync(base)),originalHash);
fs.writeFileSync(output,data,{flag:'wx'});
const manifest={base,originalHash,output,fileName:path.basename(output),sha256:core.hash(data),bytes:data.length,slave:{name:codec.value(check,'slave_name')[1],type:2583},assistant:{name:codec.value(check,'assistant_name')[1],type:1214},friendship:80,copyableTalent:'예민한 미각',changes,originalPreserved:true,nativeHeaderPreserved:true,noInjectedLauncher:true,qspChanged:false,exeVisualCheck:false};
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2));
process.stdout.write(JSON.stringify({file:output,bytes:data.length,changes:changes.length,originalPreserved:true})+'\n');
