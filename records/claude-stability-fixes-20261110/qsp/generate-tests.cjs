'use strict';
// Save-free probes execute exact candidate locations with synthetic state in the native engine.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../..'),core=require(path.join(root,'tools/text-workshop/core.cjs'));
const input=path.resolve(process.argv[2]||path.join(root,'assets/runtime/2.4.1/jack.qsp'));
const output=path.resolve(process.argv[3]||'G:/Codex/tmp/claude-fix-tests-20261110/qsp');
const parsed=core.parse(fs.readFileSync(input));
const body=name=>core.shift(parsed.lines[parsed.locations.find(l=>l.name===name).body],5),nl=s=>s.replace(/\r?\n/g,'\r\n');
const setup=`CONST_INT['slave_exist']=1
CONST_INT['no_slave']=0
CONST_INT['loli_age']=0
kitchen=1
master_str=3
house_mess=4
$get_fridge_space='fridge_space=1000000'
$get_lab_space='lab_space=1000000'
for qa_n=1 to 4 step 1:
 dynamic "room<<qa_n>>_state=1"
 dynamic "room<<qa_n>>['age']=1"
 dynamic "room<<qa_n>>['energy']=3"
 dynamic "room<<qa_n>>['cook']=4"
 dynamic "room<<qa_n>>['secretary']=4"
 dynamic "room<<qa_n>>['service']=4"
 dynamic "room<<qa_n>>['stamina']=4"
 dynamic "room<<qa_n>>['gladiatrix']=4"
 dynamic "room<<qa_n>>['petting']=4"
 dynamic "room<<qa_n>>['oral']=4"
 dynamic "room<<qa_n>>['penetration']=4"
 dynamic "room<<qa_n>>['virginity']=3"
 dynamic "room<<qa_n>>['mood']=3"
 dynamic "$room<<qa_n>>['armor']='комбез'"
 dynamic "$room<<qa_n>>['right_wpn']='стилет'"
end`;
const sound=body('jo9_duty_text').split('\r\n').filter(x=>/jo9_rd_snd/.test(x)).join('\r\n');
const instrumentedSound=sound.replace("play 'content/snd/'+$jo9_rd_snd+'.mp3', sound_volume","qa_plays+=1 & $qa_path='content/snd/'+$jo9_rd_snd+'.mp3'");
const cases=[];function add(name,start,names=[],extra={}){cases.push({name,start:nl(start).replace(/: msg ('FAIL[^']*')/g,': qa_failed=1 & msg $1 & exit'),names,extra});}
add('sound-report',`${setup}
sound_on=0
for qa_t=0 to 4 step 1:
 room1['duty_tier']=qa_t
 gs 'jo9_duty_text','report',1,4
 if $text='': msg 'FAIL text'
end`,['jo9_duty_text']);
add('sound-route',`for qa_m=0 to 1 step 1:
 sound_on=qa_m
 for qa_case=0 to 5 step 1:
  jo9_rd_rep=4 & jo9_rd_tier=1 & jo9_rd_kind=0 & jo9_rd_wd=0
  $qa_expected=''
  if qa_case=1: jo9_rd_tier=0 & $qa_expected='bad_secen'
  if qa_case=2: jo9_rd_tier=4 & $qa_expected='great-success'
  if qa_case=3: jo9_rd_rep=8 & jo9_rd_tier=4 & jo9_rd_wd=1 & $qa_expected='bad_secen'
  if qa_case=4: jo9_rd_rep=8 & jo9_rd_tier=4 & jo9_rd_kind=2 & $qa_expected='bad_secen'
  if qa_case=5: jo9_rd_rep=6 & jo9_rd_tier=0 & $qa_expected='bad_secen'
  qa_plays=0 & $qa_path=''
${instrumentedSound}
  if qa_m=0 and qa_plays!0: msg 'FAIL muted'
  if qa_m=1 and $qa_expected='' and qa_plays!0: msg 'FAIL normal'
  if qa_m=1 and $qa_expected!'' and (qa_plays!1 or $qa_path!'content/snd/'+$qa_expected+'.mp3'): msg 'FAIL route'
 end
end`);
add('duty-set',`${setup}
for qa_n=1 to 4 step 1:
 for qa_d=2 to 4 step 1:
  for qa_old=0 to 4 step 1:
   dynamic "room<<qa_n>>['duty']=<<qa_old>>"
   dynamic "room<<qa_n>>['duty_rules']=0"
   dynamic "room<<qa_n>>['cooks_rule']=1"
   dynamic "room<<qa_n>>['cleans_rule']=1"
   gs 'jo9_room_duty','set',qa_n,qa_d
   if dyneval('result=room'+str(qa_n)+'["duty"]')!qa_d: msg 'FAIL assignment'
   if dyneval('result=room'+str(qa_n)+'["cooks_rule"]')!0 or dyneval('result=room'+str(qa_n)+'["cleans_rule"]')!0 or dyneval('result=room'+str(qa_n)+'["duty_rules"]')!0: msg 'FAIL external flags'
  end
 end
end`,['jo9_room_duty']);
add('duty-legacy',`${setup}
for qa_d=2 to 4 step 1:
 for qa_n=1 to 4 step 1:
  dynamic "room<<qa_n>>['duty']=<<qa_d>>"
  dynamic "room<<qa_n>>['cooks_rule']=1"
  dynamic "room<<qa_n>>['cleans_rule']=1"
 end
 if func('jo9_household_worker','cook')!'': msg 'FAIL legacy cook'
 if func('jo9_household_worker','clean')!'': msg 'FAIL legacy clean'
end`,['jo9_room_duty','jo9_household_worker']);
add('duty-energy',`${setup}
room1['cooks_rule']=1
room1['cleans_rule']=1
gs 'jo9_room_duty','set',1,4
gs 'jo9_room_duty','daily'
$qa_cook=func('jo9_household_worker','cook')
$qa_clean=func('jo9_household_worker','clean')
if $qa_cook='room1': room1['energy']-=1
if $qa_clean='room1': room1['energy']-=1
gs 'jo9_room_duty','post'
if room1['energy']!0: msg 'FAIL energy <<room1["energy"]>>'
if $qa_cook='room1' or $qa_clean='room1': msg 'FAIL external selected'`,['jo9_room_duty','jo9_household_worker']);
add('duty-priority',`${setup}
room1['duty']=2
room1['cooks_rule']=1
room2['cooks_rule']=1
room2['cleans_rule']=1
room2['cook']=5
if func('jo9_household_worker','cook')!'room2': msg 'FAIL fallback cook'
if func('jo9_household_worker','clean')!'room2': msg 'FAIL fallback clean'
slave_state=1 & slave['cooks_rule']=1 & slave['energy']=3 & slave['obedience']=5
if func('jo9_household_worker','cook')!'slave': msg 'FAIL slave priority'
slave_state=0
assistant_state=1 & assistant['cooks_rule']=1 & assistant['energy']=3
if func('jo9_household_worker','cook')!'assistant': msg 'FAIL assistant priority'
gs 'jo9_room_duty','set',2,1
gs 'jo9_room_duty','daily'
if func('jo9_household_worker','cook')!'room2': msg 'FAIL chores priority'
if room2['cooks_rule']!1 or room2['cleans_rule']!1: msg 'FAIL internal flags'
room1['blowjob_rule']=1
if func('jo9_household_worker','wake')!'room1': msg 'FAIL wake unchanged'`,['jo9_room_duty','jo9_household_worker']);
for(const mode of [0,2]) add('refund-'+(mode===2?'hard':'normal'),`CONST_INT['no_slave']=0
CONST_INT['slave_exist']=1
CONST_INT['slave_faint']=2
difficulty_setting=${mode}
$estate='slum_house'
jo9_lq['active']=1
for qa_n=1 to 4 step 1:
 kulaconstruct=qa_n
 gs 'jo9_liquidation_assets','quote'
 qa_base=iif(qa_n=2,400,iif(qa_n=4,2000,1000))
 qa_expected=qa_base*${mode===2?'150':'100'}/100
 if jo9_lq_value['room'+str(qa_n)]!qa_expected: msg 'FAIL individual quote'
 gs 'jo9_liquidation_assets','sell','room'+str(qa_n)
 if jo9_lq_paid!qa_expected or jo9_lq_sold!1: msg 'FAIL individual sale'
 qa_total+=qa_expected
end
if sparks!qa_total: msg 'FAIL total paid'
kulaconstruct=4
gs 'jo9_liquidation_assets','quote_move'
if jo9_lq_value['relocation_rooms']!${mode===2?6600:4400}: msg 'FAIL relocation quote'
sparks=0
gs 'jo9_liquidation_assets','move_slums'
if sparks!${mode===2?6600:4400} or jo9_lq_paid!${mode===2?6600:4400} or kulaconstruct!0: msg 'FAIL relocation payment'
kulaconstruct=4
jo9_room_tier[1]=1 & jo9_room_tier[2]=2 & jo9_room_tier[3]=3 & jo9_room_tier[4]=3
gs 'jo9_liquidation_assets','quote'
if jo9_lq_value['decor_roomtier']!${mode===2?10125:6750}: msg 'FAIL interior multiplier'`,['jo9_liquidation_assets'],{new_estate:''});
fs.mkdirSync(output,{recursive:true});const plan=[];
for(const t of cases){
 const marker='JO9_QA_STABILITY_'+t.name.replace(/-/g,'_')+'_COMPLETE';
 const locations=[{name:'Start',body:t.start+`\r\nif qa_failed=0: msg '${marker}'\r\nexit`},...t.names.map(name=>({name,body:body(name)})),...Object.entries(t.extra).map(([name,body])=>({name,body}))];
 const lines=['QSPGAME','synthetic stability probe','',core.shift(String(locations.length),-5)];
 for(const l of locations)lines.push(core.shift(l.name,-5),'',core.shift(nl(l.body),-5),core.shift('0',-5));lines.push('');
 const raw=Buffer.from(lines.join('\r\n'),'utf16le');assert.equal(core.parse(raw).locations.length,locations.length);
 const file=path.join(output,t.name+'.qsp');fs.writeFileSync(file,raw);plan.push({name:t.name,file,marker,checkpoint:t.name});
}
fs.writeFileSync(path.join(output,'plan.json'),JSON.stringify(plan,null,2)+'\n');
fs.writeFileSync(path.join(output,'source.json'),JSON.stringify({input,sha256:parsed.hash,cases:cases.map(t=>t.name)},null,2)+'\n');
console.log(JSON.stringify({output,sha256:parsed.hash,cases:cases.length}));
