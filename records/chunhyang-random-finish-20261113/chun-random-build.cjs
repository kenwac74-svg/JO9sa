'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict'),t=require('./chun-random-task.cjs');
const {R,G,T,D,c,qa,rd,wr,body,put}=t,id='2026-11-13_chunhyang_random_finisher';
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));const d=c.parse(raw),edits=[];
function replace(location,old,next){const now=body(d,location);a.equal(now.split(old).length-1,1,location+' anchor');put(d,location,now.replace(old,()=>next));edits.push({location,field:'body',old,new:next,count:1,patchId:'CHUNHYANG_RANDOM_FINISHER_20261113'});}
const nl=s=>s.replace(/\r?\n/g,'\r\n');
const oldInit=nl(` if jo9_chun_fight['units'] < 2100:
  $действия_врага[1] = '산도의 일섬 — 춘향이 시야를 벗어나 결정타를 노렸다.'
  здоровье_игрока = max(0,здоровье_игрока-здоровье_игрока*cheat_fight_dif)
  if здоровье_игрока <= 0:
   $итог_боя = 'убит'
   gt 'конец_боя'
  end
 end`);
const nextInit=nl(` ! Refresh only Chunhyang attack styles, including cached definitions in existing saves.
 $атака_1_тип['chunhyang'] = 'быстрая'
 $атака_2_тип['chunhyang'] = 'быстрая'
 $атака_3_тип['chunhyang'] = 'быстрая'
 if jo9_chun_fight['units'] < 2100:
  бешенство[1] = 99
  разгон[1] = 99
  меткость[1] = 99
  адреналин[1] = 99
  верткость[1] = 99
  внимание[1] = 99
  $действия_врага[1] = '[춘향이 떨고있는 당신을 보더니 피식 웃으며 대검을 겨누었다.]'
 end`);
replace('jo9_chun_battle',oldInit,nextInit);
const oldSpecial=nl(`  if func('jo9_chun_battle','chance',jo9_chun_fight['units'],rand(1,3000)) = 1:
   $действия_врага[1] = '산도의 일섬 — 춘향이 결착을 내는 일격을 뻗었다.'
   здоровье_игрока = max(0,здоровье_игрока-здоровье_игрока*cheat_fight_dif)
   if здоровье_игрока <= 0:
    $итог_боя = 'убит'
    gt 'конец_боя'
   end
   exit
  end
  $действия_врага[1] = '산도의 일섬 — 결정타를 피했지만 공격이 이어졌다.<br>' + $действия_врага[1]
  exit`);
const nextSpecial=nl(`  gs 'jo9_chun_battle','clear_attack'
  if $защита[0] = 'уклонение':
   $действия_врага[1] = '산도의 일섬 — 대검이 잔상을 갈랐다. 당신은 몸을 틀어 결정타를 피했다.'
   exit
  end
  $действия_врага[1] = '산도의 일섬 — 춘향이 결착을 내는 일격을 뻗었다.'
  здоровье_игрока = max(0,здоровье_игрока-здоровье_игрока*cheat_fight_dif)
  if здоровье_игрока <= 0:
   $итог_боя = 'убит'
   gt 'конец_боя'
  end
  exit`);
replace('jo9_chun_battle',oldSpecial,nextSpecial);
replace('jo9_chun_battle',nl(" нанесенный_вред[1] = 0\n $наложение[1] = ''\n $действия_врага[1] = '전장 응급처치"),nl(" gs 'jo9_chun_battle','clear_attack'\n $действия_врага[1] = '전장 응급처치"));
const helpers=nl(`! JO9 MOD START CHUNHYANG_RANDOM_FINISHER_20261113
if $args[0] = 'clear_attack':
 нанесенный_вред[1] = 0
 $наложение[1] = ''
 наложение[1] = 0
 длительность[1] = 0
 exit
end
if $args[0] = 'mockery':
 result = 0
 if args[1] = 1 and $враг[1] = 'chunhyang' and jo9_chun_fight['active'] = 1 and jo9_chun_fight['units'] < 2100 and jo9_chun_fight['turn'] < 99:
  if бешенство[1] + разгон[1] + меткость[1] + адреналин[1] + верткость[1] + внимание[1] > 0: result = 1
 end
 exit
end
if $args[0] = 'mockery_info':
 msg '춘향의 조소<br>자신보다 능력이 크게 부족한 도전자를 보고 전투 태세를 끌어올렸다. 여섯 강화는 각각 99턴으로 시작하며 매턴 남은 시간이 줄어든다.<br>분노: 힘 공격 강화 — <<бешенство[1]>>턴<br>가속: 속도 공격 강화 — <<разгон[1]>>턴<br>명중: 정밀 공격 강화 — <<меткость[1]>>턴<br>흥분: 받는 힘 공격 약화 — <<адреналин[1]>>턴<br>회피: 받는 속도 공격 약화 — <<верткость[1]>>턴<br>집중: 받는 정밀 공격 약화 — <<внимание[1]>>턴<br>공격·방어 효과는 기존 전투 수정자와 합산한다.'
 exit
end
! JO9 MOD END CHUNHYANG_RANDOM_FINISHER_20261113
`);
replace('jo9_chun_battle',"! JO9 MOD START CHUNHYANG_BATTLE_20261112\r\n","! JO9 MOD START CHUNHYANG_BATTLE_20261112\r\n"+helpers);
for(const [n,old] of [[1,'точная'],[3,'сильная']])replace('#противники',`$атака_${n}_тип['chunhyang'] = '${old}'`,`$атака_${n}_тип['chunhyang'] = 'быстрая'`);
const oldUi=nl(`dynamic $бешенство_противника
dynamic $разгон_противника
dynamic $меткость_противника
dynamic $адреналин_противника
dynamic $верткость_противника
dynamic $внимание_противника`);
replace('боевой_интерфейс',oldUi,nl(`! JO9 MOD START CHUNHYANG_MOCKERY_UI_20261113
if func('jo9_chun_battle','mockery',текущий) = 1:
 $хорошие_эффекты_противника += '<a href="EXEC: gs ''jo9_chun_battle'',''mockery_info''">[춘향의 조소]</a><br>'
else
`)+oldUi+nl(`
end
! JO9 MOD END CHUNHYANG_MOCKERY_UI_20261113`));
const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));
const beforeDoc=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(beforeDoc,l.name)).map(l=>l.name);a.deepEqual(changed.slice().sort(),['jo9_chun_battle','#противники','боевой_интерфейс'].sort());
const chance=x=>x.slice(x.indexOf("if $args[0] = 'chance':"),x.indexOf("if $args[0] = 'cost':"));a.equal(chance(body(d,'jo9_chun_battle')),chance(body(beforeDoc,'jo9_chun_battle')));
const finish=x=>x.slice(x.indexOf("if $args[0] = 'finish':"));a.equal(finish(body(d,'jo9_chun_battle')),finish(body(beforeDoc,'jo9_chun_battle')));
const mod={id,status:'APPROVED',description:'사용자 확정: 시작 일섬 삭제, 무작위 일섬은 회피 자세만 방어, 일반공격은 회피 상성, 70% 미만 춘향의 조소 6강화99턴과 시작 대사. 유수보/CM/치트/연고량 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',out);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,changedLocations:changed,edits:edits.length,candidate:T+'/candidate.qsp',modFile:T+'/mods/'+id+'.json',nativeRed:rd(D+'/native-red-report.json')});
console.log(JSON.stringify({candidate:mod.after_sha256,edits:edits.length,changed}));
