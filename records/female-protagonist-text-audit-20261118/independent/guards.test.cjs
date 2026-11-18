'use strict';
const assert = require('node:assert/strict');
const g = require('./guards.cjs');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
let cases = 0;
function check(name, fn) { fn(); cases++; console.log('PASS ' + name); }
function result(body) { return g.annotate(body, core.literals(body)); }
function named(body, label) { const r = result(body), e = r.annotations.find(x => x.text === label); assert.ok(e, label); return e; }
function female(body, label) { assert.equal(named(body, label).guardClassification.femaleOnly, true, label); }
function shared(body, label) { assert.equal(named(body, label).guardClassification.femaleOnly, false, label); }

check('female comparison and unknown conjunct', () => {
  const b = "if hero_choice > 100 and money > 0:\n'p'\nend\n'q'";
  female(b, 'p'); shared(b, 'q'); assert.equal(named(b, 'p').conditions[0].expression, 'hero_choice > 100 and money > 0');
});
check('ELSE complement preserves reserved ID100 ambiguity', () => {
  const b = "if hero_choice < 100:\n'm'\nelse\n'f'\nend";
  shared(b, 'f'); assert.equal(named(b, 'f').guardClassification.reserved100Ambiguity, true);
  assert.equal(g.classify(named(b, 'f').conditions, { maleIds: Array.from({ length: 18 }, (_, i) => i + 1), femaleIds: [101, 102] }).femaleOnly, true);
});
check('ELSEIF excludes all preceding branches', () => {
  const b = "if hero_choice < 101:\n'm'\nelseif money > 0:\n'f1'\nelseif value = 2:\n'f2'\nelse\n'f3'\nend";
  female(b, 'f1'); female(b, 'f2'); female(b, 'f3');
  assert.match(named(b, 'f2').conditions[0].expression, /hero_choice < 101.*money > 0/);
});
check('nested IF inside FOR and ACT balances END independently', () => {
  const b = "if hero_choice > 100:\nfor i = 1 to 3:\nact 'button':\nif chance > 1:\n'inner'\nend\nend\n'after-act'\nend\n'after-for'\nend\n'outside'";
  female(b, 'button'); female(b, 'inner'); female(b, 'after-act'); female(b, 'after-for'); shared(b, 'outside');
  assert.deepEqual(result(b).diagnostics, []);
});
check('inline IF and ELSE expire on the logical newline', () => {
  const b = "if hero_choice > 100: 'f' else 'm'\n'outside'";
  female(b, 'f'); shared(b, 'm'); shared(b, 'outside'); assert.deepEqual(result(b).diagnostics, []);
});
check('nested inline IF selects the nearest IF', () => {
  const b = "if hero_choice > 100: if money > 0: 'f' else 'f2'\n'outside'";
  female(b, 'f'); female(b, 'f2'); shared(b, 'outside');
});
check('braces isolate IF scopes and retain inherited guards', () => {
  const b = "$one = {\nif hero_choice > 100:\n'f'\nend\n}\n$two = {\n'shared'\n}\nif hero_choice > 100:\n$three={\n'inherited'\n}\nend";
  female(b, 'f'); shared(b, 'shared'); female(b, 'inherited'); assert.deepEqual(result(b).diagnostics, []);
});
check('inline dynamic brace multiline body does not expire outer inline IF', () => {
  const b = "if hero_choice > 100: $x = {\n'f'\n}\n'outside'";
  female(b, 'f'); shared(b, 'outside');
});
check('multiline and quote-doubled comments cannot create branches', () => {
  const b = "! if hero_choice > 100: 'comment\ncontinued'\n'shared'\n! { if hero_choice > 100:\n'also comment'\n}\n'after'";
  shared(b, 'shared'); shared(b, 'after'); assert.deepEqual(result(b).diagnostics, []);
});
check('string contents are opaque including dynamic and HTML code', () => {
  const b = "$x = 'if hero_choice > 100: ''embedded'''\n'<a href=\"exec:if hero_choice>100: msg 1\">label</a>'\n'shared'";
  for (const e of result(b).annotations) assert.equal(e.guardClassification.femaleOnly, false);
});
check('continued IF header retains enclosing condition', () => {
  const b = "if hero_choice > 100 and _\n (money > 0 or value = 1):\n'f'\nend\n'outside'";
  female(b, 'f'); shared(b, 'outside'); assert.deepEqual(result(b).diagnostics, []);
});
check('unknown disjunction cannot prove female-only', () => {
  assert.equal(g.classify(['hero_choice > 100 or money > 0']).femaleOnly, false);
  assert.equal(g.classify(['hero_choice > 100 and money > 0']).femaleOnly, true);
  assert.equal(g.classify(['not (hero_choice < 101)']).femaleOnly, true);
  assert.equal(g.classify(['100 < hero_choice']).femaleOnly, true);
});
check('malformed branch syntax stays explicitly unresolved', () => {
  const b = "if hero_choice > 100\n'f'\nend";
  shared(b, 'f'); assert.ok(result(b).diagnostics.some(d => d.kind === 'if-without-header-colon'));
});
check('hero-choice mutation after a guard invalidates proof', () => {
  const b = "if hero_choice > 100:\nhero_choice = 1\n'p'\nend";
  shared(b, 'p'); assert.ok(named(b, 'p').uncertainties.some(d => d.kind === 'hero-choice-written-after-guard'));
});
check('nonhero LOOP balancing and hero-dependent header uncertainty', () => {
  const b = "if hero_choice > 100:\nloop while i < 2:\n'f'\nend\nend\nloop while hero_choice > 100:\n'unknown-loop'\nend";
  female(b, 'f'); shared(b, 'unknown-loop'); assert.ok(named(b, 'unknown-loop').uncertainties.length);
});
check('malformed curly block cannot leak a female guard to next definition', () => {
  const b = "$x={\nif hero_choice>100:\n'f'\n}\n$y={\n'q'\n}";
  shared(b, 'q'); assert.ok(result(b).diagnostics.some(d => d.kind === 'unclosed-scope-before-brace'));
});
check('jump label loop is not a LOOP block', () => {
  const b = ":loop\nif hero_choice > 100: 'f'\nif chance > 0: jump 'loop'\n'shared'";
  female(b, 'f'); shared(b, 'shared'); assert.deepEqual(result(b).diagnostics, []);
});
check('unmatched END is reported without contaminating an independent later IF', () => {
  const b = "end\nif hero_choice > 100:\n'f'\nend";
  female(b, 'f'); assert.ok(result(b).diagnostics.some(d => d.kind === 'unmatched-end'));
});
console.log(JSON.stringify({ passed: cases }));
