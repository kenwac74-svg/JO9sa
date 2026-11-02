'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
const stage='G:/Codex/tmp/jo9-fog-assistant-ap-20261028/stage';
const before='f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97';
const red=JSON.parse(fs.readFileSync(__dirname+'/tests/red-results.json','utf8').replace(/^\uFEFF/,''));
assert.equal(red.status,'EXPECTED_REQUIREMENT_RED');assert.equal(red.sourceSha256,before);
assert.deepEqual(red.observed,{assistantEnergy:4,masterEnergy:5,settled:1,originalMasterHelperCalls:0});
const input=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(input);assert.equal(c.hash(input),before);assert(c.serialize(doc).equals(input));
const l=doc.locations.find(x=>x.name==='jo9_fog_relay');assert(l);
let body=c.shift(doc.lines[l.body],5);
const edits=[{
 location:'jo9_fog_relay',field:'body',
 old:"   jo9_fog['energy_before'] = assistant['energy']",
 new:"   ! JO9 MOD START FOG_ASSISTANT_MASTER_ACTION_20261028\r\n   ! 교대 없이 조수가 이긴 경우에만 기존 주인공 행동 비용을 단회 정산한다.\r\n   if $place = 'edge_patrol' and combatant = 2 and $итог_боя = 'победа' and jo9_fog['switched'] = 0:\r\n    dynamic $master_energy_drop\r\n   end\r\n   ! JO9 MOD END FOG_ASSISTANT_MASTER_ACTION_20261028\r\n   jo9_fog['energy_before'] = assistant['energy']",
 count:1,patchId:'FOG_ASSISTANT_MASTER_ACTION_20261028'
},{
 location:'jo9_fog_relay',field:'body',
 old:"   ! 출전 동료의 최소 1 행동력 비용을 보장하고 더 큰 잔여 지구력 손실은 유지한다.\r\n   assistant['energy'] = min(assistant['energy'], jo9_fog['energy_before'] - 1)",
 new:"   ! JO9 MOD START FOG_ASSISTANT_MIN_TWO_20261028\r\n   ! 조수의 최소 2 행동력 비용과 더 큰 잔여 지구력 손실 중 큰 쪽을 적용한다.\r\n   assistant['energy'] = min(assistant['energy'], jo9_fog['energy_before'] - 2)\r\n   ! JO9 MOD END FOG_ASSISTANT_MIN_TWO_20261028",
 count:1,patchId:'FOG_ASSISTANT_MIN_TWO_20261028'
}];
for(const e of edits){assert.equal(body.split(e.old).length-1,1);body=body.split(e.old).join(e.new);}
doc.lines[l.body]=c.shift(body,-5);
const output=c.serialize(doc),after=c.hash(output);assert(c.serialize(c.parse(output)).equals(output));
let inverse=body;for(const e of edits.slice().reverse()){assert.equal(inverse.split(e.new).length-1,1);inverse=inverse.split(e.new).join(e.old);}assert.equal(c.shift(inverse,-5),c.parse(input).lines[l.body]);
const mod={id:'2026-10-28_fog_assistant_ap_cost',status:'CANDIDATE_NOT_APPLIED',description:'조수 선봉 안개전투의 최소 행동력2와 단독 승리 주인공 기본 행동1회 정산. 기존 반지·반행동·치트 보정 및 교대 비용을 보존한다.',before_sha256:before,after_sha256:after,edits};
const name=mod.id+'.json',text=JSON.stringify(mod,null,2)+'\n';
fs.mkdirSync(stage+'/mods',{recursive:true});
for(const [n,bytes]of [['baseline.qsp',input],['candidate.qsp',output]]){const p=stage+'/'+n;if(fs.existsSync(p))assert(fs.readFileSync(p).equals(bytes),'Do not overwrite a different diagnostic');else fs.writeFileSync(p,bytes,{flag:'wx'});}
fs.writeFileSync(__dirname+'/'+name,text);fs.writeFileSync(stage+'/mods/'+name,text);
const result={status:'CANDIDATE_BUILT_NOT_APPLIED',before,after,stage,candidate:stage+'/candidate.qsp',baseline:stage+'/baseline.qsp',mods:stage+'/mods',locationsChanged:['jo9_fog_relay'],newLocations:0,newPersistentKeys:0,exactInverse:true,requirementRed:__dirname+'/tests/red-results.json'};
fs.writeFileSync(__dirname+'/candidate.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
