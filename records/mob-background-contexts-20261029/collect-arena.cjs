'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const world='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(world),d=c.parse(raw);
const bodies=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5).split(/\r?\n/)]));
const hits=(name,re)=>bodies.get(name).map((text,i)=>({location:name,line:i+1,text})).filter(r=>re.test(r.text));
const q=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const reg=bodies.get('#противники');
function names(name,pattern){return [...new Set(hits(name,pattern).flatMap(e=>[...e.text.matchAll(/(?:\$ge|\$ge[2-5]|\$враг\[1\])\s*=\s*['"]([^'"]+)['"]/g)].map(x=>x[1])))];}
const arenaKeys=names('$gladiator_setup',/\$ge[2-5]?\s*=/),sparKeys=names('colosseum_fight',/\$враг\[1\]\s*=/);
// The setup helper's preliminary *_ava keys are overwritten by interaction103001.
// Trace the final selector rather than treating those interim strings as live enemies.
const catSelector=hits('interaction_city',/\$ge\s*=\s*'gladiatrix[123]'/).filter(x=>x.line>=17715&&x.line<=17964);
const catKeys=[...new Set(catSelector.flatMap(x=>[...x.text.matchAll(/\$ge\s*=\s*'([^']+)'/g)].map(m=>m[1])))];
assert.equal(arenaKeys.length,32);assert.equal(catKeys.length,3);assert.equal(sparKeys.length,5);
for(const key of [...arenaKeys,...catKeys,...sparKeys])assert(reg.some(t=>t.includes("$название_моба['"+key+"']")),key);
const arenaBg={runtime:'content/pic/ui/jo9_battle_test_v01/arena.png',environment:'콜로세움 경기장',futureCommonReview:'C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/colosseum-common-bg-20261029/colosseum_common_bg_arena_reference_795x596_review.png',runtimeEvidence:hits('боевой_интерфейс',/colosseum_fight > 0|fight_return = 'Start'|jo9_battle_test_v01\/arena\.png/)};
const contexts=[
 {id:'colosseum_tournament',kind:'arena',label:'콜로세움 검투 대회',enemyKeys:arenaKeys,entry:'$gladiator_setup → interaction_city 12801 → $gladiator_fight_start',condition:"$place='colosseum_arena'; $fight_return='Start'",background:arenaBg,evidence:[...hits('$gladiator_setup',/\$ge[2-5]?\s*=|interaction_city = 12801/),...hits('$gladiator_fight_start',/fight_return = 'Start'|arena_mode = 1/)]},
 {id:'colosseum_training',kind:'arena_training',label:'콜로세움 투사 훈련소 대련',enemyKeys:sparKeys,entry:'colosseum_fight → interaction_city 199 → начать_бой',condition:"$place='colosseum'; colosseum_fight=1..5/11..15/21..25/31..35",background:arenaBg,evidence:hits('colosseum_fight',/if colosseum_fight =|\$враг\[1\]\s*=|interaction_city = 199/)},
 {id:'catfight_club',kind:'catfight',label:'동부 캣파이트 클럽 정규 시합',enemyKeys:catKeys,entry:'$catfighter_setup → interaction_city 103001 → $catfight_fight_start',condition:"$place='catfightclub'; $fight_return='Start1'",background:{runtime:'content/pic/ui/grimdark/bg/fight.png',environment:'캣파이트 클럽 실내',sceneReference:'content/pic/bg/catfightclub.png',note:'현재 전투 렌더러의 콜로세움 전용 조건에 Start1은 포함되지 않아 공통 전투 배경 fallback을 사용한다. 클럽별 합성 배경은 별도 구분 필요.',runtimeEvidence:hits('боевой_интерфейс',/elseif ui_style = 2|grimdark\\bg\\fight\.png|grimdark\/bg\/fight\.png/)},evidence:[...hits('$catfighter_setup',/\$ge\s*=|interaction_city = 103001/),...catSelector,...hits('$catfight_fight_start',/fight_return = 'Start1'|arena_mode = 1/),...hits('#place_base',/\$bg\['catfightclub'\]/)],selectorNote:'$catfighter_setup의 gladiatrix*_ava 중간값은 interaction_city 103001에서 gladiatrix1~3으로 다시 뽑고 $враг[1]도 덮어쓴다. 중간 문자열만 보고 미정의 적이 출전한다고 판단하지 않는다.'}
];
const perEnemy=[...new Set([...arenaKeys,...sparKeys,...catKeys])].map(key=>({key,contextIds:contexts.filter(x=>x.enemyKeys.includes(key)).map(x=>x.id),definition:reg.map((text,i)=>({location:'#противники',line:i+1,text})).filter(x=>x.text.includes("['"+key+"']")&&/\$(?:название|аватара|силуэт)_моба/.test(x.text))}));
const out={schema:'jo9-arena-context-audit-v1',source:{world,sha256:c.hash(raw)},contexts,perEnemy,visualExceptions:[{key:'kimerian_e',slot:'standing',path:'content/pic/mob/gladiator_kimerian_5.png',observed:'Image visually contains a forest background.',requiredEnvironment:'콜로세움 경기장',status:'confirmed-background-mismatch; image not changed',evidence:hits('$gladiator_setup',/kimerian_e/)}]};
fs.writeFileSync(path.join(__dirname,'arena-contexts.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({source:c.hash(raw),arenaKeys:arenaKeys.length,catfightKeys:catKeys.length,trainingKeys:sparKeys.length,perEnemy:perEnemy.length}));
