// 편집기 'DB' 탭: 인터뷰 대답을 주제·세계·분류·글자로 찾고, 원문과 바꿀 말 제안을 보며 세계별 각색 문장을 직접 쓴다
import {esc as e} from './sim-data.mjs';

async function call(url, body) {
 const r = await fetch(url, body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
 let d = null; try { d = await r.json(); } catch { /* 서버 없음 */ }
 if (!r.ok || !d) throw new Error(d?.error || '편집기 서버(start-history-lab.py)로 열어야 DB를 볼 수 있습니다.');
 return d;
}

export function createDbView(api) {
 const id = 'interview-db';
 api.tabNames[id] = ['DB', '인터뷰 DB', '블로그 인터뷰 대답을 찾아 보고, 세계별 각색 문장을 직접 쓰세요. 청소년기·수간 대답은 원문이 DB에 없습니다.'];
 document.querySelector('.sidebar nav').insertAdjacentHTML('beforeend', `<button data-tab="${id}" class="nav-button"><span>▤</span>DB</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin', `<section id="${id}" class="tab-panel dbv" hidden></section>`);
 const root = document.getElementById(id);
 const st = {xl: null, meta: null, f: {q: '', topic: '', world: '', grade: '', block: '', shown: '1', mine: ''}, res: null, offset: 0, sel: null, detail: null, err: ''};
 const LIMIT = 30;

 async function search() {
  const p = new URLSearchParams({...st.f, offset: st.offset, limit: LIMIT});
  try { st.res = await call('/api/interview/search?' + p); st.err = ''; } catch (error) { st.err = error.message; }
  renderList();
 }
 async function open(key) {
  st.sel = key;
  try { st.detail = await call('/api/interview/row/' + encodeURIComponent(key)); } catch (error) { api.toast(error.message); }
  renderList(); renderDetail();
 }
 async function saveAdapt(world, text) {
  try {
   const d = await call('/api/interview/adapt', {key: st.sel, world, text});
   st.detail.user = d.user; api.toast(text.trim() ? '각색 문장을 저장했습니다.' : '각색 문장을 지웠습니다.');
  } catch (error) { api.toast(error.message); }
  renderDetail();
 }

 function frame() {
  const m = st.meta, f = st.f;
  const opt = (v, cur, label) => `<option value="${e(v)}" ${v === cur ? 'selected' : ''}>${e(label)}</option>`;
  root.innerHTML = `<article class="card"><div class="card-head"><h2>찾기</h2><span class="st-row"><button class="button secondary small" data-db-xl="export">엑셀로 내보내기</button><label class="button secondary small import-label">엑셀 가져오기<input type="file" data-db-xl="file" accept=".xlsx" hidden></label></span><span class="badge muted">대답 ${m.rows.toLocaleString('ko-KR')}개 · 글 ${m.posts}편${m.hasPosts ? '' : ' · 글 DB 없음'}</span></div><div class="card-body">
   <div id="dbXl"></div>
   <div class="st-row"><input data-db="q" value="${e(f.q)}" placeholder="글자 또는 키(예: p0012.q07) 검색">
   <select data-db="topic">${opt('', f.topic, '주제 전체')}${Object.entries(m.topics).map(([n, t]) => opt(t, f.topic, `${n}. ${t}`)).join('')}</select>
   <select data-db="block">${opt('', f.block, '분류 전체')}${opt('none', f.block, '막힘 없음')}${Object.entries(m.blockCodes).map(([c, l]) => opt(c, f.block, `${c} ${l}`)).join('')}</select></div>
   <div class="st-row"><select data-db="world">${opt('', f.world, '세계 선택 안 함')}${m.worlds.map(w => opt(w, f.world, m.worldLabels[w])).join('')}</select>
   <select data-db="grade" ${f.world ? '' : 'disabled'}>${opt('', f.grade, '각색 등급 전체')}${Object.entries(m.grades).map(([g, l]) => opt(g.slice(-1), f.grade, `${g} ${l}`)).join('')}</select>
   <label class="tag"><input type="checkbox" data-db="shown" ${f.shown === '1' ? 'checked' : ''}> 표시 가능만</label>
   <label class="tag"><input type="checkbox" data-db="mine" ${f.mine === '1' ? 'checked' : ''}> 내가 쓴 각색만</label></div></div></article>
   <div class="sim-grid"><article class="card"><div class="card-head"><h2>목록</h2><span class="badge" id="dbCount"></span></div><div class="card-body" id="dbList"></div></article>
   <article class="card"><div class="card-head"><h2>원문과 각색</h2></div><div class="card-body" id="dbDetail"></div></article></div>`;
  renderList(); renderDetail(); renderXl();
 }
 function renderXl() {
  const box = root.querySelector('#dbXl'); if (!box) return;
  const x = st.xl; if (!x) { box.innerHTML = ''; return; }
  const c = x.res.count;
  box.innerHTML = `<div class="notice neutral"><div><strong>${x.res.applied ? '반영했습니다' : '가져오기 미리보기'}</strong> · 추가 ${c.add} · 수정 ${c.edit} · 지움 ${c.delete} · 반영 못 한 줄 ${x.res.problemTotal}
   ${x.res.problems.slice(0, 20).map(p => `<br><small>${p.row}줄 <code>${e(p.key)}</code> ${e(p.why)}</small>`).join('')}
   ${x.res.applied ? '' : `<div class="st-row"><button class="button primary small" data-db-xl="apply" ${c.add + c.edit + c.delete ? '' : 'disabled'}>문제 없는 변경만 반영</button><button class="button secondary small" data-db-xl="cancel">취소</button></div>`}</div></div>`;
 }
 async function xlImport(b64, apply) {
  try { st.xl = {b64, res: await call('/api/excel/import', {data: b64, apply})}; if (apply) { st.detail = null; search(); } } catch (error) { st.xl = null; api.toast(error.message); }
  renderXl();
 }
 function renderList() {
  const box = root.querySelector('#dbList'); if (!box) return;
  const r = st.res;
  root.querySelector('#dbCount').textContent = r ? `${r.total.toLocaleString('ko-KR')}개` : '';
  if (st.err) { box.innerHTML = `<p class="fine-print">${e(st.err)}</p>`; return; }
  if (!r) { box.innerHTML = '<p class="fine-print">불러오는 중…</p>'; return; }
  const last = Math.max(0, Math.ceil(r.total / LIMIT) - 1), page = Math.floor(r.offset / LIMIT);
  box.innerHTML = `<table class="cf-table"><tbody>${r.items.map(x => `<tr data-db-open="${e(x.id)}" style="cursor:pointer" ${x.id === st.sel ? 'class="total"' : ''}><td><code>${e(x.id)}</code>${x.hasUser ? ' <span class="badge green">각색</span>' : ''}<br><small class="fine-print">${e(x.topic)}${x.block.length ? ' · ' + e(x.block.join(',')) : ''}</small></td><td>${e(x.answer.length > 70 ? x.answer.slice(0, 70) + '…' : x.answer)}</td></tr>`).join('') || '<tr><td>맞는 대답이 없습니다.</td></tr>'}</tbody></table>
   <div class="st-row"><button class="button secondary small" data-db-page="${page - 1}" ${page <= 0 ? 'disabled' : ''}>이전</button><span class="fine-print">${page + 1} / ${last + 1}</span><button class="button secondary small" data-db-page="${page + 1}" ${page >= last ? 'disabled' : ''}>다음</button></div>`;
 }
 function renderDetail() {
  const box = root.querySelector('#dbDetail'); if (!box) return;
  const d = st.detail, m = st.meta;
  if (!d) { box.innerHTML = '<p class="fine-print">왼쪽 목록에서 대답을 고르세요.</p>'; return; }
  box.innerHTML = `<p><code>${e(d.id)}</code> · ${e(d.topic)} · ${e(d.title)} ${e(d.date)}${d.url ? ` · <a href="${e(d.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">원본 글</a>` : ''}</p>
   ${d.question ? `<div class="section-label">질문 ${d.q}</div><p class="fine-print">${e(d.question)}</p>` : ''}
   <div class="section-label">대답 원문</div><p style="white-space:pre-wrap">${e(d.answer)}</p>
   ${d.withheld ? '<p class="fine-print">이 대답은 원문을 DB에 싣지 않았습니다. 각색 문장은 직접 쓸 수 있습니다.</p>' : ''}
   ${d.modern.length ? `<p class="fine-print">현대 소재: ${e(d.modern.join(', '))}</p>` : ''}
   <div class="section-label">세계별 각색 문장</div>
   ${m.worlds.map((w, i) => {
    const s = d.suggest[w], grade = d.adapt[i] ?? '', u = d.user[w] ?? '';
    return `<div class="field full" style="margin-bottom:14px"><span><b>${e(m.worldLabels[w])}</b> <span class="badge muted">${e(grade === 'U' ? 'U 직접 각색' : 'A' + grade)}</span></span>
     ${s?.text && s.text !== d.answer ? `<small>제안(바꿀 말 적용): ${e(s.text)}</small>` : ''}${(s?.notes ?? []).map(n => `<small>다시 쓸 것 · ${e(n)}</small>`).join('')}
     <textarea data-db-text="${e(w)}" rows="2" placeholder="이 세계의 문장을 직접 쓰세요">${e(u)}</textarea>
     <div class="st-row"><button class="button secondary small" data-db-save="${e(w)}">저장</button>${u ? `<button class="button secondary small" data-db-clear="${e(w)}">지우기</button>` : ''}</div></div>`;
   }).join('')}`;
 }

 let timer = 0;
 root.addEventListener('input', ev => {
  const t = ev.target; if (t.dataset.db !== 'q') return;
  st.f.q = t.value; st.offset = 0; clearTimeout(timer); timer = setTimeout(search, 250);
 });
 root.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.dbXl === 'file') {
   const f = t.files[0]; if (!f) return;
   const rd = new FileReader(); rd.onload = () => xlImport(String(rd.result).split(',')[1], false); rd.readAsDataURL(f); t.value = ''; return;
  }
  const k = t.dataset.db; if (!k || k === 'q') return;
  st.f[k] = t.type === 'checkbox' ? (t.checked ? '1' : '') : t.value;
  if (k === 'world' && !t.value) st.f.grade = '';
  st.offset = 0; frame(); search();
 });
 root.addEventListener('click', ev => {
  const row = ev.target.closest('[data-db-open]'); if (row) return open(row.dataset.dbOpen);
  const b = ev.target.closest('button'); if (!b) return;
  if (b.dataset.dbXl === 'export') return call('/api/excel/export', {}).then(d => {
   const bin = atob(d.data), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
   const url = URL.createObjectURL(new Blob([buf], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   const a = document.createElement('a'); a.href = url; a.download = d.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); api.toast(`엑셀로 내보냈습니다 · ${d.rows}줄`);
  }).catch(error => api.toast(error.message));
  if (b.dataset.dbXl === 'apply') return xlImport(st.xl.b64, true);
  if (b.dataset.dbXl === 'cancel') { st.xl = null; return renderXl(); }
  if (b.dataset.dbPage) { st.offset = Number(b.dataset.dbPage) * LIMIT; return search(); }
  const w = b.dataset.dbSave ?? b.dataset.dbClear; if (!w) return;
  const ta = root.querySelector(`[data-db-text="${CSS.escape(w)}"]`);
  saveAdapt(w, b.dataset.dbClear ? '' : ta.value);
 });

 (async () => {
  try { st.meta = await call('/api/interview/meta'); frame(); await search(); } catch (error) { root.innerHTML = `<article class="card"><div class="card-body"><p class="fine-print">${e(error.message)}</p></div></article>`; }
 })();
}
