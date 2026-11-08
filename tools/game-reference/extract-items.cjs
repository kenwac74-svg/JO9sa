'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('../text-workshop/core.cjs');

const qsp = process.argv[2];
assert.ok(qsp, 'Usage: node extract-items.cjs <game/jack.qsp>');
const doc = core.parse(fs.readFileSync(qsp));
const read = name => {
  const loc = doc.locations.find(candidate => candidate.name === name);
  assert.ok(loc, `Missing source location: ${name}`);
  return core.shift(doc.lines[loc.body], 5);
};
const rows = new Map();
function record(row) {
  const key = row.id.toLowerCase();
  const old = rows.get(key);
  if (!old) {
    rows.set(key, row);
    return;
  }
  if (old.name !== row.name) {
    old.aliases ||= [];
    if (!old.aliases.includes(row.name)) old.aliases.push(row.name);
  }
  if (!old.description) old.description = row.description;
}

const literal = String.raw`('(?:''|[^'\r\n])*'|"(?:""|[^"\r\n])*")`;
const unquote = text => text.slice(1, -1).replaceAll(text[0] + text[0], text[0]);
function clean(value) {
  return value.replace(/<!--[^]*?-->/g, '').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&')
    .split('\n').map(line => line.trim()).filter(Boolean).join('\n');
}
const baseGroups = new Map([
  ['!MASTER ITEMS', '주인공 의상·장신구'],
  ['!OTHER ITEMS', '기타 장비'],
  ['!ITEMS WORN ON BODY', '의상'],
  ['!ITEMS WORN ON HANDS', '손 장비'],
  ['!ITEMS WORN ON FEET', '신발'],
  ['!JEWELRY AND ACCESSORIES FOR HANDS', '장신구'],
  ['!JEWELRY AND ACCESSORIES FOR PIERCINGS', '장신구'],
  ['!ITEMS WORN ON HEAD', '머리 장비'],
  ['!ITEMS WORN ON NECK - NOT SLAVE COLLARS (SLAVE WEARING THESE CAN ESCAPE)', '장신구'],
  ['!ITEMS WORN ON NECK - SLAVE COLLARS (SLAVE WEARING THESE CANNOT ESCAPE)', '목걸이·목줄'],
  ['!ITEMS WORN ON HANDS OR FEET', '손발 장비'],
  ['!ITEMS FOR ANIMAL ROLEPLAY (TAIL IS CLOTHING SLOT, HARNESS IS HAND SLOT)', '특수 장비'],
  ['!ONE TIME PURCHASES FOR RULES OR RULE ENFORCEMENT', '가구·용품'],
  ['!PRESENTS', '선물'],
]);
const costumeParts = new Set(['underwear_nun', 'wimple_nun', 'rosary_nun', 'heels_nun', 'slut_dress', 'slut_wig', 'slut_boots']);
const extraCostumeSlots = new Map([['klips', '장신구'], ['brasletyboho', '장신구'], ['encrustedbracelet', '장신구'], ['kaffs', '장신구'], ['sleivbraslety', '장신구'], ['sandalii', '신발']]);
const basePattern = new RegExp(String.raw`^\s*dynamic \$ib_cycle\s*,\s*${literal}\s*,\s*${literal}(?:\s*,\s*(\d+)\s*,\s*${literal})?`, 'i');
let group = '기타 장비';
let baseCount = 0;
const baseSource = '#item_base';
for (const [index, line] of read(baseSource).split(/\r?\n/).entries()) {
  if (baseGroups.has(line.trim())) group = baseGroups.get(line.trim());
  const match = basePattern.exec(line);
  if (!match) continue;
  baseCount++;
  const id = unquote(match[1]);
  const name = unquote(match[2]).replace(/\s*\(\$\d+\)$/, '');
  if (['пусто', 'голая'].includes(id) || !name || name === '-') continue;
  if (id === 'slavecostume') group = '의상';
  const category = costumeParts.has(id) ? '의상 구성품' : extraCostumeSlots.get(id) || group;
  const price = match[3] && Number(match[3]) > 0 ? Number(match[3]) : null;
  const full = match[4] ? clean(unquote(match[4])) : '';
  const graphic = /질속|질구|삽입|성교|자위|박아|좆|애널|음경|유두|가슴을|똥꼬|배설|이물질|마실래|피학|에로틱|성애|잠자리|흥분|성욕|성 교육|성교육|성적|섹스|관능|처녀|훈련용 노예/i;
  const effects = full.split(/\n|\s+-\s+/).filter(part => /^(?:평시\s*:|장악력|기분|교육효율|세련됨|독특함|럭셔리|전투력|머리모양|임신중|목줄\.)/.test(part) && !graphic.test(part));
  const description = [
    group === '주인공 의상·장신구' && !graphic.test(full) ? full : effects.join(' · '),
    price ? `기본 가격 ${price.toLocaleString('ko-KR')}스파크` : '',
    category === '의상 구성품' ? '세트의 개별 장비 부위' : '',
  ].filter(Boolean).join('\n');
  record({ name, category, id, description, source: `${baseSource} ${index + 1}행`, price });
}
assert.equal(baseCount, read(baseSource).split(/\r?\n/).filter(line => /^\s*dynamic \$ib_cycle,/i.test(line)).length);

const combatSource = '#боевые_предметы';
const combat = read(combatSource).split(/\r?\n/);
const assignment = new RegExp(String.raw`^\s*\$item_(name|description)\[${literal}\]\s*=\s*${literal}`);
const combatText = new Map();
const combatRows = [];
group = '전투 무기';
for (const [index, line] of combat.entries()) {
  if (line.includes('SECONDARY WEAPONS')) group = '보조 무기';
  if (/ONE HANDED WEAPONS|TWO-HANDED WEAPONS/.test(line)) group = '전투 무기';
  if (line.includes('CLOTHING - NOT USED')) group = '전투 장비';
  if (line.includes('___ARMOR___')) group = '방어구';
  if (line.includes('___POTIONS___')) group = '물약';
  const match = assignment.exec(line);
  if (!match) continue;
  const [, type, key, value] = match;
  const id = unquote(key);
  const text = clean(unquote(value));
  if (type === 'description') combatText.set(id, text);
  if (type !== 'name' || !text || ['безоружный', 'без_брони'].includes(id)) continue;
  const category = id === 'святой_талисман' ? '보조 무기' : group;
  combatRows.push({ name: text, category, id, source: `${combatSource} ${index + 1}행` });
}
for (const row of combatRows) {
  const description = combatText.get(row.id) || '';
  record({ ...row, description: row.id === 'штаны_и_рубаха' ? `${description}\n미사용으로 표기된 정의` : description });
}

const storageSource = 'master_stat';
const storageRows = read(storageSource).split(/\r?\n/);
const potionEffects = new Map([
  ['아나볼릭', '신진대사 속도를 높인다. 마리아나 상점에서는 900스파크에 3회분을 판매한다.'],
  ['코르티코', '신진대사 속도를 낮춘다. 마리아나 상점에서는 900스파크에 3회분을 판매한다.'],
  ['메게이스', '체지방을 늘린다. 마리아나 상점에서는 900스파크에 3회분을 판매한다.'],
  ['위고비', '체지방을 줄인다. 마리아나 상점에서는 900스파크에 3회분을 판매한다.'],
  ['카오틱 에센스', '제거 대상인 특성 중 하나를 무작위로 없앤다. 부정 특성이 우선이다. 마리아나 상점에서는 900스파크에 1회분을 판매한다.'],
]);
let storageCount = 0;
group = '';
for (const [index, line] of storageRows.entries()) {
  if (line.includes('식품 저장고')) group = '식품·음료';
  if (line.includes('재료상자')) group = '연금술 재료';
  if (line.includes('물약상자')) group = '물약';
  if (line.includes('가구 및 용품')) break;
  if (!group || /^\s*!/.test(line)) continue;
  for (const match of line.matchAll(/(?:'|<br>)\s*([^<>'*]+?)\s*\*<<([^<>]+)>>/g)) {
    const name = match[1].trim();
    const id = match[2].replaceAll('"', "'");
    record({ name, category: group, id, description: potionEffects.get(name) || '', source: `${storageSource} ${index + 1}행` });
    storageCount++;
  }
}
assert.ok(storageCount >= 34, 'Unexpected missing storage rows; review the current inventory');

const furnitureSource = '$furniture_list';
let inventoryKey = '';
let furnitureCount = 0;
for (const [index, line] of read(furnitureSource).split(/\r?\n/).entries()) {
  const condition = /^\s*if\s+(?:inventory\['([^']+)'\]|([a-z_]+))\s*[=>]/i.exec(line);
  if (condition) inventoryKey = condition[1] || condition[2];
  const match = /\$furniture_list\s*\+=\s*'([^'<]+?)\s+(?:x(?:1|<<)|\[<<)/.exec(line);
  if (match && inventoryKey) {
    record({ name: match[1].trim(), category: '가구·용품', id: inventoryKey, description: '', source: `${furnitureSource} ${index + 1}행` });
    furnitureCount++;
  }
}
assert.equal(furnitureCount, 16);

const pharmacy = read('pharmacy');
const oldNames = new Map([
  ['사랑의 묘약', 'приворотное_зелье'], ['바쿠스의 넥타르', 'вакхический_нектар'],
  ['강장 영약', 'тонизируюзщий_эликсир'], ['기적의 연고', 'целительный_бальзам'], ['레테의 물', 'вода_леты'],
]);
for (const match of pharmacy.matchAll(/'([^'\r\n]+?)\s*\(\$(\d+)\)'[),]/g)) {
  const [, name, price] = match;
  const row = rows.get(oldNames.get(name)) || [...rows.values()].find(row => row.category === '물약' && row.name === name);
  if (!row) continue;
  row.shopPrice = Number(price);
  if (name !== row.name) {
    row.aliases ||= [];
    if (!row.aliases.includes(name)) row.aliases.push(name);
  }
}

const output = {
  hash: doc.hash,
  coverage: '현재 QSP의 일반 장비·선물, 전투 장비, 식품 저장고, 연구실 재료·물약, 가구 및 용품 정의를 대조했습니다. 표시명과 ID를 묶고 기본 장비 상태 및 빈 예시를 제외했습니다. 일부 항목의 효과 또는 입수처는 별도 확인이 필요합니다.',
  rows: [...rows.values()],
};
fs.writeFileSync(path.join(__dirname, 'items.input.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ hash: doc.hash, items: rows.size, baseCount, combatNamedItems: combatRows.length, storageCount, furnitureCount }));
