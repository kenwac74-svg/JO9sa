'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(source),d=core.parse(raw);assert(core.serialize(d).equals(raw));assert.equal(d.hash,'a2e0265881bebd8a72b3fcbb214ddaf831106cfe50e9c96da8e0b6e7d692707a','Work drift: audit again');
const body=n=>core.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const refs=(n,pattern)=>body(n).split('\r\n').flatMap((s,i)=>pattern.test(s)?[{location:n,line:i+1}]:[]);
const trophyBody=body('trophy_room').split('\r\n'),trophies=[];for(let i=0;i<trophyBody.length;i++){const m=trophyBody[i].match(/if (trophy_\w+) > 0:.*<center>([^<>]+)<\/center>/);if(m)trophies.push({variable:m[1],name:m[2],display:{location:'trophy_room',line:i+1},kind:/race/.test(m[1])?'race':'combat'});}
assert.equal(trophies.length,24);assert.equal(trophies.filter(t=>t.kind==='combat').length,22);
assert(body('выход_из_боя').includes('molar_of_wolf += 2'));assert(body('выход_из_боя').includes('chimera_earring = 1'));assert(body('special_screen').includes('посох_огня = 1'));
const findings={date:'2026-10-21',status:'READ_ONLY_CODE_AUDIT',source,sha256:d.hash,locations:d.locations.length,roundtrip:true,directBattleItems:[
{name:'와그의 어금니',variable:'molar_of_wolf',type:'재료',amount:2,condition:'와그 전투 보상부에 도달하며 현재 보유량이 0',repeat:'소진하여 0이 되면 다시 획득 가능',refs:refs('выход_из_боя',/molar_of_wolf/)},
{name:'키메라의 보석/귀걸이',variable:'chimera_earring',type:'퀘스트 물품',amount:1,condition:'가르시드가 다섯 번째 적인 특수 전투의 정상 보상 경로',repeat:'전역 소유 플래그; 가르시드 사망/기절 또는 도주 서술 모두 보석 대입',refs:refs('выход_из_боя',/chimera_earring/)},
{name:'화룡의 유물 지팡이',variable:'посох_огня',type:'장착 무기',amount:1,condition:'미획득·미보유 + fog_battle=1 + 마법력/근력/지배(master_domination) 각각5이상 + 오우거/와르그/웨어울프/거대핀드/뱀파이어/리치 트로피',repeat:'별도 확률 추첨 없는 조건 이벤트. 특수 화면에서 소유권 지급',refs:[...refs('выход_из_боя',/trophy_fire_staff|master_mage >= 5|trophy_ogre >= 1/),...refs('special_screen',/trophy_fire_staff = 1|посох_огня = 1/)]}
],trophies,combatTrophyCount:22,raceTrophyCount:2,questRelatedItems:[
{name:'황소 반지',variable:'bull_ring',condition:'투기장 최상위 전적(arena_level>4) 인물 납품 의뢰',directBattleDrop:false,refs:refs('interaction_city',/bull_ring = 1/)},
{name:'오베레그',variable:'obereg',condition:'투기장 전적(arena_level>=2)과 경주 승리(has_ride_win>=1)를 갖춘 인물 납품 의뢰',directBattleDrop:false,refs:refs('interaction_city',/obereg = 1/)}
],notDirectBattleDrop:[{name:'미스릴 갑옷',variable:'кольчуга',reason:'로드 스펙터의 복합 훈련/납품 의뢰 보상. 전투 승리 직후의 물품 드롭과 분리'}],limits:['정적 코드 조사이며 실제 플레이나 무작위 확률 분포 실측은 아님.','일반 무기/방어구 무작위 드롭 테이블은 조사 범위에서 확인되지 않음.','개발용 최대 능력 생성기의 전품목 소유 코드는 정상 전투 획득으로 세지 않음.'],gameModified:false};
fs.writeFileSync(__dirname+'/evidence.json',JSON.stringify(findings,null,2)+'\n');
assert.equal(core.hash(fs.readFileSync(source)),d.hash,'Source changed during audit');console.log(JSON.stringify({sha256:d.hash,directItems:3,questRelatedItems:2,combatTrophies:22,raceTrophies:2,modified:false}));