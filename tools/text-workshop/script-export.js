/* JO9 MOD START SCRIPT_EXPORT_UI | 2026-11-08 흐름 전체 각본 출력 · 각색본 일괄 반영 */
(function () {
  'use strict';
  const nav = document.getElementById('navigation');
  if (!nav || typeof api !== 'function') return;
  const css = document.createElement('style');
  css.textContent = `
#scriptExportBox textarea{width:100%;font:13px/1.6 Consolas,'Malgun Gothic',monospace;white-space:pre-wrap;overflow:auto;background:#0b1220;color:#e5e7eb;border:1px solid #374151;border-radius:6px;padding:10px;margin-top:8px}
#scriptExportBox .opts{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
#scriptImport{margin-top:18px;border-top:1px solid #374151;padding-top:12px}
#scriptChanges .chg{border:1px solid #374151;border-radius:6px;padding:8px 10px;margin:8px 0;background:#0f172a}
#scriptChanges .chg.off{opacity:.45}
#scriptChanges .cols{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
#scriptChanges .cols div{white-space:pre-wrap;font-size:13px;line-height:1.55}
#scriptChanges .old{color:#9ca3af}
#scriptChanges .warn{color:#fbbf24;font-size:13px}
@media (max-width:760px){#scriptChanges .cols{grid-template-columns:1fr}}`;
  document.head.append(css);
  const box = document.createElement('details');
  box.id = 'scriptExportBox';
  box.innerHTML = `
<summary>흐름 전체 각본 · 출력과 각색본 일괄 반영</summary>
<p class="muted">선택한 장면에서 시작해 선택지·이동으로 이어지는 장면을 따라가며 대사 전체를 페이지 구분선과 함께 한 문서로 만듭니다. AI가 각색한 결과를 아래 ‘각색본 반영’에 붙여 넣으면 페이지 번호로 원래 대사를 찾아 한 번에 반영합니다.</p>
<div class="opts">
 <label>시작 <select id="scriptStart"><option value="scene">선택한 장면</option><option value="root">이 위치 전체</option></select></label>
 <label>따라갈 단계 <input id="scriptDepth" type="number" min="0" max="50" value="6" style="width:4.5em"></label>
 <label>최대 장면 수 <input id="scriptMax" type="number" min="1" max="200" value="30" style="width:4.5em"></label>
 <label>주인공 판본 <select id="scriptEdition"><option value="man">남성</option><option value="woman">여성</option></select></label>
 <label><input id="scriptVariants" type="checkbox" checked> 조건부 대체문 포함</label>
 <label><input id="scriptCalls" type="checkbox"> 호출(gs)도 따라가기</label>
 <label><input id="scriptCode" type="checkbox"> 코드 위치 표시</label>
</div>
<div class="row" style="margin-top:8px"><button id="scriptMake">각본 만들기</button><button id="scriptCopy" disabled>복사</button><button id="scriptSave" disabled>txt 저장</button><button id="scriptCopyRequest" disabled>각색 요청문과 함께 복사</button><span id="scriptStatus" class="muted"></span></div>
<textarea id="scriptText" readonly spellcheck="false" style="min-height:380px" placeholder="장면을 고른 뒤 ‘각본 만들기’를 누르세요."></textarea>
<div id="scriptImport">
 <h3 style="margin:0 0 4px">각색본 반영</h3>
 <p class="muted">AI가 돌려준 각본 전체를 붙여 넣으세요. 맨 위 “# 각본 ID:” 줄과 페이지 번호([S1-P3])가 있어야 합니다. 바뀐 페이지만 골라 원문과 나란히 보여 주고, 승인하면 백업 후 한 번에 저장합니다(수정 기록에서 되돌리기 가능).</p>
 <textarea id="scriptAdapted" spellcheck="false" style="min-height:220px" placeholder="각색된 각본을 여기에 붙여 넣으세요."></textarea>
 <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:10px;align-items:center">
  <label><input id="scriptAllowMissing" type="checkbox"> 빠진 번호는 원문 유지</label>
  <button id="scriptPreview">반영 미리보기</button>
  <span id="scriptImportStatus" class="muted"></span>
 </div>
 <div id="scriptChanges"></div>
 <div class="row" style="margin-top:8px;gap:10px;align-items:center"><label><input id="scriptApproved" type="checkbox" disabled> 위 변경을 확인했습니다</label><button id="scriptApply" disabled>일괄 반영</button></div>
</div>`;
  const anchor = document.getElementById('sceneTextsBox');
  if (anchor) anchor.after(box); else nav.append(box);
  const $ = id => document.getElementById(id);
  let made = null, revision = 0, lastExportId = null, review = null, excluded = new Set(), busy = false;

  // ---------- 출력 ----------
  const start = () => {
    const c = typeof context !== 'undefined' ? context : null;
    if (!c || !c.location) return null;
    if ($('scriptStart').value === 'root') return { location: c.flow?.usage?.location || c.location, sceneId: 'root', title: '위치 전체' };
    if (c.flow?.usage) return { location: c.flow.usage.location, sceneId: c.flow.usage.sceneId, title: c.flow.usage.title };
    if (!c.scene || c.scene.id === 'desc') return { location: c.location, sceneId: 'root', title: '위치 전체' };
    return { location: c.location, sceneId: c.scene.id, title: c.scene.title };
  };
  function reset(note) {
    revision++; made = null; $('scriptText').value = '';
    for (const id of ['scriptCopy', 'scriptSave', 'scriptCopyRequest']) $(id).disabled = true;
    const s = start(); $('scriptStatus').textContent = note || (s ? `시작: ${s.location} · ${s.title}` : '장면을 먼저 선택하세요.');
  }
  async function make() {
    const s = start(); if (!s) { reset(); return; }
    const mine = ++revision; $('scriptMake').disabled = true; $('scriptStatus').textContent = '만드는 중… (처음 한 번은 전체 대사를 색인하느라 몇 초 걸립니다)';
    try {
      const r = await api('/api/script', { hash: context.hash || context.selection?.hash, location: s.location, sceneId: s.sceneId, options: { maxDepth: Number($('scriptDepth').value), maxScenes: Number($('scriptMax').value), edition: $('scriptEdition').value, variants: $('scriptVariants').checked, followCalls: $('scriptCalls').checked, showCode: $('scriptCode').checked } });
      if (mine !== revision) return;
      made = { ...r, start: s }; lastExportId = r.exportId; $('scriptText').value = r.text;
      for (const id of ['scriptCopy', 'scriptSave', 'scriptCopyRequest']) $(id).disabled = false;
      const st = r.stats;
      $('scriptStatus').textContent = `장면 ${st.scenes}개 · 페이지 ${st.pages}개 · 대체문 ${st.variants}개${st.dynamic ? ' · 실행 중 결정 ' + st.dynamic + '곳' : ''}${st.skipped ? ' · 한도 때문에 멈춘 연결 ' + st.skipped + '개' : ''} · ${r.text.length.toLocaleString()}자 · 각본 ID ${r.exportId}`;
    } catch (e) { if (mine === revision) $('scriptStatus').textContent = '실패: ' + e.message; }
    finally { $('scriptMake').disabled = false; }
  }
  async function copy(text, done, status) {
    try { await navigator.clipboard.writeText(text); status.textContent = done; }
    catch { $('scriptText').select(); status.textContent = '클립보드 접근이 막혔습니다. 글상자에서 Ctrl+C로 복사하세요.'; }
  }
  const request = () => [
    'JO9(잭 오 나인 테일즈) 한국어판 대사 흐름 각색 요청',
    '',
    '아래는 게임의 한 흐름을 처음부터 끝까지 옮긴 각본입니다. 지금 대사는 컷마다 따로 번역되어 앞뒤가 매끄럽게 이어지지 않습니다.',
    '흐름 전체를 읽고 인물의 말투·호칭·감정선이 처음부터 끝까지 이어지도록 자연스러운 한국어로 각색해 주세요.',
    '',
    '지켜 줄 것 (결과를 게임에 자동으로 다시 넣기 때문에 꼭 필요합니다)',
    '- 각본 전체를 같은 형식으로 돌려주세요. 맨 위 "# 각본 ID:" 줄을 포함해 # 줄은 그대로 두세요.',
    '- "---- [S1-P3] ... ----", "(S1-P3-V1 · 조건: ...) 대체문", "[S1-L2 · 장면 문구]" 표시 줄과 번호를 바꾸거나 지우지 말고, 페이지를 합치거나 나누지 마세요. 한 페이지는 게임 한 화면입니다.',
    '- "이름: 대사" 형식과 화자 이름을 유지하세요.',
    '- 〈$변수〉 표기, [그림], [선택지: ...] 표시와 <font>·<b> 같은 태그는 글자 그대로 남겨 두세요(선택지 문구와 태그 안의 단어는 각색해도 됩니다).',
    '- "(조건: ...) 대체문"은 같은 페이지의 다른 판본입니다. 따로 각색해 같은 자리에 두세요.',
    '- [대사 묶음], ▶ 다음 장면, 번호 붙은 선택지 목록 줄은 구조 표시입니다. 바꾸지 마세요.',
    '- 페이지 분량은 원문과 비슷하게 유지하세요.',
    '',
    made.text,
  ].join('\n');
  $('scriptMake').onclick = make;
  $('scriptCopy').onclick = () => made && copy(made.text, '각본을 복사했습니다.', $('scriptStatus'));
  $('scriptCopyRequest').onclick = () => made && copy(request(), '각색 요청문과 각본을 함께 복사했습니다.', $('scriptStatus'));
  $('scriptSave').onclick = () => {
    if (!made) return;
    const safe = s => String(s).replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
    const blob = new Blob(['﻿' + made.text.replace(/\r?\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `JO9_각본_${safe(made.start.location)}_${safe(made.start.title)}.txt`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $('scriptStatus').textContent = '다운로드 폴더에 txt로 저장했습니다.';
  };
  for (const id of ['scriptStart', 'scriptDepth', 'scriptMax', 'scriptEdition', 'scriptVariants', 'scriptCalls', 'scriptCode']) $(id).addEventListener('change', () => reset());

  // ---------- 각색본 반영 ----------
  const node = (tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; return el; };
  function clearReview(note) {
    review = null; $('scriptChanges').replaceChildren(); $('scriptApproved').checked = false; $('scriptApproved').disabled = true; $('scriptApply').disabled = true;
    if (note !== undefined) $('scriptImportStatus').textContent = note;
  }
  function renderReview(r) {
    const list = $('scriptChanges'); list.replaceChildren();
    const warned = r.changes.filter(c => c.warnings.length && !c.excluded).length;
    $('scriptImportStatus').textContent = r.changes.length
      ? `바뀐 페이지 ${r.changes.length}개 (반영 ${r.count}개) · 그대로 ${r.unchanged}개${r.missing ? ' · 빠진 번호 ' + r.missing + '개(원문 유지)' : ''}${warned ? ' · 경고 ' + warned + '개' : ''}`
      : `바뀐 페이지가 없습니다 · 그대로 ${r.unchanged}개`;
    for (const c of r.changes) {
      const card = node('div', undefined, 'chg' + (c.excluded ? ' off' : ''));
      const head = node('label'); const check = node('input'); check.type = 'checkbox'; check.checked = !c.excluded;
      check.onchange = () => { if (check.checked) excluded.delete(c.id); else excluded.add(c.id); preview().catch(e => clearReview('실패: ' + e.message)); };
      head.append(check, ' ', node('strong', c.id), node('span', ` · ${c.location} ${c.line}행`, 'muted'));
      card.append(head);
      for (const w of c.warnings) card.append(node('div', '⚠ ' + w, 'warn'));
      const cols = node('div', undefined, 'cols'); cols.append(node('div', c.oldPlain, 'old'), node('div', c.newPlain)); card.append(cols);
      list.append(card);
    }
    $('scriptApproved').disabled = !r.id; $('scriptApply').disabled = true;
  }
  async function preview() {
    if (busy) return; busy = true; $('scriptPreview').disabled = true;
    try {
      const text = $('scriptAdapted').value;
      $('scriptImportStatus').textContent = '확인하는 중…';
      const r = await api('/api/script/preview', { text, exportId: lastExportId, allowMissing: $('scriptAllowMissing').checked, exclude: [...excluded] });
      review = r; renderReview(r);
    } finally { busy = false; $('scriptPreview').disabled = false; }
  }
  $('scriptPreview').onclick = () => { excluded = new Set(); clearReview(); preview().catch(e => clearReview('실패: ' + e.message)); };
  $('scriptAdapted').addEventListener('input', () => { if (review) clearReview('각색본이 바뀌었습니다. 다시 미리보기를 누르세요.'); });
  $('scriptAllowMissing').addEventListener('change', () => { if (review) clearReview('설정이 바뀌었습니다. 다시 미리보기를 누르세요.'); });
  $('scriptApproved').onchange = () => { $('scriptApply').disabled = !($('scriptApproved').checked && review?.id); };
  $('scriptApply').onclick = async () => {
    if (!review?.id || !$('scriptApproved').checked) return;
    $('scriptApply').disabled = true;
    try {
      const n = review.count;
      await api('/api/apply', { id: review.id, approved: true });
      window.dispatchEvent(new Event('jo9:text-changed'));
      $('scriptAdapted').value = ''; clearReview('');
      if (window.JO9BatchEditor?.afterApply) await window.JO9BatchEditor.afterApply();
      if (typeof say === 'function') say(`각색본 ${n}개 페이지를 반영했습니다. 백업과 수정 기록이 남았고, ‘변경 기록’에서 되돌릴 수 있습니다. 게임에서 해당 장면을 다시 열어 확인하세요.`);
    } catch (e) { $('scriptImportStatus').textContent = '반영 실패: ' + e.message; $('scriptApply').disabled = false; }
  };

  const previous = window.JO9_VARIABLE_SELECT;
  // 장면이 바뀌면 출력 결과만 비운다. 붙여 넣은 각색본과 마지막 각본 ID는 유지한다.
  window.JO9_VARIABLE_SELECT = function (c) { if (typeof previous === 'function') previous(c); reset(); };
  reset();
})();
/* JO9 MOD END SCRIPT_EXPORT_UI */
