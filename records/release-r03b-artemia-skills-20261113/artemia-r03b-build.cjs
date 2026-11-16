'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const {G,D,T,c,qa,rd,wr,nl,q,body,put,limits}=require('./artemia-r03b.cjs');
const red=rd(D+'/native-red-report.json');
a.equal(red.passed,false);a.equal(red.observations.length,1);a.equal(red.observations[0].checks,10);a.equal(red.observations[0].failed,8);
a.equal(red.observations[0].failures,Object.keys(limits).map(k=>'definition_'+k+';').join(''));
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));
const d=c.parse(raw),edits=[],id='2026-11-13_r03b_artemia_skill_minima';
const edit=(location,old,next)=>{const s=body(d,location);a.equal(s.split(old).length-1,1,location);put(d,location,s.replace(old,()=>next));edits.push({location,field:'body',old,new:next,count:1,patchId:'R03B_ARTEMIA_SKILLS_20261113'});};
const b=body(d,'#npc_base'),start=b.indexOf("$npc_preferences['Artemia'] = {"),end=b.indexOf("$buyer_demand['Artemia']",start);
a(start>=0&&end>start);const old=b.slice(start,end);let next=old;
for(const [key,min] of Object.entries(limits)){
 const from=`stat_importance['${key}'] > ${min-1}`,to=`stat_importance['${key}'] = ${min}`;
 a.equal(next.split(from).length-1,key==='music'?2:1,key);next=next.replaceAll(from,to);
}
edit('#npc_base',old,next);
const header=body(d,'$ongload').split('\r\n')[0]+'\r\n';
let cache='! JO9 MOD START R03B_ARTEMIA_SKILL_CACHE_20261113\n! Replace only known legacy Artemia expressions; preserve custom rules and actor state.\n';
for(const [key,min] of Object.entries(limits))cache+=`$npc_preferences['Artemia'] = replace($npc_preferences['Artemia'], ${q(`stat_importance['${key}'] > ${min-1}`)}, ${q(`stat_importance['${key}'] = ${min}`)})\n`;
cache+='! JO9 MOD END R03B_ARTEMIA_SKILL_CACHE_20261113\n';edit('$ongload',header,nl(cache)+header);
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed.slice().sort(),['#npc_base','$ongload'].sort());
const buyer=x=>x.slice(x.indexOf("$buyer_demand['Artemia']"),x.indexOf("$buyer_demand['Artemia']")+150);a.equal(buyer(body(d,'#npc_base')),buyer(body(before,'#npc_base')));
const mod={id,status:'APPROVED',description:'R03-2 사용자 승인: 아르테미아 기술 8종을 기존 부등호 뜻대로 최저 4/5로 저장. 알려진 옛 저장 선호 콜백만 갱신. 등급8/외모5/특성/가격/다른 NPC/인물/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);
wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,limits,edits:edits.length,changedLocations:changed,modFile:T+'/mods/'+id+'.json',otherArtemiaDemandsPreserved:true});
console.log(JSON.stringify({candidate:mod.after_sha256,edits:edits.length,changed,limits}));
