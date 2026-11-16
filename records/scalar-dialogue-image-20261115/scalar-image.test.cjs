'use strict';

const {test}=require('node:test');
const a=require('node:assert/strict');
const path=require('node:path');
const {createRequire}=require('node:module');
const root=process.env.JO9_TEXT_ROOT||'G:/somi/JO9sa/tools/text-workshop';
const requireTool=createRequire(path.resolve(root,'package.json'));
const core=requireTool('./core.cjs');
const scenes=requireTool('./scenes.cjs');
const imageReference=requireTool('./image-reference.cjs');

const thirdText='셋째 결과 본문';
const body=`if $args[0]='menu':
 if pick>0: gs 'event','result' & exit
 $option1='<a href="EXEC: pick=1 & gt $curloc">1. 첫 선택</a>'
 if coins<10: $option1='1. 첫 선택 (비용 부족)'
 $option2='<a href="EXEC: pick=2 & gt $curloc">2. 둘째 선택</a>'
 $option3='<a href="EXEC: pick=3 & gt $curloc">3. 셋째 선택</a>'
 if coins<5: $option3='3. 셋째 선택 (비용 부족)'
 $text=$intro+'<br><br>'+$option1+'<br>'+$option2+'<br>'+$option3
 exit
end
if $args[0]='result':
 chosen=pick
 if chosen=1:
  coins-=10
  $bg_path='scene/branch1'
  $text='첫째 결과 본문'
  score+=1
 elseif chosen=2:
  $bg_path='scene/branch2'
  $text='둘째 결과 본문'
  score+=2
 else
  coins-=5
  $bg_path='scene/branch3'
  $meat='<br>기념품 목록'
  if gain>0: $meat+=': <<gain>>개'
  $text='셋째 결과 본문'+$meat
  score+=3
 end
 exit
end`;

function fixture(source=body){
 const lines=['QSPGAME','fixture','',core.shift('2',-5),core.shift('event',-5),'',core.shift(source,-5),core.shift('0',-5),core.shift('other',-5),'',core.shift("$text='다른 위치 원문'",-5),core.shift('0',-5),''];
 const raw=Buffer.from(lines.join('\r\n'),'utf16le');
 return {raw,doc:core.parse(raw)};
}
function context(doc,text=thirdText){
 const entries=core.entries(doc),entry=entries.find(e=>e.text===text);
 a.ok(entry,'synthetic result dialogue exists');
 return scenes.buildNavigator(doc,entries).context({...entry,hash:doc.hash},undefined,'text');
}
function sourceFor(doc,stem='scene/branch3'){
 const ctx=context(doc),image=ctx.images.find(im=>typeof im==='object'&&im.source?.text===stem);
 a.ok(image,'selected scalar page exposes its exact branch-local $bg_path source');
 return {ctx,image,source:image.source};
}
function literalSource(doc,stem){
 const entry=core.entries(doc).find(e=>e.text===stem);
 a.ok(entry,'synthetic image literal exists');
 return {...entry,hash:doc.hash};
}

test('scalar result exposes the branch-local image source for the selected composite page',()=>{
 const {doc,raw}=fixture(),{ctx,image,source}=sourceFor(doc);
 a.equal(ctx.flow.kind,'pages');
 a.equal(ctx.flow.selected,4);
 a.equal(ctx.screen.length,2);
 a.deepEqual(ctx.screen.map(e=>e.text),[thirdText,'<br>기념품 목록']);
 a.equal(image.path,'scene/branch3');
 a.equal(source.hash,doc.hash);
 a.equal(source.location,'event');
 a.equal(source.start,literalSource(doc,'scene/branch3').start);
 a.ok(!ctx.images.some(im=>typeof im==='object'&&['scene/branch1','scene/branch2'].includes(im.source?.text)));
 a.ok(core.serialize(doc).equals(raw));
});

test('scalar image replacement preserves sibling results, costs, text and selected dialogue offset',()=>{
 const {doc,raw}=fixture(),{ctx,source}=sourceFor(doc);
 const p=imageReference.prepare(doc,ctx.selection,'scene/new3.png',{source,sceneId:ctx.scene.id,usageId:ctx.flow.usage?.id});
 const updated=core.parse(p.raw),field=core.shift(updated.lines[doc.locations[0].body],5);
 a.equal(p.path,'scene/new3.png');
 a.equal(p.page,4);
 a.match(field,/\$bg_path\s*=\s*'scene\/new3'/);
 a.doesNotMatch(field,/\$special_image(?:_full)?\s*\[/);
 a.doesNotMatch(field,/scene\/new3\.png/);
 for(const unchanged of ["$bg_path='scene/branch1'","$bg_path='scene/branch2'","coins-=10","coins-=5","$text='셋째 결과 본문'+$meat","score+=1","score+=2","score+=3"])a.ok(field.includes(unchanged),unchanged);
 const selected=core.entries(updated).find(e=>e.fieldIndex===ctx.selection.fieldIndex&&e.start===p.selectionStart);
 a.equal(selected?.text,thirdText);
 a.notEqual(p.selectionStart,ctx.selection.start);
 a.equal(p.oldField.replace(p.piece.old,p.piece.new),p.newField);
 a.equal(updated.lines[doc.locations[1].body],doc.lines[doc.locations[1].body]);
 a.deepEqual(core.entries(updated).filter(e=>e.dialogue).map(e=>e.text),core.entries(doc).filter(e=>e.dialogue).map(e=>e.text));
 a.ok(core.serialize(updated).equals(p.raw));
 a.ok(core.serialize(doc).equals(raw));
});

test('conditional scalar rebind keeps PNG stems and removes conditions without duplicating bindings',()=>{
 const {doc}=fixture(),{ctx,source}=sourceFor(doc);
 const first=imageReference.prepare(doc,ctx.selection,'scene/new3.png',{source,conditions:{morality:{min:-.5,max:2},money:{op:'ge',value:100},rank:2,reputation:3},fallback:'scene/branch3.png'});
 const next=core.parse(first.raw),bound=sourceFor(next,'scene/new3'),description=imageReference.describe(first.newField,bound.source);
 a.ok(description,'generated scalar binding is recognized');
 a.equal(description.role,'primary');
 a.equal(description.meta.path,'scene/new3');
 a.equal(description.meta.fallback,'scene/branch3');
 a.equal(bound.image.reference.conditions.money.value,100);
 a.equal(bound.image.reference.conditions.rank,2);
 a.equal(bound.ctx.images.filter(im=>typeof im==='object'&&im.source).length,1);
 for(const guard of ["if $args[0]='result':","if chosen=1:","elseif chosen=2:",'sparks >= 100','guild_reputation = 2','brand_reputation = 3'])a.ok(first.newField.includes(guard),guard);
 a.match(first.newField,/\$bg_path\s*=\s*'scene\/new3'/);
 a.match(first.newField,/\$bg_path\s*=\s*'scene\/branch3'/);
 a.doesNotMatch(first.newField,/\$bg_path\s*=\s*'[^']+\.png'/);
 const second=imageReference.prepare(next,bound.ctx.selection,'scene/final3.png',{source:bound.source,conditions:null});
 const final=core.parse(second.raw),rebound=sourceFor(final,'scene/final3');
 a.equal((second.newField.match(/JO9 MOD START IMAGE_REFERENCE_/g)||[]).length,1);
 a.doesNotMatch(second.newField,/sparks >= 100|scene\/new3/);
 a.equal(rebound.image.reference.conditions,null);
 a.equal(context(final).selection.text,thirdText);
});

test('scalar image preparation rejects stale and sibling-page source references',()=>{
 const {doc}=fixture(),ctx=context(doc),source=literalSource(doc,'scene/branch3');
 a.throws(()=>imageReference.prepare(doc,ctx.selection,'scene/new3.png',{source:{...source,hash:'stale'}}),/원문|변경/);
 a.throws(()=>imageReference.prepare(doc,ctx.selection,'scene/new3.png',{source:literalSource(doc,'scene/branch2')}),/현재|선택|분기/);
});

test('scalar PNG-stem emitter rejects non-PNG files before generating a broken image path',()=>{
 const {doc}=fixture(),ctx=context(doc),source=literalSource(doc,'scene/branch3');
 for(const extension of ['jpg','gif'])a.throws(()=>imageReference.prepare(doc,ctx.selection,'scene/new3.'+extension,{source}),/PNG|png/);
});

test('scalar images embedded in same-row commands cannot be silently replaced',()=>{
 const {doc}=fixture(body.replace("$bg_path='scene/branch3'","$bg_path='scene/branch3' & score+=10"));
 const ctx=context(doc),source=literalSource(doc,'scene/branch3');
 a.throws(()=>imageReference.prepare(doc,ctx.selection,'scene/new3.png',{source}),/복합|범위|현재|선택/);
});
