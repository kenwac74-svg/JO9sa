// 'AI 연결' 탭: Kindroid API 호출에 필요한 주소·헤더(키)·요청 본문·응답 경로를 사용자가 직접 입력하고 한 번 보내 본다
import {esc as e} from './sim-data.mjs';

async function call(url, body) {
 const r = await fetch(url, body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
 let d = null; try { d = await r.json(); } catch { /* 서버 없음 */ }
 if (!r.ok || !d) throw new Error(d?.error || '편집기 서버(start-history-lab.py)로 열어야 쓸 수 있습니다.');
 return d;
}

export function createAiView(api) {
 const id = 'ai-link';
 api.tabNames[id] = ['AI 연결', 'AI 연결', 'Kindroid API 호출 정보를 직접 입력하고 한 번 보내 보세요. 키는 이 PC의 git 제외 파일(ai.local.json)에만 저장됩니다.'];
 document.querySelector('.sidebar nav').insertAdjacentHTML('beforeend', `<button data-tab="${id}" class="nav-button"><span>⌁</span>AI 연결</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin', `<section id="${id}" class="tab-panel aiv" hidden></section>`);
 const root = document.getElementById(id);
 const st = {cfg: null, out: null, busy: false};

 function render() {
  const c = st.cfg;
  if (!c) { root.innerHTML = '<article class="card"><div class="card-body"><p class="fine-print">불러오는 중…</p></div></article>'; return; }
  root.innerHTML = `<article class="card"><div class="card-head"><h2>Kindroid</h2><span class="badge muted">직접 입력</span></div><div class="card-body">
   <p class="fine-print">Kindroid 공식 문서의 값을 그대로 적으세요. 이 도구는 주소·인증·요청 모양을 추측하지 않습니다. 저장한 헤더 값(키)은 화면에 가려서 보입니다.</p>
   <label class="field full"><span>요청 주소(https://…)</span><input data-ai="url" value="${e(c.url)}" placeholder="문서에 적힌 전체 주소"></label>
   <div class="section-label">헤더(인증 등)</div>
   ${c.headers.map((h, i) => `<div class="st-row"><input data-ai-hn="${i}" value="${e(h.name)}" placeholder="이름 (예: Authorization)"><input data-ai-hv="${i}" type="password" value="${e(h.value)}" placeholder="값(키)" autocomplete="off"><button class="button secondary small" data-ai-del="${i}">삭제</button></div>`).join('')}
   <div class="st-row"><button class="button secondary small" data-ai-act="add">헤더 추가</button></div>
   <label class="field full"><span>요청 본문(JSON, 보낼 말 자리에 <code>{message}</code>)</span><textarea data-ai="body" rows="5" placeholder='{"칸이름": "{message}"}'>${e(c.body)}</textarea></label>
   <label class="field full"><span>응답에서 꺼낼 칸(선택, 점으로 이음: <code>a.b.0.c</code>, 비우면 응답 전체)</span><input data-ai="path" value="${e(c.path)}"></label>
   <div class="st-row"><button class="button" data-ai-act="save">저장</button></div></div></article>
  <article class="card"><div class="card-head"><h2>한 번 보내 보기</h2></div><div class="card-body">
   <div class="st-row"><input data-ai="msg" placeholder="보낼 말"><button class="button" data-ai-act="send" ${st.busy ? 'disabled' : ''}>${st.busy ? '보내는 중…' : '보내기'}</button></div>
   ${st.out ? `<div class="section-label">응답</div><p style="white-space:pre-wrap">${e(st.out.text)}</p>${st.out.raw !== st.out.text ? `<details><summary class="fine-print">원본 응답</summary><pre class="fine-print" style="white-space:pre-wrap">${e(st.out.raw)}</pre></details>` : ''}` : ''}</div></article>`;
 }
 const read = () => ({url: root.querySelector('[data-ai=url]').value, body: root.querySelector('[data-ai=body]').value, path: root.querySelector('[data-ai=path]').value,
  headers: [...root.querySelectorAll('[data-ai-hn]')].map(n => ({name: n.value, value: root.querySelector(`[data-ai-hv="${n.dataset.aiHn}"]`).value}))});
 async function save() {
  try { st.cfg = await call('/api/ai/kindroid', read()); api.toast('저장했습니다.'); } catch (error) { api.toast(error.message); }
  render();
 }
 async function send() {
  const msg = root.querySelector('[data-ai=msg]').value;
  if (!msg.trim()) return api.toast('보낼 말을 입력하세요.');
  st.busy = true; st.out = null; render(); root.querySelector('[data-ai=msg]').value = msg;
  try { st.out = await call('/api/ai/kindroid/send', {message: msg}); } catch (error) { api.toast(error.message); }
  st.busy = false; render(); root.querySelector('[data-ai=msg]').value = msg;
 }
 root.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.dataset.aiAct === 'save') return save();
  if (b.dataset.aiAct === 'send') return send();
  if (b.dataset.aiAct === 'add') { st.cfg = {...read(), headers: [...read().headers, {name: '', value: ''}]}; return render(); }
  if (b.dataset.aiDel !== undefined) { const r = read(); r.headers.splice(Number(b.dataset.aiDel), 1); st.cfg = r; render(); }
 });
 render();
 call('/api/ai/kindroid').then(c => { st.cfg = c; render(); }).catch(error => { root.innerHTML = `<article class="card"><div class="card-body"><p class="fine-print">${e(error.message)}</p></div></article>`; });
}
