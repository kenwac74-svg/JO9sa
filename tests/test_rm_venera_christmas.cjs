// 이벤트 조건 회귀 검사. 실제 게임 플레이 검증과 구별한다.
const fs=require('fs'),assert=require('node:assert/strict'),{test}=require('node:test'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw);assert(c.serialize(d).equals(raw));
const b=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),city=b('interaction_city');
function event(id){const marker='IF interaction_city = '+id+':',start=city.indexOf(marker);assert(start>=0);const end=city.indexOf('\r\nIF interaction_city = ',start+marker.length);return city.slice(start,end<0?city.length:end);}
test('베네라 구입 완료 기록이 메뉴 조건을 닫으며 옛 세이브와 부족한 잔액도 차단',()=>{
 const route=event(6540),opts=b('#options');
 assert(route.includes('unique_slave["venera"] = 1'),'Missing completed acquisition flag');
 assert(route.includes("if unique_slave['venera'] ! 0 or venera ! 0 or slave_state ! CONST_INT['no_slave'] or active[$quest[14]] ! 1 or sparks < 10000: gt 'shop_general'"),'Entry guard before generating/replacing slave');
 assert(route.indexOf('if unique_slave')<route.indexOf("gs 'generate_stock'"));
 const lines=opts.split('\r\n').filter(l=>/IF unique_slave\["venera"\]/.test(l));assert.equal(lines.length,2);for(const l of lines)assert(l.includes('and venera = 0'));
 // Menu and entry share the same business boundaries; simulate two purchases.
 const eligible=s=>s.unique===0&&s.legacy===0&&s.empty&&s.quest===1&&s.cash>=10000;
 for(const cash of [9999,10000,10001])for(const legacy of [0,1])for(const unique of [0,1]){
  const s={cash,legacy,unique,empty:true,quest:1},ok=eligible(s);assert.equal(ok,cash>=10000&&!legacy&&!unique);
  if(ok){s.cash-=10000;s.legacy=1;s.unique=1;assert(!eligible(s),'repeat acquisition must close');}
 }
 assert(!eligible({cash:100000,legacy:0,unique:0,empty:false,quest:1}));
});
test('크리스마스 의뢰 전달이 경매/최종 진행 단계를 되돌리지 않음',()=>{
 const r=event(10375);assert(!/^[ \t]*active\[\$event\['спасение_рождества'\]\]\s*=\s*6\s*$/m.test(r),'Quest stage rewound by handover');
 assert(r.includes("npc_progress['shlyapkin'] = 2"));assert(r.includes("gs 'killslave'"));assert(r.includes('sparks += 3500'));
 for(const stage of [6,7,8,9]){const assignment=r.match(/^[ \t]*active\[\$event\['спасение_рождества'\]\]\s*=\s*(\d+)/m);const after=assignment?Number(assignment[1]):stage;assert.equal(after,stage);assert.equal(after===8,stage===8);assert.equal(after===9,stage===9);}
});
test('주택 소유 긍정 강제 효과를 가져오지 않고 기존 생활비/성장 조건 유지',()=>{
 assert(!b('moodlets').slice(0,2000).includes('or owner = 1'));assert(b('billing').includes('if owner = 0 and demo_game = 0: rental_cost += estate_cost_main[$estate]'));
 if(process.argv[3]){const old=c.parse(fs.readFileSync(process.argv[3]));for(const n of ['moodlets','billing','next_day'])assert.equal(b(n),c.shift(old.lines[old.locations.find(l=>l.name===n).body],5));}
});
