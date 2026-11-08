'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const root=process.env.JO9_IDEA_ROOT||'G:/somi/JO9sa/tools/text-workshop',schedule=require(root+'/patch-schedule.cjs');
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-ideas-'));return {store:schedule.create(dir),dir,close(){fs.rmSync(dir,{recursive:true,force:true});}};}
test('노트만 저장하고 새 인스턴스에서 재조회해도 작업 상태/차수/날짜/메모를 보존한다',()=>{
 const f=fixture();try{const v=f.store.view();a.equal(v.ideaNotes,'');const text='새 기획\n- 첫 번째 생각\n- 변수와 예시 <test>';const saved=f.store.update({revision:v.revision,changes:[],ideaNotes:text});a.equal(saved.ideaNotes,text);a.deepEqual(saved.tasks,v.tasks);a.equal(schedule.create(f.dir).view().ideaNotes,text);}finally{f.close();}
});
test('작업 변경과 예전 형식 가져오기는 저장된 노트를 보존하고 명시적 빈 문자열만 지운다',()=>{
 const f=fixture();try{let v=f.store.view();v=f.store.update({revision:v.revision,changes:[],ideaNotes:'보존할 기획'});v=f.store.update({revision:v.revision,changes:[{id:'P01',status:'진행중'}]});a.equal(v.ideaNotes,'보존할 기획');v=f.store.update({revision:v.revision,changes:[],ideaNotes:''});a.equal(v.ideaNotes,'');}finally{f.close();}
});
test('노트가 없던 기존 JSON도 읽고, 잘못된 노트와 오래된 창은 부분 저장하지 않는다',()=>{
 const f=fixture();try{const old={schema:1,overrides:{P01:{notes:'기존 수동 메모'}},updatedAt:null};fs.writeFileSync(path.join(f.dir,'patch-schedule.json'),JSON.stringify(old));let v=f.store.view();a.equal(v.ideaNotes,'');v=f.store.update({revision:v.revision,changes:[],ideaNotes:'새 노트'});const bytes=fs.readFileSync(path.join(f.dir,'patch-schedule.json'));for(const ideaNotes of [null,42,'x'.repeat(20001)])a.throws(()=>f.store.update({revision:v.revision,changes:[{id:'P01',status:'완료'}],ideaNotes}));a.throws(()=>f.store.update({revision:'old',changes:[],ideaNotes:'덮어쓰기'}),e=>e.status===409);a.deepEqual(fs.readFileSync(path.join(f.dir,'patch-schedule.json')),bytes);a.equal(f.store.view().tasks.find(t=>t.id==='P01').notes,'기존 수동 메모');}finally{f.close();}
});
test('독립 HTML의 노트 저장/재조회 및 JSON/HTML 내보내기에도 노트를 포함한다',async()=>{
 const html=fs.readFileSync(root+'/patch-schedule.template.html','utf8');a(html.includes('id="ideaNotes"'));a(html.includes('id="saveIdeaNotes"'));
 const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],stored=new Map(),nodes=new Map(),seed=require(root+'/patch-schedule-data.cjs');
 const node=()=>({value:'',textContent:'',disabled:false,checked:false,children:[],classList:{toggle(){}},append(...xs){this.children.push(...xs);},replaceChildren(...xs){this.children=xs;},setAttribute(){},addEventListener(){},dataset:{}});
 const $=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};$('seed-data').textContent=JSON.stringify(seed);
 const scope={document:{getElementById:$,createElement:node},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},structuredClone,Intl,Date,Set,Map,Promise,console,Blob,URL,setTimeout};
 // Rendering task cards is covered separately; run the real local load/save and note handlers.
 const isolated=code.replace(/function render\(\)\{[\s\S]*?(?=\nfunction card\()/, 'function render(){renderIdeaNotes();}\n');
 vm.runInNewContext(isolated,scope);await Promise.resolve();$('ideaNotes').value='노트 초안\n두 줄';$('ideaNotes').oninput();await $('saveIdeaNotes').onclick();const saved=JSON.parse([...stored.values()][0]);a.equal(saved.ideaNotes,'노트 초안\n두 줄');
 $('ideaNotes').value='';vm.runInNewContext('load()',scope);await Promise.resolve();a.equal($('ideaNotes').value,'노트 초안\n두 줄');
 a(code.includes('ideaNotes:view.ideaNotes'));a(code.includes("Object.hasOwn(data,'ideaNotes')"));
});
