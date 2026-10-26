'use strict';
// Read-only inventory. Outputs only a compact report next to this script.
const fs = require('node:fs');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw = fs.readFileSync(source), doc = core.parse(raw);
if (!core.serialize(doc).equals(raw)) throw Error('QSP byte roundtrip failed');
const literal = /jo9_work_ethic|passion_comfort/i;
const related = /jo9_activity_(day|count)|jo9_traits_personality.*'activity'/i;
const locations = [], actionRefs = [], relatedRefs = [];
for (const loc of doc.locations) {
  const lines = core.shift(doc.lines[loc.body], 5).split('\r\n');
  const refs = [];
  for (let i = 0; i < lines.length; i++) {
    if (literal.test(lines[i])) refs.push({line: i + 1, code: lines[i]});
    if (related.test(lines[i])) relatedRefs.push({location: loc.name, line: i + 1, code: lines[i]});
  }
  if (refs.length) locations.push({location: loc.name, refs});
  const actionCount = Number(core.shift(doc.lines[loc.body + 1], 5));
  for (let i = 0; i < actionCount; i++) {
    const code = core.shift(doc.lines[loc.body + 4 + i * 3], 5);
    if (literal.test(code)) actionRefs.push({location: loc.name, action: i, code});
  }
}
const jsonRoot = path.join(path.dirname(source), 'json', 'slaves'), seeds = [];
for (const file of fs.readdirSync(jsonRoot)) {
  if (!file.endsWith('.json')) continue;
  const body = fs.readFileSync(path.join(jsonRoot, file), 'utf8');
  if (!literal.test(body)) continue;
  const data = JSON.parse(body.replace(/^\uFEFF/, ''));
  const fields = Object.fromEntries(Object.entries(data).filter(([key]) => literal.test(key)));
  seeds.push({file, fields});
}
const result = {source, sha256: core.hash(raw), byteRoundtrip: true,
  locations, actionRefs, relatedRefs, seeds};
fs.writeFileSync(path.join(__dirname, 'inventory.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({sha256: result.sha256, locations: locations.length,
  refs: locations.reduce((n, l) => n + l.refs.length, 0), actionRefs: actionRefs.length,
  relatedRefs: relatedRefs.length, seeds: seeds.length}));
