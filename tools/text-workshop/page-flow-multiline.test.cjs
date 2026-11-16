'use strict';

const {test}=require('node:test');
const a=require('node:assert/strict');
const path=require('node:path');
const {createRequire}=require('node:module');
const root=process.env.JO9_TEXT_ROOT||'G:/somi/JO9sa/tools/text-workshop';
const requireTool=createRequire(path.resolve(root,'package.json'));
const core=requireTool('./core.cjs');
const scenes=requireTool('./scenes.cjs');

const multi='조건 결과 첫 문장\n조건 결과 다음 문장';
function body(options={}){
 const result22=options.arm22===undefined
  ? "  $bonus='<br>조건 결과 부가 정보'\n  $fake_note='표시하면 안 되는 보조 문구'\n  $text='"+(options.text||multi)+"'+$bonus"+(options.adjacent?" & $noise='표시하면 안 되는 인접 문구'":"")
  : options.arm22;
 return `if $args[0]='menu':
 if pick>0: gs 'event','result' & exit
 $option1='<a href="EXEC: pick=1 & gt $curloc">1. 첫 선택</a>'
 $option2='<a href="EXEC: pick=2 & gt $curloc">2. 둘째 선택</a>'
 if score<=-10 and skill>=4:
  $option2='<a href="EXEC: pick=22 & gt $curloc">2-2. 조건 선택</a>'
 end
 $option3='<a href="EXEC: pick=3 & gt $curloc">3. 셋째 선택</a>'
 $text=$intro+'<br>'+$option1+'<br>'+$option2+'<br>'+$option3
 exit
end
if $args[0]='result':
 chosen=pick
 if chosen=1:
  $bg_path='scene/one'
  $text='첫 선택 결과 본문'
 elseif chosen=2:
  $bg_path='scene/two'
  $text='둘째 선택 결과 본문'
 elseif ${options.guard22||'chosen=22'}:
  $bg_path='scene/two_conditional'
${result22}
 else
  $bg_path='scene/three'
  $text='셋째 선택 결과 본문'
 end
 exit
end`;
}
function fixture(source=body()){
 const rows=['QSPGAME','fixture','',core.shift('1',-5),core.shift('event',-5),'',core.shift(source,-5),core.shift('0',-5),''];
 const raw=Buffer.from(rows.join('\r\n'),'utf16le'),doc=core.parse(raw),entries=core.entries(doc);
 const nav=scenes.buildNavigator(doc,entries),entry=entries.find(e=>e.text.includes('pick=22'));
 a.ok(entry,'conditional menu link exists');
 return {doc,raw,entries,nav,menu:nav.context({...entry,hash:doc.hash},undefined,'text')};
}
function branch(ctx,value){return ctx.branches.find(b=>b.states.pick===String(value));}
function stageText(stage){return stage.variants.map(v=>v.entry.text);}
function targetText(f,value){
 const b=branch(f.menu,value);a.ok(b,'choice branch exists');
 const dest=b.destinations?.[0];a.ok(dest,'branch destination exists');
 const result=f.nav.open(dest,'text');return {dest,result};
}

test('multiline conditional scalar result remains a fifth page and choice 22 never opens choice 3',()=>{
 const f=fixture();
 a.equal(f.menu.flow.kind,'pages');
 a.equal(f.menu.flow.stages.length,5);
 const {result,dest}=targetText(f,22);
 a.equal(result.flow.selected,4);
 a.equal(result.scene.id,dest.sceneId);
 a.deepEqual(result.screen.map(e=>e.text),[multi,'<br>조건 결과 부가 정보']);
 a.ok(result.images.some(im=>(typeof im==='string'?im:im.path)==='scene/two_conditional'));
 a.notEqual(dest.sceneId,branch(f.menu,3).destinations[0].sceneId);
 a.equal(f.menu.flow.stages[3].title,'2번 조건 선택 결과');
 a.ok(core.serialize(f.doc).equals(f.raw));
});

test('fake scalar writes inside a multiline literal cannot create phantom result pages',()=>{
 const text='실제 조건 결과 첫 문장\n $text=$fake_note\n실제 조건 결과 마지막 문장';
 const f=fixture(body({text}));
 a.equal(f.menu.flow.stages.length,5);
 const {result}=targetText(f,22);
 a.deepEqual(result.screen.map(e=>e.text),[text,'<br>조건 결과 부가 정보']);
 a.ok(!f.menu.flow.stages.some(p=>stageText(p).includes('표시하면 안 되는 보조 문구')));
});

test('scalar output bounds exclude adjacent commands and sibling result text',()=>{
 const f=fixture(body({adjacent:true})),conditional=targetText(f,22).result;
 a.equal(f.menu.flow.stages.length,5);
 a.deepEqual(conditional.screen.map(e=>e.text),[multi,'<br>조건 결과 부가 정보']);
 a.ok(!conditional.texts.some(e=>/인접 문구|보조 문구|첫 선택 결과|둘째 선택 결과|셋째 선택 결과/.test(e.text)));
 for(const [pick,text]of [[1,'첫 선택 결과 본문'],[2,'둘째 선택 결과 본문'],[3,'셋째 선택 결과 본문']]){
  const result=targetText(f,pick).result;
  a.deepEqual(result.screen.map(e=>e.text),[text]);
 }
 a.ok(branch(f.menu,22).conditions.includes('score<=-10 and skill>=4'));
});

test('a matching arm without visible dialogue prevents false else fallthrough',()=>{
 const f=fixture(body({arm22:'  score+=22'}));
 a.equal(f.menu.flow.stages.length,4);
 const b=branch(f.menu,22),third=branch(f.menu,3).destinations[0];
 a.ok(!b.destinations.some(d=>d.sceneId===third.sceneId));
 a.ok(!b.destinations.some(d=>d.staticChoice));
});

test('an unproven prior arm prevents static else fallthrough',()=>{
 const f=fixture(body({guard22:'chosen>10',arm22:'  score+=22'}));
 const third=f.menu.flow.stages.find(p=>stageText(p).includes('셋째 선택 결과 본문'));
 a.ok(third);
 a.ok(!branch(f.menu,22).destinations.some(d=>d.sceneId===third.sceneId));
 a.ok(!branch(f.menu,3).destinations.some(d=>d.staticChoice));
});

