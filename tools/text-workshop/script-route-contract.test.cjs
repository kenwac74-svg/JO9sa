'use strict';
// The route UI pins a validated boundary point, not a guessed stage index.
// This fixture stays entirely in memory and never opens an installed game.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('./core.cjs');
const scenes=require('./scenes.cjs');

const library=[
 "$route_text[1] = '[안내]<br>선택 시작보다 앞의 문장'",
 "$route_text[2] = '[안내]<br>고정할 중간 시작'",
 "$route_text[3] = '[안내]<br>첫 번째 기본 대사'",
 "if first_route = 1:",
 " $route_text[3] = '[안내]<br>첫 번째 선택 분기'",
 'end',
 "$route_text[4] = '[안내]<br>분기 사이 공통 대사'",
 "$route_text[5] = '[안내]<br>두 번째 기본 대사'",
 "if second_route = 1:",
 " $route_text[5] = '[안내]<br>두 번째 선택 분기'",
 'end',
 "$route_text[6] = '[안내]<br>고정할 마무리'",
 "$route_text[7] = '[안내]<br>마무리 뒤의 제외 문장'",
].join('\r\n');
const event=[
 'if interaction_city = 42:',
 ' $text[0] = $dynamic_intro',
 " copyarr '$text', '$route_text'",
 " *p '<a href=\"EXEC: interaction_city=43 & gt ''interaction_city''\">선택할 다음 장면</a><a href=\"EXEC: interaction_city=44 & gt ''interaction_city''\">선택하지 않을 장면</a>'",
 'end',
 'if interaction_city = 43:',
 " $text[1] = '[안내]<br>선택한 다음 장면 첫 대사'",
 " $text[2] = '[안내]<br>선택한 다음 장면 마무리'",
 " $text[3] = '[안내]<br>다음 장면 마무리 뒤 제외'",
 'end',
 'if interaction_city = 44:',
 " $text[1] = '[안내]<br>고르지 않은 장면 대사'",
 'end',
 'if interaction_city = 45:',
 " $text[1] = '[안내]<br>목적지가 겹치는 선택지 앞 대사'",
 " *p '<a href=\"EXEC: interaction_city=43 & gt ''interaction_city''\">아침에 만나기</a><a href=\"EXEC: interaction_city=43 & gt ''interaction_city''\">저녁에 만나기</a><a href=\"EXEC: interaction_city=44 & gt ''interaction_city''\">다른 사람 만나기</a>'",
 'end',
].join('\r\n');
const lines=['QSPGAME','','',core.shift('2',-5)];
for(const [name,body]of [['#txt_man',library],['interaction_city',event]]){
 lines.push(core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5));
}
lines.push('');
const doc=core.parse(core.serialize({lines}));
const entries=core.entries(doc),nav=scenes.buildNavigator(doc,entries);
function point(text){
 const entry=entries.find(e=>e.text.endsWith(text));assert(entry,text);
 const context=nav.context({...entry,hash:doc.hash},undefined,'text');
 assert.equal(context.flow.usage.location,'interaction_city');
 return {
  location:context.flow.usage.location,
  sceneId:context.flow.usage.sceneId,
  edition:'man',
  selection:context.selection,
 };
}
function validated(text,role='end'){
 return nav.scriptBoundary({hash:doc.hash,role,point:point(text)});
}
function pin(choices,boundary){
 const p=boundary.selected,e=p.selection;
 choices[p.location.toLowerCase()+':'+p.sceneId+':page:'+p.at]=[
  e.location.toLowerCase(),e.fieldIndex,e.start,e.end,
 ].join(':');
 return choices;
}
const start=validated('고정할 중간 시작','start').selected;
const end=validated('고정할 마무리').selected;
const range=choices=>nav.scriptRange({hash:doc.hash,start,end,choices});

test('고정 키는 표시 단계가 아닌 검증된 unit 위치와 실제 실행 장면을 사용한다',()=>{
 const selected=validated('첫 번째 선택 분기');
 assert.equal(selected.selected.selection.location,'#txt_man');
 assert.equal(selected.selected.location,'interaction_city');
 const context=nav.context(selected.selected.selection,undefined,'text');
 assert.equal(context.flow.selected,3);
 assert.equal(selected.selected.at,3); // Dynamic unit 0 precedes visible stage 1.
 assert.notEqual(selected.selected.at,context.flow.selected-1);
 const anchor=validated('고정할 중간 시작','start');
 assert.equal(anchor.needsConfirmation,true);
 assert.match(anchor.proposed.selection.text,/선택 시작보다 앞/);
 assert.equal(anchor.selected.selection.text,start.selection.text);
});

test('중간 시작에서 두 분기를 각각 고정하면 선택한 루트와 공통 대사만 한 각본으로 출력한다',()=>{
 const choices={};
 const firstPrompt=range(choices);
 assert.equal(firstPrompt.status,'choice');
 pin(choices,validated('첫 번째 선택 분기'));
 const secondPrompt=range(choices);
 assert.equal(secondPrompt.status,'choice');
 assert.notEqual(firstPrompt.choice.id,secondPrompt.choice.id);
 pin(choices,validated('두 번째 선택 분기'));
 const before=JSON.stringify(choices),result=range(choices);
 assert.equal(JSON.stringify(choices),before,'Backend must not consume or clear pinned choices.');
 assert.equal(result.status,'ready');
 assert.deepEqual(result.stats,{scenes:1,pages:5,choices:2,dynamic:0});
 for(const text of ['고정할 중간 시작','첫 번째 선택 분기','분기 사이 공통 대사','두 번째 선택 분기','고정할 마무리'])assert(result.text.includes(text),text);
 for(const text of ['선택 시작보다 앞의 문장','첫 번째 기본 대사','두 번째 기본 대사','마무리 뒤의 제외 문장','$dynamic_intro'])assert(!result.text.includes(text),text);
 const expected=['고정할 중간 시작','첫 번째 선택 분기','분기 사이 공통 대사','두 번째 선택 분기','고정할 마무리'];
 assert.deepEqual(Object.keys(result.map),expected.map((_text,i)=>'S1-P'+(i+1)));
 for(const [i,text]of expected.entries()){
  const actual=result.map['S1-P'+(i+1)],wanted=point(text).selection;
  assert.equal(actual.hash,doc.hash);
  for(const field of ['location','fieldIndex','start','end','text'])assert.equal(actual[field],wanted[field],text+' / '+field);
 }
});

test('마무리를 재확인해도 누적한 분기 선택이 그대로 적용되며 기본·조건 혼합 선택도 보존한다',()=>{
 const choices={};
 pin(choices,validated('첫 번째 기본 대사'));
 pin(choices,validated('두 번째 선택 분기'));
 const confirmedEnd=validated('고정할 마무리').selected;
 const result=nav.scriptRange({hash:doc.hash,start,end:confirmedEnd,choices});
 assert.equal(result.status,'ready');
 assert.match(result.text,/첫 번째 기본 대사/);
 assert.match(result.text,/두 번째 선택 분기/);
 assert.doesNotMatch(result.text,/첫 번째 선택 분기|두 번째 기본 대사|마무리 뒤의 제외 문장/);
 assert.equal(result.stats.choices,2);
 assert.equal(Object.keys(choices).length,2);
});

test('잘못된 표시 단계 번호로 만든 고정 키를 다른 대사 선택으로 오인하지 않는다',()=>{
 const choices={};
 pin(choices,validated('첫 번째 선택 분기'));
 const second=validated('두 번째 선택 분기');
 const correctKey=second.selected.location.toLowerCase()+':'+second.selected.sceneId+':page:'+second.selected.at;
 const wrongKey=second.selected.location.toLowerCase()+':'+second.selected.sceneId+':page:'+(second.selected.at-1);
 pin(choices,second);
 choices[wrongKey]=choices[correctKey];delete choices[correctKey];
 const result=range(choices);
 assert.equal(result.status,'choice');
 assert.equal(result.choice.id,correctKey);
 assert(result.choice.options.some(option=>option.preview.includes('두 번째 선택 분기')));
});

test('실제 다음 장면 선택은 같은 분기를 내보내기에서 다시 묻지 않도록 고정할 수 있다',()=>{
 const destination=point('선택한 다음 장면 첫 대사');
 const picked=nav.scriptBoundary({hash:doc.hash,role:'end',point:destination,fromPoint:point('고정할 마무리')});
 assert(picked.routeChoice,'Boundary must expose the unique selected scene route.');
 const choices={};
 pin(choices,validated('첫 번째 선택 분기'));
 pin(choices,validated('두 번째 선택 분기'));
 const beforeRoute=nav.scriptRange({hash:doc.hash,start,end:point('선택한 다음 장면 마무리'),choices});
 assert.equal(beforeRoute.status,'choice');
 assert.equal(picked.routeChoice.id,beforeRoute.choice.id);
 const option=beforeRoute.choice.options.find(o=>o.label==='선택할 다음 장면');
 assert.equal(picked.routeChoice.optionId,option.id);
 choices[picked.routeChoice.id]=picked.routeChoice.optionId;
 const result=nav.scriptRange({hash:doc.hash,start,end:point('선택한 다음 장면 마무리'),choices});
 assert.equal(result.status,'ready');
 assert.equal(result.stats.scenes,2);
 assert.match(result.text,/선택한 다음 장면 첫 대사/);
 assert.match(result.text,/선택한 다음 장면 마무리/);
 assert.doesNotMatch(result.text,/고르지 않은 장면 대사|다음 장면 마무리 뒤 제외/);
 assert.equal(picked.selected.at,validated('선택한 다음 장면 첫 대사').selected.at);
});

test('같은 목적지의 서로 다른 선택지는 장면만 보고 경로를 추측하지 않는다',()=>{
 const destination=point('선택한 다음 장면 첫 대사');
 const fromPoint=point('목적지가 겹치는 선택지 앞 대사');
 const picked=nav.scriptBoundary({hash:doc.hash,role:'end',point:destination,fromPoint});
 assert.equal(picked.routeChoice,undefined);
 const result=nav.scriptRange({hash:doc.hash,start:fromPoint,end:point('선택한 다음 장면 마무리')});
 assert.equal(result.status,'choice');
 assert.equal(result.choice.options.length,3);
 assert(result.choice.options.some(o=>o.label==='아침에 만나기'));
 assert(result.choice.options.some(o=>o.label==='저녁에 만나기'));
});

test('경로 고정의 fromPoint도 최신 원문으로 검증하고 같은 장면에는 이동 선택을 만들지 않는다',()=>{
 const destination=point('선택한 다음 장면 첫 대사');
 const stale=structuredClone(start);stale.selection.hash='outdated';
 assert.throws(()=>nav.scriptBoundary({hash:doc.hash,role:'end',point:destination,fromPoint:stale}),/원문이 바뀌/);
 const local=nav.scriptBoundary({hash:doc.hash,role:'end',point:end,fromPoint:start});
 assert.equal(local.routeChoice,undefined);
 const legacy=nav.scriptBoundary({hash:doc.hash,role:'end',point:end});
 assert.equal(legacy.routeChoice,undefined);
 assert.equal(legacy.selected.at,end.at);
});

function directFixture(dynamic=''){
 const body=[
  'if interaction_city = 1:',
  " $text[1] = '[안내]<br>첫 장면 고정 시작'",
  " $text[2] = '[안내]<br>버린 기본문은 출력 금지'",
  ' if alternate = 1:',
  "  $text[2] = '[안내]<br>고른 조건 대사'",
  ' end',
  " $text[3] = '[안내]<br>첫 장면 끝 대사'",
  dynamic,
  " *p '<a href=\"EXEC: interaction_city=2 & gt ''interaction_city''\">다음 장면으로</a>'",
  'end',
  'if interaction_city = 2:',
  " $text[1] = '[후속]<br>두 번째 장면 마무리'",
  'end',
 ].join('\r\n');
 const parts=['QSPGAME','','',core.shift('1',-5),core.shift('interaction_city',-5),'',core.shift(body,-5),core.shift('0',-5),''];
 const fixtureDoc=core.parse(core.serialize({lines:parts}));
 const fixtureEntries=core.entries(fixtureDoc),navigator=scenes.buildNavigator(fixtureDoc,fixtureEntries);
 const pointAt=text=>{
  const entry=fixtureEntries.find(e=>e.text.endsWith(text));assert(entry,text);
  const context=navigator.context({...entry,hash:fixtureDoc.hash},undefined,'text');
  return {location:context.flow.usage.location,sceneId:context.flow.usage.sceneId,selection:context.selection};
 };
 const start=pointAt('첫 장면 고정 시작'),end=pointAt('두 번째 장면 마무리');
 const branch=navigator.scriptBoundary({hash:fixtureDoc.hash,role:'end',point:pointAt('고른 조건 대사')});
 const choices=pin({},branch);
 return {doc:fixtureDoc,navigator,start,end,export:()=>navigator.scriptRange({hash:fixtureDoc.hash,start,end,choices})};
}

test('장면을 넘어 출력할 때 이미 처리한 정적 문자열을 실행 중 페이지로 다시 덤프하지 않는다',()=>{
 const fixture=directFixture(),result=fixture.export();
 assert.equal(result.status,'ready');
 assert.equal(result.stats.scenes,2);
 assert.equal(result.stats.pages,4);
 assert.equal(result.stats.dynamic,0,'All fixture pages are static quoted assignments.');
 assert.match(result.text,/고른 조건 대사/);
 assert.match(result.text,/두 번째 장면 마무리/);
 assert.doesNotMatch(result.text,/버린 기본문은 출력 금지|\$text\s*\[|실행 중 결정/);
});

test('실제 동적 페이지는 추정하지 않고 코드와 내부 문자열이 없는 메타 안내만 출력한다',()=>{
 const fixture=directFixture(' $text[9] = $runtime_secret_page'),result=fixture.export();
 assert.equal(result.status,'ready');
 assert.equal(result.stats.dynamic,1);
 assert.match(result.text,/실행 중 결정/);
 assert.doesNotMatch(result.text,/버린 기본문은 출력 금지|\$text\s*\[|runtime_secret_page/);
 const broad=fixture.navigator.script({hash:fixture.doc.hash,location:fixture.start.location,sceneId:fixture.start.sceneId});
 assert.equal(broad.stats.dynamic,1);
 assert.doesNotMatch(broad.text,/\$text\s*\[\s*9\s*\]\s*=|runtime_secret_page/);
});

test('동적 표현식의 내부 문자열과 계산 전 접두문도 독립 대사로 출력하지 않는다',()=>{
 for(const expression of [
  " $text[9] = $iif(flag = 1, '[내부] 실행 전에는 고를 수 없는 문구', $runtime_page)",
  " $text[9] = '[내부] 계산 전 문자열' + $runtime_suffix",
 ]){
  const result=directFixture(expression).export();
  assert.equal(result.status,'ready');
  assert.equal(result.stats.pages,4);
  assert.equal(result.stats.dynamic,1);
  assert.match(result.text,/실행 중 결정/);
  assert.doesNotMatch(result.text,/실행 전에는 고를 수 없는 문구|계산 전 문자열|runtime_page|runtime_suffix|\$iif|\$text\s*\[/);
 }
});
