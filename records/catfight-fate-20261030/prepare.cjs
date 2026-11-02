'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/catfight-fate-20261030',B='G:/somi/JO9_work_backups/catfight-fate-20261030',H=__dirname;
const raw=fs.readFileSync(G+'/jack.qsp'),d=c.parse(raw);a(c.serialize(d).equals(raw));
fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(B,{recursive:true});if(fs.existsSync(B+'/before.qsp'))a(fs.readFileSync(B+'/before.qsp').equals(raw));else fs.writeFileSync(B+'/before.qsp',raw);
const edits=[];function edit(location,old,value,id,count=1){const l=d.locations.find(x=>x.name===location);a(l);let body=c.shift(d.lines[l.body],5);a.equal(body.split(old).length-1,count,location+' '+id);const next='! JO9 MOD START '+id+'\r\n'+value+'\r\n! JO9 MOD END '+id;body=body.split(old).join(next);d.lines[l.body]=c.shift(body,-5);edits.push({location,field:'body',old,new:next,count});}
edit('$catfight_fight_start',"gs 'боевое_меню'\r\ngt 'боевой_интерфейс'","gs 'jo9_battle_fate', 'init', 'catfight'\r\ngs 'боевое_меню'\r\ngt 'боевой_интерфейс'",'CATFIGHT_FATE_START_20261030');
edit('jo9_battle_fate'," result = jo9_fate['mode']\r\n exit\r\nend",[
" if $jo9_bf_source = 'catfight' and arena_mode = 1 and $fight_return = 'Start1' and $place = 'catfightclub' and количество_врагов = 1:",
"  if instr('|gladiatrix1|gladiatrix2|gladiatrix3|', '|' + $враг[1] + '|') > 0: jo9_fate['mode'] = 2",
" end"," result = jo9_fate['mode']"," exit","end"].join('\r\n'),'CATFIGHT_FATE_SCOPE_20261030');
edit('jo9_battle_fate',"  if jo9_fate['choice'] = 2: $jo9_bf_message = '당신은 무기를 거두고 상대를 살려주었다.'",[
"  if jo9_fate['choice'] = 2: $jo9_bf_message = '당신은 무기를 거두고 상대를 살려주었다.'",
"  if $fight_return = 'Start1':",
"   $jo9_bf_message = '당신은 상대를 처형하라고 지시했다. 승리한 노예가 마지막 일격을 가했다.'",
"   if jo9_fate['choice'] = 2: $jo9_bf_message = '당신은 상대를 살려주라고 지시했다. 승리한 노예가 무기를 거두고 물러섰다.'",
"  end"].join('\r\n'),'CATFIGHT_FATE_INSTRUCTION_20261030');
const neutral="\t $text[1] = ' <<$slave_name>>(은)는 상대를 꺾고 승리를 거두었다. 지하 격투장을 채운 함성 속에서 당신은 상금을 받아 들었다.'";
const follow=[neutral,"\t if jo9_fate['mode'] = 2 and jo9_fate['phase'] = 3:",
"\t  if jo9_fate['choice'] = 1: $text[1] = ' 당신의 지시에 따라 <<$slave_name>>(은)는 쓰러진 상대에게 마지막 일격을 가했다. 관중의 함성이 지하 격투장을 뒤흔들고, 진행자가 당신에게 승리의 상금을 건넸다.'",
"\t  if jo9_fate['choice'] = 2: $text[1] = ' 당신은 패배한 상대를 살려주기로 했다. <<$slave_name>>(은)는 무기를 거두고 물러섰다. 상대가 부축을 받아 격투장을 떠난 뒤, 당신은 승리의 상금을 받아 들었다.'",
"\t end"].join('\r\n');
for(const [suffix,tail]of [['HERO','당신과 당신의 지갑을 기쁘게 했다.'],['LEGACY','너와 네 지갑을 기쁘게 했다.']])edit('interaction_city',"\t $text[1] = ' 상대는 더는 싸움을 계속할 수 없어서 땅에 쓰러졌다. <<$slave_name>>는 자기 최고의 면모를 보여 주며 잔혹한 싸움에서 승리를 거두었고, 그건 "+tail+"'",follow,'CATFIGHT_FATE_FOLLOWUP_'+suffix+'_20261030');
edit('interaction_city',"\t $text[2] = ' 돈지갑: $<<purse>>!'","\t $text[2] = ' 상금: $<<purse>>!'",'CATFIGHT_PRIZE_LABEL_20261030');
const candidate=c.serialize(d);qa.inspectWorld(candidate);const mod={id:'2026-10-30_catfight_fate',description:'Reuse the existing victory fate choice for regular Catfight Club opponents and match follow-up dialogue; preserve rewards, losses and save state layout.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};
fs.writeFileSync(T+'/candidate.qsp',raw);fs.writeFileSync(T+'/mods/2026-10-30_catfight_fate.json',JSON.stringify(mod,null,2));
const save=G+'/save/JO9_GOLD_AP_CHECK_20261026.sav';fs.writeFileSync(H+'/paths.json',JSON.stringify({repo:R,game:G,tmp:T,backup:B,baseline:B+'/before.qsp',candidate:T+'/candidate.qsp',patch:T+'/mods/2026-10-30_catfight_fate.json',before:mod.before_sha256,after:mod.after_sha256,stateSave:save,saveHash:c.hash(fs.readFileSync(save)),changed:[...new Set(edits.map(e=>e.location))]},null,2));console.log(JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,edits:edits.length}));
