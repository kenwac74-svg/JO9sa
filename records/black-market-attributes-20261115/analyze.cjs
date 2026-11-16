'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',T='G:/Codex/tmp/black-market-attributes-20261115',D=R+'/records/black-market-attributes-20261115',c=require(R+'/tools/text-workshop/core.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const beforeRaw=fs.readFileSync(T+'/red/qa.sav'),afterRaw=fs.readFileSync(T+'/green/qa.sav'),b=sv.parse(beforeRaw),s=sv.parse(afterRaw);a(sv.serialize(b).equals(beforeRaw));a(sv.serialize(s).equals(afterRaw));
const value=(x,n,k)=>sv.value(x,n,k),num=(x,n,k)=>Number(value(x,n,k)[0]);a(num(b,'qa_failed')>0);a.equal(num(s,'qa_failed'),0);a.equal(num(s,'qa_checks'),3500);
const skills='service cook secretary expression nurse alchemy enchanter gladiatrix calisthenics music art pet dressage cowSK petting oral penetration orgy roleplay fetishism xenophily nipplefuck lesbiansex'.split(' '),preserve=[...skills,'style','fame','mood','psy_basic','fullimage','ava','ava_gray','ava_clear','boobs_img','pussy_img','age','virginity'];
let preservedChecks=0,traitVariants=new Set(),detail=[];
const plan=JSON.parse(fs.readFileSync(D+'/plan.json','utf8'));
for(let i=2586;i<=2597;i++)for(let di of [1,2]){
 const actor='qa_actor_'+i+'_'+di,rate='qa_rate_'+i+'_'+di;
 const subkeys=(b.vars.find(v=>v.name===actor.toUpperCase()).idx||[]).map(x=>x[1]).filter(k=>k.startsWith('SUB_'));
 for(let arr of [actor,rate])for(let k of [...preserve,...subkeys]){a.deepEqual(value(b,arr,k),value(s,arr,k),arr+' '+k);preservedChecks++;}
 for(let prefix of ['qa_owned_','qa_owned_rate_'])for(let k of [...skills,...subkeys,'style','fame','fullimage','ava','ava_gray','ava_clear']){a.deepEqual(value(b,prefix+i+'_'+di,k),value(s,prefix+i+'_'+di,k),prefix+i+' '+k);preservedChecks++;}
 a.deepEqual(value(b,'$qa_psy_'+i+'_'+di),value(s,'$qa_psy_'+i+'_'+di),'mood root');preservedChecks++;
 for(let k of plan.traitKeys)if(JSON.stringify(value(b,actor,k))!==JSON.stringify(value(s,actor,k)))detail.push({id:i,difficulty:di,key:k,before:value(b,actor,k)[0],after:value(s,actor,k)[0]});
 traitVariants.add(JSON.stringify(plan.traitKeys.map(k=>value(s,actor,k))));
}
a(detail.length>20);a(traitVariants.size>10);
const draws={};for(let k of ['beauty','stamina','sensitivity','temper','intellect','ego','pride','exotic','fat']){let vals=s.vars.find(v=>v.name==='QA_DRAW_'+k.toUpperCase()).values.map(x=>Number(x[0]));let hist={};for(let v of vals)hist[v]=(hist[v]||0)+1;draws[k]=hist;a(Object.keys(hist).length>1,k+' diversity');}
const fixture=JSON.parse(fs.readFileSync(D+'/green-fixture.json','utf8'));for(let f of fixture.templates)a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/'+f.file)),f.sha256,'manual JSON changed '+f.file);
const out={nativeChecks:3500,nativeFailures:0,redFailures:num(b,'qa_failed'),actualGenerations:192,templates:12,difficulties:[1,2],weightedBoundaryCases:400,preservedChecks,skillFields:skills.length,traitChanges:detail.length,traitVariants:traitVariants.size,draws,detail};fs.writeFileSync(D+'/verification-native.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,detail:undefined,draws:undefined}));
