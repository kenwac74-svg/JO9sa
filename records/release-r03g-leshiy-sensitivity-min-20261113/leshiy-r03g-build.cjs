'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,nl,body,put}=require('./leshiy-r03g.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.assertions,35);a.equal(red.observations[0].failures,'outcome_below0;');a.equal(red.observations[1].failures,'saved_below_1;saved_below_2;custom_minimum2_rejects1;');
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),id='2026-11-13_r03g_leshiy_sensitivity_minimum',location='slave_sell_chek',s=body(d,location);
const old=nl('! JO9 MOD END R03D_LESHIY_SENSITIVITY_MAX_20261113\n');a.equal(s.split(old).length-1,1);
const next=old+nl(`! JO9 MOD START R03G_LESHIY_SENSITIVITY_MINIMUM_20261113
! User-approved lower limit for Leshiy only; use the stored demand value.
if $lcase($npc_id) = 'leshiy' and demand['min_sensitivity'] > 0 and slave['sensitivity'] < demand['min_sensitivity']: sl_txt = 102 & exit
! JO9 MOD END R03G_LESHIY_SENSITIVITY_MINIMUM_20261113
`);put(d,location,s.replace(old,()=>next));const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed,[location]);
const mod={id,status:'APPROVED',description:'R03-7 사용자 승인: 레시 감수성 최저1을 실제 납품에 연결해 상한3과 함께1~3 허용. 다른 고객/인물값/체력/인지도/기술/평가/가격/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits:[{location,field:'body',old,new:next,count:1,patchId:'R03G_LESHIY_SENSITIVITY_MINIMUM_20261113'}]};wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:1,changedLocations:changed,modFile:T+'/mods/'+id+'.json',newSaveFields:0,newLocations:0,newLoadCallback:false,customerScope:'Leshiy only',sensitivityRange:[1,3]});console.log(JSON.stringify({candidate:mod.after_sha256,edits:1,changed}));
