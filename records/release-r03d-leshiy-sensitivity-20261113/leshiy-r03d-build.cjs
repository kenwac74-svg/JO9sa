'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,nl,q,body,put,legacy,current}=require('./leshiy-r03d.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.assertions,30);a.equal(red.observations[0].failed,2);a.equal(red.observations[0].failures,'outcome_over4;outcome_over5;');a.equal(red.observations[1].failed,3);a.equal(red.observations[1].failures,'cached_1_4;cached_2_4;custom_limit_preserved;');
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),id='2026-11-13_r03d_leshiy_sensitivity_maximum',edits=[];
const edit=(location,old,next)=>{const s=body(d,location);a.equal(s.split(old).length-1,1,location);put(d,location,s.replace(old,()=>next));edits.push({location,field:'body',old,new:next,count:1,patchId:'R03D_LESHIY_SENSITIVITY_MAX_20261113'});};
const b=body(d,'#npc_base'),p=b.indexOf("$npc_preferences['leshiy'] = {"),end=b.indexOf('\r\n}',p)+3;a(p>=0&&end>p);const old=b.slice(p,end);a.equal(old.split(legacy).length-1,1);edit('#npc_base',old,old.replace(legacy,current));
const anchor=nl("dynamic $npc_preferences[$npc_id]\n");edit('slave_sell_chek',anchor,anchor+nl(`! JO9 MOD START R03D_LESHIY_SENSITIVITY_MAX_20261113
! stat_importance is cleared for each customer; an unset maximum adds no restriction.
if stat_importance['max_sensitivity'] > 0 and slave['sensitivity'] > stat_importance['max_sensitivity']: sl_txt = 102 & exit
! JO9 MOD END R03D_LESHIY_SENSITIVITY_MAX_20261113
`));
const header=body(d,'$ongload').split('\r\n')[0]+'\r\n';edit('$ongload',header,nl(`! JO9 MOD START R03D_LESHIY_SENSITIVITY_CACHE_20261113
! Replace only the known legacy Leshiy expression; preserve custom conditions and notes.
$npc_preferences['leshiy'] = replace($npc_preferences['leshiy'], ${q(legacy)}, ${q(current)})
! JO9 MOD END R03D_LESHIY_SENSITIVITY_CACHE_20261113
`)+header);
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed.slice().sort(),['#npc_base','slave_sell_chek','$ongload'].sort());
const mod={id,status:'APPROVED',description:'R03-4 사용자 승인: 레시 감수성3이하 상한. 최저값 검사와 구분해 기존 임시 조건표에서 판정하고 알려진 옛 저장 선호 표현만 갱신. 체력/인지도/다른 기술/가격/평가/인물/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:3,changedLocations:changed,modFile:T+'/mods/'+id+'.json',newActorSaveFields:0,newLocations:0,scratchKey:'stat_importance[max_sensitivity]',scratchReset:'existing killvar stat_importance on each sale check'});console.log(JSON.stringify({candidate:mod.after_sha256,edits:3,changed}));
