(function () {
  'use strict';
  const box = document.getElementById('variableBox');
  const result = document.getElementById('variableResult');
  const status = document.getElementById('variableStatus');
  const count = document.getElementById('variableCount');
  let selected = null, data = null, revision = 0, loading = false;
  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  function source(row) {
    const item = node('div', undefined, 'variableSource');
    item.append(node('div', `${row.location || selected.location} · ${row.line || '?'}행${row.kind === 'deferred' ? ' · 지연 실행 코드' : ''}`, 'muted'));
    if (row.conditions?.length) item.append(node('div', '조건: ' + row.conditions.join(' → '), 'muted'));
    item.append(node('pre', row.code));
    return item;
  }
  function render(value) {
    result.replaceChildren();
    document.getElementById('variableCopy').disabled = false;
    count.textContent = `· ${value.variables.length}개`;
    const scope = value.scope;
    status.textContent = `${scope.location} / ${scope.title} · 읽기 전용`;
    result.append(node('p', value.notice || 'QSP 원문에서 찾은 코드입니다. 세이브의 실제 변수값은 표시하지 않습니다.', 'muted'));
    if (value.substitutions.length) {
      const group = node('div');
      group.append(node('h3', '선택한 대사의 치환 코드'));
      for (const substitution of value.substitutions) group.append(node('pre', substitution.code));
      result.append(group);
    }
    if (value.conditions.length) {
      const group = node('div');
      group.append(node('h3', '대사·장면의 조건 코드'));
      for (const condition of value.conditions) group.append(source(condition));
      result.append(group);
    }
    if (!value.variables.length) result.append(node('p', '이 대사와 장면에서 확인되는 변수 코드가 없습니다.', 'muted'));
    for (const variable of value.variables) {
      const item = node('details', undefined, 'variableItem');
      item.append(node('summary', `${variable.name} · ${variable.type === 'string' ? '문자열' : '숫자'} 변수`));
      if (variable.uses.length) {
        item.append(node('h3', '이 장면에서 쓰는 코드'));
        for (const use of variable.uses) item.append(source(use));
      }
      if (variable.definitions.length) {
        item.append(node('h3', '원문 설정 후보'));
        for (const definition of variable.definitions) item.append(source(definition));
        if (variable.definitionTotal > variable.definitions.length) item.append(node('p', `전체 ${variable.definitionTotal}곳 중 ${variable.definitions.length}곳 표시. 배열은 같은 이름의 다른 인덱스 설정도 포함합니다.`, 'muted'));
      } else item.append(node('p', '직접 대입하는 설정 코드를 찾지 못했습니다. 다른 호출이나 동적 코드에서 정해질 수 있습니다.', 'muted'));
      result.append(item);
    }
  }
  async function load() {
    if (!selected || data || loading || !box.open) return;
    const request = selected, expected = revision;
    loading = true;
    status.textContent = '관련 변수 코드를 읽고 있습니다.';
    try {
      const value = await api('/api/variables', {selection: request.selection, sceneId: request.scene.id, mode: request.mode, usageId: request.flow?.usage?.id});
      if (revision !== expected) return;
      data = value;
      render(value);
    } catch (error) {
      if (revision === expected) status.textContent = error.message;
    } finally {
      if (revision === expected) loading = false;
    }
  }
  box.addEventListener('toggle', load);
  window.JO9_VARIABLE_SELECT = function (context) {
    selected = context?.selection ? context : null;
    revision++;
    loading = false;
    data = null;
    result.replaceChildren();
    document.getElementById('variableCopy').disabled = true;
    count.textContent = '';
    status.textContent = selected ? '펼치면 선택한 대사와 장면의 관련 코드를 확인할 수 있습니다.' : '대사를 먼저 선택하세요.';
    load();
  };
  document.getElementById('variableCopy').onclick = async () => {
    if (!data) return;
    const lines = [status.textContent, data.notice, ...data.substitutions.map(s => s.code), ...data.conditions.map(r => `${r.location}:${r.line}\n${r.code}`)];
    for (const variable of data.variables) {
      lines.push(`\n${variable.name}`);
      for (const row of [...variable.uses, ...variable.definitions]) lines.push(`${row.location}:${row.line}${row.kind === 'deferred' ? ' (지연 실행)' : ''}${row.conditions?.length ? '\n조건: ' + row.conditions.join(' → ') : ''}\n${row.code}`);
    }
    try { await navigator.clipboard.writeText(lines.filter(Boolean).join('\n')); status.textContent = '변수 확인 내용을 복사했습니다. 원하는 변경을 함께 적어 전달하세요.'; }
    catch { status.textContent = '클립보드 접근이 막혔습니다. 코드에서 필요한 부분을 직접 복사해 주세요.'; }
  };
  window.JO9_VARIABLE_SELECT(context);
})();
