'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const token = document.querySelector('meta[name="jo9-state-token"]')?.content || '';
  const model = { snapshot: null, drafts: new Map(), selected: new Set(), preview: null, busy: false, view: 'states', icons: new Map(), fieldNodes: new Map(), generation: 0 };
  const viewTitles = { states: '상태표', rules: '전환·이력', effects: '연결 효과', review: '비교·적용' };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function empty(node, message) {
    node.replaceChildren(el('p', 'empty', message));
  }

  function status(message, type = 'success') {
    $('status').textContent = message;
    $('status').className = `status ${type}`;
    $('status').setAttribute('role', type === 'error' ? 'alert' : 'status');
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: { 'X-JO9-Token': token, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
    const data = await response.json().catch(() => ({ error: `서버 응답을 읽지 못했습니다. (HTTP ${response.status})` }));
    if (!response.ok) {
      const error = new Error(data.error || `요청에 실패했습니다. (HTTP ${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function post(path, body) {
    return api(path, { method: 'POST', body: JSON.stringify(body) });
  }

  function hashes(snapshot = model.snapshot) {
    return Object.fromEntries((snapshot?.targets || []).filter((target) => target.available !== false && target.hash).map((target) => [target.id, target.hash]));
  }

  function fields(snapshot = model.snapshot) {
    return snapshot?.inspection?.fields || [];
  }

  function valueFor(field) {
    return model.drafts.has(field.id) ? model.drafts.get(field.id) : field.value;
  }

  function validation(field, value) {
    if (field.kind === 'number') {
      if (value === '' || typeof value !== 'number' || !Number.isFinite(value)) return '유효한 숫자를 입력하세요.';
      if (field.min !== undefined && value < field.min) return `최솟값은 ${field.min}입니다.`;
      if (field.max !== undefined && value > field.max) return `최댓값은 ${field.max}입니다.`;
    } else if (typeof value !== 'string' || !value.trim()) return '값을 입력하세요.';
    const node = model.fieldNodes.get(field.id)?.input;
    if (node && !node.validity.valid) return node.validationMessage || '입력 범위를 확인하세요.';
    return '';
  }

  function edits() {
    return fields().filter((field) => !Object.is(valueFor(field), field.value)).map((field) => ({ id: field.id, value: valueFor(field) }));
  }

  function invalidFields() {
    return fields().filter((field) => validation(field, valueFor(field)));
  }

  function invalidatePreview(message = '수정한 값으로 미리보기를 다시 실행하세요.') {
    model.preview = null;
    empty($('preview-result'), message);
    updateControls();
  }

  function updateControls() {
    const loaded = Boolean(model.snapshot);
    const count = edits().length;
    const invalid = invalidFields().length;
    $('changed-count').replaceChildren(document.createTextNode(String(count)), el('span', '', '개'));
    $('draft-total').textContent = `변경 ${count}개`;
    $('draft-hint').textContent = invalid ? `입력 확인이 필요한 항목 ${invalid}개` : count ? `선택한 설치본 ${model.selected.size}개에 대해 검사합니다.` : '등록된 값을 수정하면 변경 내역을 비교할 수 있습니다.';
    $('preview-button').disabled = model.busy || !loaded || invalid > 0 || !model.selected.size;
    $('cache-preview-button').disabled = model.busy || !loaded || invalid > 0 || !model.selected.size;
    $('apply-button').disabled = model.busy || !model.preview || !model.preview.changeCount;
    $('save-project').disabled = model.busy || !loaded || invalid > 0;
    $('load-project').disabled = model.busy || !token;
    $('target-select').disabled = model.busy || !loaded;
    $('reload-source').disabled = model.busy || !loaded;
    $('field-search').disabled = !loaded;
    document.querySelectorAll('#target-checks input').forEach((input) => {
      const target = model.snapshot?.targets.find((item) => item.id === input.value);
      input.disabled = model.busy || target?.available === false;
    });
    model.fieldNodes.forEach(({ input }) => { input.disabled = model.busy; });
    document.querySelectorAll('[data-action]').forEach((button) => { button.disabled = model.busy; });
  }

  async function run(task, message) {
    if (model.busy) return;
    model.busy = true;
    updateControls();
    if (message) status(message, 'busy');
    try {
      await task();
    } catch (error) {
      if (error.status === 409) invalidatePreview('원본 해시가 달라졌습니다. 설치본을 다시 불러와 변경 내용을 확인하세요.');
      status(`${error.status === 409 ? '원본 충돌 · ' : ''}${error.message}`, 'error');
    } finally {
      model.busy = false;
      updateControls();
    }
  }

  function switchView(view, focus = false) {
    model.view = view;
    for (const name of Object.keys(viewTitles)) $('view-' + name).hidden = view !== name;
    document.querySelectorAll('[data-view]').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $('field-search').closest('.search-bar').hidden = view === 'review';
    if (focus) $('view-' + view).scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function bindingsList(bindings) {
    const details = el('details', 'binding-details');
    details.append(el('summary', '', `소스 연결 ${bindings.length}곳`));
    const list = el('div', 'binding-list');
    bindings.forEach((binding) => {
      const item = el('div', 'binding-item');
      const title = el('div', 'binding-title');
      title.append(el('code', '', `${binding.location} · ${binding.field || 'body'}${binding.line ? `:${binding.line}` : ''}`));
      if (binding.role) title.append(el('span', 'role-tag', `역할 ${binding.role}`));
      item.append(title);
      if (binding.code) item.append(el('pre', '', binding.code));
      list.append(item);
    });
    details.append(list);
    return details;
  }

  function fieldCard(field, view) {
    const card = el('div', 'field-card');
    card.dataset.searchField = field.id;
    card.dataset.fieldView = view;
    const labelRow = el('div', 'field-label-row');
    const label = el('label', '', field.label);
    const input = el('input');
    input.id = `field-${field.id}`;
    input.dataset.fieldId = field.id;
    input.type = field.kind === 'number' ? 'number' : 'text';
    input.value = String(valueFor(field));
    input.required = true;
    input.autocomplete = 'off';
    input.spellcheck = false;
    if (field.kind === 'number') {
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      input.step = field.step === undefined ? 'any' : String(field.step);
      input.inputMode = 'decimal';
    }
    label.htmlFor = input.id;
    const marker = el('span', 'field-state', '원본');
    labelRow.append(label, marker);
    const control = el('div', 'field-control');
    control.append(input);
    card.append(labelRow, control);
    const help = el('p', 'field-help', field.help || `${field.group}에 등록된 소스 값입니다.`);
    help.id = `help-${field.id}`;
    input.setAttribute('aria-describedby', help.id);
    const original = el('p', 'field-original');
    original.hidden = true;
    const error = el('p', 'field-validation');
    error.id = `error-${field.id}`;
    error.hidden = true;
    card.append(help, original, error);
    let iconPreview;
    let iconStatus;
    if (field.kind === 'icon') {
      const preview = el('div', 'field-icon-preview');
      preview.dataset.iconPreviewField = field.id;
      iconPreview = el('div', 'state-icon field-icon-image');
      iconPreview.setAttribute('aria-hidden', 'true');
      const copy = el('div', 'field-icon-copy');
      copy.append(el('span', 'field-icon-label', `입력 경로 미리보기 · ${model.snapshot.target.label}`));
      iconStatus = el('span', 'field-icon-status', '불러오는 중…');
      iconStatus.setAttribute('role', 'status');
      iconStatus.setAttribute('aria-live', 'polite');
      copy.append(iconStatus);
      preview.append(iconPreview, copy);
      card.append(preview);
      loadIcon(iconPreview, String(valueFor(field)), model.generation, { statusNode: iconStatus });
    }
    if (field.bindings?.length) card.append(bindingsList(field.bindings));
    model.fieldNodes.set(field.id, { input, card, marker, original, error, view, field });
    input.addEventListener('input', () => {
      const value = field.kind === 'number' ? (input.value === '' ? '' : Number(input.value)) : input.value;
      model.drafts.set(field.id, value);
      const changed = !Object.is(value, field.value);
      card.classList.toggle('is-changed', changed);
      marker.textContent = changed ? '수정됨' : '원본';
      original.textContent = `원본: ${field.value}`;
      original.hidden = !changed;
      const problem = validation(field, value);
      error.textContent = problem;
      error.hidden = !problem;
      input.setAttribute('aria-invalid', String(Boolean(problem)));
      input.setAttribute('aria-describedby', [help.id, problem ? error.id : ''].filter(Boolean).join(' '));
      if (iconPreview) loadIcon(iconPreview, String(value), model.generation, { statusNode: iconStatus });
      invalidatePreview();
      if (problem) status(`${field.label}: ${problem}`, 'error');
      else status(`변경 ${edits().length}개 · 미리보기에서 설치본별 수정 위치를 확인하세요.`);
      updateSearch();
    });
    return card;
  }

  function appendGroups(container, groupedFields, view) {
    container.replaceChildren();
    const groups = new Map();
    groupedFields.forEach((field) => {
      if (!groups.has(field.group || '등록된 항목')) groups.set(field.group || '등록된 항목', []);
      groups.get(field.group || '등록된 항목').push(field);
    });
    groups.forEach((items, group) => {
      const section = el('section', 'field-group');
      section.dataset.fieldGroup = group;
      section.append(el('h3', 'group-heading', group));
      items.forEach((field) => section.append(fieldCard(field, view)));
      container.append(section);
    });
  }

  function loadIcon(holder, path, generation, { statusNode, original = false } = {}) {
    const request = String(Number(holder.dataset.iconRequest || 0) + 1);
    holder.dataset.iconRequest = request;
    holder.dataset.iconPath = path;
    const current = () => generation === model.generation && holder.dataset.iconRequest === request && holder.dataset.iconPath === path;
    const mark = (state) => {
      if (!current() || !statusNode) return;
      statusNode.textContent = state === 'ready' ? '입력 경로 확인됨' : state === 'loading' ? '불러오는 중…' : '입력 경로 확인 필요';
      statusNode.classList.toggle('error', state === 'error');
    };
    const missing = () => {
      if (!current()) return;
      holder.replaceChildren(el('span', 'icon-missing', '◇'));
      holder.title = `${original ? '원본 아이콘' : '입력 경로 확인 필요'}: ${path || '(빈 경로)'}`;
      mark('error');
    };
    holder.replaceChildren(el('span', 'icon-missing', '…'));
    holder.title = `${original ? '원본 아이콘' : '입력 경로'}: ${path}`;
    mark('loading');
    if (!path.trim()) { missing(); return; }
    const targetId = model.snapshot.target.id;
    const key = `${targetId}:${path}`;
    if (!model.icons.has(key)) {
      const promise = fetch(`/api/icon?target=${encodeURIComponent(targetId)}&path=${encodeURIComponent(path)}`, { credentials: 'same-origin', headers: { 'X-JO9-Token': token } })
        .then(async (response) => {
          if (!response.ok || !/^image\//i.test(response.headers.get('Content-Type') || '')) throw new Error('아이콘 파일 확인 필요');
          const blob = await response.blob();
          if (generation !== model.generation) return null;
          return URL.createObjectURL(blob);
        }).catch(() => {
          if (generation === model.generation) model.icons.delete(key);
          return null;
        });
      model.icons.set(key, promise);
    }
    model.icons.get(key).then((url) => {
      if (!current()) return;
      if (!url) { missing(); return; }
      const img = el('img');
      img.alt = '';
      img.addEventListener('load', () => { if (current()) mark('ready'); });
      img.addEventListener('error', missing);
      img.src = url;
      holder.replaceChildren(img);
      holder.title = `${original ? '원본 아이콘' : '입력 경로'}: ${path}`;
    });
  }

  function renderDefinitions(snapshot) {
    model.fieldNodes.clear();
    const inspection = snapshot.inspection;
    $('feature-title').textContent = inspection.feature.title;
    $('feature-type').textContent = inspection.feature.type === 'character-state' ? '인물 상태형 기능' : inspection.feature.type || '인물 상태형 기능';
    $('feature-summary').textContent = inspection.feature.summary || '';
    $('field-total').textContent = `편집 ${fields().length}개`;
    const assigned = new Set();
    const stateTable = $('state-table');
    stateTable.replaceChildren();
    (inspection.states || []).forEach((item) => {
      const row = el('section', 'state-row');
      row.dataset.stateCode = item.code;
      const head = el('div', 'state-row-head');
      const icon = el('div', 'state-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.append(el('span', 'icon-missing', '◇'));
      const originalIcon = el('div', 'state-icon-origin');
      originalIcon.append(el('span', '', '원본 아이콘'), icon);
      head.append(el('span', 'state-code', item.code), el('h3', 'state-label', item.label), originalIcon);
      row.append(head);
      const attached = fields().filter((field) => field.id === item.labelFieldId || field.id === item.iconFieldId || field.id.startsWith(`state.${item.code}.`));
      attached.forEach((field) => { assigned.add(field.id); row.append(fieldCard(field, 'states')); });
      if (!attached.length) row.append(el('p', 'field-help', '이 상태의 표시 연결은 읽기 전용입니다.'));
      stateTable.append(row);
      if (item.icon) loadIcon(icon, item.icon, model.generation, { original: true });
    });
    if (!inspection.states?.length) empty(stateTable, '등록된 상태 행이 없습니다.');
    const other = fields().filter((field) => !assigned.has(field.id));
    const category = (field) => {
      if (/상태표|표시|아이콘/.test(field.group)) return 'states';
      if (/이력|유지/.test(field.group)) return 'history';
      if (/전환|판정/.test(field.group)) return 'rules';
      return 'effects';
    };
    appendGroups($('display-fields'), other.filter((field) => category(field) === 'states'), 'states');
    appendGroups($('rule-fields'), other.filter((field) => category(field) === 'rules'), 'rules');
    appendGroups($('history-edit-fields'), other.filter((field) => category(field) === 'history'), 'rules');
    appendGroups($('effect-fields'), other.filter((field) => category(field) === 'effects'), 'effects');
    if (!$('effect-fields').children.length) empty($('effect-fields'), '등록된 편집 가능한 연결 효과가 없습니다.');
    $('transitions').replaceChildren();
    (inspection.transitions || []).forEach((item) => {
      const card = el('article', 'definition-card');
      const heading = el('div', 'definition-heading');
      heading.append(el('h3', '', item.title), el('span', 'definition-type', '기존 전환 구조'));
      card.append(heading, el('p', '', item.description));
      if (item.bindings?.length) card.append(bindingsList(item.bindings));
      $('transitions').append(card);
    });
    if (!inspection.transitions?.length) empty($('transitions'), '연결된 전환 정보가 없습니다.');
    $('history-fields').replaceChildren();
    (inspection.history || []).forEach((item) => {
      const card = el('article', 'definition-card');
      const heading = el('div', 'definition-heading');
      const typeLabels = { boolean: '발견·완료 여부', 'state-code': '상태 코드', version: '처리 버전', number: '수치' };
      heading.append(el('h3', '', item.label), el('span', 'definition-type', `${typeLabels[item.type] || item.type || '이력'} · 읽기 전용`));
      card.append(heading, el('code', '', item.key), el('p', '', item.description));
      $('history-fields').append(card);
    });
    if (!inspection.history?.length) empty($('history-fields'), '등록된 이력 구조가 없습니다.');
    $('role-bindings').replaceChildren();
    (inspection.roles || []).forEach((role) => $('role-bindings').append(el('span', 'role-tag', role.label.includes(role.id) ? role.label : `${role.label} · ${role.id}`)));
    if (!inspection.roles?.length) $('role-bindings').append(el('span', 'muted', '등록된 역할이 없습니다.'));
    $('warnings').replaceChildren();
    (inspection.warnings || []).forEach((warning) => $('warnings').append(el('li', '', typeof warning === 'string' ? warning : warning.message || warning.description || JSON.stringify(warning))));
    $('warnings-section').hidden = !inspection.warnings?.length;
    updateSearch();
  }

  function updateSearch() {
    const query = $('field-search').value.trim().toLocaleLowerCase();
    let matches = 0;
    const perView = { states: 0, rules: 0, effects: 0 };
    model.fieldNodes.forEach(({ card, field, view }) => {
      const haystack = [field.id, field.label, field.group, field.help, valueFor(field), ...(field.bindings || []).flatMap((binding) => [binding.location, binding.role, binding.code])].filter((value) => value !== undefined && value !== null).join(' ').toLocaleLowerCase();
      const match = !query || haystack.includes(query);
      card.hidden = !match;
      if (match) { matches += 1; perView[view] += 1; }
    });
    document.querySelectorAll('.field-group').forEach((group) => { group.hidden = ![...group.querySelectorAll('.field-card')].some((card) => !card.hidden); });
    document.querySelectorAll('.state-row').forEach((row) => {
      const cards = [...row.querySelectorAll('.field-card')];
      row.hidden = Boolean(query) && !cards.some((card) => !card.hidden);
    });
    $('search-result').textContent = query ? `현재 상태 정의의 편집 항목 ${matches}/${fields().length}개 · 상태표 ${perView.states} · 전환·이력 ${perView.rules} · 연결 효과 ${perView.effects}` : `현재 상태 정의의 편집 가능한 ${fields().length}개 항목 · 실제 소스 값 기준`;
  }

  function renderTargets(snapshot) {
    $('target-select').replaceChildren();
    $('target-checks').replaceChildren(el('legend', 'sr-only', '적용할 설치본 선택'));
    const available = new Set(snapshot.targets.filter((target) => target.available !== false).map((target) => target.id));
    model.selected = new Set([...model.selected].filter((id) => available.has(id)));
    snapshot.targets.forEach((target) => {
      const option = el('option', '', `${target.label}${target.available === false ? ' · 확인 불가' : ''}`);
      option.value = target.id;
      option.disabled = target.available === false;
      $('target-select').append(option);
      const label = el('label', 'target-option');
      const input = el('input');
      input.type = 'checkbox';
      input.name = 'apply-target';
      input.value = target.id;
      input.checked = model.selected.has(target.id);
      input.disabled = target.available === false;
      const copy = el('span', 'target-option-copy');
      copy.append(el('strong', '', target.label), el('span', '', target.available === false ? 'QSP를 확인할 수 없음' : target.id === snapshot.target.id ? '현재 불러온 원본' : '이 설치본도 함께 검사'));
      label.append(input, copy);
      label.title = target.path;
      $('target-checks').append(label);
      input.addEventListener('change', () => {
        if (input.checked) model.selected.add(target.id);
        else model.selected.delete(target.id);
        invalidatePreview('적용할 설치본이 바뀌었습니다. 미리보기를 다시 실행하세요.');
        status(`적용할 설치본 ${model.selected.size}개 선택 · 변경 미리보기가 필요합니다.`);
      });
    });
    $('target-select').value = snapshot.target.id;
    $('source-path').textContent = snapshot.target.path;
    $('source-hash').textContent = snapshot.target.hash;
    $('source-loaded').textContent = `${formatDate(new Date())}에 원본에서 읽음`;
  }

  function formatDate(date) {
    const value = new Date(date);
    return Number.isNaN(value.getTime()) ? String(date || '') : value.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  function renderHistory(history) {
    $('transactions').replaceChildren();
    if (!history?.length) return empty($('transactions'), '아직 적용·복원 이력이 없습니다.');
    [...history].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).forEach((transaction) => {
      const card = el('article', 'transaction-card');
      const top = el('div', 'transaction-top');
      const labels = { applied: '적용 완료', restored: '복원 완료', no_op: '변경 없음', rolled_back: '적용 취소 완료', partial: '일부 적용 · 복원 필요', applying: '적용 중단 · 확인 필요', restoring: '복원 중단 · 확인 필요', rollback_failed: '적용 취소 실패 · 복원 필요', failed: '실패', pending: '진행 중', prepared: '검증 완료', recovered: '복구 완료' };
      top.append(el('strong', '', labels[transaction.status] || transaction.status || '기록'), el('time', '', formatDate(transaction.createdAt)));
      card.append(top, el('code', '', transaction.id), el('p', '', (transaction.targets || []).map((target) => target.label || target.id).join(' · ')));
      if (transaction.error) card.append(el('p', '', transaction.error));
      const actions = el('div', 'transaction-actions');
      const exportButton = el('button', 'button small', '패치 JSON 내보내기');
      exportButton.type = 'button';
      exportButton.dataset.action = 'export';
      exportButton.addEventListener('click', () => run(() => exportPatch(transaction.id), '패치 JSON을 준비합니다.'));
      actions.append(exportButton);
      if (['applied', 'partial', 'applying', 'restoring', 'rollback_failed'].includes(transaction.status) && !transaction.restored && !transaction.restoreOf && transaction.kind !== 'restore' && transaction.type !== 'restore') {
        const restoreButton = el('button', 'button small danger', '이 적용 복원');
        restoreButton.type = 'button';
        restoreButton.dataset.action = 'restore';
        restoreButton.dataset.transactionId = transaction.id;
        restoreButton.addEventListener('click', () => run(async () => {
          const result = await post('/api/restore', { id: transaction.id });
          invalidatePreview('복원 후 원본이 바뀌었습니다. 변경 내용을 다시 확인하세요.');
          await loadState(model.snapshot.target.id);
          status(`복원 완료 · ${(result.targets || []).map((target) => target.label || target.id).join(' · ') || transaction.id}`);
        }, '현재 원본을 검사하고 백업으로 복원합니다.'));
        actions.append(restoreButton);
      }
      card.append(actions);
      $('transactions').append(card);
    });
  }

  function releaseIcons() {
    model.icons.forEach((promise) => promise.then((url) => { if (url) URL.revokeObjectURL(url); }));
    model.icons.clear();
  }

  function adoptSnapshot(snapshot) {
    releaseIcons();
    model.generation += 1;
    model.snapshot = snapshot;
    model.drafts.clear();
    model.preview = null;
    renderTargets(snapshot);
    renderDefinitions(snapshot);
    renderHistory(snapshot.history);
    invalidatePreview('적용할 설치본을 선택하고 변경 미리보기 또는 저장 캐시 갱신 후보를 실행하세요.');
  }

  async function loadState(id = 'work') {
    const snapshot = await api(`/api/state?target=${encodeURIComponent(id)}`);
    adoptSnapshot(snapshot);
    return snapshot;
  }

  function renderPreview(preview, { cacheRefresh = false } = {}) {
    const root = $('preview-result');
    root.replaceChildren();
    const heading = el('div', 'preview-heading');
    heading.append(el('p', '', `${cacheRefresh ? '저장 캐시 갱신 후보 · ' : ''}검사 완료 · 설치본 ${preview.targets.length}개 · 변경 ${preview.changeCount}개`));
    const exportButton = el('button', 'button small', '후보 패치 JSON 내보내기');
    exportButton.type = 'button';
    exportButton.dataset.action = 'export';
    exportButton.addEventListener('click', () => run(() => exportPatch(preview.id), '후보 패치 JSON을 준비합니다.'));
    heading.append(exportButton);
    root.append(heading);
    preview.targets.forEach((target) => {
      const card = el('article', 'preview-target');
      card.append(el('h3', '', target.label), el('code', 'preview-target-path', target.path));
      const comparison = el('div', 'hash-comparison');
      [['검사한 원본', target.beforeHash], ['적용할 후보', target.afterHash]].forEach(([label, hash]) => {
        const line = el('p');
        line.append(document.createTextNode(label + ' · '), el('code', '', hash));
        comparison.append(line);
      });
      card.append(comparison);
      (target.changes || []).forEach((change) => {
        const item = el('div', 'change-card');
        item.append(el('h4', '', change.label));
        const values = el('div', 'value-comparison');
        const before = el('div', 'change-value before');
        before.append(el('span', 'change-label', '원본'), document.createTextNode(String(change.before)));
        const after = el('div', 'change-value after');
        after.append(el('span', 'change-label', '후보'), document.createTextNode(String(change.after)));
        values.append(before, el('span', 'value-arrow', '→'), after);
        item.append(values);
        if (change.bindings?.length) item.append(bindingsList(change.bindings));
        card.append(item);
      });
      if (!target.changes?.length) card.append(el('p', 'field-help', '이 설치본에는 변경할 값이 없습니다.'));
      root.append(card);
    });
  }

  async function exportPatch(id) {
    const patch = await api(`/api/export?id=${encodeURIComponent(id)}`);
    const blob = new Blob([JSON.stringify(patch, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = el('a');
    link.href = url;
    link.download = `JO9-state-${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('선택한 기록의 선언형 패치 JSON을 내보냈습니다.');
  }

  $('target-select').addEventListener('change', () => {
    const id = $('target-select').value;
    invalidatePreview('불러올 설치본이 바뀌었습니다. 원본을 다시 확인합니다.');
    run(async () => {
      try {
        await loadState(id);
        status(`${model.snapshot.target.label}에서 상태 정의와 원본 해시를 불러왔습니다.`);
      } catch (error) {
        $('target-select').value = model.snapshot?.target.id || '';
        throw error;
      }
    }, '선택한 설치본에서 상태 정의를 읽습니다.');
  });
  $('field-search').addEventListener('input', updateSearch);
  $('reload-source').addEventListener('click', () => {
    invalidatePreview('원본을 새로 읽었습니다. 변경 내용을 다시 확인하세요.');
    run(async () => {
      await loadState(model.snapshot.target.id);
      status(`${model.snapshot.target.label}의 최신 원본과 상태 정의를 다시 읽었습니다.`);
    }, '최신 원본에서 상태 정의와 해시를 읽습니다.');
  });
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  $('preview-button').addEventListener('click', () => run(async () => {
    invalidatePreview('선택한 설치본별 원본과 변경 위치를 검사합니다.');
    const preview = await post('/api/preview', { sourceId: model.snapshot.target.id, hashes: hashes(), targetIds: [...model.selected], edits: edits() });
    model.preview = preview;
    renderPreview(preview);
    switchView('review', true);
    status(preview.changeCount ? `미리보기 완료 · ${preview.targets.map((target) => target.label).join(' · ')} · 변경 ${preview.changeCount}개` : '검사 완료 · 원본과 같은 값이므로 적용할 변경이 없습니다.');
  }, '선택한 설치본을 검사하고 변경 후보를 생성합니다.'));
  $('cache-preview-button').addEventListener('click', () => run(async () => {
    invalidatePreview('선택한 설치본별 원본과 저장 캐시 갱신 위치를 검사합니다.');
    const preview = await post('/api/cache-preview', { sourceId: model.snapshot.target.id, hashes: hashes(), targetIds: [...model.selected], edits: edits() });
    model.preview = preview;
    renderPreview(preview, { cacheRefresh: true });
    switchView('review', true);
    status(`저장 캐시 갱신 후보 생성 완료 · ${preview.targets.map((target) => target.label).join(' · ')} · 변경 ${preview.changeCount}개 · 비교 후 적용하세요.`);
  }, '현재 입력값과 저장 캐시 갱신을 함께 검사하고 후보를 생성합니다.'));
  $('apply-button').addEventListener('click', () => run(async () => {
    if (!model.preview) return;
    const sourceId = model.snapshot.target.id;
    let result;
    try {
      result = await post('/api/apply', { previewId: model.preview.id });
    } catch (error) {
      try {
        const latest = await api(`/api/state?target=${encodeURIComponent(sourceId)}`);
        renderHistory(latest.history);
      } catch { /* Keep the original apply error visible if the source cannot be read. */ }
      switchView('review');
      throw error;
    }
    invalidatePreview('적용 후 원본이 바뀌었습니다. 새로운 변경은 다시 미리보기 하세요.');
    await loadState(sourceId);
    switchView('review');
    status(`적용 완료 · ${(result.targets || []).map((target) => target.label || target.id).join(' · ')} · 적용 이력에서 복원할 수 있습니다.`);
  }, '원본 해시를 다시 검사하고 백업과 적용 기록을 생성합니다.'));
  $('save-project').addEventListener('click', () => run(async () => {
    const result = await post('/api/project', { sourceId: model.snapshot.target.id, hashes: hashes(), edits: edits() });
    status(`프로젝트 저장 완료 · 변경 ${result.project?.edits?.length ?? edits().length}개 · ${formatDate(result.project?.savedAt || new Date())}`);
  }, '현재 편집 내용을 프로젝트에 저장합니다.'));
  $('load-project').addEventListener('click', () => run(async () => {
    invalidatePreview('프로젝트를 불러온 뒤 미리보기를 다시 실행하세요.');
    const { project } = await api('/api/project');
    if (!project) { status('저장된 프로젝트가 없습니다.'); return; }
    const snapshot = await api(`/api/state?target=${encodeURIComponent(project.sourceId)}`);
    const currentHashes = hashes(snapshot);
    const stale = Object.entries(project.hashes || {}).find(([id, hash]) => currentHashes[id] !== hash);
    if (stale) {
      const error = new Error(`저장한 프로젝트와 ${snapshot.targets.find((target) => target.id === stale[0])?.label || stale[0]}의 원본 해시가 다릅니다. 현재 설치본을 다시 불러와 변경 내용을 확인하세요.`);
      error.status = 409;
      throw error;
    }
    if (project.featureId !== snapshot.inspection.feature.id) throw new Error('현재 등록된 상태 체계와 다른 프로젝트입니다.');
    for (const edit of project.edits || []) {
      const field = fields(snapshot).find((item) => item.id === edit.id);
      if (!field || (field.kind === 'number' ? typeof edit.value !== 'number' || !Number.isFinite(edit.value) : typeof edit.value !== 'string')) throw new Error(`프로젝트의 편집 항목을 확인할 수 없습니다: ${edit.id}`);
    }
    adoptSnapshot(snapshot);
    for (const edit of project.edits || []) {
      const node = model.fieldNodes.get(edit.id);
      node.input.value = String(edit.value);
      node.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    invalidatePreview('프로젝트를 불러왔습니다. 적용할 설치본을 선택하고 미리보기를 실행하세요.');
    switchView('states');
    status(`프로젝트 불러오기 완료 · ${snapshot.target.label} · 변경 ${edits().length}개${invalidFields().length ? ` · 입력 확인 ${invalidFields().length}개` : ''}`);
  }, '저장된 프로젝트와 현재 원본 해시를 확인합니다.'));

  if (!token || token === '__JO9_TOKEN__') {
    status('세션 토큰을 확인할 수 없습니다. 편집기 서버 주소에서 페이지를 다시 여세요.', 'error');
    $('load-project').disabled = true;
  } else {
    run(async () => {
      await loadState();
      status(`${model.snapshot.target.label} 원본에서 ${fields().length}개 편집 항목을 읽었습니다. 적용할 설치본을 선택해 작업을 시작하세요.`);
    }, '실제 QSP에서 상태 정의와 소스 연결을 읽습니다.');
  }
  window.addEventListener('beforeunload', releaseIcons);
})();
