'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');const {G,D,T,c,qa,rd,wr,nl,body,put}=require('./artemia-r03a.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.observations[0].failed,1);a.equal(red.observations[0].failures,'actual_definition_minimum_five;');
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));const d=c.parse(raw),edits=[],id='2026-11-13_r03a_artemia_beauty_minimum';
const edit=(location,old,next)=>{const s=body(d,location);a.equal(s.split(old).length-1,1,location);put(d,location,s.replace(old,()=>next));edits.push({location,field:'body',old,new:next,count:1,patchId:'R03A_ARTEMIA_BEAUTY_20261113'});};
const old=nl("$buyer_demand['Artemia'] = {\ndemand['min_beauty'] > 4\ndemand['nymphomania'] = 1\n}");edit('#npc_base',old,old.replace("demand['min_beauty'] > 4","demand['min_beauty'] = 5"));
const header=body(d,'$ongload').split('\r\n')[0]+'\r\n';edit('$ongload',header,nl(`! JO9 MOD START R03A_ARTEMIA_BEAUTY_CACHE_20261113
! Replace only the known obsolete expression; preserve edited conditions and actor state.
$buyer_demand['Artemia'] = replace($buyer_demand['Artemia'], 'demand[''min_beauty''] > 4', 'demand[''min_beauty''] = 5')
! JO9 MOD END R03A_ARTEMIA_BEAUTY_CACHE_20261113
`)+header);
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed.slice().sort(),['#npc_base','$ongload'].sort());
const prefs=b=>b.slice(b.indexOf("$npc_preferences['Artemia']"),b.indexOf("$buyer_demand['Artemia']"));a.equal(prefs(body(d,'#npc_base')),prefs(body(before,'#npc_base')));
const mod={id,status:'APPROVED',description:'R03-1 사용자 확정: 아르테미아 최저 외모5이상. 잘못된 >4 비교식을 =5 대입으로 바꾸고 알려진 옛 저장 요구 콜백만 갱신. 다른 NPC/조건/가격/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:edits.length,changedLocations:changed,modFile:T+'/mods/'+id+'.json',otherArtemiaPreferencesPreserved:true});console.log(JSON.stringify({candidate:mod.after_sha256,edits:edits.length,changed}));
