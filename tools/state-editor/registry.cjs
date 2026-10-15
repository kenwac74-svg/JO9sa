'use strict';
const core = require('../text-workshop/core.cjs');
const ROLES = ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4'];
const CACHE_BEGIN = '! JO9_STATE_EDITOR_LABEL_CACHE_BEGIN';
const CACHE_END = '! JO9_STATE_EDITOR_LABEL_CACHE_END';
const GENERATION_ID = 'generation.milf.state';
const GENERATION_CODE_ID = 'generation.type.code';
const GENERATION_ANCHOR = '!PREPARE TRAIT LIST FOR DISPLAY (NOT EVERYTHING IS VISIBLE BEFORE ACQUISITION)';
const GENERATION_BEGIN = '! JO9_STATE_EDITOR_TYPE_INITIAL_BEGIN';
const GENERATION_END = '! JO9_STATE_EDITOR_TYPE_INITIAL_END';
const LEGACY_GENERATION_BEGIN = '! JO9_STATE_EDITOR_MILF_INITIAL_BEGIN';
const LEGACY_GENERATION_END = '! JO9_STATE_EDITOR_MILF_INITIAL_END';
const quote = text => text.replace(/'/g, "''");
const unquote = text => text.replace(/''/g, "'");
const escapeRE = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function error(message) { throw Error(message); }
function once(text, regex, label) {
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g'))];
  if (matches.length !== 1) error(`${label}: 연결 누락 또는 여러 연결이 있습니다 (${matches.length}).`);
  return matches[0];
}
function lineAt(text, at) { return text.slice(0, at).split('\n').length; }
function sourceBinding(source, start, end, extra = {}) {
  const line = lineAt(source.body, start), code = source.body.split('\n')[line - 1];
  return { location: source.name, field: 'body', line, ...extra, code, _source: source, _start: start, _end: end };
}
function publicBinding(binding) {
  const { _source, _start, _end, ...value } = binding;
  return value;
}
function captured(source, match, capture, extra = {}) {
  const start = match.index + match[0].lastIndexOf(match[capture]);
  return sourceBinding(source, start, start + match[capture].length, extra);
}
function cacheGuard(source) {
  if (!source) error('저장 캐시 갱신 위치 $newloc가 없습니다.');
  const start = once(source.body, /^([ \t]*)if jo9_meiki_revision < (\d+):\s*$/gm, '캐시 갱신 조건');
  const assignment = once(source.body, /^[ \t]*jo9_meiki_revision = (\d+)[ \t]*$/gm, '캐시 갱신 버전');
  if (Number(start[2]) !== Number(assignment[1])) error('캐시 갱신 버전이 일치하지 않습니다.');
  const tail = source.body.slice(start.index), end = /^[ \t]*end[ \t]*$/m.exec(tail);
  if (!end) error('캐시 갱신 가드 끝을 확인할 수 없습니다.');
  const stop = start.index + end.index, block = source.body.slice(start.index, stop);
  if (!/^\s*gs '#static_base'\s*$/m.test(block) || !/^\s*gs '#dynamic'\s*$/m.test(block) || assignment.index <= start.index || assignment.index >= stop) error('기존 캐시 갱신 정의 연결을 확인할 수 없습니다.');
  const statements = block.split(/\r?\n/).slice(1).map(line => line.trim()).filter(line => line && !line.startsWith('!'));
  if (statements.some(line => !/^(?:jo9_meiki_revision = \d+|gs '#(?:static_base|dynamic)'|\$virginity\[[0-4]\] = '(?:''|[^'\r\n])*')$/.test(line)) || statements.filter(line => line === "gs '#static_base'").length !== 1 || statements.filter(line => line === "gs '#dynamic'").length !== 1) error('캐시 갱신 가드에 확인되지 않은 조건 또는 코드가 있습니다.');
  if (Number(start[2]) > 2147483646) error('캐시 갱신 버전 범위를 초과했습니다.');
  return { start, assignment, stop, value: Number(start[2]) };
}
function generationBinding(source) {
  const anchor = once(source.body, new RegExp(`^${escapeRE(GENERATION_ANCHOR)}\\r?$`, 'gm'), '유형별 생성 초기값 앵커');
  const clear = once(source.body, /^dynamic \$clear_slave_instance, 'stock'[^\r\n]*/gm, '신규 stock 생성 연결');
  const preset = once(source.body, /^gs 'get_stock_seed'[^\r\n]*/gm, '생성 시드 연결');
  const traits = once(source.body, /^gs '\$stock_traits'[^\r\n]*/gm, '생성 특성목록 연결');
  const price = once(source.body, /^gs '\$slave_price', 'stock'[^\r\n]*/gm, '생성 가격 연결');
  const reset = once(source.body, /^special_stock = 0[ \t]*$/gm, '생성 종료 연결');
  if (clear.index >= anchor.index || preset.index >= anchor.index || traits.index <= anchor.index || price.index <= traits.index || reset.index <= price.index || /stock\[['"]virginity['"]\]\s*=/.test(source.body.slice(anchor.index))) error('유형별 생성 초기값 연결의 기존 처리 순서를 확인할 수 없습니다.');
  const markers = [...source.body.matchAll(/^[ \t]*![^\r\n]*JO9_STATE_EDITOR_(?:MILF|TYPE)_INITIAL[^\r\n]*/gm)];
  let blockStart = anchor.index, blockEnd = anchor.index, value = -1, typeCode = '', binding = sourceBinding(source, anchor.index, anchor.index + anchor[0].length);
  if (markers.length) {
    const legacy = markers[0][0] === LEGACY_GENERATION_BEGIN;
    const begin = legacy ? LEGACY_GENERATION_BEGIN : GENERATION_BEGIN, end = legacy ? LEGACY_GENERATION_END : GENERATION_END;
    if (markers.length !== 2 || markers[0][0] !== begin || markers[1][0] !== end) error('유형별 생성 초기값 블록 마커가 중복되거나 손상되었습니다.');
    blockStart = markers[0].index;
    const block = source.body.slice(blockStart, anchor.index);
    const condition = legacy ? "stock\\['age'\\] = CONST_INT\\['milf_age'\\]" : "\\$age\\[stock\\['age'\\]\\] = '((?:''|[^'\\r\\n])*)'";
    const match = new RegExp(`^${escapeRE(begin)}\\r?\\n(if special_stock = 0 and ${condition}: stock\\['virginity'\\] = ([0-3]))\\r?\\n${escapeRE(end)}\\r?\\n$`).exec(block);
    if (!match) error('유형별 생성 초기값 블록에 예상하지 않은 코드·상태 또는 위치가 있습니다.');
    value = Number(match[legacy ? 2 : 3]);
    typeCode = legacy ? 'milf' : unquote(match[2]);
    if (!typeCode.trim() || typeCode.length > 200 || /[\u0000-\u001f\u007f<>]/.test(typeCode)) error('생성 규칙의 유형 코드가 비어 있거나 지원하지 않는 문자열입니다.');
    blockEnd = anchor.index;
    const statementStart = blockStart + block.indexOf(match[1]);
    binding = sourceBinding(source, statementStart, statementStart + match[1].length);
  }
  const directRules = [...source.body.matchAll(/^if special_stock = 0 and (?:stock\['age'\] = CONST_INT\['milf_age'\]|\$age\[stock\['age'\]\] = '(?:''|[^'\r\n])*'): stock\['virginity'\] = [^\r\n]+/gm)];
  if (directRules.length !== (value === -1 ? 0 : 1)) error('유형별 생성 초기값에 등록되지 않은 중복 연결이 있습니다.');
  return { source, anchor, blockStart, blockEnd, value, typeCode, binding };
}

function scan(raw) {
  const doc = core.parse(raw);
  if (!core.serialize(doc).equals(raw)) error('원본 바이트 왕복 검사가 실패했습니다.');
  const sources = new Map();
  for (const loc of doc.locations) {
    if (sources.has(loc.name)) error(`중복 location: ${loc.name}`);
    sources.set(loc.name, { name: loc.name, index: loc.body, body: core.shift(doc.lines[loc.body], 5) });
  }
  const get = name => sources.get(name) || error(`필수 연결 위치 누락: ${name}`);
  const fields = [], warnings = [
    '상태 행 추가·독립 복제·내부 코드 및 저장 키 변경은 등록되지 않아 지원하지 않습니다.',
    '조건식·역할 추가·판정 횟수·이력 유지 규칙은 읽기 전용입니다. 기존 발동 조건을 보존합니다.',
    '표시명과 툴팁은 별도 소스 값입니다. 아이콘은 기본 화면과 개인실의 기존 경로를 구분합니다.',
    '소스 규칙 편집이며 특정 세이브의 현재값을 바꾸지 않습니다. 게임 실행 검증은 별도입니다.',
    '표시명 또는 교육 XP 편집 시 기존 $newloc 캐시 버전을 자동 증가시킵니다. 표시명은 해당 $virginity 슬롯만 갱신하며 인물 이력과 일회 지급 버전은 유지합니다.',
    'QSP 복원 뒤 편집된 세이브를 이어갈 때는 명시적인 캐시 갱신 후보를 사용합니다. 현재 소스의 표시명 5개와 기존 동적 정의를 새 캐시 버전으로 다시 읽습니다.',
    '판매 배수 편집은 계산 수치만 바꿉니다. 기존 대사의 배수 표현은 자동 수정하지 않습니다.'
  ];
  function add(definition, bindings, decode = Number) {
    const values = bindings.map(b => decode(b._source.body.slice(b._start, b._end)));
    if (!bindings.length) error(`${definition.id}: 연결이 누락되었습니다.`);
    if (values.some(v => v !== values[0])) error(`${definition.id}: 연결된 값이 일치하지 않습니다 (inconsistent).`);
    fields.push({ ...definition, value: values[0], bindings, _encode: definition.kind === 'number' ? String : quote });
  }
  const lifecycle = get('jo9_meiki_state'), sections = new Map();
  const starts = [...lifecycle.body.matchAll(/^if \$args\[0\] = '(slave|assistant|room[1-4])'[^\n]*:\s*$/gm)];
  for (const role of ROLES) {
    const matching = starts.filter(m => m[1] === role);
    if (matching.length !== 1) error(`${role}: 역할 연결 누락 또는 중복입니다.`);
    const match = matching[0], next = starts.find(m => m.index > match.index);
    sections.set(role, { offset: match.index, text: lifecycle.body.slice(match.index, next?.index ?? lifecycle.body.length) });
  }
  function roleNumbers(pattern, name) {
    return ROLES.map(role => {
      const section = sections.get(role), match = once(section.text, pattern(role), `${name}/${role}`);
      match.index += section.offset;
      return captured(lifecycle, match, 1, { role });
    });
  }
  add({ id: 'discovery.chance', label: '최초 발견 확률 (%)', group: '전환', kind: 'number', min: 0, max: 100, step: 1, help: '기존 최초 전환 1회 판정의 rand(1, 100) 상한입니다. 6개 역할을 함께 편집합니다.' }, roleNumbers(() => /^\s*if rand\(1, 100\) <= (\d+):[ \t]*$/gm, '발견 확률'));
  const skills = { sub_vaginal: '질 섹스 보장 등급', sub_threesome: '쓰리섬 보장 등급', sub_dp: '양구멍 삽입 보장 등급', sub_tp: '세구멍 삽입 보장 등급', sub_gangbang: '난교 보장 등급', sub_bukkake: '부카케 보장 등급' };
  for (const [key, label] of Object.entries(skills)) add({ id: 'grant.' + key, label, group: '연결 효과', kind: 'number', min: 0, max: 5, step: 1, help: '기존 max(현재값, 보장값)의 하한만 편집합니다. 기존 상한 5와 일회 지급 이력을 유지하며 이미 지급된 인물에게 재지급하지 않습니다.' }, roleNumbers(role => new RegExp(`^[ \\t]*${role}\\['${key}'\\] = max\\(${role}\\['${key}'\\], (\\d+)\\)[ \\t]*$`, 'gm'), key));
  const variative = get('#variative'), newloc = sources.get('$newloc');
  const existingCache = new Map();
  if (newloc) {
    const starts = [...newloc.body.matchAll(new RegExp(`^[ \\t]*${escapeRE(CACHE_BEGIN)}[ \\t]*\\r?$`, 'gm'))], ends = [...newloc.body.matchAll(new RegExp(`^[ \\t]*${escapeRE(CACHE_END)}[ \\t]*\\r?$`, 'gm'))];
    if (starts.length || ends.length) {
      if (starts.length !== 1 || ends.length !== 1 || starts[0].index >= ends[0].index) error('편집기 표시 캐시 블록이 중복되거나 손상되었습니다.');
      const guard = cacheGuard(newloc);
      if (starts[0].index <= guard.start.index || ends[0].index >= guard.stop) error('표시 캐시가 기존 갱신 가드를 벗어났습니다.');
      const blockOffset = starts[0].index + starts[0][0].length;
      const block = newloc.body.slice(blockOffset, ends[0].index);
      for (const match of block.matchAll(/^[ \t]*\$virginity\[([0-4])\] = '((?:''|[^'\r\n])*)'[ \t]*$/gm)) {
        const code = Number(match[1]);
        if (existingCache.has(code)) error('표시 캐시 슬롯이 중복되었습니다.');
        match.index += blockOffset;
        existingCache.set(code, captured(newloc, match, 2));
      }
      const residue = block.replace(/^[ \t]*\$virginity\[[0-4]\] = '(?:''|[^'\r\n])*'[ \t]*$/gm, '').trim();
      if (residue) error('표시 캐시 블록에 지원하지 않는 코드가 있습니다.');
    }
    const allAssignments = [...newloc.body.matchAll(/\$virginity\[[0-4]\]\s*=/g)];
    if (allAssignments.length !== existingCache.size) error('등록되지 않은 표시 캐시 연결이 있습니다.');
  }
  for (let code = 0; code <= 4; code++) {
    const match = once(variative.body, new RegExp(`^[ \\t]*\\$virginity\\[${code}\\] = '((?:''|[^'\\r\\n])*)'[ \\t]*$`, 'gm'), `상태 ${code} 표시명`);
    const bindings = [captured(variative, match, 1)];
    if (existingCache.has(code)) bindings.push(existingCache.get(code));
    add({ id: `state.${code}.label`, label: `상태 ${code} 표시명`, group: '상태표', kind: 'text', help: '실제 $virginity 표시 문자열입니다. 저장된 해당 표시 슬롯은 기존 캐시 갱신 시 함께 갱신합니다.' }, bindings, unquote);
  }
  const uiSites = [{ location: 'sjm_UI_UIadds', role: 'slave', family: 'main' }, { location: 'sjm_UI_UIadds', role: 'assistant', family: 'main' }, ...[1, 2, 3, 4].map(i => ({ location: `slave_private_room${i}`, role: `room${i}`, family: 'room' })), { location: 'snk_room_menu_screen', role: 'slave', family: 'room' }];
  const uiBindings = Array.from({ length: 5 }, () => ({ tooltip: [], main: [], room: [] }));
  for (const site of uiSites) {
    const source = get(site.location);
    const start = once(source.body, new RegExp(`^[ \\t]*if ${site.role}\\['virginity'\\] = 1:[ \\t]*$`, 'gm'), `${site.location}/${site.role} 상태표`);
    const section = source.body.slice(start.index), rows = section.split('\n');
    let offset = start.index;
    const codes = [1, 3, 4, 0, 2];
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i], condition = rows[i * 2], markup = rows[i * 2 + 1];
      const expected = i === 4 ? /^\s*else\s*$/ : new RegExp(`^\\s*${i ? 'elseif' : 'if'} ${site.role}\\['virginity'\\] ${code === 0 ? '< 2' : '= ' + code}:[ \\t]*$`);
      if (!expected.test((condition || '').replace(/\r$/, '')) || !markup) error(`${site.location}/${site.role}: 상태표 분기 연결을 확인할 수 없습니다.`);
      const tip = once(markup, /tooltip-data="([^"\r\n]*)"/g, '상태 툴팁'), icon = once(markup, /src="([^"\r\n]*)"/g, '상태 아이콘');
      const markupOffset = offset + condition.length + 1;
      for (const [key, match] of [['tooltip', tip], [site.family, icon]]) {
        match.index += markupOffset;
        uiBindings[code][key].push(captured(source, match, 1, { role: site.role }));
      }
      offset = markupOffset + markup.length + 1;
    }
  }
  for (let code = 0; code <= 4; code++) {
    add({ id: `state.${code}.tooltip`, label: `상태 ${code} 툴팁`, group: '상태표', kind: 'text', help: '기본 화면과 개인실의 기존 7개 상태 툴팁을 함께 편집합니다.' }, uiBindings[code].tooltip, unquote);
    for (const family of ['main', 'room']) add({ id: `state.${code}.icon.${family}`, label: `상태 ${code} 아이콘 (${family === 'main' ? '기본 화면' : '개인실'})`, group: '상태표', kind: 'icon', help: '게임 content/pic 아래 기존 이미지 경로를 입력합니다. 이미지를 생성하거나 복사하지 않습니다.' }, uiBindings[code][family], unquote);
  }
  const dynamic = sources.get('#dynamic');
  if (dynamic) {
    const xp = once(dynamic.body, /if func\('jo9_meiki_training_bonus', 'dynslave', \$subskill\) = 1: dynamic \$replace\('<<\$subskill_xp>> \+= (\d+)', 'slave', 'dynslave'\)/g, '교육 경험치');
    add({ id: 'training.xp', label: '기존 지정 교육의 추가 XP', group: '연결 효과', kind: 'number', min: 0, max: 1000, step: 1, help: '기존 보너스 자격 검사·실패 분기·승급 기준을 보존하고 추가 XP 수치만 바꿉니다. 저장된 동적 정의 갱신을 위해 기존 캐시 버전이 자동 증가합니다.' }, [captured(dynamic, xp, 1)]);
  } else warnings.push('교육 XP 정의가 없어 편집 연결을 제공하지 않습니다.');
  const saleSpecs = [
    { id: 'sale.market.multiplier', location: 'slave_auction_sell', label: '시장 기존 재제안 배수', regex: /if slave\['virginity'\] = 4 and txt >= 6 and txt <= 7: sell_price \*= (\d+)/g },
    { id: 'sale.auction.multiplier', location: '$guild_auction', label: '길드 기존 최종가 배수', regex: /! JO9_MEIKI_AUCTION_V1\r?\nif slave\['virginity'\] = 4:\r?\n[ \t]*local jo9_auction_base = bank_size\r?\n[ \t]*bank_size \*= (\d+)/g }
  ];
  for (const spec of saleSpecs) {
    const source = sources.get(spec.location);
    if (!source) { warnings.push(`${spec.label}: 기존 연결 위치가 없어 지원하지 않습니다.`); continue; }
    const match = once(source.body, spec.regex, spec.label);
    add({ id: spec.id, label: spec.label, group: '연결 효과', kind: 'number', min: 0, max: 1000, step: 1, help: '기존 상태 검사와 지급 경로를 보존하며 등록된 배수만 바꿉니다. 대사는 별도 값이므로 기존 배수 표현을 확인해야 합니다.' }, [captured(source, match, 1)]);
  }
  let guard;
  try { guard = cacheGuard(newloc); } catch (cause) { warnings.push(`캐시 갱신을 확인할 수 없어 표시명·교육 XP 후보 생성을 제한합니다: ${cause.message}`); }
  const transitions = [
    { id: 'first-discovery', title: '기존 최초 전환 판정', description: '이전 상태 0, 현재 상태 2 이상, 최초 판정 미완료인 기존 경로입니다. 발견 확률 외 조건과 판정 횟수는 읽기 전용입니다.', regex: role => new RegExp(`^.*if ${role}\\['jo9_meiki_prev'\\] = 0 and ${role}\\['virginity'\\] >= 2 and ${role}\\['jo9_meiki_checked'\\] = 0:.*$`, 'gm') },
    { id: 'known-normalization', title: '알려진 상태 유지·복귀', description: '기존 발견 이력을 가진 인물의 상태 2 이상을 상태 4로 정규화하는 연결입니다. 이력과 일회 지급 버전은 편집하지 않습니다.', regex: role => new RegExp(`^.*if ${role}\\['jo9_meiki_known'\\] = 1 and ${role}\\['virginity'\\] >= 2:.*$`, 'gm') }
  ].map(({ regex, ...transition }) => ({ ...transition, bindings: ROLES.map(role => { const m = once(lifecycle.body, regex(role), transition.id + '/' + role); return publicBinding(sourceBinding(lifecycle, m.index, m.index + m[0].length, { role })); }) }));
  const callerBindings = [];
  for (const source of sources.values()) for (const match of source.body.matchAll(/^[ \t]*gs 'jo9_meiki_state', '(slave|assistant|dynslave)', (?:1|sex\['jo9_meiki_discovery_eligible'\])[ \t]*$/gm)) callerBindings.push(publicBinding(sourceBinding(source, match.index, match.index + match[0].length, { role: match[1] })));
  if (callerBindings.length) transitions.push({ id: 'discovery-call-sites', title: '기존 발견 전환 호출 위치', description: '실제 helper 호출 위치입니다. dynslave는 기존 동적 역할 치환이며, 기존 자격 인자와 사건 조건은 읽기 전용으로 보존합니다.', bindings: callerBindings });
  else warnings.push('기존 발견 전환의 외부 호출 위치를 확인하지 못했습니다. 새 발동 경로를 만들지 않습니다.');
  if (guard) transitions.push({ id: 'saved-cache-refresh', title: '기존 저장 캐시 갱신', description: `현재 버전 ${guard.value}. 표시명/교육 XP 변경 시 이 기존 가드의 두 버전 값을 함께 증가시킵니다. 표시명은 편집기 소유 블록에서 해당 표시 슬롯만 갱신합니다. 인물 발견·지급 이력은 건드리지 않습니다.`, bindings: [publicBinding(sourceBinding(newloc, guard.start.index, guard.start.index + guard.start[0].length)), publicBinding(sourceBinding(newloc, guard.assignment.index, guard.assignment.index + guard.assignment[0].length))] });
  const history = [
    { key: 'jo9_meiki_known', label: '발견 이력', type: 'boolean', description: '현재 상태와 별도로 유지하는 기존 발견 이력. 읽기 전용입니다.' },
    { key: 'jo9_meiki_checked', label: '최초 판정 완료', type: 'boolean', description: '판정 실패 후에도 완료를 유지하는 기존 이력. 읽기 전용입니다.' },
    { key: 'jo9_meiki_prev', label: '이전 상태', type: 'state-code', description: '기존 상태 이동 검사의 내부 코드. 읽기 전용입니다.' },
    { key: 'jo9_meiki_initialized', label: '초기화·일회 지급 버전', type: 'version', description: '기존 0/1/2 처리 버전입니다. 체크박스나 편집 대상이 아니며 보장값 변경으로 재지급하지 않습니다.' }
  ];
  let generation;
  if (sources.has('generate_stock')) {
    generation = generationBinding(sources.get('generate_stock'));
    const generationOptions = [{ value: -1, label: '기존 생성 규칙 유지' }, ...[0, 1, 2, 3].map(code => {
      const label = fields.find(field => field.id === `state.${code}.label`).value;
      const tooltip = fields.find(field => field.id === `state.${code}.tooltip`).value;
      return { value: code, label: `${code} · ${label}${tooltip === label ? '' : ` (아이콘 설명: ${tooltip})`}` };
    })];
    fields.push({ id: GENERATION_CODE_ID, label: '적용할 유형 코드', group: '생성 초기값', kind: 'text', value: generation.typeCode, allowEmpty: true, placeholder: '예: milf', help: '적용할 기존 유형 코드 문자열을 직접 입력합니다. 새 유형을 정의하거나 등록하지 않습니다. 신규 인물의 기존 $age 역매핑 문자열과 정확히 비교하며, 미정의 코드는 다른 유형에 적용되지 않습니다. 기존 생성 규칙 유지 상태의 입력은 프로젝트 초안에만 보관합니다.', bindings: [generation.binding], _encode: quote });
    fields.push({ id: GENERATION_ID, label: '신규 생성 초기 상태', group: '생성 초기값', kind: 'select', value: generation.value, options: generationOptions, help: '일반 신규 생성에서 직접 입력한 유형 코드에만 적용합니다. 고유·특수 프리셋(special_stock > 0)은 제외하고, 같은 일반 생성기를 쓰는 무작위 의뢰·퀘스트 인물은 포함합니다. 클론·사건의 후속 상태 덮어쓰기는 유지합니다. 기존 인물·세이브를 일괄 변경하지 않고 발견·지급 이력도 편집하지 않습니다. 명기(4)는 최초 발견·일회 지급 이력 연결이 필요해 직접 초기값 지정을 지원하지 않습니다.', bindings: [generation.binding], _encode: String });
    warnings.push('생성 초기값은 일반 신규 생성의 마지막 상태 지정입니다. 고유·특수 프리셋은 제외하지만 같은 일반 생성기를 쓰는 무작위 의뢰·퀘스트는 포함하며, 후속 클론·사건 규칙은 우선할 수 있습니다. 명기(4) 초기 지정은 발견·일회 지급 이력 연결 때문에 지원하지 않습니다.');
    warnings.push('유형 코드는 사용자가 직접 입력하는 기존 역매핑 문자열입니다. 입력으로 새 유형이 만들어지지 않으며 미정의 코드는 적용 대상과 일치하지 않습니다.');
  } else warnings.push('generate_stock 생성 위치가 없어 유형별 신규 생성 초기값 편집을 지원하지 않습니다.');
  const plainFields = fields.map(({ _encode, bindings, ...field }) => ({ ...field, bindings: bindings.map(publicBinding) }));
  const view = { hash: doc.hash, feature: { id: 'jo9.meiki', title: '명기와 기존 인물 상태 축', type: 'character-state', summary: '기존 virginity 0~4 상태 축의 표시와 등록된 수치 연결을 편집합니다. 코드·이력·조건은 읽기 전용입니다.' }, roles: ROLES.map(id => ({ id, label: id === 'slave' ? '현재 동행 역할 슬롯 (slave)' : id === 'assistant' ? '조수 (assistant)' : `개인실 ${id.slice(-1)} (${id})` })), fields: plainFields, states: Array.from({ length: 5 }, (_, code) => ({ code, label: plainFields.find(f => f.id === `state.${code}.label`).value, icon: plainFields.find(f => f.id === `state.${code}.icon.main`).value, labelFieldId: `state.${code}.label`, iconFieldId: `state.${code}.icon.main` })), history, transitions, warnings };
  return { doc, sources, fields, view, guard, generation };
}

function inspect(raw) { return scan(raw).view; }
function validate(field, value) {
  if (field.kind === 'select') {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || !field.options.some(option => option.value === value)) error(`${field.label}: 등록된 생성 상태 선택값이 필요합니다.`);
  } else if (field.kind === 'number') {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < field.min || value > field.max) error(`${field.label}: ${field.min}~${field.max} 범위의 정수가 필요합니다.`);
  } else {
    if (typeof value !== 'string' || (!field.allowEmpty && !value.trim()) || value.length > (field.kind === 'icon' ? 240 : 200) || /[\u0000-\u001f\u007f<>]/.test(value)) error(`${field.label}: 지원하지 않는 문자열입니다.`);
    if (field.id.endsWith('.tooltip') && /["&]/.test(value)) error(`${field.label}: HTML 속성 문자는 사용할 수 없습니다.`);
    if (field.kind === 'icon') {
      const normalized = value.replace(/\\/g, '/');
      if (!normalized.startsWith('content/pic/') || /[:"'|?*%]/.test(value) || normalized.split('/').some(part => !part || part === '.' || part === '..') || !/\.(?:png|jpe?g|gif|webp)$/i.test(normalized)) error(`${field.label}: content/pic 아래 안전한 이미지 경로가 필요합니다.`);
    }
  }
}
function prepare(raw, edits, baseHash, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options)) || Object.keys(options).some(key => key !== 'refreshCache' && key !== 'cacheRevision')) error('캐시 옵션 형식이 잘못되었습니다.');
  if (Object.hasOwn(options, 'refreshCache') && typeof options.refreshCache !== 'boolean') error('캐시 갱신 옵션은 boolean이어야 합니다.');
  if (Object.hasOwn(options, 'cacheRevision') && (!Number.isSafeInteger(options.cacheRevision) || options.cacheRevision < 0 || options.cacheRevision > 2147483646)) error('캐시 버전 옵션은 0~2147483646 정수여야 합니다.');
  const state = scan(raw), { doc, sources, fields, view } = state;
  if (baseHash !== doc.hash) error('원본 QSP 해시가 변경되었습니다. 다시 불러와 주세요.');
  if (!Array.isArray(edits)) error('편집 목록 형식이 잘못되었습니다.');
  const seen = new Set(), actual = [];
  for (const edit of edits) {
    if (!edit || typeof edit.id !== 'string' || seen.has(edit.id)) error('편집 항목이 잘못되었거나 중복되었습니다.');
    seen.add(edit.id);
    const field = fields.find(f => f.id === edit.id);
    if (!field) error(`등록되지 않은 편집 항목: ${edit.id}`);
    validate(field, edit.value);
    if (field.value !== edit.value) actual.push({ field, value: edit.value });
  }
  const nextGenerationValue = actual.find(({ field }) => field.id === GENERATION_ID)?.value ?? state.generation?.value ?? -1;
  const nextGenerationCode = actual.find(({ field }) => field.id === GENERATION_CODE_ID)?.value ?? state.generation?.typeCode ?? '';
  if (nextGenerationValue !== -1 && !nextGenerationCode.trim()) error('신규 생성 초기 상태를 지정하려면 적용할 유형 코드를 입력해 주세요.');
  if (nextGenerationValue === -1) {
    const draftIndex = actual.findIndex(({ field }) => field.id === GENERATION_CODE_ID);
    if (draftIndex >= 0) actual.splice(draftIndex, 1);
  }
  const changed = new Map(), changes = [];
  const replacements = new Map();
  for (const { field, value } of actual) {
    changes.push({ id: field.id, label: field.label, before: field.value, after: value, bindings: field.bindings.map(publicBinding) });
    if (field.id === GENERATION_ID || field.id === GENERATION_CODE_ID) continue;
    for (const binding of field.bindings) {
      if (!replacements.has(binding.location)) replacements.set(binding.location, []);
      replacements.get(binding.location).push({ start: binding._start, end: binding._end, value: field._encode(value) });
    }
  }
  for (const [name, spans] of replacements) {
    let body = sources.get(name).body, previousStart = body.length + 1;
    for (const span of spans.sort((a, b) => b.start - a.start)) {
      if (span.end > previousStart) error('편집 위치가 서로 겹칩니다.');
      body = body.slice(0, span.start) + span.value + body.slice(span.end);
      previousStart = span.start;
    }
    changed.set(name, body);
  }
  const generationEdit = actual.find(({ field }) => field.id === GENERATION_ID || field.id === GENERATION_CODE_ID);
  if (generationEdit) {
    const { source, blockStart, blockEnd } = state.generation, newline = source.body.includes('\r\n') ? '\r\n' : '\n';
    const block = nextGenerationValue === -1 ? '' : `${GENERATION_BEGIN}${newline}if special_stock = 0 and $age[stock['age']] = '${quote(nextGenerationCode)}': stock['virginity'] = ${nextGenerationValue}${newline}${GENERATION_END}${newline}`;
    changed.set(source.name, source.body.slice(0, blockStart) + block + source.body.slice(blockEnd));
  }
  const needsCache = options.refreshCache || actual.some(({ field }) => field.id === 'training.xp' || /^state\.[0-4]\.label$/.test(field.id));
  if (needsCache) {
    const source = sources.get('$newloc'), guard = cacheGuard(source), revision = Math.max(guard.value + 1, options.cacheRevision || 0);
    if (revision > 2147483646) error('캐시 갱신 버전 범위를 초과했습니다.');
    let body = changed.get('$newloc') ?? source.body;
    const newline = body.includes('\r\n') ? '\r\n' : '\n';
    body = body.replace(/(^[ \t]*if jo9_meiki_revision < )\d+(:[ \t]*$)/m, (_, a, b) => a + revision + b).replace(/(^[ \t]*jo9_meiki_revision = )\d+([ \t]*$)/m, (_, a, b) => a + revision + b);
    const labelRefreshes = options.refreshCache ? fields.filter(field => /^state\.[0-4]\.label$/.test(field.id)).map(field => ({ field, value: actual.find(edit => edit.field.id === field.id)?.value ?? field.value })) : actual.filter(({ field }) => /^state\.[0-4]\.label$/.test(field.id));
    const additions = labelRefreshes.filter(({ field }) => !field.bindings.some(b => b.location === '$newloc')).map(({ field, value }) => ` $virginity[${field.id.split('.')[1]}] = '${quote(value)}'`);
    if (additions.length) {
      if (body.includes(CACHE_END)) body = body.replace(new RegExp(`^[ \\t]*${escapeRE(CACHE_END)}[ \\t]*\\r?$`, 'm'), () => additions.join(newline) + newline + ' ' + CACHE_END);
      else {
        const updatedGuard = cacheGuard({ ...source, body });
        const block = ` ${CACHE_BEGIN}${newline}${additions.join(newline)}${newline} ${CACHE_END}${newline}`;
        body = body.slice(0, updatedGuard.stop) + block + body.slice(updatedGuard.stop);
      }
    }
    changed.set('$newloc', body);
    changes.push({ id: 'cache.revision', label: '저장 캐시 갱신 (기존 버전 가드 자동 증가)', before: guard.value, after: revision, bindings: [publicBinding(sourceBinding(source, guard.start.index, guard.start.index + guard.start[0].length)), publicBinding(sourceBinding(source, guard.assignment.index, guard.assignment.index + guard.assignment[0].length))] });
    if (options.refreshCache) changes.push({ id: 'cache.labels', label: '저장 표시 캐시 전체 갱신 (현재 소스 5개 슬롯)', before: '기존 세이브 표시 캐시', after: labelRefreshes.map(({ value }) => value).join(' / '), bindings: labelRefreshes.map(({ field }) => publicBinding(field.bindings.find(binding => binding.location === '#variative'))) });
  }
  const candidate = { ...doc, lines: doc.lines.slice() }, patchEdits = [];
  for (const [name, next] of changed) {
    const source = sources.get(name), old = source.body;
    if (old === next) continue;
    let start = 0, end = old.length, newEnd = next.length;
    while (start < end && start < newEnd && old[start] === next[start]) start++;
    while (end > start && newEnd > start && old[end - 1] === next[newEnd - 1]) { end--; newEnd--; }
    let piece;
    for (let pad = 0; ; pad = pad ? pad * 2 : 16) {
      piece = core.minimalEdit(old, next, Math.max(0, start - pad), Math.min(old.length, end + pad), Math.min(next.length, newEnd + pad));
      if (piece.new && next.split(piece.new).length - 1 === 1) break;
    }
    if (old.split(piece.old).length - 1 !== 1) error('원본 치환 개수가 일치하지 않습니다.');
    patchEdits.push({ location: name, field: 'body', ...piece, count: 1 });
    candidate.lines[source.index] = core.shift(next, -5);
  }
  const result = patchEdits.length ? core.serialize(candidate) : raw, checked = scan(result);
  if (checked.doc.locations.length !== doc.locations.length || checked.doc.lines.some((line, i) => ![...changed.keys()].some(name => sources.get(name).index === i) && line !== doc.lines[i])) error('등록된 본문 밖의 변경이 감지되었습니다.');
  for (const { field, value } of actual) if (checked.view.fields.find(f => f.id === field.id)?.value !== value) error(`${field.id}: 후보 재검사가 실패했습니다.`);
  return { raw: result, beforeHash: doc.hash, afterHash: core.hash(result), patch: { description: '기존 인물 상태 정의의 등록된 표시·수치 편집', edits: patchEdits }, changes };
}
module.exports = { inspect, prepare };
