'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const crypto = require('crypto');
const repo = 'G:/somi/JO9sa';
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(repo + '/tools/text-workshop/core.cjs');
const bytes = fs.readFileSync(game + '/jack.qsp');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const doc = core.parse(bytes);
const body = name => {
  const loc = doc.locations.find(loc => loc.name === name);
  assert(loc, name);
  return core.shift(doc.lines[loc.body], 5).split(/\r?\n/);
};
const find = (name, needle) => body(name).flatMap((line, i) => line.includes(needle) ? [i + 1] : []);
const end = body('end_day_screen');
const rooms = [1, 2, 3, 4].map(n => {
  const role = 'room' + n;
  const lookup = "$bg_path = func('display_pic', '" + role + "', 'clean', 'girls/normal_scenes/')";
  const lines = find('end_day_screen', lookup);
  const start = end.findIndex(line => line.trim() === 'if ' + role + '_auto_clean = 3 - end_day_phase:');
  assert(start >= 0, role + ' automatic cleaning branch');
  assert(end.slice(start, start + 14).some(line => line.includes(lookup)), role + ' automatic cleaning lookup');
  assert(lines.length >= 3, role + ' report/item/automatic lookups');
  assert(find('display_pic', "elseif $main_actor = '" + role + "':").length === 1, role + ' resolver');
  return { role, endDayCleanLookupLines: lines, autoCleanBranchLine: start + 1 };
});
assert(find('interaction', "$bg_path = func('display_pic', 'dynslave', 'clean', 'girls/normal_scenes/')").length === 1);
const scene = body('jo9_room_duty').slice(704, 764).join('\n');
assert(scene.includes("if $jo9_rd_t='': exit"));
assert(!/if jo9_rd_r\s*=\s*1:/.test(scene), 'no extra image override for normal chores');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : [p];
  });
}
const common = files(game + '/content/pic/girls/normal_scenes').filter(p => /^clean.*\.png$/i.test(path.basename(p)));
const dedicated = files(game + '/content/pic/girls/sex_scenes').filter(p => /^\d+_clean(?:_\d+)?\.png$/i.test(path.basename(p)));
assert(common.length > 0);
assert(dedicated.length > 0);
assert.equal(sha(bytes), sha(fs.readFileSync(repo + '/assets/runtime/2.4.1/jack.qsp')));
const result = {
  date: '2026-11-11', status: 'ALREADY_CONNECTED_NO_GAME_CHANGE',
  qspSha256: sha(bytes), workSourceEqual: true,
  manualCleanLookupLines: find('interaction', "$bg_path = func('display_pic', 'dynslave', 'clean', 'girls/normal_scenes/')"),
  rooms, normalCleaningPngCount: common.length, dedicatedCleaningPngCount: dedicated.length,
  verification: 'Read-only current code and file existence; no engine or visual execution',
  gameWrites: 0
};
const target = process.argv[2];
if (target) fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
