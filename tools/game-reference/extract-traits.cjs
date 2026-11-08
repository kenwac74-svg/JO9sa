'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');
const qsp = process.argv[2];
const document = core.parse(fs.readFileSync(qsp));
const locations = new Map(document.locations.map(location => [location.name, core.shift(document.lines[location.body], 5).split(/\r?\n/)]));
const rows = new Map();

function plain(value) {
  return value.replace(/''/g, "'").replace(/^\[[^\]]+\]\s*(?:<br\s*\/?>)+/i, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

function add(name, category, id, description, source, aliases = []) {
  const key = `${name}|${id}`;
  if (!rows.has(key)) rows.set(key, { name, category, id, description, source, aliases });
}

const traitDescriptions = new Map();
const qspTrait = locations.get('jo9_traits');
for (const [index, line] of qspTrait.entries()) {
  const match = line.match(/^\s*if \$args\[1\] = '([a-z_]+)': \$result = '((?:''|[^'])*)'/);
  if (match) traitDescriptions.set(match[1], { text: plain(match[2]), source: `jo9_traits:${index + 1}` });
}

const staticText = new Map();
for (const [index, line] of locations.get('#static_txt').entries()) {
  const match = line.match(/^\s*(\$[\p{L}_\d]+)\s*=\s*'((?:''|[^'])*)'\s*$/u);
  if (match) staticText.set(match[1], { text: plain(match[2]), source: `#static_txt:${index + 1}` });
}

const aliases = {
  '$NaturalGrace': ['우아함'], '$Klutzy': ['어설픔'], '$Dexterity': ['손재주 좋음'], '$Clumsy': ['서투름'],
  '$Нет_клейма': ['낙인 없음'], '$Аскетичная': ['구두쇠'],
};
const activityAliases = {
  activity_active: ['활동적', '일벌레', '과다행동장애'],
  activity_passive: ['날라리', '무기력증', '안분지족', '휴식 선호'],
};

function categoryFor(field) {
  if (field === 'jo9_learning_trait') return '학습';
  if (/(^|_)affinity$/.test(field)) return '재능';
  if (['metabolism', 'grace', 'dexterity', 'jo9_constitution', 'jo9_gag_reflex', 'jo9_voice_trait', 'jo9_peerless'].includes(field)) return '신체';
  if (['oral_affinity', 'anal_affinity', 'nymphomania', 'masochism', 'exhibitionism', 'perversion', 'homosexualism'].includes(field)) return '기호와 성향';
  if (['darkness_attitude', 'blood_attitude', 'fire_attitude', 'water_attitude', 'vermin_attitude', 'deprivation_attitude'].includes(field)) return '기호와 공포';
  if (['jo9_combat_trait', 'courage'].includes(field)) return '전투';
  if (['jo9_versatile', 'arena_level', 'has_ride_win'].includes(field)) return '칭호';
  if (['brand', 'sanity'].includes(field)) return '상태';
  return '성격과 기질';
}

function condition(line) {
  const match = line.match(/\bdynslave\['([a-zA-Z_\d]+)'\]\s*(=|>|<)\s*(-?\d+)/);
  return match ? { key: match[1], value: ` ${match[2]} ${match[3]}` } : null;
}

const safeDescriptions = {
  oral_pref: '구강 기술을 더 빨리 배우며 관련 지시를 상대적으로 덜 거부하는 성향이다.',
  gag_reflex: '구강 자극에 대한 구역 반사가 강해 관련 활동에 불편함이 커지는 신체 특성이다.',
  anal_pref: '항문 관련 기술을 더 빠르게 배우고 해당 활동에 적응하기 쉬운 성향이다.',
  anal_averse: '항문 관련 활동에 강한 거부감을 보이는 성향이다. 신체적 또는 심리적 원인이 있을 수 있다.',
};

for (const [index, line] of qspTrait.entries()) {
  const match = line.match(/''describe'',\s*''([a-z_]+)''(?:,\s*(\d+))?">([^<]+)<\/a>/);
  if (!match || /^\s*!/.test(line)) continue;
  const [, action, rank, name] = match;
  const key = action === 'versatile' && rank === '2' ? 'versatile_master' : action;
  if (key === 'workaholic' || key === 'content') continue;
  const spec = action === 'versatile' ? { key: 'jo9_versatile', value: ` = ${rank || '1'}` }
    : condition(line) || { key: 'activity_sign', value: key === 'activity_active' ? ' = 1' : ' = -1' };
  const description = traitDescriptions.get(key);
  assert.ok(description, key);
  const category = ['oral_pref', 'anal_pref', 'anal_averse'].includes(key) ? '기호와 성향' : categoryFor(spec.key);
  add(name, category, spec.key + spec.value, safeDescriptions[key] || description.text,
    `jo9_traits:${index + 1} · ${description.source}`, activityAliases[key]);
}

const base = locations.get('#static_base');
const featureStart = base.findIndex(line => /^\$update_slave_features_list = \{/.test(line));
const featureEnd = base.findIndex((line, index) => index > featureStart && /^\}/.test(line));
const inlineSummaries = {
  '$Нимфоманка': '성적 욕구가 높아 관련 활동을 선호하며 해당 기술에 영향을 주는 성향이다.',
  '$Фригидная': '성적 흥분을 느끼기 어려운 성향이다.',
  '$Мазохистка': '신체 통증을 즐기며 고통에 대한 부정적 반응이 줄어드는 성향이다.',
  '$Пси_мазохистка': '언어적 압박에 대한 반응이 일반적인 경우와 다른 성향이다.',
  '$Извращенка': '일반적인 범위를 벗어난 성적 기호를 선호하는 성향이다.',
  '$Пуристка': '일반적인 범위를 벗어난 성적 활동을 꺼리는 성향이다.',
  '$Лесбиянка': '여성에게 끌리며 남성에게는 관심을 보이지 않는 성향이다. 상대에 따라 관련 활동 반응이 달라진다.',
  '$Гомофобка': '동성 상대와의 관련 활동에서 흥분이 오르지 않아 일부 활동의 성과가 떨어질 수 있다.',
};

for (let index = featureStart; index < featureEnd; index++) {
  const line = base[index];
  if (/^\s*!/.test(line)) continue;
  const link = line.match(/\$dynslave_features_list \+= '<a[^>]*msg (\$[\p{L}_\d]+)"[^>]*>(.+)<\/a>/u);
  if (!link) continue;
  const [, key, label] = link;
  if (key === '$Ленивая' || key === '$Гиперактивная') continue;
  const name = label.match(/"([^"]+)"\)>/u)?.[1] || (!label.startsWith('<<') ? label : '');
  if (!name) continue;
  const spec = key === '$jo9_attention_text' ? { key: 'jo9_attention', value: ' = 1' }
    : key === '$sanity_broken' ? { key: 'sanity', value: ' < 3' }
      : key === '$sanity_low' ? { key: 'sanity', value: ' 3–4' }
        : key === '$танцовщица' ? { key: 'calisthenics_affinity', value: ' > 0' }
          : condition(line) || base.slice(index - 3, index).reverse().filter(l => /\bif dynslave/.test(l)).map(condition).find(Boolean);
  assert.ok(spec, `missing trait key: ${name}`);
  const description = key === '$jo9_attention_text' ? traitDescriptions.get('attention') : staticText.get(key);
  assert.ok(description, `missing trait description: ${name}`);
  let summary = inlineSummaries[key] || description.text;
  if (key === '$танцовщица') summary += name === '이국적인 댄서'
    ? ' 색정광 또는 이상성욕 선호가 드러난 인물에게 표시되는 이름이다.'
    : ' 해당 성향이 드러나지 않은 인물에게 표시되는 이름이다.';
  add(name, categoryFor(spec.key), spec.key + spec.value, summary,
    `#static_base:${index + 1} · ${description.source}`, aliases[key]);
}

const conditions = [
  ['아레나 챔피언', '칭호', 'arena_level 5–8', '투기장에서 획득한 우승 경력을 나타내는 칭호다.', '#static_base:1976', ['투기장 챔피언']],
  ['아레나 그랜드 챔피언', '칭호', 'arena_level ≥ 9', '투기장에서 획득한 상위 우승 경력을 나타내는 칭호다.', '#static_base:1977', ['투기장 그랜드 챔피언']],
  ['경주 챔피언', '칭호', 'has_ride_win 4–6', '경주에서 4~6승을 기록하면 표시한다.', '#static_base:1978'],
  ['경주 그랜드 챔피언', '칭호', 'has_ride_win ≥ 7', '경주에서 7승 이상을 기록하면 표시한다.', '#static_base:1982'],
  ['회복', '상태', 'rehabilitation > 0', '현재 회복 중임을 표시한다. 회복 값도 함께 표시한다.', '#static_base:1970'],
  ['처녀', '상태', 'virginity < 2', '매물이나 냉동 보관 인물 화면에서 표시하는 상태다.', '$stock_traits:40 · $newloc:412'],
  ['미성숙', '상태', 'fertility = -2', '생식 능력이 아직 성숙하지 않은 상태다.', '$newloc:413'],
  ['불임', '상태', 'fertility = -1', '생식 능력이 없는 상태다.', '$newloc:414'],
  ['산란형', '상태', 'fertility = 1', '산란형 생식 특성을 표시한다.', '$newloc:415'],
  ['임신', '상태', 'pregnant > 0', '확인된 임신 상태다. 일부 화면에서 진행 단계가 표시된다.', '$newloc:416'],
  ['임신 확인', '상태', 'pregnant 1–119', '임신이 확인되면 표시하는 초기 안내다.', 'sjm_UI_UIadds:14–16'],
  ['임신 중기', '상태', 'pregnant 120–195', '임신 진행 단계다.', 'sjm_UI_UIadds:17'],
  ['임신 후기', '상태', 'pregnant 196–272', '임신 진행 단계다.', 'sjm_UI_UIadds:18'],
  ['만삭', '상태', 'pregnant ≥ 273', '임신 진행 단계다.', 'sjm_UI_UIadds:19'],
];
for (const entry of conditions) add(...entry);

const charts = { scars: '흉터', bruises: '멍과 타박상', starvation: '허기와 영양', wounds: '부상' };
for (const [index, line] of locations.get('#variative').entries()) {
  const match = line.match(/^\$(scars|bruises|starvation|wounds)\[([1-5])\] = dyneval\(\$\w+,\s*\d+,\s*'([^']+)'/);
  if (!match) continue;
  const [, key, value, name] = match;
  add(name, '상태', `${key}[${value}]`, `${charts[key]} 상태의 ${value}단계다.`, `#variative:${index + 1}`);
}

const policyLines = locations.get('jo9_chaotic');
const fallbackStart = policyLines.findIndex((line, index) => index > 30 && /^if jo9_chaotic_count = 0:/.test(line));
assert.ok(fallbackStart > 30);
const policies = new Map();
for (const [index, line] of policyLines.entries()) {
  const label = line.match(/\$jo9_chaotic_labels\[jo9_chaotic_count\] = '([^']+)'/)?.[1];
  if (label) policies.set(label, { policy: index < fallbackStart ? '부정 우선 제거' : '부정 후보가 없을 때만 제거', policySource: `jo9_chaotic:${index + 1}` });
}
const protectedNames = ['이상성욕 선호', '용감함', '색정광', '가학성애자', '선천적 벙어리', '고도 대사량', '높은 대사량',
  '낮은 대사량', '미약한 대사량', '촌뜨기', '투박한 손놀림', '약골', '백치', '반사적 구역질', '애널섹스 혐오'];
for (const name of protectedNames) {
  assert.ok(!policies.has(name), `protected trait is a candidate: ${name}`);
  policies.set(name, { policy: '제거 불가', policySource: '2026-11-03 승인 기록 · jo9_chaotic 제거 후보 대조' });
}
const coverage = '현재 2.4.1 QSP에서 노예·조수의 특성 목록과 매물·보관 화면에 표시되는 특성, 상태, 칭호를 모았습니다. 일반 능력치, 일시적 기분·버프, 초상화 전용 아이콘은 집계 범위 밖입니다. 일부 설명은 게임 효과를 중심으로 정리했습니다. 비용은 특성 자체나 획득 수단의 비용이며, 특성을 보유한 인물의 매물 가격과는 별개입니다.';
const result = [...rows.values()];
assert.ok(result.length >= 100);
for (const name of ['워커홀릭', '무기력함', '검소함', '다재다능', '팔방미인']) assert.ok(result.some(row => row.name === name), name);
for (const row of result) Object.assign(row, policies.get(row.name));
assert.equal(result.filter(row => row.policy).length, policies.size);

const training = new Map();
for (const [index, line] of base.slice(1631, 1645).entries()) {
  const match = line.match(/dynslave\['([\w]+_xp)'\] > (\d+).*: dynslave\['(\w+)'\] = (\d+)/);
  if (match) training.set(`${match[3]}=${match[4]}`, { threshold: match[2], source: `#static_base:${index + 1632}` });
}
const traitLine = pattern => qspTrait.findIndex(line => pattern.test(line)) + 1;
const constitutionLine = traitLine(/^\s*stock\['jo9_constitution'\] = 0/);
const peerlessLine = traitLine(/^\s*stock\['jo9_peerless'\] = 0/);
const attentionFreshLine = traitLine(/^\s*if \$args\[0\] = 'attention_fresh':/);
assert.ok(constitutionLine && peerlessLine && attentionFreshLine);
const slaveNatureDraw = /^\s*if jo9_trait_registry_roll > (\d+) and jo9_trait_registry_roll <= (\d+) and stock\['ego'\] < 4 and stock\['pride'\] < 4:/;
const slaveNatureLine = traitLine(slaveNatureDraw);
assert.ok(slaveNatureLine, '노예근성 추첨 조건');
const [, slaveNatureLower, slaveNatureUpper] = qspTrait[slaveNatureLine - 1].match(slaveNatureDraw);
const slaveNatureChance = Number(slaveNatureUpper) - Number(slaveNatureLower);
const valueLines = locations.get('jo9_traits_value');
const versatileSkills = valueLines.findIndex(line => line.includes("dynslave['service']") && line.includes("dynslave['lesbiansex']")) + 1;
const versatileGrant = valueLines.findIndex(line => /^\s*:jo9_trait_value_grant_versatile\s*$/.test(line)) + 1;
const peerlessRefresh = valueLines.findIndex(line => /if dynslave_type = 2624: dynslave\['jo9_peerless'\] = 1/.test(line)) + 1;
const peerlessSurgery = valueLines.findIndex(line => /if dynslave\['beauty'\] = 5 and dynslave\['jo9_peerless'\] = 0/.test(line)) + 1;
assert.ok(versatileSkills && versatileGrant && peerlessRefresh && peerlessSurgery);
const versatileSource = `jo9_traits_value:${versatileSkills}, ${versatileGrant}`;
const specific = {
  '노예근성': [`무작위 생성에서 자아가 단호함 미만이고 태도가 건방짐 미만일 때 ${slaveNatureChance}% 추첨으로 부여된다.`, `jo9_traits:${slaveNatureLine}`],
  '천재': ['무작위 생성 시 3%로 초기 부여된다.', 'generate_stock:1713–1723'],
  '백치': ['무작위 생성 시 3%로 초기 부여된다.', 'generate_stock:1713–1723'],
  '건강체질': ['무작위 생성 시 3%로 초기 부여되며 에게야도 보유한다. 의료센터에서 검진 후 인물당 한 번 체질개선 시술로 획득할 수 있다.', `jo9_traits:${constitutionLine} · generate_stock:1769–1773 · jo9_traits_combat:25–90`, '체질개선 시술 1,000스파크'],
  '약골': ['무작위 생성 시 3%로 초기 부여된다. 체질개선 시술은 약골을 건강체질로 바꾼다.', `jo9_traits:${constitutionLine} · jo9_traits_combat:25–90`],
  '절세미인': ['무작위 생성 시 미모 5 이상이면 1%로 초기 부여된다. 2624번 인물은 확정 보유한다. 미모 5인 인물이 성형 수술을 받을 때 5%로 획득할 수 있다.', `jo9_traits:${peerlessLine} · jo9_traits_value:${peerlessRefresh}, ${peerlessSurgery} · #options:1384, 1449`, '성형 수술 1회 250스파크'],
  '다재다능': ['지정된 24개 기술이 모두 A 이상이면 얻는다. 24개 기술이 모두 S에 도달하면 팔방미인으로 승급한다.', versatileSource],
  '팔방미인': ['지정된 24개 기술이 모두 S에 도달하면 얻는다. 승급 시 칭호가 팔방미인으로 바뀐다.', versatileSource],
  '광전사': ['신규 영웅 중 아마존·바이킹 계열은 50%로 초기 부여된다. 전투 특성이 없으면 누적 실전 10승과 이후 5승마다 3%로 얻을 수 있다.', 'generate_stock:1756–1766 · jo9_traits_combat:157–196'],
  '성기사': ['신규 영웅 중 기사 계열은 50%로 초기 부여된다. 전투 특성이 없으면 누적 실전 10승과 이후 5승마다 3%로 얻을 수 있다.', 'generate_stock:1756–1766 · jo9_traits_combat:157–196'],
  '역전의 용사': ['신규 영웅 중 아마존·바이킹·기사 이외 계열은 25%로 초기 부여되며 에게야도 보유한다. 전투 특성이 없으면 누적 실전 10승과 이후 5승마다 3%로 얻을 수 있다.', 'generate_stock:1756–1773 · jo9_traits_combat:157–196'],
  '용감함': ['인물 생성 시 부여될 수 있다. 에게야 영입 이벤트에서도 부여된다. 숨겨진 값은 공개 조건을 충족하면 표시된다.', 'generate_stock:1350 · interaction_city:17839–17850, 18107–18117'],
  '관심종자': ['인물 생성 시 칭찬 선호 또는 언어적 압박 성향의 해당 값을 통합해 부여할 수 있다. 공개 조건을 충족하면 표시된다.', `generate_stock:1346, 1750 · jo9_traits:${attentionFreshLine} · #static_base:2142–2143`],
  '아레나 챔피언': ['투기장 단계 5~8에서 표시된다.', '#static_base:1976'],
  '아레나 그랜드 챔피언': ['투기장 단계 9 이상에서 표시된다. 에게야 영입 이벤트는 9단계로 설정한다.', '#static_base:1977 · interaction_city:17847, 18114'],
  '경주 챔피언': ['경주에서 4~6승을 기록하면 표시된다.', '#static_base:1978–1980'],
  '경주 그랜드 챔피언': ['경주에서 7승 이상을 기록하면 표시된다.', '#static_base:1982–1985'],
};
const activityGenerationLine = traitLine(/gs 'jo9_traits', 'activity_generate', 'stock'/);
const activityRepairLine = traitLine(/if \$args\[0\] = 'activity_repair':/);
assert.ok(activityGenerationLine && activityRepairLine);
const activityOrigin = '무작위 생성에서 일과 휴식 성향을 합쳐 부여될 수 있다. 기존 인물의 이전 성향은 게임 내 인물 갱신 시 통합된다. 공개 조건을 충족하면 표시된다.';

for (const row of result) {
  const field = row.id.match(/^\w+/)[0];
  const value = row.id.match(/ = (-?\d+)$/)?.[1] || ({ '색정광': '1', '평화주의자': '1' }[row.name]);
  const grow = training.get(`${field}=${value}`);
  const baseLine = Number(row.source.match(/#static_base:(\d+)/)?.[1]);
  const revealed = baseLine && base.slice(Math.max(0, baseLine - 5), baseLine).some(line => line.includes(`['${field}_revealed']`) && line.includes('spell_revelio'));
  const modLine = Number(row.source.match(/^jo9_traits:(\d+)/)?.[1]);
  const modRevealed = modLine && qspTrait[modLine - 1].includes('spell_revelio');
  const unique = specific[row.name];
  if (field === 'activity_sign') {
    row.acquisition = activityOrigin;
    row.acquisitionSource = `jo9_traits:${activityRepairLine}, ${activityGenerationLine}, ${modLine}`;
    row.price = '별도 구매 없음';
  } else if (unique) {
    [row.acquisition, row.acquisitionSource, row.price = '별도 구매 없음'] = unique;
  } else if (row.category === '상태') {
    row.acquisition = '해당 상태 수치나 공개 조건에 도달하면 화면에 표시된다.';
    row.acquisitionSource = row.source;
    row.price = '해당 없음';
  } else if (field === 'metabolism') {
    row.acquisition = '생성 시 초기 대사량이 정해진다. 아나볼릭은 대사량을 한 단계 올리며 노예에게 투약하는 코르티코는 한 단계 내린다.';
    row.acquisitionSource = 'generate_stock:1287, 1541–1544 · interaction:11581–11598 · pharmacy:267–291';
    row.price = '아나볼릭·코르티코 각각 3회분 900스파크';
  } else {
    const sourceName = modLine ? 'jo9_traits' : 'generate_stock';
    const generator = locations.get(sourceName);
    const start = modLine ? 272 : 1250;
    const end = modLine ? 345 : 1545;
    const line = generator.findIndex((text, index) => index >= start && index < end && !/^\s*!/.test(text) && new RegExp(`stock\\['${field}'\\]\\s*=(?!=)`).test(text));
    const steps = [];
    const sources = [];
    if (line >= 0) {
      steps.push('인물 생성 시 부여될 수 있다.');
      sources.push(`${sourceName}:${line + 1}`);
    }
    if (grow) {
      steps.push(`관련 경험치 ${grow.threshold} 초과와 기존 성향 조건을 충족하면 후천적으로 얻을 수 있다.`);
      sources.push(grow.source);
    }
    if (revealed || modRevealed) {
      steps.push('숨겨진 값은 발견 조건을 충족하거나 레벨리오가 활성화되면 표시된다.');
      sources.push(row.source.split(' · ')[0]);
    }
    row.acquisition = steps.join(' ') || '표시 조건은 확인했으나 획득 경로는 특정하기 어렵다.';
    row.acquisitionSource = sources.join(' · ') || row.source;
    row.price = line < 0 && !grow ? '확인된 가격 없음' : '별도 구매 없음';
  }
}
assert.ok(result.every(row => row.price && row.acquisition));
fs.writeFileSync(path.join(__dirname, 'traits.json'), JSON.stringify({ rows: result, coverage, hash: document.hash }, null, 2) + '\n');
const categories = Object.fromEntries(Object.entries(Object.groupBy(result, row => row.category)).map(([category, entries]) => [category, entries.length]));
console.log(JSON.stringify({ count: result.length, policies: policies.size, categories, hash: document.hash }));
