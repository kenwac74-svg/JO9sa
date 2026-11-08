'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const core=require('./core.cjs'),scenes=require('./scenes.cjs');
const source=[
"if interaction_city = 1:",
" $text[1] = '[상인]<br>첫 인사'",
" $text[2] = '[손님]<br>중간 대사'",
" $text[3] = '[상인]<br>구매 안내'",
" *p '<a href=\"EXEC: interaction_city=2 & gt ''interaction_city''\">물건 보기</a><a href=\"EXEC: interaction_city=3 & gt ''interaction_city''\">다른 길</a>'",
"end",
"if interaction_city = 2:",
" $text[1] = '[상인]<br>물건 설명'",
" $text[2] = '[손님]<br>마무리 대사'",
" $text[3] = '[상인]<br>포함하면 안 되는 뒷말'",
"end",
"if interaction_city = 3:",
" $text[1] = '[안내]<br>다른 분기'",
"end",
"if interaction_city = 4:",
" $text[1] = '[상인]<br>분기 시험 시작'",
" $text[2] = '[상인]<br>기본 안내문'",
" if special = 1:",
"  $text[2] = '[상인]<br>특별 안내문'",
" end",
" $text[3] = '[손님]<br>분기 시험 끝'",
"end",
].join('\r\n');
const lines=['QSPGAME','','',core.shift('1',-5),core.shift('interaction_city',-5),'',core.shift(source,-5),core.shift('0',-5),''];
const doc=core.parse(core.serialize({lines})),entries=core.entries(doc),nav=scenes.buildNavigator(doc,entries);
function point(text){const e=entries.find(e=>e.text.endsWith(text));a(e,text);const c=nav.context({...e,hash:doc.hash},undefined,'text');return {location:c.flow?.usage?.location||c.location,sceneId:c.flow?.usage?.sceneId||c.scene.id,selection:{...e,hash:doc.hash}};}
const first=point('첫 인사'),middle=point('중간 대사'),end=point('마무리 대사'),last=point('포함하면 안 되는 뒷말');
test('중간을 시작으로 잡으면 실제 시작을 제안한다',()=>{
 const r=nav.scriptBoundary({hash:doc.hash,role:'start',point:middle});a(r.needsConfirmation);a.equal(r.proposed.selection.text,first.selection.text);
});
test('중간을 마무리로 잡으면 실제 마지막을 제안한다',()=>{
 const r=nav.scriptBoundary({hash:doc.hash,role:'end',point:end});a(r.needsConfirmation);a.equal(r.proposed.selection.text,last.selection.text);
});
test('선택지 버튼을 예상 마무리 대사로 오인하지 않는다',()=>{
 const r=nav.scriptBoundary({hash:doc.hash,role:'end',point:first});a.equal(r.proposed.selection.text,point('구매 안내').selection.text);
});
test('갈림길은 자동 추측하지 않고 선택하게 한다',()=>{
 const r=nav.scriptRange({hash:doc.hash,start:first,end});a.equal(r.status,'choice');a.equal(r.choice.options.length,2);a(r.choice.options.some(o=>o.label==='물건 보기'));
});
test('선택 경로와 양끝을 포함하고 마무리 뒤를 제외한다',()=>{
 const r=nav.scriptRange({hash:doc.hash,start:first,end}),pick=r.choice.options.find(o=>o.label==='물건 보기');
 const done=nav.scriptRange({hash:doc.hash,start:first,end,choices:{[r.choice.id]:pick.id}});
 a.equal(done.status,'ready');a.match(done.text,/첫 인사/);a.match(done.text,/중간 대사/);a.match(done.text,/물건 설명/);a.match(done.text,/마무리 대사/);a.doesNotMatch(done.text,/포함하면 안 되는 뒷말/);a.doesNotMatch(done.text,/안내: 다른 분기/);
});
test('시작보다 앞의 마무리 및 오래된 QSP 선택을 거부한다',()=>{
 a.throws(()=>nav.scriptRange({hash:doc.hash,start:middle,end:first}),/앞에/);
 a.throws(()=>nav.scriptRange({hash:'old',start:first,end}),/QSP/);
});
test('같은 이벤트의 선택 구간도 한 파일로 만든다',()=>{
 const r=nav.scriptRange({hash:doc.hash,start:first,end:middle});a.equal(r.status,'ready');a.equal(r.stats.pages,2);a.doesNotMatch(r.text,/구매 안내/);
});
test('선택한 경로가 끝에 닿지 않으면 다른 분기를 고르게 한다',()=>{
 const r=nav.scriptRange({hash:doc.hash,start:first,end}),pick=r.choice.options.find(o=>o.label==='다른 길');
 const retry=nav.scriptRange({hash:doc.hash,start:first,end,choices:{[r.choice.id]:pick.id}});
 a.equal(retry.status,'choice');a.match(retry.choice.title,/닿지/);a.equal(retry.choice.id,r.choice.id);
});
test('중간의 조건부 대사도 하나를 고르게 한다',()=>{
 const args={hash:doc.hash,start:point('분기 시험 시작'),end:point('분기 시험 끝')};
 const r=nav.scriptRange(args);a.equal(r.status,'choice');a.equal(r.choice.options.length,2);
 const selected=r.choice.options.find(o=>o.preview.includes('특별 안내문'));
 const ready=nav.scriptRange({...args,choices:{[r.choice.id]:selected.id}});
 a.equal(ready.status,'ready');a.match(ready.text,/특별 안내문/);a.doesNotMatch(ready.text,/기본 안내문/);
});
