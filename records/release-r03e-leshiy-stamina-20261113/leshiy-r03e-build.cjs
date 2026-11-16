'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,nl,q,body,put,legacy,current}=require('./leshiy-r03e.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.assertions,33);a.equal(red.observations[0].failed,2);a.equal(red.observations[0].failures,'outcome_lower3;outcome_city_capital3;');a.equal(red.observations[1].failed,4);a.equal(red.observations[1].failures,'cached_1_3;manual_1;cached_2_3;manual_2;');
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),id='2026-11-13_r03e_leshiy_stamina_minimum',edits=[];
const edit=(location,old,next)=>{const s=body(d,location);a.equal(s.split(old).length-1,1,location);put(d,location,s.replace(old,()=>next));edits.push({location,field:'body',old,new:next,count:1,patchId:'R03E_LESHIY_STAMINA_MINIMUM_20261113'});};
const b=body(d,'#npc_base'),p=b.indexOf("$buyer_demand['leshiy'] = {"),end=b.indexOf('\r\n}',p)+3;a(p>=0&&end>p);const old=b.slice(p,end);a.equal(old.split(legacy).length-1,1);edit('#npc_base',old,old.replace(legacy,current));
const anchor=nl("if slave['wounds'] > 0 or slave['energy'] < 0 or slave['stamina'] < 2: sl_txt = 104 & exit\n");edit('slave_sell_chek',anchor,anchor+nl(`! JO9 MOD START R03E_LESHIY_STAMINA_MINIMUM_20261113
! User-approved Leshiy-only requirement; preserve all other customer rules.
if $lcase($npc_id) = 'leshiy' and demand['min_stamina'] > 0 and slave['stamina'] < demand['min_stamina']: sl_txt = 104 & exit
! JO9 MOD END R03E_LESHIY_STAMINA_MINIMUM_20261113
`));
const header=body(d,'$ongload').split('\r\n')[0]+'\r\n';edit('$ongload',header,nl(`! JO9 MOD START R03E_LESHIY_STAMINA_CACHE_20261113
! Replace only the known legacy Leshiy demand; preserve custom values and notes.
$buyer_demand['leshiy'] = replace($buyer_demand['leshiy'], ${q(legacy)}, ${q(current)})
! JO9 MOD END R03E_LESHIY_STAMINA_CACHE_20261113
`)+header);
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed.slice().sort(),['#npc_base','slave_sell_chek','$ongload'].sort());
const mod={id,status:'APPROVED',description:'R03-5 사용자 승인: 다른 고객의 기존 동작 유지,레시만 체력4이상 실제 납품 조건 연결. 알려진 옛 요구 비교식만 갱신. 감수성 상한/다른 기술/평가/가격/인물/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:3,changedLocations:changed,modFile:T+'/mods/'+id+'.json',newSaveFields:0,newLocations:0,customerScope:'Leshiy only, case-insensitive ID comparison'});console.log(JSON.stringify({candidate:mod.after_sha256,edits:3,changed}));
