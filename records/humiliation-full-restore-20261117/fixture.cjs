'use strict';
const {fs,assert,core,H,GAME,body,source,assignments,block,encode,apply}=require('./common.cjs');
function fixture({includeRoutes=true}={}){
const raw=fs.readFileSync(GAME+'/jack.qsp'),patch=JSON.parse(fs.readFileSync(H+'/patch.json','utf8')),candidate=core.hash(raw)===patch.after_sha256?raw:apply(raw,patch),d=core.parse(candidate),orig=block(body(source(),'#var_base'));
const originalFor=condition=>assignments(orig.slice(orig.indexOf(condition)))[0].rhs;
const defaults=`killvar 'slave'
killvar 'assistant'
killvar 'slave_rate'
killvar 'assistant_rate'
killvar 'interaction_slave'
killvar 'interaction_assistant'
killvar 'code_defined'
killvar '$hum_text1'
killvar '$hum_text2'
killvar '$hum_text3'
killvar '$hum_text4'
killvar '$text'
CONST_INT['young_age']=0
CONST_INT['loli_age']=1
CONST_INT['milf_age']=2
CONST_INT['slave_exist']=1
slave_state=1
assistant_state=1
slave_type=2583
assistant_type=1214
$slave_name='SLAVE_MARKER'
$assistant_name='ASSISTANT_MARKER'
$slave_psy_status='calm'
$assistant_psy_status='calm'
slave['age']=0
assistant['age']=0
slave['boobs']=3
assistant['boobs']=3
slave['beauty']=4
assistant['beauty']=4
slave['fat']=2
assistant['fat']=2
slave['intellect']=3
assistant['intellect']=3
slave['oral']=3
assistant['oral']=3
slave['penetration']=1
assistant['penetration']=1
slave['ego']=2
assistant['ego']=2
slave['cook']=2
assistant['cook']=2
slave['obedience']=1
assistant['obedience']=1
slave['energy']=5
assistant['energy']=5
sparks=1000
master_energy=5
hero_choice=1
$slave_noun1[0]='SHARED_NOUN'
$slave_noun3[0]='SHARED_NOUN'
$slave_noun4[0]='SHARED_NOUN'
$slave_noun8[0]='SHARED_NOUN'
$master_assistant_interaction_types[0]='self_sex_lesson_assistant'
$master_slave_interaction_types[0]='self_sex_lesson'
$do_for_each_slave_in_list='qa_noop=0'
$dyn_reward_potence='qa_noop=0'
$dyn_erotic_stimulation='qa_noop=0'
qa_reached=0`;
const cases=[];
function add(name,setup,action,checks){cases.push({name,setup,action,checks});}
add('fallback index', '',"gs 'jo9_humiliation_pool', 'slave'",['hum_cnt=1 and hum_num=1 and flaw_num=1',"$jo9_hum_code=''",'slave["boobs"]=3 and assistant["boobs"]=3']);
add('mature branch uses actor only',"slave['age']=2\nassistant['age']=0","gs 'jo9_humiliation_pool', 'slave'",['hum_cnt=1',`$hum_text1[1]=${originalFor("if slave['age'] = CONST_INT['milf_age']:")}`]);
add('assistant body branch',"assistant['boobs']=1\nslave['boobs']=5","gs 'jo9_humiliation_pool', 'assistant'",['hum_cnt=1',`$hum_text1[1]=${originalFor("if slave['boobs'] = 1:").replaceAll('$slave_name','$assistant_name')}`,"slave['boobs']=5 and assistant['boobs']=1"]);
add('empty chest fallback',"slave['boobs']=0","gs 'jo9_humiliation_pool', 'slave'",['hum_cnt=1 and flaw_num=1',`$hum_text1[1]=${originalFor("if slave['boobs'] = 0 and slave['age'] ! CONST_INT['loli_age']:")}`]);
for(const psy of ['arrogant','hateful','lachrymose','hysteric']){
add('mental '+psy,`$slave_psy_status='${psy}'`,"gs 'jo9_humiliation_pool', 'slave'",['hum_cnt=1',`$hum_text1[1]=${originalFor(`if $slave_psy_status = '${psy}'`)}`]);
}
add('mental priority remains below physical candidate',"$slave_psy_status='hateful'\nslave['age']=2","gs 'jo9_humiliation_pool', 'slave'",['hum_cnt=1',`$hum_text1[1]=${originalFor("if slave['age'] = CONST_INT['milf_age']:")}`]);
for(const mode of [0,1])add('description preserves subexpression mode '+mode,`DISABLESUBEX=${mode}`,"gs 'jo9_humiliation_description'",[`DISABLESUBEX=${mode}`]);
for(const trait of ['perversion','homosexualism'])for(const state of [0,1,2,3])for(const value of [-1,0,1]){
add(`${trait} state${state} value${value}`,`slave['${trait}_revealed']=${state}\nslave['${trait}']=${value}`,"gs 'jo9_humiliation_pool', 'slave'",[`hum_cnt=${[1,2].includes(state)&&value!==0?2:1}`]);
}
const refresh=body(d,'#var_base').match(/! JO9 MOD START HUMILIATION_POOL_CALL_20261117[\s\S]*?! JO9 MOD END HUMILIATION_POOL_CALL_20261117/)[0];
const female=body(d,'#txt_2_woman').split('\r\n').filter(s=>/^\$disgrace_lesson_description\[[0-5]\]/.test(s)).join('\r\n');
const resultBody=body(d,'interaction_result'),loop=resultBody.slice(resultBody.indexOf('i = 1\r\n:jo9_trait_personality_text_loop_1'),resultBody.indexOf('! JO9 MOD END J9TP_NATIVE_TEXT_LOOP_1'));
if(includeRoutes)for(const hero of [1,101])for(const [id,actor,other]of [[1375,'slave','assistant'],[7034,'assistant','slave']])for(let stage=0;stage<=5;stage++){
const expected=originalFor("if slave['age'] = CONST_INT['milf_age']:").replaceAll('$slave_name',`$${actor}_name`);
const descRhs=body(d,'jo9_humiliation_description').split('\r\n').find(s=>s.startsWith(`$disgrace_lesson_description[${stage}]`)).split(' = ')[1];
const setup=`DISABLESUBEX=1\n$qa_expected_description=${descRhs}\nDISABLESUBEX=0\nhero_choice=${hero}\ninteraction=${id}\n${actor}['age']=2\n${other}['age']=0\n${actor}['sub_humiliation']=${stage}`;
add(`route hero${hero} actor${actor} stage${stage}`,setup,`gs 'interaction'\ngs 'qa_render', '${actor}'`,[
'qa_reached=1',"$interaction_type='self_sex_lesson"+(actor==='assistant'?'_assistant':'')+"'",'$hum_text1[1]='+expected,
`$disgrace_lesson_description[${stage}]=$qa_expected_description`,
"instr($text[1], $mid('<x<',1,1)+$mid('<x<',3,1))=0",`instr($text[1], '${actor==='slave'?'ASSISTANT':'SLAVE'}_MARKER')=0`,
`instr($text[1], '${actor==='slave'?'SLAVE':'ASSISTANT'}_MARKER')>0`,
`${actor}['age']=2 and ${other}['age']=0`
]);
}
const cachedDeclaration=body(d,'interaction').match(/\t\$interaction_lesson_humiliation = \{[\s\S]*?\r\n\t\}/)[0];
add('saved cached humiliation helper',cachedDeclaration+"\ninteraction=7034\nassistant['boobs']=1\nassistant['sub_humiliation']=1\ncode_defined['interaction_lesson_humiliation']=1", "gs 'interaction'",['qa_reached=1',`$hum_text1[1]=${originalFor("if slave['boobs'] = 1:").replaceAll('$slave_name','$assistant_name')}`]);
const bodies=new Map([['Start',"qa_pass=0\nqa_total=0\n$qa_fail=''\ngt 'qa_case1'"],['qa_assert',"qa_total+=1\nif args[1]!0: qa_pass+=1\nif args[1]=0: $qa_fail+=$args[0]+'|'"],['qa_finish',"msg 'JO9_HUM_FINAL pass='+str(qa_pass)+';total='+str(qa_total)+';fail='+$qa_fail"],['interaction',body(d,'interaction')],['#var_base',refresh],['#txt','exit'],['#txt_2',`if hero_choice>100:\nDISABLESUBEX=1\n${female}\nDISABLESUBEX=0\nend`],['interaction_result','qa_reached+=1\ndynamic $qa_resume'],['interaction_screen','exit'],['menu_form',"$qa_fail+='UNEXPECTED_MENU|'"],['qa_render',"dynamic $special_part\nlocal $qa_loop\n$qa_loop={\n"+loop+"\n}\ndynamic $replace($qa_loop,'dynslave',$args[0])"],['display_pic',"$result=''"],['jo9_origin_growth','result=args[3]'],['jo9_traits','exit'],['jo9_traits_personality','exit'],...patch.add_locations.map(l=>[l.name,l.body])]);
cases.forEach((x,i)=>{const next=i===cases.length-1?'qa_finish':'qa_case'+(i+2),checks=x.checks.map((s,j)=>`gs 'qa_assert', '${i+1}.${j+1}', (${s})`).join('\n')+`\ngt '${next}'`,interaction=x.action.startsWith("gs 'interaction'"),act=interaction?x.action.slice("gs 'interaction'".length).trim():'';const code=`! CASE ${i+1} ${x.name}\n${defaults}\n${x.setup}\n`+(interaction?`$qa_resume={\n${act}\n${checks}\n}\ngs 'interaction'`:`${x.action}\n${checks}`);bodies.set('qa_case'+(i+1),code);});
return {bodies,bytes:encode(bodies),cases:cases.length,assertions:cases.reduce((s,x)=>s+x.checks.length,0),candidateSha256:patch.after_sha256,workSha256:core.hash(raw)};
}
module.exports={fixture};
