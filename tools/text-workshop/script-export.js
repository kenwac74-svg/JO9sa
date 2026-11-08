/* JO9 MOD START SCRIPT_EXPORT_UI | 2026-11-08 흐름 전체 각본 출력 · 각색본 일괄 반영 */
(function () {
  'use strict';
  const nav = document.getElementById('navigation');
  if (!nav || typeof api !== 'function') return;
  const box=document.getElementById('scriptExportBox');
  const $ = id => document.getElementById(id);
  let made = null, revision = 0, lastExportId = null;

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
      made = { ...r, start: s }; lastExportId = r.exportId; $('scriptText').value = r.text;window.JO9ScriptImporter?.source(r);
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

  // 장면이 바뀌면 출력 결과만 비우고 각색본·각본 ID는 유지한다.
  window.addEventListener('jo9:selection',()=>reset());
  reset();
})();
/* JO9 MOD END SCRIPT_EXPORT_UI */
