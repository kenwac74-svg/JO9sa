/* Localhost PIC adapter: the original standalone Workshop is unchanged. */
(function(){
 'use strict';const cfg=window.JO9_CATALOG_BRIDGE;if(!cfg||!/^http:\/\/127\.0\.0\.1:\d+\//.test(location.href))return;
 async function call(action,input){const r=await fetch(cfg.url+'api/catalog/pic/'+action,{method:input?'POST':'GET',headers:{'X-JO9-Token':cfg.token,...(input?{'Content-Type':'application/json'}:{})},body:input?JSON.stringify(input):undefined,cache:'no-store'});const v=await r.json();if(!r.ok)throw Error(v.error||'PIC 서버 응답 실패');if(v.missing)throw new DOMException('파일 또는 폴더가 없습니다.','NotFoundError');return v;}
 const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 async function base64(data){const a=new Uint8Array(await new Blob([data]).arrayBuffer());let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s);}
 function dir(p=''){return{kind:'directory',name:p.split('/').pop()||'pic',localPIC:true,queryPermission:async()=> 'granted',requestPermission:async()=> 'granted',
  async getDirectoryHandle(n){const q=p?p+'/'+n:n;await call('entries',{path:q});return dir(q);},
  async getFileHandle(n){const q=p?p+'/'+n:n;await call('file',{path:q});return{kind:'file',name:n,async getFile(){const v=await call('file',{path:q});return new File([bytes(v.data)],v.name,{type:/\.png$/i.test(n)?'image/png':'application/json',lastModified:v.lastModified});}};},
  async *entries(){const v=await call('entries',{path:p});for(const e of v.entries)yield[e.name,e.kind==='directory'?dir(p?p+'/'+e.name:e.name):{kind:'file',name:e.name,getFile:async()=>{const v=await call('file',{path:p?p+'/'+e.name:e.name});return new File([bytes(v.data)],e.name,{type:'image/png'});}}];}
 };}
 window.JO9_LOCAL_PIC={async connect(force){const v=await call('index'+(force?'?rescan=1':''));return{root:dir(),index:v.index};},async restore(id){return call('restore',{id});},async apply(jobs){const list=[];for(const j of jobs)list.push({...j,data:await base64(j.data)});const r=await call('apply',{jobs:list});if(r.catalogWarning)alert(r.catalogWarning);window.dispatchEvent(new CustomEvent('jo9-local-images-changed'));return r;}};
 let checking=false;const versions={};
 async function refresh(){if(checking||document.hidden)return;checking=true;try{
  const imgs=[...document.querySelectorAll('img')].filter(i=>i.src.includes('/api/catalog-asset?')&&!new URL(i.src).searchParams.get('original')?.match(/^1$/));const paths=[...new Set(imgs.map(i=>new URL(i.src).searchParams.get('p')).filter(Boolean).map(p=>p.replace(/^content[\\/]pic[\\/]/i,'').replaceAll('\\','/')))].slice(0,500);
  if(!paths.length)return;const rev=await call('revisions',{paths});
  for(const i of imgs){const u=new URL(i.src),p=(u.searchParams.get('p')||'').replace(/^content[\\/]pic[\\/]/i,'').replaceAll('\\','/'),v=rev[p]?.version;if(v&&versions[p]!==v){u.searchParams.set('v',v);i.src=u.href;}}
  for(const [p,v] of Object.entries(rev))versions[p]=v.version;
 }catch(e){console.warn('PIC 이미지 갱신:',e.message)}finally{checking=false;}}
 window.addEventListener('focus',refresh);window.addEventListener('jo9-local-images-changed',refresh);setInterval(refresh,3000);
})();
