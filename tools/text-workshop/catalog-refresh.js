/* JO9 MOD START GALLERY_DISK_REFRESH_20261115: read files without QSP/status writes. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else api.install(root);
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const normalize=p=>String(p).replaceAll('\\','/').replace(/^content\/pic\//i,'');
 function create(env){
  let epoch=0,pending=null;
  const parse=src=>{try{const u=new URL(src,env.base);return u.pathname==='/api/catalog-asset'?u:null;}catch{return null;}};
  const versionUrl=src=>{const u=parse(src);if(!u)return src;u.searchParams.set('reload',String(epoch));return u.href;};
  async function run({rescan=false}={}){
   let total=null;if(rescan)total=(await env.request('index?rescan=1')).index.length;
   const paths=[...new Set(env.getImages().map(i=>parse(i.src)).filter(u=>u&&u.searchParams.get('original')!=='1').map(u=>normalize(u.searchParams.get('p')||'')).filter(Boolean))],revisions={};
   for(let at=0;at<paths.length;at+=500)Object.assign(revisions,await env.request('revisions',{paths:paths.slice(at,at+500)}));
   for(const row of env.getRows()){const rev=revisions[normalize(row[0])];if(rev&&Number.isFinite(rev.bytes))row[3]=rev.bytes;}
   epoch=Math.max((env.now||Date.now)(),epoch+1);env.repaint();
   let count=0;
   for(const image of env.getImages()){
    if(!parse(image.src))continue;const next=versionUrl(image.src);if(next!==image.src)image.src=next;count++;
    if(image.parentElement?.tagName==='A')image.parentElement.href=next;
   }
   return {count,total};
  }
  function refresh(options){if(pending)return pending;pending=run(options).finally(()=>{pending=null;});return pending;}
  return {refresh,versionUrl};
 }
 function install(win){
  if(win.JO9_GALLERY_REFRESH)return;
  const doc=win.document,cfg=win.JO9_CATALOG_BRIDGE,main=doc.getElementById('jo9-catalog-panel-gallery');if(!cfg||!main)return;
  const sync=doc.getElementById('jo9OriginalSync');
  if(sync){sync.textContent='원본 B컷 연결을 QSP에 반영';sync.title='체크리스트의 원본 B컷 등록·보관 선택을 현재 WORK QSP에 반영합니다. 이미지 다시 읽기와는 별도 기능입니다.';}
  const bar=sync?.parentElement||doc.createElement('div');if(!bar.parentElement){bar.style.cssText='display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0';main.prepend(bar);}
  const button=doc.createElement('button');button.id='jo9GalleryReload';button.type='button';button.className='button secondary';button.textContent='폴더 이미지 다시 불러오기';button.title='content/pic 폴더의 최신 파일로 현재 화면을 갱신합니다. 검색·폴더·쪽 선택과 체크 상태는 유지하며 QSP는 변경하지 않습니다.';
  const status=doc.createElement('span');status.id='jo9GalleryReloadStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');bar.prepend(button,status);
  const controller=create({base:cfg.url,getImages:()=>[...main.querySelectorAll('img')],getRows:()=>win.D||[],repaint:()=>{if(typeof win.render==='function')win.render();},request:async(action,input)=>{
   const response=await win.fetch(cfg.url+'api/catalog/pic/'+action,{method:input?'POST':'GET',headers:{'X-JO9-Token':cfg.token,...(input?{'Content-Type':'application/json'}:{})},body:input?JSON.stringify(input):undefined,cache:'no-store'}),value=await response.json();if(!response.ok)throw Error(value.error||'이미지를 다시 읽지 못했습니다.');return value;
  }});
  const originalUrl=win.url;if(typeof originalUrl==='function')win.url=function(){return controller.versionUrl(originalUrl.apply(this,arguments));};
  async function refresh(rescan){button.disabled=true;status.textContent=rescan?'폴더의 최신 이미지를 읽는 중…':'최신 이미지를 확인하는 중…';try{const r=await controller.refresh({rescan});status.textContent=(r.total===null?'':'폴더 PNG '+r.total.toLocaleString()+'개 확인 · ')+'화면 그림 '+r.count+'개 갱신';}catch(e){status.textContent='이미지 갱신 실패: '+e.message;}finally{button.disabled=false;}}
  button.onclick=()=>refresh(true);
  doc.addEventListener('jo9:catalog-tab',event=>{if(event.detail==='gallery')refresh(false);});
  win.addEventListener('jo9-local-images-changed',()=>refresh(false));
  win.JO9_GALLERY_REFRESH={refresh:()=>refresh(true)};
 }
 return {create,install};
});
/* JO9 MOD END GALLERY_DISK_REFRESH_20261115 */
