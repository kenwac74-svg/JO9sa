// Chromium으로 UI 전체 흐름(일치→수정→적용→기록→되돌리기)을 시험한다. 사용법 node textworkshop/tests/test_ui.js --qsp <jack.qsp> --pwsh <pwsh> [--shots <폴더>]
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const C = require('../payload/modtools/text/tw_core.js');

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const qspSrc = arg('--qsp'), pwsh = arg('--pwsh') || 'pwsh', shots = arg('--shots');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0;
async function t(name, fn) { try { await fn(); pass++; console.log('ok   ' + name); } catch (e) { console.log('FAIL ' + name + '\n     ' + (e.stack || e.message)); process.exitCode = 1; } }

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jo9ui-'));
  const game = path.join(root, 'game'), text = path.join(game, 'modtools', 'text');
  fs.mkdirSync(path.join(text, 'runtime'), { recursive: true });
  const srcDir = path.join(__dirname, '..', 'payload', 'modtools', 'text');
  for (const f of ['JO9_Text_Server.ps1', 'tw_core.js', 'JO9_Text_Workshop.html']) fs.copyFileSync(path.join(srcDir, f), path.join(text, f));
  const qspPath = path.join(game, 'jack.qsp');
  fs.copyFileSync(qspSrc, qspPath);
  const original = fs.readFileSync(qspPath), originalSha = sha(original);

  // 화면 캡처 흉내: interaction_city의 글로리아 대사 1개 + 변수 포함 문장 1개를 Qt식 HTML로 만든다.
  const m = C.parseQsp(new Uint8Array(original)); const ix = C.buildIndex(m);
  const g = ix.items.find(x => x.location === 'interaction_city' && x.speaker === '글로리아' && !x.hasVar && x.text.indexOf("'") < 0 && x.text.indexOf('"') < 0 && x.text.length < 200);
  const v = ix.items.find(x => x.location === 'interaction_city' && x.speaker === '글로리아' && x.hasVar);
  const varShown = v.text.replace(/<<[\s\S]*?>>/g, '김철수');
  fs.writeFileSync(path.join(text, 'runtime', 'screen.html'),
    '<html><head><meta name="qrichtext" content="1" /></head><body style=" font-family:\'Malgun Gothic\';">\n<p style="margin:0">' + g.text.replace(/<br>/g, '<br />\n') + '</p>\n<p>' + varShown + '</p></body></html>');

  const proc = spawn(pwsh, ['-NoProfile', '-File', path.join(text, 'JO9_Text_Server.ps1'), '-Port', '0'], { stdio: 'ignore' });
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) { await new Promise(r => setTimeout(r, 200)); try { port = parseInt(fs.readFileSync(path.join(text, 'runtime', 'port.txt'), 'utf8'), 10); } catch (e) { /* 대기 */ } }
  const url = 'http://127.0.0.1:' + port + '/';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', c => { if (c.type() === 'error' && !/409/.test(c.text())) errors.push(c.text()); });
  const shot = async (n) => { if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, n + '.png'), fullPage: true }); } };
  const newText = g.text.replace(/\s+$/, '') + ' 다시 오셨군요.';

  try {
    await page.goto(url);
    await t('시작: jack.qsp 로드, 현재 화면 일치 표시', async () => {
      await page.waitForFunction(() => /후보/.test(document.getElementById('stQsp').textContent), null, { timeout: 60000 });
      await page.waitForFunction(() => /건 일치/.test(document.getElementById('stScreen').textContent));
      const txt = await page.locator('#screenList').innerText();
      assert.ok(txt.includes('interaction_city'), txt.slice(0, 300));
      assert.ok(txt.includes('변수 포함 텍스트') && txt.includes('직접 수정할 수 없습니다'));
      await shot('01_screen');
    });

    await t('변수 포함 항목에는 [수정] 버튼이 없다', async () => {
      const cards = page.locator('#screenList .card');
      const n = await cards.count();
      let varCards = 0;
      for (let i = 0; i < n; i++) { const c = cards.nth(i); if ((await c.innerText()).includes('변수 포함 텍스트')) { varCards++; assert.strictEqual(await c.locator('button.primary').count(), 0); } }
      assert.ok(varCards >= 1);
    });

    await t('수정 → 적용 전 확인 → 적용', async () => {
      const card = page.locator('#screenList .card', { hasText: g.speaker }).filter({ hasNotText: '변수 포함 텍스트' }).first();
      await card.locator('button.primary').click();
      await page.waitForSelector('#editDlg[open]');
      assert.strictEqual(await page.inputValue('#edOld'), g.text);
      await page.fill('#edNew', newText);
      await shot('02_edit');
      await page.click('#edNext');
      await page.waitForSelector('#cfmDlg[open]');
      assert.ok((await page.locator('#cfmBody').innerText()).includes('변경 항목: 1개'));
      await shot('03_confirm');
      await page.click('#cfmApply');
      await page.waitForFunction(() => /적용했습니다/.test(document.getElementById('msg').innerText), null, { timeout: 60000 });
      const now = fs.readFileSync(qspPath);
      assert.notStrictEqual(sha(now), originalSha);
      const re = C.buildIndex(C.parseQsp(new Uint8Array(now))).items;
      assert.ok(re.some(x => x.location === g.location && x.text === newText));
      assert.strictEqual(re.filter(x => x.text === g.text && x.location === g.location && x.id === g.id).length, 0);
    });

    await t('기록 탭: 작업이 보이고 전체 되돌리기로 원본 복구', async () => {
      await page.click('#tabHistory');
      await page.waitForSelector('#historyList .group');
      assert.ok((await page.locator('#historyList').innerText()).includes('적용됨'));
      await shot('04_history');
      page.once('dialog', d => d.accept());
      await page.locator('#historyList button.danger').first().click();
      await page.waitForFunction(() => /되돌렸습니다/.test(document.getElementById('msg').innerText), null, { timeout: 60000 });
      assert.strictEqual(sha(fs.readFileSync(qspPath)), originalSha);
      await page.click('#tabHistory');
      await page.waitForFunction(() => /되돌림/.test(document.getElementById('historyList').innerText));
    });

    await t('검색 탭: 이름 검색·선택 치환, 선택하지 않은 항목은 유지', async () => {
      await page.click('#tabSearch');
      await page.fill('#q', '글로리아'); await page.click('#doSearch');
      await page.waitForSelector('#searchList .card');
      await shot('05_search');
      const boxes = page.locator('#searchList .card input[type=checkbox]:not(:disabled)');
      assert.ok(await boxes.count() >= 3);
      await boxes.nth(0).check(); await boxes.nth(1).check();
      await page.fill('#rep', '매디슨'); await page.click('#doReplace');
      await page.waitForSelector('#cfmDlg[open]');
      assert.ok((await page.locator('#cfmBody').innerText()).includes('변경 항목: 2개'));
      await page.click('#cfmApply');
      await page.waitForFunction(() => /적용했습니다/.test(document.getElementById('msg').innerText), null, { timeout: 60000 });
      const re = C.buildIndex(C.parseQsp(new Uint8Array(fs.readFileSync(qspPath)))).items;
      assert.strictEqual(re.filter(x => x.text.indexOf('매디슨') >= 0).length >= 2, true);
      assert.ok(C.search(re, '글로리아').length >= 3); // 선택하지 않은 문장은 그대로
    });

    await t('원본이 바뀐 뒤 적용하면 중단 안내와 [다시 검색]', async () => {
      await page.click('#tabSearch');
      await page.fill('#q', '글로리아'); await page.click('#doSearch');
      await page.waitForSelector('#searchList .card');
      await page.locator('#searchList .card input[type=checkbox]:not(:disabled)').first().check();
      await page.fill('#rep', '매디슨2'); 
      // 탐색 이후 다른 도구가 파일을 바꾼 상황을 만든다.
      const cur = fs.readFileSync(qspPath); const b2 = Buffer.from(cur); b2[b2.length - 2] = b2[b2.length - 2]; // 내용 유지
      const m2 = C.parseQsp(new Uint8Array(cur)); const i2 = C.buildIndex(m2).items.find(x => x.location === 'main_screen' && !x.hasVar && x.text.indexOf("'") < 0);
      const o2 = C.serializeQsp(C.applyEdits(m2, [{ loc: i2.loc, start: i2.start, end: i2.end, quote: i2.quote, oldText: i2.text, newText: i2.text + ' (외부 변경)' }]));
      fs.writeFileSync(qspPath, o2);
      await page.click('#doReplace');
      await page.waitForSelector('#cfmDlg[open]');
      await page.click('#cfmApply');
      await page.waitForSelector('#cfmErr .err');
      assert.ok((await page.locator('#cfmErr').innerText()).includes('변경되었습니다'));
      await shot('06_source_changed');
      assert.strictEqual(sha(fs.readFileSync(qspPath)), sha(o2));
    });

    await t('페이지 오류 없음', async () => { assert.deepStrictEqual(errors, []); });
  } finally { await browser.close(); proc.kill(); fs.rmSync(root, { recursive: true, force: true }); }
  console.log(pass + ' passed' + (process.exitCode ? ', FAILURES' : ''));
})();
