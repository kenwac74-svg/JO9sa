'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),a=require('node:assert/strict'),{test}=require('node:test');
const root=process.env.JO9_FEMALE_UI_ROOT||__dirname,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function block(id){return html.split('/* JO9 MOD START '+id+' */')[1].split('/* JO9 MOD END '+id+' */')[0];}
function node(){return {checked:false,disabled:false,hidden:false,value:'',textContent:'',children:[],childElementCount:0,replaceChildren(...items){this.children=items;this.childElementCount=items.length;},append(...items){this.children.push(...items);},add(item){this.children.push(item);},scrollIntoView(){},querySelectorAll(){return[];},addEventListener(){}};}
function transport(fetcher){const checkbox={checked:true,disabled:false},events=[],scope={URL,location:{href:'http://127.0.0.1:38471/'},workScopeVersion:0,scopeSaving:0,token:'token',$:()=>checkbox,includeFemale:()=>!checkbox.checked,window:{dispatchEvent:e=>events.push(e.type)},Event:class{constructor(type){this.type=type;}},fetch:fetcher};vm.createContext(scope);vm.runInContext(block('FEMALE_WORK_SCOPE_API_20261118'),scope);return {scope,checkbox,events};}
test('fresh workshop explicitly excludes female scope without restoring an include preference',()=>{
 a.match(html,/<input type="checkbox" id="excludeFemale" checked>/);a.match(block('FEMALE_WORK_SCOPE_UI_20261118'),/\$\('excludeFemale'\)\.checked=true/);a(!block('FEMALE_WORK_SCOPE_UI_20261118').includes('Storage'));
 a.match(html,/게임 원문은 유지됩니다/);a.match(html,/확인 필요 · 자동 개편 제외/);
 const searchRow=html.match(/<section id="searchPanel">[\s\S]*?<div class="row">([\s\S]*?)<\/div>/)[1];a.equal([...searchRow.matchAll(/<label\b/g)].length,3);a(!searchRow.includes('excludeFemale'));a.match(searchRow,/<button id="search">찾기<\/button>$/);a.match(html,/<p id="workScopeHelp"[^>]*>[\s\S]*?id="excludeFemale"/);
});
test('the shared transport applies the same current scope to search, bulk, script import and apply',async()=>{
 const calls=[],h=transport(async(url,request)=>{calls.push({url,request});return{ok:true,json:async()=>({ok:true})};});
 await h.scope.api('/api/search?q=test&mode=all');a.match(calls.at(-1).url,/q=test/);a.match(calls.at(-1).url,/includeFemale=0/);
 await h.scope.api('/api/batch/search?includeFemale=1');a.match(calls.at(-1).url,/includeFemale=0/);a(!calls.at(-1).url.includes('includeFemale=1'));
 for(const url of ['/api/preview','/api/script','/api/script/range','/api/script/boundary','/api/script/preview','/api/apply']){await h.scope.api(url,{id:'review',includeFemale:true});a.equal(JSON.parse(calls.at(-1).request.body).includeFemale,false,url);}
 h.checkbox.checked=false;await h.scope.api('/api/context',{selection:{hash:'h'},includeFemale:false});a.equal(JSON.parse(calls.at(-1).request.body).includeFemale,true);await h.scope.api('/api/search?q=test');a.match(calls.at(-1).url,/includeFemale=1/);
});
test('an earlier-scope response cannot restore a hidden preview and saving locks the scope toggle',async()=>{
 let release;const answer=new Promise(r=>release=r),h=transport(async()=>{await answer;return{ok:true,json:async()=>({id:'old-preview'})};});
 const pending=h.scope.api('/api/preview',{selection:{}});h.scope.workScopeVersion++;release();await a.rejects(pending,/작업 범위가 바뀌/);
 let finish;const gate=new Promise(r=>finish=r),saving=transport(async()=>{await gate;return{ok:true,json:async()=>({id:'saved'})};});
 const request=saving.scope.api('/api/apply',{id:'review'});a.equal(saving.checkbox.disabled,true);finish();await request;a.equal(saving.checkbox.disabled,false);
});
test('changing scope preserves editable drafts and invalidates the selected scene and review consumers',async()=>{
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},events=[],saved=[];
 $('replacement').value='본문 초안';$('additionText').value='추가 초안';$('scriptAdapted').value='각본 초안';$('choiceLabel').value='선택지 초안';$('excludeFemale').checked=true;
 const scope={$ ,context:{selection:{text:'여주 전용 원문'},scene:{id:'scene'}},selection:{text:'여주 전용 원문'},visits:[{}],workScopeVersion:0,includeFemale:()=>false,remember:()=>saved.push($('replacement').value),rememberAddition:()=>saved.push($('additionText').value),invalidate:()=>saved.push('invalidated'),persist(){},say(){},api:async()=>{throw Error('제외된 원문');},render(){throw Error('excluded scene must stay hidden');},window:{JO9ChoiceEditor:{remember:()=>saved.push($('choiceLabel').value)},JO9ChoiceFormat:{remember:()=>saved.push('format')},dispatchEvent:e=>events.push(e)},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}}};
 vm.createContext(scope);vm.runInContext(block('FEMALE_WORK_SCOPE_CHANGE_20261118'),scope);await $('excludeFemale').onchange();
 a.deepEqual(saved,['본문 초안','추가 초안','선택지 초안','format','invalidated']);a.equal($('scriptAdapted').value,'각본 초안');a.equal(scope.selection,null);a.equal(scope.context,null);a.equal(scope.visits.length,0);a.equal($('editor').hidden,true);a.equal($('navigation').hidden,true);a.deepEqual(events.map(e=>e.type),['jo9:work-scope','jo9:selection']);a.equal(events[1].detail.selection,null);
 for(const file of ['batch-replace.js','script-export.js','script-import-ui.js','script-range.js'])a.match(fs.readFileSync(path.join(root,file),'utf8'),/addEventListener\('jo9:work-scope'/,file);
});
function range(saved,include=false){
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},listeners={};let storage=JSON.stringify(saved);
 const scope={document:{getElementById:$,createElement:node},window:{addEventListener:(name,fn)=>listeners[name]=fn,dispatchEvent(){}},sessionStorage:{getItem:()=>storage,setItem:(_key,value)=>storage=value},api:async()=>{throw Error('scope-locked routes must not be requested');},includeFemale:()=>include,Event:class{},Option:class{},context:null};vm.runInNewContext(fs.readFileSync(path.join(root,'script-range.js'),'utf8'),scope);return {$,listeners,scope,stored:()=>JSON.parse(storage)};
}
test('cached opt-in or legacy range output stays hidden on the next default page while pins are preserved',()=>{
 const point={selection:{hash:'h',text:'여주 전용 초안'},location:'woman',sceneId:'scene'};
 for(const storedScope of [true,undefined]){const saved={start:point,end:point,pins:[point],includeFemale:storedScope,result:{text:'여주 전용 각본',savedPath:'saved.txt'}};const h=range(saved);a.equal(h.$('rangeText').value,'');a.equal(h.$('rangeSave').disabled,true);a.equal(h.$('rangeDownload').disabled,true);a(!h.$('rangeStartLabel').textContent.includes('여주 전용'));a.equal(h.scope.window.JO9ScriptRange.state().start.selection.text,'여주 전용 초안');}
});
test('a scope change locks a pinned route and clears its cached output without deleting its data',()=>{
 const point={selection:{hash:'h',text:'고정 초안'},location:'town',sceneId:'scene'},h=range({start:point,end:point,pins:[point],includeFemale:false,result:{text:'미리보기'}});
 h.listeners['jo9:work-scope']();a.equal(h.$('rangeText').value,'');a.equal(h.$('rangeSave').disabled,true);a.equal(h.stored().start.selection.text,'고정 초안');a.equal(h.stored().pins.length,1);a.equal(h.stored().scopeStale,true);a.equal(h.stored().result,null);h.$('rangeReset').onclick();a.equal(h.stored().start,null);a.equal(h.stored().scopeStale,false);
});
test('script scope changes preserve the manuscript and per-page exclusions while requiring a fresh review',async()=>{
 const support=fs.existsSync(path.join(root,'script-review.js'))?root:'G:/somi/JO9sa/tools/text-workshop',ui=require(path.join(support,'script-review.js')),nodes=new Map(),listeners={},calls=[];
 function element(tag='div'){const value=node();value.tag=tag;value.type='';value.style={};value.dataset={};value.setAttribute=()=>{};value.querySelectorAll=selector=>{const out=[],tags=selector.split(',');const visit=child=>{if(child&&typeof child==='object'){if(tags.includes(child.tag))out.push(child);child.children?.forEach(visit);}};value.children.forEach(visit);return out;};return value;}
 const $=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};for(const id of ['scriptApproved','scriptAllowMissing','scriptRevalidate'])$(id).type='checkbox';
 $('scriptAdapted').value='# 각본 ID: 0123456789abcdef\n---- [S1-P1] ----\n새 원고\n';$('scriptImportId').value='0123456789abcdef';$('scriptLayoutWidth').value='720';$('scriptLayoutHeight').value='480';$('scriptLayoutFont').value='18';
 const scope={window:{JO9ScriptReview:{...ui,draw:()=>[]},addEventListener:(name,fn)=>listeners[name]=fn},document:{getElementById:$,createElement:element},sessionStorage:{getItem:()=>null,setItem(){}},api:async(url,data)=>{calls.push({url,data});return{id:'review',count:1,unchanged:0,changes:[{id:'S1-P1',location:'town',line:1,oldPlain:'원고',newPlain:'새 원고',warnings:[],excluded:data.exclude.includes('S1-P1')}]};}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'script-import-ui.js'),'utf8'),scope);await $('scriptPreview').onclick();
 const check=$('scriptChanges').querySelectorAll('input')[0];check.checked=false;await check.onchange();$('scriptApproved').checked=true;$('scriptApproved').onchange();a.equal($('scriptApply').disabled,false);const manuscript=$('scriptAdapted').value;
 listeners['jo9:work-scope']();a.equal($('scriptAdapted').value,manuscript);a.equal($('scriptApproved').checked,false);a.equal($('scriptApply').disabled,true);a.equal($('scriptChanges').children.length,0);const before=calls.length;await $('scriptApply').onclick();a.equal(calls.length,before);await $('scriptPreview').onclick();a(calls.at(-1).data.exclude.includes('S1-P1'));a.equal(calls.at(-1).data.text,manuscript);
});
