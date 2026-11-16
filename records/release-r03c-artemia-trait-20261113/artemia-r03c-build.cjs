'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,nl,body,put}=require('./artemia-r03c.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.assertions,43);a.equal(red.observations[0].failed,4);a.equal(red.observations[0].failures,'outcome_negative_hidden;outcome_absent_hidden;outcome_negative_revealed;outcome_absent_revealed;');a.equal(red.observations[1].failed,0);
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));
const d=c.parse(raw),id='2026-11-13_r03c_artemia_trait_requirement',location='slave_sell_chek',s=body(d,location);
const old=nl("if slave['beauty'] < demand['min_beauty']: sl_txt = 100 & $refuse_txt = '나는 더 아름다운 노예를 원한다.' & exit\n");a.equal(s.split(old).length-1,1);
const block=nl(`! JO9 MOD START R03C_ARTEMIA_TRAIT_REQUIREMENT_20261113
! Existing minimum 1 accepts both positive trait stages; discovery is not required.
if demand['nymphomania'] > 0 and slave['nymphomania'] < demand['nymphomania']:
 sl_txt = 100 & $refuse_txt = '나는 색정광이나 정액 중독 특성을 가진 노예를 원한다.' & exit
end
! JO9 MOD END R03C_ARTEMIA_TRAIT_REQUIREMENT_20261113
`);
const next=old+block;put(d,location,s.replace(old,()=>next));const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed,[location]);
const mod={id,status:'APPROVED',description:'R03-3 사용자 승인: 아르테미아의 기존 nymphomania 최저1 요구를 실제 납품 검사에 연결. 색정광·정액 중독 모두 허용하고 발견 상태를 추가 조건으로 삼지 않음. 기존 조건·평가·가격·인물·진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits:[{location,field:'body',old,new:next,count:1,patchId:'R03C_ARTEMIA_TRAIT_REQUIREMENT_20261113'}]};
wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:1,changedLocations:changed,modFile:T+'/mods/'+id+'.json',newSaveFields:0,newLocations:0,newLoadCallback:false});console.log(JSON.stringify({candidate:mod.after_sha256,edits:1,changed}));
