'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const { inspectWorld } = require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const source = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw = fs.readFileSync(source), doc = core.parse(raw);
const originalLines = doc.lines.slice();
assert.equal(doc.hash, 'f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536', 'WORK changed since audit; do not overwrite');
assert(core.serialize(doc).equals(raw));
const loc = doc.locations.find(l => l.name === '$quest_list');
const old = "if quest_description_mode = 1: $quest_list = '   <<$quest_description[choosen_quest]>>'";
const added = [
  '! JO9 MOD START DONATIEN_OBJECTIVE_BACK_20261105',
  old,
  '! The stored request description has no Back link, including in existing saves.',
  'if quest_description_mode = 1 and choosen_quest = 5:',
  '    $quest_list += \'<br><br><a href = "EXEC: quest_description_mode = 0 & gt $curloc">뒤로</a>\'',
  'end',
  '! JO9 MOD END DONATIEN_OBJECTIVE_BACK_20261105',
].join('\r\n');
const before = core.shift(doc.lines[loc.body], 5);
assert.equal(before.split(old).length - 1, 1);
doc.lines[loc.body] = core.shift(before.replace(old, added), -5);
const candidate = core.serialize(doc), after = core.parse(candidate);
const changed = after.lines.flatMap((line, i) => line !== originalLines[i] ? [i] : []);
assert.deepEqual(changed, [loc.body]);
const integrity = inspectWorld(candidate);
const field = core.shift(after.lines[loc.body], 5);
assert.equal(field.split('href = "EXEC: quest_description_mode = 0 & gt $curloc"').length - 1, 1);
assert.equal(core.literals(added).filter(x => x.text.includes('href')).length, 1);
fs.mkdirSync(path.join(__dirname, 'mods'), { recursive: true });
const mod = {
  id: '2026-11-05_donatien_objective_back', status: 'APPROVED',
  description: '후작 의뢰 목표 상세창에 복귀 링크를 표시한다. 저장된 설명문을 수정하지 않아 기존 의뢰 세이브에도 적용된다.',
  before_sha256: doc.hash, after_sha256: after.hash,
  edits: [{ location: '$quest_list', field: 'body', old, new: added, count: 1, patchId: 'DONATIEN_OBJECTIVE_BACK_20261105' }],
  user_approval: '2026-11-05: 수정하고 패치에 반영해. QSP만 손보면 될꺼야. 전체 검사는 반복하지 않고 직접 플레이 확인.',
};
fs.writeFileSync(path.join(__dirname, 'mods', mod.id + '.json'), JSON.stringify(mod, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, 'candidate.qsp'), candidate);
fs.writeFileSync(path.join(__dirname, 'checks.json'), JSON.stringify({ status: 'TARGETED_STATIC_PASS', source, before: doc.hash, after: after.hash, bytes: candidate.length, changedLocations: ['$quest_list'], unchangedLocations: doc.locations.length - 1, integrity, newLocations: 0, newSaveVariables: 0, userSaveFilesChanged: false, gameExeRuns: 0, engineSuiteRerun: false, manualChecks: ['거리에서 주인공 → 목표 → 후작 의뢰 → 뒤로를 눌러 목록 복귀', '이미 의뢰를 받은 기존 세이브에서도 같은 복귀 확인'] }, null, 2) + '\n');
console.log(JSON.stringify({ status: 'TARGETED_STATIC_PASS', before: doc.hash, after: after.hash, changedLocations: ['$quest_list'], bytes: candidate.length }));
