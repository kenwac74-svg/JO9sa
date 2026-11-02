/* JO9 MOD START MOB_SET_CATALOG_20261028: existing PIC writer owns backup and patch history. */
(function(){
 'use strict';
 const manifest=window.JO9_MOB_SETS,cfg=window.JO9_CATALOG_BRIDGE;
 if(!manifest||!cfg||document.getElementById('jo9-mob-sets'))return;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 // JO9 MOD START MOB_MAGE_EDIT_PROMPTS_20261029
 function appendMageEditPrompt(box,slot){
  const edit=slot&&slot.mageEdit;if(!edit||typeof edit!=='object')return;
  const prompt=typeof edit.prompt==='string'?edit.prompt.trim():'';
  const negative=typeof edit.negative==='string'?edit.negative.trim():'';
  const note=typeof edit.note==='string'?edit.note.trim():'';
  if(!prompt&&!negative&&!note)return;
  const details=node('details');details.style.cssText='margin:8px 0;font-size:12px;overflow-wrap:anywhere';
  details.append(node('summary','Mage Edit 추천 프롬프트'));
  if(edit.label)details.append(node('p',String(edit.label)));
  if(note)details.append(node('p',note));
  const addField=(title,text,rows)=>{
   const field=node('textarea'),copy=node('button','복사'),feedback=node('span');
   field.value=text;field.readOnly=true;field.rows=rows;field.setAttribute('aria-label',title);
   field.style.cssText='display:block;width:100%;box-sizing:border-box;margin:4px 0;font:12px/1.4 monospace;resize:vertical';
   copy.type='button';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   copy.onclick=async()=>{
    copy.disabled=true;
    try{
     if(!navigator.clipboard||typeof navigator.clipboard.writeText!=='function')throw Error('clipboard unavailable');
     await navigator.clipboard.writeText(field.value);feedback.textContent=' 복사했습니다.';
    }catch(_){field.focus();field.select();feedback.textContent=' 자동 복사를 사용할 수 없어 선택했습니다. Ctrl+C로 복사하세요.';}
    finally{copy.disabled=false;}
   };
   details.append(node('p',title),field,copy,feedback);
  };
  if(prompt)addField('English prompt',prompt,6);
  if(negative)addField('Negative prompt',negative,3);
  box.append(details);
 }
 // JO9 MOD END MOB_MAGE_EDIT_PROMPTS_20261029
 // JO9 MOD START MOB_BACKGROUND_CONTEXTS_20261029
 function appendBackgroundInfo(card,item){
  const contexts=Array.isArray(item.appearanceContexts)?item.appearanceContexts:[];
  const value=v=>Array.isArray(v)?v.map(value).filter(Boolean).join(' / '):v===null||v===undefined?'':String(v);
  const label=ctx=>value(ctx.label||ctx.kind||ctx.contextId||ctx.environment||'미분류');
  if(contexts.length){
   card.append(node('p','등장: '+[...new Set(contexts.map(label))].join(' / ')));
   const details=node('details');details.append(node('summary','등장 배경·QSP 근거'));
   details.style.cssText='margin:8px 0;overflow-wrap:anywhere';
   for(const ctx of contexts){
    const section=node('div');section.append(node('h4',label(ctx)));
    const add=(title,v)=>{const text=value(v);if(text)section.append(node('p',title+': '+text));};
    add('배경 기준',ctx.environment);
    add('장소',ctx.place);
    add('현재 전투 배경',ctx.battleBackground);
    if(value(ctx.sceneBackground)!==value(ctx.battleBackground))add('전투 전 장소 배경',ctx.sceneBackground);
    add('조건',ctx.condition);
    if(Array.isArray(ctx.evidence)&&ctx.evidence.length){
     const evidence=node('ul');
     for(const entry of ctx.evidence){
      const where=value(entry.location)+(entry.line===null||entry.line===undefined?'':':'+value(entry.line));
      const row=node('li');row.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';
      row.append(node('code',[where,value(entry.text)].filter(Boolean).join(' — ')));evidence.append(row);
     }
     section.append(evidence);
    }
    details.append(section);
   }
   card.append(details);
  }
  const notes=Array.isArray(item.backgroundNotes)?item.backgroundNotes:typeof item.backgroundNotes==='string'?[item.backgroundNotes]:[];
  for(const text of notes){if(!text)continue;const note=node('p','배경 확인: '+value(text));note.style.cssText='color:#f3c77b;white-space:pre-wrap;overflow-wrap:anywhere';card.append(note);}
 }
 // JO9 MOD END MOB_BACKGROUND_CONTEXTS_20261029
 const root=node('details');root.id='jo9-mob-sets';root.style.cssText='padding:14px 14px 80px;margin:14px;border:2px solid #987445;background:#181b20;color:#eee';
 root.append(node('summary','전투 MOB 이미지 세트 · 초상 / 전신 / 패배'));
 root.append(node('p','각 칸은 실제 게임 조회 파일입니다. 같은 이름의 전신과 defeated 폴더의 패배 컷신을 관리합니다. 탈옥수의 기존 개별 파일명 예외는 유지합니다. 공유 표시는 여러 적이 같은 파일을 사용한다는 뜻입니다. 누락 패배 컷신은 준비 전까지 기존 전신으로 표시합니다. 전신도 없는 경우에는 전신을 먼저 추가하세요. 경주 전용 초상은 제외합니다.'));
 const exclusions=node('details');exclusions.append(node('summary','경주 전용 · 전투 컷신 불필요'),node('p',(manifest.excludedRaceFiles||[]).join(', ')));root.append(exclusions);
 root.append(node('p','초상 프레임 정리(2026-10-29): 94개 확인·92개 교체. 기본35 / 언데드2 / 중·고위급4 / 콜로세움45 / 전차경주8. 공유 안개괴물 초상은 기본 프레임을 유지합니다.'));
 if(manifest.workUpdate){const u=manifest.workUpdate;root.append(node('p','작업 반영: 기존 원화 '+u.normalizedExistingFiles+'개 규격 정리 · 새 그림 '+u.newArtFiles+'종 · 단체 패배컷 '+u.groupScenesPresent+'/8 완료.'));}
 const groupList=node('div');groupList.id='jo9-mob-group-sets';
 const controls=node('div'),search=node('input'),missing=node('input'),label=node('label'),refresh=node('button','파일 상태 새로고침'),status=node('p'),list=node('div');
 search.placeholder='이름 / 파일명 검색';missing.type='checkbox';label.append(missing,document.createTextNode(' 부족한 세트만'));controls.append(search,label,refresh);root.append(controls,status,groupList,list);
 (document.getElementById('main')||document.body).prepend(root);
 let loaded=false,busy=false,paths=new Set(),revision=Date.now();
 const relative=p=>p.replace(/^content\/pic\//,'');
 async function call(action,data){const r=await fetch(cfg.url+'api/catalog/pic/'+action,{method:data?'POST':'GET',headers:{'X-JO9-Token':cfg.token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,cache:'no-store'});const v=await r.json();if(!r.ok)throw Error(v.error||'서버 오류');return v;}
 function present(s){return s&&paths.has(relative(s.path));}
 async function sync(){refresh.disabled=true;try{const r=await call('index?rescan=1');paths=new Set(r.index.map(e=>e.path));revision=Date.now();loaded=true;render();}catch(e){status.textContent=e.message;}finally{refresh.disabled=false;}}
 async function sha(b){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');}
 const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 // JO9 MOD START MOB_STANDARD_SIZE_20261029
 const sizeFor=kind=>kind==='portrait'?{width:150,height:150}:{width:795,height:596};
 const samePath=(a,b)=>a&&b&&a.path.replaceAll('\\','/').toLowerCase()===b.path.replaceAll('\\','/').toLowerCase();
 const hasStanding=e=>present(e.standing)&&!samePath(e.standing,e.portrait);
 async function normalizePng(file,data,w,h,size){
  if(w===size.width&&h===size.height)return{data,blob:file};
  const sourceUrl=URL.createObjectURL(file);
  try{const source=new Image();source.src=sourceUrl;await source.decode();
   const canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
   const context=canvas.getContext('2d');if(!context)throw Error('이미지 크기를 조절할 수 없습니다.');
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
   const scale=Math.min(size.width/w,size.height/h),dw=Math.min(size.width,Math.round(w*scale)),dh=Math.min(size.height,Math.round(h*scale));
   context.clearRect(0,0,size.width,size.height);context.drawImage(source,Math.floor((size.width-dw)/2),Math.floor((size.height-dh)/2),dw,dh);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 변환에 실패했습니다.');
   return{data:new Uint8Array(await blob.arrayBuffer()),blob};
  }finally{URL.revokeObjectURL(sourceUrl);}
 }
 // JO9 MOD END MOB_STANDARD_SIZE_20261029
 async function replace(slot,role,kind){
  if(busy)return;
  const input=node('input');input.type='file';input.accept='image/png';
  input.onchange=async()=>{if(!input.files[0])return;busy=true;let url;
   try{
    const file=input.files[0];if(file.size>60*1024*1024)throw Error('PNG 용량은 60MB 이하로 선택하세요.');
    let data=new Uint8Array(await file.arrayBuffer());if(data.length<33||[137,80,78,71,13,10,26,10].some((v,i)=>data[i]!==v))throw Error('PNG만 사용할 수 있습니다.');
    const view=new DataView(data.buffer),w=view.getUint32(16),h=view.getUint32(20);if(!w||!h||w*h>32000000)throw Error('이미지 크기를 확인하세요.');
    const old=await call('file',{path:relative(slot.path)}),prior=old.missing?null:un64(old.data),before=prior?await sha(prior):null;
    const expected=sizeFor(kind),normalized=await normalizePng(file,data,w,h,expected);data=normalized.data;
    url=URL.createObjectURL(normalized.blob);const img=node('img');img.src=url;await img.decode();img.style.cssText='max-width:75vw;max-height:60vh;object-fit:contain;background:#555';
    const dialog=node('dialog'),yes=node('button','WORK에 반영'),no=node('button','취소');dialog.style.cssText='background:#222;color:white;max-width:85vw';
    dialog.append(node('h3',role+' '+(old.missing?'추가':'교체')),node('p',slot.path+(slot.shared?' · 공유 파일: 연결된 모든 적에 적용됩니다.':'')),img,node('p','선택 '+w+'×'+h+' → 저장 '+expected.width+'×'+expected.height+' · 비율을 유지하고 남는 영역은 투명하게 채웁니다.'),node('p','원본 백업과 이미지 패치 기록을 남깁니다.'),yes,no);document.body.append(dialog);
    const approved=await new Promise(resolve=>{yes.onclick=()=>{dialog.close();resolve(true);};no.onclick=()=>{dialog.close();resolve(false);};dialog.oncancel=()=>resolve(false);dialog.showModal();});dialog.remove();if(!approved)return;
    let binary='';for(let i=0;i<data.length;i+=32768)binary+=String.fromCharCode(...data.subarray(i,i+32768));
    const result=await call('apply',{jobs:[{path:relative(slot.path),before,data:btoa(binary),cap:60*1024*1024,createMissing:!prior,width:expected.width,height:expected.height,mobSlot:kind}]});
    if(result.patchWarning||result.catalogWarning)throw Error('파일은 반영되었지만 기록 확인 필요: '+(result.patchWarning||result.catalogWarning));
    window.dispatchEvent(new CustomEvent('jo9-local-images-changed'));await sync();status.textContent='반영 완료: '+slot.path+' · 새 전투 또는 화면을 다시 표시하면 적용됩니다.';
   }catch(e){status.textContent=e.message;}finally{busy=false;if(url)URL.revokeObjectURL(url);}
  };input.click();
 }
 function render(){
  list.replaceChildren();groupList.replaceChildren();const term=search.value.trim().toLowerCase();const rows=manifest.entries.filter(e=>(!term||JSON.stringify(e).toLowerCase().includes(term))&&(!missing.checked||!hasStanding(e)||!present(e.defeat)));
  status.textContent=rows.length+'개 표시 / 전체 '+manifest.entries.length+'개 역할·변형 · 전신 부족 '+manifest.entries.filter(e=>!hasStanding(e)).length+' · 패배 부족 '+manifest.entries.filter(e=>!present(e.defeat)).length+' (공유 슬롯 중복 집계 가능)';
  const groups=(manifest.groups||[]).filter(g=>(!term||JSON.stringify(g).toLowerCase().includes(term))&&(!missing.checked||!present(g.defeat)));
  groupList.append(node('h2','단체 패배 컷신 · '+groups.length+'세트'));
  groupList.append(node('p','단체 PNG 한 장을 공유합니다. 처형은 같은 그림 위에 기존 붉은 필터가 덮입니다. 파일이 없으면 기존 개별 패배 그림을 임시 표시합니다.'));
  for(const g of groups){
   const card=node('section');card.dataset.group=g.key;card.id='mob-group-'+g.key;card.style.cssText='border:1px solid #987445;padding:12px;margin:12px 0;background:#242126';
   card.append(node('h3',g.name));appendBackgroundInfo(card,g);card.append(node('p','인원: '+g.count+' · '+(g.random?'중복 추첨이 가능한 무작위 구성의 대표 컷신':'고정 구성')));
   card.append(node('p',g.members.map(x=>x.name+' ×'+x.count).join(' / ')));
   const refs=node('div');for(const m of g.members){if(!m.portrait)continue;const img=node('img');img.loading='lazy';img.alt=m.name;img.title=m.name;img.style.cssText='width:64px;height:64px;object-fit:contain;margin:4px';img.src=cfg.url+'api/pic?t='+encodeURIComponent(cfg.token)+'&p='+encodeURIComponent(relative(m.portrait))+'&v='+revision;refs.append(img);}card.append(refs);
   const slot=g.defeat,ok=present(slot);card.append(node('p',slot.path),node('strong',ok?'단체 파일 있음':'단체 컷신 제작 필요'));
   if(ok){const img=node('img');img.loading='lazy';img.style.cssText='display:block;max-width:530px;width:100%;height:260px;object-fit:contain;background:#333';img.src=cfg.url+'api/pic?t='+encodeURIComponent(cfg.token)+'&p='+encodeURIComponent(relative(slot.path))+'&v='+revision;card.append(img);}
   const button=node('button',ok?'단체 PNG 교체':'단체 PNG 추가');button.onclick=()=>replace(slot,'단체 패배 컷신','defeat');card.append(button,node('small',' · 저장 크기 795×596 자동 조절. 완성된 단체 장면을 넣으세요.'));appendMageEditPrompt(card,slot);groupList.append(card);
  }
  for(const e of rows){const card=node('section');card.style.cssText='border-top:1px solid #66543b;margin-top:16px;padding-top:10px';card.append(node('h3',e.name+' · '+e.key));appendBackgroundInfo(card,e);
   const shared=(manifest.groups||[]).filter(g=>g.members.some(m=>m.key===e.key));if(shared.length){card.append(node('p','단체전에서는 다음 공유 컷신이 우선이며, 아래 개별 패배 칸은 임시 대체용입니다.'));for(const g of shared){const link=node('a',g.name);link.href='#mob-group-'+g.key;link.style.cssText='display:block;color:#a8d8ff';card.append(link);}}
   const grid=node('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px';card.append(grid);
   for(const [key,title] of [['portrait','초상화'],['standing','전투 전신'],['defeat','패배 컷신']]){const slot=e[key],box=node('div');grid.append(box);box.append(node('h4',title));if(!slot){box.append(node('p','고정 초상 연결 없음'));continue;}
    box.append(node('p',slot.path));if(key==='portrait'&&slot.frameLabel)box.append(node('p','프레임: '+slot.frameLabel));if(slot.workLabel)box.append(node('p',slot.workLabel));const ok=present(slot);box.append(node('strong',(ok?'파일 있음':'추가 필요')+(slot.shared?' · 공유':'')));const standard=sizeFor(key),portraitFallback=key!=='portrait'&&samePath(slot,e.portrait);box.append(node('p',portraitFallback?'초상 공용 150×150 · 별도 전신 경로 필요':'저장 크기 '+standard.width+'×'+standard.height+' · 자동 조절'));if(portraitFallback)box.append(node('p','현재는 초상을 전신 대용으로 표시합니다. 별도 전신 경로 연결 전에는 이 칸에서 교체할 수 없습니다.'));if(!ok&&slot.reviewSource)box.append(node('p','기존 제작 시안: '+slot.reviewSource));
    if(ok){const img=node('img');img.loading='lazy';img.style.cssText='display:block;width:100%;height:190px;object-fit:contain;background:#3b3b3b';img.src=cfg.url+'api/pic?t='+encodeURIComponent(cfg.token)+'&p='+encodeURIComponent(relative(slot.path))+'&v='+revision;img.onerror=()=>{img.alt='파일 미리보기 실패 — 상태를 새로고침하세요.';};box.append(img);}
    const button=node('button',ok?'PNG 교체':'PNG 추가');button.disabled=portraitFallback;button.onclick=()=>replace(slot,title,key);box.append(button);if(!ok)box.append(node('small',' · 비율 유지·투명 여백으로 표준 크기에 맞춰 저장'));appendMageEditPrompt(box,slot);
   }list.append(card);
  }
 }
 root.addEventListener('toggle',()=>{if(root.open&&!loaded)sync();});refresh.onclick=sync;search.oninput=render;missing.onchange=render;
 if(new URLSearchParams(location.search).get('mobsets')==='1')root.open=true;
}());
/* JO9 MOD END MOB_SET_CATALOG_20261028 */
