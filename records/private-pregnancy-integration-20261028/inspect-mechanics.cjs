'use strict';
// 현재 WORK를 읽기만 한다. 장면·표시 문자열은 출력하거나 저장하지 않는다.
const fs = require('node:fs');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qsp = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const doc = core.parse(fs.readFileSync(qsp));
const [mode = 'range', name, start = '1', end = '999999'] = process.argv.slice(2);
function safe(s) {
  if (/^\s*!/.test(s) || /\$(?:text|refuse_txt|tmp|bg_path|play_sound|fuck_sound|info_text|.*features_list\s*\+=)/i.test(s)) return null;
  if (/^\s*(?:\*?p[l]?|\*?nl|msg)\b/i.test(s)) return null;
  if (/[가-힣А-Яа-я…]/.test(s)) return null;
  return s.replace(/\s*&!.*$/, '').trimEnd();
}
if (mode === 'range') {
  const loc = doc.locations.find(x => x.name === name);
  if (!loc) throw Error('location 없음: ' + name);
  console.log(JSON.stringify({sha256: doc.hash, location: name, locationIndex: loc.index}));
  core.shift(doc.lines[loc.body], 5).split(/\r?\n/).forEach((s, i) => {
    if (i + 1 < +start || i + 1 > +end) return;
    s = safe(s);
    if (s !== null && s.trim()) console.log(`${i + 1}: ${s}`);
  });
} else if (mode === 'search') {
  const re = new RegExp(name, 'i');
  for (const loc of doc.locations) {
    const hits = [];
    core.shift(doc.lines[loc.body], 5).split(/\r?\n/).forEach((s, i) => {
      if (!re.test(s)) return;
      s = safe(s);
      if (s !== null && s.trim()) hits.push(`${i + 1}: ${s}`);
    });
    if (hits.length) console.log(loc.name + '\n' + hits.join('\n'));
  }
}
