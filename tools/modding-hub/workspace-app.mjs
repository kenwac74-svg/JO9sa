import {freshState,validateState,clone,estimate} from './engine.mjs';
import {settingsFilename,openSettingsSave} from './settings-save.mjs';
import {createWorkspaceRouter} from './workspace-router.mjs';
import {installWorkspace} from '/workspace/integration.mjs';

// Native workspace entry: no legacy HTML, application startup, or discarded calculator views.
const KEY='jo9-history-lab-v1',initialHash=location.hash.slice(1),$=s=>document.querySelector(s);
const menus=JSON.parse($('#workspace-menus').textContent);
const tabNames={
 studio:['노예 편집','통합 캐릭터 편집기','캐릭터를 검색하고 외형·설정·능력치와 대사집을 편집합니다.'],
 'master-studio':['마스터 편집','마스터 편집기','남녀 주인공의 설정과 시작 능력치를 편집합니다.'],
 character:['캐릭터 시뮬레이터','캐릭터 시뮬레이터','현재 인물과 대화 상태에 따른 질문과 대사를 확인합니다.'],
 coef:['산식·계수','산식·계수','세계·출신·직업과 발육 분류의 계산 계수를 편집합니다.'],
 backgrounds:['배경 설정 목록','배경 설정 목록','세계·출신·직업의 문구와 연결 조건을 편집합니다.'],
 'trait-edit':['특성 편집','특성 편집','기존 특성 DB의 조건과 효과를 편집합니다.'],
 'slave-sim':['뽑기 분포','뽑기 분포','현재 표본과 계수의 분포를 확인합니다.'],
 'interview-db':['인터뷰 DB','인터뷰 DB','대사 조각과 원문 참조를 확인합니다.'],
 'ai-link':['AI 연결','AI 연결','기존 AI 연결 설정을 관리합니다.'],
 'save-fix':['세이브 정비','세이브 정비','기존 세이브 도구를 엽니다.']
};
let state=freshState(),storageError=null,workbench=null,router,toastTimer;
try{const raw=localStorage.getItem(KEY);if(raw)state=validateState(JSON.parse(raw));}catch(error){storageError=error;}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4200);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('#saveStatus').textContent='이 브라우저에 저장됨';}catch(error){$('#saveStatus').textContent='자동 저장 불가 · JSON 백업 필요';toast(error.message);}}
function confirmAction(title,message,action){$('#confirmTitle').textContent=title;$('#confirmText').textContent=message;$('#confirmOk').onclick=()=>{$('#confirmDialog').close();action();};$('#confirmDialog').showModal();}
$('#confirmCancel').onclick=()=>$('#confirmDialog').close();
function download(data,name,type='application/json'){const link=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const views=new Map();let backgroundDefaults;
async function prepareBackgroundDefaults(){
 backgroundDefaults??=Promise.all([loadModule('background-defaults.mjs'),fetch(new URL('data/backgrounds.json',document.baseURI)).then(r=>r.json()),fetch(new URL('data/background-drafts.json',document.baseURI)).then(r=>r.json())]);
 try{const [{applyBackgroundDefaults},backgrounds,drafts]=await backgroundDefaults;
 if(applyBackgroundDefaults(state.config,{records:[...backgrounds.records,...drafts.records]}))save();}
 catch(error){backgroundDefaults=null;throw error;}
}
async function renderAll(){await prepareBackgroundDefaults();for(const view of views.values())view?.render?.();}
function snapshot(){if(state.snapshots.length>=200)return toast('보관함은 최대 200개입니다. 전체 설정을 내보내 보관하세요.');const character=clone(state.character);state.snapshots.unshift({id:crypto.randomUUID(),label:character.name||character.id,savedAt:new Date().toISOString(),character,config:clone(state.config),result:estimate(character,state.config),characterFile:clone(state.characterFile??null)});save();toast('계수와 결과를 함께 확정 보관했습니다.');}
const api={workspace:true,menus,tabNames,getState:()=>state,save,toast,confirmAction,download,snapshot,renderAll,
 renderSimulator:()=>api.charView?.render(),renderResult:()=>api.charView?.render(),
 getTab:()=>router?.current||initialHash||'character',getInitialTab:()=>initialHash,
 switchTab:id=>router.activate(id),ensureTab:id=>router.ensure(id)
};
globalThis.__jo9StudioApi=api;
const loadModule=name=>import(new URL(name,document.baseURI).href);
const factories={
 character:async()=>{await prepareBackgroundDefaults();const {createCharacterView}=await loadModule('character-view.mjs');return api.charView=await createCharacterView(api);},
 coef:async()=>{const {createCoefView}=await loadModule('coef-view.mjs');return createCoefView(api);},
 backgrounds:async()=>{const {createWorkbench}=await loadModule('workbench.mjs');workbench=await createWorkbench(api);workbench.render();return workbench;},
 studio:async()=>{await api.ensureTab('character');const {createStudioView}=await loadModule('studio-view.mjs');return createStudioView(api);},
 'master-studio':async()=>{await api.ensureTab('studio');const {createStudioView}=await loadModule('studio-view.mjs');return createStudioView(api,{role:'master'});},
 'trait-edit':async()=>{const {createTraitEditor}=await loadModule('trait-editor.mjs');return createTraitEditor(api);},
 'slave-sim':async()=>{const {createSimView}=await loadModule('sim-view.mjs');return createSimView(api);},
 'save-fix':async()=>{const {createSaveView}=await loadModule('studio-save.mjs');return createSaveView(api);},
 'interview-db':async()=>{const {createDbView}=await loadModule('studio-db.mjs');return createDbView(api);},
 'ai-link':async()=>{const {createAiView}=await loadModule('studio-ai.mjs');return createAiView(api);}
};
function header(id){const title=tabNames[id];$('#breadcrumb').textContent=title[0];$('#pageTitle').textContent=title[1];$('#pageSubtitle').textContent=title[2]||'';for(const node of document.querySelectorAll('[data-tab]')){node.classList.toggle('active',node.dataset.tab===id);node.setAttribute('aria-current',node.dataset.tab===id?'page':'false');}}
const notify=id=>window.dispatchEvent(new CustomEvent('jo9-workspace-tab',{detail:{id}}));
router=createWorkspaceRouter({
 has:id=>Object.hasOwn(tabNames,id),
 aliases:{simulator:'character',coefficients:'coef','character-json':'studio',traits:'trait-edit',archive:'artifacts',guide:'artifacts'},
 load:async id=>{if(factories[id])views.set(id,await factories[id]());},
 begin:id=>{header(id);history.replaceState(null,'','#'+id);for(const panel of document.querySelectorAll('.tab-panel'))panel.hidden=panel.id!=='workspace-loading';$('#workspaceRetry').hidden=true;$('[data-loading-text]').textContent=tabNames[id][0]+' 화면을 불러오고 있습니다.';notify(id);},
 show:id=>{header(id);for(const panel of document.querySelectorAll('.tab-panel'))panel.hidden=panel.id!==id;notify(id);},
 fail:(id,error)=>{$('[data-loading-text]').textContent='화면을 불러오지 못했습니다: '+error.message;$('#workspaceRetry').hidden=false;toast(error.message);notify(id);}
});
$('#workspaceRetry').onclick=()=>api.switchTab(router.current);
document.addEventListener('click',event=>{const target=event.target.closest('[data-tab],[data-go]');if(!target)return;api.switchTab(target.dataset.tab||target.dataset.go);});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(next!==router.current)api.switchTab(next);});
// The target editor may not yet be mounted when a clone in the other editor is created.
window.addEventListener('jo9:role-open',async event=>{const id=event.detail?.role==='master'?'master-studio':'studio';if(views.has(id))return;await api.ensureTab(id);window.dispatchEvent(new CustomEvent('jo9:role-open',{detail:event.detail}));});
$('#exportState').onclick=()=>{const now=new Date();openSettingsSave({text:JSON.stringify({...state,exportedAt:now.toISOString()},null,2),name:settingsFilename(now),download,toast});};
$('#importFile').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('파일 크기는 5MB 이하여야 합니다.');const imported=validateState(JSON.parse(await file.text()));confirmAction('설정 불러오기','현재 설정을 파일 내용으로 교체합니다. 현재 내용은 전체 설정 내보내기로 보관할 수 있습니다.',()=>{state=imported;save();renderAll();toast('설정을 불러왔습니다.');});}catch(error){toast(error.message);}event.target.value='';};
$('#downloadGuide').onclick=()=>{const link=document.createElement('a');link.href='./JO9_Character_JSON_Workbench_Handoff_20261110.md';link.download='JO9_Character_JSON_Workbench_Handoff_20261110.md';link.click();};
if(storageError)toast('저장 데이터를 읽지 못했습니다. 기존 기록은 그대로 보존했습니다.');
try{await installWorkspace(api);}catch(error){$('[data-loading-text]').textContent='통합 작업실을 시작하지 못했습니다: '+error.message;toast(error.message);}
