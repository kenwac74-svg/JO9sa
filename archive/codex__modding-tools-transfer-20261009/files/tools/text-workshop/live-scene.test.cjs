'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const live=require('./live-scene.cjs');
const entry=(text,n)=>({text,dialogue:true,field:'body',location:'interaction_city',fieldIndex:2,start:n,end:n+text.length,line:n,hash:'test'});
const context=e=>({selection:e,scene:{id:'event'+e.line,title:'interaction_city = '+e.line},images:[{path:'scene/shared.png'}]});
test('captures rendered dialogue and references without script/style/comment content',()=>{
 const p=live.parse('<script>malicious()</script><style>hidden</style><div id="text">[상인]<br>어서 와요, 켄님. &amp; 물건을 보세요.<!-- #nwtx --></div><div id="side_panel_text">인물의 배경.</div>');
 assert.equal(p.text,'[상인] 어서 와요, 켄님. & 물건을 보세요.');assert.equal(p.referenceText,'인물의 배경.');assert(!JSON.stringify(p).includes('malicious'));
});
test('uses dialogue text to distinguish events sharing one image and expands QSP names safely',()=>{
 const entries=[entry('[상인]<br>어서 와요, <<$master_name>>님. 물건을 보세요.',10),entry('[경비]<br>지금은 통행할 수 없습니다. 돌아가세요.',20)];
 const r=live.match({text:'[상인] 어서 와요, 켄님. 물건을 보세요.',resources:[{path:'content/pic/scene/shared.png'}]},entries,context);
 assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].selection.line,10);assert(r.confident);
});
test('does not silently pick an event when identical dialogue and image remain ambiguous',()=>{
 const text='[상인]<br>이 거래 조건은 이전과 같습니다.';const r=live.match({text:'[상인] 이 거래 조건은 이전과 같습니다.',resources:[{path:'content/pic/scene/shared.png'}]},[entry(text,10),entry(text,20)],context);
 assert.equal(r.candidates.length,2);assert.equal(r.confident,false);
});
test('preserves case and numbered filenames in captured image paths',()=>{
 const p=live.parse('<div id="text">현재 장면의 대사입니다.</div><img src="content\\pic\\characters\\Sultan (2).png"><img src="content/pic/characters/sultan.png">');
 assert.deepEqual(p.resources.map(x=>x.path),['content/pic/characters/Sultan (2).png','content/pic/characters/sultan.png']);
});
test('uses the observed numbered cut as evidence for an array-use scene',()=>{
 const e=entry('[상인]<br>어서 오세요. 기다리고 있었습니다.',10);const resolve=(selected,usageId)=>({selection:selected,scene:{id:'array',title:'소개'},images:[],flow:{usages:[{id:'one',title:'첫 이벤트'},{id:'two',title:'둘째 이벤트'}],usage:{id:usageId||'one'},stageImages:[{path:usageId==='two'?'scene/two.png':'scene/one.png'}]}});
 const r=live.match({text:'[상인] 어서 오세요. 기다리고 있었습니다.',resources:[{path:'content/pic/scene/two.png'}]},[e],resolve);
 assert(r.confident);assert.equal(r.candidates[0].usageId,'two');
});
test('returns no editable target for UI-only output or a nonmatching page',()=>{
 const r=live.match({text:'돈 1000000 위치 개인실',resources:[]},[entry('이것은 다른 이벤트의 대사입니다.',1)],context);assert.equal(r.candidates.length,0);assert.equal(r.confident,false);
});

test('truncated duplicate candidate search never auto-selects a scene',()=>{const text='[상인] 이 거래 조건은 이전과 같습니다.';const entries=Array.from({length:41},(_,i)=>({text,dialogue:true,location:'event',fieldIndex:2,start:i,line:i}));const r=live.match({text,resources:[{path:'content/pic/bg/match.png'}]},entries,e=>({selection:e,scene:{id:String(e.line),title:'상점'},images:[{path:e.line===0||e.line===40?'bg/match.png':'bg/other.png'}]}));assert.equal(r.confident,false);});
