/* JO9 MOD START DIALOGUE_IMAGE_UI_20261108 */
(function(){
 'use strict';const el=id=>document.getElementById(id);let active=null,chosen='',prepared=null,folder='',entries=[],offset=0,browseVersion=0,imageRequestVersion=0,loadingWorkshop=null;
 const sayImage=(text,bad=false)=>{el('dialogueImageStatus').textContent=text;el('dialogueImageStatus').className=bad?'error':'muted';};
 function invalidateImage(){imageRequestVersion++;prepared=null;el('dialogueImageApply').disabled=true;el('dialogueImagePreviewBox').hidden=true;}
 function setChosen(path){chosen=String(path||'').replace(/^content[\\/]pic[\\/]/i,'').replaceAll('\\','/');el('dialogueImagePath').textContent=chosen||'연결할 이미지를 선택하세요.';invalidateImage();}
 function selectionChanged(c){active=c;invalidateImage();setChosen('');el('dialogueImagePanel').hidden=!c?.selection;const use=c?.flow?.usage;el('dialogueImageTarget').textContent=c?.selection?(use?use.location+' · '+use.title+' · '+c.flow.selected+'단계':c.selection.location+' · '+c.selection.line+'행')+'\n'+c.selection.text:'';}
 window.addEventListener('jo9:selection',e=>selectionChanged(e.detail));
 window.addEventListener('jo9:single-preview',invalidateImage);window.addEventListener('jo9:text-changed',invalidateImage);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function renderFiles(){
  el('dialogueImageFolder').textContent='content/pic'+(folder?'/'+folder:'');el('dialogueImageUp').disabled=!folder;
  const list=entries.filter(e=>! /^(?:_|backup)/i.test(e.name)&&(e.kind==='directory'||/\.(png|jpe?g|gif|webp|bmp)$/i.test(e.name))),page=list.slice(offset,offset+100);
  el('dialogueImageFiles').innerHTML=page.map(e=>'<button type="button" data-image-kind="'+e.kind+'" data-image-name="'+esc(e.name)+'">'+(e.kind==='directory'?'📁 ':'🖼 ')+esc(e.name)+'</button>').join('')||'<p class="muted">이미지가 없습니다.</p>';
  el('dialogueImagePage').textContent=(list.length?Math.floor(offset/100)+1:0)+' / '+Math.ceil(list.length/100);el('dialogueImagePrev').disabled=offset===0;el('dialogueImageNext').disabled=offset+100>=list.length;
 }
 async function browse(path){const version=++browseVersion;el('dialogueImageFiles').textContent='폴더를 읽는 중…';try{const r=await api('/api/catalog/pic/entries',{path});if(version!==browseVersion)return;folder=path;entries=(r.entries||[]).sort((a,b)=>(a.kind===b.kind?0:a.kind==='directory'?-1:1)||a.name.localeCompare(b.name));offset=0;renderFiles();}catch(e){if(version===browseVersion)el('dialogueImageFiles').textContent=e.message;}}
 el('dialogueImageChoose').onclick=()=>{el('dialogueImagePicker').showModal();browse(chosen?chosen.split('/').slice(0,-1).join('/'):'');};
 el('dialogueImagePickerClose').onclick=()=>{browseVersion++;el('dialogueImagePicker').close();};
 el('dialogueImageUp').onclick=()=>browse(folder.split('/').slice(0,-1).join('/'));
 el('dialogueImageFiles').onclick=e=>{const b=e.target.closest('button[data-image-name]');if(!b)return;const path=[folder,b.dataset.imageName].filter(Boolean).join('/');if(b.dataset.imageKind==='directory')browse(path);else{setChosen(path);el('dialogueImagePicker').close();sayImage('이미지를 선택했습니다. 장면 미리보기로 연결 범위를 확인하세요.');}};
 el('dialogueImagePrev').onclick=()=>{offset=Math.max(0,offset-100);renderFiles();};el('dialogueImageNext').onclick=()=>{offset+=100;renderFiles();};
 function loadScript(src){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('이미지 등록 도구를 불러오지 못했습니다.'));};document.body.append(script);});}
 async function openRegistration(){
  if(!active?.selection)throw Error('대사를 먼저 선택하세요.');
  if(!window.JO9WS){if(!loadingWorkshop)loadingWorkshop=(async()=>{window.JO9_CATALOG_BRIDGE={url:location.origin+'/',token};if(!window.JO9PIC)await loadScript('/catalog_pic.js');await loadScript('/catalog_editor.js');})().catch(e=>{loadingWorkshop=null;throw e;});await loadingWorkshop;}
  window.JO9WS.open([]);sayImage('이미지 등록 창에서 투입 → 새 경로 추가 → 폴더 선택 → 새 파일 저장을 진행하세요.');
 }
 el('dialogueImageImport').onclick=()=>openRegistration().catch(e=>sayImage(e.message,true));
 window.addEventListener('jo9ws-applied',e=>{const paths=e.detail||[];if(paths.length===1&&active?.selection){setChosen(paths[0]);document.getElementById('wsdialog')?.close();sayImage('새 이미지를 등록했습니다. 장면 미리보기 후 이미지 연결을 반영하세요.');}else if(paths.length)sayImage(paths.length+'개 이미지를 등록했습니다. 기존 이미지 선택에서 연결할 파일을 고르세요.');});
 el('dialogueImagePreview').onclick=async()=>{try{
  invalidateImage();invalidate();if(!active?.selection)throw Error('대사를 먼저 선택하세요.');if(!chosen)throw Error('연결할 이미지를 선택하세요.');
  const version=imageRequestVersion,request={selection:active.selection,sceneId:active.scene?.id,usageId:active.flow?.usage?.id,path:chosen};const p=await api('/api/dialogue-image/preview',request);if(version!==imageRequestVersion)return;
  prepared=p;el('dialogueImagePreviewImg').src=p.imageUrl;el('dialogueImagePreviewText').textContent=p.dialogue;el('dialogueImageScope').textContent=p.location+' · '+p.title+' · '+p.page+'단계\n'+p.path+(p.variants>1?'\n이 단계의 조건별 대사 '+p.variants+'개에 공통으로 표시됩니다.':'')+'\n다른 단계의 이미지 연결은 유지합니다.';
  el('dialogueImagePreviewBox').hidden=false;el('dialogueImageApply').disabled=false;sayImage('선택 대사와 표시할 이미지를 확인한 뒤 「이미지 연결 반영」을 누르세요.');
 }catch(e){sayImage(e.message,true);}};
 el('dialogueImageApply').onclick=async()=>{const p=prepared;if(!p)return;el('dialogueImageApply').disabled=true;try{
  const draft={text:el('replacement').value,addition:el('additionText').value,additionMode:el('additionMode').value};
  const result=await api('/api/apply',{id:p.id,approved:true});window.dispatchEvent(new Event('jo9:text-changed'));invalidate();visits=[];
  if(result.selection){selectedImagePath='';render(await api('/api/context',{selection:result.selection,sceneId:p.sceneId,usageId:p.usageId,mode:mode()}));}
  if(result.selection){el('replacement').value=draft.text;el('additionText').value=draft.addition;el('additionMode').value=draft.additionMode;remember();rememberAddition();}
  await refresh();await state();sayImage('이미지 연결을 반영했습니다. 변경 기록에서 되돌릴 수 있습니다. 기록: '+result.id);
 }catch(e){invalidateImage();sayImage(e.message,true);}};
 if(typeof context!=='undefined'&&context)selectionChanged(context);
})();
/* JO9 MOD END DIALOGUE_IMAGE_UI_20261108 */
