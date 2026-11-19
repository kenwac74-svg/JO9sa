'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {adaptRule,symbolsFor,describeVariable} = require('./appearance-rules.cjs');

test('route comparison treats only renamed code identifiers as equivalent', () => {
  const legacy = "if no_loli ! 1 and stock['age'] = CONST_INT['loli_age']: $special_age = 'loli'";
  const current = "if fresh_mode ! 1 and stock['age'] = CONST_INT['fresh_age']: $special_age = 'loli'";
  assert.equal(adaptRule(legacy), current);
  assert.notEqual(adaptRule(legacy.replace('! 1','! 2')), current);
  assert.notEqual(adaptRule(legacy.replace("'loli'", "'other'")), current);
  assert.equal(adaptRule("! no_loli ! 1\r\n*pl 'no_loli CONST_INT[\"loli_age\"]'"), "! no_loli ! 1\r\n*pl 'no_loli CONST_INT[\"loli_age\"]'");
});

test('replay can use either live version while keeping the existing resource tokens', () => {
  const legacy = symbolsFor(new Map([['init_game','no_loli = 0'],['#static_base',"CONST_INT['loli_age'] = 1\nCONST_INT['milf_age'] = 2"]]));
  const current = symbolsFor(new Map([['init_game','fresh_mode = 0 & no_loli = fresh_mode'],['#static_base',"CONST_INT['fresh_age'] = 1\nCONST_INT['mature_age'] = 2"]]));
  assert.equal(adaptRule("if fresh_mode = 2: x = CONST_INT['mature_age']",legacy),"if no_loli = 2: x = CONST_INT['milf_age']");
  assert.equal(adaptRule("if no_loli = 2: x = CONST_INT['milf_age']",current),"if fresh_mode = 2: x = CONST_INT['mature_age']");
  assert.deepEqual(describeVariable('$age[actor]').values.map(r=>r.code),['young','loli','milf']);
  assert.equal(describeVariable('other_variable'),undefined);
});
