// Installed inside the existing workshop scope; shares its drop area, rows and editor.
let cutDraft=null,cutFamilyStamp='',cutFamilyLoading=false;
const cutImages=new Map;
const cutEligible=p=>/^(?:content\/pic\/)?(?:bg|characters|scene|reserve)\/.+\.png$/i.test(String(p).replaceAll('\\','/'));
const cutName=n=>n<=26?String.fromCharCode(64+n)+'컷':n+'번 컷';
function cutModeBar(){
 let bar=$('cutMode');if(!bar){bar=document.createElement('div');bar.id='cutMode';bar.className='setwarning';$('drop').before(bar);}
 bar.hidden=!cutDraft;
 if(cutDraft)bar.innerHTML='<strong>'+esc(cutDraft.editCut?'기존 전환 컷 편집':'전환 컷 추가')+'</strong> · '+esc(cutDraft.editCut||cutDraft.plan.next)+'<p class="small">아래 드롭박스에 이미지를 넣고 기존 구도·비교에서 조절하세요. 저장은 결과 카드에서 합니다.</p><button type="button" data-cut-cancel>일반 교체로 돌아가기</button>';
}
function cutImageUrl(r){return cutImages.get(r.path)?.url||assetUrl(r.path);}
async function readCut(p){
 const v=await window.JO9_CUTS.call('file',{path:relPicPath(p)});
 if(v.missing)throw Error('이미지를 찾지 못했습니다: '+p);
 const data=Uint8Array.from(atob(v.data),c=>c.charCodeAt(0));
 return{file:new File([data],v.name,{type:'image/png',lastModified:v.lastModified}),bytes:data.buffer,readOnly:!!v.readOnly};
}
async function refreshCutFamilies(force=false){
 if(!window.JO9_CUTS||cutFamilyLoading||S.busy)return;
 const originals=ScreenContext.resources.filter(r=>!r.cutFamily&&cutEligible(r.path));
 const stamp=originals.map(r=>r.path).join('|');if(!force&&stamp===cutFamilyStamp)return;
 cutFamilyLoading=true;
 try{
  const result=await window.JO9_CUTS.call('families',{paths:originals.slice(0,200).map(r=>r.path)});
  if(ScreenContext.resources.filter(r=>!r.cutFamily&&cutEligible(r.path)).map(r=>r.path).join('|')!==stamp)return;
  const resources=ScreenContext.resources.filter(r=>!r.cutFamily);
  for(const family of result.families){
   if(family.error)continue;
   const old=resources.find(r=>r.path===family.requested);if(!old)continue;
   const previous=old.path;
   // Canonicalize the requested file's spelling, never replace a B/C file with A.
   const requested=family.items.find(r=>r.path===previous)||family.items.find(r=>r.path.toLowerCase()===previous.toLowerCase());
   if(requested)Object.assign(old,requested,{cutFamily:false});
   if(previous!==old.path){if(SelectedScreenPaths.delete(previous))SelectedScreenPaths.add(old.path);if(ScreenDetailPath===previous)ScreenDetailPath=old.path;for(const s of S.inputs)if(s.mappedPath===previous)s.mappedPath=old.path;}
   for(const item of family.items){
    if(!resources.some(r=>r.path===item.path))resources.push({...item,cutFamily:true});
    if(item.readOnly&&!cutImages.has(item.path)){
     try{const loaded=await readCut(item.path);cutImages.set(item.path,{url:URL.createObjectURL(loaded.file)});}catch(e){console.warn('B컷 미리보기:',e.message);}
    }
   }
  }
  ScreenContext.resources=resources;cutFamilyStamp=stamp;renderScreenResources();
 }catch(e){console.warn('전환 컷 목록:',e.message);}finally{cutFamilyLoading=false;}
}
async function beginCut(base,row){
 if(S.busy)return;
 try{
  const plan=await window.JO9_CUTS.call('info',{base:relPicPath(base)});
  if(window.JO9WS&&!$('wsdialog').open)window.JO9WS.open([{path:'content/pic/'+plan.base,file:plan.base.split('/').pop(),folder:plan.base.split('/')[0],width:plan.width,height:plan.height}]);
  cutDraft={plan};cutModeBar();
  await refreshCutFamilies(true);
  if(row){
   const source=S.inputs.find(s=>s.id===row.inputId),file=row.output?new File([row.output],plan.next.split('/').pop(),{type:'image/png'}):row.file;
   await stageCutFile(file,{plan},source?.relative||'',row.output?null:row.options);
  }
  $('drop').scrollIntoView({behavior:'smooth',block:'center'});
  msg((plan.originalCut?'B컷은 JO9O 원본입니다. ':'')+'새 이미지 → '+plan.next+' · 기존 드롭박스와 구도·비교를 사용하세요.');
 }catch(e){msg('전환 컷 준비 실패: '+e.message,true);}
}
async function stageCutFile(file,draft,relative='',options){
 const data=await file.arrayBuffer(),snapshot=new File([data],file.name,{type:file.type,lastModified:file.lastModified});
 if(draft.plan){draft={plan:{...draft.plan}};while(S.inputs.some(s=>s.cutPlan?.next===draft.plan.next))draft.plan.next=draft.plan.next.replace(/ \((\d+)\)(\.png)$/i,(_,n,ext)=>' ('+(Number(n)+1)+')'+ext);}
 const previous=draft.editCut&&S.inputs.find(s=>s.editCut===draft.editCut);if(previous){URL.revokeObjectURL(previous.url);Object.assign(previous,{file:snapshot,relative,url:URL.createObjectURL(snapshot),signature:await C.hash(data)});await rebuild();return previous;}
 const s={id:crypto.randomUUID(),file:snapshot,relative,...inputInfo(file,relative),signature:await C.hash(data),url:URL.createObjectURL(snapshot),mappedPath:'content/pic/'+(draft.editCut||draft.plan.base),cutPlan:draft.plan?{...draft.plan}:null,editCut:draft.editCut||null};
 S.inputs.push(s);await rebuild();
 if(options){for(const r of sourceRows(s))r.options={...options};render();}
 return s;
}
async function editExistingCut(p){
 if(S.busy)return;
 try{
  const resource=resourceByPath(p),loaded=await readCut(p);
  if(loaded.readOnly||resource?.readOnly){await beginCut(resource?.base||p);await stageCutFile(loaded.file,cutDraft);msg('JO9O B컷을 작업 영역으로 불러왔습니다. 원본을 보존하고 '+cutDraft.plan.next+'로 저장합니다.');}
  else{cutDraft={editCut:relPicPath(p)};cutModeBar();await stageCutFile(loaded.file,cutDraft);msg('기존 컷을 작업 영역으로 불러왔습니다. 구도·비교에서 편집하세요: '+relPicPath(p));}
  $('rows').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){msg('전환 컷 불러오기 실패: '+e.message,true);}
}
const cutBaseAdd=add;
add=async function(files){
 if(!cutDraft)return cutBaseAdd(files);
 if(S.busy)return;busy(true);
 try{for(const entry of files){const file=entry.file||entry;if(!/\.(png|jpe?g|webp)$/i.test(file.name)||file.size>60*1024*1024)continue;if(S.inputs.length>=100)throw Error('한 번에 100장까지 편집할 수 있습니다.');await stageCutFile(file,cutDraft,entry.relative||file.webkitRelativePath||'');}msg('전환 컷 이미지를 기존 작업 영역에 넣었습니다. 구도·비교 → 규격 맞추기 → 결과 카드에서 저장하세요.');}finally{busy(false);}
};
const cutBaseSourceTargets=sourceTargets;
sourceTargets=function(s){if(s.cutPlan||s.editCut){const p=s.editCut||s.cutPlan.next;return[{path:p,name:p.split('/').pop()}];}return cutBaseSourceTargets(s);};
const cutBaseSelectTarget=selectTarget;
selectTarget=async function(row,p){
 const s=S.inputs.find(s=>s.id===row.inputId);
 if(!s?.cutPlan&&!s?.editCut)return cutBaseSelectTarget(row,p);
 revoke(row);row.error='';row.target=p;row.cutPlan=s.cutPlan;row.editCut=s.editCut;
 if(row.targetUrl)URL.revokeObjectURL(row.targetUrl);
 try{const loaded=await readCut(s.editCut||s.cutPlan.base),info=C.pngInfo(loaded.bytes);row.meta={...info,bytes:loaded.bytes,path:p,kind:C.kind(p,info.width,info.height),before:await C.hash(loaded.bytes),cap:loaded.bytes.byteLength};row.targetUrl=URL.createObjectURL(loaded.file);row.cap=outputCap(row.meta);row.options={...defaults(row.meta),frame:false};}catch(e){row.error=e.message;}
 render();
};
const cutBaseSourceCard=sourceCardHtml;
sourceCardHtml=function(s){
 if(!s.cutPlan&&!s.editCut)return cutBaseSourceCard(s);
 return '<div class="sourcebox" data-source="'+s.id+'"><img src="'+esc(s.url)+'" alt="투입 이미지"><strong>'+esc(s.file.name)+'</strong><div class="variation-note">'+(s.cutPlan?'새 전환 컷':'기존 전환 컷 편집')+'</div><div class="small">저장 파일: <b>'+esc(s.editCut||s.cutPlan.next)+'</b></div><button data-action="remove-source" '+(S.busy?'disabled':'')+'>입력 빼기</button></div>';
};
const cutBaseTargetCard=targetCardHtml;
targetCardHtml=function(r,dup){
 let html=cutBaseTargetCard(r,dup);if(!r.cutPlan&&!r.editCut)return html;
 html=html.replace('이 파일 교체',r.cutPlan?'새 컷 저장 대상':'이 전환 컷 편집');
 return html.replace(/<\/div>\s*$/,'<button type="button" data-cut-save="'+r.id+'" '+(S.busy||!r.output?'disabled':'')+'>'+(r.cutPlan?'새 컷 저장':'이 컷에 저장')+'</button></div>');
};
async function saveWorkshopCut(id){
 const row=S.rows.find(r=>r.id===id);if(!row?.output||S.busy)return;
 busy(true);
 try{
  const data=await window.JO9_CUTS.encode(new Blob([row.output]));
  const result=row.cutPlan?await window.JO9_CUTS.call('add',{base:row.cutPlan.base,next:row.cutPlan.next,before:row.cutPlan.before,data}):await window.JO9_CUTS.call('replace',{path:row.target,before:row.meta.before,cap:row.cap,data});
  const created=!!row.cutPlan,base=row.cutPlan?.base,source=S.inputs.find(s=>s.id===row.inputId),saved=created?result.path:row.target;
  URL.revokeObjectURL(source.url);source.file=new File([row.output],saved.split('/').pop(),{type:'image/png'});source.url=URL.createObjectURL(source.file);source.signature=await C.hash(row.output);
  for(const r of sourceRows(source)){revoke(r);if(r.targetUrl)URL.revokeObjectURL(r.targetUrl);}S.rows=S.rows.filter(r=>r.inputId!==source.id);
  source.cutPlan=null;source.editCut=saved;source.mappedPath='content/pic/'+saved;
  await rebuild();
  window.dispatchEvent(new CustomEvent('jo9-local-images-changed'));
  cutDraft=created?{plan:await window.JO9_CUTS.call('info',{base})}:{editCut:saved};cutModeBar();cutFamilyStamp='';
  msg('저장 완료: '+saved+(result.warning?' · '+result.warning:''));
 }catch(e){row.error=e.message;msg('컷 저장 실패: '+e.message,true);}finally{busy(false);await refreshCutFamilies(true);}
}
const cutBaseScreenRender=renderScreenResources;
renderScreenResources=function(){
 cutBaseScreenRender();cutModeBar();
 for(const card of $('screenGroups').querySelectorAll('[data-screen-card]')){
  const resource=resourceByPath(card.dataset.screenCard);if(!resource?.cutIndex)continue;
  const info=document.createElement('div');info.className='small';info.textContent=cutName(resource.cutIndex)+(resource.readOnly?' · JO9O 원본':'');card.appendChild(info);
  if(resource.readOnly){const check=card.querySelector('input[type=checkbox]');check.disabled=true;check.checked=false;SelectedScreenPaths.delete(resource.path);const img=card.querySelector('img');if(img)img.src=cutImageUrl(resource);}
  if(resource.cutIndex>1){const button=document.createElement('button');button.type='button';button.dataset.cutEdit=resource.path;button.textContent=resource.readOnly?'새 작업 컷으로 편집':'작업 영역에서 편집';card.appendChild(button);}
 }
 refreshCutFamilies();
};
const cutBaseRender=render;
render=function(){cutBaseRender();cutModeBar();};
document.addEventListener('click',e=>{
 const save=e.target.closest('[data-cut-save]'),load=e.target.closest('[data-cut-edit]'),cancel=e.target.closest('[data-cut-cancel]');if(!save&&!load&&!cancel)return;
 e.preventDefault();e.stopPropagation();if(S.busy)return;
 if(save)saveWorkshopCut(save.dataset.cutSave);else if(load)editExistingCut(load.dataset.cutEdit);else{cutDraft=null;cutModeBar();msg('일반 이미지 교체 모드입니다.');}
},true);
window.addEventListener('jo9-local-images-changed',()=>{cutFamilyStamp='';refreshCutFamilies(true);});
setInterval(refreshCutFamilies,1500);
window.JO9Workshop.beginCut=beginCut;
window.JO9Workshop.editCut=editExistingCut;
window.JO9Workshop.refreshCuts=()=>refreshCutFamilies(true);
window.JO9Workshop.add=files=>add(files);
window.JO9Workshop.render=()=>render();
window.JO9Workshop.selectTarget=(...args)=>selectTarget(...args);
window.JO9Workshop.rebuild=()=>rebuild();
window.dispatchEvent(new CustomEvent('jo9-workshop-ready'));
