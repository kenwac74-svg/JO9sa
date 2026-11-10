(function(root){
 'use strict';
 const model=typeof module==='object'&&module.exports?require('./ideas-core.cjs'):root.JO9ReferenceIdeas;
 function conflict(){const e=new Error('다른 창의 변경을 불러왔습니다. 작성 중인 내용은 유지했습니다. 확인 후 다시 저장하세요.');e.status=409;throw e;}
 function offlineAdapter(storage){
  const key='jo9-reference-personal-ideas-v1';
  function read(){const raw=storage.getItem(key),doc=raw?model.document(JSON.parse(raw)):{schema:1,items:[]};return{...doc,revision:raw||null,storagePath:'브라우저 저장 · 이 HTML',mode:'browser'};}
  function current(expected){const value=read();if(value.revision!==expected)conflict();return value;}
  function commit(expected,items){current(expected);const doc=model.document({schema:1,items}),raw=JSON.stringify(doc);storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('브라우저 저장 내용을 확인할 수 없습니다. JSON으로 백업하세요.');return read();}
  function upsert(expected,input){const state=current(expected),id=input.id||(root.crypto?.randomUUID?root.crypto.randomUUID():'idea-'+Date.now()+'-'+Math.random().toString(36).slice(2)),old=state.items.find(x=>x.id===id),item=model.makeItem(input,{id,existing:old}),items=state.items.map(x=>x.id===id?item:x);if(!old)items.push(item);return commit(expected,items);}
  function remove(expected,id){const state=current(expected);return commit(expected,state.items.filter(x=>x.id!==id));}
  function importIdeas(expected,value){const state=current(expected),merged=model.mergeImport(state.items,value);if(!merged.added)return{...state,added:0,skipped:merged.skipped};return{...commit(expected,merged.items),added:merged.added,skipped:merged.skipped};}
  return{read,upsert,remove,import:importIdeas,mode:'browser'};
 }
 function httpAdapter(fetcher){
  async function request(url,value){const response=await fetcher(url,value===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});let result;try{result=await response.json();}catch(e){throw Error('개인 기록 서버 응답을 읽을 수 없습니다. 모드툴을 다시 열어 주세요.');}if(!response.ok){const e=new Error(result.error||'저장 요청에 실패했습니다.');e.status=response.status;throw e;}return result;}
  return{mode:'server',read:()=>request('/api/ideas'),upsert:(revision,item)=>request('/api/ideas',{revision,item}),remove:(revision,id)=>request('/api/ideas/delete',{revision,id}),import:(revision,document)=>request('/api/ideas/import',{revision,document})};
 }
 const api={offlineAdapter,httpAdapter};if(typeof module==='object'&&module.exports)module.exports=api;else root.JO9ReferenceIdeasClient=api;
}(typeof window!=='undefined'?window:globalThis));
