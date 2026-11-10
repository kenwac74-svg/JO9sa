'use strict';
// Behavioral regression: fixed screenplay start and selected path survive browsing.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test'),a=require('node:assert/strict');
const root=process.env.JO9_RANGE_ROOT||'G:/somi/JO9sa/tools/text-workshop';
const core=require(path.join(root,'core.cjs')),scenes=require(path.join(root,'scenes.cjs'));

function fixture(){
 const source=[
  'if interaction_city = 1:',
  " $text[1] = '[안내] 이벤트 첫 대사'",
  " $text[2] = '[안내] 시작 이전 대사'",
  " $text[3] = '[안내] 고정할 중간 시작'",
  " $text[4] = '[안내] 고르지 않은 기본문 A'",
  ' if option_a = 1:',
  "  $text[4] = '[안내] 선택한 분기 A'",
  ' end',
  " $text[5] = '[안내] 고르지 않은 기본문 B'",
  ' if option_b = 1:',
  "  $text[5] = '[안내] 선택한 분기 B'",
  ' end',
  " $text[6] = '[안내] 고정할 마무리'",
  " *p '<a href=\"EXEC: interaction_city=2 & gt ''interaction_city''\">선택한 후속 장면</a><a href=\"EXEC: interaction_city=3 & gt ''interaction_city''\">다른 후속 장면</a>'",
  'end',
  'if interaction_city = 2:',
  " $text[1] = '[후속] 고른 장면의 첫 대사'",
  " $text[2] = '[후속] 고른 장면의 마무리'",
  'end',
  'if interaction_city = 3:',
  " $text[1] = '[다른길] 포함하면 안 되는 후속 장면'",
  'end',
 ].join('\r\n');
 const lines=['QSPGAME','','',core.shift('1',-5),core.shift('interaction_city',-5),'',core.shift(source,-5),core.shift('0',-5),''];
 const doc=core.parse(core.serialize({lines})),entries=core.entries(doc),nav=scenes.buildNavigator(doc,entries);
 const entry=tail=>({...entries.find(e=>e.text.endsWith(tail)),hash:doc.hash});
 return {doc,nav,first:entry('이벤트 첫 대사'),start:entry('고정할 중간 시작'),branchA:entry('선택한 분기 A'),defaultA:entry('고르지 않은 기본문 A'),branchB:entry('선택한 분기 B'),end:entry('고정할 마무리'),followStart:entry('고른 장면의 첫 대사'),followEnd:entry('고른 장면의 마무리')};
}

function setup(saved){
 const f=fixture(),els=new Map(),listeners={},requests=[],storage=new Map();
 if(saved)storage.set('jo9-script-range',saved);
 const makeNode=()=>({textContent:'',value:'',disabled:false,hidden:false,open:false,children:[],dataset:{},style:{},attrs:{},classList:{add(){},remove(){},toggle(){}},
  get childElementCount(){return this.children.length;},
  append(...xs){this.children.push(...xs);},prepend(...xs){this.children.unshift(...xs);},replaceChildren(...xs){this.children=xs;},add(x){this.children.push(x);},
  setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,fn){this[k]=fn;},querySelector(){return null;},querySelectorAll(){return [];},scrollIntoView(){},focus(){},remove(){},click(){return this.onclick?.();}});
 const $=id=>{if(!els.has(id))els.set(id,makeNode());return els.get(id);};
 let current;
 const emit=(name,detail)=>{for(const fn of listeners[name]||[])fn({type:name,detail});};
 const scope={document:{getElementById:$,createElement:makeNode,createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],body:makeNode()},
  window:{addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn);},dispatchEvent:event=>{emit(event.type,event.detail);},JO9WorkshopUI:{current:()=> 'script'}},
  sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  Event:class{constructor(type){this.type=type;}},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail;}},Option:class{constructor(label,value){this.text=label;this.value=value;}},
  console,Blob,URL,setTimeout,clearTimeout,
  api:async(url,payload)=>{requests.push({url,payload:JSON.parse(JSON.stringify(payload))});
   if(url==='/api/script/boundary')return f.nav.scriptBoundary(payload);
   if(url==='/api/script/range'){const r=f.nav.scriptRange(payload);return payload.save&&r.status==='ready'?{...r,savedPath:'G:/qa/runtime/script-exports/route.txt'}:r;}
   throw Error('Unexpected API '+url);
  },
  selectEntry:async(entry,sceneId)=>{current=f.nav.context(entry,sceneId,'text',current?.flow?.usage?.id);emit('jo9:selection',current);return current;},
 };
 vm.runInNewContext(fs.readFileSync(path.join(root,'script-range.js'),'utf8'),scope);
 const select=entry=>scope.selectEntry(entry,current?.scene?.id,false);
 const ui=scope.window.JO9ScriptRange;
 const selectedChoice=entry=>{const c=f.nav.context(entry,undefined,'text'),point={selection:entry,location:c.flow?.usage?.location||c.location,sceneId:c.flow?.usage?.sceneId||c.scene.id};const b=f.nav.scriptBoundary({hash:f.doc.hash,role:'start',point});return {id:point.location.toLowerCase()+':'+point.sceneId+':page:'+b.selected.at,value:[entry.location.toLowerCase(),entry.fieldIndex,entry.start,entry.end].join(':')};};
 return {f,$,ui,scope,requests,select,emit,show:c=>{current=c;emit('jo9:selection',c);},stored:()=>storage.get('jo9-script-range'),current:()=>current,selectedChoice};
}

test('중간 시작 버튼은 첫 클릭에 고정되고 다른 대사 탐색으로 풀리지 않는다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');
 a.equal(h.ui.state().start?.selection.text,h.f.start.text,'중간 시작 클릭을 별도 확인 대기 상태로 남기면 안 됨');
 await h.select(h.f.branchA);a.equal(h.ui.state().start?.selection.text,h.f.start.text);
 await h.select(h.f.first);await h.ui.mark('start');
 a.equal(h.ui.state().start?.selection.text,h.f.start.text,'기존 고정 시작을 다른 카드 클릭으로 조용히 바꾸면 안 됨');
});

test('분기 두 개 고정 후 마무리 지정과 미리보기·저장까지 선택한 루트를 유지한다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');
 a.equal(typeof h.ui.pick,'function','탐색 선택과 각본 경로 고정을 연결하는 pick 계약 필요');
 await h.ui.pick(h.f.branchA,h.current().scene.id);await h.ui.pick(h.f.branchB,h.current().scene.id);
 const aChoice=h.selectedChoice(h.f.branchA),bChoice=h.selectedChoice(h.f.branchB);
 a.equal(h.ui.state().choices[aChoice.id],aChoice.value);a.equal(h.ui.state().choices[bChoice.id],bChoice.value);
 a.match(JSON.stringify(h.ui.state().pins),/선택한 분기 A/);a.match(JSON.stringify(h.ui.state().pins),/선택한 분기 B/);
 await h.select(h.f.end);await h.ui.mark('end');
 a.equal(h.ui.state().start.selection.text,h.f.start.text);a.equal(h.ui.state().choices[aChoice.id],aChoice.value);a.equal(h.ui.state().choices[bChoice.id],bChoice.value);
 await h.$('rangePreview').onclick();a.match(h.$('rangeText').value,/고정할 중간 시작/);a.match(h.$('rangeText').value,/선택한 분기 A/);a.match(h.$('rangeText').value,/선택한 분기 B/);a.match(h.$('rangeText').value,/고정할 마무리/);
 a.doesNotMatch(h.$('rangeText').value,/고르지 않은 기본문|이벤트 첫 대사|시작 이전 대사/);
 await h.$('rangeSave').onclick();
 const ranges=h.requests.filter(r=>r.url==='/api/script/range');a.deepEqual(ranges.map(r=>r.payload.save),[false,true]);
 for(const r of ranges){a.equal(r.payload.choices[aChoice.id],aChoice.value);a.equal(r.payload.choices[bChoice.id],bChoice.value);}
 a.match(h.$('rangeSavedPath').textContent,/route\.txt/);
});

test('단순 탐색·편집 탭 왕복·같은 QSP의 세션 복원은 시작과 고정 분기를 유지한다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');a.equal(typeof h.ui.pick,'function');await h.ui.pick(h.f.branchA,h.current().scene.id);
 const choice=h.selectedChoice(h.f.branchA);await h.select(h.f.first);h.emit('jo9:workshop-mode','edit');h.emit('jo9:workshop-mode','script');
 a.equal(h.ui.state().start.selection.text,h.f.start.text);a.equal(h.ui.state().choices[choice.id],choice.value);
 const restored=setup(h.stored());await restored.select(restored.f.branchB);
 a.equal(restored.ui.state().start.selection.text,restored.f.start.text);a.equal(restored.ui.state().choices[choice.id],choice.value);a.match(JSON.stringify(restored.ui.state().pins),/선택한 분기 A/);
});

test('QSP 해시 변경은 선택을 삭제하지 않고 오래된 경로로 보존하며 출력을 잠근다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');a.equal(typeof h.ui.pick,'function');await h.ui.pick(h.f.branchA,h.current().scene.id);await h.select(h.f.end);await h.ui.mark('end');
 const before=JSON.stringify(h.ui.state().pins),start=h.ui.state().start.selection.text;
 h.emit('jo9:selection',{...h.current(),hash:'changed-qsp',selection:{...h.current().selection,hash:'changed-qsp'}});
 a.equal(h.ui.state().start?.selection.text,start);a.equal(JSON.stringify(h.ui.state().pins),before);a.equal(h.ui.state().stale,true);
 a.equal(h.$('rangeSave').disabled,true);a.equal(h.$('rangePreview').disabled,true);
 const count=h.requests.filter(r=>r.url==='/api/script/range').length;await h.$('rangeSave').onclick();a.equal(h.requests.filter(r=>r.url==='/api/script/range').length,count);
});

test('연결 장면에서 고른 이동 경로도 각본에 고정해 미리보기에서 다시 묻지 않는다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');await h.ui.pick(h.f.branchA,h.current().scene.id);await h.ui.pick(h.f.branchB,h.current().scene.id);
 const from=h.current(),to=h.f.nav.context(h.f.followStart,undefined,'text');
 const point=c=>({selection:c.selection,location:c.flow?.usage?.location||c.location,sceneId:c.flow?.usage?.sceneId||c.scene.id});
 const boundary=h.f.nav.scriptBoundary({hash:h.f.doc.hash,role:'start',point:point(to),fromPoint:point(from)});
 a(boundary.routeChoice,'fixture must expose one explicit matching outgoing route');
 h.show(to);a.equal(typeof h.ui.follow,'function','장면 탐색에서 고른 이동을 각본 경로에 고정하는 follow 계약 필요');await h.ui.follow(from,to);
 a.equal(h.ui.state().choices[boundary.routeChoice.id],boundary.routeChoice.optionId);a.equal(h.ui.state().start.selection.text,h.f.start.text);
 await h.scope.selectEntry(h.f.followEnd,to.scene.id,false);await h.ui.mark('end');await h.$('rangePreview').onclick();
 a.match(h.$('rangeText').value,/고른 장면의 첫 대사/);a.match(h.$('rangeText').value,/고른 장면의 마무리/);a.match(h.$('rangeText').value,/선택한 분기 A/);a.match(h.$('rangeText').value,/선택한 분기 B/);
 a.doesNotMatch(h.$('rangeText').value,/포함하면 안 되는 후속 장면|고르지 않은 기본문/);a.equal(h.$('rangePrompt').childElementCount,0,'고른 장면 분기를 다시 묻지 않아야 함');
 const rangeRequest=h.requests.filter(r=>r.url==='/api/script/range').at(-1);a.equal(rangeRequest.payload.choices[boundary.routeChoice.id],boundary.routeChoice.optionId);
});

test('이미 고정한 같은 분기를 다시 열면 뒤 분기와 마무리를 유지한다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');await h.ui.pick(h.f.branchA,h.current().scene.id);await h.ui.pick(h.f.branchB,h.current().scene.id);await h.select(h.f.end);await h.ui.mark('end');
 const before=JSON.stringify(h.ui.state().pins),end=h.ui.state().end.selection.text,aChoice=h.selectedChoice(h.f.branchA),bChoice=h.selectedChoice(h.f.branchB);
 await h.ui.pick(h.f.branchA,h.current().scene.id);
 a.equal(h.ui.state().start.selection.text,h.f.start.text);a.equal(h.ui.state().end?.selection.text,end);a.equal(JSON.stringify(h.ui.state().pins),before);a.equal(h.ui.state().choices[aChoice.id],aChoice.value);a.equal(h.ui.state().choices[bChoice.id],bChoice.value);
});

test('앞 분기를 다른 변형으로 바꾸면 시작은 유지하고 뒤 고정·후속 장면 선택·마무리만 해제한다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');await h.ui.pick(h.f.branchA,h.current().scene.id);await h.ui.pick(h.f.branchB,h.current().scene.id);
 const from=h.current(),to=h.f.nav.context(h.f.followStart,undefined,'text');
 const point=c=>({selection:c.selection,location:c.flow?.usage?.location||c.location,sceneId:c.flow?.usage?.sceneId||c.scene.id});
 const route=h.f.nav.scriptBoundary({hash:h.f.doc.hash,role:'start',point:point(to),fromPoint:point(from)}).routeChoice;
 h.show(to);await h.ui.follow(from,to);await h.scope.selectEntry(h.f.followEnd,to.scene.id,false);await h.ui.mark('end');
 a.equal(h.ui.state().choices[route.id],route.optionId);a(h.ui.state().end);
 h.show(h.f.nav.context(h.f.defaultA,undefined,'text'));await h.ui.pick(h.f.defaultA,h.current().scene.id);
 const replacement=h.selectedChoice(h.f.defaultA),oldB=h.selectedChoice(h.f.branchB);
 a.equal(h.ui.state().start.selection.text,h.f.start.text);a.equal(h.ui.state().choices[replacement.id],replacement.value);a.equal(h.ui.state().choices[oldB.id],undefined);a.equal(h.ui.state().choices[route.id],undefined,'원래 뒤쪽 후속 장면 이동 선택도 해제해야 함');a.equal(h.ui.state().end,null);
 a.doesNotMatch(JSON.stringify(h.ui.state().pins),/선택한 분기 B|고른 장면의 첫 대사/);a.match(JSON.stringify(h.ui.state().pins),/고르지 않은 기본문 A/);
});

test('같은 QSP의 옛 세션 단계 번호를 재검증해 시작과 실제 선택 대사를 보존한다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');await h.ui.pick(h.f.branchA,h.current().scene.id);await h.ui.pick(h.f.branchB,h.current().scene.id);await h.select(h.f.end);await h.ui.mark('end');
 const saved=JSON.parse(h.stored()),choice=h.selectedChoice(h.f.branchA),oldKey=choice.id.replace(/:page:\d+$/,':page:99'),startText=saved.start.selection.text;
 a.equal(saved.pins[0].selection.text,h.f.branchA.text);saved.pins[0].at=99;saved.choices[oldKey]=saved.choices[choice.id];delete saved.choices[choice.id];
 const restored=setup(JSON.stringify(saved));await restored.select(restored.f.end);
 for(let i=0;i<100&&restored.ui.state().busy;i++)await Promise.resolve();
 a.equal(restored.ui.state().busy,false,'복원 재검증이 끝나야 함');a.equal(restored.ui.state().start.selection.text,startText);
 a.equal(restored.ui.state().choices[choice.id],choice.value,'소스의 실제 단계 번호로 선택 키를 다시 산정해야 함');a.equal(restored.ui.state().choices[oldKey],undefined);a.notEqual(restored.ui.state().pins[0].at,99);a.equal(restored.ui.state().stale,false);
 await restored.$('rangePreview').onclick();a.match(restored.$('rangeText').value,/고정할 중간 시작/);a.match(restored.$('rangeText').value,/선택한 분기 A/);a.match(restored.$('rangeText').value,/선택한 분기 B/);a.match(restored.$('rangeText').value,/고정할 마무리/);a.doesNotMatch(restored.$('rangeText').value,/고르지 않은 기본문/);
});

test('고정한 마무리를 넘어 새 장면으로 이어가면 시작과 분기는 보존하고 마무리만 다시 고른다',async()=>{
 const h=setup();await h.select(h.f.start);await h.ui.mark('start');await h.ui.pick(h.f.branchA,h.current().scene.id);await h.ui.pick(h.f.branchB,h.current().scene.id);await h.select(h.f.end);await h.ui.mark('end');
 const from=h.current(),to=h.f.nav.context(h.f.followStart,undefined,'text');h.show(to);await h.ui.follow(from,to);
 a.equal(h.ui.state().start.selection.text,h.f.start.text);a.equal(h.ui.state().pins.length,2);a.equal(h.ui.state().end,null);a.equal(h.$('rangeSave').disabled,true);
});