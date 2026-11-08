'use strict';
const a=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
function apply(data,doc){
 const locations=new Map(doc.locations.map(l=>[l.name,core.shift(doc.lines[l.body],5)]));
 const line=(name,test)=>{const rows=locations.get(name).split(/\r?\n/);const i=rows.findIndex(text=>test.test(text));a(i>=0,name+' source anchor');return name+':'+(i+1);};
 const arousal=locations.get('jo9_nymph_arousal'),daily=locations.get('jo9_nymphomania_daily'),chaotic=locations.get('jo9_chaotic');
 a(arousal&&daily&&chaotic);
 const xp=arousal.match(/nymphomania_xp'\] > (\d+)/)[1];
 const roll=arousal.match(/rand\(1,\s*(\d+)\) = 1/)[1];
 const days=daily.match(/jo9_frigid_days'\] >= (\d+)/)[1];
 const chance=daily.match(/rand\(1,\s*100\) <= (\d+)/)[1];
 const update=(name,value)=>{const row=data.traits.rows.find(r=>r.name===name);a(row,name);Object.assign(row,value);};
 const treatment=line('jo9_chaotic',/if \$args\[0\] = 'jo9_addiction_treatment'/);
 const stoneTreatment=line('jo9_chaotic',/elseif \$args\[0\] = 'jo9_stone_treatment'/);
 update('정액 중독',{
  acquisition:'색정광 상태에서 관련 경험치 '+xp+' 초과, 재발 방지 기록이 없을 때 경험치 획득 시 '+(100/Number(roll))+'%로 상위 단계가 된다. 시루는 신규 영입 시 보유하며 기존 보유분도 불러오기 때 보정한다. 치료 이력은 보존한다.',
  acquisitionSource:line('jo9_nymph_arousal',/nymphomania_xp'\] > /)+' · '+line('$ongload',/jo9shiruactor\['nymphomania'\] = 2/),
  price:'별도 구매 없음',policy:'다른 제거 후보가 없을 때 색정광으로 완화',policySource:treatment,
 });
 update('석녀',{
  acquisition:'불감증 상태이고 관통·단체·이종 기술의 최댓값이 3 이하인 상태가 '+days+'일 누적될 때 '+chance+'%로 발현한다. 실패하면 누적 일수를 다시 센다. 냉동 보관·축사 인물은 일일 판정 대상이 아니다.',
  acquisitionSource:line('jo9_nymphomania_daily',/jo9actor\['nymphomania'\] = -1/),
  price:'별도 구매 없음',policy:'부정 후보가 없을 때 불감증으로 완화',policySource:stoneTreatment,
 });
 update('불감증',{policy:'부정 후보가 없을 때만 제거',policySource:line('jo9_chaotic',/jo9_stone_treatment', 'nymphomania'/)});
 const base=locations.get('#static_base'),growth=base.split(/\r?\n/).find(x=>/nymphomania_xp'\] >/.test(x));a(growth);
 const threshold=growth.match(/nymphomania_xp'\] > (\d+)/)[1];
 update('색정광',{acquisition:'인물 생성 시 부여될 수 있다. 관련 경험치 '+threshold+' 초과이며 기존 성향이 -1 이상·1 미만이면 후천적으로 얻는다. 정액 중독을 카오틱 에센스로 치료해도 색정광으로 돌아간다.',acquisitionSource:line('generate_stock',/stock\['nymphomania'\] = rand/)+' · '+line('#static_base',/nymphomania_xp'\] >/ )+' · '+treatment});
 const items=new Map(data.items.rows.map(r=>[r.id,r]));
 const fruit=items.get("jo9_agraba_stock['fruit']"),wine=items.get("jo9_agraba_stock['wine']"),premium=items.get("jo9_agraba_stock['premium_virgin_meat']");a(fruit&&wine&&premium);
 const city=locations.get('interaction_city');
 function branch(id){const m=city.match(new RegExp('^IF interaction_city = '+id+':([\\s\\S]*?)^END\\s*$','mi'));a(m,id);return m[1];}
 const fruitBranch=branch(30212),wineBranch=branch(30411);
 const fruitGold=Number(fruitBranch.match(/gold -= (\d+)/)[1]),fruitSparks=Number(fruitBranch.match(/sparks -= (\d+)/)[1]),fruitQty=Number(fruitBranch.match(/jo9_agraba_stock\['fruit'\] \+= (\d+)/)[1]);
 const wineGold=Number(wineBranch.match(/gold -= (\d+)/)[1]),wineQty=Number(wineBranch.match(/jo9_agraba_stock\['wine'\] \+= (\d+)/)[1]);
 const bonus='조수의 특별요리 명령을 켜고 기존 식사가 5등급 미만일 때 재료 1회분으로 품질을 한 단계 높인다. 사용 순서는 과일 → 와인 → 특등급 처녀고기다.';
 a(locations.get('$food_choice').includes("assistant['special_cooks_rule'] = 1"));a(locations.get('$food_choice').includes('jo9_agraba_meal_grade += 1'));
 Object.assign(fruit,{price:'금화 '+fruitGold+' 또는 '+fruitSparks+'스파크 / '+fruitQty+'회분',acquisition:'아그라바 발삼의 상점',acquisitionSource:line('interaction_city',/^IF interaction_city = 30212:/i),description:bonus});
 Object.assign(wine,{price:'금화 '+wineGold+' / '+wineQty+'회분',acquisition:'아그라바 선술집 《푸른 황소》',acquisitionSource:line('interaction_city',/^IF interaction_city = 30411:/i),description:bonus});
 const calls=[];for(const [name,body]of locations)for(const l of body.split(/\r?\n/))if(!/^\s*!/.test(l)&&/\b(?:gs|gt|func)\s*[\s(]\s*'jo9_agraba_food_reward'/.test(l))calls.push(name);
 Object.assign(premium,{price:'현재 구매처 없음',acquisition:calls.length?'지급 경로: '+calls.join(' / '):'획득 이벤트 미연결 · 현재 일반 플레이 입수처 없음',acquisitionSource:'jo9_agraba_food_reward:1 · $food_choice',description:bonus+' 내부 지급 함수는 12회분 묶음을 준비하지만, 현재 호출하는 획득 이벤트는 없다.'});
 data.meta={generatedAt:new Date().toISOString(),source:'WORK',qspSha256:doc.hash};
 const traitNote=' 신규 상위 특성의 발현·치료와 기존 시루 보정을 현재 코드에 대조했습니다.';
 const itemNote=' 특별요리 재료의 가격·지급 수량과 획득 이벤트 연결 여부도 현재 코드에 대조했습니다.';
 if(!data.traits.coverage.includes(traitNote.trim()))data.traits.coverage+=traitNote;
 if(!data.items.coverage.includes(itemNote.trim()))data.items.coverage+=itemNote;
 return data;
}
module.exports={apply};
