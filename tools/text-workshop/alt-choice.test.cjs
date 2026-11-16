'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Module=require('node:module');
const canonical='G:/somi/JO9sa/tools/text-workshop',root=process.env.JO9_ALT_CHOICE_ROOT||(fs.existsSync(path.join(__dirname,'stage','page-flow.cjs'))?path.join(__dirname,'stage'):canonical);
const canonicalPage=path.resolve(canonical,'page-flow.cjs'),pageFile=path.resolve(root,'page-flow.cjs'),baseResolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){
 if(request.startsWith('./')&&parent?.filename){
  const local=path.resolve(path.dirname(parent.filename),request);
  if(local===canonicalPage)return pageFile;
  if(parent.filename.startsWith(path.resolve(root)+path.sep)&&!fs.existsSync(local))return baseResolve.call(this,path.resolve(canonical,request),parent,...rest);
 }
 return baseResolve.call(this,request,parent,...rest);
};
const requireTool=Module.createRequire(path.resolve(canonical,'package.json')),core=requireTool('./core.cjs'),scenes=requireTool('./scenes.cjs');
const alternativeText='<a href="EXEC: pick=22 & gt $curloc">2. 둘째 조건 선택</a>';
const guard='(2 * reputation + reputation_half) <= -20 and special_skill >= 4';
function fixture(){
 const body=`if $args[0]='menu':
 $option1='<a href="EXEC: pick=1 & gt $curloc">1. 첫 선택</a>'
 if coins<10: $option1='1. 첫 선택 (비용 부족)'
 $option2='<a href="EXEC: pick=2 & gt $curloc">2. 둘째 기본 선택</a>'
 if (2 * reputation + reputation_half) <= -20 and special_skill >= 4:
  $option2='<a href="EXEC: pick=22 & gt $curloc">2. 둘째 조건 선택</a>'
 end
 $option3='<a href="EXEC: pick=3 & gt $curloc">3. 셋째 선택</a>'
 $text=$intro+'<br><br>'+$option1+'<br>'+$option2+'<br>'+$option3
 exit
end
if $args[0]='result':
 chosen=pick
 if chosen=1:
  $bg_path='scene/sample1'
  $text='첫 결과 본문'
 elseif chosen=2:
  $bg_path='scene/sample2'
  $text='둘째 기본 결과 본문'
 elseif chosen=22:
  $bg_path='scene/sample22'
  $text='둘째 조건 결과 본문'
 else
  $bg_path='scene/sample3'
  $text='셋째 결과 본문'
 end
 exit
end`;
 const raw=Buffer.from(['QSPGAME','fixture','',core.shift('1',-5),core.shift('event',-5),'',core.shift(body,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
 const doc=core.parse(raw),entries=core.entries(doc),nav=scenes.buildNavigator(doc,entries),entry=entries.find(e=>e.text.includes('pick=1 & gt'));
 return {raw,doc,entries,nav,context:nav.context({...entry,hash:doc.hash},undefined,'text')};
}
test('a linked alternative remains within the second menu slot and exposes its own nested condition',()=>{
 const f=fixture(),ctx=f.context,menu=ctx.flow.stages.find(p=>p.menu),choices=menu.parts.filter(p=>p.choice),alternative=choices[1].alternatives[0];
 a.equal(ctx.flow.kind,'pages');
 a.equal(choices.length,3);
 a.match(choices[1].entry.text,/둘째 기본 선택/);
 a.equal(alternative.text,alternativeText);
 a.deepEqual(alternative.conditions,[guard]);
 a.equal(ctx.branches.filter(b=>b.kind==='choice').length,4);
 a.ok(core.serialize(f.doc).equals(f.raw),'static navigation leaves QSP bytes unchanged');
});
test('four links resolve to four results while their titles retain the three parent menu slots',()=>{
 const f=fixture(),links=f.context.branches.filter(b=>b.kind==='choice');
 const expected=[['첫 결과 본문','1번 선택 결과'],['둘째 기본 결과 본문','2번 선택 결과'],['둘째 조건 결과 본문','2번 조건 선택 결과'],['셋째 결과 본문','3번 선택 결과']];
 a.equal(links.length,4);
 for(const [i,branch]of links.entries()){
  a.equal(branch.destinations.length,1);
  const result=f.nav.open(branch.destinations[0],'text');
  a.equal(result.selection.text,expected[i][0]);
  a.equal(result.scene.title,expected[i][1]);
 }
});
function dom(ctx){
 function node(tag){return {tag,children:[],textContent:'',className:'',open:false,disabled:false,append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];},setAttribute(){},get childElementCount(){return this.children.length;}};}
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,node('div'));return elements.get(id);},opened=[],edited=[],errors=[];
 const sandbox={document:{createElement:node},$:el,gameLine(n,text){n.textContent=text;},selectEntry:async(e,id,search)=>edited.push({entry:e,id,search}),openScene:async destination=>opened.push(destination),appendRangeActions(){},say:(...args)=>errors.push(args)};
 vm.createContext(sandbox);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('function renderComposedPages(c){'),end=html.indexOf('// JO9 MOD END SCALAR_PAGE_PREVIEW_20261115',start);
 a.ok(start>=0&&end>start,'actual composed-page renderer is available');
 vm.runInContext(html.slice(start,end),sandbox);
 sandbox.renderComposedPages(ctx);
 const flatten=n=>[n,...n.children.flatMap(flatten)];
 return {el,opened,edited,errors,nodes:flatten(el('gameLines')),flatten};
}
test('linked conditional alternative offers separate result-preview and source-edit actions',async()=>{
 const f=fixture(),ui=dom(f.context),detail=ui.nodes.find(n=>n.tag==='details'&&ui.flatten(n).some(x=>x.textContent===alternativeText));
 a.ok(detail);
 a.equal(detail.open,false,'conditional alternatives start collapsed');
 a.ok(ui.flatten(detail).some(n=>n.textContent.includes(guard)),'nested source condition is visible without evaluating it');
 const pick=ui.flatten(detail).find(n=>n.tag==='button'&&n.className==='composed-choice-pick'&&n.textContent===alternativeText);
 a.ok(pick,'conditional link previews its own result');
 await pick.onclick();
 a.equal(ui.opened.length,1);
 a.equal(ui.edited.length,0);
 const result=f.nav.open(ui.opened[0],'text');
 a.equal(result.selection.text,'둘째 조건 결과 본문');
 const edit=ui.flatten(detail).find(n=>n.tag==='button'&&n.textContent==='문구 편집');
 a.ok(edit,'conditional link also has a separate text editor action');
 await edit.onclick();
 a.equal(ui.edited.length,1);
 a.equal(ui.edited[0].entry.text,alternativeText);
 a.equal(ui.edited[0].id,f.context.scene.id);
 a.equal(ui.opened.length,1);
 a.deepEqual(ui.errors,[]);
});
test('nonlinked shortage alternatives retain direct editing and never navigate to a result',async()=>{
 const f=fixture(),ui=dom(f.context),shortage=ui.nodes.find(n=>n.tag==='button'&&n.textContent==='1. 첫 선택 (비용 부족)');
 a.ok(shortage);
 await shortage.onclick();
 a.equal(ui.opened.length,0);
 a.equal(ui.edited.length,1);
 a.equal(ui.edited[0].entry.text,'1. 첫 선택 (비용 부족)');
});
