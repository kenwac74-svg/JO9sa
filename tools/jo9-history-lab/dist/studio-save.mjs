// 세이브 정비 탭: 업데이트로 어긋난 세이브 속 이미지 경로(캐릭터 전신·얼굴, 메뉴 아이콘 등)를 찾아 고친 새 세이브를 만든다(원본은 그대로)
import {esc as e} from './sim-data.mjs';

const KEY_LABEL = {FULLIMAGE: '전신', AVA_CLEAR: '얼굴', AVA_GRAY: '흑백', AVA: '세피아'};
const SLOT_LABEL = n => ({SLAVE: '데리고 있는 노예', ASSISTANT: '조수', PRISONER: '감방', SLAVE1: '계산용 임시 사본', SNK_PARKED_SLAVE: '개인실 대기'}[n] ?? (/^ROOM\d/.test(n) ? '방 ' + n.slice(4) : /^ICED_\d/.test(n) ? '동면관 ' + n.slice(5) : n));

async function call(url, body) {
 const r = await fetch(url, body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
 let d = null; try { d = await r.json(); } catch { /* 서버 없음 */ }
 if (!r.ok || !d) throw new Error(d?.error || '편집기 서버(start-history-lab.py)로 열어야 세이브를 다룰 수 있습니다.');
 return d;
}

export function createSaveView(api) {
 const id = 'save-fix';
 api.tabNames[id] = ['세이브 정비', '세이브 정비', '업데이트로 어긋난 세이브 속 이미지 경로를 찾아 고친 새 세이브를 만드세요. 원본 세이브는 바꾸지 않습니다.'];
 document.querySelector('.sidebar nav').insertAdjacentHTML('beforeend', `<button data-tab="${id}" class="nav-button"><span>⟲</span>세이브 정비</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin', `<section id="${id}" class="tab-panel sv" hidden></section>`);
 const root = document.getElementById(id);
 const st = {saves: null, path: '', scan: null, pick: {}, edit: {}, busy: false, out: null, showUi: false};
 const fixKey = f => f.key ? `${f.var}|${f.key}` : `${f.var}|${f.at}|${f.old}`;

 async function loadSaves() {
  try { st.saves = (await call('/api/saves')).items; } catch (error) { st.saves = []; api.toast(error.message); }
  render();
 }
 async function scan() {
  st.busy = true; st.out = null; render();
  try {
   st.scan = await call('/api/save/scan', {path: st.path});
   st.pick = {}; st.edit = {};
   // 캐릭터 이미지는 같은 번호의 JSON에서 찾은 제안만 기본 선택. 파일 이름만으로 찾은 제안(화면 이미지 포함)은 직접 확인하고 고르게 둔다
   for (const f of st.scan.fixes) if (f.new && f.how === '같은 번호의 캐릭터 JSON') st.pick[fixKey(f)] = true;
  } catch (error) { st.scan = null; api.toast(error.message); }
  st.busy = false; render();
 }
 async function fix() {
  const all = [...st.scan.fixes, ...st.scan.ui].filter(f => st.pick[fixKey(f)]).map(f => ({...f, new: st.edit[fixKey(f)] ?? f.new}));
  try { st.out = await call('/api/save/fix', {path: st.scan.path, fixes: all}); api.toast(`고친 새 세이브를 만들었습니다 · ${st.out.fixed}곳`); } catch (error) { api.toast(error.message); }
  render();
 }

 function fixRow(f) {
  const k = fixKey(f), v = st.edit[k] ?? f.new ?? '';
  return `<tr><td><input type="checkbox" data-sv-pick="${e(k)}" ${st.pick[k] ? 'checked' : ''} ${v ? '' : 'disabled'}></td><td>${e(f.key ? `${SLOT_LABEL(f.name)} · ${KEY_LABEL[f.key]}` : f.name)}</td><td><code>${e(f.old)}</code></td>
   <td><input data-sv-new="${e(k)}" value="${e(v)}" placeholder="고칠 경로(비우면 그대로)"><small class="fine-print">${e(f.how || (v ? '직접 입력' : '찾지 못함'))}</small></td></tr>`;
 }
 function render() {
  const s = st.scan, nPick = Object.values(st.pick).filter(Boolean).length;
  root.innerHTML = `<article class="card"><div class="card-head"><h2>세이브 고르기</h2></div><div class="card-body">
   <p class="fine-print">게임 폴더 안의 세이브를 고르거나 경로를 붙여 넣으세요. 원본은 바꾸지 않고, 고친 결과는 같은 폴더에 <code>이름_fixed_날짜.sav</code>로 새로 만듭니다.</p>
   <div class="st-row"><select data-sv="pick"><option value="">${st.saves === null ? '불러오는 중…' : `게임 폴더의 세이브 ${st.saves.length}개`}</option>${(st.saves ?? []).map(x => `<option value="${e(x.path)}" ${x.path === st.path ? 'selected' : ''}>${e(x.name)} · ${(x.size / 1048576).toFixed(1)}MB · ${new Date(x.mtime * 1000).toLocaleString('ko-KR')}</option>`).join('')}</select><button class="button secondary" data-sv-act="reload">목록 새로고침</button></div>
   <div class="st-row"><input data-sv="path" value="${e(st.path)}" placeholder="세이브 경로(.sav)"><button class="button" data-sv-act="scan" ${st.path && !st.busy ? '' : 'disabled'}>${st.busy ? '점검 중…' : '점검'}</button></div></div></article>
   ${s ? `<article class="card"><div class="card-head"><h2>캐릭터 이미지</h2><span class="badge muted">변수 ${s.vars.toLocaleString('ko-KR')}개</span></div><div class="card-body">
    <table class="cf-table"><thead><tr><th>칸</th><th>번호 · 이름</th>${Object.values(KEY_LABEL).map(l => `<th>${l}</th>`).join('')}</tr></thead><tbody>
    ${s.characters.map(c => `<tr><td>${e(SLOT_LABEL(c.name))}<br><small class="fine-print">${e(c.name)}</small></td><td>${c.temp ? '<small class="fine-print">임시 사본</small>' : `${c.id} · ${e(c.label)}${c.json ? '' : ' <span class="badge muted">JSON 없음</span>'}`}</td>
     ${Object.keys(KEY_LABEL).map(k => `<td class="sv-img">${c.status[k] ? (c.urls[k] ? `<img src="${e(c.urls[k])}" alt="">` : '정상') : '<span class="badge">깨짐</span>'}<small class="fine-print">${e(c.images[k] ?? '')}</small></td>`).join('')}</tr>`).join('')}</tbody></table>
    <div class="section-label">고칠 캐릭터 이미지 ${s.fixes.length}곳</div>
    ${s.fixes.length ? `<table class="cf-table sv-fix"><thead><tr><th></th><th>항목</th><th>세이브의 옛 경로</th><th>새 경로</th></tr></thead><tbody>${s.fixes.map(fixRow).join('')}</tbody></table>` : '<p class="fine-print">깨진 캐릭터 이미지가 없습니다.</p>'}
    <div class="section-label">그 밖의 화면 이미지(메뉴 아이콘 등) ${s.uiTotal}곳 깨짐 · 제안 있음 ${s.ui.filter(f => f.new).length}곳 <button class="text-button" data-sv-act="toggle-ui">${st.showUi ? '접기' : '펼치기'}</button></div>
    ${st.showUi ? `<table class="cf-table sv-fix"><thead><tr><th></th><th>변수</th><th>세이브의 옛 경로</th><th>새 경로</th></tr></thead><tbody>${s.ui.map(fixRow).join('')}</tbody></table>${s.uiTotal > s.ui.length ? `<p class="fine-print">앞 ${s.ui.length}곳만 표시</p>` : ''}` : ''}
    <div class="st-row lk-save"><span class="badge">고를 항목 ${nPick}곳</span><button class="button" data-sv-act="fix" ${nPick ? '' : 'disabled'}>고친 새 세이브 만들기</button></div>
    ${st.out ? `<p>만들었습니다: <code>${e(st.out.output)}</code> · ${st.out.fixed}곳. 게임에서 이 파일을 불러와 확인하세요.</p>` : ''}
   </div></article>` : ''}`;
 }

 root.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.sv === 'pick') { st.path = t.value; st.scan = null; return render(); }
  if (t.dataset.svPick) { st.pick[t.dataset.svPick] = t.checked; const b = root.querySelector('[data-sv-act="fix"]'), n = Object.values(st.pick).filter(Boolean).length; if (b) b.disabled = !n; const badge = root.querySelector('.lk-save .badge'); if (badge) badge.textContent = `고를 항목 ${n}곳`; }
 });
 root.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.sv === 'path') { st.path = t.value.trim(); const b = root.querySelector('[data-sv-act="scan"]'); if (b) b.disabled = !st.path; }
  if (t.dataset.svNew) { st.edit[t.dataset.svNew] = t.value.trim(); const cb = root.querySelector(`[data-sv-pick="${CSS.escape(t.dataset.svNew)}"]`); if (cb) { cb.disabled = !t.value.trim(); if (!t.value.trim()) { cb.checked = false; st.pick[t.dataset.svNew] = false; } } }
 });
 root.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  const a = b.dataset.svAct;
  if (a === 'reload') return loadSaves();
  if (a === 'scan') return scan();
  if (a === 'fix') return fix();
  if (a === 'toggle-ui') { st.showUi = !st.showUi; return render(); }
 });
 render();
 loadSaves();
}
