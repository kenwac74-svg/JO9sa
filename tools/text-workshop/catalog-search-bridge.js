/* JO9 MOD SEARCH_TRANSFER_20261115: fill only; the user runs the search. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.install(root);})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function accept(event,parent){
  if(event.source!==parent||event.data?.type!=='jo9:set-image-search')return null;
  try{const u=new URL(event.origin);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1')return null;}catch{return null;}
  const s=event.data.keyword;return typeof s==='string'&&s.trim()&&s.length<=200&&!/[\x00-\x1f]/.test(s)?s.trim():null;
 }
 async function putKeyword(env,keyword){await env.tabs.activate('gallery');const input=env.input();if(!input)throw Error('이미지 검색창을 찾지 못했습니다.');input.value=keyword;input.focus();const status=env.status?.();if(status)status.textContent='검색어를 넣었습니다. 검색 버튼을 눌러 주세요.';}
 function install(win){win.addEventListener('message',async event=>{const keyword=accept(event,win.parent);if(keyword===null)return;try{
  await putKeyword({tabs:win.JO9_CATALOG_TABS,input:()=>win.document.getElementById('q'),status:()=>{let el=win.document.getElementById('jo9ImageSearchTransferStatus');if(!el){el=win.document.createElement('span');el.id='jo9ImageSearchTransferStatus';el.setAttribute('role','status');win.document.getElementById('q').parentElement.append(el);}return el;}},keyword);
 }catch(error){console.warn('이미지 검색어 전달:',error.message);}});}
 return{accept,putKeyword,install};
});
