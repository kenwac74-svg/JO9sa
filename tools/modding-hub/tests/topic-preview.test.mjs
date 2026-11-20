import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatorMoodStateLine, simulatorPreviewRoles } from '../overrides/general-dialogue.mjs';

const ordinary = { id: 1302, occupation: 'maid', psy_status: 'docile' };
const role = (q, key) => 'native_' + q + '_' + key + '_core';

test('requirement preview uses specific traits before its no-need fallback', () => {
 const actor = { ...ordinary, passion_luxury: 1, passion_sweets: 1, jo9_work_ethic: -1 };
 assert.deepEqual(simulatorPreviewRoles('1113', actor), [
  role('1113', 'comfort_need'), role('1113', 'luxury_need'), role('1113', 'sweets_need')
 ]);
 assert.deepEqual(simulatorPreviewRoles('1113', { ...ordinary, water_attitude: 2, custom: 1 }), [role('1113', 'no_need')]);
 assert.deepEqual(simulatorPreviewRoles('1113', { ...ordinary, water_attitude: 2, custom: 2 }), [role('1113', 'water_need')]);
 assert.deepEqual(simulatorPreviewRoles('1113', { ...ordinary, jo9_attention: 1 }), [role('1113', 'fame_need')]);
});

test('dislike preview preserves the reply threshold and known trait gates', () => {
 const actor = { ...ordinary, intellect: 4, temperament: 1, obedience: 3, instinct: 2, water_attitude: -1, passion_sweets: -1 };
 assert.deepEqual(simulatorPreviewRoles('1115', actor), [role('1115', 'sweets_dislike'), role('1115', 'water_dislike')]);
 assert.deepEqual(simulatorPreviewRoles('1115', { ...actor, obedience: 2 }), [role('1115', 'hide_dislikes')]);
 assert.deepEqual(simulatorPreviewRoles('1115', { ...actor, instinct: 0 }), [role('1115', 'sweets_dislike')]);
 assert.deepEqual(simulatorPreviewRoles('1115', { ...ordinary, jo9_attention: 1, instinct: 2 }), [role('1115', 'abuse_dislike')]);
});

test('mood preview uses active mood facts and distinguishes fallback relationship states', () => {
 const before = simulatorPreviewRoles('1116', ordinary);
 assert.deepEqual(before, [role('1116', 'slave_pos_')]);
 for (const psy_status of ['resistant', 'hateful', 'optimistic', 'lachrymose']) {
  const actor = { ...ordinary, psy_status };
  assert.deepEqual(simulatorPreviewRoles('1116', actor), ['preview_1116_' + psy_status]);
  assert.deepEqual(simulatorPreviewRoles('1116', actor, { statePreview: false }), before);
  assert.deepEqual(simulatorPreviewRoles('1116', { ...actor, pos_sleep: 1, neg_fear: 2 }), [
   role('1116', 'slave_pos_sleep'), role('1116', 'slave_neg_fear')
  ]);
 }
 assert.deepEqual(simulatorPreviewRoles('1116', { ...ordinary, psy_status: 'broken', pos_sleep: 1 }), [role('1116', 'slave_neg_')]);
 assert.deepEqual(simulatorPreviewRoles('1116', { ...ordinary, psy_status: 'frightened' }), [role('1116', 'slave_neg_fear')]);
 assert.deepEqual(simulatorPreviewRoles('1116', { ...ordinary, psy_status: 'depresive' }), [role('1116', 'slave_neg_angst')]);
});

test('the Julia and named unique preview paths retain their existing roles', () => {
 for (const id of [1448, 2576, 3002]) {
  const unique = { id, passion_sweets: 1, psy_status: 'hateful', pos_sleep: 1 };
  assert.deepEqual(simulatorPreviewRoles('1113', unique), [role('1113', 'no_need')]);
  assert.deepEqual(simulatorPreviewRoles('1116', unique), [role('1116', 'slave_pos_')]);
 }
});

test('each state fallback supplies distinct text at all three speech levels', () => {
 const states = ['resistant', 'hateful', 'optimistic', 'lachrymose'];
 for (const style of [1, 2, 3]) {
  const lines = states.map(state => simulatorMoodStateLine('preview_1116_' + state, style));
  assert.ok(lines.every(Boolean));
  assert.equal(new Set(lines).size, states.length);
 }
 assert.match(simulatorMoodStateLine('preview_1116_optimistic', 1), /놓입니다\.$/u);
 assert.match(simulatorMoodStateLine('preview_1116_optimistic', 2), /놓여요\.$/u);
 assert.match(simulatorMoodStateLine('preview_1116_optimistic', 3), /놓여\.$/u);
});

test('explicit unique flags keep named behaviour for IDs inside the ordinary ranges', () => {
 const base={id:1365,passion_sweets:1};
 for (const marker of [{unique:true},{fixedSexTalk:true}])
  assert.deepEqual(simulatorPreviewRoles('1113',{...base,...marker}),['native_1113_no_need_core']);
});
