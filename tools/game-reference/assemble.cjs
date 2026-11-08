'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../text-workshop/core.cjs');

const source = path.join(__dirname, 'reference-template.html');
const output = path.join(__dirname, 'jo9-reference.html');
const game = process.argv[2];
assert.ok(game, 'Usage: node assemble.cjs <game/jack.qsp>');
const qsp = fs.readFileSync(game);
const hash = crypto.createHash('sha256').update(qsp).digest('hex');
const read = kind => {
  const set = JSON.parse(fs.readFileSync(path.join(__dirname, (kind === 'items' ? 'items.input' : kind) + '.json'), 'utf8').replace(/^\ufeff/, ''));
  assert.equal(set.hash.toLowerCase(), hash, `${kind} uses a different QSP`);
  assert.ok(set.rows.length > 0 && set.rows.every(row => row.name && row.category && row.source), `${kind} contains an incomplete row`);
  return set;
};
const data = { traits: read('traits'), items: read('items') };
const itemRows = new Map(data.items.rows.map(row => [row.id, row]));
function offer(id, price, acquisition, acquisitionSource) {
  const row = itemRows.get(id);
  assert.ok(row, `Missing item: ${id}`);
  Object.assign(row, { price, acquisition });
  if (acquisitionSource) row.acquisitionSource = acquisitionSource;
}
const grocery = '식료품점 《미식가들》';
const groceryPrices = { eggs: 30, milk: 30, cream: 30, cheese: 30, vegetables: 10, grain: 10, spice: 10, alcohol: 10, mince: 7, meat: 20 };
for (const [id, price] of Object.entries(groceryPrices)) {
  const acquisition = id === 'eggs' ? `${grocery}\n축사에서 생산` : grocery;
  offer(`fridge['${id}']`, `${price}스파크 / 5개`, acquisition);
}
offer("fridge['virgin_meat']", '도축비 5스파크\n수량은 평가 결과에 따름', '정육점 도축 의뢰');
offer('spawn_semen', '별도 구매가 미확인', '저택에서 안개괴물 산란액 수확');
offer("jo9_agraba_stock['fruit']", '금화 25 또는 250스파크 / 1개', '아그라바 발삼의 상점');
offer("jo9_agraba_stock['wine']", '금화 25 / 1개', '아그라바 선술집 《푸른 황소》');
for (const id of ['koffe', 'kanabis', 'meth', 'opium']) offer(`lab_store['${id}']`, '10스파크 / 5개', '미스트라의 마녀 상점');
offer("lab_store['slime']", '별도 구매가 미확인', '사육 중인 안개괴물의 성장·사망 이벤트');
offer('molar_of_wolf', '전투 보상', '와그 전투 승리 후 어금니가 없으면 2개 획득');
offer('potion_of_mystra', '1,500스파크 + 와그의 어금니 1개 / 1회분', '미스트라의 마녀 상점');
const demoGoods = { art_material: [4, 44], percussion: [16, 45], woodwind: [4, 46], violin: [4, 47], piano: [2, 48] };
for (const [id, [quantity, line]] of Object.entries(demoGoods)) {
  offer(id, '튜토리얼 기본 지급\n일반 판매가 미확인', `튜토리얼 시작 시 ${quantity}개\n일반 진행 획득처 미확인`, `init_demo_game:${line}`);
}
offer('vibrator', '시작 비품', '일반 새 게임 시작 시 기본 비품으로 지급', 'init_game:122');

const pharmacy = '마리아나 물약 상점';
const brewing = '저택 연금실에서 조제';
const potionPrices = { 'приворотное_зелье': 700, 'вакхический_нектар': 800, 'тонизируюзщий_эликсир': 800, 'целительный_бальзам': 1200, 'афродизиак': 600, 'мощный_афодизиак': 700, 'вода_леты': 600 };
for (const [id, price] of Object.entries(potionPrices)) offer(id, `${price.toLocaleString('ko')}스파크 / 5회분\n조제 시 1스파크 + 재료 / 1회분`, `${pharmacy}\n${brewing}`);
for (const id of ['метаболизм_плюс', 'метаболизм_минус', 'жир_плюс', 'жир_минус']) offer(id, '900스파크 / 3회분', pharmacy);
offer('chaotic_essence', '900스파크 / 1회분', pharmacy);
offer('brainwashing_potion', '1스파크 + 재료 / 조제 성공 1회분', brewing);
for (const id of ['жир_плюс', 'жир_минус', 'целительный_бальзам', 'вакхический_нектар', 'приворотное_зелье', 'мощный_афодизиак']) {
  itemRows.get(id).acquisition += '\n동부 주거 구역 피르긴 의뢰 보상 5회분';
}
for (const id of ['приворотное_зелье', 'целительный_бальзам', 'вакхический_нектар', 'тонизируюзщий_эликсир']) {
  itemRows.get(id).acquisition += '\n주안수 의뢰 보상 5회분';
}

const doc = core.parse(qsp);
const food = doc.locations.find(location => location.name === '#food_base');
const foodSource = core.shift(doc.lines[food.body], 5);
const grades = new Map(Array.from(foodSource.matchAll(/^\$food_quality\[(\d+)\].*'<b>([^<]+)<\/b>'/gm), m => [m[1], m[2]]));
const ingredients = new Map(data.items.rows.flatMap(row => {
  const key = String(row.id).match(/^fridge\['([^']+)'\]$/)?.[1];
  return key ? [[key, row.name]] : [];
}));
let recipes = 0;
for (const [line, text] of foodSource.split(/\r?\n/).entries()) {
  if (!/^\s*dynamic\s+\$fb_cycle\s*,/.test(text)) continue;
  const args = Array.from(text.matchAll(/'((?:''|[^'])*)'/g), m => m[1].replaceAll("''", "'"));
  assert.equal(args.length, 6, `Unparsed recipe at #food_base:${line + 1}`);
  const [id, label, ...materials] = args;
  const suffix = /\s*\[<<\$food_quality\[(\d+)\]>>\]\s*$/;
  const name = label.replace(suffix, '').trim();
  if (!name) continue;
  const grade = grades.get(label.match(suffix)?.[1]);
  const used = materials.filter(key => key !== 'none').map(key => {
    assert.ok(ingredients.has(key), `Unknown recipe ingredient: ${key}`);
    return ingredients.get(key);
  });
  const description = [grade && `등급 ${grade}`, used.length ? `조리 재료 ${used.join(', ')}` : '추가 재료 없음'].filter(Boolean).join(' · ');
  const price = used.length ? '조리 재료 소모' : '별도 구매가 미확인';
  data.items.rows.push({ name, category: '조리 음식', id, description, price, acquisition: '저택 주방에서 조리', source: `#food_base:${line + 1}` });
  recipes++;
}
data.items.coverage += ` 조리 음식 ${recipes}개는 등급과 재료를 함께 표시합니다. 기본가는 아이템 정의값이며, 확인된 판매가는 판매 단위와 함께 표시합니다.`;
require('./refresh-current.cjs').apply(data, doc);
for (const kind of ['traits', 'items']) fs.writeFileSync(path.join(__dirname, kind + '.json'), JSON.stringify(data[kind], null, 2) + '\n');
const encoded = JSON.stringify(data).replaceAll('<', '\\u003c');
const template = fs.readFileSync(source, 'utf8');
const html = template.replace('__JO9_REFERENCE_DATA__', () => encoded);
new vm.Script(html.match(/<script>\s*([\s\S]+?)<\/script>/)[1]);
assert.deepEqual(JSON.parse(html.match(/id="reference-data" type="application\/json">([^\n]+)<\/script>/)[1]), data);
const pending = `${output}.${process.pid}.tmp`;
fs.writeFileSync(pending, html, { flag: 'wx' });
fs.renameSync(pending, output);
console.log(JSON.stringify({ output, hash, traits: data.traits.rows.length, items: data.items.rows.length }));
