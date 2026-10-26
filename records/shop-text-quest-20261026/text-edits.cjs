'use strict';
// JO9 MOD START TEXT_HINTS_20261026: build literal-only edits; never write runtime files.
const assert = require('node:assert/strict');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');

const healthyBefore = '[건강체질]<br>전투에서 버틸 체력과 지구력이 좋으며 운동도 빠르게 익힌다. 식사와 보조식품, 충분한 휴식으로 체력을 기르는 데도 유리하다. 타고나기도 하고 의료센터의 체질개선 시술로 얻기도 한다. 약골과 양립하지 않는다.';
const healthyAfter = '[건강체질]<br>전투에서 버틸 체력과 지구력이 좋으며 운동도 빠르게 익힌다. 식사와 보조식품, 충분한 휴식으로 체력을 기르는 데도 유리하다. 타고나기도 하지만, 특별한 계기로 체질이 바뀌기도 한다. 약골과 양립하지 않는다.';
const fameBefore = '[로마 인지도 TIPS]<br>&nbsp;인지도가 전부는 아닙니다. 이것에 개의치 않고도 훌륭한 노예를 육성할 수 있습니다.<br>명성 영향: 경주, 투기 대회, 캣파이트, 랠리, 안개경계 전투.<br><br>랠리: 첫 우승 +10, 반복 우승은 명성40 미만 +1 / 40~79 +0.25. 최대80까지만 상승합니다.<br>캣파이트: 첫 승 +10, 다음 두 승은 각각 +3. 3승을 달성하면 더는 출전할 수 없습니다.';
const fameAfter = '[로마 인지도 TIPS]<br>&nbsp;인지도가 전부는 아닙니다. 이것에 개의치 않고도 훌륭한 노예를 육성할 수 있습니다.<br><br>명성을 쌓을 수 있는 곳: 콜로세움의 경주와 투기 대회, 동부 구역의 캣파이트 클럽과 아마란스 살롱의 랠리, 안개 경계 순찰.<br><br>랠리는 우승으로 명성이 오르지만, 첫 우승 이후에는 상승 폭이 작아지고 일정 수준에 이르면 더는 오르지 않습니다.<br>캣파이트는 승리할 때 명성이 오르며, 3승을 달성하면 더는 출전할 수 없습니다.';
// Reuse the existing load-time cache guard. This is a literal change, with no new state.
const cacheBefore = "if instr($слава_совет, '랠리: 첫 우승 +10') = 0: gs '#help_msg'";
const cacheMarker = '명성을 쌓을 수 있는 곳: 콜로세움의 경주와 투기 대회';
const cacheAfter = "if instr($слава_совет, '" + cacheMarker + "') = 0: gs '#help_msg'";

function buildTextEdits(doc) {
  assert(doc && Array.isArray(doc.locations) && Array.isArray(doc.lines), 'Expected parsed QSP document');
  const edits = [];
  function add(location, oldText, newText) {
    const loc = doc.locations.find(l => l.name === location);
    assert(loc, 'Missing location ' + location);
    const body = c.shift(doc.lines[loc.body], 5);
    const beforeCount = body.split(oldText).length - 1;
    if (beforeCount === 0) {
      assert.equal(body.split(newText).length - 1, 1, 'Source wording drift in ' + location);
      return;
    }
    assert.equal(beforeCount, 1, 'Nonunique source wording in ' + location);
    assert.equal(body.split(newText).length - 1, 0, 'Mixed old and new wording in ' + location);
    edits.push({ location, field: 'body', old: oldText, new: newText, count: 1 });
  }
  add('jo9_traits', healthyBefore, healthyAfter);
  add('#help_msg', fameBefore, fameAfter);
  add('$ongload', cacheBefore, cacheAfter);
  return edits;
}

module.exports = { buildTextEdits, healthyBefore, healthyAfter, fameBefore, fameAfter, cacheBefore, cacheAfter, cacheMarker };
// JO9 MOD END TEXT_HINTS_20261026

if (require.main === module) {
  const fs = require('node:fs');
  const source = process.argv[2] || 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
  const doc = c.parse(fs.readFileSync(source));
  console.log(JSON.stringify({ sourceHash: doc.hash, runtimeWritten: false, edits: buildTextEdits(doc).map(e => ({ location: e.location, field: e.field, count: e.count })) }, null, 2));
}
