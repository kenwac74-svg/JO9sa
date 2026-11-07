'use strict';
// node tools/text-workshop/script-export.test.cjs
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { plain } = require('./script-export.cjs');

test('대사 문자열을 각본용 평문으로 바꾼다', () => {
  assert.equal(plain('[글로리아]<br> 물론입니다 <<$master_name>>님.</div>'), '글로리아: 물론입니다 〈$master_name〉님.');
  assert.equal(plain('  [GLORIA]<br>- Hello&nbsp;there'), 'GLORIA: Hello there');
  assert.equal(plain('<br> 서술문입니다.'), '서술문입니다.');
  assert.equal(plain('<a href="exec:gt \'x\'">뒤로</a>'), '[선택지: 뒤로]');
  assert.equal(plain('<img src="a.png"> 그림'), '[그림] 그림');
});

const imp = require('./script-import.cjs');
test('각색본 평문을 원문 형식으로 되돌린다', () => {
  const raw = '[글로리아]<br> 물론입니다 <<$master_name>>님. <font color="#009900"><b>지구력</b></font>이 중요해요.</div>';
  assert.equal(imp.toGame(plain(raw), raw), raw);
  assert.equal(imp.toGame('글로리아: 그럼요 〈$master_name〉님. <font color="#009900"><b>체력</b></font>이 먼저죠.', raw), '[글로리아]<br> 그럼요 <<$master_name>>님. <font color="#009900"><b>체력</b></font>이 먼저죠.</div>');
  const link = '<a href="EXEC: gt \'x\'">뒤로</a>';
  assert.equal(imp.toGame('[선택지: 돌아간다]', link), '<a href="EXEC: gt \'x\'">돌아간다</a>');
  assert.throws(() => imp.toGame('그림 없음', '<img src="a.png"> 그림'), /빠졌습니다/);
});
test('각색본에서 번호 블록만 읽고 구조 줄은 무시한다', () => {
  const text = '인사말\n```\n# 각본 ID: 0123456789abcdef\n#  ---- [S1-P9] 예시 ----\n==== [S1] x ====\n[대사 묶음 $a · 2페이지]\n\n---- [S1-P1] 1/2 ----\n(조건: a = 1)\n가: 하나\n\n(S1-P1-V1 · 조건: b) 대체문\n가: 둘\n\n[S1-L1 · 장면 문구]\n문구\n[대사 묶음 $b · 1페이지]\n▶ 이 장면 다음\n  1) 이동 → y\n```';
  const r = imp.parse(text);
  assert.equal(r.exportId, '0123456789abcdef');
  assert.deepEqual([...r.blocks], [['S1-P1', '가: 하나'], ['S1-P1-V1', '가: 둘'], ['S1-L1', '문구']]);
});

const qsp = process.env.JO9_QSP || 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
test('실제 QSP: 장면 하나를 페이지 구분 각본으로 만든다', { skip: !fs.existsSync(qsp) }, () => {
  const core = require('./core.cjs'), scenes = require('./scenes.cjs');
  const doc = core.parse(fs.readFileSync(qsp)), nav = scenes.buildNavigator(doc, core.entries(doc));
  const loc = 'interaction_city', a = scenes.analyse(loc, core.shift(doc.lines[doc.locations.find(l => l.name === loc).body], 5));
  const scene = a.scenes.find(s => s.condition === 'interaction_city = 1311');
  if (!scene) return; // 장면 번호가 바뀐 QSP
  const man = nav.script({ hash: doc.hash, location: loc, sceneId: scene.id });
  assert.match(man.text, /---- \[S1-P1\] 1\/\d+ ----/);
  assert.ok(man.stats.pages >= 1);
  assert.match(man.text, /페이지를 다 넘기면 → shop_general/);
  assert.throws(() => nav.script({ hash: 'old', location: loc, sceneId: scene.id }), /QSP가 바뀌었습니다/);
  const woman = nav.script({ hash: doc.hash, location: loc, sceneId: scene.id, options: { edition: 'woman' } });
  assert.notEqual(woman.text.split('\n').slice(3).join('\n'), man.text.split('\n').slice(3).join('\n'));
});
