/* Shared additional-cut dialog for the catalog and image replacement workshop. */
(function(){
 'use strict';const config=window.JO9_CATALOG_BRIDGE,workshop=!config&&location.protocol==='http:'&&location.hostname==='127.0.0.1'&&!!location.port,host=config?.url||'http://127.0.0.1:3813/';let cutToken;
 async function call(action,input){if(!config&&!cutToken){const r=await fetch(host+'api/catalog/cuts/session');const v=await r.json();if(!r.ok)throw Error(v.error);cutToken=v.token;}
  const r=await fetch(host+'api/catalog/cuts/'+action,{method:'POST',headers:{'Content-Type':'application/json',...(config?{'X-JO9-Token':config.token}:{'X-JO9-Cut-Token':cutToken})},body:JSON.stringify(input)});const v=await r.json();if(!r.ok)throw Error(v.error);return v;
 }
 const label=p=>p.replaceAll('\\','/').replace(/^content\/pic\//i,'');
 const eligible=p=>/^(?:content\/pic\/)?(?:bg|characters|scene|reserve)\/.+\.png$/i.test(p.replaceAll('\\','/'));
 const encode=async blob=>{const b=new Uint8Array(await blob.arrayBuffer());let s='';for(let n=0;n<b.length;n+=32768)s+=String.fromCharCode(...b.subarray(n,n+32768));return btoa(s);};
 async function open(base,row){try{if(!window.JO9Workshop?.beginCut)await new Promise((resolve,reject)=>{const until=Date.now()+30000;function ready(){if(window.JO9Workshop?.beginCut)return resolve();if(Date.now()>until)return reject(Error('이미지 작업실을 다시 열어 주세요.'));setTimeout(ready,100);}ready();});return window.JO9Workshop.beginCut(base,row);}catch(e){const status=document.getElementById('save')||document.getElementById('message');if(status)status.textContent=e.message;}}
 window.JO9_CUTS={open,call,encode};
 if(config&&typeof window.side==='function'){
  const previousSide=window.side,originals=config.originalCuts||{},reservations=config.originalReservations||{};
  const originalFor=p=>{const key=label(p).toLowerCase(),base=key.replace(/ \(2\)(\.png)$/i,'$1');return originals[key]||originals[base];};
  const previousWsBtn=window.wsBtn;if(typeof previousWsBtn==='function')window.wsBtn=function(d,i){const entry=originalFor(d[0]);if(entry&&label(d[0]).toLowerCase()===entry.alias.toLowerCase())return '<span class="meta" title="JO9O 원본 경로에 연결된 B컷">JO9O 연결 · B컷</span>';return previousWsBtn.apply(this,arguments);};
  window.side=function(lab,root,rel,len,orig){const entry=orig&&originalFor(rel);if(!entry){let html=previousSide.apply(this,arguments);if(orig&&reservations[label(rel).toLowerCase()]?.status==='missing-original')html=html.replace(/<\/div>$/,'<div class="meta">B컷 예약 · JO9O 원본 미연결</div></div>');return html;}const imagePath='content\\pic\\'+entry.alias.replaceAll('/','\\'),href=window.url(window.MR+'\\'+imagePath),name=entry.alias.split('/').pop(),source=entry.source.replaceAll('/','\\');const copy=typeof window.copyCatalogOriginal==='function'?' <button type="button" class="copy-original" onclick="'+window.esc('copyCatalogOriginal('+JSON.stringify(source)+',this)')+'">작업폴더로 복사</button>':'',folder=typeof window.openFolder==='function'?' <button type="button" onclick="'+window.esc('openFolder('+JSON.stringify(window.OR+'\\'+source)+')')+'">폴더</button>':'';return '<div class="side"><div class="lab">원본 (JO9O) · B컷</div><a href="'+window.esc(href)+'" target="_blank"><img src="'+window.esc(href)+'"></a><div class="meta"><span>'+entry.width+'×'+entry.height+' · </span>'+window.kb(entry.bytes)+' · <a href="'+window.esc(href)+'" target="_blank">'+window.esc(name)+'</a>'+copy+folder+'</div></div>';};
 }
 if(config&&typeof window.rowHtml==='function'){const previous=window.rowHtml;window.rowHtml=function(d){let html=previous.apply(this,arguments);if(eligible(d[0])){const p=JSON.stringify(d[0]).replaceAll('&','&amp;').replaceAll('"','&quot;'),button='<button type="button" onclick="JO9_CUTS.open('+p+')" title="원본을 유지하고 다음 번호로 저장">전환 컷 추가 (B·C…)</button>',at=html.lastIndexOf('</div>');html=html.slice(0,at)+button+html.slice(at);}return html;};if(typeof window.render==='function')window.render();}
 if(workshop||config){document.addEventListener('click',e=>{const b=e.target.closest('[data-jo9-cut]');if(!b)return;e.preventDefault();e.stopPropagation();const r=window.JO9Workshop?.state.rows.find(r=>r.id===b.dataset.row)||null;open(b.dataset.jo9Cut,r);},true);
  function decorate(){for(const card of document.querySelectorAll('.screen-card,.targetcard')){if(card.querySelector('[data-jo9-cut]'))continue;const r=card.classList.contains('targetcard')&&window.JO9Workshop?window.JO9Workshop.state.rows.find(r=>r.id===card.dataset.id):null,p=r?.target||card.dataset.screenCard||card.querySelector('[data-path]')?.dataset.path;if(!p||!eligible(p))continue;const b=document.createElement('button');b.type='button';b.dataset.jo9Cut=p;if(r)b.dataset.row=r.id;b.textContent='전환 컷 추가 (B·C…)';card.appendChild(b);}}
  window.JO9Workshop?.refreshCuts();const observer=new MutationObserver(decorate);observer.observe(document.body,{childList:true,subtree:true});decorate();
 }
})();

/* One explicit reconciliation button; checking a flag only saves checklist state. */
(function(){
 'use strict';const config=window.JO9_CATALOG_BRIDGE,main=document.getElementById('main');if(!config||!main)return;
 const bar=document.createElement('div');bar.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0';
 const button=document.createElement('button');button.id='jo9OriginalSync';button.type='button';button.textContent='현재 상태로 동기화';button.title='현재 보관 체크에 맞춰 원본 B컷 연결을 정리합니다. 실제 컷 파일은 유지합니다.';
 const status=document.createElement('span');status.id='jo9OriginalSyncStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');bar.append(button,status);main.prepend(bar);
 button.addEventListener('click',async()=>{button.disabled=true;status.textContent='현재 보관 상태로 동기화 중…';try{
  if(window.JO9_CATALOG_SAVE)await window.JO9_CATALOG_SAVE();
  const response=await fetch(config.url+'api/catalog/original-sync',{method:'POST',headers:{'X-JO9-Token':config.token,'Content-Type':'application/json'},body:'{}'}),v=await response.json();if(!response.ok)throw Error(v.error);
  for(const name of ['originalCuts','originalReservations']){const current=config[name]||(config[name]={});Object.keys(current).forEach(k=>delete current[k]);Object.assign(current,v[name]||{});}
  if(Array.isArray(v.rows)&&Array.isArray(window.D))window.D.splice(0,window.D.length,...v.rows);
  if(window.JO9_CATALOG_ACCEPT)window.JO9_CATALOG_ACCEPT(v);else if(typeof window.render==='function')window.render();
  window.JO9Workshop?.refreshCuts();
  status.textContent='동기화 완료 · 연결 추가 '+v.sync.linked+'건 · 해제 '+v.sync.released+'건'+(v.sync.pending?' · 확인 필요 '+v.sync.pending+'건':'')+(v.sync.warning?' · 목록 갱신 확인: '+v.sync.warning:'');
  status.title=(v.sync.details||[]).map(e=>e.base+': '+e.reason).join('\n')+(v.sync.warning?'\n'+v.sync.warning:'');
 }catch(e){status.textContent='동기화 실패: '+e.message;}finally{button.disabled=false;}});
})();
