'use strict';
(() => {
  const A = window.JO9AudioLibrary, config = window.JO9AudioConfig, storageKey = config.storageKey;
  const live = new Map(), urls = new Map();
  const $ = id => document.getElementById(id);
  let state = A.restoreState(null), storageAvailable = true, pendingRow = null;
  try { state = A.restoreState(JSON.parse(localStorage.getItem(storageKey) || 'null')); }
  catch (_) { storageAvailable = false; }
  let decisionsApplied = 0;
  try {
    const decisionKey = storageKey + '-decisions';
    const seen = JSON.parse(localStorage.getItem(decisionKey) || '[]');
    const merged = A.applyDecisions(state, config.decisions || [], seen);
    state = merged.state;
    decisionsApplied = merged.appliedIds.length - (Array.isArray(seen) ? seen.length : 0);
    if (decisionsApplied > 0) {
      localStorage.setItem(storageKey, JSON.stringify(state));
      localStorage.setItem(decisionKey, JSON.stringify(merged.appliedIds));
    }
  } catch (_) { storageAvailable = false; }
  const rows = [...document.querySelectorAll('.local-slot')].map(node => ({ node, key: node.dataset.rowKey, filename: node.dataset.filename || '', baseline: node.dataset.baseline || '' }));
  const report = text => { $('library-message').textContent = text; };
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function audio(file) {
    const id = A.describeFile(file).id;
    if (!urls.has(id)) urls.set(id, URL.createObjectURL(file));
    const player = element('audio');
    player.controls = true;
    player.preload = 'none';
    player.src = urls.get(id);
    player.addEventListener('error', () => { player.title = '브라우저에서 이 형식을 재생할 수 없거나 파일을 읽지 못했습니다.'; });
    return player;
  }
  function reviewButtons(key) {
    const group = element('div', undefined, 'reviews');
    group.setAttribute('aria-label', '검토 상태');
    for (const [value, label] of config.reviews) {
      const button = element('button', label, state.reviews[key] === value ? 'review selected' : 'review');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(state.reviews[key] === value));
      button.addEventListener('click', () => { state = A.toggleReview(state, key, value); save(); render(); });
      group.append(button);
    }
    return group;
  }
  function renderRow(row) {
    const node = row.node;
    node.replaceChildren();
    const source = A.rowSource(row, state, [...live.values()]);
    const controls = element('div', undefined, 'local-controls');
    const choose = element('button', '파일 지정');
    choose.type = 'button';
    choose.addEventListener('click', () => { pendingRow = row.key; $('row-file-input').click(); });
    const select = element('select');
    select.setAttribute('aria-label', '이 항목에 지정할 개인 음원');
    const empty = element('option', '개인 음원에서 선택');
    empty.value = '';
    select.append(empty);
    for (const meta of state.files) {
      const option = element('option', meta.relativePath + (live.has(meta.id) ? '' : ' (재선택 필요)'));
      option.value = meta.id;
      select.append(option);
    }
    select.value = state.assignments[row.key] || '';
    select.addEventListener('change', () => { state = A.assignRow(state, row.key, select.value || null); save(); render(); });
    const reset = element('button', '지정 해제');
    reset.type = 'button';
    reset.disabled = !state.assignments[row.key];
    reset.addEventListener('click', () => { state = A.assignRow(state, row.key, null); save(); render(); });
    controls.append(choose, select, reset);
    node.append(controls);
    if (source.file) {
      node.append(element('div', (source.status === 'assigned' ? '지정 음원: ' : '폴더 일치: ') + A.describeFile(source.file).relativePath, 'local-info'), audio(source.file));
    } else if (source.status === 'unavailable') {
      node.append(element('p', '지정 음원 재선택 필요: ' + (source.meta?.relativePath || '') + ' — 위의 폴더 선택 또는 음원 파일 추가로 다시 연결하세요.', 'local-info'));
    } else if (source.status === 'ambiguous') {
      node.append(element('p', '같은 파일명이 여러 폴더에 있습니다. 파일 지정 또는 개인 음원 선택으로 하나를 정하세요.', 'local-info'));
    }
    node.append(reviewButtons(row.key));
  }
  function render() {
    for (const player of document.querySelectorAll('audio')) player.pause();
    for (const row of rows) renderRow(row);
    const list = $('personal-audio');
    list.replaceChildren();
    for (const meta of state.files) {
      const item = element('div', undefined, 'personal-item');
      item.append(element('code', meta.relativePath));
      item.append(live.has(meta.id) ? audio(live.get(meta.id)) : element('span', '재생하려면 폴더/파일 재선택', 'none'));
      item.append(reviewButtons('personal:' + meta.id));
      list.append(item);
    }
    const waiting = state.files.filter(file => !live.has(file.id)).length;
    $('library-status').textContent = '개인 음원 ' + state.files.length + '개 · 재생 가능 ' + live.size + '개' + (waiting ? ' · 재선택 필요 ' + waiting + '개' : '') + (storageAvailable ? '' : ' · 브라우저 저장 불가: 설정 내보내기를 사용하세요.');
    if (!state.files.length) list.append(element('p', '폴더나 음원 파일을 선택하면 여기에 표시됩니다.', 'none'));
  }
  function addFiles(files, rowKey) {
    const input = [...files], merged = A.mergeFiles([...live.values()], input), accepted = merged.added;
    for (const file of accepted) {
      const meta = A.describeFile(file);
      if (urls.has(meta.id)) { URL.revokeObjectURL(urls.get(meta.id)); urls.delete(meta.id); }
      live.set(meta.id, file);
      state.files = state.files.filter(item => item.id !== meta.id);
      state.files.push(meta);
    }
    if (rowKey && accepted.length === 1) state = A.assignRow(state, rowKey, A.describeFile(accepted[0]).id);
    save(); render();
    report(accepted.length + '개 음원을 연결했습니다.' + (input.some(file => !A.isAudio(file)) ? ' 음원이 아닌 파일은 제외했습니다.' : '') + (merged.collisions.length ? ' 이름·경로·크기·수정시각이 같은 파일은 기존 연결을 유지했습니다. 이미 연결한 파일은 선택 칸에서 고르고, 다른 파일이면 폴더 선택으로 경로를 구분하세요.' : ''));
  }
  $('folder-button').addEventListener('click', () => $('folder-input').click());
  $('files-button').addEventListener('click', () => $('files-input').click());
  for (const id of ['folder-input', 'files-input']) $(id).addEventListener('change', event => { addFiles(event.target.files); event.target.value = ''; });
  $('row-file-input').addEventListener('change', event => { addFiles(event.target.files, pendingRow); pendingRow = null; event.target.value = ''; });
  $('export-button').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(A.restoreState(state), null, 2)], { type: 'application/json' }));
    const anchor = element('a'); anchor.href = url; anchor.download = 'JO9_사운드_설정.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('import-button').addEventListener('click', () => $('settings-input').click());
  $('settings-input').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (file) {
      try {
        const parsed = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.files)) throw new Error('settings');
        const restored = A.restoreState(parsed);
        const retained = new Set(A.filesForState(restored, [...live.values()]).map(item => A.describeFile(item).id));
        for (const id of live.keys()) if (!retained.has(id)) {
          live.delete(id);
          if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
        }
        state = restored; save(); render();
        report('설정을 불러왔습니다. 재선택 필요 음원은 같은 폴더나 파일을 다시 선택하세요.');
      } catch (_) { report('설정 JSON을 읽지 못했습니다. 기존 설정은 유지했습니다.'); }
    }
    event.target.value = '';
  });
  document.addEventListener('play', event => {
    if (event.target.tagName === 'AUDIO') for (const other of document.querySelectorAll('audio')) if (other !== event.target) other.pause();
  }, true);
  window.addEventListener('pagehide', () => { for (const url of urls.values()) URL.revokeObjectURL(url); urls.clear(); });
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  render();
  if (decisionsApplied > 0) report('사용자가 확정한 음원 채택·지정을 반영했습니다. 설치용 WAV는 해당 항목에서 바로 들을 수 있습니다.');
  else if (state.files.length) report('저장된 이름·배정을 복원했습니다. 재생하려면 폴더나 파일을 다시 선택하세요.');
})();
