'use strict';
// Isolated native regression tests. Product QSPs and personal saves are read only.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const task='G:/Codex/tmp/chunhyang-random-finish-20261113';
const rec=repo+'/records/chunhyang-random-finish-20261113';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const phase=process.argv[2]||'prepare',variant=process.argv[3]||'red';
assert(['red','candidate','installed'].includes(variant));
const source=variant==='candidate'?task+'/candidate.qsp':game+'/jack.qsp';
const out=task+'/native/'+variant;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const body=(d,name)=>c.shift(d.lines[d.locations.find(l=>l.name===name).body],5);
const put=(d,name,text)=>{const l=d.locations.find(l=>l.name===name);assert(l,name);d.lines[l.body]=c.shift(text.replace(/\r?\n/g,'\r\n'),-5);};
const check=(expr,label)=>`if (${expr}) = 0: savegame 'failure.sav' & msg 'FAIL_CHUNRANDOM_${label}' & exit\nqa_checks += 1\n`;
const boot=`killall
autosave=0
decadesave=0
sound_on=0
$onnewloc=''
$ongload=''
$ongsave=''
$counter=''
settimer 0
snk_room_target=0
combatant=0
$враг[1]='chunhyang'
количество_врагов=1
враг[1]=1
текущий=1
egeya_lose=1
jo9_chunhyang['open']=1
jo9_chun_requested=1
sparks=250000
jo9_cruel_mercy=5
jo9_cruel_mercy_half=1
difficulty_setting=1
cheat_fight_dif=1
$итог_боя=''
`;
const buffs=['бешенство','разгон','меткость','адреналин','верткость','внимание'];
const finish=name=>`savegame '${name}.sav'\nmsg 'JO9_QA_CHUNRANDOM_${name.replaceAll('-','_')}_COMPLETE'\nexit\n`;
function lowinit(){
 let code=boot+'qa_checks=0\n';
 for(const [caseIndex,[u,str,skill,hp,sta,mor]] of [[699,1,1,50,70,63],[2099,4,4,150,200,123],[2100,5,6,100,150,100],[3001,10,10,100,99,101]].entries()){
  code+="gs 'jo9_chun_battle','reset'\njo9_chun_requested=1\n"+buffs.map(v=>`killvar '${v}'\n`).join('')+`base_str=${str}\nсила=${skill}\nмакс_здоровье_игрока=${hp}\nздоровье_игрока=${hp}\nмакс_выносливость_игрока=${sta}\nвыносливость_игрока=${sta}\nнорм_дух_игрока=${mor}\nдух_игрока=${mor}\ngs 'jo9_chun_battle','init'\n`;
  code+=check(`jo9_chun_fight['units']=${u} and здоровье_игрока=${hp} and $итог_боя=''`,'LOW_INIT_HP_'+u);
  code+=check(`jo9_chun_fight['active']=1 and jo9_chun_fight['balm']=3 and jo9_chun_fight['kill_at']>=5 and jo9_chun_fight['kill_at']<=10`,'LOW_INIT_STATE_'+u);
  code+=check(buffs.map(v=>`${v}[1]=${u<2100?99:0}`).join(' and '),'LOW_INIT_BUFFS_'+u);
  code+=check(`func('jo9_chun_battle','mockery',1)=${u<2100?1:0} and func('jo9_chun_battle','mockery',2)=0`,'LOW_BADGE_GATE_'+u);
  if(u<2100)code+=check("$действия_врага[1]='[춘향이 떨고있는 당신을 보더니 피식 웃으며 대검을 겨누었다.]'",'LOW_START_MANUSCRIPT_'+u);
  code+="gs 'боевой_интерфейс'\n";
  code+=check(`(${u<2100?"instr($эффекты_противника,'[춘향의 조소]')>0 and instr($эффекты_противника,'[99]')=0":"instr($эффекты_противника,'[춘향의 조소]')=0"})`,'LOW_BADGE_HTML_'+u);
  code+=`qa_init_units[${caseIndex}]=jo9_chun_fight['units']\nqa_init_hp[${caseIndex}]=здоровье_игрока\nqa_init_buff[${caseIndex}]=разгон[1]\n`;
 }
 code+="jo9_chun_fight['units']=699\njo9_chun_fight['turn']=98\nразгон[1]=1\n"+check("func('jo9_chun_battle','mockery',1)=1",'BADGE_LAST_TURN');
 code+="jo9_chun_fight['turn']=99\n"+check("func('jo9_chun_battle','mockery',1)=0",'BADGE_EXPIRY');
 return code+finish('lowinit');
}
const cleanBuffs=()=>buffs.map(v=>`killvar '${v}'\n`).join('');
const active=(units=2400)=>`jo9_chun_fight['active']=1
jo9_chun_fight['units']=${units}
jo9_chun_fight['balm']=3
jo9_chun_fight['turn']=7
jo9_chun_fight['period']=7
jo9_chun_fight['kill_at']=7
jo9_chun_fight['evade_at']=3
jo9_chun_fight['kill_due']=1
здоровье_врага[1]=200
выносливость_врага[1]=300
дух_врага[1]=200
здоровье_игрока=400
макс_здоровье_игрока=400
выносливость_игрока=400
макс_выносливость_игрока=400
дух_игрока=400
норм_дух_игрока=400
$состояние[1]=''
$итог_боя=''
`;
function specials(){
 const data=[];for(const units of [699,2099,2100,3001])for(const stance of ['блок','контратака','уклонение'])for(const cheat of [0,1])data.push({units,stance,cheat});
 let code="if $args[0]='resume': jump 'special_return'\n"+boot+'qa_checks=0\nqa_case=0\n';
 code+=data.map((x,i)=>`qa_units[${i}]=${x.units}\n$qa_stance[${i}]='${x.stance}'\nqa_cheat[${i}]=${x.cheat}\n`).join('');
 code+=`:special_next
if qa_case>=${data.length}:
 ${finish('specials')}
end
`+active()+`jo9_chun_fight['units']=qa_units[qa_case]
$защита[0]=$qa_stance[qa_case]
cheat_fight_dif=qa_cheat[qa_case]
qa_end_reached=0
нанесенный_вред[1]=77
$наложение[1]='слабость'
наложение[1]=2
длительность[1]=9
qa_should_end=0
if $защита[0] ! 'уклонение' and cheat_fight_dif=1: qa_should_end=1
gs 'jo9_chun_battle','after_player'
:special_return
`;
 code+=check('qa_end_reached=qa_should_end','SPECIAL_END');
 code+=check("(qa_should_end=1 and здоровье_игрока=0 and $итог_боя='убит') or (qa_should_end=0 and здоровье_игрока=400 and $итог_боя='')",'SPECIAL_HP');
 code+=check("нанесенный_вред[1]=0 and $наложение[1]='' and наложение[1]=0 and длительность[1]=0",'SPECIAL_NO_NORMAL_PAYLOAD');
 code+=check("jo9_chun_fight['kill_due']=0 and jo9_chun_fight['kill_at']>=12 and jo9_chun_fight['kill_at']<=17 and jo9_chun_fight['balm']=3",'SPECIAL_RESCHEDULE');
 code+='qa_case += 1\njump \'special_next\'\n';
 return code;
}
function normal(){
 let code=boot+"qa_checks=0\ngs '#противники'\n"+cleanBuffs();
 code+=check("$атака_1_тип['chunhyang']='быстрая' and $атака_2_тип['chunhyang']='быстрая' and $атака_3_тип['chunhyang']='быстрая'",'NORMAL_ALL_FAST');
 code+=check("$атака_1_тип_вреда['chunhyang']='рубящий' and $атака_2_тип_вреда['chunhyang']='рубящий' and $атака_3_тип_вреда['chunhyang']='дробящий'",'NORMAL_DAMAGE_TYPES');
 for(const boosted of [false,true]){
  code+=cleanBuffs();
  if(boosted)code+=`gs 'jo9_chun_battle','reset'
jo9_chun_requested=1
base_str=1
сила=1
макс_здоровье_игрока=50
здоровье_игрока=50
макс_выносливость_игрока=70
выносливость_игрока=70
норм_дух_игрока=63
дух_игрока=63
gs 'jo9_chun_battle','init'
`;
  code+=`killvar 'qa_seen'
qa_attempt=0
$защита[0]='уклонение'
:normal_${boosted?'buff':'base'}
i=1
gs 'искусственный_идиот'
qa_seen[ам]=1
qa_attempt += 1
`;
  code+=check(`$атака[1]='быстрая' and нанесенный_вред[1]=${boosted?60:30}`,'NORMAL_COUNTER_'+(boosted?'BUFF':'BASE'));
  code+=check("(ам<3 and $тип_нанесенного_вреда[1]='рубящий') or (ам=3 and $тип_нанесенного_вреда[1]='дробящий')",'NORMAL_NATIVE_TYPES');
  code+=`if qa_attempt<120 and (qa_seen[1]=0 or qa_seen[2]=0 or qa_seen[3]=0): jump 'normal_${boosted?'buff':'base'}'\n`;
  code+=check('qa_seen[1]=1 and qa_seen[2]=1 and qa_seen[3]=1','NORMAL_THREE_SAMPLED');
 }
 // Exercise all six actual effects through the unchanged native damage helper.
 for(const [type,stance] of [['сильная','контратака'],['быстрая','блок'],['точная','блок']]){
  code+=`atk=1\ndef=0\n$атака[1]='${type}'\n$защита[0]='${stance}'\nвред_на_рассчет=15\n$рассчетный_тип_вреда='рубящий'\ngs 'рассчет_вреда'\n`+check('нанесенный_вред[1]=30','BUFF_ATTACK_'+type);
 }
 for(const [type,stance] of [['сильная','контратака'],['быстрая','блок'],['точная','блок']]){
  code+=`atk=0\ndef=1\n$атака[0]='${type}'\n$защита[1]='${stance}'\nвред_на_рассчет=15\n$рассчетный_тип_вреда='рубящий'\ngs 'рассчет_вреда'\n`+check('нанесенный_вред[0]=7','BUFF_DEFENSE_'+type);
 }
 code+=check("func('jo9_chun_battle','chance',2100,1200)=1 and func('jo9_chun_battle','chance',2100,1201)=0 and func('jo9_chun_battle','chance',3000,300)=1 and func('jo9_chun_battle','chance',3000,301)=0 and func('jo9_chun_battle','chance',2099,1)=0 and func('jo9_chun_battle','chance',3001,1)=0",'SELF_EVADE_CHANCE_UNCHANGED');
 return code+finish('normal');
}
function rounds(){
 let code="if $args[0]='resume': jump 'round_return'\n"+boot+"qa_checks=0\nqa_case=0\ngs '#противники'\ngs '#боевые_предметы'\n";
 code+=`:round_next
if qa_case>=5:
 ${finish('rounds')}
end
`+cleanBuffs()+active()+`jo9_chun_fight['turn']=4
jo9_chun_fight['kill_at']=5
jo9_chun_fight['evade_at']=2
jo9_chun_fight['kill_due']=0
jo9_chun_fight['units']=3001
$защита[0]='уклонение'
qa_round_ended=0
нанесенный_вред=0
$наложение=''
наложение=0
это_суперудар=0
сила_передышки=10
master_fighter=2
if qa_case=0: здоровье_врага[1]=50
if qa_case=2 or qa_case=3: jo9_chun_fight['kill_at']=9
if qa_case=2: здоровье_врага[1]=60
if qa_case=3: jo9_chun_fight['balm']=0
`;
 code+='if qa_case=4:\n'+buffs.map(v=>` ${v}[1]=99\n`).join('')+'end\n';
 code+=`if qa_case=0: gt 'передышка'
if qa_case=1:
 $оружие='гладиус'
 $суперудар[1]='удар_с_разворота'
 gt 'атака_игрока',21
end
gt 'ход_противников'
:round_return
`;
 code+=check("qa_round_ended=1 and (qa_case=3 or (здоровье_игрока=400 and выносливость_игрока=400))",'ROUND_NO_DUPLICATE_HP_STA');
 code+=check("(qa_case=3 and выносливость_игрока<400) or (qa_case!3 and выносливость_игрока=400)",'ROUND_NORMAL_EXISTS');
 code+=check("(qa_case=2 and jo9_chun_fight['balm']=2 and здоровье_врага[1]=200 and выносливость_врага[1]=300) or (qa_case!2 and jo9_chun_fight['balm']=iif(qa_case=3,0,3))",'ROUND_SINGLE_ACTION');
 code+=check("jo9_chun_fight['turn']=5 and ((qa_case=2 or qa_case=3) or (jo9_chun_fight['kill_at']>=10 and jo9_chun_fight['kill_at']<=15))",'ROUND_SCHEDULE');
 code+=`if qa_case=4:\n`+check(buffs.map(v=>`${v}[1]=98`).join(' and '),'ROUND_BUFFS_DECAY')+'end\n';
 code+="qa_case += 1\njump 'round_next'\n";
 return code;
}
if(phase==='prepare'){
 const raw=fs.readFileSync(source),sourceHash=c.hash(raw);if(variant==='red')assert.equal(sourceHash,'29f4c04892a19afb25c82443a928e5d7895f1a7a24208df670eb3f4032bbbd15');
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(rec,{recursive:true});
 const cases=variant==='red'?[['lowinit',lowinit()]]:[['lowinit',lowinit()],['specials',specials()],['normal',normal()],['rounds',rounds()]];
 const plan=[];
 for(const [name,code] of cases){const d=c.parse(raw);put(d,'Start',code);const end=name==='specials'?"qa_end_reached += 1\ngt 'Start','resume'\n":"qa_end_reached=1\nsavegame 'failure.sav'\nmsg 'FAIL_CHUNRANDOM_UNEXPECTED_END'\nexit\n";put(d,'конец_боя',end+body(d,'конец_боя'));if(name==='rounds')put(d,'боевой_интерфейс',"qa_round_ended += 1\ngt 'Start','resume'\n"+body(d,'боевой_интерфейс'));if(name==='lowinit'&&variant!=='red'){const ui=body(d,'боевой_интерфейс'),line="$эффекты_противника = $хорошие_эффекты_противника + $плохие_эффекты_проивника";assert(ui.includes(line));put(d,'боевой_интерфейс',ui.replace(line,line+'\nexit\n'));}const fixture=c.serialize(d);qa.inspectWorld(fixture);fs.writeFileSync(out+'/'+name+'.qsp',fixture);plan.push({name,file:out+'/'+name+'.qsp',marker:'JO9_QA_CHUNRANDOM_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Chun random finisher '+name});}
 fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');write(out+'/plan.json',plan);write(rec+'/native-'+variant+'-instrumentation.json',{source,sourceHash,cases:cases.map(x=>x[0]),scope:'Production battle, AI, player attack and damage helpers preserved. Start is diagnostic. Battle-end and GUI handoffs intercepted only. Lowinit retains actual UI through completed enemy status HTML, then exits before general rendering.',userSavesTouched:false});console.log(JSON.stringify({phase,variant,sourceHash,plan:out+'/plan.json'}));
}else if(phase==='collect'){
 const results=read(out+'/client-results.json'),observations=[];
 assert.equal(results.length,variant==='red'?1:4);
 for(const row of results){const file=out+'/'+row.name+'.sav';if(fs.existsSync(file)){const s=sc.parse(fs.readFileSync(file)),num=(n,k)=>Number(sc.value(s,n,k)[0]),idx=(n,k)=>Number(s.vars.find(v=>v.name===n.toUpperCase())?.values[k]?.[0]||0),val={name:row.name,checks:num('qa_checks'),hp:num('здоровье_игрока'),stamina:num('выносливость_игрока'),units:num('jo9_chun_fight','units'),killAt:num('jo9_chun_fight','kill_at'),turn:num('jo9_chun_fight','turn'),balm:num('jo9_chun_fight','balm'),buffs:buffs.map(v=>({name:v,value:idx(v,1)}))};if(row.name==='lowinit')val.boundaries=[0,1,2,3].map(i=>({units:idx('qa_init_units',i),hp:idx('qa_init_hp',i),buff:idx('qa_init_buff',i)}));if(row.pass&&variant!=='red'){if(row.name==='lowinit')assert.equal(val.checks,24);if(row.name==='specials')assert.equal(val.checks,96);if(row.name==='rounds')assert.equal(val.checks,21);if(row.name==='normal')assert(val.checks>=23);}observations.push(val);}for(const suffix of ['stderr','stdout']){const p=out+'/'+row.name+'-'+suffix+'.log';if(fs.existsSync(p))fs.copyFileSync(p,rec+'/'+variant+'-'+row.name+'-'+suffix+'.log');}}
 const failure=out+'/failure.sav';if(fs.existsSync(failure)){const s=sc.parse(fs.readFileSync(failure));observations.push({name:'failure',checks:Number(sc.value(s,'qa_checks')[0]),hp:Number(sc.value(s,'здоровье_игрока')[0]),units:Number(sc.value(s,'jo9_chun_fight','units')[0]),endReached:Number(sc.value(s,'qa_end_reached')[0]),outcome:sc.value(s,'итог_боя')[1]});}
 const sourceHash=c.hash(fs.readFileSync(source));assert.equal(sourceHash,read(rec+'/native-'+variant+'-instrumentation.json').sourceHash,'Input changed after fixture preparation');
 const report={variant,source,sourceHash,engineSha256:c.hash(fs.readFileSync(game+'/engine/jack.exe')),results,observations,assertions:observations.reduce((n,x)=>n+x.checks,0),passed:results.every(x=>x.pass),limits:['Combat outcome handoffs isolated; normal CM settlement is unchanged and outside this regression.','Actual status HTML generation checked; pixel layout and tooltip clicking not visually inspected.']};write(rec+'/native-'+variant+'-report.json',report);console.log(JSON.stringify(report));if(variant!=='red')assert(report.passed,'Native probes failed');
}else throw Error('Expected prepare or collect');
