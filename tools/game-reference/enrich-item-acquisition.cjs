'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');

const root = process.argv[2];
assert.ok(root, 'Usage: node enrich-item-acquisition.cjs <game-directory>');
const doc = core.parse(fs.readFileSync(path.join(root, 'jack.qsp')));
const dataFile = path.join(__dirname, 'items.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
assert.equal(data.hash, doc.hash);

function read(location) {
  const record = doc.locations.find(entry => entry.name === location);
  assert.ok(record, location);
  return core.shift(doc.lines[record.body], 5);
}
function itemPrice(row) {
  if (Number.isFinite(row.price)) return row.price;
  const display = /기본 가격 ([\d,]+)스파크/.exec(row.description);
  return display ? Number(display[1].replaceAll(',', '')) : null;
}
const priceText = (value, qty = 1) => `${value.toLocaleString('ko-KR')}스파크${qty > 1 ? ` / ${qty}개` : ''}`;
const rows = new Map(data.rows.map(row => [row.id.toLowerCase(), row]));
const offers = new Map();
function addOffer(id, price, acquisition, source) {
  const key = id.toLowerCase();
  if (!rows.has(key)) return;
  if (!offers.has(key)) offers.set(key, []);
  const list = offers.get(key);
  if (!list.some(entry => entry.price === price && entry.acquisition === acquisition)) {
    list.push({ price, acquisition, source });
  }
}

const places = new Map();
for (const match of read('#place_base').matchAll(/^\s*dynamic \$pb_cycle,\s*'([^']+)',\s*'([^']+)',\s*'([^']*)'/gim)) {
  const [, key, name, district] = match;
  places.set(key.toLowerCase(), [district, name].filter(Boolean).join(' · '));
}
const menuIds = JSON.parse(fs.readFileSync(path.join(root, 'json', 'menu_item.json'), 'utf8').replace(/^\uFEFF/, ''));
const menu = new Map();
for (const location of ['#options', '#npc_base', '#npc_base_woman', 'city_menu_form', 'shop_general']) {
  const lines = read(location).split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const match = /^\s*func\s*\(\s*'\$menu'\s*,\s*'interaction_city'\s*,\s*[^,]+,\s*(\w+)\s*,\s*'([^']*)'/i.exec(line);
    if (!match) continue;
    const id = Number(match[1]) || menuIds[match[1].toLowerCase()];
    if (id && !menu.has(id)) menu.set(id, { label: match[2], source: `${location} ${index + 1}행` });
  }
}

const interaction = read('interaction_city');
for (const match of interaction.matchAll(/^if\s+interaction_city\s*=\s*(\d+)\b[^\n]*\n([\s\S]*?)^end\b/gim)) {
  const [, event, branch] = match;
  const type = /\$interaction_type\s*=\s*'(buy_item[^']*)'/i.exec(branch)?.[1];
  const item = /\$item_id\s*=\s*'([^']+)'/i.exec(branch)?.[1]?.toLowerCase();
  const place = /\$place\s*=\s*'([^']+)'/i.exec(branch)?.[1]?.toLowerCase();
  const route = menu.get(Number(event));
  const row = rows.get(item);
  if (!type || !place || !route || !row) continue;
  // Only the flea-market assistant options are connected to an entry event.
  if (type.includes('_assistant') && place !== 'baraholka') continue;
  const location = places.get(place) || place;
  const quantity = Number(/\bitem_qty\s*=\s*(\d+)/i.exec(branch)?.[1] || 1);
  const cost = itemPrice(row);
  const suffix = type.includes('_assistant') ? ' (조수용 메뉴)' : '';
  addOffer(item, cost === null ? '가격 미확인' : priceText(cost, quantity), `${location}${suffix} 구매`, `interaction_city ${event}번 · ${route.source}`);
}

const armory = read('shop_wpn').split(/\r?\n/);
for (const [index, line] of armory.entries()) {
  if (!/^\s*func\(/i.test(line)) continue;
  const match = /\$item_id\s*=\s*"([^"]+)"\s*&\s*wpn_price\s*=\s*(\d+)/i.exec(line);
  if (!match) continue;
  const id = match[1].toLowerCase();
  const cost = Math.max(Number(match[2]), itemPrice(rows.get(id) || { description: '' }) || 0);
  addOffer(id, priceText(cost), `${places.get('shop_wpn')} 구매`, `shop_wpn ${index + 1}행 · interaction_city 1114번`);
}

const home = read('interaction');
const paidGiftRoutes = new Set();
for (const line of read('menu_form').split(/\r?\n/)) {
  const match = /^\s*func\s*\(\s*'\$menu'\s*,\s*'goto'\s*,\s*[^,]+,\s*(\w+)\s*,\s*'interaction'\s*,\s*'interaction'\s*,\s*'[^']*\(\$\d+\)'/i.exec(line);
  if (match && menuIds[match[1].toLowerCase()]) paidGiftRoutes.add(menuIds[match[1].toLowerCase()]);
}
for (const match of home.matchAll(/^if\s+interaction\s*=\s*(154\d+)\s*:\s*\r?\n\s*\$interaction_type\s*=\s*'present'\s*\r?\n\s*\$item_id\s*=\s*'([^']+)'/gim)) {
  const [, id, item] = match;
  if (!paidGiftRoutes.has(Number(id)) || !rows.has(item)) continue;
  const cost = itemPrice(rows.get(item));
  if (cost === null) continue;
  const price = priceText(cost);
  addOffer(item, item === 'pony' ? `${price} + 하루 1스파크` : price, '집 · 선물하기', `interaction ${id}번 · interaction_result 선물 처리`);
}

const manual = [
  ['man_rugs', '시작 장비', '새 게임 시작 시 착용', 'init_game 88행 · init_story_mode 54행'],
  ['bull_ring', '보상', '바티칸 외곽 · 중앙 포럼 · 아라무스 의뢰 보상', 'interaction_city 15313번'],
  ['snake_amulet', '보상', '바티칸 외곽 · 중앙 포럼 · 부셴 의뢰 보상', 'interaction_city 15323번'],
  ['chimera_earring', '보상', '바티칸 외곽 · 중앙 포럼 · 가르시드 의뢰 보상 또는 가르시드 전투 후 획득', 'interaction_city 15333번 · выход_из_боя 322행'],
  ['raven_crown', '보상', '바티칸 외곽 · 중앙 포럼 · 발리오스 의뢰 보상', 'interaction_city 15343번'],
  ['кольчуга', '보상', '바티칸 외곽 · 중앙 포럼 · 스펙터 의뢰 보상', 'interaction_city 15353번'],
  ['obereg', '보상', '바티칸 외곽 · 중앙 포럼 · 그라쿠스 의뢰 보상', 'interaction_city 15363번'],
  ['посох_огня', '보상', '도시 외곽 · 안개의 경계 · 전투 전리품 조건 충족 후 유물 이벤트', 'выход_из_боя 601행 · special_screen 23–51행'],
  ['табуретка', '현장 사용', '현장 전투 선택지에서 임시 무기로 사용', '#options 4604행'],
  ['пилохлыст', '구매가 미확인', '아이템 설명에 차후 버전 구매용으로 표기', '#боевые_предметы 270행'],
  ['штаны_и_рубаха', '미사용 정의', '전투 장비 정의에서 미사용으로 표기', '#боевые_предметы 1045행'],
  ['stethoscope', '100스파크', '테크노스피어 · 의료 센터 구매', '#options 568–570행 · sjm_UI_UIadds_buystethoscope 7행'],
  ['vibrator', '시작 지급', '새 게임 시작 시 지급', 'init_game 122행'],
];
for (const entry of manual) addOffer(...entry);

const setParts = new Map([
  ['nuncostume', ['underwear_nun', 'wimple_nun', 'rosary_nun', 'heels_nun']],
  ['slutcostume', ['slut_dress', 'slut_wig', 'slut_boots']],
]);
for (const [set, parts] of setParts) {
  for (const part of parts) {
    for (const offer of offers.get(set) || []) {
      addOffer(part, `세트 ${offer.price}`, `${offer.acquisition} · ${rows.get(set).name} 구성품`, `${offer.source} · interaction_result_city 세트 지급`);
    }
  }
}

let found = 0;
let unresolved = 0;
for (const row of data.rows) {
  if (['물약', '식품·음료', '연금술 재료'].includes(row.category)) continue;
  const routes = offers.get(row.id.toLowerCase());
  if (routes) {
    row.price = [...new Set(routes.map(route => route.price))].join(' · ');
    row.acquisition = routes.map(route => `${route.acquisition}${routes.length > 1 ? ` · ${route.price}` : ''}`).join('\n');
    row.acquisitionSource = [...new Set(routes.map(route => route.source))].join('\n');
    found++;
  } else {
    const price = itemPrice(row);
    row.price = price === null ? '가격 미확인' : `기본가 ${priceText(price)}`;
    row.acquisition = '입수 경로 미확인';
    unresolved++;
  }
}

const output = `${dataFile}.tmp`;
fs.writeFileSync(output, JSON.stringify(data, null, 2) + '\n');
fs.renameSync(output, dataFile);
console.log(JSON.stringify({ found, unresolved, total: data.rows.length }));
