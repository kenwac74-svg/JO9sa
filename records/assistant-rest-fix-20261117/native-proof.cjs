'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),patch=JSON.parse(fs.readFileSync(path.join(__dirname,'patch.json'),'utf8'));
assert.equal(d.hash,patch.before_sha256);const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
let result=body('interaction_result');for(const e of patch.edits){assert.equal(result.split(e.old).length-1,1);result=result.replace(e.old,e.new);}
const helper=body('#dynamic'),variable=n=>helper.slice(helper.indexOf('$'+n+' = {'),helper.indexOf('\r\n}',helper.indexOf('$'+n+' = {'))+3);
const runner=`qa_case+=1
if qa_case>11:
 msg 'JO9_ASSISTANT_REST_FINAL pass='+str(qa_pass)+';fail='+$qa_fail+';cases=11;version='+$qspver+';candidate=${patch.after_sha256}'
 exit
end
killvar 'slave'
killvar 'assistant'
killvar 'slave_rate'
killvar 'assistant_rate'
killvar 'interaction_slave'
killvar 'interaction_assistant'
killvar 'assistant_already_done_today'
killvar 'slave_already_done_today'
killvar 'first_visit'
${variable('assistant_energy_drop')}
${variable('master_energy_drop')}
CONST_INT['slave_exist']=1
CONST_INT['no_slave']=0
slave_state=1
assistant_state=1
slave_type=2583
assistant_type=1214
master_energy=5
master_half_action=0
sparks=1000
cheat_inf_en=iif(qa_case>=4 and qa_case<=6,1,0)
qa_refuse=iif(qa_case>=7 and qa_case<=9,1,0)
qa_special_calls=0
$do_for_each_slave_in_list='qa_noop=0'
$dyn_reward_potence='qa_noop=0'
$dyn_erotic_stimulation='qa_noop=0'
$slave_energy_drop={if cheat_inf_en=0: slave['energy']-=1}
slave['energy']=5
slave['sensitivity']=2
assistant['energy']=5
assistant['sensitivity']=2
assistant['ego']=3
assistant['temper']=3
assistant['pride']=3
assistant['moral']=2
assistant['rational']=3
assistant['instinct']=3
assistant['custom']=3
assistant['fear']=2
assistant['angst']=2
assistant['spoil']=2
assistant['arousal']=3
assistant['hygiene']=40
assistant_rate['hygiene']=40
if qa_case=10:
 assistant['jo9_bg_random']=1
 $assistant_family='mprincess'
 assistant['jo9_origin_frac_sensitivity']=80
end
interaction=iif(qa_case<=9,5605+(qa_case-1) mod 3,iif(qa_case=10,5605,1526))
qa_cost=iif(interaction=5606,1,2)
qa_money=iif(interaction=5606,2,iif(interaction=5607,5,0))
gt 'interaction'`;
const checkpoint=`if qa_case=11:
 gs 'qa_assert','slave_control',qa_special_calls=1 and slave_rate['sensitivity']=1 and assistant_rate['sensitivity']=0
else
 gs 'qa_assert','effect_once',qa_special_calls=iif(qa_refuse=1,0,1)
 gs 'qa_assert','sensitivity',assistant_rate['sensitivity']=iif(qa_refuse=1,0,iif(qa_case=10,3,2))
 gs 'qa_assert','master_AP',master_energy=5 and master_half_action=0
 gs 'qa_assert','assistant_AP',assistant['energy']=iif(qa_refuse=1 or cheat_inf_en=1,5,5-qa_cost)
 gs 'qa_assert','completion',assistant_already_done_today[str(interaction)]=1
 gs 'qa_assert','no_double_AP',assistant['half_action']=0
 gs 'qa_assert','free_time_cleared',free_time=0
 gs 'qa_assert','money',sparks=1000-qa_money
 if qa_refuse=1:
  gs 'qa_assert','refusal_hygiene',assistant_rate['hygiene']=40
 else
  gs 'qa_assert','hygiene',assistant_rate['hygiene']=iif(interaction=5606,0,iif(interaction=5605,50,43))
  gs 'qa_assert','ego',assistant_rate['ego']=iif(interaction=5606,1,2)
  gs 'qa_assert','moral',assistant_rate['moral']=iif(interaction=5606,1,2)
 end
end
gt 'qa_runner'`;
const bodies=new Map([['Start',"qa_case=0\nqa_pass=0\n$qa_fail=''\ngt 'qa_runner'"],['qa_runner',runner],['qa_assert',"if args[1]=0: $qa_fail+=str(qa_case)+':'+$args[0]+'|'\nif args[1]!0: qa_pass+=1"],['interaction',body('interaction')],['interaction_result',"if qa_refuse=1: interaction_assistant['res']=-1\r\n$special_part += '\r\nqa_special_calls+=1'\r\n"+result],['jo9_origin_growth',body('jo9_origin_growth')],...['#var_base','#txt','#txt_2','jo9_traits','jo9_traits_personality'].map(n=>[n,'result=0']),['interaction_screen',checkpoint],['menu_form',"msg 'JO9_ASSISTANT_REST_FINAL UNEXPECTED_MENU'"]]);
const lines=['QSPGAME','','',c.shift(String(bodies.size),-5)];for(const[n,b]of bodies)lines.push(c.shift(n,-5),'',c.shift(b.replace(/\r?\n/g,'\r\n'),-5),c.shift('0',-5));lines.push('');const buf=Buffer.from(lines.join('\r\n'),'utf16le');c.parse(buf);
const out='G:/Codex/tmp/assistant-rest-fix-20261117';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'probe.qsp'),buf,{flag:'wx'});fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n',{flag:'wx'});console.log(JSON.stringify({fixture:out+'/probe.qsp',bytes:buf.length}));
