'use strict';
function setupEnemies(panel, tab, set) {
  const add = (parent, tag, text, className) => {
    const el = parent.appendChild(document.createElement(tag));
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const fold = (parent, title) => {
    const details = add(parent, 'details');
    add(details, 'summary', title);
    return details;
  };
  const form = panel.querySelector('form');
  const search = panel.querySelector('input');
  const select = panel.querySelector('select');
  const count = panel.querySelector('.count');
  const list = panel.querySelector('.enemy-list');
  const norm = value => String(value ?? '').normalize('NFKC').toLowerCase();
  const order = new Intl.Collator('ko', { numeric: true });
  const indexed = set.rows.map(row => ({ row, terms: norm(JSON.stringify(row)) }))
    .sort((a, b) => order.compare(a.row.name, b.row.name) || order.compare(a.row.id, b.row.id));
  const useLabel = (row, special) => special.linkedHard ? '하드 전용 · 기술별 1회' : row.aiMissing ? '지정 AI 미연결' : '정의만 있음';
  const effectLabel = special => special.effects.map(effect => `${effect.target} ${effect.name} ${effect.value}`).join(' / ') || '별도 부가상태 없음';
  tab.querySelector('span').textContent = indexed.length.toLocaleString('ko');
  panel.querySelector('.coverage').textContent = set.coverage + ' · 기준 QSP ' + set.hash.slice(0, 12);
  panel.querySelector('.enemy-warning').textContent = set.hardSpecialsEnabled
    ? '특수공격은 게임 중 하드에서만 사용합니다. 일반공격 부가상태의 기존 연결 누락은 별도 항목으로 남아 있습니다.'
    : '특수공격은 정의되어 있지만 현재 AI 선택 경로에 연결되지 않았습니다. 일반공격 부가상태에도 연결 누락이 있습니다.';
  if (!set.auditCurrent) panel.querySelector('.enemy-warning').textContent += ' 연결 상태 설명은 현재 QSP 버전에 재확인이 필요합니다.';
  for (const category of [...new Set(set.rows.map(row => row.category))].sort(order.compare)) select.add(new Option(category, category));
  const guide = panel.querySelector('.enemy-guide');
  const flags = fold(guide, '방어 특성 5종과 활성 적 수');
  const flagList = add(flags, 'ul');
  for (const flag of set.flagGuide) add(flagList, 'li', `${flag.name} (${flag.count}종): ${flag.description}`);
  add(flags, 'p', '속성 수치는 백분율이 아닌 고정 피해 가감입니다. 음수는 감소, 양수는 추가 피해이며 최종 최소 피해 처리는 남습니다.', 'coverage');
  const statuses = fold(guide, '일반공격 부가상태의 뜻');
  const statusList = add(statuses, 'ul');
  for (const status of set.statusGuide) add(statusList, 'li', `${status.name}: ${status.effect}`);
  const notes = fold(guide, '현재 작동 상태와 주의사항');
  const noteList = add(notes, 'ul');
  for (const note of set.notes) add(noteList, 'li', note);

  const skills = fold(guide, '특수공격 기술표');
  skills.className = 'enemy-skill-guide';
  add(skills, 'p', '같은 효과 구성의 기술은 이름을 공유합니다. 피해량·지속값은 사용자마다 다를 수 있습니다. 검색 버튼으로 기술명이나 사용자를 찾을 수 있습니다.', 'coverage');
  const skillTable = add(skills, 'table');
  skillTable.className = 'enemy-special-table';
  const cols = add(skillTable, 'colgroup');
  for (const width of ['17%', '22%', '15%', '32%', '14%']) add(cols, 'col').style.width = width;
  const headings = ['기술명', '사용하는 적 · 기술 번호', '공격 · 기본 피해', '부가효과 · 지속 카운터', '사용 조건'];
  const head = add(add(skillTable, 'thead'), 'tr');
  for (const label of headings) add(head, 'th', label).scope = 'col';
  const skillBody = add(skillTable, 'tbody');

  function render() {
    const words = norm(search.value).trim().split(/\s+/).filter(Boolean);
    const selected = indexed.filter(({ row, terms }) => (!select.value || row.category === select.value) && words.every(word => terms.includes(word)));
    const skillEntries = selected.flatMap(({ row }) => row.supers.map(special => ({ row, special }))).filter(({ row, special }) => {
      const { supers, attacks, ...identity } = row;
      const terms = norm(JSON.stringify(identity) + ' ' + JSON.stringify(special));
      return words.every(word => terms.includes(word));
    });
    skills.querySelector('summary').textContent = `특수공격 기술표 · ${skillEntries.length}개 / 이름 ${new Set(skillEntries.map(x => x.special.name)).size}종`;
    const skillFrag = document.createDocumentFragment();
    for (const { row, special } of skillEntries) {
      const tr = add(skillFrag, 'tr');
      const values = [special.name, `${row.name} 특수 ${special.slot}`, `${special.type} / ${special.damageType} ${special.damage}`, effectLabel(special), useLabel(row, special)];
      for (let i = 0; i < values.length; i++) {
        const cell = add(tr, 'td', values[i]);
        cell.dataset.label = headings[i];
      }
      tr.title = `${row.id} · ${special.source}`;
    }
    if (!skillEntries.length) {
      const empty = add(add(skillFrag, 'tr'), 'td', '선택한 조건에 해당하는 특수공격이 없습니다.');
      empty.colSpan = headings.length;
    }
    skillBody.replaceChildren(skillFrag);

    const frag = document.createDocumentFragment();
    for (const { row } of selected) {
      const card = add(frag, 'article', undefined, 'enemy-card');
      add(card, 'h3', `${row.name} · ${row.category}`);
      add(card, 'p', row.id, 'ref');
      add(card, 'p', `체력 ${row.stats[0]} · 스태미나 ${row.stats[1]} · 사기 ${row.stats[2]} · 기본 피해 ${row.stats[3]}`, 'enemy-stats');
      add(card, 'p', '방어 특성: ' + (row.flags.length ? row.flags.join(' / ') : row.flagsDefined ? '활성 플래그 없음' : '별도 설정 없음'));
      add(card, 'p', '저항·약점: ' + (row.resistance.length ? row.resistance.join(', ') : row.resistanceDefined ? '모두 0' : '별도 설정 없음'));
      if (row.supers.length) add(card, 'p', '특수공격: ' + row.supers.map(special => special.name).join(' / '));
      for (const warning of row.warnings) add(card, 'p', warning, 'enemy-warning');
      const attacks = fold(card, `공격 정의 보기 · 일반 ${row.attacks.length}개 / 특수 ${row.supers.length}개`);
      const attackList = add(attacks, 'ul');
      for (const attack of row.attacks) {
        const available = row.hardAiFallback ? '하드에서 공통 AI로 사용' : row.aiMissing ? '지정 AI 없음' : attack.available ? '기본 AI 선택 범위' : '현재 AI 선택 범위 밖';
        add(attackList, 'li', `일반 ${attack.slot}: ${attack.type} / ${attack.damageType} · ${available}. 부가상태 정의(${set.auditCurrent ? '현재 적용 누락' : '현재 연결 재확인 필요'}): 페널티 ${attack.penalty}, 보너스 ${attack.bonus}, 지속값 ${attack.duration}.`);
      }
      for (const special of row.supers) {
        add(attackList, 'li', `${special.name} · ${row.name} 특수 ${special.slot}: ${special.type} / ${special.damageType} / 기본 피해 ${special.damage}. ${effectLabel(special)}. ${useLabel(row, special)}.`);
      }
      add(attacks, 'p', '특수공격 상태값은 피해량이나 확률이 아닌 상태 카운터 대입값입니다.', 'coverage');
      add(card, 'p', `코드 출처 ${row.source} · AI ${row.ai}`, 'ref');
    }
    if (!selected.length) add(frag, 'p', '조건에 맞는 적이 없습니다.');
    list.replaceChildren(frag);
    count.textContent = `${selected.length.toLocaleString('ko')}종 표시 / 전체 ${indexed.length.toLocaleString('ko')}종`;
  }
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  form.addEventListener('reset', event => { event.preventDefault(); search.value = ''; select.value = ''; render(); });
  render();
}
