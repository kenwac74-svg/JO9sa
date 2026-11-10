(function (root) {
 'use strict';
 const kinds=['traits','items','spells'];
 const fields=['title','description','effect','condition','cost','notes'];
 function fail(message){const error=new Error(message);error.status=400;throw error;}
 function makeItem(input,options={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('아이디어 형식을 확인하세요.');
  if(!kinds.includes(input.kind))fail('특성·아이템·마법 중 종류를 선택하세요.');
  for(const field of fields)if(input[field]!==undefined&&typeof input[field]!=='string')fail('아이디어 문장은 문자열이어야 합니다.');
  if(!String(input.title||'').trim())fail('아이디어 이름을 입력하세요.');
  const id=options.id||input.id;
  if(typeof id!=='string'||!id.trim())fail('아이디어 ID가 없습니다.');
  const now=options.now||new Date().toISOString(),existing=options.existing;
  const result={...(existing||{}),id,kind:input.kind};
  for(const field of fields)result[field]=input[field]||'';
  result.createdAt=existing?.createdAt||now;result.updatedAt=now;
  return result;
 }
 function document(value){
  if(!value||value.schema!==1||!Array.isArray(value.items))fail('JO9 아이디어 JSON(schema 1)을 선택하세요.');
  const seen=new Set(),items=value.items.map(item=>{
   const now=typeof item.updatedAt==='string'?item.updatedAt:new Date().toISOString();
   const result=makeItem(item,{id:item.id,now,existing:item});
   if(seen.has(result.id))fail('JSON에 중복 아이디어 ID가 있습니다.');seen.add(result.id);return result;
  });
  return{schema:1,items};
 }
 function mergeImport(current,incoming){
  const base=document({schema:1,items:current}),next=document(incoming),ids=new Set(base.items.map(item=>item.id));let added=0,skipped=0;
  for(const item of next.items){if(ids.has(item.id)){skipped++;continue;}base.items.push(item);ids.add(item.id);added++;}
  return{...base,added,skipped};
 }
 const api={kinds,fields,makeItem,document,mergeImport};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.JO9ReferenceIdeas=api;
}(typeof window!=='undefined'?window:globalThis));
