/* JO9 MOD START NATIVE_CATALOG_TABS_20261108 */
(function(root,factory){
 const create=factory();
 if(typeof module==='object'&&module.exports)module.exports={create};
 else root.JO9_CATALOG_TABS=create({document:root.document,location:root.location,history:root.history,fetch:root.fetch.bind(root)});
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 return function create(env){
  const {document,location,history}=env,keys=['gallery','girls','pack','mob','notes'];
  const panels=new Map(keys.map(k=>[k,document.getElementById('jo9-catalog-panel-'+k)]));
  const buttons=new Map(keys.map(k=>[k,document.getElementById('jo9-catalog-tab-'+k)]));
  const loaded=new Set(),mounting=new Map(),scripts=new Map(),sources=new Map();let active=null;
  const current=()=>active;
  function script(src){
   if(scripts.has(src))return scripts.get(src);
   const p=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();scripts.delete(src);reject(Error('기능 파일을 읽지 못했습니다: '+src));};document.body.append(s);});scripts.set(src,p);return p;
  }
  async function source(key){
   if(sources.has(key))return sources.get(key);
   const p=(async()=>{const embedded=document.getElementById('jo9-catalog-module-'+key);if(embedded)return embedded.innerHTML;const r=await env.fetch('catalog-tab/'+key,{cache:'no-store'});if(!r.ok)throw Error('목록을 읽지 못했습니다 ('+r.status+').');return r.text();})();sources.set(key,p);try{return await p;}catch(e){sources.delete(key);throw e;}
  }
  async function mount(key){
   const text=await source(key);if(active!==key)return;
   const panel=panels.get(key),holder=document.createElement('template');holder.innerHTML=text;
   const jobs=[...holder.content.querySelectorAll('script')].map(s=>({src:s.getAttribute('src'),text:s.textContent}));
   for(const s of holder.content.querySelectorAll('script'))s.remove();
   panel.replaceChildren(holder.content.cloneNode(true));
   for(const job of jobs){
    if(job.src)await script(job.src);
    else {const s=document.createElement('script');s.textContent=job.text;document.body.append(s);s.remove();}
   }
   loaded.add(key);panel.dataset.loaded='true';
  }
  async function activate(key){
   if(!panels.has(key))key='gallery';active=key;
   for(const id of keys){panels.get(id).hidden=id!==key;buttons.get(id).setAttribute('aria-selected',String(id===key));buttons.get(id).tabIndex=id===key?0:-1;}
   const tree=document.getElementById('tree');if(tree)tree.hidden=key!=='gallery';
   const url=new URL(location.href);url.searchParams.set('catalogtab',key);url.searchParams.delete('girlssets');url.searchParams.delete('mobsets');history.replaceState(null,'',url);
   const panel=panels.get(key),status=document.getElementById('jo9CatalogLoadStatus');
   if(!loaded.has(key)){
    panel.setAttribute('aria-busy','true');status.textContent=buttons.get(key).textContent+' 불러오는 중…';
    try{
     if(!mounting.has(key))mounting.set(key,mount(key).finally(()=>mounting.delete(key)));
     await mounting.get(key);
     if(active===key&&!loaded.has(key))return activate(key);
    }catch(e){if(active===key){panel.replaceChildren();const note=document.createElement('p');note.textContent=e.message;const retry=document.createElement('button');retry.type='button';retry.textContent='다시 불러오기';retry.onclick=()=>activate(key);panel.append(note,retry);status.textContent=e.message;}return;}
    finally{panel.setAttribute('aria-busy','false');}
   }
   if(active===key){status.textContent='';document.dispatchEvent(new CustomEvent('jo9:catalog-tab',{detail:key}));}
  }
  for(const key of keys)buttons.get(key).onclick=()=>activate(key);
  document.getElementById('jo9CatalogTabs').addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const at=keys.findIndex(k=>buttons.get(k)===document.activeElement),i=event.key==='Home'?0:event.key==='End'?keys.length-1:(at+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;activate(keys[i]);buttons.get(keys[i]).focus();
  });
  for(const [id,key]of [['jo9GalleryNav','gallery'],['jo9GirlsNav','girls']]){const b=document.getElementById(id);if(b)b.onclick=()=>activate(key);}
  function start(){const q=new URLSearchParams(location.search);return activate(q.get('catalogtab')||(q.get('girlssets')==='1'?'girls':q.get('mobsets')==='1'?'mob':'gallery'));}
  // Export before any module executes, including cached/file templates.
  const api={activate,current,start,loaded:key=>loaded.has(key)};
  if(env.autoStart!==false)queueMicrotask(start);
  return api;
 };
});
/* JO9 MOD END NATIVE_CATALOG_TABS_20261108 */
