  // JO9 MOD START CHECKLIST_MANUAL_IMAGE_LINKS_20261108
  const editableImageFields=new Set(['fullimage','fullmade','fullsecretary','fullmistress','fullpregnant','seed_ava','seed_ava_gray','seed_ava_clear',...outfits.flatMap(([key])=>['indpack_'+key,'indpack_'+key+'_horny','indpack_'+key+'_rebel']), 'indpack_title', 'indpack_naked']);
  function mergeCharacterLinks(result){
    if(result.files){files.clear();for(const p of result.files)files.set(normal(p),p);data.files=Array.from(files.values());}
    for(const current of result.characters||[]){const c=data.characters.find(c=>c.id===current.id);if(c){const aliases=new Set((c.compatibilityAssets||[]).map(p=>normal(p.path))),assets=[...new Set([...(c.assets||[]),...(c.namedSceneAssets||[]),...(current.assets||[])].filter(p=>exists(p)&&!aliases.has(normal(p))))];Object.assign(c,current,{assets});}}
    namedLabel.replaceChildren(namedOnly,document.createTextNode(' 이름 있는 유니크만 ('+data.characters.filter(c=>c.hasFixedName).length+')'));
    actionsById=collectActions();version=Date.now();render();
  }
  let currentLinksLoading=false;
  async function readCurrentLinks(rescan=false){
    if(!live||currentLinksLoading)return;currentLinksLoading=true;
    try{const result=await statusApi('character-images/read',{ids:data.characters.map(c=>c.id),rescan});mergeCharacterLinks(result);message.textContent='현재 WORK JSON의 이미지 연결과 파일 상태를 읽었습니다.'+(result.errors?.length?' · 확인 필요 '+result.errors.length+'명':'');}
    catch(e){message.textContent='WORK JSON 연결 확인 실패: '+e.message;}finally{currentLinksLoading=false;}
  }
  function imageLinkButton(c,field,title){
    if(!c||!editableImageFields.has(field))return node('span');
    const b=node('button','파일 선택·연결');b.type='button';b.disabled=!live;b.dataset.imageLinkField=field;b.dataset.imageLinkCharacter=c.id;b.onclick=()=>chooseLinkedImage(c,field,title);return b;
  }
  async function chooseLinkedImage(c,field,title){
    if(busy)return;let dialog;
    try{
      const current=await statusApi('character-images/read',{ids:[c.id]}),latest=current.characters[0];mergeCharacterLinks(current);if(!latest)throw Error('캐릭터 JSON을 찾지 못했습니다.');const expectedHash=latest.jsonSha256;
      dialog=node('dialog');dialog.className='gc-link-dialog';dialog.setAttribute('aria-label',c.id+' '+title+' 이미지 파일 연결');root.append(dialog);
      dialog.style.cssText='color:inherit;background:#202832;border:1px solid #9d784a;border-radius:8px;width:min(860px,94vw);max-height:90vh';
      const header=node('div',undefined,'gc-row'),close=node('button','취소');header.append(node('h3',c.id+' · '+c.name+' · '+title),close);dialog.append(header,node('p','연결할 PNG를 폴더에서 선택하세요. 이 항목의 등록 경로를 바꾸며 그림 파일은 그대로 둡니다.','gc-note'));
      if(latest.imageSyncTargets?.length)dialog.append(node('p','이미지 연동: '+[c.id,...latest.imageSyncTargets].join(' · ')+' 번호에 함께 저장합니다. 각 번호의 설명문과 능력치는 유지합니다.','gc-note'));
      const fallback={indpack_maid:'fullmade',indpack_secr:'fullsecretary',indpack_dom:'fullmistress'},old=latest.refs[field]||latest.refs[fallback[field]]||'';
      dialog.append(node('p','현재 연결: '+(old||'미등록'),'gc-path'));const currentWarning=ruleNote(latest,old,field);if(currentWarning)dialog.append(currentWarning);
      const pathLabel=node('p','', 'gc-path'),nav=node('div',undefined,'gc-row'),up=node('button','상위 폴더'),home=node('button','PIC 폴더 처음');nav.append(up,home);dialog.append(pathLabel,nav);
      const list=node('div');list.style.cssText='display:flex;flex-direction:column;gap:4px;max-height:35vh;overflow:auto;margin:10px 0';dialog.append(list);
      const paging=node('div',undefined,'gc-row'),prev=node('button','이전 목록'),counter=node('span'),next=node('button','다음 목록');paging.append(prev,counter,next);dialog.append(paging);
      const selectionWarning=node('p','','gc-warn');selectionWarning.setAttribute('role','status');dialog.append(selectionWarning);
      const selected=node('p','파일을 선택하세요.','gc-path'),preview=node('img');preview.alt='직접 연결할 PNG';preview.hidden=true;preview.style.cssText='max-width:100%;max-height:180px;object-fit:contain';const error=node('p','', 'gc-error'),apply=node('button','이 파일 연결');apply.disabled=true;dialog.append(selected,preview,error,apply);
      let folder='',entries=[],offset=0,choice='',revision=0,saving=false;
      function closeDialog(){if(saving)return;revision++;dialog.close();dialog.remove();}
      close.onclick=closeDialog;dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();});dialog.addEventListener('close',()=>{revision++;dialog.remove();});
      function show(){list.replaceChildren();const visible=entries.filter(e=>! /^(?:_|backup)/i.test(e.name)&&(e.kind==='directory'||/\.png$/i.test(e.name))),page=visible.slice(offset,offset+100);for(const entry of page){const b=node('button',(entry.kind==='directory'?'📁 ':'🖼 ')+entry.name);b.style.textAlign='left';b.onclick=()=>{if(saving)return;const p=[folder,entry.name].filter(Boolean).join('/');if(entry.kind==='directory')browse(p);else{choice=p;selected.textContent='선택: '+p;const warning=pathRule(latest,p,field);selectionWarning.textContent=warning?'경로 규칙 경고 · 권장 폴더: '+warning.expected+' · 이 파일을 그대로 연결할 수 있습니다.':'';apply.disabled=false;preview.hidden=!images.checked;if(images.checked)preview.src=assetUrl(p);error.textContent='';}};list.append(b);}if(!page.length)list.append(node('p','하위 폴더 또는 PNG가 없습니다.'));counter.textContent=(visible.length?Math.floor(offset/100)+1:0)+' / '+Math.ceil(visible.length/100);prev.disabled=!offset;next.disabled=offset+100>=visible.length;pathLabel.textContent='content/pic'+(folder?'/'+folder:'');up.disabled=!folder;}
      async function browse(p){const request=++revision;list.textContent='폴더 읽는 중…';try{const result=await api('entries',{path:p});if(request!==revision)return;if(result.missing&&p){await browse('');return;}folder=p;entries=(result.entries||[]).sort((a,b)=>(a.kind===b.kind?0:a.kind==='directory'?-1:1)||a.name.localeCompare(b.name));offset=0;show();}catch(e){if(request===revision)error.textContent=e.message;}}
      up.onclick=()=>{if(!saving)browse(folder.split('/').slice(0,-1).join('/'));};home.onclick=()=>{if(!saving)browse('');};prev.onclick=()=>{if(!saving){offset=Math.max(0,offset-100);show();}};next.onclick=()=>{if(!saving){offset+=100;show();}};
      apply.onclick=async()=>{if(saving||!choice)return;saving=true;busy=true;apply.disabled=true;close.disabled=true;try{const saved=await statusApi('character-images/apply',{id:c.id,field,path:choice,expectedHash});files.set(normal(saved.path),saved.path);mergeCharacterLinks({characters:saved.characters||[saved.character]});message.textContent=(saved.affectedIds||[c.id]).join(' · ')+' · '+title+' 연결 저장: '+saved.path+' · JSON 원본 백업과 연결 이력을 기록했습니다.';dialog.close();dialog.remove();}catch(e){error.textContent=e.message;apply.disabled=false;}finally{saving=false;busy=false;close.disabled=false;}};
      dialog.showModal();await browse(old?old.split('/').slice(0,-1).join('/'):'');
    }catch(e){message.textContent='파일 연결: '+e.message;if(dialog)dialog.remove();}
  }
  // JO9 MOD END CHECKLIST_MANUAL_IMAGE_LINKS_20261108
