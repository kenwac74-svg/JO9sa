'use strict';
// Read-only production audit. Writes compact evidence into this report directory only.
const fs = require('node:fs');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const raw = fs.readFileSync(game + '/jack.qsp');
const doc = core.parse(raw);
const expected = 'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae';
if (doc.hash !== expected) throw Error('WORK changed; refresh audit scope first: ' + doc.hash);
const slices = {
  display_fullimage: [[12, 18], [40, 106], [108, 134]],
  display_pic: [[19, 48], [73, 93], [127, 132]],
  jo9_seed_role_images: [[38, 91]],
  jo9_buyer_rumors: [[10, 66], [79, 87], [144, 171]],
  get_stock_seed: [[290, 300]],
  '#static_base': [[442, 510]],
  '$gladiator_fight_start': [[24, 34]],
  interaction_city: [[1706, 1724], [5405, 5460], [11144, 11155], [11226, 11237]],
  interaction_screen_city: [[9, 11], [40, 47], [136, 142], [174, 181]],
  '#npc_base': [[414, 418], [655, 678], [1126, 1129], [1215, 1220], [2531, 2537], [7155, 7161]],
  '#txt_2_man': [[348, 368]],
  '$ongload': [[17, 30], [38, 43], [75, 90]],
  refresh_database: [[28, 40]],
};
const evidence = [];
const sourceIndex = [];
for (const [name, ranges] of Object.entries(slices)) {
  const loc = doc.locations.find(x => x.name === name);
  if (!loc) throw Error('Missing location ' + name);
  const lines = core.shift(doc.lines[loc.body], 5).split(/\r?\n/);
  sourceIndex.push({location: name, encodedBodyPhysicalLine: loc.body + 1, bodyLines: lines.length, ranges});
  for (const [first, last] of ranges) {
    evidence.push('\nLOCATION ' + name + ' | body lines ' + first + '-' + last);
    for (let i = first; i <= last; i++) evidence.push(i + ': ' + lines[i - 1]);
  }
}
const original = core.parse(fs.readFileSync('G:/somi/JO9sa/source/jack_2026-10-01.qsp'));
const originalLoc = original.locations.find(x => x.name === 'interaction_city');
const originalLines = core.shift(original.lines[originalLoc.body], 5).split(/\r?\n/);
evidence.push('\nORIGINAL 2026-10-01 | SHA256 ' + original.hash + ' | interaction_city body lines 4613-4668');
for (let i = 4613; i <= 4668; i++) evidence.push(i + ': ' + originalLines[i - 1]);
fs.writeFileSync(path.join(__dirname, 'qsp-evidence.txt'), evidence.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'qsp-index.json'), JSON.stringify({work: game + '/jack.qsp', sha256: doc.hash, locations: sourceIndex}, null, 2));
let missing = [];
for (const name of fs.readdirSync(game + '/json/slaves')) {
  if (!name.endsWith('.json') || name === '0_template.json') continue;
  const data = JSON.parse(fs.readFileSync(game + '/json/slaves/' + name, 'utf8').replace(/^\ufeff/, ''));
  if (!data.fullimage || fs.existsSync(game + '/content/pic/' + data.fullimage + '.png')) continue;
  const match = data.fullimage.match(/^girls\/full\/(\d+)_/);
  missing.push({file: name, fullimage: data.fullimage, indpack_title: data.indpack_title || null,
    indpack_title_exists: !!data.indpack_title && fs.existsSync(game + '/content/pic/' + data.indpack_title + '.png'),
    same_id_root_candidates: match ? fs.readdirSync(game + '/content/pic/girls/full').filter(x => x.startsWith(match[1] + '_') && x.endsWith('.png')) : []});
}
fs.writeFileSync(path.join(__dirname, 'missing-fullimage-audit.json'), JSON.stringify({count: missing.length, rows: missing}, null, 2));
for (const name of ['1064.json', '2579_egeya.json', '2576_julia.json']) {
  const data = JSON.parse(fs.readFileSync(game + '/json/slaves/' + name));
  let paths = {};
  for (const [key, value] of Object.entries(data)) if (typeof value === 'string' && /^(fullimage|fullmade|fullsecretary|fullmistress|seed_ava|indpack_)/.test(key)) {
    paths[key] = {value, exists: !!value && fs.existsSync(game + '/' + (value.startsWith('content/') ? '' : 'content/pic/') + value + '.png')};
  }
  fs.writeFileSync(path.join(__dirname, name.replace('.json', '.paths.json')), JSON.stringify(paths, null, 2));
}
console.log(JSON.stringify({sha256: doc.hash, excerptLocations: sourceIndex.length, missingFullimage: missing.length,
  missingWithValidTitle: missing.filter(x => x.indpack_title_exists).length, productionWrites: 0}, null, 2));
