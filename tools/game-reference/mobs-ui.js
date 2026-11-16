'use strict';
function setupMobs(panel, tab, set) {
  const add = (parent, tag, text, className) => {
    const el = parent.appendChild(document.createElement(tag));
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const norm = value => String(value ?? '').normalize('NFKC').toLowerCase();
  const order = new Intl.Collator('ko', { numeric: true });
  const form = panel.querySelector('form'), search = form.querySelector('input');
  const state = form.querySelector('[name=state]'), category = form.querySelector('[name=category]'), sort = form.querySelector('[name=sort]');
  const count = panel.querySelector('.count'), body = panel.querySelector('tbody'), detail = panel.querySelector('.mob-detail');
  const indexed = set.rows.map(row => ({ row, terms: norm(JSON.stringify(row)) }));
  let selectedId = null;
  tab.querySelector('span').textContent = set.rows.length.toLocaleString('ko');
  for (const value of [...new Set(set.rows.map(row => row.category))].sort(order.compare)) category.add(new Option(value, value));
  panel.querySelector('.coverage').textContent = `현재 WORK QSP 정의 ${set.definedCount}종 + 미구현 기획 ${set.rows.length - set.definedCount}종 · 기준 QSP ${set.hash.slice(0, 12)}. 기본 정의값이며 전투 중 변화나 승률을 뜻하지 않습니다.`;

  function showDetail(row, focus = false) {
    selectedId = row.id;
    detail.hidden = false;
    detail.replaceChildren();
    detail.className = 'enemy-card mob-detail' + (row.planned ? ' mob-planned' : '');
    add(detail, 'h3', `${row.name} · ${row.state}`);
    add(detail, 'p', row.identity || row.id, 'ref');
    add(detail, 'p', `체력 ${row.stats[0]} · 스태미나 ${row.stats[1]} · 사기 ${row.stats[2]} · 기본 피해 ${row.stats[3]}`, 'enemy-stats');
    add(detail, 'p', row.comparison, 'coverage');
    add(detail, 'p', '방어 특성: ' + (row.flags.length ? row.flags.join(' / ') : '별도 활성 특성 없음'));
    add(detail, 'p', '저항·약점: ' + (row.resistance.length ? row.resistance.join(', ') : row.resistanceDefined ? '모두 0' : '별도 설정 없음'));
    add(detail, 'p', '특수능력: ' + (row.skills.length ? row.skills.join(' / ') : '별도 정의 없음'));
    if (row.rules.length) {
      const rules = add(detail, 'details');
      add(rules, 'summary', row.planned ? '확정 기획 · 전투·회복·결투 규칙' : '실제 연결된 전투·회복·승계·영입 규칙');
      const list = add(rules, 'ul');
      for (const rule of row.rules) add(list, 'li', rule);
    }
    if (!row.planned) {
      const attacks = add(detail, 'details');
      add(attacks, 'summary', `공격 정보 · 일반 ${row.attacks.length}개 / 특수 ${row.supers.length}개`);
      const list = add(attacks, 'ul');
      for (const attack of row.attacks) add(list, 'li', `일반 ${attack.slot}: ${attack.type} / ${attack.damageType} · 페널티 ${attack.penalty} · 보너스 ${attack.bonus} · 지속값 ${attack.duration}`);
      for (const skill of row.supers) add(list, 'li', `${skill.name} · 특수 ${skill.slot}: ${skill.type} / ${skill.damageType} ${skill.damage} · ${skill.effects.map(e => `${e.target} ${e.name} ${e.value}`).join(' / ') || '별도 부가상태 없음'} · ${skill.linkedHard ? '하드 전용 · 기술별 전투당 1회' : '현재 AI 연결 재확인 필요'}`);
      add(detail, 'p', '일반공격 부가상태의 연결 누락 등 실제 작동 상태는 아래 주의사항과 기존 적 전투 특성 탭을 함께 확인하세요.', 'coverage');
    }
    if (row.notes.length) {
      const notes = add(detail, 'details');
      add(notes, 'summary', '작동 상태와 주의사항');
      const list = add(notes, 'ul');
      for (const note of row.notes) add(list, 'li', note);
    }
    add(detail, 'p', `자료 출처: ${row.source}${row.ai ? ' · AI ' + row.ai : ''}`, 'ref');
    if (focus) detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function render() {
    const words = norm(search.value).trim().split(/\s+/).filter(Boolean);
    const selected = indexed.filter(({ row, terms }) => (!state.value || (row.planned ? 'planned' : 'defined') === state.value)
      && (!category.value || row.category === category.value) && words.every(word => terms.includes(word)));
    selected.sort((a, b) => sort.value === 'name' ? order.compare(a.row.name, b.row.name)
      : b.row.stats[Number(sort.value)] - a.row.stats[Number(sort.value)] || order.compare(a.row.name, b.row.name));
    const frag = document.createDocumentFragment();
    for (const { row } of selected) {
      const tr = add(frag, 'tr');
      if (row.planned) tr.className = 'mob-planned';
      const identity = add(tr, 'td'); identity.dataset.label = 'MOB';
      const button = add(identity, 'button', row.name, 'mob-name'); button.type = 'button';
      button.setAttribute('aria-label', row.name + ' 상세 보기');
      button.addEventListener('click', () => showDetail(row, true));
      add(identity, 'span', row.state, 'ref');
      add(identity, 'span', row.id, 'ref');
      const values = [row.category, ...row.stats];
      const labels = ['분류', '체력', '스태미나', '사기', '기본 피해'];
      for (let i = 0; i < values.length; i++) add(tr, 'td', String(values[i])).dataset.label = labels[i];
    }
    if (!selected.length) add(add(frag, 'tr'), 'td', '조건에 맞는 MOB이 없습니다.').colSpan = 6;
    body.replaceChildren(frag);
    if (!selected.length) {
      selectedId = null;
      detail.replaceChildren();
      detail.hidden = true;
    } else if (!selected.some(({ row }) => row.id === selectedId)) showDetail(selected[0].row);
    count.textContent = `${selected.length}종 표시 / QSP 정의 ${set.definedCount}종 + 미구현 기획 ${set.rows.length - set.definedCount}종`;
  }
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  form.addEventListener('reset', event => { event.preventDefault(); search.value = ''; state.value = ''; category.value = ''; sort.value = 'name'; render(); });
  showDetail(set.rows.find(row => row.id === 'chunhyang') || set.rows[0]);
  render();
}
