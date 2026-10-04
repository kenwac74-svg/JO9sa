'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),core=require('./core.cjs'),scenes=require('./scenes.cjs');
function make(){
 const defs=[['town',`if hero_choice < 100:
 if town = 1:
  *pl '처음 대사'
  *pl '둘째 대사'
  if mood = 1:
   *pl '밝은 반응'
  else
   *pl '담담한 반응'
  end
  *pl '<a href="exec: town = 2 & gt ''town''">가게로</a>'
  act '숲으로':
   gt 'forest', 'entry'
  end
  if coins > 5: gs 'helper'
  *pl '<a href="exec: dynamic $next">정해지지 않은 선택</a>'
 end
 if town = 2:
  *pl '가게 장면'
  gt $curloc
 end
end
! gt 'missing'
*pl 'if town = 999: gt ''missing'''
if npc ! 9: *pl '부등호 뒤 대사'`],['forest',`if $args[0] = 'entry':
 *pl '숲의 입구'
elseif $args[0] = 'exit':
 *pl '숲의 출구'
end`],['helper',`*pl '도움말'`]];
 const lines=['QSPGAME','head','',core.shift(String(defs.length),-5)];for(const [name,body] of defs)lines.push(core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5));lines.push('');return core.parse(Buffer.from(lines.join('\r\n'),'utf16le'));
}
test('장면 범위, 앞뒤 대사, 주석과 문자열 안의 가짜 명령 제외',()=>{const d=make(),entries=core.entries(d),nav=scenes.buildNavigator(d,entries),entry=entries.find(e=>e.text==='처음 대사');const c=nav.context({...entry,hash:d.hash});assert.equal(c.scene.title,'town = 1');assert.equal(c.previous,null);assert.equal(c.next.text,'둘째 대사');assert.ok(!c.texts.some(e=>e.text==='가게 장면'));assert.ok(!c.branches.some(b=>b.target==='missing'));assert.ok(entries.some(e=>e.text==='부등호 뒤 대사'));});
test('HTML 선택지의 상태 변경, ACT 분기, args 경로 연결, 동적 분기는 미확정',()=>{const d=make(),entries=core.entries(d),nav=scenes.buildNavigator(d,entries),c=nav.context({...entries.find(e=>e.text==='처음 대사'),hash:d.hash});const shop=c.branches.find(b=>b.label==='가게로');assert.equal(shop.destinations[0].title,'town = 2');assert.equal(nav.open(shop.destinations[0]).selection.text,'가게 장면');const forest=c.branches.find(b=>b.label==='숲으로');assert.equal(forest.destinations[0].title,"$args[0] = 'entry'");assert.equal(nav.open(forest.destinations[0]).selection.text,'숲의 입구');assert.ok(c.branches.find(b=>b.target==='helper').conditions.includes('coins > 5'));assert.equal(c.branches.find(b=>b.label==='정해지지 않은 선택').destinations.length,0);});
test('else/elseif, 재방문과 오래된 원문 차단',()=>{const d=make(),entries=core.entries(d),nav=scenes.buildNavigator(d,entries),entry=entries.find(e=>e.text==='숲의 출구');assert.equal(nav.context({...entry,hash:d.hash}).scene.title,"$args[0] = 'exit'");assert.throws(()=>nav.context({...entry,hash:'stale'}),/바뀌/);assert.deepEqual(core.serialize(d),core.serialize(core.parse(core.serialize(d))));});
test('방문 기록이 없는 장면의 실제 진입 경로 찾기',()=>{const d=make(),entries=core.entries(d),nav=scenes.buildNavigator(d,entries),c=nav.context({...entries.find(e=>e.text==='가게 장면'),hash:d.hash});const incoming=nav.incoming({hash:d.hash,location:c.location,sceneId:c.scene.id});assert.ok(incoming.items.some(e=>e.source.title==='town = 1'&&!e.uncertain));assert.ok(!incoming.items.some(e=>e.source.title==='town = 2'));assert.throws(()=>nav.incoming({hash:'stale',location:'town',sceneId:'root'}),/바뀌/);});
test('다른 위치로 이동하지 않는 조건별 대사 분기도 열기',()=>{const d=make(),entries=core.entries(d),nav=scenes.buildNavigator(d,entries),c=nav.context({...entries.find(e=>e.text==='처음 대사'),hash:d.hash});const b=c.branches.find(b=>b.mode==='condition'&&b.label==='mood = 1');assert.ok(b);const arm=nav.open(b.destinations[0]);assert.equal(arm.selection.text,'밝은 반응');assert.ok(!arm.texts.some(e=>e.text==='담담한 반응'));const other=c.branches.find(b=>b.mode==='condition'&&b.label==='그 외 (else)');assert.equal(nav.open(other.destinations[0]).selection.text,'담담한 반응');});
test('보기 모드: 대사만 / 코드까지, 장면 이미지 후보',()=>{
 const defs=[['room',`if room = 1:
 $place = 'roomplace'
 $special_bg = 'scene\\room\\room-1'
 $special_image[2] = 'scene\\room\\room-2.png'
 $who = 'slave, assistant'
 *pl '방에 들어선다.'
 *pl '<img src="content/pic/bg/room.png">'
end`]];
 const lines=['QSPGAME','head','',core.shift('1',-5)];for(const [n,b] of defs)lines.push(core.shift(n,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');
 const d=core.parse(Buffer.from(lines.join('\r\n'),'utf16le')),entries=core.entries(d),nav=scenes.buildNavigator(d,entries),e=entries.find(x=>x.text==='방에 들어선다.');
 const t=nav.context({...e,hash:d.hash},undefined,'text'),a=nav.context({...e,hash:d.hash},undefined,'all');
 assert.ok(!t.texts.some(x=>x.text==='slave, assistant'));assert.ok(a.texts.some(x=>x.text==='slave, assistant'));
 assert.deepEqual(t.screen.map(x=>x.text),['방에 들어선다.']);
 assert.deepEqual(t.images,['bg\\roomplace','scene\\room\\room-1','scene\\room\\room-2.png','content/pic/bg/room.png']);
 const o=nav.open({location:'room',sceneId:t.scene.id},'text');assert.equal(o.selection.text,'방에 들어선다.');
});
module.exports={make};
