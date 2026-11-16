'use strict';

const assert = require('node:assert/strict');
const core = require('../text-workshop/core.cjs');
const { SPECIAL_NAMES, PERFORMER_LABELS } = require('./enemy-special-names.cjs');

// JO9 MOD START GAME_REFERENCE_ENEMIES_20261111
// Read combat fields only. Dialogue, descriptions and result prose are excluded.
const AUDITED_HASH = '376a35f58c8bb78b3bafc09f4da60f23f7c51a3462d4bd4d7e413d356f76dbe2';
const LOCATION = '#противники';
const STAT_KEYS = ['базовое_здоровье', 'базовая_выносливость', 'базовый_дух', 'базовый_вред'];
const CLASSES = { пешка: '졸개', рядовой: '일반', элитный: '정예' };
const ATTACK_TYPES = { сильная: '강공', быстрая: '속공', точная: '정밀공격' };
const DAMAGE_TYPES = {
  колющий: '관통', рубящий: '참격', дробящий: '타격', огонь: '화염', холод: '냉기',
  молния: '번개', свет: '빛', тьма: '어둠', серебро: '은', холодное_железо: '냉철', психический: '정신'
};
const STATUS = {
  слабость: '약화', скованность: '경직', боль: '고통', шаткость: '탈력', ошеломление: '충격', рассеянность: '방심',
  бешенство: '분노', разгон: '가속', меткость: '명중', адреналин: '흥분', верткость: '회피', внимание: '집중',
  'вёрткость': '회피 표기 불일치(ё)'
};
const FLAGS = [
  { key: 'хрупкий', name: '타격도 체력에 피해', description: '타격이 스태미나·사기와 함께 체력도 깎는다.' },
  { key: 'тонкое_тело', name: '정신도 체력에 피해', description: '정신 공격이 사기와 함께 체력도 깎는다.' },
  { key: 'бессмертный', name: '일반 유형 체력 피해 차단', description: '정신·타격 이외의 피해에서 체력 차감을 생략한다. 스태미나·사기 피해 차단과는 별개다.' },
  { key: 'безустали', name: '스태미나 피해 차단', description: '통상 피해 처리에서 스태미나 차감을 생략한다.' },
  { key: 'бесстрашный', name: '사기 피해 차단', description: '통상 피해 처리에서 사기 차감을 생략한다.' }
];
const STATUS_GUIDE = [
  { name: '약화', effect: '자신의 강공 보정 −1' },
  { name: '경직', effect: '자신의 속공 보정 −1' },
  { name: '고통', effect: '자신의 정밀공격 보정 −1' },
  { name: '탈력', effect: '받는 강공 보정 +1' },
  { name: '충격', effect: '받는 속공 보정 +1' },
  { name: '방심', effect: '받는 정밀공격 보정 +1' },
  { name: '분노', effect: '자신의 강공 보정 +1' },
  { name: '가속', effect: '자신의 속공 보정 +1' },
  { name: '명중', effect: '자신의 정밀공격 보정 +1' },
  { name: '흥분', effect: '받는 강공 보정 −1' },
  { name: '회피', effect: '받는 속공 보정 −1' },
  { name: '집중', effect: '받는 정밀공격 보정 −1' }
];
const ALIASES = { champion_vatican: '바티칸 특급 투사', vatican_paladin: '바티칸 성기사' };
const FLAG_KEYS = new Set(FLAGS.map(flag => flag.key));
const RESISTANCE_KEYS = new Set(Object.keys(DAMAGE_TYPES).map(key => 'модификатор_' + key));
const LABEL_KEYS = new Set(['$название_моба', '$класс_моба', '$интеллект']);

function isCombatKey(key) {
  return LABEL_KEYS.has(key) || STAT_KEYS.includes(key) || FLAG_KEYS.has(key) || RESISTANCE_KEYS.has(key)
    || /^\$атака_[123]_(?:тип|тип_вреда|штраф|бонус)$/.test(key)
    || /^атака_[123]_длительность$/.test(key)
    || /^\$суператака_[123]_(?:тип|тип_вреда)$/.test(key)
    || /^базовый_вред_суператаки_[123]$/.test(key);
}

function buildEnemies(doc) {
  assert.ok(doc && Array.isArray(doc.locations) && Array.isArray(doc.lines) && typeof doc.hash === 'string', 'A parsed QSP document is required');
  const location = doc.locations.find(item => item.name === LOCATION);
  assert.ok(location, 'Enemy definition location is missing');
  const lines = core.shift(doc.lines[location.body], 5).split(/\r?\n/);
  const definitions = new Map();
  for (let n = 0; n < lines.length; n++) {
    const match = lines[n].match(/^\s*([^=\[]+)\[(['"])(.*?)\2\]\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim(), id = match[3], rhs = match[4].trim();
    const special = key.match(/^\$спецэффект_суператаки_([123])$/);
    if (!isCombatKey(key) && !special) continue;
    if (!definitions.has(id)) definitions.set(id, { id, fields: {}, sources: {}, specials: {}, reassigned: [] });
    const entry = definitions.get(id);
    if (special) {
      let block = rhs, end = n;
      while (!block.includes('}') && end + 1 < lines.length) block += '\n' + lines[++end];
      assert.match(block, /^\{[\s\S]*\}$/, 'Unexpected special effect block at ' + LOCATION + ':' + (n + 1));
      const effects = block.slice(1, -1).trim().split(/\r?\n/).filter(text => text.trim()).map(text => {
        const effect = text.trim().match(/^([а-яё_]+)(?:\[(\d+)\])?\s*=\s*(\d+)$/);
        assert.ok(effect && Object.hasOwn(STATUS, effect[1]), 'Unsupported special effect at ' + LOCATION + ':' + (n + 1));
        return { target: effect[2] === undefined || Number(effect[2]) === 0 ? '플레이어' : '적 ' + Number(effect[2]) + '번 슬롯', name: STATUS[effect[1]], value: Number(effect[3]) };
      });
      entry.specials[Number(special[1])] = { effects, source: LOCATION + ':' + (n + 1) };
      continue;
    }
    const quoted = rhs.match(/^(['"])(.*?)\1(?:\s*&!.*)?$/);
    let value;
    if (quoted) value = quoted[2];
    else {
      assert.match(rhs, /^[+-]?\d+$/, 'Unsupported combat field at ' + LOCATION + ':' + (n + 1));
      value = Number(rhs);
    }
    if (Object.hasOwn(entry.fields, key)) entry.reassigned.push({ key, same: entry.fields[key] === value, line: n + 1 });
    entry.fields[key] = value;
    entry.sources[key] = n + 1;
  }
  assert.ok(definitions.size > 0, 'Enemy definitions are empty');
  const auditCurrent = doc.hash.toLowerCase() === AUDITED_HASH;
  const locationNames = new Set(doc.locations.map(item => item.name));
  const locationCode = name => {
    const found = doc.locations.find(item => item.name === name);
    return found ? core.shift(doc.lines[found.body], 5) : '';
  };
  const hardSpecialsEnabled = locationNames.has('jo9_enemy_specials')
    && /HARD_ENEMY_SPECIALS_20261111/.test(locationCode('искусственный_идиот'))
    && /gs\s+'jo9_enemy_specials'/.test(locationCode('искусственный_идиот'));
  const hardMageFallback = hardSpecialsEnabled && /ии_безумный_архимаг/.test(locationCode('ход_противников'))
    && /difficulty_setting\s*=\s*2/.test(locationCode('ход_противников'))
    && /gs\s+'искусственный_идиот'/.test(locationCode('ход_противников'));
  const auditMessage = text => auditCurrent ? text : '이전 정적 감사(' + AUDITED_HASH.slice(0, 12) + ')의 연결 상태: ' + text + ' 현재 QSP는 다른 버전이므로 재확인이 필요하다.';
  const rows = [...definitions.values()].map(entry => {
    const f = entry.fields;
    for (const key of [...LABEL_KEYS, ...STAT_KEYS]) assert.ok(Object.hasOwn(f, key), 'Incomplete enemy ' + entry.id + ':' + key);
    for (const key of STAT_KEYS) assert.equal(typeof f[key], 'number', 'Non-numeric enemy stat ' + entry.id + ':' + key);
    const ai = f.$интеллект, aiMissing = !locationNames.has(ai), standardAi = ai === 'искусственный_идиот';
    const hardAiFallback = hardMageFallback && ai === 'ии_безумный_архимаг';
    const attackLimit = { пешка: 1, рядовой: 2, элитный: 3 }[f.$класс_моба] || 0;
    const attacks = [];
    for (let slot = 1; slot <= 3; slot++) {
      if (!Object.hasOwn(f, '$атака_' + slot + '_тип')) continue;
      for (const suffix of ['тип', 'тип_вреда', 'штраф', 'бонус']) assert.ok(Object.hasOwn(f, '$атака_' + slot + '_' + suffix), 'Incomplete normal attack ' + entry.id + ':' + slot);
      assert.equal(typeof f['атака_' + slot + '_длительность'], 'number', 'Missing attack duration ' + entry.id + ':' + slot);
      attacks.push({
        slot, type: ATTACK_TYPES[f['$атака_' + slot + '_тип']] || f['$атака_' + slot + '_тип'],
        damageType: DAMAGE_TYPES[f['$атака_' + slot + '_тип_вреда']] || f['$атака_' + slot + '_тип_вреда'],
        penalty: STATUS[f['$атака_' + slot + '_штраф']] || f['$атака_' + slot + '_штраф'],
        bonus: STATUS[f['$атака_' + slot + '_бонус']] || f['$атака_' + slot + '_бонус'],
        duration: f['атака_' + slot + '_длительность'], available: !aiMissing && standardAi && slot <= attackLimit
      });
    }
    const supers = Object.entries(entry.specials).map(([key, special]) => {
      const slot = Number(key);
      for (const field of ['$суператака_' + slot + '_тип', '$суператака_' + slot + '_тип_вреда', 'базовый_вред_суператаки_' + slot]) assert.ok(Object.hasOwn(f, field), 'Incomplete special attack ' + entry.id + ':' + slot);
      const linkedHard = hardSpecialsEnabled && (standardAi || hardAiFallback);
      const adaptation = slot === 2 && ['исчадие', 'чудовщиное_исчадие', 'исчадие_арены'].includes(entry.id);
      const effects = special.effects.map(effect => linkedHard && adaptation && effect.target === '적 1번 슬롯' ? { ...effect, target: '시전자' } : effect);
      return { slot, name: SPECIAL_NAMES[entry.id + ':' + slot] || (entry.id.startsWith('chun_') ? SPECIAL_NAMES[entry.id.slice(5) + ':' + slot] : '') || (PERFORMER_LABELS[entry.id] || f.$название_моба) + ' 특수 ' + slot, linkedHard,
        type: ATTACK_TYPES[f['$суператака_' + slot + '_тип']] || f['$суператака_' + slot + '_тип'], damageType: DAMAGE_TYPES[f['$суператака_' + slot + '_тип_вреда']] || f['$суператака_' + slot + '_тип_вреда'], damage: f['базовый_вред_суператаки_' + slot], effects, source: special.source };
    });
    const warnings = [];
    if (entry.id === 'chunhyang') warnings.push('산도의 일섬·유수보·전장 응급처치는 jo9_chun_battle의 반복 판정·아이템 행동이다. 아래 정적 특수공격 개수와 별개로 실제 연결되어 있다.');
    if (aiMissing) warnings.push(hardAiFallback ? '하드는 공통 AI로 실행한다. 쉬움·보통은 기존 전용 AI location이 미연결이다.' : '지정 AI location이 현재 QSP에 없음: ' + ai);
    if (standardAi && attacks.some(attack => attack.penalty || attack.bonus)) warnings.push(auditMessage('일반공격의 부가상태는 HTML 접두사와 상태 키가 맞지 않아 적용이 누락된다. 공격 피해와는 별개다.'));
    if ((standardAi || hardAiFallback) && supers.length) warnings.push(hardSpecialsEnabled ? '특수공격은 게임 중 하드에서만, 적마다 기술별 전투당 1회 사용한다.' : auditMessage('정의된 특수공격은 기본 AI의 공격 선택 범위 밖이다.'));
    if (Object.values(f).includes('вёрткость')) warnings.push('회피 상태가 вёрткость(ё)로 기록되어, 처리 키 верткость(е)와 철자가 다르다.');
    if (entry.id === 'исчадие_арены') warnings.push(auditMessage('아레나 개체의 저항 블록이 일반 안개 괴물 исчадие에 다시 대입되어 아레나 개체에는 별도 저항이 설정되지 않는다.'));
    if (entry.reassigned.some(item => !item.same)) warnings.push('같은 식별자의 필드가 다른 값으로 재대입되어 마지막 값을 표시한다.');
    return {
      id: entry.id, name: PERFORMER_LABELS[entry.id] || ALIASES[entry.id] || f.$название_моба, category: CLASSES[f.$класс_моба] || f.$класс_моба,
      source: LOCATION + ':' + entry.sources.$название_моба, stats: STAT_KEYS.map(key => f[key]),
      flags: FLAGS.filter(flag => f[flag.key] === 1).map(flag => flag.name),
      flagKeys: FLAGS.filter(flag => f[flag.key] === 1).map(flag => flag.key),
      flagsDefined: FLAGS.some(flag => Object.hasOwn(f, flag.key)),
      resistance: [...RESISTANCE_KEYS].filter(key => Object.hasOwn(f, key) && f[key] !== 0).map(key => DAMAGE_TYPES[key.slice('модификатор_'.length)] + ' ' + (f[key] > 0 ? '+' : '') + f[key]),
      resistanceDefined: [...RESISTANCE_KEYS].some(key => Object.hasOwn(f, key)),
      ai, aiMissing, hardAiFallback, attacks, supers, warnings
    };
  });
  const specials = rows.reduce((total, row) => total + row.supers.length, 0);
  const normal = rows.reduce((total, row) => total + row.attacks.length, 0);
  const specialUsers = rows.filter(row => row.supers.length).length;
  return {
    hash: doc.hash,
    auditCurrent, auditHash: AUDITED_HASH, hardSpecialsEnabled, hardMageFallback,
    coverage: '현재 WORK의 정적 적 정의 ' + rows.length + '종 · 일반공격 ' + normal + '개 · 특수공격 ' + specials + '개. 기본 수치 순서는 체력 / 스태미나 / 사기 / 기본 피해다. 게임 수치 변경 없이 데이터와 연결 상태를 열람한다.',
    notes: [
      '면역 플래그는 통상 피해 차감 경로를 막는 효과이며, 모든 상태효과·자기 행동 비용·강제 패배까지 차단한다는 뜻은 아니다. 근거: конец_раунда 29~47행.',
      '저항 11종은 관통·참격·타격·화염·냉기·번개·빛·어둠·은·냉철·정신이다. 음수는 고정 피해 감소, 양수는 추가 피해이며 백분율이 아니다. 최종 최소 피해 처리는 남는다. 근거: рассчет_вреда 44~68행.',
      '졸개는 일반 적의 자원 고갈 판정과 달리 공격 보정에 따른 повержен 상태로 제거되는 분기가 있다. 일반·정예 분류 자체가 방어 배율을 주는 것은 아니다. 근거: атака_игрока 421~432행.',
      hardSpecialsEnabled ? '게임 중 하드에서 ' + specialUsers + '종의 특수공격 ' + specials + '개를 선택한다. 기존 평타와 남아 있는 기술을 같은 확률로 고르며 적마다 기술별 전투당 1회다. 쉬움·보통은 기존 평타 선택을 유지한다. 새 전투에서만 사용 이력을 초기화하며 안개 교대·화면 갱신·저장 불러오기는 이력을 보존한다.' : auditMessage('기본 AI는 졸개 공격 1번, 일반 1~2번, 정예 1~3번만 선택한다. ' + specialUsers + '종에 정의된 특수공격 ' + specials + '개는 이 선택 경로에서 나오지 않는다.'),
      auditMessage('일반공격 부가상태는 <br>이 붙은 키를 넘기지만, 적용부가 순수 상태 키와 비교해 적용이 누락된다. 근거: искусственный_идиот, конец_раунда 144~190행.'),
      '보너스·페널티 필드 이름만으로 적용 대상을 판단하지 않는다. 순수 상태 키 처리에서는 약화·경직·고통·탈력·충격·방심이 플레이어에, 분노·가속·명중·흥분·회피·집중이 행동한 적에 적용된다.',
      '상태 수치는 피해량이나 발동 확률이 아니라 라운드마다 1씩 감소하는 지속 카운터다. 공격 보정은 합산 후 피해 배율로 바뀌므로 상태 하나의 효과를 고정 퍼센트로 해석하지 않는다. 근거: конец_раунда 6~24행, рассчет_вреда 21~50행.',
      hardSpecialsEnabled ? '하드의 안개적응은 사용한 적 자신에게 강화와 상태 정리를 적용한다. 원래 정의의 적 1번 고정 대상을 실행 시 시전자에게 맞춘다.' : '안개 괴물의 특수공격 효과는 원래 적 1번 슬롯에 고정되어 있다.',
      hardMageFallback ? '광기의 대마법사는 하드에서 공통 AI로 우회하여 기존 기술을 사용한다. 쉬움·보통의 전용 AI 미연결 문제는 별도다.' : auditMessage('광기의 대마법사는 별도 AI를 지정하지만 해당 location이 없다.'),
      auditMessage('아레나 안개 괴물의 저항 블록이 일반 안개 괴물 исчадие에 동일한 값을 다시 쓴다. 일반 개체 값은 그대로지만 아레나 개체의 저항은 별도 설정되지 않는다. 근거: #противники 3294~3304행.'),
      '동적 노예 훈련 상대 воспитуемая는 인물 능력과 착용 갑옷으로 수치·저항을 계산하고, 5개 상시 플래그를 0으로 설정한다. 정적 적 목록에 합산하지 않았다. 근거: начать_бой.',
      '인물용 성기사 jo9_combat_trait=2의 조건부 피해 절반 효과는 소유 인물 전투의 별도 경로다. 적 성기사의 이름이나 정예 분류만으로 자동 적용되지 않는다. 근거: jo9_traits_combat 147~154행.',
      '연결 상태 설명의 정적 감사 기준은 2026-11-11 WORK SHA-256 ' + AUDITED_HASH + '이다. ' + (auditCurrent ? '현재 추출본과 감사 기준이 일치한다.' : '현재 추출본은 감사 기준과 다르므로 연결 상태 설명을 최신 검증으로 간주하지 않는다.')
    ],
    flagGuide: FLAGS.map(flag => ({ ...flag, count: rows.filter(row => row.flagKeys.includes(flag.key)).length })),
    statusGuide: STATUS_GUIDE.map(item => ({ ...item })), rows
  };
}

module.exports = { buildEnemies };
// JO9 MOD END GAME_REFERENCE_ENEMIES_20261111
