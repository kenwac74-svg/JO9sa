// 특성 열람표의 JSON 바인딩 키가 게임(2.4.1 get_stock_seed)이 읽는 seed_ 키인지 분류하고 기대 목록과 대조한다
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async f=>JSON.parse(await readFile(new URL('./dist/data/'+f,import.meta.url),'utf8'));
const traits=(await read('traits.json')).rows,seed=new Set((await read('game-seed-keys.json')).keys);
assert.equal(traits.length,128);
assert(traits.every(t=>t.binding?.key),'모든 특성에 바인딩 키가 있어야 한다');
const unread=[...new Set(traits.filter(t=>!seed.has(t.binding.key)).map(t=>t.binding.key))].sort();
// 2026-11-11 대조 결과. 게임이 seed_로 읽지 않는 키: 생성 후 상태값, jo9 확장 특성, 계산값.
assert.deepEqual(unread,['activity_sign','arena_level','brand','deprivation_attitude','has_ride_win','jo9_ambition','jo9_attention','jo9_combat_trait','jo9_constitution','jo9_focus','jo9_grudge','jo9_learning_trait','jo9_peerless','jo9_slave_nature','jo9_versatile','pregnant','rehabilitation','sanity','wounds']);
for(const key of ['water_attitude','homosexualism','nymphomania','virginity','meekness','defiant','jo9_gag_reflex','jo9_voice_trait'])assert(seed.has(key),key+'는 게임이 읽어야 한다');
const count=traits.filter(t=>!seed.has(t.binding.key)).length;
assert.equal(count,40);
console.log(`PASS · 특성 ${traits.length}개 중 게임이 읽는 바인딩 ${traits.length-count}개, 게임 미적용 ${count}개(키 ${unread.length}종)`);
