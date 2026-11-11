// tw_core.js 코어 시험. 사용법 node textworkshop/tests/test_core.js [--qsp <jack.qsp 경로>]
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const C = require('../payload/modtools/text/tw_core.js');

let pass = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok   ' + name); }
  catch (e) { console.log('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

// 합성 QSPGAME 생성: locs = [{name, body}]
function makeQsp(locs) {
  const f = ['QSPGAME', C.shift('53636', -5), C.shift('No', -5), C.shift(String(locs.length), -5)];
  for (const l of locs) {
    f.push(C.shift(l.name, -5), C.shift('', -5), C.shift(l.body, -5), C.shift('0', -5));
  }
  f.push('');
  return C.serializeQsp({ fields: f });
}
const idx = (bytes) => { const m = C.parseQsp(bytes); return { m: m, ix: C.buildIndex(m) }; };

t('합성 파일 왕복이 바이트 동일', () => {
  const b = makeQsp([{ name: 'a', body: "$t = '안녕하세요, 여러분.'\r\n" }]);
  assert.deepStrictEqual(Buffer.from(C.serializeQsp(C.parseQsp(b))), Buffer.from(b));
});

t('순수 대사·지문·변수 포함을 구분한다', () => {
  const body = [
    "$text[1] = '[글로리아]<br> 어서 오세요, 무엇을 도와드릴까요?'",
    "$text[2] = '<br> 사무실 안에서 중개인이 서류를 넘겨보고 있다.'",
    "$text[3] = '[글로리아]<br> <<$master_name>>님, 보상은 <<reward>> 스파크입니다.'",
    "$npc_id = 'realtor'"
  ].join('\r\n');
  const { ix } = idx(makeQsp([{ name: 'a', body: body }]));
  assert.strictEqual(ix.items.length, 3); // 키('realtor')는 제외
  assert.strictEqual(ix.items[0].kind, '대사'); assert.strictEqual(ix.items[0].speaker, '글로리아');
  assert.strictEqual(ix.items[0].hasVar, false);
  assert.strictEqual(ix.items[1].kind, '지문');
  assert.strictEqual(ix.items[2].hasVar, true);
});

t('! 주석(여러 줄 문자열 포함)은 리터럴로 잡지 않고 이후 스캔을 어긋나게 하지 않는다', () => {
  const body = "!$x = \" 주석 처리된 [옛 대사]\r\n- 두 번째 줄입니다, 여기도 주석의 일부.\"\r\n$y = '진짜 대사입니다, 안녕하세요.'\r\nif a = 1: gs 'b' &!끝 주석 'it'\r\n";
  const { ix } = idx(makeQsp([{ name: 'a', body: body }]));
  assert.strictEqual(ix.items.length, 1);
  assert.strictEqual(ix.items[0].text, '진짜 대사입니다, 안녕하세요.');
});

t('<<식>> 안의 따옴표가 문자열 경계를 깨지 않는다', () => {
  const body = "$t = '[가] 가격은 <<price['k']>> 스파크이며, 매우 비쌉니다.'\r\n$u = '다음 문장이다, 정상이다.'";
  const { ix } = idx(makeQsp([{ name: 'a', body: body }]));
  assert.strictEqual(ix.items.length, 2);
  assert.strictEqual(ix.items[1].text, '다음 문장이다, 정상이다.');
});

t('dynamic 등에 넘기는 코드 문자열은 텍스트로 취급하지 않는다', () => {
  const body = "dynamic 'gs ''몹_전투'' & $x = ''안녕하세요 여러분''' ";
  const { ix } = idx(makeQsp([{ name: 'a', body: body }]));
  assert.strictEqual(ix.items.length, 0);
});

t('화면 매칭: 태그·공백 차이를 흡수하고 변수 포함은 편집 불가로 표시', () => {
  const body = "$a = '<br> 사무실 안에서 중개인이 서류를 넘겨보고 있다.'\r\n$b = '[글로리아]<br> <<$n>>님, 보상은 <<r>> 스파크입니다.'\r\n$c = '<br> 화면에 없는 문장입니다, 정말로.'";
  const { ix } = idx(makeQsp([{ name: 'a', body: body }]));
  const html = '<html><body><p>사무실 안에서\n중개인이  서류를 넘겨보고 있다.</p><p>[글로리아]<br />김철수님, 보상은 100 스파크입니다.</p></body></html>';
  const r = C.matchScreen(ix.items, html);
  assert.strictEqual(r.hits.length, 2);
  assert.strictEqual(r.hits.filter(h => h.hasVar).length, 1);
});

t('현재 장면 정렬: 겹치는 문장이 많은 Location이 먼저', () => {
  const mk = (s) => "$t = '" + s + "'\r\n";
  const { ix } = idx(makeQsp([
    { name: 'guild', body: mk('환영합니다, 손님 어서 오세요.') },
    { name: 'office', body: mk('환영합니다, 손님 어서 오세요.') + mk('중개인이 서류를 훑어본다, 조용히.') }
  ]));
  const r = C.matchScreen(ix.items, '환영합니다, 손님 어서 오세요. 중개인이 서류를 훑어본다, 조용히.');
  assert.strictEqual(r.hits[0].location, 'office');
});

t('검색: 이름 포함 문장 목록', () => {
  const { ix } = idx(makeQsp([{ name: 'a', body: "$a = '글로리아가 미소 짓는다, 조용히.'\r\n$b = '내일 다시 글로리아를 찾아가자, 그러자.'\r\n$c = '전혀 다른 문장이다, 정말로.'" }]));
  assert.strictEqual(C.search(ix.items, '글로리아').length, 2);
});

t('편집: 따옴표 escape와 다른 필드 불변', () => {
  const b = makeQsp([{ name: 'a', body: "$a = '기존 대사입니다, 안녕.'\r\nx = 1\r\n" }, { name: 'b', body: "$b = '건드리면 안 되는 문장, 절대.'" }]);
  const { m, ix } = idx(b);
  const it = ix.items[0];
  const out = C.applyEdits(m, [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: it.text, newText: "\"걱정 마세요,\" 글로리아가 말했다. It's fine." }]);
  const bytes = C.serializeQsp(out);
  C.verifyEdits(m, bytes, [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, newText: "\"걱정 마세요,\" 글로리아가 말했다. It's fine." }]);
  const body = C.readBody(C.parseQsp(bytes), 0);
  assert.ok(body.includes("It''s fine."), body);
  const re = C.buildIndex(C.parseQsp(bytes)).items;
  assert.strictEqual(re[0].text, "\"걱정 마세요,\" 글로리아가 말했다. It's fine.");
  assert.strictEqual(m.fields[out.locs[1].bodyIdx], out.fields[out.locs[1].bodyIdx]);
});

t('편집: 같은 위치를 여러 개 동시에 수정해도 오프셋이 어긋나지 않는다', () => {
  const b = makeQsp([{ name: 'a', body: "$a = '첫 번째 문장입니다, 반갑습니다.'\r\n$b = '두 번째 문장입니다, 반갑습니다.'" }]);
  const { m, ix } = idx(b);
  const ed = ix.items.map((it, i) => ({ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: it.text, newText: '수정된 문장 ' + i + '번, 길이가 다릅니다 훨씬 더.' }));
  const bytes = C.serializeQsp(C.applyEdits(m, ed));
  C.verifyEdits(m, bytes, ed);
  const re = C.buildIndex(C.parseQsp(bytes)).items;
  assert.deepStrictEqual(re.map(x => x.text), ed.map(e => e.newText));
});

t('편집: 탐색 이후 원본이 바뀌면 중단', () => {
  const b = makeQsp([{ name: 'a', body: "$a = '기존 대사입니다, 안녕.'" }]);
  const { m, ix } = idx(b);
  const it = ix.items[0];
  assert.throws(() => C.applyEdits(m, [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: '다른 내용이었던 문장', newText: '바꾼 문장입니다, 안녕.' }]), /바뀌었습니다/);
});

t('입력 검증: 변수·빈 문자열 거부, 줄바꿈은 허용', () => {
  assert.ok(C.validateNewText('가 <<x>> 나'));
  assert.strictEqual(C.validateNewText('가\n나'), '');
  assert.ok(C.validateNewText('<br>'));
  assert.strictEqual(C.validateNewText('정상 <b>문장</b>입니다.'), '');
});

t('편집: 원본처럼 줄바꿈이 있는 문자열을 줄바꿈 유지한 채 수정(LF 입력은 CRLF로 저장)', () => {
  const b = makeQsp([{ name: 'a', body: "$a = '  첫 줄 문장입니다, 안녕하세요.\r\n둘째 줄 문장입니다, 반갑습니다.'\r\nx = 1\r\n" }]);
  const { m, ix } = idx(b);
  assert.strictEqual(ix.items.length, 1);
  const it = ix.items[0];
  const nt = '  첫 줄 문장입니다, 안녕하세요.\n둘째 줄을 고친 문장입니다, 반갑습니다.\n셋째 줄도 추가합니다, 정말로.'; // textarea는 LF를 돌려준다
  const ed = [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: it.text, newText: nt }];
  const bytes = C.serializeQsp(C.applyEdits(m, ed));
  C.verifyEdits(m, bytes, ed);
  const re = C.buildIndex(C.parseQsp(bytes)).items[0];
  assert.strictEqual(re.text, C.normalizeNewlines(nt));
  assert.ok(!/[^\r]\n/.test(re.text), 'LF 단독 줄바꿈이 남음');
});

t('verifyEdits는 의도하지 않은 변경을 잡아낸다', () => {
  const b = makeQsp([{ name: 'a', body: "$a = '기존 대사입니다, 안녕.'" }, { name: 'b', body: "$b = '다른 곳 문장입니다, 안녕.'" }]);
  const { m, ix } = idx(b);
  const it = ix.items[0];
  const ed = [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: it.text, newText: '바꾼 문장입니다, 안녕하세요.' }];
  const out = C.applyEdits(m, ed);
  out.fields[m.locs[1].bodyIdx] = C.shift('망가짐', -5); // b를 몰래 변조
  assert.throws(() => C.verifyEdits(m, C.serializeQsp(out), ed), /의도하지 않은/);
});

// ---- 실제 jack.qsp 시험 (선택) ----
const qi = process.argv.indexOf('--qsp');
if (qi > 0) {
  const raw = new Uint8Array(fs.readFileSync(process.argv[qi + 1]));
  const m = C.parseQsp(raw);
  t('실제 jack.qsp: 왕복 바이트 동일', () => {
    assert.strictEqual(Buffer.compare(Buffer.from(C.serializeQsp(m)), Buffer.from(raw)), 0);
  });
  const built = C.buildIndex(m);
  t('실제 jack.qsp: 스캔 실패 0, 후보 다수', () => {
    assert.strictEqual(built.broken, 0);
    assert.ok(built.items.length > 20000, String(built.items.length));
  });
  t('실제 jack.qsp: 편집→직렬화→재파싱 검증 통과, 나머지 필드 불변', () => {
    const it = built.items.find(x => x.location === 'interaction_city' && !x.hasVar && x.text.indexOf("'") < 0);
    const nt = it.text + ' (수정 시험)';
    const ed = [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: it.text, newText: nt }];
    const bytes = C.serializeQsp(C.applyEdits(m, ed));
    C.verifyEdits(m, bytes, ed);
    const re = C.buildIndex(C.parseQsp(bytes));
    assert.ok(re.items.some(x => x.location === 'interaction_city' && x.text === nt));
    assert.strictEqual(re.items.length, built.items.length);
  });
  t('실제 jack.qsp: 줄바꿈이 있는 원문(#txt_man Redlight_whore_b[1])을 수정해도 줄바꿈 구조와 나머지가 유지', () => {
    const it = built.items.find(x => x.location === '#txt_man' && x.text.indexOf('길거리 계집들 무리 속에서') >= 0);
    assert.ok(it && !it.hasVar && it.text.indexOf('\r\n') >= 0);
    const nt = it.text.replace('제법 외모가 괜찮은', '제법 괜찮아 보이는');
    const ed = [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: it.text, newText: nt.replace(/\r\n/g, '\n') }];
    const bytes = C.serializeQsp(C.applyEdits(m, ed));
    C.verifyEdits(m, bytes, ed);
    const re = C.buildIndex(C.parseQsp(bytes)).items.find(x => x.id === it.id);
    assert.strictEqual(re.text, nt);
  });
  t('실제 jack.qsp: 글로리아 검색과 화면 매칭', () => {
    assert.ok(C.search(built.items, '글로리아').length > 10);
    const g = built.items.find(x => x.location === 'interaction_city' && !x.hasVar && x.speaker === '글로리아');
    const r = C.matchScreen(built.items, '<html><body>' + g.text + '</body></html>');
    assert.ok(r.hits.some(h => h.id === g.id));
  });
}
console.log(pass + ' passed' + (process.exitCode ? ', FAILURES' : ''));
