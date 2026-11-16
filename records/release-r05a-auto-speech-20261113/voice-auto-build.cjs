'use strict';
const {fs,z,a,R,D,T,c,qa,rd,wr,nl,q,body,put}=require('./voice-auto.cjs');
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')),d=c.parse(raw),edits=[];
function edit(location,old,neu,count=1){old=nl(old);neu=nl(neu);const s=body(d,location);a.equal(s.split(old).length-1,count,location+': '+old.slice(0,100));put(d,location,s.split(old).join(neu));edits.push({location,field:'body',old,new:neu,count,patchId:'R05A_AUTO_SPEECH_20261113'});}
const api=`! JO9 MOD START R05A_AUTO_SPEECH_20261113
! Ordinary appearance pools match generate_stock; exclusive presets stay outside.
if $args[0]='ordinary':
 result=0
 if args[1]=1448 or args[1]=1450: exit
 if loli_first>0 and args[1]>=loli_first and args[1]<=loli_last: result=1
 if young_first>0 and args[1]>=young_first and args[1]<=max(young_last,1462): result=1
 if milf_first>0 and args[1]>=milf_first and args[1]<=max(milf_last,2340): result=1
 exit
end
if $args[0]='princess':
 result=0
 local $jo9_auto_role=$args[1]
 if $jo9_auto_role='': exit
 local jo9_auto_type=dyneval('result='+$jo9_auto_role+'_type')
 if func('jo9_plain_voice','ordinary',jo9_auto_type)=0: exit
 if dyneval('$result=$'+$jo9_auto_role+'_family') ! 'mprincess': exit
 dynamic '$'+$jo9_auto_role+'_occupation='+"'mprincess'"
 dynamic '$'+$jo9_auto_role+'_occupation_description=$occupation_description['+"'mprincess']"
 dynamic '$'+$jo9_auto_role+'_occupation_auk='+"'여왕의 딸'"
 dynamic $jo9_auto_role+"['work_index']=5"
 result=1
 exit
end
if $args[0]='load':
 local $jo9_auto_roles, jo9_auto_i
 copyarr '$jo9_auto_roles','$all_slave_characters'
 $jo9_auto_roles[]='stock'
 $jo9_auto_roles[]='snk_parked_slave'
 for jo9_auto_i=0 to arrsize('$jo9_auto_roles')-1:
  gs 'jo9_plain_voice','princess',$jo9_auto_roles[jo9_auto_i]
 end
 exit
end
if $args[0]='update':
 local $jo9_auto_role=$args[1]
 result=0
 if $jo9_auto_role='': exit
 local jo9_auto_type=dyneval('result='+$jo9_auto_role+'_type')
 local jo9_auto_mode=dyneval('result='+$jo9_auto_role+"['jo9_plain_tone']")
 local jo9_auto_princess=func('jo9_plain_voice','princess',$jo9_auto_role)
 result=jo9_auto_mode
 if jo9_auto_mode=0 and jo9_auto_princess=0 and instr('|3002|2610|2620|3010|3021|3023|2621|3012|','|'+str(jo9_auto_type)+'|')=0: exit
 local jo9_auto_rational=dyneval('result='+$jo9_auto_role+"['rational']")
 local jo9_auto_moral=dyneval('result='+$jo9_auto_role+"['moral']")
 local jo9_auto_instinct=dyneval('result='+$jo9_auto_role+"['instinct']")
 local jo9_auto_fear=dyneval('result='+$jo9_auto_role+"['fear']")
 local jo9_auto_spoil=dyneval('result='+$jo9_auto_role+"['spoil']")
 if jo9_auto_rational>=3 and (jo9_auto_moral>=3 or jo9_auto_instinct>=3 or jo9_auto_fear>=3):
  result=-1
 elseif jo9_auto_spoil>=3:
  result=1
 end
 if result ! jo9_auto_mode: dynamic $jo9_auto_role+"['jo9_plain_tone']="+str(result)
 exit
end
! JO9 MOD END R05A_AUTO_SPEECH_20261113
`;
edit('jo9_plain_voice',"if $args[0]='enabled':",api+"if $args[0]='enabled':");
const cachePairs=[
['$voice_impression',"slave_type,slave['jo9_plain_tone'])","slave_type,func('jo9_plain_voice','update','slave'))"],
['$voice_native_actor',"dyneval('result='+$jo9_vn_memory_actor+'_type'),dynslave['jo9_plain_tone'])","dyneval('result='+$jo9_vn_memory_actor+'_type'),func('jo9_plain_voice','update',$jo9_vn_memory_actor))"],
['$voice_plain_stored',"func('jo9_plain_voice','enabled',args[0],slave['jo9_plain_tone'])","func('jo9_plain_voice','enabled',args[0],func('jo9_plain_voice','update','slave'))"]];
for(const [,old,neu] of cachePairs)edit('#dynamic',old,neu);
const storedOldGuard=" $result=$args[2]\n if func('jo9_plain_voice','enabled',args[0],slave['jo9_plain_tone'])=0: exit\n";
const storedNewGuard=storedOldGuard.replace(cachePairs[2][1],cachePairs[2][2]);
edit('jo9_plain_voice',"if instr($voice_plain_stored,"+q(nl(storedOldGuard))+")=0:","if instr($voice_plain_stored,"+q(nl(storedOldGuard))+")=0 and instr($voice_plain_stored,"+q(nl(storedNewGuard))+")=0:");
const cache=cachePairs.map(([v,old,neu])=>' '+v+'=replace('+v+','+q(old)+','+q(neu)+')').join('\n')+'\n';
edit('jo9_plain_voice'," exit\nend\n! JO9 MOD END R05_VOICE_POLICY_API_20261113",cache+" exit\nend\n! JO9 MOD END R05_VOICE_POLICY_API_20261113");
edit('chose_answer',",slave['jo9_plain_tone'])",",func('jo9_plain_voice','update','slave'))",7);
edit('$ongload',"gs 'jo9_plain_voice','cache'","gs 'jo9_plain_voice','cache'\ngs 'jo9_plain_voice','load'");
// Keep the valid world/family/age matrix; only narrow each allowed princess row.
let bg=body(d,'jo9_background_b'),rows=bg.split('\r\n').filter(v=>/if \$args\[1\].*\$args\[2\] = 'mprincess'.*\$result = /.test(v));a(rows.length>0);
for(const row of rows)edit('jo9_background_b',row,row.replace(/\$result = '[^']*'/,"$result = 'mprincess'"));
edit('generate_stock',"!OCCUPATION\n","!OCCUPATION\n! JO9 MOD START R05A_PRINCESS_OCCUPATION_20261113\ngs 'jo9_plain_voice','princess','stock'\n! JO9 MOD END R05A_PRINCESS_OCCUPATION_20261113\n");
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const spec=rd(D+'/spec.json');Object.assign(spec,{princessScopeRuling:'User confirmed ordinary characters with princess origin only; princess origin also fixes occupation to princess.',occupationLock:{generation:'Allowed princess background rows narrowed; legacy stock selection normalized before job effects.',existing:'Load and speech update normalize occupation, description, auction label, work_index only. Prior training, virginity, traits and progression untouched.'}});wr(D+'/spec.json',spec);
const mod={id:'2026-11-13_r05a_auto_speech_transitions',status:'APPROVED',description:'지정8명·반말속성·공주출신 일반노예 자동 말투 전환. 공주출신 일반노예는 직업도 공주로 고정. 기존 육성/진행 유지, 새 저장키 없음.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};wr(T+'/mods/'+mod.id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);wr(D+'/candidate-summary.json',{before:mod.before_sha256,after:mod.after_sha256,changedLocations:[...new Set(edits.map(e=>e.location))],edits:edits.length,princessRows:rows.length,locations:d.locations.length});console.log(JSON.stringify(rd(D+'/candidate-summary.json')));
