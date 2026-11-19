// 설치기·연동 시험. 사용법 node textworkshop/tests/test_install.js --iw <Image Workshop 압축 해제 폴더> --pwsh <pwsh>
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, spawn } = require('child_process');

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const iw = arg('--iw'), pwsh = arg('--pwsh') || 'pwsh';
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
let pass = 0;
async function t(name, fn) { try { await fn(); pass++; console.log('ok   ' + name); } catch (e) { console.log('FAIL ' + name + '\n     ' + (e.stack || e.message)); process.exitCode = 1; } }
const run = (args, extra) => spawnSync(pwsh, ['-NoProfile', '-File', path.join(pkg, 'Install-TextWorkshop.ps1'), '-GameRoot', root, ...args], Object.assign({ encoding: 'utf8' }, extra));

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jo9inst-'));
const pkg = path.join(__dirname, '..');
const mt = path.join(root, 'game', 'modtools');
fs.cpSync(path.join(iw, 'payload', 'modtools'), mt, { recursive: true });
const files = ['JO9_Detect.ps1', 'JO9_Server.ps1', path.join('place', 'JO9_Place_Workshop.html')];
const orig = files.map(f => sha(path.join(mt, f)));

(async () => {
  await t('설치 전 Check: 세 파일 모두 baseline', async () => {
    const r = run(['-Action', 'Check']); assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.strictEqual((r.stdout.match(/baseline/g) || []).length, 3, r.stdout);
  });
  await t('Install -Yes: 세 파일 연동, 프로그램 파일 복사, 원본 백업', async () => {
    const r = run(['-Action', 'Install', '-Yes']); assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    files.forEach((f, i) => { assert.notStrictEqual(sha(path.join(mt, f)), orig[i]); assert.ok(fs.readFileSync(path.join(mt, f), 'utf8').includes('JO9_TEXT_WORKSHOP_HOOK')); });
    for (const f of ['JO9_Text_Server.ps1', 'JO9_Text_Workshop.html', 'tw_core.js']) assert.ok(fs.existsSync(path.join(mt, 'text', f)));
    for (const n of ['Detect', 'Server', 'Html']) assert.ok(fs.existsSync(path.join(mt, 'text', 'hook_backup', n + '.orig')));
  });
  await t('연동된 스크립트 문법 검사 통과', async () => {
    for (const f of ['JO9_Detect.ps1', 'JO9_Server.ps1', path.join('text', 'JO9_Text_Server.ps1'), 'text/../../../Install-TextWorkshop.ps1'.replace('text/../../../', '')]) {
      const full = f === 'Install-TextWorkshop.ps1' ? path.join(pkg, f) : path.join(mt, f);
      const r = spawnSync(pwsh, ['-NoProfile', '-Command', `$e=$null;$t=$null;[void][Management.Automation.Language.Parser]::ParseFile('${full}',[ref]$t,[ref]$e);if($e.Count){$e|%{$_.Message};exit 1}`], { encoding: 'utf8' });
      assert.strictEqual(r.status, 0, f + ': ' + r.stdout + r.stderr);
    }
  });
  await t('Install 재실행은 이미 연동됨으로 처리(변화 없음)', async () => {
    const before = files.map(f => sha(path.join(mt, f)));
    const r = run(['-Action', 'Install', '-Yes']); assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.deepStrictEqual(files.map(f => sha(path.join(mt, f))), before);
    assert.ok(r.stdout.includes('이미 연동됨'));
  });
  await t('연동된 Image 서버의 /api/open-text가 Text Workshop 서버를 띄운다', async () => {
    // 연동 코드는 Windows의 powershell.exe를 호출하므로, 시험에서는 pwsh를 그 이름으로 연결한다.
    const shim = fs.mkdtempSync(path.join(os.tmpdir(), 'jo9shim-'));
    fs.symlinkSync(path.resolve(pwsh), path.join(shim, 'powershell.exe'));
    const env = Object.assign({}, process.env, { PATH: shim + path.delimiter + process.env.PATH, BROWSER: 'true' });
    // Linux pwsh의 Start-Process는 -WindowStyle을 지원하지 않는다(Windows에서는 지원). 시험 복사본에서만 뺀다.
    const srvPath = path.join(mt, 'JO9_Server.ps1'); const srvSaved = fs.readFileSync(srvPath);
    fs.writeFileSync(srvPath, srvSaved.toString('utf8').split('-WindowStyle Hidden ').join(''));
    const proc = spawn(pwsh, ['-NoProfile', '-File', path.join(mt, 'JO9_Server.ps1'), '-Port', '0'], { stdio: 'ignore', env: env });
    try {
      const pf = path.join(mt, 'runtime', 'port.txt'); let port = 0;
      for (let i = 0; i < 100 && !port; i++) { await new Promise(r => setTimeout(r, 200)); try { port = parseInt(fs.readFileSync(pf, 'utf8'), 10); } catch (e) { /* 대기 */ } }
      assert.ok(port, '이미지 서버 시작 실패');
      fs.mkdirSync(path.join(root, 'game'), { recursive: true }); fs.writeFileSync(path.join(root, 'game', 'jack.qsp'), 'x');
      await fetch('http://127.0.0.1:' + port + '/api/open-text').then(r => r.text()).catch(() => '');
      const tpf = path.join(mt, 'text', 'runtime', 'port.txt');
      let tp = 0; for (let i = 0; i < 50 && !tp; i++) { await new Promise(r => setTimeout(r, 200)); try { tp = parseInt(fs.readFileSync(tpf, 'utf8'), 10); } catch (e) { /* 대기 */ } }
      assert.ok(tp, 'Text 서버가 시작되지 않았습니다');
      const st = await (await fetch('http://127.0.0.1:' + tp + '/api/status')).json();
      assert.strictEqual(st.alive, true);
      try { process.kill(parseInt(fs.readFileSync(path.join(mt, 'text', 'runtime', 'server.pid'), 'utf8'), 10)); } catch (e) { /* 이미 종료 */ }
    } finally { proc.kill(); fs.writeFileSync(srvPath, srvSaved); }
  });
  await t('Remove -Yes: 세 파일이 바이트 단위로 원본 복구', async () => {
    const r = run(['-Action', 'Remove', '-Yes']); assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.deepStrictEqual(files.map(f => sha(path.join(mt, f))), orig);
    assert.ok(!fs.existsSync(path.join(mt, 'text', 'JO9_Text_Server.ps1')));
  });
  await t('기준본과 다른 파일이 있으면 설치를 거부하고 아무것도 바꾸지 않는다', async () => {
    fs.appendFileSync(path.join(mt, 'JO9_Detect.ps1'), '\n# 다른 모드가 수정함\n');
    const before = files.map(f => sha(path.join(mt, f)));
    const r = run(['-Action', 'Install', '-Yes']);
    assert.notStrictEqual(r.status, 0); assert.ok(r.stdout.includes('기준본'), r.stdout);
    assert.deepStrictEqual(files.map(f => sha(path.join(mt, f))), before);
  });
  fs.rmSync(root, { recursive: true, force: true });
  console.log(pass + ' passed' + (process.exitCode ? ', FAILURES' : ''));
})();
