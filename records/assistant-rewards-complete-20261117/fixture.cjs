'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname;
function fixture(candidate=true){
 const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),d=c.parse(raw),p=JSON.parse(fs.readFileSync(H+'/patch.json','utf8'));a.equal(d.hash,p.before_sha256);
 const body=n=>{let b=c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);if(candidate)for(const e of p.edits.filter(e=>e.location===n)){a.equal(b.split(e.old).length-1,1);b=b.replace(e.old,e.new);}return b;};
 const h=body('#dynamic'),variable=n=>{const i=h.indexOf('$'+n+' = {'),j=h.indexOf('\r\n}',i);a(i>=0&&j>i);return h.slice(i,j+3);};
 const tests=[];function add(name,id,setup,checks){tests.push({name,id,setup:setup||'',checks});}
 add('compliment first',5601,'',[["assistant_rate['mood']=12",'mood'],["assistant_rate['spoil']=12",'spoil'],["assistant['pos_praise']=2",'praise'],["master_energy=5 and assistant['energy']=3",'free_AP']]);
 add('compliment repeated',5601,"assistant_already_done_today['5601']=1\nassistant_already_done_total['5601']=1",[["assistant_rate['mood']=0",'no_repeat_mood'],["assistant_rate['rational']=-1",'repeat_rational'],["assistant_rate['spoil']=1",'repeat_spoil'],["master_energy=5 and assistant['energy']=3",'free_AP']]);
 add('compliment merit',5601,"assistant['virtue']=2",[["assistant_rate['rational']=2",'merit'],["assistant_rate['spoil']=0",'no_spoil'],["assistant['virtue']=0",'clear_merit']]);
 for(const [id,mood,rank,money]of [[5602,31,4,2],[5603,42,4,4],[5604,47,5,8]])add('date '+id,id,'',[[`assistant_rate['mood']=${mood}`,'mood'],[`assistant['pos_slave_date']=${rank}`,'date_mood'],[`sparks=${1000-money}`,'cost_once'],["assistant_rate['temper']=1 and assistant_rate['moral']=2",'direct_once'],["assistant['total_rewards']=1 and assistant['promise_reward']=0 and assistant['virtue']=0",'reward_bookkeeping'],["master_energy=4 and assistant['energy']=2",'AP_once'],["slave_rate['mood']=0 and slave['total_rewards']=0",'actor_isolation']]);
 add('massage first',5608,'',[["assistant['energy']=4 and master_energy=4",'recovery'],["assistant['massaged']=1",'daily_flag'],["assistant_rate['mood']=12 and assistant['pos_gentle']=6",'reward'],["interaction_assistant['final_stimulation']=18",'stimulation'],["assistant_rate['arousal']>8",'arousal_helper'],["assistant_rate['sensitivity']=2 and assistant_rate['moral']=2 and master_petting_rate=2",'direct_once'],["master_hygiene_rate=5 and assistant_rate['hygiene']=45 and house_mess_rate=10",'hygiene_once']]);
 add('massage already recovered',5608,"assistant['massaged']=1",[["assistant['energy']=3 and master_energy=4",'no_second_recovery'],["assistant_rate['mood']=12",'reward']]);
 add('massage low skill',5608,'master_petting=2',[["assistant['energy']=3 and master_energy=4",'no_unearned_recovery'],["assistant['massaged']=0",'flag_unchanged']]);
 add('massage full AP',5608,"assistant['energy']=5",[["assistant['energy']=5 and master_energy=4",'cap']]);
 add('cunnilingus',5609,'',[["qa_orgasm=1",'orgasm_helper'],["interaction_assistant['final_stimulation']=66",'stimulation'],["assistant_rate['mood']=16 and assistant['pos_gentle']=8",'reward'],["assistant_rate['moral']=1 and master_oral_rate=2",'direct_once'],["master_energy=4 and assistant['energy']=3",'passive_AP'],["master_hygiene_rate=10 and assistant_rate['hygiene']=42 and house_mess_rate=10",'hygiene_once']]);
 add('cunnilingus no stimulus',5609,"master_oral=0\nassistant['arousal']=0",[["qa_orgasm=0 and assistant_rate['mood']=0 and assistant['pos_gentle']=0",'no_false_reward']]);
 for(const id of [5601,5602,5608,5609])add('refusal '+id,id,'qa_refuse=1',[["assistant_rate['mood']=0 and assistant['pos_gentle']=0",'no_common_reward'],["master_energy=5",'master_AP']]);
 add('infinite AP',5609,'cheat_inf_en=1',[["master_energy=5 and assistant['energy']=3",'cheat_AP'],["assistant_rate['mood']=16",'effect_remains']]);
 for(const [id,cost]of [[5605,2],[5606,1],[5607,2]])add('rest regression '+id,id,'',[["assistant_rate['sensitivity']=2",'existing_effect'],[`master_energy=5 and assistant['energy']=${3-cost}`,'existing_AP']]);
 add('ordinary compliment unchanged',1563,'',[["slave_rate['mood']>0 and assistant_rate['mood']=0",'ordinary_actor']]);
 const reset=`killvar 'slave'
killvar 'assistant'
killvar 'slave_rate'
killvar 'assistant_rate'
killvar 'interaction_slave'
killvar 'interaction_assistant'
killvar 'assistant_already_done_today'
killvar 'assistant_already_done_total'
killvar 'slave_already_done_today'
killvar 'slave_already_done_total'
killvar 'already_done_today'
killvar 'first_visit'
killvar 'code_defined'
${['assistant_energy_drop','master_energy_drop','dyn_reward_potence','dyn_erotic_stimulation'].map(variable).join('\n')}
$dyn_slave_orgasm={qa_orgasm+=1\norgasm_description=0}
qa_orgasm=0
qa_refuse=0
CONST_INT['slave_exist']=1
CONST_INT['no_slave']=0
slave_state=1
assistant_state=1
slave_type=2583
assistant_type=1214
master_energy=5
master_half_action=0
sparks=1000
cheat_inf_en=0
master_cha=3
master_str=3
master_domination=3
master_style=3
master_supermacy=3
master_petting=3
master_petting_rate=0
master_oral=3
master_oral_rate=0
master_hygiene_rate=0
house_mess_rate=0
$assistant_psy_status='calm'
$slave_psy_status='calm'
$do_for_each_slave_in_list='qa_noop=0'
$slave_energy_drop={if cheat_inf_en=0: slave['energy']-=1}
slave['energy']=5
slave['sensitivity']=2
slave['moral']=2
slave['intellect']=3
assistant['energy']=3
assistant['sensitivity']=2
assistant['ego']=3
assistant['temper']=3
assistant['pride']=3
assistant['moral']=2
assistant['rational']=3
assistant['instinct']=3
assistant['custom']=3
assistant['obedience']=2
assistant['intellect']=3
assistant['stamina']=3
assistant['fear']=2
assistant['angst']=2
assistant['spoil']=2
assistant['arousal']=3
assistant['hygiene']=40
assistant_rate['hygiene']=40
assistant['promise_reward']=1
`;
 const runner=`qa_case+=1
if qa_case>${tests.length}:
 msg 'JO9_REWARD_FINAL pass='+str(qa_pass)+';total='+str(qa_total)+';fail='+$qa_fail+';version='+$qspver
 exit
end
${reset}
${tests.map((t,i)=>`if qa_case=${i+1}:\n${t.setup}\ninteraction=${t.id}\nend`).join('\n')}
gt 'interaction'`;
 const checkpoint=tests.map((t,i)=>`if qa_case=${i+1}:\n${t.checks.map(([expr,name])=>`gs 'qa_assert', '${name}', (${expr})`).join('\n')}\nend`).join('\n')+"\ngt 'qa_runner'";
 const bodies=new Map([['Start','exit'],['qa_begin',"qa_case=0\nqa_pass=0\nqa_total=0\n$qa_fail=''\ngt 'qa_runner'"],['qa_runner',runner],['qa_assert',"qa_total+=1\nif args[1]=0: $qa_fail+=str(qa_case)+':'+$args[0]+'|'\nif args[1]!0: qa_pass+=1"],['interaction',body('interaction')],['interaction_result',"if qa_refuse=1: interaction_assistant['res']=-1\r\n"+body('interaction_result')],['jo9_origin_growth',body('jo9_origin_growth')],['jo9_nymph_arousal',body('jo9_nymph_arousal')],...['#var_base','#txt','#txt_2','jo9_traits','jo9_traits_personality'].map(n=>[n,'result=0']),['interaction_screen',checkpoint],['menu_form',"msg 'JO9_REWARD_UNEXPECTED_MENU'"]]);
 const lines=['QSPGAME','','',c.shift(String(bodies.size),-5)];for(const[n,b]of bodies)lines.push(c.shift(n,-5),'',c.shift(b.replace(/\r?\n/g,'\r\n'),-5),c.shift('0',-5));lines.push('');
 return {bytes:Buffer.from(lines.join('\r\n'),'utf16le'),workSha256:d.hash,candidateSha256:candidate?p.after_sha256:d.hash,tests,assertions:tests.reduce((n,t)=>n+t.checks.length,0)};
}
module.exports={fixture};
