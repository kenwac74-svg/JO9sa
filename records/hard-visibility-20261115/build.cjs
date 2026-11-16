'use strict';
const fs=require('fs'),z=require('zlib'),assert=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/hard-visibility-20261115',D=R+'/records/hard-visibility-20261115';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(W+'/jack.qsp'),doc=c.parse(raw),nl=s=>s.replace(/\r?\n/g,'\r\n');
assert.equal(c.hash(raw),'dc97571338996682401037d009f9ecc62923bb471292911daa1b69f9375f9d75','WORK changed; rebase required');
assert(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));assert(c.serialize(doc).equals(raw));qa.inspectWorld(raw);
fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});
if(!fs.existsSync(D+'/baseline.qsp.gz'))fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));
else assert(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(raw));
if(!fs.existsSync(D+'/manifest.before.json.gz'))fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
fs.writeFileSync(T+'/baseline.qsp',raw);
const edits=[],id='HARD_ATTRIBUTE_VISIBILITY_V2_20261115';
function body(n){return c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);}
function edit(n,old,nu){assert.equal(body(n).split(old).length,2,'unique match '+n);doc.lines[doc.locations.find(l=>l.name===n).body]=c.shift(body(n).replace(old,nu),-5);edits.push({location:n,field:'body',old,new:nu,count:1,patchId:id});}
const roles=['slave','assistant','prisoner','cow','room1','room2','room3','room4','farmhand','harpy','pig',...Array.from({length:18},(_,i)=>'iced_'+(i+1)),'snk_parked_slave'];
const roleAssignments=roles.map(r=>" $jo9_av_roles[]='"+r+"'").join('\n');
const helper=nl(`! JO9 MOD START ${id}
if $args[0]='newgame':
 jo9_observation_revision=1
 exit
end
if $args[0]='legacy':
 if jo9_observation_revision>=1: exit
 local $jo9_av_roles,$jo9_av_role
 local jo9_av_i
${roleAssignments}
 for jo9_av_i=0 to arrsize('$jo9_av_roles')-1:
  $jo9_av_role=$jo9_av_roles[jo9_av_i]
  if dyneval('result='+$jo9_av_role+'_state')>CONST_INT['no_slave']:
   dynamic $jo9_av_role+"['jo9_observation_days']=10"
  end
 end
 jo9_observation_revision=1
 exit
end
if $args[0]='tick':
 if instr('|slave|assistant|room1|room2|room3|room4|','|'+$args[1]+'|')=0: exit
 if dyneval('result='+$args[1]+'_state')<=CONST_INT['no_slave']: exit
 dynamic $args[1]+"['jo9_observation_days']=min(10,max(0,"+$args[1]+"['jo9_observation_days'])+1)"
 exit
end
if $args[0]='visible':
 result=1
 if difficulty_setting!2 or spell_revelio=1 or master_mage>=4: exit
 if instr('|stamina|temper|intellect|sensitivity|pride|ego|','|'+$args[2]+'|')=0: exit
 if master_mage>=2 and instr('|stamina|temper|intellect|','|'+$args[2]+'|')>0: exit
 local jo9_av_days=0
 if $args[1]!'stock' and $args[1]!'seed': jo9_av_days=max(0,dyneval('result='+$args[1]+"['jo9_observation_days']"))
 if jo9_av_days>=10: exit
 result=0
 exit
end
local jo9_av_show=func('jo9_attribute_visibility','visible',$args[1],$args[2])
$result=$args[3]
if jo9_av_show=1: exit
if $args[0]='tooltip':
 local jo9_av_days=0
 if $args[1]!'stock' and $args[1]!'seed': jo9_av_days=max(0,dyneval('result='+$args[1]+"['jo9_observation_days']"))
 $result='노예·조수 슬롯 또는 개인실에서 누적 10일을 지내면 확인할 수 있습니다. 현재 '+str(jo9_av_days)+'/10일. 감옥·크라이오·외양간에서는 누적되지 않습니다. 마법력 A 이상 또는 리벨리스 효과로 즉시 공개됩니다.'
else
 $result='<span style="color:#777">미확인</span>'
end
! JO9 MOD END ${id}`);
edit('jo9_attribute_visibility',body('jo9_attribute_visibility'),helper);
for(const [name,mode]of [['$ongload','legacy'],['init_game','newgame']]){const prefix=nl(`! JO9 MOD START ${id}\ngs 'jo9_attribute_visibility','${mode}'\n! JO9 MOD END ${id}\n`);const anchor=body(name).split('\r\n').slice(0,2).join('\r\n');edit(name,anchor,prefix+anchor);}
const ageLine="\t\tdynslave['age_count'] += 1";
edit('next_day',ageLine,ageLine+nl(`\n\t\t! JO9 MOD START ${id}\n\t\tgs 'jo9_attribute_visibility','tick','dynslave'\n\t\t! JO9 MOD END ${id}`));
const out=c.serialize(doc);qa.inspectWorld(out);assert.equal(c.parse(out).locations.length,c.parse(raw).locations.length);
const mod={id,status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
const filename='2026-11-15_hard_attribute_visibility_v2.json';
fs.writeFileSync(T+'/mods/'+filename,JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(T+'/candidate.qsp',out);
fs.writeFileSync(D+'/plan.json',JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,locations:edits.map(x=>x.location),counter:'jo9_observation_days',revision:'jo9_observation_revision',eligible:['slave','assistant','room1','room2','room3','room4'],legacyOwned:roles,mod:filename},null,2)+'\n');
for(const f of ['build.cjs','check.cjs'])fs.copyFileSync(__dirname+'/'+f,D+'/'+f);
fs.copyFileSync(__dirname+'/PLAN_KO.md',R+'/docs/superpowers/plans/2026-11-15-hard-visibility.md');
console.log(JSON.stringify({after:mod.after_sha256,edits:edits.length,candidate:T+'/candidate.qsp'}));
