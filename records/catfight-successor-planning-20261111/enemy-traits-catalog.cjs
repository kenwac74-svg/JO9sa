'use strict';
// Read-only QSP extraction. Only combat fields are retained; no narrative text.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qsp = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const out = process.argv[2];
if (!out) throw Error('An output directory is required');
const raw = fs.readFileSync(qsp);
const doc = core.parse(raw);
const loc = doc.locations.find(x => x.name === '#противники');
const lines = core.shift(doc.lines[loc.body], 5).split(/\r?\n/);
const allowed = /^(?:\$(?:название_моба|класс_моба|интеллект|атака_[123]_(?:тип|тип_вреда|штраф|бонус)|суператака_[123]_(?:тип|тип_вреда))|базовое_здоровье|базовая_выносливость|базовый_дух|базовый_вред|базовый_вред_суператаки_[123]|атака_[123]_длительность|хрупкий|тонкое_тело|бессмертный|безустали|бесстрашный|модификатор_[а-яё_]+)$/;
const enemies = new Map();
for (let n = 0; n < lines.length; n++) {
  const m = lines[n].match(/^\s*([^=\[]+)\[(['"])(.*?)\2\]\s*=\s*(.*)$/);
  if (!m) continue;
  const key = m[1].trim(), id = m[3], rhs = m[4].trim();
  if (!allowed.test(key) && !/^\$спецэффект_суператаки_[123]$/.test(key)) continue;
  if (!enemies.has(id)) enemies.set(id, { id, fields: {}, sources: {}, supers: {} });
  const e = enemies.get(id);
  if (/^\$спецэффект_/.test(key)) {
    let code = rhs, end = n;
    while (!code.includes('}') && end + 1 < lines.length) code += '\n' + lines[++end];
    if (!/^\{[\s\S]*\}$/.test(code)) throw Error('Unexpected special block at ' + (n + 1));
    const effects = code.slice(1, -1).trim().split(/\r?\n/).filter(Boolean).map(s => {
      const a = s.trim().match(/^([а-яё_]+)(?:\[(\d+)\])?\s*=\s*(\d+)$/);
      if (!a) throw Error('Unexpected special effect statement');
      return { key: a[1], slot: a[2] === undefined ? 0 : Number(a[2]), value: Number(a[3]) };
    });
    e.supers[key.slice(-1)] = { line: n + 1, endLine: end + 1, effects };
    continue;
  }
  let value;
  const str = rhs.match(/^(['"])(.*?)\1(?:\s*&!.*)?$/);
  if (str) value = str[2];
  else if (/^[+-]?\d+$/.test(rhs)) value = Number(rhs);
  else throw Error('Unexpected combat value ' + key + ' at ' + (n + 1));
  if (Object.hasOwn(e.fields, key)) {
    (e.reassignments ??= []).push({ key, previousValue: e.fields[key], previousLine: e.sources[key], value, line: n + 1 });
  }
  e.fields[key] = value;
  e.sources[key] = n + 1;
}
const list = [...enemies.values()];
if (list.length !== 70) throw Error('Enemy count changed; review scope: ' + list.length);
for (const e of list) for (const k of ['$название_моба', '$класс_моба', '$интеллект', 'базовое_здоровье', 'базовая_выносливость', 'базовый_дух', 'базовый_вред']) {
  if (!Object.hasOwn(e.fields, k)) throw Error('Missing ' + e.id + ':' + k);
}

// Share current names and linkage interpretation with the HTML reference.
const set = require('G:/somi/JO9sa/tools/game-reference/enemies-data.cjs').buildEnemies(doc);
const specialCount = set.rows.reduce((n, e) => n + e.supers.length, 0);
const text = ['# JO9 적 전투 특성 전체 목록', '', set.coverage, '',
  '특수공격은 게임 중 하드에서만 사용한다. 같은 효과 구성은 공통 기술명을 쓰고 적별 피해·지속값을 표시한다. 일반공격 부가상태의 기존 연결 누락은 별도다.', '',
  '## 작동 상태와 주의사항', '', ...set.notes.map(note => '- ' + note), '',
  '## 방어 특성', '', '| 특성 | 뜻 | 활성 적 |', '| --- | --- | ---: |',
  ...set.flagGuide.map(flag => '| ' + flag.name + ' | ' + flag.description + ' | ' + flag.count + ' |'), '',
  '## 상태 효과', '', ...set.statusGuide.map(status => '- ' + status.name + ': ' + status.effect), '',
  '## 특수공격 기술표', '', '| 기술명 | 사용하는 적 | 기본 피해 | 부가효과와 지속 카운터 | 사용 조건 |', '| --- | --- | --- | --- | --- |'];
const effectText = special => special.effects.map(e => e.target + ' ' + e.name + '=' + e.value).join(', ') || '별도 상태 없음';
for (const e of set.rows) for (const special of e.supers) text.push('| ' + special.name + ' | ' + e.name + ' 특수' + special.slot + ' | ' + special.type + ' / ' + special.damageType + ' ' + special.damage + ' | ' + effectText(special) + ' | ' + (special.linkedHard ? '하드 전용 · 기술별 1회' : '현재 미연결') + ' |');
text.push('', '## 전체 적 목록', '');
for (let n=0; n<set.rows.length; n++) {
  const e=set.rows[n]; text.push('### ' + (n+1) + '. ' + e.name, '',
    '- 식별자: ' + e.id + ' · ' + e.category,
    '- 체력 / 스태미나 / 사기 / 기본 피해: ' + e.stats.join(' / '),
    '- 방어 특성: ' + (e.flags.length ? e.flags.join(' / ') : e.flagsDefined ? '활성 플래그 없음' : '별도 설정 없음'),
    '- 저항·약점: ' + (e.resistance.length ? e.resistance.join(', ') : e.resistanceDefined ? '모두 0' : '별도 설정 없음'),
    ...e.warnings.map(w => '- ' + w));
  for (const a of e.attacks) text.push('- 일반' + a.slot + ': ' + a.type + ' / ' + a.damageType + ' · 부가상태 정의(기존 적용 누락): 페널티 ' + a.penalty + ', 보너스 ' + a.bonus + ', 지속값 ' + a.duration);
  for (const special of e.supers) text.push('- ' + special.name + ' · 특수' + special.slot + ': ' + special.type + ' / ' + special.damageType + ' ' + special.damage + ' · ' + effectText(special) + ' · ' + (special.linkedHard ? '하드에서 기술별 전투당 1회' : '현재 미연결'));
  text.push('- 출처: ' + e.source + ' · AI ' + e.ai, '');
}
text.push('기준 QSP SHA-256: ' + doc.hash, '', '전투 구현·검증 범위: ../hard-enemy-specials-20261111/REPORT_KO.md. 춘향은 별도 기획이며 이 정적 적 목록에는 아직 없다.', '');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'ENEMY_TRAITS_KO.md'), text.join('\n').replaceAll('\\n','\n'), 'utf8');
const data = { qsp, qspSha256: doc.hash, location: '#противники', enemyCount: list.length, specialCount,
  reassignments: list.flatMap(e => (e.reassignments || []).map(x => ({ id: e.id, ...x }))), enemies: list };
fs.writeFileSync(path.join(out,'enemy-traits.json'),JSON.stringify(data,null,2)+'\n','utf8');
if (crypto.createHash('sha256').update(fs.readFileSync(qsp)).digest('hex') !== doc.hash) throw Error('WORK changed during extraction');
console.log(JSON.stringify({qspSha256:doc.hash,enemies:list.length,specials:specialCount,names:new Set(set.rows.flatMap(e=>e.supers.map(s=>s.name))).size,hardLinked:set.rows.flatMap(e=>e.supers).filter(s=>s.linkedHard).length}));
