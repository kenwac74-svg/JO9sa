'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,nl,body,put}=require('./leshiy-r03f.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.assertions,31);a.equal(red.observations[0].failed,2);a.equal(red.observations[0].failures,'outcome_known1;outcome_legend5;');a.equal(red.observations[1].failed,2);a.equal(red.observations[1].failures,'saved_known_1;saved_known_2;');
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),id='2026-11-13_r03f_leshiy_unknown_requirement',location='slave_sell_chek',s=body(d,location);
const old=nl("if slave['beauty'] < demand['min_beauty']: sl_txt = 100 & $refuse_txt = '나는 더 아름다운 노예를 원한다.' & exit\n");a.equal(s.split(old).length-1,1);
const next=old+nl(`! JO9 MOD START R03F_LESHIY_UNKNOWN_REQUIREMENT_20261113
! Existing unknown demand requires fame zero; other customers keep the normal rules.
if demand['unknown'] = 1 and slave['fame'] ! 0:
 sl_txt = 100 & $refuse_txt = '나는 아무에게도 알려지지 않은 무명 노예를 원한다.' & exit
end
! JO9 MOD END R03F_LESHIY_UNKNOWN_REQUIREMENT_20261113
`);put(d,location,s.replace(old,()=>next));const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed,[location]);
const mod={id,status:'APPROVED',description:'R03-6 사용자 승인: 레시의 기존 unknown=1 요구를 실제 납품에 연결해 인지도0 무명 노예만 허용. 인지도1이상 거절. 인물값/체력/감수성/다른 고객/평가/가격/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits:[{location,field:'body',old,new:next,count:1,patchId:'R03F_LESHIY_UNKNOWN_REQUIREMENT_20261113'}]};wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:1,changedLocations:changed,modFile:T+'/mods/'+id+'.json',newSaveFields:0,newLocations:0,newLoadCallback:false,requiredFame:0});console.log(JSON.stringify({candidate:mod.after_sha256,edits:1,changed}));
