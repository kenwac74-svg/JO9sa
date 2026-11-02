'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw = fs.readFileSync(source);
const doc = c.parse(raw);
const expected = '4d0715391e7ace44aec2c75bfd0bcd7df0b58e813b200778ee06bc636d744659';
assert.equal(doc.hash, expected);
const bodies = new Map(doc.locations.map(l => [l.name, c.shift(doc.lines[l.body], 5)]));
function lines(n) { return bodies.get(n).split(/\r?\n/); }
function evidence(n, pattern) {
  return { location: n, matches: lines(n).flatMap((text, i) => pattern.test(text) ? [{ line: i + 1, text: text.trim() }] : []) };
}
const body = bodies.get('interaction');
const eol = body.includes('\r\n') ? '\r\n' : '\n';
const start = body.indexOf('if interaction = 6007:');
const stop = body.indexOf('if interaction = 6008:', start);
assert(start >= 0 && stop > start);
const block = body.slice(start, stop);
assert.equal(body.split('if interaction = 6007:').length - 1, 1);
const bl = block.split(eol);
const blocks = [];
for (let i = 0; i < bl.length; i++) {
  if (bl[i] !== '\t\t$special_action[1] = {') continue;
  const end = bl.indexOf('\t\t}', i + 1);
  assert(end > i);
  const old = bl.slice(i, end + 1).join(eol);
  const flags = bl.slice(i + 1, end).filter(s => s.trim().startsWith('show_')).map(s => s.trim());
  assert(old.includes("if $text[2] = '' or $text[2] = 'placeholder': dynamic $swap_slave_instances, 'slave', 'pig'"));
  assert(flags.length > 0);
  assert.equal(block.split(old).length - 1, 1);
  const extra = [
    '\t\tif interaction_city = 61131 and hunting_prize > 0:',
    '\t\t\t$special_action[1] = {',
    "\t\t\t\tif $text[2] = '' or $text[2] = 'placeholder':",
    "\t\t\t\t\tdynamic $swap_slave_instances, 'slave', 'pig'",
    '\t\t\t\t\t{{LEDGER_MINUS_HALF}}',
    "\t\t\t\t\t$special_action[1] = '" + flags.join(' & ') + "'",
    '\t\t\t\tend',
    ...flags.map(s => '\t\t\t\t' + s),
    '\t\t\t}',
    '\t\tend'
  ].join(eol);
  blocks.push({ branchIndex: blocks.length + 1, old, newTemplate: old + eol + extra, flags });
  i = end;
}
assert.equal(blocks.length, 3);
const originOld = '\tend' + eol + "\tif pig_state > CONST_INT['no_slave']:";
assert.equal(block.split(originOld).length - 1, 1);
const originNew = '\tend' + eol + '\tif interaction_city = 61131: interaction_city = 0' + eol + "\tif pig_state > CONST_INT['no_slave']:";
const untouchedOriginLocations = ['interaction', 'interaction_result', 'interaction_screen', 'stock_to_slave_nogt'];
const assignments = untouchedOriginLocations.flatMap(n => evidence(n, /\binteraction_city\s*=(?!=)/).matches.map(m => ({ location: n, ...m })));
assert.equal(assignments.length, 0);
const snippets = {
  schema: 1, proposalOnly: true, productionWrites: false, sourceSha256: doc.hash,
  sourceChangedExternallySinceEarlierAudit: { before: 'b7e5b385dcbd5d8e4b4ac18c9556e18bf371f25f6368c3eba729c9374d1cc07b', now: doc.hash, ownProductionWrites: 0 },
  scope: 'interaction event6007 only; match every old block inside that event, not globally',
  helperPlaceholder: { token: '{{LEDGER_MINUS_HALF}}', requiredMeaning: 'Exactly the parent-approved -0.5 through the canonical half-step helper. This template is not executable until substituted.' },
  callbackReplacements: blocks,
  originConsumption: { old: originOld, new: originNew, position: 'After the three conditional action1 definitions, before the existing occupied-pig/action2 block.' },
  reasons: [
    'The existing action1 string is the pending commit token; rewriting it to display-only source consumes the swap and ledger once without a new pending field.',
    'Display-only callbacks retain original page1 flags after page2/back navigation. Emptying the callback entirely can lose this restoration.',
    'Consuming interaction_city61131 at callback construction prevents subsequent ordinary barn6007 from inheriting a stale fog origin.',
    'Ordinary6007 callbacks, all original narrative, action2, resistance, action/energy/hygiene/house effects stay unchanged.'
  ],
  testsRequiredByParent: ['fog cooperative/faint/defiant success; redraw score once', 'fight-back GT before callback gives no score', 'ordinary empty and occupied pig controls give no fog score', 'page1/page2/back restores original flags', 'failed61131 preflight/conversion does not reach6007 or score']
};
const boundary = {
  schema: 1, status: 'READ_ONLY_STATIC_AUDIT', sourceSha256: doc.hash, productionWrites: false, nativeExecuted: false,
  safari8998: {
    wrapperBody: bodies.get('stock_to_slave'),
    preserve: [
      'Call existing func(stock_to_slave_nogt) exactly once; it provides the same source guard, acquisition reset, swap, trait initialization, new-slave mood, optional testing and return contract.',
      'On return1, append the approved +0.5 entry before retaining the original condition: hunting_prize=0 and farid_potential_debt<=0 -> gt hard_return.',
      'If that condition is false, fall through to original8998 continuation; do not unconditionally return to a different screen.',
      'hard_return also sets sbros and may run initial-slave/new-estate/assistant setup; retain the call instead of replacing it with gt $return_lock.',
      'The existing private-room guard in stock_to_slave only applies when curloc is that location. Keep the acquisition local to8998; do not change the shared wrappers.'
    ],
    successOnlyConsumption: 'Using existing safari.slave=-1 and empty slave slot is enough to guard the pending trophy. Consume to1 and award only after successful conversion; generate_stock has no safari.slave reference in this baseline.',
    failureNote: 'The old wrapper exits its own GS on result0; original8998 can then continue. A local stop/reopen on failed conversion is a separate failure-path repair, not byte-identical old flow.',
    evidence: [evidence('stock_to_slave', /./), evidence('stock_to_slave_nogt', /result =|stock_state !|\$swap_slave_instances|init_slave_nature|pos_new_slave|stock_to_slave_testing/), evidence('hard_return', /^sbros =|^if get_initial_slave|gs 'new_estate'|gs 'slave_to_assistant'|^gt \$return_lock/)]
  },
  pig6007: {
    newPersistentPendingVariableRequired: false,
    scoreBoundary: 'Actual delayed slave/pig swap inside special_action1, never initial61131 conversion or generic interaction_result.',
    approved61131Preflight: 'stock_state=slave_exist; hunting_prize>0; slave_state=no_slave; pig_state=no_slave; func(stock_to_slave_nogt)=1.',
    originPreservedAcrossRoutes: { locations: untouchedOriginLocations, interactionCityAssignmentsFound: assignments },
    staleOriginRisk: 'barn does not clear hunting_prize; normal barn6007 links set interaction only. The approved origin-consumption statement is necessary to prevent unrelated later pig assignments scoring.',
    delayedExecution: 'interaction_screen executes special_action[txt] each render without clearing it. Rewriting action1 after commit, not deleting its array element, prevents repeated score and preserves action2 indexing.',
    keepExistingFlags: blocks.map(b => ({ branch: b.branchIndex, flags: b.flags })),
    resistance: '6007 can GT through slave_fights_back before interaction_screen. Built-but-never-executed action must not score.',
    legacySaveBoundary: 'Old saved callback strings are not migrated and do not retroactively gain ledger code.',
    evidence: [evidence('interaction_city', /if interaction_city = 61131:|this option is only available if there is no current slave|interaction = 6007/), evidence('interaction_screen', /special_action\[txt\]/), evidence('barn', /6007/), evidence('main_screen', /^hunting_prize = 0/)]
  },
  cautions: ['No indexed killvar on special_action: removing an element can shift action2.', 'The only intentional origin-state change in the proposal is61131 ->0; retain hunting_prize and all unrelated city IDs.', 'All proposals are templates; parent owns final syntax and native behavior checks.']
};
fs.writeFileSync(__dirname + '/pig-safari-boundary.json', JSON.stringify(boundary, null, 2) + '\n');
fs.writeFileSync(__dirname + '/candidate-snippets.json', JSON.stringify(snippets, null, 2) + '\n');
assert.equal(c.hash(fs.readFileSync(source)), doc.hash);
console.log(JSON.stringify({ sourceSha256: doc.hash, callbackReplacements: blocks.length, originConsumption: 1, productionWrites: false, files: ['pig-safari-boundary.json', 'candidate-snippets.json'] }));
