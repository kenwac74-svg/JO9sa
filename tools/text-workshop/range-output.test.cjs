'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test'),a=require('node:assert/strict');
const root=process.env.JO9_RANGE_ROOT||'G:/somi/JO9sa/tools/text-workshop';
test('저장 완료는 실제 UTF-8 TXT 전체 경로를 반환하고 덮어쓰지 않는다',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-range-'));
 try{const save=require(root+'/range-output.cjs').save;const r={status:'ready',text:'# 각본\n여직원: 안녕하세요.\n'};
 const out=save(dir,'1234567890abcdef',r);a.equal(path.dirname(out.savedPath),path.join(dir,'script-exports'));a.equal(fs.readFileSync(out.savedPath,'utf8').replace(/^\uFEFF/,''),r.text.replace(/\n/g,'\r\n'));a.throws(()=>save(dir,'1234567890abcdef',r),/EEXIST/);
 a.throws(()=>save(dir,'../escape',r));a.throws(()=>save(dir,'2234567890abcdef',{status:'choice'}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
function setup(responder,saved){
 const els=new Map(),listeners={};const node=()=>({textContent:'',value:'',disabled:false,hidden:false,open:false,children:[],append(...xs){this.children.push(...xs);},replaceChildren(...xs){this.children=xs;},add(x){this.children.push(x);},scrollIntoView(){}});
 const $=id=>{if(!els.has(id))els.set(id,node());return els.get(id);};
 const point={selection:{hash:'h',text:'안녕하세요',line:1},location:'city',sceneId:'scene'};let data=saved||JSON.stringify({start:point,end:point});
 const scope={document:{getElementById:$,createElement:node},window:{addEventListener:(n,fn)=>listeners[n]=fn,dispatchEvent(){}},sessionStorage:{getItem:()=>data,setItem:(k,v)=>data=v},api:responder,Event:class{},Option:class{},context:undefined,console,Blob,URL,setTimeout};
 vm.runInNewContext(fs.readFileSync(root+'/script-range.js','utf8'),scope);return {$,listeners,scope,stored:()=>JSON.parse(data)};
}
const ready={status:'ready',text:'# 각본\n안녕하세요',hash:'h',stats:{scenes:1,pages:1,choices:0},savedPath:'G:/game/modtools/text-workshop/runtime/script-exports/123.txt'};
test('미리보기만 요청하면 다운로드나 저장 없이 본문을 열고 표시한다',async()=>{
 let request;const h=setup(async(u,p)=>{request={u,p};return {...ready,savedPath:undefined};});a.equal(typeof h.$('rangePreview').onclick,'function');await h.$('rangePreview').onclick();a.equal(request.p.save,false);a.equal(h.$('rangeText').value,ready.text);a.equal(h.$('rangePreviewBox').open,true);a.match(h.$('rangeStatus').textContent,/미리보기/);
});
test('저장은 경로와 같은 본문을 보여주고 재접속에도 미리보기를 복원한다',async()=>{
 let request;const h=setup(async(u,p)=>{request=p;return ready;});await h.$('rangeSave').onclick();a.equal(request.save,true);a.equal(h.$('rangeText').value,ready.text);a.match(h.$('rangeSavedPath').textContent,/123.txt/);a.equal(h.$('rangePreviewBox').open,true);const again=setup(async()=>ready,JSON.stringify(h.stored()));a.equal(again.$('rangeText').value,ready.text);a.match(again.$('rangeSavedPath').textContent,/123.txt/);a.match(again.$('rangeStatus').textContent,/저장한 각본/);
});
test('QSP 변경 오류는 저장 성공으로 표시하지 않고 재지정을 안내한다',async()=>{
 const h=setup(async()=>{throw Error('QSP가 바뀌었습니다. 시작과 마무리를 다시 선택하세요.');});await h.$('rangeSave').onclick();a.match(h.$('rangeStatus').textContent,/다시/);a.equal(h.$('rangeSave').disabled,true);a.equal(h.$('rangeText').value,'');
});
test('분기 선택 뒤에도 미리보기 작업이 저장으로 바뀌지 않는다',async()=>{
 let count=0,requests=[];const h=setup(async(u,p)=>{requests.push(p);return count++?ready:{status:'choice',choice:{id:'route',title:'경로 선택',options:[{id:'a',label:'안내'}]}};});a.equal(typeof h.$('rangePreview').onclick,'function');await h.$('rangePreview').onclick();await h.$('rangePrompt').children[1].onclick();a.deepEqual(requests.map(p=>p.save),[false,false]);a.equal(h.$('rangeText').value,ready.text);
});
