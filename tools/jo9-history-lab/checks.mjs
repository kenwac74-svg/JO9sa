import assert from 'node:assert/strict';
import {defaultConfig,defaultCharacter,estimate,split,clone,freshState,validateState} from './dist/engine.mjs';
let checks=0;
const ok=(a,b)=>{assert.deepEqual(a,b);checks++;};
const cfg=defaultConfig(),c=defaultCharacter();
ok(estimate(c,cfg),estimate(c,cfg));
ok(estimate(c,cfg).owner.income,0);
ok(Object.keys(estimate(c,cfg).rows),['intimacy','pregnancies','births']);ok(estimate(c,cfg).owner.combatTotals.wins.value,0);
for(const key of ['pregnancies','births','abortions','children'])ok(estimate(c,cfg).owner[key],{value:0,source:'record'});
for(const domain of ['pregnancies','births'])ok(estimate(c,cfg).rows[domain].source,'unknown');
const z=clone(c);z.flags.clone=true;
for(const[k,v]of Object.entries(estimate(z,cfg).rows))ok(v.value,0);
z.overrides.intimacy={mode:'record',value:70};ok(estimate(z,cfg).rows.intimacy.value,70);
z.overrides.intimacy={mode:'record',value:0};ok(estimate(z,cfg).rows.intimacy.source,'record');ok(estimate(z,cfg).rows.intimacy.value,0);
const no=clone(c);no.flags.noIntimacy=true;ok(estimate(no,cfg).rows.intimacy.value,0);
const non=clone(c);ok(estimate(non,cfg).partners[2],0);non.flags.nonhuman=true;assert(estimate(non,cfg).partners[2]>0);checks++;
const les=clone(c);les.flags.lesbian=true;ok(estimate(les,cfg).rows.intimacy.value,estimate(c,cfg).rows.intimacy.value);assert(estimate(les,cfg).partners[1]>estimate(c,cfg).partners[1]);checks++;
// Check the nontrivial invariant: every row, column, and grand total agrees after rounding.
for(let v=0;v<6;v++)for(let o=0;o<6;o++)for(let a=0;a<6;a++)for(const total of [0,1,2,13,107,999]){
 const x=clone(c);x.skills.vaginal=v;x.skills.oralDetail=o;x.skills.anal=a;x.samePct=37;x.nonhumanPct=23;x.overrides.intimacy={mode:'manual',value:total};
 const result=estimate(x,cfg);
 ok(result.partners.reduce((a,b)=>a+b,0),total);
 ok(result.acts.reduce((a,b)=>a+b,0)+result.unassigned,total);
 for(let j=0;j<3;j++)ok(result.matrix.reduce((a,r)=>a+r[j],0),result.partners[j]);
 for(let i=0;i<4;i++)ok(result.matrix[i].reduce((a,b)=>a+b,0),i===3?result.unassigned:result.acts[i]);
 assert(result.matrix.flat().every(x=>Number.isInteger(x)&&x>=0));checks++;
}
no.flags.noIntimacy=false;no.flags.noVaginal=true;ok(estimate(no,cfg).acts[0],0);
no.skills.vaginal=no.skills.oralDetail=no.skills.anal=0;ok(estimate(no,cfg).unassigned,estimate(no,cfg).rows.intimacy.value);
const w=clone(cfg);Object.keys(w.weights.intimacy).forEach(k=>w.weights.intimacy[k]=0);ok(estimate(c,w).rows.intimacy.value,0);
const frozen=estimate(c,cfg),before=clone(frozen);cfg.gradeBases.intimacy[4]=9999;ok(frozen,before);
const valid=freshState();ok(validateState(valid),valid);
for(const bad of [()=>({...valid,schema:'wrong'}),()=>{const x=clone(valid);x.config.rules.sameDefault=101;return x;},()=>{const x=clone(valid);x.character.overrides={pregnancies:{mode:'record',value:-1}};return x;},()=>{const x=clone(valid);x.snapshots=[{id:'broken'}];return x;}]){assert.throws(()=>validateState(bad()));checks++;}
const withSnapshot=freshState();withSnapshot.snapshots.push({id:'snapshot-1',label:'예시',savedAt:new Date().toISOString(),character:clone(withSnapshot.character),config:clone(withSnapshot.config),result:estimate(withSnapshot.character,withSnapshot.config)});ok(validateState(withSnapshot),withSnapshot);
const roundtrip=JSON.parse(JSON.stringify(withSnapshot));ok(validateState(roundtrip),withSnapshot);
console.log(`PASS · ${checks.toLocaleString()} assertions · deterministic seed, record priority, exceptions, total preservation, JSON validation and round trip`);
