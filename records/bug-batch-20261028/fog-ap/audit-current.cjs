'use strict';
// Read-only audit; no QSP candidate and no production/save writes.
const fs = require('node:fs');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const raw = fs.readFileSync(game + '/jack.qsp');
const doc = core.parse(raw);
const expected = 'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae';
if (doc.hash !== expected) throw Error('WORK changed: ' + doc.hash);
const excerpts = [];
const index = [];
function add(source, name, ranges, label) {
  const loc = source.locations.find(x => x.name === name);
  if (!loc) throw Error('Missing location ' + name);
  const lines = core.shift(source.lines[loc.body], 5).split(/\r?\n/);
  index.push({source: label, location: name, encodedBodyPhysicalLine: loc.body + 1, ranges});
  for (const [a, b] of ranges) {
    excerpts.push('\n' + label + ' LOCATION ' + name + ' | body lines ' + a + '-' + b);
    for (let i = a; i <= b; i++) excerpts.push(i + ': ' + lines[i - 1]);
  }
}
const ranges = {
  jo9_fog_relay: [[1, 57], [84, 116], [144, 173], [198, 211]],
  'начать_бой': [[10, 20], [142, 147], [192, 215]],
  'конец_боя': [[9, 14]],
  'выход_из_боя': [[1, 26], [129, 149], [209, 220], [232, 289]],
  '#dynamic': [[1318, 1350], [1418, 1432]],
  city_menu_form: [[722, 733]],
  interaction_city: [[10857, 10885]],
  sjm_UI_UIadds: [[290, 298]],
  '$calculate_attributes': [[468, 485]],
  '$menu': [[53, 58], [128, 142]],
};
for (const [name, spans] of Object.entries(ranges)) add(doc, name, spans, 'CURRENT');
const original = core.parse(fs.readFileSync('G:/somi/JO9sa/source/jack_2026-10-01.qsp'));
add(original, 'выход_из_боя', [[214, 248]], 'ORIGINAL_20261001');
add(original, 'city_menu_form', [[705, 720]], 'ORIGINAL_20261001');
const p17 = JSON.parse(fs.readFileSync('G:/somi/JO9sa/mods/2026-10-17_fog_relay.json'));
const helper17 = p17.add_locations.find(x => x.name === 'jo9_fog_relay').body.split(/\r?\n/);
excerpts.push('\nPATCH_20261017 jo9_fog_relay | energy settlement lines');
for (let i = 0; i < helper17.length; i++) if (/energy|выносливость|settled/.test(helper17[i])) excerpts.push(i + 1 + ': ' + helper17[i]);
const p22 = JSON.parse(fs.readFileSync('G:/somi/JO9sa/mods/2026-10-22_registered_bugfixes.json'));
const energyEdits = p22.edits.filter(x => x.location === 'jo9_fog_relay');
excerpts.push('\nPATCH_20261022 registered_bugfixes | energy changes\n' + JSON.stringify(energyEdits, null, 2));
fs.writeFileSync(path.join(__dirname, 'qsp-evidence.txt'), excerpts.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'source-index.json'), JSON.stringify({sha256: doc.hash, originalSha256: original.hash, locations: index}, null, 2));
function staminaToEnergy(s) {
  let result = -4;
  for (const [threshold, energy] of [[10,-3],[15,-2],[20,-1],[25,0],[35,1],[45,2],[55,3],[65,4],[75,5]]) if (s >= threshold) result = energy;
  return result;
}
const rows = [];
for (const s of [75,65,55,45,35,25,20,15,10,0]) {
  const before = 5;
  const now = Math.min(staminaToEnergy(s), before - 1);
  const proposal = Math.min(staminaToEnergy(s), before - 2);
  rows.push({startingAssistantAP: before, remainingCombatStamina: s, staminaDerivedAP: staminaToEnergy(s), currentAssistantAP: now,
    currentAssistantCost: before - now, proposedAssistantAP: proposal, proposedAssistantCost: before - proposal});
}
function easyDay(assistantCost, masterCost, prohibitOverspend) {
  let master = 5, assistant = 5;
  const fights = [];
  while (master > 2 && assistant > 0 && (!prohibitOverspend || assistant >= assistantCost)) {
    master -= masterCost;
    assistant -= assistantCost;
    fights.push({fight: fights.length + 1, masterAP: master, assistantAP: assistant});
  }
  return fights;
}
const calculation = {method: 'Arithmetic translation of current threshold/min expressions; not native runtime or full combat simulation.',
  assumptions: 'Both actors start at AP5 after arrival; half actions0; no equipment/traits/cheats/recovery/other costs; each victory only incurs the stated minimum.',
  rows,
  currentEasyDay: easyDay(1,0,false),
  proposedWithCurrentPositiveEntryGuard: easyDay(2,1,false),
  proposedWithNoOverspendAssumption: easyDay(2,1,true),
  authorization: 'PROPOSAL_ONLY_NOT_APPROVED_FOR_IMPLEMENTATION'};
fs.writeFileSync(path.join(__dirname, 'cost-model.json'), JSON.stringify(calculation, null, 2));
console.log(JSON.stringify({workSha256: doc.hash, originalSha256: original.hash, productionWrites: 0,
  helper17MinimumCost: 0, currentMinimumCompanionCost: 1, proposedMinimumCompanionCost: 2,
  easyDayCurrent: calculation.currentEasyDay.length, proposedCurrentGuard: calculation.proposedWithCurrentPositiveEntryGuard.length,
  proposedNoOverspend: calculation.proposedWithNoOverspendAssumption.length}, null, 2));
