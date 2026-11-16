'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const base='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(base),doc=core.parse(raw);
assert.equal(doc.hash,'a4d1985cba2f3071405fe8e6ac3edd47a1e29c1693dd84e7485b131974665a72');
const body=n=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const nl=s=>s.replace(/\r?\n/g,'\r\n');
const edits=[];
function edit(location,old,newText,count=1){old=nl(old);newText=nl(newText);assert.equal(body(location).split(old).length-1,count,location+' anchor '+old.slice(0,60));edits.push({location,field:'body',old,new:newText,count});}
function section(location,start,end,newText){const b=body(location),s=b.indexOf(start),e=b.indexOf(end,s);assert(s>=0&&e>s);edit(location,b.slice(s,e),newText);}
const helper=nl(`! JO9 MOD START ACTIVITY_STAGES_20261112
! Derived stages: +1 perseverance, +2 workaholic, -1 distracted, -2 inertia.
! Existing physical trait/history fields are reused; no automatic promotion.
local $j9as_mode, $j9as_role
$j9as_mode=$args[0]
$j9as_role=$args[1]
local j9as_stage, j9as_focus, j9as_work, j9as_comfort
j9as_stage=0
j9as_focus=dyneval('result='+$j9as_role+"['jo9_focus']")
j9as_work=dyneval('result='+$j9as_role+"['jo9_work_ethic']")
j9as_comfort=dyneval('result='+$j9as_role+"['passion_comfort']")
if j9as_work>0 or j9as_comfort<0:
 j9as_stage=2
elseif j9as_focus>0:
 j9as_stage=1
elseif j9as_work<0 or j9as_comfort>0:
 j9as_stage=-2
elseif j9as_focus<0:
 j9as_stage=-1
end
result=j9as_stage
if $j9as_mode='stage': exit
if $j9as_mode='sign': result=iif(j9as_stage*j9as_stage=4,j9as_stage/2,0) & exit
if $j9as_mode='focus': result=iif(j9as_stage>0,1,iif(j9as_stage<0,-1,0)) & exit
if $j9as_mode='grant' or $j9as_mode='edit':
 local j9as_wanted=args[2]
 if j9as_wanted ! 1 and j9as_wanted ! 2 and j9as_wanted ! -1 and j9as_wanted ! -2: result=0 & exit
 if $j9as_mode='edit' and j9as_wanted=j9as_stage:
  j9as_stage=0
 else
  if j9as_stage>0 and j9as_wanted<0: result=0 & exit
  if j9as_wanted>0 and j9as_stage<=0: j9as_stage=j9as_wanted
  if j9as_wanted>0 and j9as_stage>0: j9as_stage=max(j9as_stage,j9as_wanted)
  if j9as_wanted<0 and j9as_stage<=0: j9as_stage=min(j9as_stage,j9as_wanted)
 end
 if j9as_stage=2 and func('jo9_traits','allow',$j9as_role,'jo9_work_ethic',1)=0: result=0 & exit
elseif $j9as_mode='remove':
 if $args[2]='jo9_work_ethic' or $args[2]='passion_comfort':
  if j9as_stage*j9as_stage=4: j9as_stage=0
 elseif $args[2]='jo9_focus':
  if j9as_stage*j9as_stage=1: j9as_stage=0
 else
  j9as_stage=0
 end
end
dynamic $replace({
 j9asactor['jo9_focus']=iif(args[0]*args[0]=1,args[0],0)
 j9asactor['jo9_work_ethic']=iif(args[0]*args[0]=4,args[0]/2,0)
 j9asactor['passion_comfort']=-j9asactor['jo9_work_ethic']
 if args[0]=0 or (j9asactor['jo9_focus_active']>0 and args[0]<0) or (j9asactor['jo9_focus_active']<0 and args[0]>0):
  j9asactor['jo9_focus_active']=0
  j9asactor['jo9_focus_xp_credit']=0
 end
 if $args[1]='grant' or $args[1]='edit':
  if args[0]*args[0]=1: j9asactor['jo9_focus_known']=1
  if args[0]*args[0]=4: j9asactor['jo9_work_ethic_known']=1 & j9asactor['passion_comfort_revealed']=2
  j9asactor['jo9_focus_active']=0
  j9asactor['jo9_focus_xp_credit']=0
  $j9asactor['jo9_focus_subject']=''
 end
},'j9asactor',$j9as_role),j9as_stage,$j9as_mode
result=1
! JO9 MOD END ACTIVITY_STAGES_20261112`);
// Delegate only the existing activity section. Keep load/reveal/discovery code.
const old=body('jo9_traits'),a=old.indexOf("if $args[0] = 'activity_load':"),b=old.indexOf("if $args[0] = 'activity_generate':"),load=old.slice(a,b);
section('jo9_traits',"if $args[0] = 'activity_value'",'! JO9 MOD END TRAIT_MERGER_ACTIVITY_20261025',`! JO9 MOD START ACTIVITY_STAGES_ROUTES_20261112
if $args[0]='activity_stage': result=func('jo9_activity_stage','stage',$args[1]) & exit
if $args[0]='activity_focus': result=func('jo9_activity_stage','focus',$args[1]) & exit
if $args[0]='activity_sign': result=func('jo9_activity_stage','sign',$args[1]) & exit
if $args[0]='activity_compatible': result=1 & exit
if $args[0]='activity_value':
 result=func('jo9_activity_stage','sign',$args[1])
 if $args[2]='passion_comfort': result=-result
 exit
end
if $args[0]='activity_known':
 result=0
 if dyneval('result='+$args[1]+"['jo9_work_ethic_known']")=1 or dyneval('result='+$args[1]+"['passion_comfort_revealed']")=2: result=1
 exit
end
if $args[0]='activity_repair': result=func('jo9_activity_stage','repair',$args[1]) & exit
if $args[0]='activity_generate':
 local j9as_generated=func('jo9_activity_stage','stage',$args[1])
 if j9as_generated=2 and func('jo9_traits','allow',$args[1],'jo9_work_ethic',1)=0:
  dynamic $replace({j9asactor['jo9_work_ethic']=0 & j9asactor['passion_comfort']=0},'j9asactor',$args[1])
 end
 result=func('jo9_activity_stage','repair',$args[1])
 exit
end
if $args[0]='activity_set': result=func('jo9_activity_stage','grant',$args[1],args[2]*2) & exit
if $args[0]='activity_remove': result=func('jo9_activity_stage','remove',$args[1],$args[2]) & exit
if $args[0]='activity_edit':
 local j9as_edit=args[3]*2
 if $args[2]='passion_comfort': j9as_edit=-j9as_edit
 result=func('jo9_activity_stage','edit',$args[1],j9as_edit)
 exit
end
${load}! JO9 MOD END ACTIVITY_STAGES_ROUTES_20261112
`);
edit('jo9_traits',"if $args[0] = 'edit' and ($args[2] = 'jo9_work_ethic' or $args[2] = 'passion_comfort'):",`! JO9 MOD START ACTIVITY_FOCUS_EDITOR_20261112
if $args[0]='edit' and $args[2]='jo9_focus':
 result=func('jo9_activity_stage','edit',$args[1],args[3])
 gs 'jo9_traits_value','refresh',$args[1]
 exit
end
! JO9 MOD END ACTIVITY_FOCUS_EDITOR_20261112
if $args[0] = 'edit' and ($args[2] = 'jo9_work_ethic' or $args[2] = 'passion_comfort'):`);
edit('jo9_traits',"if $args[0] = 'set_guarded':",`! JO9 MOD START ACTIVITY_GUARDED_SET_20261112
if $args[0]='set_guarded' and ($args[2]='jo9_focus' or $args[2]='jo9_work_ethic' or $args[2]='passion_comfort'):
 if args[3]=0:
  result=func('jo9_activity_stage','remove',$args[1],$args[2])
 else
  local j9as_set=args[3]
  if $args[2]='jo9_work_ethic': j9as_set*=2
  if $args[2]='passion_comfort': j9as_set*=-2
  result=func('jo9_activity_stage','grant',$args[1],j9as_set)
 end
 exit
end
! JO9 MOD END ACTIVITY_GUARDED_SET_20261112
if $args[0] = 'set_guarded':`);
// No extra random calls and no modifications to fixed-profile source values.
edit('jo9_traits'," local jo9x_previous = dyneval('result = ' + $args[1] + \"['\" + $args[2] + \"']\")",` ! JO9 MOD START ACTIVITY_GRANT_PRIORITY_20261112
 if $args[2]='jo9_focus' or $args[2]='jo9_work_ethic' or $args[2]='passion_comfort':
  local j9as_candidate=jo9x_candidate
  if $args[2]='passion_comfort': j9as_candidate=-j9as_candidate
  if j9as_candidate<0 and func('jo9_activity_stage','stage',$args[1])>0: result=0 & exit
 end
 ! JO9 MOD END ACTIVITY_GRANT_PRIORITY_20261112
 local jo9x_previous = dyneval('result = ' + $args[1] + "['" + $args[2] + "']")`);
edit('jo9_traits',"if $args[0] = 'list':", "if $args[0] = 'list':\r\n gs 'jo9_traits','activity_repair',$args[1]");
edit('jo9_traits_personality',"if $args[0] = 'activity' or $args[0] = 'praise': gs 'jo9_traits_personality', 'gradecheck', $args[1]",`! JO9 MOD START ACTIVITY_INHERITANCE_20261112
if $args[0]='activity': gs 'jo9_traits','activity_repair',$args[1]
! JO9 MOD END ACTIVITY_INHERITANCE_20261112
if $args[0] = 'activity' or $args[0] = 'praise': gs 'jo9_traits_personality', 'gradecheck', $args[1]`);
edit('jo9_traits_personality',"local j9av_work = func('jo9_traits', 'activity_value', 'jo9actor', 'jo9_work_ethic')",`local j9av_work = func('jo9_traits', 'activity_value', 'jo9actor', 'jo9_work_ethic')
 local j9as_focus=func('jo9_traits','activity_focus','jo9actor')`);
edit('jo9_traits_personality',"if jo9_trait_personality_amount = 0 and (jo9actor['jo9_focus'] = 1 or jo9actor['jo9_focus'] = -1):", "if jo9_trait_personality_amount = 0 and (j9as_focus = 1 or j9as_focus = -1):");
edit('jo9_traits_personality',"jo9actor['jo9_focus_active'] = jo9actor['jo9_focus']", "jo9actor['jo9_focus_active'] = j9as_focus");
edit('jo9_traits_personality',"   jo9actor['jo9_focus_known'] = 1\r\n   if jo9actor['jo9_focus'] = 1: jo9actor_rate['mood'] += 2",`   if j9av_work=0:
    jo9actor['jo9_focus_known'] = 1
   else
    jo9actor['jo9_work_ethic_known']=1
    jo9actor['passion_comfort_revealed']=2
   end
   if j9as_focus = 1: jo9actor_rate['mood'] += 2`);
const texts={
 activity_active:'[워커홀릭]<br>끈기의 상위 단계. 동일 업무·교육 반복 시 획득 경험치 +10%, 반복 기분 보정 +2. 업무·교육을 합쳐 하루 두 번째 활동부터 기분 보정 +2가 추가된다. 두 조건을 만족하면 각각 한 번 적용한다. 직접 휴식·마사지 보상은 절반이며, 성향 발견 후 푹 쉼 효과는 사라진다. 고정 규칙 업무에는 반복 보정을 적용하지 않는다. 다른 활동·집중 특성과 동시 보유하지 않는다.',
 activity_passive:'[무기력함]<br>산만함의 상위 단계. 동일 업무·교육 반복 시 획득 경험치와 업무 성과 -10%. 업무·교육을 합쳐 하루 두 번째 활동부터 기분 보정 -2. 직접 휴식·마사지 보상은 두 배다. 고정 규칙 업무에는 반복 보정을 적용하지 않는다. 다른 활동·집중 특성과 동시 보유하지 않는다.',
 persevering:'[끈기]<br>긍정 계열 1단계. 동일 업무·교육 반복 시 획득 경험치 +10%, 반복 기분 보정 +2. 내부 기분 보정이며 화면상 기분 등급 +2를 뜻하지 않는다. 고정 규칙 업무에는 반복 보정을 적용하지 않는다. 워커홀릭은 이 효과를 포함한다. 다른 활동·집중 특성과 동시 보유하지 않는다.',
 distracted:'[산만함]<br>부정 계열 1단계. 동일 업무·교육 반복 시 획득 경험치와 업무 성과 -10%. 고정 규칙 업무에는 반복 보정을 적용하지 않는다. 무기력함은 이 효과를 포함한다. 다른 활동·집중 특성과 동시 보유하지 않는다.'
};
for(const [key,value] of Object.entries(texts)){
 const line=body('jo9_traits').split('\r\n').find(x=>x.includes("if $args[1] = '"+key+"': $result = "));
 assert(line);edit('jo9_traits',line,"  if $args[1] = '"+key+"': $result = '"+value.replaceAll("'","''")+"'");
}
// Keep the broken-state free-time mood component; apply the approved reward multiplier separately.
edit('interaction_result',"\tif $slave_psy_status = 'broken':\r\n\t\tslave_rate['mood'] += free_time\r\n\telseif func('jo9_traits', 'activity_value', 'slave', 'passion_comfort') = 1:","\tif $slave_psy_status = 'broken':\r\n\t\tslave_rate['mood'] += free_time\r\n\tend\r\n\tif func('jo9_traits', 'activity_value', 'slave', 'passion_comfort') = 1:");
edit('interaction_result',"elseif func('jo9_traits', 'activity_value', 'slave', 'passion_comfort') = -1 and $slave_psy_status ! 'broken':", "elseif func('jo9_traits', 'activity_value', 'slave', 'passion_comfort') = -1:");
// The existing load handler already invokes activity_load; a normal newloc refreshes definitions.
// Normalize cached direct runtime callbacks through helper entrypoints without save-file rewriting.
const mod={id:'2026-11-12_activity_stages',description:'활동·집중 네 특성 단일 단계형 통합; 긍정 우선·같은 계열 상위 우선. 기존 저장 필드와 추첨 횟수 유지.',target:'game\\jack.qsp',before_sha256:doc.hash,add_locations:[{name:'jo9_activity_stage',desc:'',body:helper,actions:[]}],edits};
fs.writeFileSync(path.join(__dirname,'activity.mod.json'),JSON.stringify(mod,null,2));
fs.writeFileSync(path.join(__dirname,'texts.json'),JSON.stringify(texts,null,2));
// A diagnostic world is written only inside this records directory.
for(const e of edits){const l=doc.locations.find(l=>l.name===e.location),s=core.shift(doc.lines[l.body],5);assert.equal(s.split(e.old).length-1,e.count);doc.lines[l.body]=core.shift(s.split(e.old).join(e.new),-5);}
const loc=mod.add_locations[0];doc.lines.splice(-1,0,core.shift(loc.name,-5),core.shift('',-5),core.shift(loc.body,-5),core.shift('0',-5));doc.lines[3]=core.shift(String(doc.locations.length+1),-5);
const candidate=core.serialize(doc);assert(core.serialize(core.parse(candidate)).equals(candidate));
mod.after_sha256=core.hash(candidate);
fs.writeFileSync(path.join(__dirname,'activity.mod.json'),JSON.stringify(mod,null,2));
fs.writeFileSync(path.join(__dirname,'candidate.qsp'),candidate);
const cp=require('child_process'),external=[];
for(const file of ['tools/jo9-history-lab/dist/data/traits-live.json','tools/jo9-history-lab/dist/data/traits.json']){
 const source=cp.execFileSync('git',['--git-dir','G:/somi/JO9sa/.git','show','66178cf5:'+file],{encoding:'utf8',maxBuffer:1e8}),data=JSON.parse(source);
 function walk(x){if(Array.isArray(x)){for(const v of x)walk(v);}else if(x&&typeof x==='object'){const key=Object.keys(texts).find(k=>({activity_active:'워커홀릭',activity_passive:'무기력함',persevering:'끈기',distracted:'산만함'})[k]===x.name);if(key&&typeof x.description==='string'){external.push({path:file,id:x.id,name:x.name,old:x.description,new:texts[key].replace(/^\[[^\]]+\]<br>/,'').replaceAll('<br>','\n')});x.description=external.at(-1).new;}else for(const v of Object.values(x))walk(v);}}
 walk(data);fs.writeFileSync(path.join(__dirname,path.basename(file)),JSON.stringify(data,null,2));
}
fs.writeFileSync(path.join(__dirname,'editor-data-edits.json'),JSON.stringify(external,null,2));
assert.equal(core.hash(fs.readFileSync(base)),mod.before_sha256,'WORK unchanged');
console.log(JSON.stringify({edits:edits.length,addLocations:1,before:mod.before_sha256,after:core.hash(candidate),externalDescriptions:external.length,workUnchanged:true}));
