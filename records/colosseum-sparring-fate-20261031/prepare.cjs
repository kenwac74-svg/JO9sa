'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',T='G:/Codex/tmp/colosseum-sparring-fate-20261031',B='G:/somi/JO9_work_backups/colosseum-sparring-fate-20261031',expected='554e35702f9380054846ce6649f14bbcbda806e025fb414de295b0c9b18b1a15',id='2026-10-31_colosseum_practice_no_execution';
const raw=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(raw),expected);a.deepEqual(raw,fs.readFileSync(F+'/jack.qsp'));const d=c.parse(raw);a.deepEqual(c.serialize(d),raw);const edits=[];
const cr=s=>s.replace(/\r?\n/g,'\r\n');
function edit(location,old,newText){old=cr(old);newText=cr(newText);const l=d.locations.find(x=>x.name===location);const b=c.shift(d.lines[l.body],5);a.equal(b.split(old).length-1,1,location+': old count');a.equal(b.split(newText).length-1,0,location+': already changed');d.lines[l.body]=c.shift(b.replace(old,newText),-5);edits.push({location,field:'body',old,new:newText,count:1});}
const wrap=(label,s)=>'! JO9 MOD START '+label+'\n'+s+'\n! JO9 MOD END '+label;
const practice="$place = 'colosseum' and colosseum_fight > 0";
edit('jo9_battle_fate'," local $jo9_bf_text = ''\n if jo9_fate['mode'] = 1:"," local $jo9_bf_text = ''\n"+wrap('COLOSSEUM_PRACTICE_TEXT_20261031',` if ${practice}:
  if jo9_bf_cause = 1 or jo9_bf_cause = 3:
   $jo9_bf_text = '매섭게 파고든 마지막 일격에 상대가 모래바닥에 주저앉았다. 간신히 몸을 지탱한 채 거친 숨을 몰아쉬지만, 다시 맞설 기세는 꺾인 듯하다. 목숨을 거는 결투가 아닌 연습이니, 더 몰아붙일 이유는 없다.'
  else
   $jo9_bf_text = '상대는 더 이상 버티지 못하고 모래바닥에 쓰러졌다. 방금까지 이어지던 반격도 멎고, 다시 일어설 기색은 보이지 않는다. 승부는 이미 끝났으니, 더 몰아붙이지 않고 연습을 마무리할 때다.'
  end`)+"\n elseif jo9_fate['mode'] = 1:");
edit('jo9_battle_fate'," if jo9_bf_choice = 2 and jo9_fate['mode'] ! 2: exit\n jo9_fate['phase'] = 2", " if jo9_bf_choice = 2 and jo9_fate['mode'] ! 2: exit\n"+wrap('COLOSSEUM_PRACTICE_EXECUTION_GUARD_20261031',` if jo9_bf_choice = 1 and ${practice}: exit`)+"\n jo9_fate['phase'] = 2");
edit('jo9_battle_fate',` $jo9_fate['choices'] = '<div class="jo9-battle-fate-choices" id="jo9_fate_choices"><div class="jo9-battle-fate-row"><a class="jo9-battle-fate-execute" href="EXEC: gt ''jo9_battle_fate'', ''apply'', 1">[' + $jo9_bf_execute + ']</a></div><div class="jo9-battle-fate-row">'`,wrap('COLOSSEUM_PRACTICE_CHOICES_20261031',` $jo9_fate['choices'] = '<div class="jo9-battle-fate-choices" id="jo9_fate_choices"><div class="jo9-battle-fate-row">'
 if ${practice}:
  $jo9_bf_spare = '공격을 멈추고 연습을 마무리한다'
  $jo9_fate['choices'] += '<span class="jo9-battle-fate-execute is-disabled" aria-disabled="true">[' + $jo9_bf_execute + ']</span>'
 else
  $jo9_fate['choices'] += '<a class="jo9-battle-fate-execute" href="EXEC: gt ''jo9_battle_fate'', ''apply'', 1">[' + $jo9_bf_execute + ']</a>'
 end
 $jo9_fate['choices'] += '</div><div class="jo9-battle-fate-row">'`));
edit('jo9_battle_fate'," local $jo9_bf_page = $jo9_fate['page']\n if $jo9_fate['last_fx'] ! '':", " local $jo9_bf_page = $jo9_fate['page']\n"+wrap('COLOSSEUM_PRACTICE_CACHED_CHOICES_20261031',` if jo9_fate['phase'] = 1 and ${practice}:
  local $jo9_bf_old_choices = $jo9_fate['choices']
  gs 'jo9_battle_fate', 'choices'
  if $jo9_bf_old_choices ! '' and $jo9_bf_old_choices ! $jo9_fate['choices']:
   $jo9_bf_page = $replace($jo9_bf_page, $jo9_bf_old_choices, $jo9_fate['choices'])
   $jo9_fate['page'] = $jo9_bf_page
  end
 end`)+"\n if $jo9_fate['last_fx'] ! '':");
edit('jo9_battle_fate',"! JO9 MOD END CATFIGHT_FATE_INSTRUCTION_20261030\n  local $jo9_bf_choices", "! JO9 MOD END CATFIGHT_FATE_INSTRUCTION_20261030\n"+wrap('COLOSSEUM_PRACTICE_FINISH_20261031',`  if ${practice} and jo9_fate['choice'] = 2:
   $jo9_bf_message = '당신은 무기를 거두고 물러섰다. 거친 숨을 고르며 방금 끝난 연습을 되짚어 본다.'
   if combatant ! 0: $jo9_bf_message = '당신의 신호에 승리한 투사가 물러섰다. 오늘 연습은 여기까지다.'
  end`)+"\n  local $jo9_bf_choices");
// Edit only narrative literals; keep the original experience expressions and numeric effects.
const texts=[
['당신은 패배해여 땅바닥에 드러누웠다.','상대의 공세를 끝내 견디지 못한 당신은 모래바닥에 쓰러졌다. 한동안 몸을 일으키지도 못한 채 숨을 고르다가, 가까스로 다시 일어섰다. 대련은 끝났지만 패배의 쓰라림은 쉽게 가시지 않았다.'],
['당신의 마지막 공격이 적을 땅바닥에 처박았다.','당신의 마지막 일격을 버티지 못한 상대가 모래바닥에 주저앉았다. 더는 맞서지 못하는 모습을 확인하고서야 공격을 멈춘 당신은, 한 발 물러나 거칠어진 숨을 골랐다.'],
['<<$slave_name>>(은)는 패배해여 땅바닥에 드러누웠다.<br>안타깝게도 이런식으로 져버리면, <b>전투술도 체력도 오르지 않는다</b>.','상대의 공세를 버티지 못한 <<$slave_name>>의 몸이 모래바닥에 무너졌다. 대련이 끝난 뒤에도 그녀는 한동안 몸을 추스르며 거친 숨을 골랐다. 고개를 숙인 모습에는 패배를 받아들이기 힘든 듯 분한 기색이 남아 있었다.'],
['<<$slave_name>>의 마지막 공격이 적을 땅바닥에 처박았다.','<<$slave_name>>의 마지막 공격에 상대가 균형을 잃고 모래바닥에 쓰러졌다. 그녀는 더 쫓아가지 않고 당신을 돌아보았고, 대련이 끝났음을 확인한 뒤에야 숨을 고르며 물러섰다.'],
['<<$assistant_name>>(은)는 패배해여 땅바닥에 드러누웠다.<br>안타깝게도 이런식으로 져버리면, <b>전투술도 체력도 오르지 않는다</b>.','<<$assistant_name>>의 움직임이 상대의 공세에 밀려 끝내 흐트러졌다. 모래바닥에 쓰러진 그녀는 대련이 끝난 뒤에야 가까스로 몸을 추슬렀다. 당신 곁으로 돌아와 숨을 고르는 동안에도 패배의 쓰라림을 감추지 못했다.'],
['<<$assistant_name>>의 마지막 공격이 적을 땅바닥에 처박았다.','<<$assistant_name>>의 마지막 일격에 상대의 반격이 끊겼다. 그녀는 곧바로 공격을 멈추고 물러나, 거친 숨을 가다듬으며 당신에게 대련이 끝났음을 알렸다.']
];
for(let i=0;i<texts.length;i++){const l=d.locations.find(x=>x.name==='interaction_city'),b=c.shift(d.lines[l.body],5),line=b.split('\r\n').find(s=>s.includes("'"+texts[i][0]+"'"));a.ok(line);edit('interaction_city',line,wrap('COLOSSEUM_PRACTICE_RESULT_'+i+'_20261031',line.replace(texts[i][0],texts[i][1])));}
const out=c.serialize(d);qa.inspectWorld(out);a.equal(d.locations.length,275);fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(B,{recursive:true});if(fs.existsSync(B+'/before.qsp'))a.deepEqual(fs.readFileSync(B+'/before.qsp'),raw);else fs.writeFileSync(B+'/before.qsp',raw);
const mod={id,description:'Colosseum practice only: disable and guard execution; refresh pending cached choices; adapt practice victory/defeat prose without changing experience or rewards.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};fs.writeFileSync(T+'/mods/'+id+'.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(__dirname+'/prepared.json',JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,edits:edits.length,locations:d.locations.length,candidate:T+'/candidate.qsp',backup:B+'/before.qsp'},null,2)+'\n');console.log(JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,edits:edits.length,candidate:T+'/candidate.qsp'}));
