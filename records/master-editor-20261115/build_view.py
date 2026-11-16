from pathlib import Path
L=Path(__file__).parent
p=Path('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab/dist/studio-view.mjs')
s=p.read_text('utf-8-sig')
def rep(a,b):
 global s
 assert s.count(a)==1,(a[:110],s.count(a));s=s.replace(a,b)
rep("import {describeCharacterField}","import {roleUrl, masterSettings, masterStats, patchNativeStat, nativeRows, cloneBody, cloneForm} from './studio-role.mjs';\nimport {describeCharacterField}")
rep('async function call(url, body)', 'async function baseCall(url, body)')
rep('export async function createStudioView(api) {', '''export async function createStudioView(api, options = {}) {
 const role = options.role || 'slave', isMaster = role === 'master';
 if (!isMaster) globalThis.__jo9StudioApi = api;
 const call = (url, body) => baseCall(roleUrl(role, url), body);''')
rep(" const id = 'studio';", " const id = isMaster ? 'master-studio' : 'studio';")
rep("api.tabNames[id] = ['キャ", "") if "api.tabNames[id] = ['キャ" in s else None
rep(" api.tabNames[id] = ['캐릭터 편집', '통합 캐릭터 편집기', '게임 폴더의 캐릭터를 골라 외형·배경 이야기·설정·능력치·특성을 한 화면에서 고치세요.'];", " api.tabNames[id] = [isMaster ? '마스터 편집' : '노예 편집', isMaster ? '마스터 편집' : '통합 캐릭터 편집기', isMaster ? '남주인공과 여주인공의 시작 설정을 편집하거나 다른 역할로 복제합니다.' : '게임 폴더의 캐릭터를 골라 외형·배경 이야기·설정·능력치·특성을 한 화면에서 고치세요.'];")
rep('st = {game: null,', "st = {bgMode: role, gender: '', roleCopy: null, game: null,")
rep('return {set: {}, unset: new Set(), story: {}};', 'return {set: {}, unset: new Set(), story: {}, master: null};')
rep('Object.keys(st.edits.story).length;', 'Object.keys(st.edits.story).length + (st.edits.master ? 1 : 0);')
rep(" if (!api.charView || !st.ch || st.ch.id === 'new' || !st.book) return;", " if (!api.charView || !st.ch || st.ch.id === 'new' || !st.book || (isMaster && !go)) return;")
rep('id: st.ch.id});', "id: isMaster ? 'master:' + st.ch.id : st.ch.id});")
rep("if (x.id !== String(st.ch.id))", "if (x.id !== String(isMaster ? 'master:' + st.ch.id : st.ch.id))")
rep('const body = {set: st.edits.set, unset: [...st.edits.unset], story: st.edits.story, dryRun: true};', 'const body = {set: st.edits.set, unset: [...st.edits.unset], story: st.edits.story, master: st.edits.master, revision: st.ch.revision, dryRun: true};')
rep('const body = {set: st.edits.set, unset: [...st.edits.unset], story: st.edits.story};', 'const body = {set: st.edits.set, unset: [...st.edits.unset], story: st.edits.story, master: st.edits.master, revision: st.ch.revision};')
rep('st.sel = sid; st.danger = null;', 'st.sel = sid; st.danger = null; st.roleCopy = null;')
rep("st.talk = await call('/api/talkbook/' + st.sel, {book});", "st.talk = await call('/api/talkbook/' + st.sel, {book, revision: st.ch.revision}); if(st.talk.revision)st.ch.revision=st.talk.revision;")
rep("extra: () => st.ch?.id === 'new' ? newBody() : {},", "extra: () => st.ch?.id === 'new' ? newBody() : {revision: st.ch?.revision},")
rep('item.name = st.ch.data.seed_name ?? item.name;', 'item.name = (isMaster ? st.ch.master.name : st.ch.data.seed_name) ?? item.name;')
rep('const list = st.items.filter(x => !q || String(x.id).includes(q) || (x.name || \'\').toLowerCase().includes(q) || (x.base || \'\').toLowerCase().includes(q));', "const list = st.items.filter(x => (!isMaster || !st.gender || x.gender === st.gender) && (!q || String(x.id).includes(q) || (x.name || '').toLowerCase().includes(q) || (x.base || '').toLowerCase().includes(q) || (x.jsonFile || '').toLowerCase().includes(q)));")
rep('return `<div class="st-lib-head"><button', '''return `<div class="st-lib-head">${isMaster ? `<div class="st-row">${[['','전체'],['male','남주인공'],['female','여주인공']].map(([k,l]) => `<button class="button secondary small ${st.gender===k?'primary':''}" data-role-gender="${k}">${l}</button>`).join('')}</div><p class="fine-print">새 마스터는 인물의 복제 메뉴에서 만듭니다.</p>` : ''}<button''')
rep('${st.choices ? \'\' : \'disabled title="먼저 캐릭터 하나를 열어 선택지를 읽으세요"\'}>+ 새 캐릭터', '${isMaster ? \'hidden\' : st.choices ? \'\' : \'disabled title="먼저 캐릭터 하나를 열어 선택지를 읽으세요"\'}>+ 새 캐릭터')
rep('class="st-item ${x.id', 'class="st-item ${x.id') if False else None
rep('${e(c.data.seed_name || \'(이름 없음)\')}', "${e((isMaster ? c.master?.name : c.data.seed_name) || '(이름 없음)')}")
rep('<small>ID ${c.id}', '<small>${isMaster ? (c.gender===\'female\'?\'여주인공\':\'남주인공\') : \'노예\'} · ID ${c.id}')
rep('>편집값 저장</button>', ">${isMaster ? '마스터 원본 저장' : '편집값 저장'}</button>")
rep('<button class="button secondary" data-st-act="clone">복제…</button><button class="button secondary" data-st-act="delete">삭제…</button>', '''<button class="button secondary" data-role-copy-act="open">${isMaster ? '노예 캐릭터로 복제…' : '마스터로 복제…'}</button>${isMaster ? '' : '<button class="button secondary" data-st-act="clone">복제…</button><button class="button secondary" data-st-act="delete">삭제…</button>'}''')
rep("${st.preview ? previewBox() : ''}${st.danger ? dangerBox() : ''}", "${isMaster ? `<p class=\"fine-print\">시작 프리셋 · ${c.menuLinked ? '게임 시작 메뉴 연결됨' : '게임 시작 메뉴 미연결 · QSP 이벤트에서 연결'}</p>` : ''}${st.preview ? previewBox() : ''}${st.danger ? dangerBox() : ''}${st.roleCopy ? cloneForm(st.roleCopy) : ''}")
rep('${TABS.map(([k, l]) =>', "${TABS.map(([k, l]) =>") if False else None
rep('${l}</button>`).join(\'\')}</div>\n   <div class="card-body">', "${k==='json' && isMaster ? '원본 데이터' : l}</button>`).join('')}</div>\n   <div class=\"card-body\">")
rep('>게임 파일에 저장</button>', ">${isMaster ? '마스터 원본 저장' : '게임 파일에 저장'}</button>")
rep('처음 저장할 때 같은 폴더에 .bak 백업을 남깁니다.', "${isMaster ? 'QSP 원본 1회 백업과 변경 mods 기록을 남깁니다.' : '처음 저장할 때 같은 폴더에 .bak 백업을 남깁니다.'}")
rep('return `${lookEd.html()}', "return `${isMaster ? '<p class=\"fine-print\">편집용 외형입니다. 게임의 기존 마스터 초상 파일은 덮어쓰지 않습니다. 노예로 복제할 때 사용할 수 있습니다.</p>' : ''}${lookEd.html()}")
rep(' function setting() {', ''' const masterData = () => st.edits.master || st.ch?.master || {name: data().seed_name || '', description:'', difficulty:'', statsCode:'', portrait:'', sepia:''};
 function setMaster(key, value) {
  const m = {...masterData(), [key]: value};
  st.edits.master = JSON.stringify(m) === JSON.stringify(st.ch.master) ? null : m;
  st.preview = null; updateHead();
 }
 function setting() {
  return `<div class="st-tabs">${[['slave','노예용 설정'],['master','마스터용 설정']].map(([k,l])=>`<button data-role-background="${k}" class="${st.bgMode===k?'on':''}">${l}</button>`).join('')}</div>${st.bgMode==='master' ? masterSettings(masterData(),role) : (isMaster ? '<p class="fine-print">마스터의 노예 전환용 설정입니다. 게임의 마스터 시작 능력치와 별도로 보관합니다.</p>' : '') + slaveSetting()}`;
 }
 function slaveSetting() {''')
rep(' function stats() {', ''' function stats() {
  const native = masterStats(masterData(),role), seeds = slaveStats();
  return isMaster ? native + '<details><summary>노예 전환용 능력치·특성</summary>' + seeds + '</details>' : seeds + '<details><summary>마스터 전환용 능력치</summary>' + native + '</details>';
 }
 function slaveStats() {''')
rep('  qspDefaults();\n  const n =', '  qspDefaults();\n  const n =') if False else None
rep('return `<p class="fine-print">게임 jack.qsp는 직접 고치지 않습니다.', '''return `${isMaster ? `<p class="fine-print">마스터 선택 연결 코드: <code>hero_choice = ${st.ch.id} &amp; gt 'hero_description'</code> · 기존 시작 메뉴: hero_customization_${st.ch.gender==='female'?'woman':'man'}</p>` : ''}<p class="fine-print">이 이벤트 탭에서는 게임 jack.qsp를 직접 고치지 않습니다.''')
rep(' function json() {\n  const preview =', ''' function json() {
  if (isMaster) return `<div class="section-label">QSP 원본 · ${e(st.ch.jsonFile)}</div><pre class="st-json">${e(st.ch.nativeSource)}</pre><div class="section-label">편집용 보관 데이터 · ${e(st.ch.profilePath)}</div><pre class="st-json">${e(JSON.stringify({data:pendingData(),master:masterData()},null,2))}</pre>`;
  const preview =''')
rep("  const t = ev.target;\n  if (t.dataset.st === 'q')", '''  const t = ev.target;
  if (t.dataset.stMaster) {
   setMaster(t.dataset.stMaster,t.value);
   if(t.dataset.stMaster==='statsCode') for(const row of nativeRows(t.value)){const input=root.querySelector(`[data-st-master-stat="${row.key}"]`);if(input)input.value=row.value;}
   return;
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
  if (t.dataset.st === 'q')''')
rep("  const t = ev.target;\n  if (t.dataset.nw)", '''  const t = ev.target;
  if(t.dataset.roleInclude){st.roleCopy.include[t.dataset.roleInclude]=t.checked;st.roleCopy.result=null;return render();}
  if(t.dataset.roleCopy){st.roleCopy[t.dataset.roleCopy]=t.value;st.roleCopy.result=null;return render();}
  if (t.dataset.nw)''')
rep("  if (!t) return;\n  if (t.dataset.stOpen)", '''  if (!t) return;
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
  if (t.dataset.stOpen)''')
# This click listener needs await for the new copy workflow.
rep("root.addEventListener('click', ev => {", "root.addEventListener('click', async ev => {")
rep(' return {reload: loadGame};', ''' window.addEventListener('jo9:role-open',async event=>{if(event.detail.role!==role)return;await loadList();api.switchTab(id);await open(event.detail.id);});
 return {reload: loadGame};''')
(L/'studio-view.mjs').write_text(s,'utf-8',newline='\n')
print('UI override generated:',len(s))
