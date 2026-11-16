'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const {R,G,D,T,c,qa,rd,wr,nl,q,body,put,legacy,current}=require('./kikimora-r03h.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.assertions,30);a.equal(red.observations[0].failures,'outcome_beauty3;');a.equal(red.observations[1].failures,'saved_below_1;saved_rule_preserved_1;saved_below_2;saved_rule_preserved_2;');
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),id='2026-11-13_r03h_kikimora_beauty_minimum',edits=[];
const edit=(location,old,next)=>{const s=body(d,location);a.equal(s.split(old).length-1,1,location);put(d,location,s.replace(old,()=>next));edits.push({location,field:'body',old,new:next,count:1,patchId:'R03H_KIKIMORA_BEAUTY_MINIMUM_20261113'});};
const b=body(d,'#npc_base'),p=b.indexOf("$buyer_demand['kikimora'] = {"),end=b.indexOf('\r\n}',p)+3;a(p>=0&&end>p);const old=b.slice(p,end);a.equal(old.split(legacy).length-1,1);edit('#npc_base',old,old.replace(legacy,current));
const header=body(d,'$ongload').split('\r\n')[0]+'\r\n';edit('$ongload',header,nl(`! JO9 MOD START R03H_KIKIMORA_BEAUTY_CACHE_20261113
! Replace only the known old beauty expression; preserve custom conditions and notes.
$buyer_demand['kikimora'] = replace($buyer_demand['kikimora'], ${q(legacy)}, ${q(current)})
! JO9 MOD END R03H_KIKIMORA_BEAUTY_CACHE_20261113
`)+header);
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const before=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(before,l.name)).map(l=>l.name);a.deepEqual(changed.slice().sort(),['#npc_base','$ongload'].sort());const pref=x=>{const s=body(x,'#npc_base'),a=s.indexOf("$npc_preferences['kikimora']"),b=s.indexOf('}',a)+1;return s.slice(a,b);};a.equal(pref(d),pref(before));
const mod={id,status:'APPROVED',description:'R03-8 사용자 승인: 키키모라 최저외모4이상 저장. 알려진 옛 요구의 >3 비교식만 =4로 갱신. 기술/다른 요구/분류/대사/가격/인물/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:2,changedLocations:changed,modFile:T+'/mods/'+id+'.json',newSaveFields:0,newLocations:0,skillPreferencesUnchanged:true});console.log(JSON.stringify({candidate:mod.after_sha256,edits:2,changed}));
