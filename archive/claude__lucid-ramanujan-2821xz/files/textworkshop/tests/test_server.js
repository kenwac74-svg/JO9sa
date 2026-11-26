// PowerShell 서버 통합 시험. 사용법 node textworkshop/tests/test_server.js --qsp <jack.qsp> --pwsh <pwsh 경로>
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const C = require('../payload/modtools/text/tw_core.js');

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const qspSrc = arg('--qsp'); const pwsh = arg('--pwsh') || 'pwsh';
if (!qspSrc) { console.log('--qsp 필요'); process.exit(2); }

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log('ok   ' + name); }
  catch (e) { console.log('FAIL ' + name + '\n     ' + (e.stack || e.message)); process.exitCode = 1; }
}

(async () => {
  // 가짜 게임 폴더: game/jack.qsp, game/modtools/text/*
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jo9tw-'));
  const game = path.join(root, 'game'); const text = path.join(game, 'modtools', 'text');
  fs.mkdirSync(text, { recursive: true });
  const srcDir = path.join(__dirname, '..', 'payload', 'modtools', 'text');
  for (const f of ['JO9_Text_Server.ps1', 'tw_core.js']) fs.copyFileSync(path.join(srcDir, f), path.join(text, f));
  fs.writeFileSync(path.join(text, 'JO9_Text_Workshop.html'), '<html>stub</html>');
  const qspPath = path.join(game, 'jack.qsp');
  fs.copyFileSync(qspSrc, qspPath);
  const original = fs.readFileSync(qspPath);
  const originalSha = sha(original);

  const proc = spawn(pwsh, ['-NoProfile', '-File', path.join(text, 'JO9_Text_Server.ps1'), '-Port', '0'], { stdio: 'ignore' });
  const portFile = path.join(text, 'runtime', 'port.txt');
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) {
    await new Promise(r => setTimeout(r, 200));
    try { port = parseInt(fs.readFileSync(portFile, 'utf8'), 10); } catch (e) { /* 대기 */ }
  }
  if (!port) { console.log('서버 시작 실패'); proc.kill(); process.exit(1); }
  const base = 'http://127.0.0.1:' + port;
  const ping = () => fetch(base + '/api/ping');

  async function getQsp() {
    const r = await fetch(base + '/api/qsp');
    const buf = new Uint8Array(await r.arrayBuffer());
    return { buf: buf, sha: r.headers.get('x-tw-sha256') };
  }
  function planEdit(buf, pick, newText) {
    const m = C.parseQsp(buf); const ix = C.buildIndex(m);
    const it = ix.items.filter(pick)[0];
    const ed = [{ loc: it.loc, start: it.start, end: it.end, quote: it.quote, oldText: it.text, newText: newText }];
    const out = C.serializeQsp(C.applyEdits(m, ed));
    C.verifyEdits(m, out, ed);
    return { out: out, ed: ed, it: it };
  }
  async function apply(baseSha, out, ed, opts) {
    opts = opts || {};
    const meta = Buffer.from(JSON.stringify({ label: '시험', entries: ed.map(e => ({ location: 'x', oldText: e.oldText, newText: e.newText })) }), 'utf8').toString('base64');
    return fetch(base + '/api/apply', {
      method: 'POST',
      headers: { 'X-TW-Base': baseSha, 'X-TW-After': opts.afterSha || sha(out), 'X-TW-Meta': meta },
      body: out
    });
  }

  try {
    await t('상태·핑·화면 없음 응답', async () => {
      assert.strictEqual((await ping()).status, 200);
      const s = await (await fetch(base + '/api/state')).json();
      assert.strictEqual(s.qspExists, true); assert.strictEqual(s.qspSize, original.length);
      assert.strictEqual((await fetch(base + '/api/screen')).status, 404);
    });

    await t('/api/qsp가 원본 바이트와 해시를 돌려준다', async () => {
      const q = await getQsp();
      assert.strictEqual(q.sha, originalSha); assert.strictEqual(Buffer.compare(Buffer.from(q.buf), original), 0);
    });

    let op1;
    await t('적용: 백업 생성, 해시 검증, 게임 파일 교체, 기록', async () => {
      const q = await getQsp();
      const p = planEdit(q.buf, x => x.location === 'interaction_city' && !x.hasVar && x.text.indexOf("'") < 0, '서버 시험용 수정 문장입니다, 안녕하세요.');
      const r = await apply(q.sha, p.out, p.ed);
      const j = await r.json();
      assert.strictEqual(r.status, 200, JSON.stringify(j)); assert.strictEqual(j.ok, true);
      op1 = j;
      const now = fs.readFileSync(qspPath);
      assert.strictEqual(sha(now), sha(p.out)); assert.notStrictEqual(sha(now), originalSha);
      const bk = path.join(text, 'backups', j.id, 'jack.qsp');
      assert.strictEqual(sha(fs.readFileSync(bk)), originalSha);
      const h = await (await fetch(base + '/api/history')).json();
      assert.strictEqual(h.items.length, 1); assert.strictEqual(h.items[0].status, 'applied'); assert.strictEqual(h.items[0].baseSha, originalSha);
    });

    await t('원본이 탐색 이후 바뀌었으면 적용 중단(409), 파일 불변', async () => {
      const q = await getQsp();
      const p = planEdit(q.buf, x => x.location === 'interaction_city' && !x.hasVar && x.text.indexOf("'") < 0, '두 번째 수정 문장입니다, 안녕하세요.');
      const before = sha(fs.readFileSync(qspPath));
      const r = await apply(originalSha /* 오래된 base */, p.out, p.ed);
      assert.strictEqual(r.status, 409); assert.strictEqual((await r.json()).error, 'source_changed');
      assert.strictEqual(sha(fs.readFileSync(qspPath)), before);
    });

    await t('전송 본문 해시가 다르면 거부(400), 파일 불변', async () => {
      const q = await getQsp();
      const p = planEdit(q.buf, x => x.location === 'interaction_city' && !x.hasVar && x.text.indexOf("'") < 0, '세 번째 수정 문장입니다, 안녕하세요.');
      const before = sha(fs.readFileSync(qspPath));
      const r = await apply(q.sha, p.out, p.ed, { afterSha: 'a'.repeat(64) });
      assert.strictEqual(r.status, 400); assert.strictEqual(sha(fs.readFileSync(qspPath)), before);
    });

    await t('후속 변경이 있으면 이전 작업 롤백 중단(409)', async () => {
      const q = await getQsp();
      const p = planEdit(q.buf, x => x.location === 'main_screen' && !x.hasVar && x.text.indexOf("'") < 0, '두 번째 작업의 문장입니다, 안녕하세요.');
      const r2 = await apply(q.sha, p.out, p.ed); const j2 = await r2.json(); assert.strictEqual(r2.status, 200, JSON.stringify(j2));
      const r = await fetch(base + '/api/rollback?id=' + encodeURIComponent(op1.id), { method: 'POST' });
      assert.strictEqual(r.status, 409); assert.strictEqual((await r.json()).error, 'later_changes');
      // 최신 작업부터 되돌리면 성공하고 이전 상태로 돌아간다
      const rb = await fetch(base + '/api/rollback?id=' + encodeURIComponent(j2.id), { method: 'POST' });
      assert.strictEqual(rb.status, 200, await rb.text());
      const rb2 = await fetch(base + '/api/rollback?id=' + encodeURIComponent(op1.id), { method: 'POST' });
      assert.strictEqual(rb2.status, 200);
      assert.strictEqual(sha(fs.readFileSync(qspPath)), originalSha);
      const h = await (await fetch(base + '/api/history')).json();
      assert.deepStrictEqual(h.items.map(x => x.status), ['rolled_back', 'rolled_back']);
    });

    await t('이미 되돌린 작업 재롤백은 거부', async () => {
      const r = await fetch(base + '/api/rollback?id=' + encodeURIComponent(op1.id), { method: 'POST' });
      assert.strictEqual(r.status, 409); assert.strictEqual((await r.json()).error, 'not_applied');
    });

    await t('저장 실패 시 자동 복구 응답(원본 유지, 백업 남김)', async () => {
      const q = await getQsp();
      const p = planEdit(q.buf, x => x.location === 'interaction_city' && !x.hasVar && x.text.indexOf("'") < 0, '실패 시험 문장입니다, 안녕하세요.');
      fs.mkdirSync(qspPath + '.tw_tmp'); // 임시 파일 쓰기를 막아 저장 실패를 유도
      const r = await apply(q.sha, p.out, p.ed);
      const j = await r.json();
      fs.rmSync(qspPath + '.tw_tmp', { recursive: true, force: true });
      assert.strictEqual(r.status, 500, JSON.stringify(j));
      assert.strictEqual(j.restored, true); assert.ok(/자동 복구/.test(j.message));
      assert.strictEqual(sha(fs.readFileSync(qspPath)), originalSha);
    });

    await t('jack.qsp를 읽을 수 없으면 오류 JSON으로 응답', async () => {
      const q = await getQsp();
      const p = planEdit(q.buf, x => x.location === 'interaction_city' && !x.hasVar && x.text.indexOf("'") < 0, '읽기 실패 시험 문장입니다, 안녕.');
      fs.renameSync(qspPath, qspPath + '.bak'); fs.mkdirSync(qspPath); // 파일 자리에 폴더를 두어 읽기 실패 유도
      try {
        const r = await apply(q.sha, p.out, p.ed);
        assert.ok(r.status >= 400);
        assert.strictEqual((await r.json()).ok, false);
      } finally { fs.rmdirSync(qspPath); fs.renameSync(qspPath + '.bak', qspPath); }
      assert.strictEqual(sha(fs.readFileSync(qspPath)), originalSha);
    });
  } finally {
    proc.kill();
    fs.rmSync(root, { recursive: true, force: true });
  }
  console.log(pass + ' passed' + (process.exitCode ? ', FAILURES' : ''));
})();
