import {newSpawnPolicy,spawnNotice} from './spawn-notice.mjs';
// 통합 캐릭터 편집 탭: 게임 폴더의 캐릭터를 골라 외형·배경 이야기·설정·능력치·특성을 한 화면에서 고친다(로컬 서버 /api 필요)
import {roleUrl, masterSettings, masterStats, cmValue, patchCm, initialCm, cmInitialChanges, patchNativeStat, nativeRows, cloneBody, cloneForm} from './studio-role.mjs';
import {QUESTION_NAMES} from '/workspace/general-dialogue.mjs';
import {loadGamePresentation,gameRules,describeGameValue,valueBadge,simulationFields,refreshGameField,traitStyle,editorTraitRows,findTraitByName} from './game-presentation.mjs';
import {runtimeValues,runtimeControls,bindRuntimeControls,subscribeRuntime} from './runtime-initials.mjs';
import {describeCharacterField} from './character-fields.mjs';
import {esc as e, loadSimData} from './sim-data.mjs';
import {createLookEditor} from './studio-look.mjs';
import {SLOTS,questionnaireTopics} from './character-view.mjs';
import {pickerBackground, needsBackgroundApply, serialSaves} from './background-metadata.mjs';

const PAGE = 40;
const AGE = {0: '젊음(0)', 1: '소녀(1)', 2: '원숙(2)'};
const PSY = {docile: '온순함', soft: '부드러움', optimistic: '낙관', obedient: '순종', servile: '비굴', horny: '발정', reluctant: '마지못함', arrogant: '오만', hateful: '증오', resistant: '저항', hysteric: '히스테리', lachrymose: '눈물', frightened: '겁먹음', depresive: '우울', broken: '무너짐'};
const STORY_LABEL = {world: '세계·과거', family: '가족·출신', occupation: '직업·경력'};
const GROUPS = [
 ['기본 속성', ['beauty', 'exotic', 'stamina', 'sensitivity', 'temper', 'ego', 'pride', 'intellect', 'fat', 'grace', 'fame_rate', 'scars', 'bruises']],
 ['정신·관계', ['meekness', 'courage', 'compassion', 'virginity']],
 ['일 기술', ['secretary', 'calisthenics', 'gladiatrix', 'cook', 'service', 'nurse', 'enchanter', 'art', 'music', 'expression', 'dressage', 'pet', 'alchemy']],
];
const TABS = [['look', '외형'], ['setting', '배경·설정'], ['stats', '능력치·특성'], ['talk', '대사집'], ['qsp', 'QSP 이벤트'], ['json', '원본 JSON']];

async function baseCall(url, body) {
 const r = await fetch(url, body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
 let data = null;
 try { data = await r.json(); } catch { /* 서버가 없으면 HTML이나 빈 응답 */ }
 if (!r.ok || !data) throw new Error(data?.error || (r.status === 404 ? '편집기 서버(start-history-lab.py)로 열어야 게임 파일을 다룰 수 있습니다.' : '서버 응답 오류 ' + r.status));
 return data;
}

export async function createStudioView(api, options = {}) {
 const role = options.role || 'slave', isMaster = role === 'master';
 if (!isMaster) globalThis.__jo9StudioApi = api;
 const call = (url, body) => baseCall(roleUrl(role, url), body);
 const get = async f => (await fetch('./data/' + f)).json();
 const [TRAITS, SEEDS, REFS, CAT] = await Promise.all([get('traits.json'), get('game-seed-keys.json'), get('interview-refs.json'), get('background-categories.json')]);
 // 칸별 원본 DB 후보(창작물 인터뷰 키): 시뮬레이터와 같은 주제 묶음
 const questionPool = id => questionnaireTopics(REFS.topics,SLOTS.find(slot=>slot[1]===id)?.[3]??[]);
 // 배경 분류 선택지(세계·출신·직업): 같은 ID의 변형은 하나로
 // 세계 → 출신 → 직업 연결(시뮬레이터와 같은 연결표)으로 위에서 아래로 고른다
 const SD = await loadSimData();
 await loadGamePresentation();
 const seedKeys = SEEDS.keys;
 // 게임 JSON(seed_)로 정할 수 있는 특성: 묶인 키가 게임이 읽는 seed 키인 것만
 const traitRows = editorTraitRows(TRAITS.rows).filter(t => t.binding && seedKeys.includes(t.binding.key) && t.binding.setValue !== undefined);
 const traitKeys = new Set(traitRows.map(t => t.binding.key));
 const traitOn = (v, b) => v !== undefined && (b.op === '>' ? v > b.threshold : b.op === '<' ? v < b.threshold : b.op === '>=' ? v >= b.threshold : b.op === 'range' ? v >= b.min && v <= b.max : v === b.threshold);

 const id = isMaster ? 'master-studio' : 'studio';
 api.tabNames[id] = [isMaster ? '마스터 편집' : '노예 편집', isMaster ? '마스터 편집' : '통합 캐릭터 편집기', isMaster ? '남주인공과 여주인공의 시작 설정을 편집하거나 다른 역할로 복제합니다.' : '게임 폴더의 캐릭터를 골라 외형·배경 이야기·설정·능력치·특성을 한 화면에서 고치세요.'];
 if(!api.workspace) document.querySelector('.sidebar nav').insertAdjacentHTML('afterbegin', `<button data-tab="${id}" class="nav-button"><span>✎</span>캐릭터 편집</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin', `<section id="${id}" class="tab-panel st" hidden></section>`);
 const root = document.getElementById(id);
 const lookEd = createLookEditor({toast: m => api.toast(m), call,
  endpoint: c => c.id === 'new' ? '/api/char/new' : `/api/char/${c.id}/images`,
  extra: () => st.ch?.id === 'new' ? newBody() : {revision: st.ch?.revision},
  onSaved: async r => {
   if (st.ch?.id === 'new') { await loadList(); st.ch = null; st.sel = null; return open(r.id, true); }
   st.ch = r.character; st.error = r.sharingWarning || ''; render();
  }});
 // 새 캐릭터: 외형 편집기를 빈 슬롯으로 열고, 정보 폼 값과 함께 /api/char/new 로 보낸다
 const NEW_SLOTS = {base: '기본(알몸)', title: '타이틀(옷 입은 모습)', maid: '하녀', secr: '비서', dom: '도미나'};
 function startNew() {
  st.ch = {id: 'new', jsonFile: '(새 캐릭터)', dedicated: false, data: {}, sharedWith: [], storyFields: [['world', 'seed_world_description'], ['family', 'seed_family_description'], ['occupation', 'seed_occupation_description']],
   slots: Object.fromEntries(Object.entries(NEW_SLOTS).map(([k, l]) => [k, {label: l, field: null, reference: null, url: null}])), faces: {seed_ava_clear: null, seed_ava_gray: null, seed_ava: null}, statKeys: [], choices: st.choices};
  st.sel = null; st.tab = 'look'; st.edits = blank(); st.preview = null; st.talk = null;
  st.nw = {unique: true, name: '', slug: '', id: '', color: 'black', length: 'long', age: 'young', boobs: 3, boobsImg: 'boobs_C', pussyImg: 'pussy_l1', register: true, story: {world: '', family: '', occupation: ''}};
  lookEd.reset(st.ch); render();
 }
 function newBody() {
  const n = st.nw;
  return {color: n.color, length: n.length, age: n.age, boobs: Number(n.boobs), boobsImg: n.boobsImg, pussyImg: n.pussyImg, register: n.register,
   unique: n.unique ? {name: n.name.trim(), slug: n.slug.trim(), id: n.id.trim(), story: n.story} : null};
 }

 const st = {bgMode: role, gender: '', roleCopy: null, game: null, items: [], q: '', uniqueOnly: false, page: 0, sel: null, ch: null, tab: 'look', edits: blank(), preview: null, busy: false, error: '', talk: null, book: null, bookDirty: false, bgVersion: 0, bgUnsaved: false, talkPending: 0, qq: '', qhits: null, qedits: {}, qmod: null, qid: '', qdesc: '', sharing: null};
 const queueTalk = serialSaves();
 function blank() { return {set: {}, unset: new Set(), story: {}, master: null, initials: {}, simulation: null}; }
 const data = () => st.ch?.data ?? {};
 // 편집 중 값: 저장 전 바꾼 값 → 지운 키 → 원래 값
 const val = key => key in st.edits.set ? st.edits.set[key] : st.edits.unset.has(key) ? undefined : data()[key];
 const dirtyCount = () => Object.keys(st.edits.set).length + st.edits.unset.size + Object.keys(st.edits.story).length + (st.edits.master ? 1 : 0) + Object.keys(st.edits.initials).length + (st.edits.simulation===null?0:1);
 const storyText = k => k in st.edits.story ? st.edits.story[k] : toDisplay(data()[st.ch.storyFields.find(f => f[0] === k)[1]]);
 const toDisplay = s => String(s ?? '').replace(/<!--\s*#nwtx.*?-->\s*$/s, '').replace(/<br\s*\/?>/gi, '\n').trim();

 function setVal(key, value) {
  st.edits.unset.delete(key);
  if (data()[key] === value) delete st.edits.set[key]; else st.edits.set[key] = value;
 }
 function unsetVal(key) {
  delete st.edits.set[key];
  if (key in data()) st.edits.unset.add(key);
 }
 const simulationData=()=>st.edits.simulation??st.ch?.simulation??{};
 const simulationPatch=()=>st.edits.simulation===null?{}:{simulation:st.edits.simulation};
 function setSimulation(key,value){const sim={...simulationData()};if(value===undefined)delete sim[key];else sim[key]=value;st.edits.simulation=JSON.stringify(sim)===JSON.stringify(st.ch?.simulation??{})?null:sim;st.preview=null;updateHead();}
 const label = key => {
  const gameLabel=gameRules().labels[key.replace(/^seed_/,'')];if(gameLabel)return gameLabel;
  const t = traitRows.filter(r => 'seed_' + r.binding.key === key);
  const d = describeCharacterField([key], data()[key]);
  return d.confirmed ? d.label.replace(/ 초기값$| 초기 기술$/, '') : t.length ? t.map(r => r.name).join('/') : key.slice(5);
 };

 async function loadGame() {
  try { st.game = await call('/api/game'); st.error = ''; } catch (error) { st.game = null; st.error = error.message; }
  if (st.game?.ok) {await loadGamePresentation(true);await loadList();}
  render();
 }
 async function loadList() {
  try { const r = await call('/api/chars'); st.items = r.items; st.choices = r.choices; } catch (error) { st.items = []; api.toast(error.message); }
 }
 async function open(sid, force = false) {
  await queueTalk(() => {});
  if (!force && (dirtyCount() || lookEd.dirty() || Object.keys(st.qedits).length || sharingChanged()) && !window.confirm('저장하지 않은 변경을 버리고 다른 캐릭터를 열까요?')) return;
  if (!force && (st.bookDirty || st.bgUnsaved) && !window.confirm('저장하지 않은 대사집·배경 분류 변경을 버릴까요?')) return;
  try { st.ch = await call('/api/char/' + sid); st.choices = st.ch.choices; st.sel = sid; st.danger = null; st.roleCopy = null; st.edits = blank(); st.preview = null; lookEd.reset(st.ch); Object.assign(st, {qq: '', qhits: null, qedits: {}, qmod: null, qid: '', qdesc: ''}); await loadTalk(); sendToSim(false); } catch (error) { api.toast(error.message); }
  render();
 }
 async function loadTalk() {
  await queueTalk(() => {});
  st.talk = await call('/api/talkbook/' + st.sel);
  st.book = structuredClone(st.talk.book ?? {background: {}, lines: {}, notes: ''});
  st.book.background = pickerBackground(data(), st.book.background ?? {}); st.book.lines ??= {}; st.book.refs ??= {}; st.bookDirty = false; st.bgVersion++; st.bgUnsaved = false;
 }
 async function saveTalk(bgOnly = false) {
  const strip = ({format, version, id: _id, name, jsonFile, ...rest}) => rest;
  const sid = st.sel, version = st.bgVersion, background = structuredClone(st.book.background), fullBook = strip(structuredClone(st.book));
  st.talkPending++;
  try {
   await queueTalk(async () => {
    if (st.sel !== sid) return;
    // The server merges background-only writes with persisted dialogue under the same lock.
    const book = bgOnly ? {...strip(st.talk.book ?? {}), background} : fullBook;
    const result = await call('/api/talkbook/' + sid, {book, revision: st.ch.revision, ...(bgOnly ? {applyBackground: true} : {})});
    if (st.sel !== sid) return;
    st.talk = result;
    if (result.character) st.ch = result.character;
    else if (result.revision) st.ch.revision = result.revision;
    if (bgOnly) {
     if (version === st.bgVersion) { st.book.background = structuredClone(result.book.background ?? {}); st.bgUnsaved = false; }
    } else {
     const currentBackground = st.book.background;
     st.book = structuredClone(result.book); st.book.refs ??= {}; st.book.lines ??= {}; st.bookDirty = false;
     if (version !== st.bgVersion) st.book.background = currentBackground;
    }
    api.toast((bgOnly ? (isMaster ? '전환용 배경 분류를 저장했습니다 · ' : '게임 배경 분류를 저장했습니다 · ') : '대사집을 저장했습니다 · ') + result.path);
   });
  } catch (error) { api.toast(error.message); }
  finally { st.talkPending--; }
  render();
 }
 // 편집 중인 캐릭터를 시뮬레이터에 연다. 캐릭터를 열 때·저장할 때 자동으로, '시뮬레이터로 보내기' 버튼으로 직접(탭 이동까지)
 function sendToSim(go) {
  if (!api.charView || !st.ch || st.ch.id === 'new' || !st.book || (isMaster && !go)) return;
  api.charView.loadGameCharacter(pendingData(), st.ch.jsonFile, {...st.book, simulation:simulationData(),portrait:st.ch.faces?.seed_ava_clear??st.ch.faces?.seed_ava,background: resolveBg(st.book.background ?? {}),backgroundResolved:true, fixedSexTalk:isMaster?false:st.ch.spawnPolicy?.unique, id: isMaster ? 'master:' + st.ch.id : st.ch.id});
  if (go) { api.switchTab('character'); api.toast(`${st.ch.data.seed_name || 'ID ' + st.ch.id}을(를) 시뮬레이터로 보냈습니다. 각색한 뒤 캐릭터 편집 › 대사집에서 '담기'를 누르세요.`); }
 }
 // 편집 중(저장 전) 값까지 반영한 게임 JSON: 시뮬레이터로 보낼 때 쓴다
 function pendingData() {
  const d = {...data()};
  for (const k of st.edits.unset) delete d[k];
  Object.assign(d, st.edits.set);
  for (const [k, f] of st.ch.storyFields) if (k in st.edits.story) d[f] = st.edits.story[k];
  return d;
 }
 async function preview() {
  const invalid=root.querySelector('[data-st-initial]:invalid,[data-st-master-cm]:invalid,[data-st-simulation]:invalid,[data-st-set]:invalid');if(invalid){invalid.reportValidity();return;}
  try { await queueTalk(async () => {
   const body = {set: st.edits.set, unset: [...st.edits.unset], story: st.edits.story, master: st.edits.master, initials: st.edits.initials, ...simulationPatch(), revision: st.ch.revision, dryRun: true};
   st.preview = (await call(`/api/char/${st.sel}/fields`, body)).changes;
  }); } catch (error) { api.toast(error.message); }
  render();
 }
 async function saveNow() {
  const invalid=root.querySelector('[data-st-initial]:invalid,[data-st-master-cm]:invalid,[data-st-simulation]:invalid,[data-st-set]:invalid');if(invalid){invalid.reportValidity();return;}
  try {
   await queueTalk(async () => {
   const body = {set: st.edits.set, unset: [...st.edits.unset], story: st.edits.story, master: st.edits.master, initials: st.edits.initials, ...simulationPatch(), revision: st.ch.revision};
   const r = await call(`/api/char/${st.sel}/fields`, body);
   if (r.character) st.ch = r.character;
   if (st.book) st.book.background = pickerBackground(st.ch.data, st.book.background);
   st.edits = blank(); st.preview = null; sendToSim(false);
   api.toast(r.saved ? `저장했습니다 · ${r.changes.length}개 항목 (처음 저장이면 .bak 백업을 남겼습니다)` : '바뀐 것이 없습니다.');
   const item = st.items.find(x => x.id === st.sel); if (item) item.name = (isMaster ? st.ch.master.name : st.ch.data.seed_name) ?? item.name;
   });
  } catch (error) { api.toast(error.message); }
  render();
 }

 // ---------------------------------------------------------------- 그리기
 const runtimeActor=()=>!isMaster&&st.ch&&st.ch.id!=='new'?{id:Number(st.ch.id),data:pendingData()}:null;
 subscribeRuntime(()=>{if(!root.hidden&&st.tab==='stats')render();});
 function render() {
  root.inert = !!st.sharing?.busy;
  if (!st.game?.ok) { root.innerHTML = gameForm(); return; }
  root.innerHTML = `<div class="st-wrap"><aside class="st-lib card">${library()}</aside><div class="st-main">${st.ch ? editor() : '<article class="card"><div class="card-body"><p class="muted-text">왼쪽 목록에서 캐릭터를 고르세요.</p></div></article>'}</div></div>`;
  if(st.ch&&!isMaster&&st.tab==='stats')bindRuntimeControls(root,runtimeActor());
  if (st.ch && st.tab === 'look') lookEd.draw(root);
 }
 function gameForm() {
  return `<article class="card"><div class="card-head"><h2><span class="index">01</span>게임 폴더</h2></div><div class="card-body">
   <p>${e(st.error || st.game?.hint || '게임 폴더를 지정하세요.')}</p>
   <p class="fine-print">content/pic/girls/full 과 json/slaves 가 있는 game 폴더 경로를 붙여 넣으세요. 이 PC의 설정 파일(studio.local.json)에만 저장합니다.</p>
   <div class="st-row"><input data-st="root" value="${e(st.game?.root ?? '')}" placeholder="예: G:\\Jack O Nine Tails\\game" size="60"><button class="button" data-st-act="set-root">지정</button></div></div></article>`;
 }
 function library() {
  const q = st.q.trim().toLowerCase();
  const list = st.items.filter(x => {
   if (isMaster && st.gender && x.gender !== st.gender) return false;
   if (!isMaster && st.uniqueOnly && x.unique !== true) return false;
   return !q || String(x.id).includes(q) || (x.name || '').toLowerCase().includes(q) || (x.base || '').toLowerCase().includes(q) || (x.jsonFile || '').toLowerCase().includes(q);
  });
  const uniqueFilter = isMaster ? '' : `<label class="cv-lock"><input type="checkbox" data-st="unique-only" ${st.uniqueOnly ? 'checked' : ''}> 유니크만 보기</label>`;
  const pages = Math.max(1, Math.ceil(list.length / PAGE)), page = Math.min(st.page, pages - 1);
  return `<div class="st-lib-head">${isMaster ? `<div class="st-row">${[['','전체'],['male','남주인공'],['female','여주인공']].map(([k,l]) => `<button class="button secondary small ${st.gender===k?'primary':''}" data-role-gender="${k}">${l}</button>`).join('')}</div><p class="fine-print">새 마스터는 인물의 복제 메뉴에서 만듭니다.</p>` : ''}<button class="button secondary st-new" data-st-act="new" ${isMaster ? 'hidden' : st.choices ? '' : 'disabled title="먼저 캐릭터 하나를 열어 선택지를 읽으세요"'}>+ 새 캐릭터</button><input data-st="q" value="${e(st.q)}" placeholder="번호·이름·파일 검색">${uniqueFilter}<small class="fine-print">${list.length}명 · ${e(st.game.root)}</small></div>
   <div class="st-list">${list.slice(page * PAGE, page * PAGE + PAGE).map(x => `<button class="st-item ${x.id === st.sel ? 'on' : ''}" data-st-open="${x.id}">${x.face ? `<img src="${e(x.face)}" alt="" loading="lazy">` : '<span class="st-noface">?</span>'}<span><b>${x.id}</b> ${e(x.name || x.base)}<small>${e([x.age, x.color, x.length].filter(Boolean).join(' · '))}${x.outfits.length ? ' · 외형 ' + e(x.outfits.join('/')) : ''}</small></span></button>`).join('')}</div>
   <div class="st-pager"><button class="text-button" data-st-page="-1" ${page ? '' : 'disabled'}>◀</button><span>${page + 1} / ${pages}</span><button class="text-button" data-st-page="1" ${page < pages - 1 ? '' : 'disabled'}>▶</button></div>`;
 }
 function newEditor() {
  const n = st.nw, sel = (k, opts) => `<select data-nw="${k}">${opts.map(o => `<option value="${e(o)}" ${String(n[k]) === String(o) ? 'selected' : ''}>${e(o)}</option>`).join('')}</select>`;
  return `<article class="card"><div class="card-head st-head"><h2>새 캐릭터</h2><div class="st-save"><button class="button secondary" data-st-act="cancel-new">취소</button></div></div>
   <div class="card-body">${spawnNotice(newSpawnPolicy(n),e)}<div class="cv-form"><label class="cv-lock"><input type="checkbox" data-nw="unique" ${n.unique ? 'checked' : ''}> 고유 캐릭터(랜덤 등장 안 함)</label>
     ${n.unique ? `<label>표시 이름<input data-nw="name" value="${e(n.name)}" maxlength="40"></label><label>파일 이름(영문)<input data-nw="slug" value="${e(n.slug)}" maxlength="40"></label><label>번호(비우면 자동)<input data-nw="id" value="${e(n.id)}" maxlength="6"></label>` : `<label class="cv-lock"><input type="checkbox" data-nw="register" ${n.register ? 'checked' : ''}> 랜덤 풀에 등록</label>`}
     <label>머리색${sel('color', st.choices.hair)}</label><label>머리 길이${sel('length', st.choices.length)}</label><label>나이 분류${sel('age', st.choices.age)}</label>
     <label>가슴 크기${sel('boobs', st.choices.boobs)}</label><label>가슴 이미지${sel('boobsImg', st.choices.boobsImg)}</label><label>성기 이미지${sel('pussyImg', st.choices.pussyImg)}</label></div>
    ${n.unique ? Object.entries(STORY_LABEL).map(([k, l]) => `<section class="st-story"><div class="section-label">배경 이야기 · ${l}</div><textarea data-nw-story="${k}" rows="3">${e(n.story[k])}</textarea></section>`).join('') : ''}
    <p class="fine-print">기본(알몸) 전신과 얼굴(상자 또는 파일)이 있어야 만들 수 있습니다. 능력치·특성·대사집은 만든 뒤 각 탭에서 고칩니다.</p>
    ${lookEd.html()}</div></article>`;
 }
 function dangerBox() {
  const d = st.danger;
  if (d.kind === 'clone') return `<div class="st-preview"><b>이 캐릭터 복제</b> <span class="fine-print">이미지는 원본과 같은 파일을 함께 쓰고, 이름·배경·능력치만 따로 고칩니다. 랜덤 풀에는 넣지 않습니다.</span>
    <div class="cv-form"><label>표시 이름<input data-dg="name" value="${e(d.name)}"></label><label>파일 이름(영문)<input data-dg="slug" value="${e(d.slug)}"></label><label>번호(비우면 자동)<input data-dg="newId" value="${e(d.newId)}"></label></div>
    ${d.result ? `<p>새 번호 ${d.result.id} · ${e(d.result.json)}</p>${d.result.warnings.map(w => `<p class="warning">${e(w)}</p>`).join('')}` : ''}
    <div class="st-row"><button class="button secondary" data-dg-act="clone-dry">미리보기</button><button class="button" data-dg-act="clone">복제</button><button class="button secondary" data-dg-act="close">닫기</button></div></div>`;
  const p = d.plan;
  return `<div class="st-preview"><b>ID ${p.id} 삭제</b>${p.sharedWith.length ? `<p class="warning">같은 이미지를 쓰는 캐릭터 ${p.sharedWith.join(', ')}: 공유 PNG는 보존하고 이 캐릭터의 데이터와 단독 이미지만 지웁니다.</p>` : ''}
   ${p.middle ? `<div class="st-row"><label><input type="radio" name="dgmode" data-dg="mode" value="safe" ${d.mode === 'safe' ? 'checked' : ''}> 번호 유지(이웃 데이터로 빈칸 채움, 세이브 안전)</label><label><input type="radio" name="dgmode" data-dg="mode" value="swap" ${d.mode === 'swap' ? 'checked' : ''}> 마지막 번호(${p.last})를 옮겨 등록 수 줄이기(세이브 주의)</label></div>` : ''}
   <div class="st-row"><input data-dg="confirm" placeholder="지우려면 번호 ${p.id} 를 입력" value="${e(d.confirm ?? '')}"><button class="button" data-dg-act="delete">삭제</button><button class="button secondary" data-dg-act="close">닫기</button></div></div>`;
 }
 function editor() {
  if (st.ch.id === 'new') return newEditor();
  const c = st.ch, n = dirtyCount();
  return `<article class="card"><div class="card-head st-head"><h2>${e((isMaster ? c.master?.name : c.data.seed_name) || '(이름 없음)')} <small>${isMaster ? (c.gender==='female'?'여주인공':'남주인공') : '노예'} · ID ${c.id} · ${e(c.jsonFile)}${c.dedicated ? ' · 전용 폴더' : ''}</small></h2>
    <div class="st-save"><span class="badge" data-st-badge ${n ? '' : 'hidden'}>저장 안 한 변경 ${n}</span><button class="button secondary" data-st-act="discard" ${n ? '' : 'hidden'}>되돌리기</button><button class="button secondary" data-st-act="preview" ${n ? '' : 'disabled'}>변경 보기</button><button class="button" data-st-act="save" ${n ? '' : 'disabled'}>${isMaster ? '마스터 원본 저장' : '편집값 저장'}</button><button class="button secondary st-tosim" data-st-act="to-sim" title="지금 편집 중인 값(저장 전 포함)과 대사집을 캐릭터 시뮬레이터에 열고 그 탭으로 갑니다">▶ 시뮬레이터로 보내기</button><button class="button secondary" data-role-copy-act="open">${isMaster ? '노예 캐릭터로 복제…' : '마스터로 복제…'}</button>${isMaster ? '' : '<button class="button secondary" data-st-act="clone">복제…</button><button class="button secondary" data-st-act="delete">삭제…</button>'}</div></div>
   ${isMaster ? '' : spawnNotice(c.spawnPolicy,e)}
   ${isMaster ? `<p class="fine-print">시작 프리셋 · ${c.menuLinked ? '게임 시작 메뉴 연결됨' : '게임 시작 메뉴 미연결 · QSP 이벤트에서 연결'}</p>` : ''}${st.preview ? previewBox() : ''}${st.danger ? dangerBox() : ''}${st.roleCopy ? cloneForm(st.roleCopy) : ''}
   <div class="st-tabs">${TABS.map(([k, l]) => `<button class="${st.tab === k ? 'on' : ''}" data-st-tab="${k}">${k==='json' && isMaster ? '원본 데이터' : l}</button>`).join('')}</div>
   <div class="card-body">${{look, setting, stats, talk, qsp, json}[st.tab]()}</div></article>`;
 }
 function previewBox() {
  const short = v => v === undefined ? '(없음 = 게임이 무작위)' : typeof v === 'string' && v.length > 80 ? v.slice(0, 80) + '…' : String(v);
  return `<div class="st-preview"><b>저장할 변경 ${st.preview.length}개</b><ul>${st.preview.map(x => `<li><code>${e(x.key)}</code> ${e(short(x.before))} → <b>${e(short(x.after))}</b></li>`).join('')}</ul>
   <div class="st-row"><button class="button" data-st-act="save">${isMaster ? '마스터 원본 저장' : '게임 파일에 저장'}</button><button class="button secondary" data-st-act="cancel-preview">취소</button><span class="fine-print">${isMaster ? 'QSP 원본 1회 백업과 변경 mods 기록을 남깁니다.' : '처음 저장할 때 같은 폴더에 .bak 백업을 남깁니다.'}</span></div></div>`;
 }
 const later = msg => () => `<p class="muted-text">${e(msg)}</p>`;
 // JO9 MOD START CHARACTER_IMAGE_SHARING_20261117
 const sharingDefaults = descriptor => new Set((descriptor?.candidates || []).filter(peer => peer.checked).map(peer => String(peer.id)));
 function sharingChanged(state = st.sharing) {
  if (!state || String(state.id) !== String(st.ch?.id)) return false;
  const saved = sharingDefaults(state.descriptor);
  return saved.size !== state.selected.size || [...saved].some(peer => !state.selected.has(peer));
 }
 function sharingState() {
  if (isMaster || !st.ch || st.ch.id === 'new') return null;
  const descriptor = st.ch.sharing;
  if (!st.sharing || String(st.sharing.id) !== String(st.ch.id)) st.sharing = {id: st.ch.id, descriptor, selected: sharingDefaults(descriptor), plan: null, busy: false, error: ''};
  else if (descriptor && (st.sharing.descriptor?.expectedHash !== descriptor.expectedHash || st.sharing.descriptor?.policyHash !== descriptor.policyHash)) {
   const old = st.sharing, pending = sharingChanged(old), available = new Set((descriptor.candidates || []).map(peer => String(peer.id)));
   st.sharing = {...old, descriptor, selected: pending ? new Set([...old.selected].filter(peer => available.has(peer))) : sharingDefaults(descriptor), plan: null, error: ''};
  }
  return st.sharing;
 }
 function sharingBox() {
  const state = sharingState(); if (!state) return '';
  const descriptor = state.descriptor, peers = (descriptor?.candidates || []).filter(peer => String(peer.id) !== String(st.ch.id)), plan = state.plan;
  const removed = peers.filter(peer => peer.checked && !state.selected.has(String(peer.id))).map(peer => peer.id);
  const bytes = Number(plan?.copyBytes || 0).toLocaleString('ko-KR');
  return `<section class="st-image-sharing" aria-label="이미지 공유·분리"><div class="section-label">이미지 공유·분리</div>
   <p class="fine-print">기본 이미지: <code>${e(st.ch.data.fullimage || st.ch.slots.base?.reference || '연결 없음')}</code></p>
   <p class="fine-print">다른 번호를 체크하면 현재 인물의 이미지 구성을 함께 사용합니다. 체크 해제는 현재 모습을 유지하며 분리합니다. 체크만으로 저장되지 않습니다.</p>
   ${descriptor ? `<div class="st-sharing-peers">${peers.length ? peers.map(peer => `<label><input type="checkbox" data-st-share-peer="${e(peer.id)}" ${state.selected.has(String(peer.id)) ? 'checked' : ''}><span><b>${e(peer.id)}</b> ${e(peer.name || '')}<small class="source-line">${e(peer.json || '')}</small></span></label>`).join('') : '<p class="fine-print">같은 기본 전신을 쓰거나 현재 공유 중인 다른 캐릭터가 없습니다.</p>'}</div>` : '<p class="fine-print">공유 목록을 읽어 다른 번호를 확인하세요.</p>'}
   ${descriptor?.inheritedFields?.length ? `<p class="fine-print">공유 이미지에서 보완한 연결: ${descriptor.inheritedFields.map(key => `<code>${e(key)}</code>`).join(' · ')}</p>` : ''}
   ${plan ? `<div class="st-preview"><b>이미지 공유·분리 미리보기</b><p>이미지 기준: ${e(state.id)} · 영향을 받는 번호: ${e((plan.affectedIds || []).join(' · ') || '없음')}</p>
    ${removed.length ? `<p>공유 해제: ${e(removed.join(' · '))} · 현재 모습을 유지합니다.</p>` : ''}
    <p class="fine-print">PNG 복사 ${Number(plan.copyCount || 0).toLocaleString('ko-KR')}개 · ${bytes}바이트. 다른 그룹도 쓰는 PNG만 새 경로로 복사하고 원본은 보존합니다.</p>
    <ul>${(plan.changes || []).map(change => `<li><b>${e(change.id)}</b> · <code>${e(change.json)}</code><br><span class="fine-print">연결 항목: ${(change.fields || []).map(key => `<code>${e(key)}</code>`).join(' · ') || '변경 없음'}</span></li>`).join('') || '<li>JSON 연결 변경 없음</li>'}</ul></div>` : ''}
   ${state.error ? `<p class="warning" role="alert">${e(state.error)}</p>` : ''}
   <div class="st-row"><button class="button secondary" data-st-share-act="read">공유 목록 다시 읽기</button><button class="button secondary" data-st-share-act="preview" ${descriptor && sharingChanged(state) ? '' : 'disabled'}>미리보기</button><button class="button" data-st-share-act="apply" ${plan ? '' : 'disabled'}>공유·분리 적용</button><button class="button secondary" data-st-share-act="cancel" ${plan || sharingChanged(state) ? '' : 'disabled'}>취소</button></div></section>`;
 }
 async function changeSharing(action) {
  const state = sharingState(); if (!state || state.busy) return;
  if (action === 'cancel') { state.selected = sharingDefaults(state.descriptor); state.plan = null; state.error = ''; return render(); }
  if (action !== 'read' && (dirtyCount() || lookEd.dirty() || st.bookDirty || Object.keys(st.qedits).length)) {
   state.error = '저장하지 않은 편집 내용이 있습니다. 각 탭에서 먼저 저장하거나 되돌린 뒤 공유·분리를 미리보기·적용하세요.';
   api.toast(state.error); return render();
  }
  const descriptor = state.descriptor, plan = state.plan;
  if (action === 'apply' && !plan) return;
  const peerIds = (descriptor?.candidates || []).filter(peer => state.selected.has(String(peer.id))).map(peer => peer.id);
  state.busy = true; state.error = ''; let applied = false; render();
  try {
   const result = await call(`/api/char/${state.id}/sharing`, {action, peerIds, expectedHash: plan?.expectedHash || descriptor?.expectedHash, policyHash: plan?.policyHash || descriptor?.policyHash, ...(action === 'apply' ? {planHash: plan.planHash} : {})});
   if (action === 'preview') state.plan = result;
   else if (action === 'read') { state.descriptor = result.sharing || result; st.ch.sharing = state.descriptor; state.selected = sharingDefaults(state.descriptor); state.plan = null; }
   else {
    applied = true; state.plan = null;
    if (result.sharing) { state.descriptor = result.sharing; st.ch.sharing = result.sharing; state.selected = sharingDefaults(result.sharing); }
    st.ch = await call('/api/char/' + state.id); lookEd.reset(st.ch); st.sharing = null; await loadList(); sendToSim(false);
    api.toast(`이미지 공유·분리를 적용했습니다 · ${(result.affectedIds || [state.id]).join(' · ')}`);
   }
  } catch (error) { state.plan = null; state.error = (applied ? '공유·분리는 적용됐지만 최신 화면을 읽지 못했습니다. 캐릭터를 다시 열어 확인하세요. · ' : '') + error.message; api.toast(state.error); }
  finally { state.busy = false; render(); }
 }
 // JO9 MOD END CHARACTER_IMAGE_SHARING_20261117
 function look() {
  const c = st.ch, ch = c.choices;
  const sel = (key, options, labels = {}) => `<select data-st-set="${key}" data-type="${typeof data()[key] === 'number' ? 'int' : 'str'}">${options.map(o => `<option value="${e(o)}" ${String(val(key)) === String(o) ? 'selected' : ''}>${e(labels[o] ?? o)}</option>`).join('')}</select>`;
  return `${isMaster ? '<p class="fine-print">편집용 외형입니다. 게임의 기존 마스터 초상 파일은 덮어쓰지 않습니다. 노예로 복제할 때 사용할 수 있습니다.</p>' : sharingBox()}${lookEd.html()}
   <div class="section-label">외모 분류값 <small class="fine-print">(위 '저장…' 버튼으로 JSON에 저장)</small></div>
   <div class="cv-form"><label>가슴 크기${sel('seed_boobs', ch.boobs.map(Number))}</label><label>가슴 이미지${sel('seed_boobs_img', ch.boobsImg)}</label><label>성기 이미지${sel('seed_pussy_img', ch.pussyImg)}</label></div>`;
 }
 const masterData = () => st.edits.master || st.ch?.master || {name: data().seed_name || '', description:'', difficulty:'', statsCode:'', portrait:'', sepia:''};
 function setMaster(key, value) {
  const m = {...masterData(), [key]: value};
  st.edits.master = JSON.stringify(m) === JSON.stringify(st.ch.master) ? null : m;
  st.preview = null; updateHead();
 }
 function setting() {
  return `<div class="st-tabs">${[['slave','노예용 설정'],['master','마스터용 설정']].map(([k,l])=>`<button data-role-background="${k}" class="${st.bgMode===k?'on':''}">${l}</button>`).join('')}</div>${st.bgMode==='master' ? masterSettings(masterData(),role) : (isMaster ? '<p class="fine-print">마스터의 노예 전환용 설정입니다. 게임의 마스터 시작 능력치와 별도로 보관합니다.</p>' : '') + slaveSetting()}`;
 }
 function slaveSetting() {
  const d = data();
  return `<div class="cv-form"><label>이름<input data-st-set="seed_name" data-type="str" value="${e(val('seed_name') ?? '')}" maxlength="40"></label>
    <label>나이 분류<select data-st-set="seed_age" data-type="int">${Object.entries(AGE).map(([k, l]) => `<option value="${k}" ${String(val('seed_age')) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>기본 심리<select data-st-set="seed_psy_basic" data-type="str"><option value="">(무작위)</option>${Object.entries(PSY).map(([k, l]) => `<option value="${k}" ${val('seed_psy_basic') === k ? 'selected' : ''}>${l} (${k})</option>`).join('')}</select></label>
    <label>처녀 여부<select data-st-set="seed_virginity" data-type="int"><option value="">(무작위)</option><option value="0" ${val('seed_virginity') === 0 ? 'selected' : ''}>처녀(0)</option><option value="2" ${val('seed_virginity') === 2 ? 'selected' : ''}>비처녀(2)</option></select></label></div>
   ${bgPicker()}
   ${st.ch.storyFields.map(([k, f]) => `<section class="st-story"><div class="section-label">배경 이야기 · ${STORY_LABEL[k]} <small class="source-line">${f}</small>${k in st.edits.story ? ' <span class="badge">수정됨</span>' : ''}</div><textarea data-st-story="${k}" rows="5" maxlength="6000">${e(storyText(k))}</textarea></section>`).join('')}
   <p class="fine-print">줄바꿈은 게임에서 줄바꿈(&lt;br&gt;)이 됩니다. 칸을 비우면 게임이 배경을 무작위로 정합니다. ${d.scene_tag ? '장면 태그 ' + e(d.scene_tag) : ''}</p>`;
 }
 function stats() {
  const native = masterStats(masterData(),role,st.ch.nativeDefaults,st.ch.initialCatalog,st.edits.initials), seeds = slaveStats();
  return isMaster ? native + '<details><summary>노예 전환용 능력치·특성</summary>' + seeds + '</details>' : runtimeControls(runtimeActor()) + seeds + '<details><summary>마스터 전환용 능력치</summary>' + native + '</details>';
 }
 function slaveStats() {
  const runtime=runtimeValues(runtimeActor());
  const present = k => val('seed_' + k) !== undefined;
  const used = new Set([...GROUPS.flatMap(g => g[1]),'spoil','fear','angst','instinct','rational','custom','moral','mood','arousal','obedience','sex_sum']);
  const sex = seedKeys.filter(k => k.startsWith('sub_') || k === 'anal_stretch');
  const misc = seedKeys.filter(k => !used.has(k) && !sex.includes(k) && !traitKeys.has(k) && !/description|^name$|^age$|psy_basic|^ava|boobs|pussy|virginity/.test(k));
  const cell = k => {const key='seed_'+k,v=val(key),actual=runtime?.values[k],info=describeGameValue(k,actual??v);return `<label class="st-stat st-game-stat ${key in st.edits.set||st.edits.unset.has(key)?'changed':''}" title="${e(info.tooltip+'\n'+describeCharacterField([key],v).hint)}"><span class="st-stat-name">${e(label(key))}</span><span class="st-stat-controls">${v===undefined?`<button class="text-button" data-st-add="${key}">무작위 → 고정</button>`:`<input type="number" data-st-set="${key}" data-type="int" value="${e(v)}" step="1"><button class="text-button" data-st-unset="${key}" title="고정값 해제">×</button>`}</span><small class="st-stat-description" data-game-description>${valueBadge(k,actual??v)}${actual!==undefined?'<span class="fine-print"> QSP 계산값</span>':''}</small></label>`;};
  const block = (title, keys, all = false) => { const ks = keys.filter(k => seedKeys.includes(k) && (all || present(k) || ['기본 속성', '정신·관계', '일 기술'].includes(title))); return ks.length ? `<div class="section-label">${title}</div><div class="st-grid">${ks.map(cell).join('')}</div>` : ''; };
  const on = traitRows.filter(t => traitOn(val('seed_' + t.binding.key), t.binding));
  return `<div class="section-label">특성 ${on.length}개 <small class="fine-print">게임 JSON으로 고정할 수 있는 특성 ${traitRows.length}개 중</small></div>
   <div class="tag-list">${on.map(t => `<button class="tag game-trait" ${traitStyle(t)} data-st-trait-off="${e(t.binding.key)}" title="${e(t.description)}">${e(t.name)} ×</button>`).join('') || '<span class="fine-print">고정된 특성 없음(게임이 무작위로 정함)</span>'}</div>
   <div class="st-row"><input list="stTraitList" data-st="trait" placeholder="특성 이름을 입력해 추가"><datalist id="stTraitList">${traitRows.map(t => `<option value="${e(t.name)}">`).join('')}</datalist><button class="button secondary" data-st-act="trait-add">추가</button><span class="fine-print">같은 값을 쓰는 특성은 하나만 가질 수 있습니다(새것으로 바뀜).</span></div>
   ${GROUPS.map(([t, ks]) => block(t, ks)).join('')}
   ${simulationFields(pendingData(),simulationData(),runtime)}
   ${block('성 기술(0=F … 5=S)', sex)}
   ${block('그 밖의 고정값', misc)}
   <div class="st-row"><input list="stKeyList" data-st="addkey" placeholder="고정할 seed 키 추가(예: seed_courage)"><datalist id="stKeyList">${seedKeys.map(k => `<option value="seed_${k}">${e(label('seed_' + k))}</option>`).join('')}</datalist><button class="button secondary" data-st-act="key-add">추가</button></div>
   <p class="fine-print">키가 없는 항목은 게임이 무작위로 정합니다. ×는 고정값을 지워 무작위로 되돌립니다.</p>`;
 }
 function refBody(key) {
  const r = REFS.rows[key]; if (!r) return '<p class="fine-print">DB에 없는 키입니다.</p>';
  const blocked = r.b.map(c => `${c} ${REFS.blockNames[c] ?? ''}`).join(', ');
  return `${blocked ? `<p class="warning">표시 불가 분류: ${e(blocked)}</p>` : ''}${r.t === null ? `<p class="fine-print">원문을 싣지 않은 대답입니다. 원본 글의 Q${r.q}${r.o > 1 ? ` (${r.o}번째)` : ''}에서 확인하세요. 부분 키: ${r.p.map(e).join(', ')}</p>` : `<p class="cv-ref-text">${e(r.t)}</p>`}<a href="${e(REFS.urls[r.u])}" target="_blank" rel="noopener">원본 글 열기 (Q${r.q})</a>`;
 }
 function slotEditor(lv, id, label) {
  const b = st.book, ref = b.refs?.[id], text = b.lines?.[id] ?? '', pool = questionPool(id);
  const fixed = !isMaster && st.ch.spawnPolicy?.unique;
  const canUseRef = fixed && ref && REFS.rows[ref.key]?.t?.trim();
  const open = ref || text;
  return `<details class="tb-slot" ${open ? 'open' : ''}><summary><b>${e(label)}</b> <small>헌신 ${lv} · <code>${id}</code></small>${ref ? ` <span class="badge muted">${e(ref.key)}${ref.blocked.length ? ' · ' + e(ref.blocked.join(',')) : ''}</span>` : ''}${text ? ' <span class="badge">대사 있음</span>' : ''}</summary>
   <div class="tb-slot-body"><div class="tb-ref"><div class="st-row"><button class="text-button" data-tb-step="${id}" data-d="-1" ${pool.length ? '' : 'disabled'}>◀</button><select data-tb-ref="${id}"><option value="">(원본 DB 고르기 · 후보 ${pool.length}개)</option>${pool.map(k => { const r = REFS.rows[k]; return `<option value="${e(k)}" ${ref?.key === k ? 'selected' : ''}>${e(k)}${r?.b.length ? ' · ' + r.b.join(',') : ''}${r?.t === null ? ' · 원문 없음' : ''}</option>`; }).join('')}</select><button class="text-button" data-tb-step="${id}" data-d="1" ${pool.length ? '' : 'disabled'}>▶</button></div>
    ${ref ? refBody(ref.key) : '<p class="fine-print">고르면 원문이 여기 나옵니다.</p>'}${canUseRef ? `<button class="button secondary small" data-tb-use-ref="${id}">이 원문을 고정 답변으로 사용</button>` : ''}</div>
   <textarea data-tb-line="${id}" rows="4" maxlength="8000" placeholder="${fixed?'고정 답변을 직접 입력하세요':'원문을 참조해 이 캐릭터 말투로 직접 쓰세요'}">${e(text)}</textarea></div></details>`;
 }
 function setRef(id, key) {
  if (!key) delete st.book.refs[id]; else st.book.refs = {...(st.book.refs ?? {}), [id]: {key, blocked: REFS.rows[key]?.b ?? []}};
  st.bookDirty = true; render();
 }
 // 배경 분류는 대사집과 캐릭터 seed_ 메타데이터에 함께 저장한다. 설명·능력치·특성은 유지한다.
 const groupOf = (kind, id) => (CAT[kind] ?? []).find(g => g.members.includes(id));
 const ORDER = ['world', 'family', 'occupation'];
 const groupList = kind => [...(CAT[kind] ?? [])];
 // 위 칸이 소분류(고정)면 그 값, 대분류만이면 그 대분류의 모든 후보를 위 칸 값으로 보고 이 칸의 허용 목록을 낸다(시대순)
 function candidates(kind, bg) {
  if (!isMaster && st.ch?.spawnPolicy?.unique) return SD.optionsV2(kind, {});
  const ups = ORDER.slice(0, ORDER.indexOf(kind));
  const upVals = k => bg[k] ? [bg[k]] : bg[k + 'Group'] ? candidates(k, bg).filter(id => groupList(k).find(g => g.id === bg[k + 'Group'])?.members.includes(id)) : [''];
  let combos = [{}];
  for (const k of ups) combos = combos.flatMap(c => upVals(k).map(v => ({...c, [k]: v || undefined})));
  const out = new Set(combos.flatMap(c => SD.optionsV2(kind, c)));
  return SD.optionsV2(kind, {}).filter(id => out.has(id));
 }
 // 대분류만 정한 칸은 그 안에서 무작위로 한 번 뽑는다(시뮬레이터로 보낼 때마다 새로 뽑음)
 function resolveBg(bg) {
  const out = {};
  for (const k of ORDER) {
   if (bg[k]) { out[k] = bg[k]; continue; }
   const g = bg[k + 'Group']; if (!g) continue;
   const pool = candidates(k, {...out}).filter(id => groupList(k).find(x => x.id === g)?.members.includes(id));
   if (pool.length) out[k] = pool[Math.floor(Math.random() * pool.length)];
  }
  return out;
 }
 // 배경 분류: 세계·출신·직업 3열, 1행 대분류·2행 소분류. 대분류만 고르면 그 안에서 무작위, 소분류 목록은 고른 대분류에 속한 것만. 고르면 대사집에 바로 저장(유니크 포함)
 function bgPicker() {
  if (!st.book) return '';
  const bg = st.book.background;
  const row = (kind, label) => {
   const allowed = candidates(kind, bg);
   const groups = groupList(kind);
   const loose = allowed.filter(id => !groupOf(kind, id));
   if (loose.length) groups.push({id: '_etc', label: '그 밖', members: loose});
   const first = g => { const i = Math.min(...g.members.map(m => allowed.indexOf(m)).filter(x => x >= 0)); return Number.isFinite(i) ? i : 1e4; };
   groups.sort((a, b) => first(a) - first(b));
   const savedGroup = bg[kind + 'Group'];
   const big = bg[kind] ? (groups.find(x => x.id === savedGroup)?.members.includes(bg[kind]) ? savedGroup : groupOf(kind, bg[kind])?.id ?? '_etc') : savedGroup ?? '';
   const g = groups.find(x => x.id === big);
   const items = g ? allowed.filter(id => g.members.includes(id)) : [];
   if (bg[kind] && !items.includes(bg[kind])) items.unshift(bg[kind]);
   return `<div class="bg-tree"><span class="bg-tree-label">${label}${big || bg[kind] ? ` <button class="text-button" data-tb-clear="${kind}" title="이 칸 비우기">× 비우기</button>` : ''}</span>
    <select data-tb-big="${kind}"><option value="">(대분류 정하지 않음)</option>${groups.map(x => { const n = x.members.filter(m => allowed.includes(m)).length; return `<option value="${e(x.id)}" ${x.id === big ? 'selected' : ''} ${n ? '' : 'disabled'}>${e(x.label)} (${n})</option>`; }).join('')}</select>
    <select data-tb-bg="${kind}" ${g ? '' : 'disabled'}><option value="">${g ? '(이 대분류 안에서 무작위)' : '먼저 대분류'}</option>${items.map(id => `<option value="${e(id)}" ${bg[kind] === id ? 'selected' : ''}>${e(SD.name(kind, id))}</option>`).join('')}</select></div>`;
  };
  const needsApply = st.bgUnsaved || needsBackgroundApply(data(), bg);
  return `<div class="section-label">배경 분류 <small class="fine-print">1행 대분류 · 2행 소분류. 소분류는 ${isMaster ? '노예 전환용 설정' : '게임 캐릭터 분류'}에 바로 저장됩니다. 대분류만 고르면 시뮬레이터에서 무작위로 뽑고 게임 분류는 미지정입니다. 배경 이야기·능력치·특성은 그대로 유지합니다.</small>${needsApply ? '<button class="button secondary" data-tb-act="apply-background">게임 분류로 적용</button>' : ''}</div>
   <div class="bg-trees">${row('world', '세계')}${row('family', '출신')}${row('occupation', '직업')}</div>`;
 }
 // 한 칸을 바꾼 뒤: 그 칸과 위는 두고, 아래 칸 중 새 후보에 없는 대분류·소분류를 비운다
 function setBg(kind, patch) {
  const bg = {...st.book.background, ...patch};
  for (const k of ORDER.slice(ORDER.indexOf(kind) + 1)) {
   const allowed = candidates(k, bg);
   if (bg[k] && !allowed.includes(bg[k])) delete bg[k];
   const g = bg[k + 'Group'];
   if (g && !allowed.some(id => groupList(k).find(x => x.id === g)?.members.includes(id))) delete bg[k + 'Group'];
  }
  st.book.background = Object.fromEntries(Object.entries(bg).filter(([, v]) => v));
  st.bgVersion++; st.bgUnsaved = true;
  const saved = saveTalk(true); render(); return saved;
 }
 function talk() {
  if (!st.talk) return '<p class="muted-text">대사집을 읽는 중…</p>';
  const b = st.book, sim = api.charView;
  const lines = Object.entries(b.lines ?? {});
  const facts = b.facts?.fields ? Object.entries(b.facts.fields).filter(([, v]) => v !== '' && v !== null && !(Array.isArray(v) && !v.length)) : [];
  return `<p class="fine-print">대사집 파일: <code>${e(st.talk.path)}</code> ${st.talk.exists ? '' : '(아직 없음 · 저장하면 만듭니다)'} · 게임 캐릭터 JSON과 따로 둡니다(게임 적용 방식은 모드 제작자가 정함).</p>
   ${bgPicker()}
   <div class="st-row"><button class="button secondary" data-tb-act="to-sim" ${sim ? '' : 'disabled'}>시뮬레이터에서 열기 →</button><button class="button secondary" data-tb-act="from-sim" ${sim ? '' : 'disabled'}>← 시뮬레이터 결과를 대사집에 담기</button>
    <span class="fine-print">${!isMaster&&st.ch.spawnPolicy?.unique?'질문별 원문을 고르거나 직접 쓴 뒤 대사집을 저장하세요. 유니크는 입력한 고정 답변만 사용합니다.':"시뮬레이터에서 과거 경험을 뽑고 필로우토크 칸을 직접 각색한 뒤 '담기'를 누르세요."}</span></div>
   <div class="section-label">질문하기 · 일반 대사</div><p class="fine-print">과거 묻기는 위 배경 설정 DB를 따릅니다. 질문별 개별 대사는 시뮬레이터에서 가져오거나 아래에서 직접 편집하세요.</p>
   ${lines.filter(([k])=>/^general\.111[2-8]$/.test(k)).map(([k,v])=>`<label class="st-story"><span class="section-label">${e(QUESTION_NAMES[k.slice(8)]||k)} <code>${e(k)}</code></span><textarea data-tb-line="${e(k)}" rows="3" maxlength="8000">${e(v)}</textarea></label>`).join('')||'<p class="fine-print">아직 개별 일반 대사가 없습니다.</p>'}
   <div class="section-label">성경험 묻기 · 섹스토크 대사 · 칸 ${SLOTS.length}개 <small class="fine-print">칸마다 원본 DB를 골라 참조하며 직접 씁니다. 저장: 대사 ${lines.filter(([, v]) => v).length}칸 · DB 연결 ${Object.keys(b.refs ?? {}).length}칸</small></div>
   ${SLOTS.map(([lv, id, label]) => slotEditor(lv, id, label)).join('')}
   ${lines.filter(([k]) => !SLOTS.some(s => s[1] === k)&&!/^general\.111[2-8]$/.test(k)).map(([k, v]) => `<label class="st-story"><span class="section-label"><code>${e(k)}</code> (추가 칸) <button class="text-button" data-tb-del="${e(k)}">지우기</button></span><textarea data-tb-line="${e(k)}" rows="3" maxlength="8000">${e(v)}</textarea></label>`).join('')}
   <div class="st-row"><input data-tb-newslot placeholder="추가 칸 ID(영문)" maxlength="60"><button class="button secondary" data-tb-act="add-line">칸 추가</button></div>
   ${facts.length ? `<details><summary class="section-label">과거 경험 사실 ${facts.length}개 (시드 ${e(b.seed ?? '')})</summary><div class="st-grid">${facts.map(([k, v]) => `<span class="st-stat"><code>${e(k)}</code><b>${e(Array.isArray(v) ? v.join(', ') : v)}</b></span>`).join('')}</div></details>` : ''}
   <div class="section-label">메모(사람·AI용)</div><textarea class="st-notes" data-tb-notes rows="3" maxlength="8000">${e(b.notes ?? '')}</textarea>
   <div class="st-row lk-save">${st.bookDirty ? '<span class="badge">대사집 변경 있음</span>' : ''}<button class="button" data-tb-act="save" ${st.bookDirty ? '' : 'disabled'}>대사집 저장</button>${st.bookDirty ? '<button class="button secondary" data-tb-act="reload">되돌리기</button>' : ''}</div>`;
 }
 // QSP 이벤트 대사: 게임 qsp에서 이름·장면 태그로 줄을 찾아 고치고, mods 선언형 JSON 초안으로 내보낸다(qsp는 직접 쓰지 않음)
 function qspDefaults() {
  const d = data(), today = new Date().toISOString().slice(0, 10);
  if (!st.qq) st.qq = [d.seed_name, d.scene_tag].filter(Boolean).join('|');
  if (!st.qid) st.qid = `${today}_${(st.ch.jsonFile.replace(/\.json$/i, '').replace(/^\d+_?/, '') || 'char' + st.ch.id).toLowerCase().replace(/[^a-z0-9_]/g, '_')}_lines`;
 }
 function qsp() {
  qspDefaults();
  const n = Object.keys(st.qedits).length, groups = {};
  for (const h of st.qhits?.hits ?? []) (groups[h.location] ??= []).push(h);
  return `${isMaster ? `<p class="fine-print">마스터 선택 연결 코드: <code>hero_choice = ${st.ch.id} &amp; gt 'hero_description'</code> · 기존 시작 메뉴: hero_customization_${st.ch.gender==='female'?'woman':'man'}</p>` : ''}<p class="fine-print">이 이벤트 탭에서는 게임 jack.qsp를 직접 고치지 않습니다. 고친 줄은 <code>mods/</code> 선언형 JSON 초안으로 내보내고, <code>tools\\apply_mods.ps1</code>로 적용합니다. 줄바꿈은 &lt;br&gt;, 문장 안 작은따옴표는 ''로 씁니다.</p>
   <div class="st-row"><input data-qs="q" value="${e(st.qq)}" placeholder="찾을 글자(여러 개는 | 로 구분)"><button class="button secondary" data-qs-act="search">찾기</button></div>
   ${st.qhits ? `<p class="fine-print">${st.qhits.total}줄 찾음${st.qhits.total > st.qhits.hits.length ? ` (앞 ${st.qhits.hits.length}줄만 표시)` : ''} · qsp SHA-256 ${e(st.qhits.sha256.slice(0, 12))}…</p>
    ${Object.entries(groups).map(([loc, hs]) => `<details class="qs-loc" ${hs.some(h => st.qedits[loc + '|' + h.line] !== undefined) ? 'open' : ''}><summary><code>${e(loc)}</code> · ${hs.length}줄</summary>${hs.map(h => { const k = loc + '|' + h.line, v = st.qedits[k] ?? h.text; return `<label class="qs-line ${st.qedits[k] !== undefined ? 'changed' : ''}"><small>${h.line + 1}줄</small><textarea data-qs-line="${e(k)}" rows="${Math.min(6, Math.ceil(v.length / 110) || 1)}">${e(v)}</textarea></label>`; }).join('')}</details>`).join('')}` : ''}
   <div class="section-label">mods 초안 ${n ? `<span class="badge">고친 줄 ${n}</span>` : ''}</div>
   <div class="cv-form"><label>mod ID<input data-qs="id" value="${e(st.qid)}"></label><label>설명<input data-qs="desc" value="${e(st.qdesc)}" placeholder="무엇을 왜 고쳤는지"></label></div>
   <div class="st-row"><button class="button secondary" data-qs-act="build" ${n ? '' : 'disabled'}>초안 만들기·검사</button>${st.qmod ? `<button class="button secondary" data-qs-act="download">JSON 내려받기</button><button class="button" data-qs-act="save-repo">repo mods/에 저장</button>` : ''}${n ? '<button class="button secondary" data-qs-act="clear">고친 줄 모두 버리기</button>' : ''}</div>
   ${st.qmod ? `<div class="st-preview"><b>${e(st.qmod.mod.id)}</b> · 수정 ${st.qmod.mod.edits.length}곳 · 적용 전 ${e(st.qmod.mod.before_sha256.slice(0, 12))}… → 적용 후 ${e(st.qmod.mod.after_sha256.slice(0, 12))}…${st.qmod.warnings.map(w => `<p class="warning">${e(w)}</p>`).join('')}${st.qmod.saved ? `<p>저장함: <code>${e(st.qmod.saved)}</code></p>` : ''}<pre class="st-json">${e(JSON.stringify(st.qmod.mod, null, 1))}</pre></div>` : ''}`;
 }
 function json() {
  if (isMaster) return `<div class="section-label">QSP 원본 · ${e(st.ch.jsonFile)}</div><pre class="st-json">${e(st.ch.nativeSource)}</pre><div class="section-label">편집용 보관 데이터 · ${e(st.ch.profilePath)}</div><pre class="st-json">${e(JSON.stringify({data:pendingData(),master:masterData()},null,2))}</pre>`;
  const preview = {...data()};
  for (const k of st.edits.unset) delete preview[k];
  Object.assign(preview, st.edits.set);
  return `<p class="fine-print">읽기 전용 미리보기입니다(저장 전 변경 포함, 배경 이야기 변경은 저장 때 반영).</p><pre class="st-json">${e(JSON.stringify(preview, null, 2))}</pre>`;
 }

 // ---------------------------------------------------------------- 입력
 root.addEventListener('input', ev => {
  if(ev.target.matches('[data-st-simulation]')){const t=ev.target,k=t.dataset.stSimulation;if(t.tagName==='SELECT')return;const valid=t.value===''||Number.isSafeInteger(Number(t.value));t.setCustomValidity(valid?'':'정수를 입력하세요.');if(!valid)return;if(t.value==='')setSimulation(k,undefined);else setSimulation(k,Number(t.value));refreshGameField(t);return;}
  if(ev.target.matches('[data-st-set],[data-st-initial],[data-st-master-stat]'))refreshGameField(ev.target);
  const t = ev.target;
  if(t.hasAttribute('data-initial-filter')){
   const q=t.value.trim().toLowerCase();
   for(const group of root.querySelectorAll('[data-initial-group]')){
    let count=0;for(const row of group.querySelectorAll('[data-initial-row]')){row.hidden=!row.dataset.initialRow.includes(q);if(!row.hidden)count++;}
    group.hidden=!count;
    if(q){if(!Object.hasOwn(group.dataset,'wasOpen'))group.dataset.wasOpen=String(group.open);group.open=true;}
    else if(Object.hasOwn(group.dataset,'wasOpen')){group.open=group.dataset.wasOpen==='true';delete group.dataset.wasOpen;}
   }return;
  }
  if(t.hasAttribute('data-st-initial')){
   if(t.type==='number'&&(t.value===''||!Number.isSafeInteger(Number(t.value)))){t.setCustomValidity('정수를 입력하세요. 자동값으로 돌아가려면 표 지정 해제를 누르세요.');return;}
   t.setCustomValidity('');st.edits.initials[t.dataset.stInitial]=t.type==='number'?Number(t.value):t.value;
   const row=t.closest('[data-initial-row]');row?.classList.add('changed');if(row){row.querySelector('[data-initial-state]').textContent='변경 예정';const reset=row.querySelector('[data-initial-reset]');reset.disabled=false;reset.hidden=false;}
   st.preview=null;updateHead();return;
  }
  if (t.dataset.stMaster) {
   setMaster(t.dataset.stMaster,t.value);
   if(t.dataset.stMaster==='statsCode'){const cm=root.querySelector('[data-st-master-cm]');if(cm)cm.value=cmValue(t.value,st.ch.nativeDefaults);}
   if(t.dataset.stMaster==='statsCode') for(const row of nativeRows(t.value)){const input=root.querySelector(`[data-st-master-stat="${row.key}"]`);if(input)input.value=row.value;}
   return;
  }
  if(t.hasAttribute('data-st-master-cm')){
   if(t.value===''){t.setCustomValidity('CM을 입력하세요. 공통값으로 돌아가려면 CM 표 지정 해제를 누르세요.');return;}
   if(st.ch.initialCatalog){
    try{Object.assign(st.edits.initials,cmInitialChanges(Number(t.value)));t.setCustomValidity('');const reset=root.querySelector('[data-initial-reset-cm]');if(reset)reset.disabled=false;st.preview=null;updateHead();}
    catch(error){t.setCustomValidity(error.message);t.reportValidity();}return;
   }
   try{setMaster('statsCode',patchCm(masterData().statsCode,Number(t.value)));const raw=root.querySelector('[data-st-master="statsCode"]');if(raw)raw.value=masterData().statsCode;}
   catch(error){api.toast(error.message);t.value=cmValue(masterData().statsCode,st.ch.nativeDefaults);}return;
  }
  if (t.dataset.stMasterStat) {
   if(t.value==='' || !Number.isInteger(Number(t.value)))return;
   try{setMaster('statsCode',patchNativeStat(masterData().statsCode,t.dataset.stMasterStat,Number(t.value)));const raw=root.querySelector('[data-st-master="statsCode"]');if(raw)raw.value=masterData().statsCode;}catch(error){api.toast(error.message);}return;
  }
  if (t.dataset.roleCopy || t.dataset.roleMap) {
   if(t.dataset.roleCopy)st.roleCopy[t.dataset.roleCopy]=t.value;
   else if(t.value!==''&&Number.isInteger(Number(t.value)))st.roleCopy.overrides[t.dataset.roleMap]=Number(t.value);
   st.roleCopy.result=null;const save=root.querySelector('[data-role-copy-act="save"]');if(save)save.disabled=true;return;
  }
  if (t.dataset.st === 'q') { st.q = t.value; st.page = 0; const pos = t.selectionStart; render(); const box = root.querySelector('[data-st="q"]'); box.focus(); box.setSelectionRange(pos, pos); }
  if (t.dataset.stSet && t.tagName !== 'SELECT') {
   // 입력하는 즉시 변경으로 잡는다(칸을 벗어나지 않고 바로 저장해도 반영되게)
   const key = t.dataset.stSet;
   if (t.value === '') unsetVal(key);
   else if (t.dataset.type === 'int') { const v = Number(t.value); if (!Number.isFinite(v) || !Number.isInteger(v)) return; setVal(key, v); }
   else setVal(key, t.value);
   st.preview = null; updateHead(); t.closest('.st-stat')?.classList.toggle('changed', key in st.edits.set || st.edits.unset.has(key)); return;
  }
  if (t.dataset.nw && t.type !== 'checkbox' && t.tagName !== 'SELECT') { st.nw[t.dataset.nw] = t.value; return; }
  if (t.dataset.nwStory) { st.nw.story[t.dataset.nwStory] = t.value; return; }
  if (t.dataset.dg && t.type !== 'radio') { st.danger[t.dataset.dg] = t.value; return; }
  if (t.dataset.qs) { st['q' + {q: 'q', id: 'id', desc: 'desc'}[t.dataset.qs]] = t.value; return; }
  if (t.dataset.qsLine) { const [loc, line] = [t.dataset.qsLine.slice(0, t.dataset.qsLine.lastIndexOf('|')), Number(t.dataset.qsLine.split('|').pop())], h = st.qhits.hits.find(x => x.location === loc && x.line === line); if (t.value === h.text) delete st.qedits[t.dataset.qsLine]; else st.qedits[t.dataset.qsLine] = t.value; st.qmod = null; t.closest('label').classList.toggle('changed', t.value !== h.text); const bb = root.querySelector('[data-qs-act="build"]'); if (bb) bb.disabled = !Object.keys(st.qedits).length; return; }
  if (t.dataset.tbLine) { st.book.lines[t.dataset.tbLine] = t.value; markBook(); return; }
  if (t.matches('[data-tb-notes]')) { st.book.notes = t.value; markBook(); return; }
  if (t.dataset.stStory) {
   const k = t.dataset.stStory, field = st.ch.storyFields.find(f => f[0] === k)[1];
   if (t.value.trim() === toDisplay(data()[field])) delete st.edits.story[k]; else st.edits.story[k] = t.value;
   updateHead();
  }
 });
 root.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.st === 'unique-only') {
   st.uniqueOnly = t.checked;
   st.page = 0;
   const libraryPanel = root.querySelector('.st-lib');
   libraryPanel.innerHTML = library();
   libraryPanel.querySelector('[data-st="unique-only"]').focus();
   return;
  }
  if (t.hasAttribute('data-st-share-peer')) { const state = sharingState(); if (!state || state.busy) return; if (t.checked) state.selected.add(t.dataset.stSharePeer); else state.selected.delete(t.dataset.stSharePeer); state.plan = null; state.error = ''; return render(); }
  if(t.matches('[data-st-simulation]')){if(t.tagName==='SELECT'){setSimulation(t.dataset.stSimulation,t.value||undefined);render();}return;}
  if(t.dataset.roleInclude){st.roleCopy.include[t.dataset.roleInclude]=t.checked;st.roleCopy.result=null;return render();}
  if(t.dataset.roleCopy){st.roleCopy[t.dataset.roleCopy]=t.value;st.roleCopy.result=null;return render();}
  if (t.dataset.nw) { st.nw[t.dataset.nw] = t.type === 'checkbox' ? t.checked : t.value; if (t.type === 'checkbox' || t.tagName === 'SELECT') setTimeout(render); return; }
  if (t.dataset.dg === 'mode') { st.danger.mode = t.value; return; }
  if (t.dataset.tbRef) return setRef(t.dataset.tbRef, t.value);
  if (t.dataset.tbBig) { const k = t.dataset.tbBig; return setBg(k, {[k + 'Group']: t.value || undefined, [k]: undefined}); }
  if (t.dataset.tbBg) { const k = t.dataset.tbBg; return setBg(k, {[k]: t.value || undefined}); }
  if (!t.dataset.stSet) return;
  const key = t.dataset.stSet;
  if (t.value === '') unsetVal(key);
  else if (t.dataset.type === 'int') { const v = Math.trunc(Number(t.value)); if (!Number.isFinite(v)) return api.toast('정수를 넣으세요.'); setVal(key, v); }
  else setVal(key, t.value);
  // 글 입력칸은 다시 그리지 않는다(다음 칸으로 옮긴 포커스·입력을 잃지 않게). 선택 상자만 다시 그린다
  if (t.tagName === 'SELECT') setTimeout(render); else { updateHead(); t.closest('.st-stat')?.classList.toggle('changed', key in st.edits.set || st.edits.unset.has(key)); }
 });
 root.addEventListener('click', async ev => {
  const t = ev.target.closest('button');
  if (!t) return;
  if (t.dataset.stShareAct) return changeSharing(t.dataset.stShareAct);
  if(t.dataset.simUnset){setSimulation(t.dataset.simUnset,undefined);return render();}
  if(t.hasAttribute('data-initial-reset')){
   st.edits.initials[t.dataset.initialReset]=null;st.preview=null;return render();
  }
  if(t.hasAttribute('data-initial-reset-cm')){Object.assign(st.edits.initials,{jo9_cruel_mercy:null,jo9_cruel_mercy_half:null});st.preview=null;return render();}
  if(t.dataset.roleGender!==undefined){st.gender=t.dataset.roleGender;st.page=0;return render();}
  if(t.dataset.roleBackground){st.bgMode=t.dataset.roleBackground;return render();}
  if(t.dataset.roleCopyAct){
   const action=t.dataset.roleCopyAct;
   if(action==='close'){st.roleCopy=null;return render();}
   if(action==='open'){
    if(dirtyCount()||lookEd.dirty()||st.bookDirty)return api.toast('변경 내용을 저장한 뒤 복제하세요.');
    const rows=st.ch.mappings||[];
    st.roleCopy={targetRole:isMaster?'slave':'master',name:(isMaster?st.ch.master.name:data().seed_name)+' 복제',slug:'',newId:'',gender:isMaster?st.ch.gender:'female',include:{appearance:true,background:true,stats:true,talk:true},rows,overrides:Object.fromEntries(rows.filter(r=>Number.isInteger(r.value)).map(r=>[r.target,r.value])),result:null};return render();
   }
   if(dirtyCount()||lookEd.dirty()||st.bookDirty)return api.toast('변경 내용을 저장한 뒤 복제하세요.');
   const body={...cloneBody(st.roleCopy,st.ch.revision),dryRun:action==='preview'};
   try{const r=await baseCall(`/api/role/${role}/${st.ch.id}/clone`,body);if(action==='preview'){st.roleCopy.result=r;return render();}st.roleCopy=null;api.toast(`새 ${r.role==='master'?'마스터':'노예'} ${r.id}로 복제했습니다.`);render();window.dispatchEvent(new CustomEvent('jo9:role-open',{detail:{role:r.role,id:r.id}}));}catch(error){api.toast(error.message);}return;
  }
  if (t.dataset.stOpen) return open(Number(t.dataset.stOpen));
  if (t.dataset.stPage) { st.page = Math.max(0, st.page + Number(t.dataset.stPage)); return render(); }
  if (t.dataset.stTab) { st.tab = t.dataset.stTab; return render(); }
  if (t.dataset.stUnset) { unsetVal(t.dataset.stUnset); return render(); }
  if (t.dataset.stAdd) { setVal(t.dataset.stAdd, 0); return render(); }
  if (t.dataset.stTraitOff) { unsetVal('seed_' + t.dataset.stTraitOff); return render(); }
  if (t.dataset.tbStep) { const id = t.dataset.tbStep, pool = questionPool(id); if(!pool.length)return;const i = pool.indexOf(st.book.refs?.[id]?.key); return setRef(id, pool[(i + Number(t.dataset.d) + pool.length) % pool.length]); }
  if (t.dataset.tbUseRef) {
   const id=t.dataset.tbUseRef, text=REFS.rows[st.book.refs?.[id]?.key]?.t;
   if (typeof text==='string'&&text.trim()) {st.book.lines[id]=text;markBook();return render();}
  }
  if (t.dataset.tbClear) { const k = t.dataset.tbClear; return setBg(k, {[k]: undefined, [k + 'Group']: undefined}); }
  if (t.dataset.tbDel) { delete st.book.lines[t.dataset.tbDel]; st.bookDirty = true; return render(); }
  const qa = t.dataset.qsAct;
  if (qa === 'search') return call('/api/qsp/search?q=' + encodeURIComponent(st.qq)).then(r => { st.qhits = r; render(); }).catch(error => api.toast(error.message));
  if (qa === 'clear') { st.qedits = {}; st.qmod = null; return render(); }
  if (qa === 'build' || qa === 'save-repo') {
   const edits = Object.entries(st.qedits).map(([k, v]) => ({location: k.slice(0, k.lastIndexOf('|')), line: Number(k.split('|').pop()), new: v}));
   return call('/api/qsp/mod', {id: st.qid.trim(), description: st.qdesc, edits, saveToRepo: qa === 'save-repo'}).then(r => { st.qmod = r; if (r.saved) api.toast('repo에 저장했습니다: ' + r.saved); render(); }).catch(error => api.toast(error.message));
  }
  if (qa === 'download') { const a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(st.qmod.mod, null, 1)], {type: 'application/json'})); a.href = url; a.download = st.qmod.mod.id + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); return; }
  const tb = t.dataset.tbAct;
  if (tb === 'add-line') { const k = root.querySelector('[data-tb-newslot]').value.trim(); if (!/^[A-Za-z0-9_.:|-]{1,60}$/.test(k)) return api.toast('칸 ID는 영문·숫자·밑줄로 쓰세요.'); if (!(k in st.book.lines)) st.book.lines[k] = ''; st.bookDirty = true; return render(); }
  if (tb === 'save') return saveTalk();
  if (tb === 'apply-background') return saveTalk(true);
  if (tb === 'reload') return loadTalk().then(render);
  if (tb === 'to-sim') return sendToSim(true);
  if (tb === 'from-sim') {
   const x = api.charView.exportTalk();
   if (x.id !== String(isMaster ? 'master:' + st.ch.id : st.ch.id)) return api.toast(`시뮬레이터에 열린 캐릭터(${x.name || '이름 없음'}, ${x.id || '번호 없음'})가 이 캐릭터가 아닙니다. 먼저 '시뮬레이터에서 열기'를 누르세요.`);
   Object.assign(st.book, {background: {...st.book.background, ...x.background}, seed: x.seed, acq: x.acq, overrides: x.overrides, lines: {...st.book.lines, ...x.lines}});
   if (Object.hasOwn(x,'history')) Object.assign(st.book,{facts:x.facts,history:x.history,refs:x.refs});
   st.bookDirty = true; api.toast(`시뮬레이터 결과를 담았습니다 · 대사 ${Object.keys(x.lines).length}칸`); return render();
  }
  const dg = t.dataset.dgAct;
  if (dg === 'close') { st.danger = null; return render(); }
  if (dg === 'clone-dry' || dg === 'clone') {
   const d = st.danger;
   return call(`/api/char/${st.ch.id}/clone`, {name: d.name, slug: d.slug, newId: d.newId, dryRun: dg === 'clone-dry'}).then(async r => {
    if (dg === 'clone-dry') { d.result = r; return render(); }
    api.toast(`ID ${r.id}(${r.json})로 복제했습니다.`); st.danger = null; await loadList(); return open(r.id, true);
   }).catch(error => api.toast(error.message));
  }
  if (dg === 'delete') {
   const d = st.danger;
   if (String(d.confirm).trim() !== String(d.plan.id)) return api.toast('확인 번호를 정확히 입력하세요.');
   return call(`/api/char/${st.ch.id}/delete`, {mode: d.mode, confirm: d.plan.id}).then(async () => {
    api.toast(`ID ${d.plan.id}을(를) 삭제했습니다.`); st.danger = null; st.ch = null; st.sel = null; st.edits = blank(); lookEd.reset(null); await loadList(); render();
   }).catch(error => api.toast(error.message));
  }
  const act = t.dataset.stAct;
  if (act === 'set-root') return call('/api/game', {root: root.querySelector('[data-st="root"]').value}).then(g => { st.game = g; return loadList(); }).then(render).catch(error => api.toast(error.message));
  if (act === 'new') { if ((dirtyCount() || lookEd.dirty() || sharingChanged()) && !window.confirm('저장하지 않은 변경을 버리고 새 캐릭터를 만들까요?')) return; return startNew(); }
  if (act === 'cancel-new') { st.ch = null; lookEd.reset(null); return render(); }
  if (act === 'clone') { st.danger = {kind: 'clone', name: (st.ch.data.seed_name || '') + ' 복제', slug: '', newId: '', result: null}; return render(); }
  if (act === 'delete') return call(`/api/char/${st.ch.id}/delete-plan`).then(plan => { st.danger = {kind: 'delete', plan, mode: 'safe', confirm: ''}; render(); }).catch(error => api.toast(error.message));
  if (act === 'preview') return preview();
  if (act === 'save') return saveNow();
  if (act === 'to-sim') return sendToSim(true);
  if (act === 'cancel-preview') { st.preview = null; return render(); }
  if (act === 'discard') { st.edits = blank(); st.preview = null; return render(); }
  if (act === 'trait-add') {
   const name = root.querySelector('[data-st="trait"]').value.trim(), tr = findTraitByName(traitRows,name);
   if (!tr) return api.toast('그런 특성이 없거나 게임 JSON으로 정할 수 없는 특성입니다: ' + name);
   setVal('seed_' + tr.binding.key, tr.binding.setValue); return render();
  }
  if (act === 'key-add') {
   const key = root.querySelector('[data-st="addkey"]').value.trim();
   if (!key.startsWith('seed_') || !seedKeys.includes(key.slice(5))) return api.toast('게임이 읽는 seed 키가 아닙니다: ' + key);
   if (val(key) === undefined) setVal(key, 0); return render();
  }
 });
 function markBook() { if (!st.bookDirty) { st.bookDirty = true; const s = root.querySelector('[data-tb-act="save"]'); if (s) s.disabled = false; } }
 function updateHead() {
  // 버튼을 다시 만들지 않고 상태만 바꾼다(입력칸에서 바로 저장 버튼을 누를 때 클릭이 사라지지 않게)
  const n = dirtyCount(), badge = root.querySelector('[data-st-badge]');
  if (badge) { badge.hidden = !n; badge.textContent = '저장 안 한 변경 ' + n; }
  const discard = root.querySelector('.st-save [data-st-act="discard"]'); if (discard) discard.hidden = !n;
  for (const b of root.querySelectorAll('.st-save [data-st-act="preview"], .st-save [data-st-act="save"]')) b.disabled = !n;
 }
 root.addEventListener('change',event=>{if(!isMaster&&st.tab==='stats'&&event.target.matches('[data-st-set],[data-st-simulation]')){sendToSim(false);render();}});
 lookEd.bind(root, () => render());
 window.addEventListener('beforeunload', ev => { if (dirtyCount() || lookEd.dirty() || st.bookDirty || st.bgUnsaved || st.talkPending || sharingChanged()) { ev.preventDefault(); ev.returnValue = ''; } });

 render();
 loadGame();
 window.addEventListener('jo9:role-open',async event=>{if(event.detail.role!==role)return;await loadList();api.switchTab(id);await open(event.detail.id);});
 window.addEventListener('jo9:questionnaire-change',()=>{if(st.tab==='talk'&&st.book)render();});
 return {reload: loadGame};
}
