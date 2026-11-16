'use strict';
const {fs,z,a,R,G,D,T,c,qa,rd,wr,nl,q,body,put,fn,ids,rough,field}=require('./voice-r05.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.assertions,188);a.equal(red.observations[0].failed,53);a.equal(red.observations[1].failed,13);a.equal(red.observations[2].failed,33);
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),id='2026-11-13_r05_voice_policy_flags',edits=[],cachePairs=[];
function edit(location,old,next,count=1){const b=body(d,location);a.equal(b.split(old).length-1,count,location);put(d,location,b.split(old).join(nl(next)));edits.push({location,field:'body',old,new:nl(next),count,patchId:'R05_VOICE_POLICY_20261113'});}
function updateFn(name,changes){const old=fn(d,name);let next=old;for(const [from,to]of changes){a.equal(next.split(from).length-1,1,name+':'+from.slice(0,70));next=next.replace(from,()=>to);cachePairs.push({variable:'$'+name,old:from,new:to});}edit('#dynamic',old,nl(`! JO9 MOD START R05_VOICE_${name.toUpperCase()}_20261113\n`)+next+nl(`\n! JO9 MOD END R05_VOICE_${name.toUpperCase()}_20261113`));}
const profile=fn(d,'voice_profile'),roughLine=profile.split('\r\n').find(s=>s.includes('|tribal_girl|thief|beggar|'));a(roughLine);const identityLine=profile.split('\r\n').find(s=>s.includes("if instr('|3002|2610|2620|"));a(identityLine);
updateFn('voice_profile',[
 [' jo9_vf_actor_type=args[5]'," jo9_vf_actor_type=args[5]\r\n jo9_vf_actor_plain=args[6]"],
 [roughLine+'\r\n',''],
 [identityLine," if func('jo9_plain_voice','enabled',args[5],args[6])=1: jo9_voice_tone_code=3"]
]);
updateFn('voice_pick_fragment',[[" $result=func('jo9_plain_voice',jo9_vf_actor_type,$result)"," $result=func('jo9_plain_voice',jo9_vf_actor_type,$result,jo9_vf_actor_plain)"]]);
updateFn('voice_impression',[
 ["$dyneval($voice_profile,$slave_occupation,slave['temper'],slave['sensitivity'],slave['ego'],slave['pride'],slave_type)","$dyneval($voice_profile,$slave_occupation,slave['temper'],slave['sensitivity'],slave['ego'],slave['pride'],slave_type,slave['jo9_plain_tone'])"],
 [" killvar 'jo9_vf_actor_type'"," killvar 'jo9_vf_actor_type'\r\n killvar 'jo9_vf_actor_plain'"]
]);
updateFn('voice_native_actor',[
 ["$dyneval($voice_profile,$jo9_vn_occupation,dynslave['temper'],dynslave['sensitivity'],dynslave['ego'],dynslave['pride'],dyneval('result='+$jo9_vn_memory_actor+'_type'))","$dyneval($voice_profile,$jo9_vn_occupation,dynslave['temper'],dynslave['sensitivity'],dynslave['ego'],dynslave['pride'],dyneval('result='+$jo9_vn_memory_actor+'_type'),dynslave['jo9_plain_tone'])"],
 [" killvar 'jo9_vf_actor_type'"," killvar 'jo9_vf_actor_type'\r\n killvar 'jo9_vf_actor_plain'"]
]);
updateFn('voice_plain_stored',[[" $result=$args[2]\r\n"," $result=$args[2]\r\n if func('jo9_plain_voice','enabled',args[0],slave['jo9_plain_tone'])=0: exit\r\n"]]);
let api="! JO9 MOD START R05_VOICE_POLICY_API_20261113\n! jo9_plain_tone: -1 disables plain speech, 0 uses defaults, 1 enables it.\n! Defaults use the eight named identities only; occupation never enables plain speech.\nif $args[0]='enabled':\n result=0\n if args[2]<0: exit\n if args[2]>0: result=1 & exit\n if instr('|"+ids.join('|')+"|','|'+str(args[1])+'|')>0: result=1\n exit\nend\nif $args[0]='cache':\n ! Only known old code fragments are upgraded. Other text and callbacks stay as supplied.\n";
for(const v of cachePairs){const statement=`${v.variable}=replace(${v.variable},${q(v.old)},${q(v.new)})`;api+=v.new.includes(v.old)&&v.old!==''?` if instr(${v.variable},${q(v.new)})=0: ${statement}\n`:` ${statement}\n`;}
api+=" exit\nend\n! JO9 MOD END R05_VOICE_POLICY_API_20261113\n";
const oldGuard="if instr('|"+ids.join('|')+"|','|'+str(args[0])+'|')=0: exit",newGuard="if func('jo9_plain_voice','enabled',args[0],args[2])=0: exit";edit('jo9_plain_voice',oldGuard,newGuard);const first=body(d,'jo9_plain_voice').split('\r\n')[0];edit('jo9_plain_voice',first+'\r\n',nl(api)+first+'\r\n');
const wishLines=body(d,'chose_answer').split('\r\n').filter(s=>s.includes("func('jo9_plain_voice',slave_type,"));a.equal(wishLines.length,7);for(const old of wishLines){a(old.trimEnd().endsWith(')'));const pos=old.lastIndexOf(')');edit('chose_answer',old,old.slice(0,pos)+",slave['jo9_plain_tone']"+old.slice(pos));}
const loadFirst=body(d,'$ongload').split('\r\n')[0]+'\r\n';edit('$ongload',loadFirst,nl("! JO9 MOD START R05_VOICE_POLICY_LOAD_20261113\ngs 'jo9_plain_voice','cache'\n! JO9 MOD END R05_VOICE_POLICY_LOAD_20261113\n")+loadFirst);
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));const prior=c.parse(raw),changed=d.locations.filter(v=>body(d,v.name)!==body(prior,v.name)).map(v=>v.name);a.deepEqual(changed.slice().sort(),['#dynamic','$ongload','chose_answer','jo9_plain_voice'].sort());a.equal(d.locations.length,prior.locations.length);
const mod={id,status:'APPROVED',description:'R05/Q02 사용자 승인: 직업기반반말제거·지정8명기본유지·인물내부말투속성jo9_plain_tone(-1/0/1)우선. 실제화자별전달·알려진캐시갱신. 헌신/사육/인식수치와자동기준·기존대사원고·육성/진행·혀손실보류는유지.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,editObjects:edits.length,changedLocations:changed,newLocations:0,newActorKeys:[field],newGlobalArrays:0,defaults:ids,cachePairs:cachePairs.map(v=>({variable:v.variable,oldBytes:Buffer.byteLength(v.old),newBytes:Buffer.byteLength(v.new)}))});console.log(JSON.stringify({candidate:mod.after_sha256,edits:edits.length,changed,cachePairs:cachePairs.length}));
