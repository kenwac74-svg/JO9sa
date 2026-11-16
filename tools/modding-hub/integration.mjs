import {ensureWorkspaceTool,managedImageTools} from '/workspace/tool-runtime.mjs';
import {createGeneralDbView,simulatorMenuHtml} from '/workspace/general-dialogue.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MENUS=[
 {id:'studio',label:'캐릭터 편집',icon:'✎',children:[['studio','노예 편집'],['master-studio','마스터 편집'],['backgrounds','배경 설정 목록']]},
 {id:'character',label:'캐릭터 시뮬레이터',icon:'◆'},
 {id:'dialogue',label:'대사 편집',icon:'☷'},
 {id:'image-tools',label:'이미지 작업',icon:'▧'},
 {id:'coef',label:'산식·계수',icon:'≋'},
 {id:'game-db',label:'게임 DB',icon:'▤',children:[['general-dialogue-db','일반 대사 DB'],['interview-db','인터뷰 DB'],['trait-edit','특성 편집']]},
 {id:'patch-schedule',label:'작업 일정',icon:'◷'},
 {id:'utilities',label:'기타툴',icon:'⚙',children:[['save-fix','세이브 정비'],['ai-link','AI 연결'],['slave-sim','뽑기 분포']]},
 {id:'artifacts',label:'기타 산출물',icon:'▥'},
];
export function characterImageKeyword(file,imagePath='',id=''){
 const path=String(imagePath).replaceAll('\\','/'),folder=path.match(/(?:^|\/)master\/editor\/(\d+)(?:\/|$)/i);
 if(folder)return 'master/editor/'+folder[1];
 const stem=path.split('/').pop()?.replace(/\.[^.]+$/,'')||'';
 if(/^\d+_/.test(stem))return stem.split('_')[0];
 if(stem)return stem.replace(/_(?:black|blond|blue|brown|green|pink|purple|red|white)_(?:long|short)(?:_[^_]+)?$/i,'').replace(/_title$/i,'');
 const name=String(file).replace(/\.json$/i,'');return name.replace(/^\d+_/,'')||String(id)||name;
}
export async function installWorkspace(api){
 const config=await fetch('/workspace/config').then(r=>{if(!r.ok)throw Error('통합 메뉴 설정을 읽지 못했습니다.');return r.json();});
 const css=document.createElement('link');css.rel='stylesheet';css.href='/workspace/integration.css';document.head.append(css);
 const {createStudioView}=await import(new URL('studio-view.mjs',document.baseURI).href);
 await createStudioView(globalThis.__jo9StudioApi,{role:'master'});
 createGeneralDbView(api);
 const nativeIds=new Set(Object.keys(api.tabNames));const originalNames=new Map([...nativeIds].map(k=>[k,api.tabNames[k]]));
 const panels=new Map();let items=null,selectedArtifact=null,query='',category='';
 const subtitle={dialogue:'원문을 찾아 각본으로 저장하거나, 대사를 수정하고 반영합니다.','image-tools':'이미지와 복장을 확인하고 교체합니다.','game-db':'게임 정보를 찾고 아이디어를 정리합니다.','patch-schedule':'일정과 진행 상태, 메모를 관리합니다.',utilities:'작업에 필요한 보조 도구를 선택합니다.',artifacts:'카탈로그와 비교표, 작업 결과를 찾아봅니다.'};
 for(const m of MENUS){
  if(!nativeIds.has(m.id)){
   api.tabNames[m.id]=[m.label,m.label,subtitle[m.id]];
   const panel=document.createElement('section');panel.id=m.id;panel.className='tab-panel workspace-panel';panel.hidden=true;
   document.querySelector('main footer').before(panel);panels.set(m.id,panel);
  }
 }
 const nav=document.querySelector('.sidebar nav');
 nav.innerHTML=MENUS.map(m=>`<button type="button" class="nav-button" data-tab="${m.id}" data-workspace-main="${m.id}"><span>${m.icon}</span>${m.label}</button>${m.id==='character'?simulatorMenuHtml():m.children?`<div class="workspace-subnav" data-workspace-parent="${m.id}" hidden>${m.children.map(([id,label])=>`<button type="button" class="nav-button" data-tab="${id}">${label}</button>`).join('')}</div>`:''}`).join('');
 document.querySelector('.workspace-label').textContent='통합 모드 작업실';
 document.querySelector('.sidebar-bottom p').textContent='기존 도구 연결 · WORK\n각 도구의 설정과 저장 기능 유지';
 document.title='JO9 · 통합 모드 작업실';
 const parentOf=id=>MENUS.find(m=>m.id===id||m.children?.some(([child])=>child===id))?.id;
 const openCurrent=document.createElement('a');openCurrent.className='workspace-open-current';openCurrent.target='_blank';openCurrent.rel='noopener';openCurrent.textContent='별도 창에서 열기 ↗';openCurrent.hidden=true;document.querySelector('.page-header').append(openCurrent);
 const button=(key,label)=>`<button type="button" class="button secondary small" data-workspace-tool="${key}">${label}</button>`;
 function framePanel(id,tools){
  const panel=panels.get(id);panel.innerHTML=`<div class="workspace-toolbar">${(tools.length>1||id==='game-db'?tools:[]).map(([key,label])=>button(key,label)).join('')}</div>${tools.map(([key,label])=>`<iframe class="workspace-frame" data-workspace-frame="${key}" title="${esc(label)} 작업 영역" hidden></iframe>`).join('')}`;
 }
 framePanel('dialogue',[['dialogue','대사 편집실']]);
 const dialoguePanel=panels.get('dialogue');
 dialoguePanel.querySelector('iframe').title='대사 편집 작업 영역';
 framePanel('image-tools',[['checklist','이미지 체크리스트'],['workshop','이미지 교체·편집'],['imageReview','폴더 비교·선택'],['promptWorksheet','장면 프롬프트']]);
 framePanel('game-db',[['gameReference','특성·아이템·마법·MOB DB']]);
 panels.get('game-db').querySelector('.workspace-toolbar').insertAdjacentHTML('beforeend','<button type="button" class="button secondary small" data-tab="general-dialogue-db">일반 대사 DB</button><button type="button" class="button secondary small" data-tab="interview-db">인터뷰 DB</button><button type="button" class="button secondary small" data-tab="trait-edit">특성 편집</button>');
 framePanel('patch-schedule',[['schedule','작업 일정']]);
 const external=[['Mage.space','https://www.mage.space/advanced'],['JoyCaption','https://huggingface.co/spaces/fancyfeast/joy-caption-beta-one'],['번역','https://translate.google.co.kr/?sl=en&tl=ko&op=translate'],['Gamma','https://gamma.app/design/01M48RXZSYBT1HBN8BFGAQ09AS?from=designs']];
 panels.get('utilities').innerHTML=`<article class="card"><div class="card-head"><h2>기존 보조 도구</h2></div><div class="card-body workspace-toolbar"><button type="button" class="button secondary" data-tab="save-fix">세이브 정비</button><button type="button" class="button secondary" data-tab="ai-link">AI 연결</button><button type="button" class="button secondary" data-tab="slave-sim">뽑기 분포</button>${button('soundList','사운드 목록')}</div></article><article class="card"><div class="card-head"><h2>외부 도구</h2></div><div class="card-body workspace-toolbar">${external.map(([label,url])=>`<a class="button secondary" href="${esc(url)}" target="_blank" rel="noopener">${label} ↗</a>`).join('')}</div></article><div class="workspace-tool-view"><iframe class="workspace-frame" title="선택한 보조 도구" hidden></iframe></div>`;
 panels.get('artifacts').innerHTML='<article class="card"><div class="card-head"><h2>기타 산출물 목록 <span class="workspace-count"></span></h2><button type="button" class="button secondary small" data-workspace-refresh>목록 새로 확인</button></div><div class="card-body"><div class="workspace-toolbar"><input class="workspace-search" type="search" placeholder="이름·파일명·경로 검색" aria-label="산출물 검색"><select class="workspace-category" aria-label="산출물 종류"><option value="">전체 종류</option></select></div><div class="workspace-artifact-list">목록을 불러오는 중입니다.</div></div></article><article class="workspace-artifact-view" hidden><div class="workspace-toolbar"><strong class="workspace-artifact-title"></strong><a class="button secondary small workspace-original" target="_blank" rel="noopener">새 창으로 열기 ↗</a></div><iframe class="workspace-frame" title="선택한 HTML 산출물"></iframe></article>';
 function toolUrl(key){
  const raw=config.tools[key];if(!raw)return '';
  const target=key==='soundList'?'/workspace/fs/'+encodeURI(raw.replaceAll('\\','/')):raw;
  const url=new URL(target,location.href);url.searchParams.set('workspace','1');return url.href;
 }
 async function openTool(panel,key){
  const requestId=String(Number(panel.dataset.openRequest||0)+1);panel.dataset.openRequest=requestId;panel.dataset.loaded='1';
  const frame=panel.querySelector('[data-workspace-frame="'+key+'"]')||panel.querySelector('iframe');
  const managed=managedImageTools.has(key);
  let status=panel.querySelector('.workspace-tool-status');
  if(!status){status=document.createElement('div');status.className='workspace-tool-status';status.setAttribute('role','status');panel.querySelector('.workspace-toolbar')?.after(status);}
  panel.querySelectorAll('iframe').forEach(other=>{other.hidden=other!==frame;});
  panel.querySelectorAll('[data-workspace-tool]').forEach(b=>b.classList.toggle('primary',b.dataset.workspaceTool===key));
  if(managed){status.textContent='이미지 도구를 연결하는 중입니다…';status.classList.remove('workspace-error');status.hidden=false;frame.hidden=true;delete panel.dataset.externalUrl;}
  try{
   const ready=await ensureWorkspaceTool(key,config);
   if(panel.dataset.openRequest!==requestId)return;
   const url=toolUrl(key);if(!url)throw Error('도구 주소가 없습니다. 모드툴 실행기로 다시 열어 주세요.');
   if(frame.dataset.source!==url||!ready.reused){frame.src=url;frame.dataset.source=url;}
   frame.hidden=false;status.hidden=true;panel.dataset.externalUrl=key==='soundList'?url.replace(/[?&]workspace=1(?:&|$)/,''):config.tools[key];
  }catch(error){
   if(panel.dataset.openRequest!==requestId)return;
   frame.hidden=true;status.textContent=error.message+' 위의 메뉴를 다시 누르면 재시도합니다.';status.classList.add('workspace-error');status.hidden=false;delete panel.dataset.externalUrl;
  }
  sync();
 }
 function renderList(){
  if(!items)return;const panel=panels.get('artifacts'),matches=items.filter(r=>(!category||r.category===category)&&(!query||(`${r.title} ${r.path}`).toLowerCase().includes(query.toLowerCase())));
  panel.querySelector('.workspace-count').textContent=`${matches.length} / ${items.length}개`;
  panel.querySelector('.workspace-artifact-list').innerHTML=matches.length?`<table class="workspace-catalog-table"><thead><tr><th>목록 이름</th><th>종류</th><th>갱신일</th><th></th></tr></thead><tbody>${matches.map(r=>`<tr${selectedArtifact===r.id?' class="workspace-selected"':''}><td><button type="button" class="workspace-artifact-name" data-workspace-artifact="${r.id}" title="${esc(r.path)}">${esc(r.title)}</button><div class="fine-print">${esc(r.path.split(/[\\/]/).slice(-2).join('/'))}${r.copies.length>1?` · 같은 파일 ${r.copies.length}곳`:''}</div></td><td>${esc(r.category)}</td><td>${esc(r.date)}</td><td><button type="button" class="button secondary small" data-workspace-artifact="${r.id}">열기</button></td></tr>`).join('')}</tbody></table>`:'<p class="fine-print">조건에 맞는 산출물이 없습니다.</p>';
 }
 async function loadArtifacts(refresh=false){
  const panel=panels.get('artifacts');try{
   const res=await fetch('/workspace/artifacts'+(refresh?'?refresh=1':''));if(!res.ok)throw Error('목록을 읽지 못했습니다.');items=(await res.json()).items;
   const select=panel.querySelector('.workspace-category');select.innerHTML='<option value="">전체 종류</option>'+[...new Set(items.map(r=>r.category))].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');select.value=category;renderList();
  }catch(error){panel.querySelector('.workspace-artifact-list').textContent=error.message;}
 }
 function openArtifact(id){
  const row=items?.find(r=>r.id===id);if(!row)return;selectedArtifact=id;renderList();const panel=panels.get('artifacts'),viewer=panel.querySelector('.workspace-artifact-view');viewer.hidden=false;viewer.querySelector('.workspace-artifact-title').textContent=row.title;
  viewer.querySelector('a').href=row.url;panel.dataset.externalUrl=row.url;const frame=viewer.querySelector('iframe');if(frame.dataset.source!==row.url){frame.src=row.url;frame.dataset.source=row.url;}viewer.scrollIntoView({block:'start',behavior:'smooth'});
 }
 function fitWorkspace(){
  const panel=panels.get(api.getTab());if(!panel)return;
  const frame=panel.querySelector('iframe:not([hidden])');
  if(frame&&['dialogue','image-tools','game-db','patch-schedule'].includes(api.getTab()))frame.style.height=Math.max(140,window.innerHeight-frame.getBoundingClientRect().top-12)+'px';
 }
 window.addEventListener('resize',()=>requestAnimationFrame(fitWorkspace));
 css.addEventListener('load',()=>requestAnimationFrame(fitWorkspace));
 const headerSize=new ResizeObserver(()=>requestAnimationFrame(fitWorkspace));headerSize.observe(document.querySelector('.page-header'));headerSize.observe(document.querySelector('.topbar'));
 for(const panel of panels.values()){const toolbar=panel.querySelector('.workspace-toolbar');if(toolbar)headerSize.observe(toolbar);}
 function sync(){
  const id=api.getTab(),parent=parentOf(id);document.body.classList.toggle('workspace-dialogue-active',id==='dialogue');document.body.classList.toggle('workspace-framed-active',['dialogue','image-tools','game-db','patch-schedule'].includes(id));requestAnimationFrame(fitWorkspace);document.querySelectorAll('[data-workspace-parent]').forEach(x=>x.hidden=x.dataset.workspaceParent!==parent);
  nav.querySelectorAll('[data-workspace-main]').forEach(x=>{x.classList.toggle('active',x.dataset.workspaceMain===parent);x.setAttribute('aria-current',x.dataset.workspaceMain===parent?'page':'false');});
  const simState=globalThis.__jo9StudioApi?.charView?.getWorkspaceState?.();
  nav.querySelectorAll('[data-sim-question]').forEach(x=>x.classList.toggle('active',id==='character'&&simState?.section==='questions'&&(x.dataset.simQuestion===simState.question||(x.dataset.simQuestion==='1117'&&simState.question==='1118'))));
  nav.querySelectorAll('[data-sim-section]').forEach(x=>x.classList.toggle('active',id==='character'&&x.dataset.simSection===simState?.section));
  document.querySelector('.header-actions').hidden=panels.has(id);document.querySelector('#pageTitle .draft-badge')?.classList.toggle('workspace-hide',panels.has(id));
  const panel=panels.get(id);
  if(panel&&!panel.dataset.loaded){const initial={dialogue:'dialogue','image-tools':'checklist','game-db':'gameReference','patch-schedule':'schedule'}[id];if(initial)openTool(panel,initial);}
  if(id==='artifacts'&&!items)loadArtifacts();
  openCurrent.hidden=!panel?.dataset.externalUrl;openCurrent.href=panel?.dataset.externalUrl||'#';
 }
 document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.simQuestion||target.dataset.simSection){globalThis.__jo9StudioApi?.charView?.openSection?.(target.dataset.simSection||'questions',target.dataset.simQuestion);api.switchTab('character');}
  if(target.dataset.workspaceImageSearch!==undefined){
   const keyword=characterImageKeyword(target.dataset.workspaceImageSearch,target.dataset.imagePath,target.dataset.imageId),panel=panels.get('image-tools');
   api.switchTab('image-tools');openTool(panel,'checklist');
   const frame=panel.querySelector('[data-workspace-frame="checklist"]'),origin=new URL(config.tools.checklist).origin;
   const send=()=>frame.contentWindow?.postMessage({type:'jo9:set-image-search',keyword},origin);
   frame.addEventListener('load',send,{once:true});send();
  }
  if(target.dataset.workspaceTool)openTool(target.closest('.workspace-panel'),target.dataset.workspaceTool);
  if(target.dataset.workspaceArtifact)openArtifact(target.dataset.workspaceArtifact);
  if(target.hasAttribute('data-workspace-refresh'))loadArtifacts(true);
  sync();
 });
 document.addEventListener('input',event=>{if(event.target.matches('.workspace-search')){query=event.target.value;renderList();}});
 document.addEventListener('change',event=>{if(event.target.matches('.workspace-category')){category=event.target.value;renderList();}});
 window.addEventListener('hashchange',sync);
 window.addEventListener('jo9-simulator-question',sync);
 // The original startup does not know workspace-only hashes; restore the user's requested page now.
 const requested=globalThis.__jo9WorkspaceInitialHash;
 api.switchTab(requested&&api.tabNames[requested]?requested:api.getTab());sync();
}
