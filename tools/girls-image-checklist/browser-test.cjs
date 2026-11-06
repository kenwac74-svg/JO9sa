'use strict';
// Isolated browser checks. All pictures and writes use synthetic in-memory PNGs.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {chromium} = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = __dirname;
const uiPath = path.join(root, 'catalog-girls-checklist.js');
const manifestPath = path.join(root, 'manifest.json');
const originalUi = fs.readFileSync(uiPath);
const originalManifest = fs.readFileSync(manifestPath);
const builtStandalonePath = path.join(root, 'JO9_캐릭터_이미지체크리스트.html');
const builtStandalone = fs.readFileSync(builtStandalonePath);
const manifest = JSON.parse(originalManifest);
// Offline export must never resolve preview URLs to the user's real game.
const fixtureManifest = {...manifest, gameRoot: 'X:/JO9_SYNTHETIC_IMAGE_FIXTURE'};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function crc(bytes) {
  let result = 0xffffffff;
  for (const byte of bytes) {
    result ^= byte;
    for (let bit = 0; bit < 8; bit++) result = (result >>> 1) ^ ((result & 1) ? 0xedb88320 : 0);
  }
  return (result ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const label = Buffer.from(type);
  const result = Buffer.alloc(12 + bytes.length);
  result.writeUInt32BE(bytes.length);
  label.copy(result, 4);
  bytes.copy(result, 8);
  result.writeUInt32BE(crc(Buffer.concat([label, bytes])), 8 + bytes.length);
  return result;
}
function png(width, height, color = [70, 110, 155, 255]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      for (let channel = 0; channel < 4; channel++)
        raw[y * (width * 4 + 1) + x * 4 + 1 + channel] = color[channel];
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]);
}

const canonical = new Map(manifest.files.map(p => [p.toLowerCase(), p]));
const synthetic = new Map();
const preview = png(80, 60);
let fileCalls = [];
let applyCalls = [];
let requestErrors = [];
let injectedScriptRequests = [];
const statusFlags = ['done', 'ore', 'mre', 'branch', 'spare', 'wip', 'todo', 'delete'];
const initialFileItems = {'content\\pic\\girls\\full\\cloth\\1100_green_long_young.png': ['done', 'spare']};
const statusStore = {savedAt: 1, items: structuredClone(initialFileItems), characterItems: {}};
const statusCalls = [];
let statusGate = null;
let statusAvailable = true;
const allowedCharacterIds = new Set(manifest.characters.map(c => c.id));
const bridgeStubs = 'window.__bridgeCalls=[];window.JO9_CATALOG_SAVE=async()=>window.__bridgeCalls.push("save");window.JO9_CATALOG_ACCEPT=s=>{window.__bridgeCalls.push("accept");window.CATALOG_STATUS=s;};';
const injectedScriptNames = ['catalog_grok.js', 'catalog_cuts.js', 'catalog-cut-conditions.js'];
const bodyInjection = injectedScriptNames.map(name => '<script src="' + name + '"></script>').join('') + '</body>';

function oldPng(p) {
  if (!synthetic.has(p)) synthetic.set(p, /girls\/face\//i.test(p) ? png(151, 150) : png(795, 596));
  return synthetic.get(p);
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/built-standalone') {
      // Match the /catalog server's bridge insertion and first-closing-body
      // replacement. This previously hit a closing tag in download()'s string.
      let html = builtStandalone.toString('utf8');
      html = html.replace(/<head(?:\s[^>]*)?>/i, head => head + '<script>window.JO9_CATALOG_BRIDGE={url:location.origin+"/",token:"fixture"};</script>');
      html = html.replace(/<\/body>/i, bodyInjection);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
      return;
    }
    if (injectedScriptNames.includes(url.pathname.slice(1))) {
      injectedScriptRequests.push(url.pathname.slice(1));
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.end('/* Synthetic legacy module: injection position test only. */');
      return;
    }
    if (url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><meta charset="utf-8"><body><aside id="side"></aside><main id="main"></main><script>window.pick=()=>{window.__pickCount=(window.__pickCount||0)+1;};window.JO9_CATALOG_BRIDGE={url:location.origin+"/",token:"fixture"};' + bridgeStubs + 'window.JO9_GIRLS_CHECKLIST=' +
        JSON.stringify(fixtureManifest).replace(/</g, '\\u003c') + ';</script><script>' + originalUi.toString('utf8') + '</script></body>');
      return;
    }
    if (url.pathname === '/api/catalog-asset') {
      assert.equal(url.searchParams.get('t'), 'fixture');
      res.setHeader('Content-Type', 'image/png');
      res.end(preview);
      return;
    }
    if (url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    assert.equal(req.headers['x-jo9-token'], 'fixture');
    let raw = '';
    for await (const bytes of req) raw += bytes;
    const input = raw ? JSON.parse(raw) : {};
    let result;
    if (url.pathname === '/api/catalog/state') {
      if (statusGate) await statusGate;
      result = {available: statusAvailable, ...statusStore};
    } else if (url.pathname === '/api/catalog/status') {
      statusCalls.push(input);
      assert.equal(input.actions.length, 1, 'One click sends one shared status action');
      for (const action of input.actions) {
        assert.equal(typeof action.characterId, 'number');
        assert(allowedCharacterIds.has(action.characterId), 'Only registered character IDs may be tagged');
        assert.equal(Object.hasOwn(action, 'path'), false, 'Character status must not use a file path');
        assert(statusFlags.includes(action.flag));
        assert.equal(typeof action.checked, 'boolean');
        assert.equal(typeof action.expected, 'boolean');
        const key = String(action.characterId);
        const existing = statusStore.characterItems[key] || [];
        const before = existing.includes(action.flag);
        assert(before === action.expected || before === action.checked);
        const next = new Set(existing);
        action.checked ? next.add(action.flag) : next.delete(action.flag);
        const ordered = statusFlags.filter(flag => next.has(flag));
        if (ordered.length) statusStore.characterItems[key] = ordered;
        else delete statusStore.characterItems[key];
      }
      assert.deepEqual(statusStore.items, initialFileItems);
      statusStore.savedAt++;
      result = {available: true, ...statusStore};
    } else if (url.pathname === '/api/catalog/pic/file') {
      fileCalls.push(input.path);
      const p = canonical.get(input.path.toLowerCase());
      result = p ? {data: oldPng(p).toString('base64'), name: path.posix.basename(p)} : {missing: true};
    } else if (url.pathname === '/api/catalog/pic/apply') {
      applyCalls.push(input);
      assert.equal(input.jobs.length, 1);
      const job = input.jobs[0];
      assert.match(job.path, /^girls\//);
      assert(!job.path.includes('..'));
      const prior = canonical.get(job.path.toLowerCase());
      assert.equal(job.before, prior ? hash(oldPng(prior)) : null);
      assert.equal(job.createMissing, !prior);
      const bytes = Buffer.from(job.data, 'base64');
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(bytes.readUInt32BE(16), job.width);
      assert.equal(bytes.readUInt32BE(20), job.height);
      canonical.set(job.path.toLowerCase(), job.path);
      synthetic.set(job.path, bytes);
      result = {status: 'applied', id: 'synthetic-only'};
    } else if (url.pathname === '/api/catalog/pic/index') {
      result = {index: [...canonical.values()].map(p => ({path: p}))};
    } else {
      throw Error('Unknown fixture route ' + url.pathname);
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (error) {
    requestErrors.push(error.message);
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({error: error.message}));
  }
});

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const page = await browser.newPage({viewport: {width: 1450, height: 1000}});
  const errors = [];
  const checks = [];
  const exportedPath = path.join(root, '.browser-export.tmp.html');
  page.on('pageerror', error => errors.push(error.message));
  try {
    const generated = await browser.newPage({viewport: {width: 1450, height: 1000}});
    generated.on('pageerror', error => errors.push('generated: ' + error.message));
    await generated.goto('http://127.0.0.1:' + server.address().port + '/built-standalone?girlssets=1');
    const generatedPanel = generated.locator('#jo9-girls-checklist');
    await generatedPanel.locator('.gc-card').first().waitFor();
    assert.equal(await generatedPanel.getAttribute('open'), '');
    assert((await generatedPanel.innerText()).includes('캐릭터 ' + manifest.characters.length + '명'));
    assert.equal(await generated.locator('body').evaluate(body => Array.from(body.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim()), '',
      'JavaScript must not leak into visible body text');
    assert.deepEqual(injectedScriptRequests.slice().sort(), injectedScriptNames.slice().sort());
    await generatedPanel.locator('input[type=search]').fill('1100');
    await generatedPanel.locator('.gc-card[data-character-id="1100"]').waitFor();
    assert.equal(await generatedPanel.locator('.gc-card').count(), 1);
    await generatedPanel.locator('input[type=checkbox]').uncheck();
    await generated.screenshot({path: path.join(root, 'browser-generated-standalone.png'), fullPage: false});
    await generated.close();
    checks.push('Actual generated standalone survives the server bridge and three-script closing-body injection, shows the full checklist, and exposes no JavaScript as body text');

    const offlineBuilt = await browser.newPage();
    offlineBuilt.on('pageerror', error => errors.push('generated offline: ' + error.message));
    await offlineBuilt.route('**/*', async route => {
      if (route.request().resourceType() === 'image')
        await route.fulfill({status: 200, contentType: 'image/png', body: preview});
      else await route.continue();
    });
    await offlineBuilt.goto(require('node:url').pathToFileURL(builtStandalonePath).href);
    const offlineBuiltPanel = offlineBuilt.locator('#jo9-girls-checklist');
    await offlineBuiltPanel.locator('.gc-card').first().waitFor();
    assert((await offlineBuiltPanel.innerText()).includes('캐릭터 ' + manifest.characters.length + '명'));
    assert.equal(await offlineBuiltPanel.getByRole('button', {name: 'WORK 이미지 상태 새로고침', exact: true}).isDisabled(), true);
    assert.equal(await offlineBuiltPanel.getByRole('button', {name: /^PNG (추가|교체)$/})
      .evaluateAll(buttons => buttons.length > 0 && buttons.every(button => button.disabled)), true);
    assert.equal(await offlineBuiltPanel.locator('.gc-tag').evaluateAll(buttons => buttons.length > 0 && buttons.every(button => button.disabled)), true);
    const builtData = JSON.parse(builtStandalone.toString('utf8').match(/window\.JO9_GIRLS_CHECKLIST=([\s\S]*?);<\/script>/)[1]);
    const seededStatus = Object.entries(builtData.checklistStatus?.characterItems || {}).find(([id, flags]) => flags.length && allowedCharacterIds.has(Number(id)));
    if (seededStatus) {
      await offlineBuiltPanel.locator('select').first().selectOption('all');
      await offlineBuiltPanel.locator('input[type=search]').fill(seededStatus[0]);
      await offlineBuiltPanel.locator('.gc-card[data-character-id="' + seededStatus[0] + '"]').waitFor();
      assert(await offlineBuiltPanel.locator('.gc-tag').evaluateAll((buttons, seed) => buttons.some(button =>
        button.dataset.characterId === seed[0] && seed[1].includes(button.dataset.flag) && button.getAttribute('aria-pressed') === 'true'), seededStatus));
    } else assert.equal(await offlineBuiltPanel.locator('.gc-tag[aria-pressed="true"]').count(), 0);
    await offlineBuilt.close();
    checks.push('Actual generated standalone opens offline with saved status visible, PNG/tag writes disabled, and only synthetic image requests');

    let releaseStatusGate;
    statusGate = new Promise(resolve => { releaseStatusGate = resolve; });
    await page.goto('http://127.0.0.1:' + server.address().port + '/?girlssets=1');
    const panel = page.locator('#jo9-girls-checklist');
    await panel.locator('.gc-card').first().waitFor();
    assert.equal(await panel.getAttribute('open'), '');
    assert((await panel.innerText()).includes('캐릭터 ' + manifest.characters.length + '명'));
    assert.equal(await panel.locator('.gc-tag').evaluateAll(buttons => buttons.length > 0 && buttons.every(button => button.disabled)), true);
    assert.equal(statusCalls.length, 0);
    releaseStatusGate();
    statusGate = null;
    await page.waitForFunction(() => [...document.querySelectorAll('#jo9-girls-checklist .gc-tag')].some(button => !button.disabled));
    assert.equal(await page.locator('#main > #jo9-girls-checklist').count(), 1);
    await page.evaluate(() => window.pick('fixture'));
    assert.equal(await panel.getAttribute('open'), null);
    await page.locator('#side #jo9GirlsNav').click();
    assert.equal(await panel.getAttribute('open'), '');
    checks.push('Full manifest initializes and girlssets opens the checklist');
    checks.push('Tags remain disabled until shared state is ready; girls panel lives inside main and sidebar navigation reopens it after pick closes it');

    const search = panel.locator('input[type=search]');
    const filter = panel.locator('select').first();
    const sort = panel.getByRole('combobox', {name: '캐릭터 정렬', exact: true});
    const card = id => panel.locator('.gc-card[data-character-id="' + id + '"]');
    async function find(id, kind = 'all') {
      await filter.selectOption(kind);
      await search.fill(String(id));
      await card(id).waitFor();
      assert.equal(await panel.locator('.gc-card').count(), 1, 'Numeric ID search must return exactly one card');
      return card(id);
    }

    await find(1100, 'broken');
    assert.match(await card(1100).innerText(), /그림 경로 오류/);
    await find(1015, 'hidden');
    assert.match(await card(1015).innerText(), /그림 있음 · 복장 선택 연결 필요/);
    await find(2583);
    assert.match(await card(2583).innerText(), /갈라테야/);
    assert.match(await card(2583).innerText(), /전용 그림 있음/);
    await find(2571, 'special');
    assert.match(await card(2571).innerText(), /이사벨라/);
    assert.match(await card(2571).innerText(), /2571_full_title/);
    await find(1100, 'random');
    checks.push('Filters and ID searches resolve 1100 broken,1015 hidden,2583 Galateya,2571 Isabella, and random/special groups');

    await find(1100);
    const maidSlot = id => card(id).locator('.gc-slot').filter({has: page.locator('h4', {hasText: /^하녀$/})});
    const maid = () => maidSlot(1100);
    const tag = (id, flag) => card(id).locator(':scope > .gc-tags .gc-tag[data-character-id="' + id + '"][data-flag="' + flag + '"]');
    async function toggle(id, flag, checked) {
      const before = statusCalls.length;
      await tag(id, flag).click();
      await page.waitForFunction(expected => window.__bridgeCalls?.filter(x => x === 'accept').length === expected, before + 1);
      assert.equal(statusCalls.length, before + 1);
      assert.equal(await tag(id, flag).getAttribute('aria-pressed'), String(checked));
      assert.equal(await tag(id, flag).isEnabled(), true);
      const pair = await page.evaluate(() => window.__bridgeCalls.slice(-2));
      assert.deepEqual(pair, ['save', 'accept']);
    }
    assert.equal(await card(1100).locator(':scope > .gc-tags').count(), 1);
    assert.equal(await card(1100).locator('.gc-tag').count(), 8);
    assert.equal(await card(1100).locator('.gc-slot .gc-tag,.gc-row .gc-tag').count(), 0);
    assert.equal(await tag(1100, 'done').getAttribute('aria-pressed'), 'false', 'File done status must not become character done status');
    await toggle(1100, 'todo', true);
    await toggle(1100, 'branch', true);
    await toggle(1100, 'spare', true);
    assert.deepEqual(statusStore.characterItems['1100'], ['branch', 'spare', 'todo']);
    await toggle(1100, 'todo', false);
    assert.deepEqual(statusStore.characterItems['1100'], ['branch', 'spare']);
    assert.deepEqual(statusStore.items, initialFileItems);
    checks.push('Each character has exactly one eight-tag group, files have none, multiple tags coexist, and ID-only POSTs preserve all existing file statuses');

    await page.reload();
    await panel.locator('.gc-card').first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('#jo9-girls-checklist .gc-tag')].some(button => !button.disabled));
    await find(1100);
    assert.equal(await tag(1100, 'branch').getAttribute('aria-pressed'), 'true');
    assert.equal(await tag(1100, 'spare').getAttribute('aria-pressed'), 'true');
    assert.equal(await tag(1100, 'todo').getAttribute('aria-pressed'), 'false');
    checks.push('Status survives a fresh page load through the shared state API');

    // Reset only the browser instrumentation after reload, not shared state.
    const baseCalls = statusCalls.length;
    await page.evaluate(count => { window.__bridgeCalls = Array.from({length: count}, () => ['save', 'accept']).flat(); }, baseCalls);
    await find(1260);
    await toggle(1260, 'branch', true);
    await toggle(1260, 'done', true);
    await find(1401);
    assert.equal(await tag(1401, 'branch').getAttribute('aria-pressed'), 'false');
    assert.equal(await tag(1401, 'done').getAttribute('aria-pressed'), 'false');
    await toggle(1401, 'spare', true);
    await find(1260);
    assert.equal(await tag(1260, 'branch').getAttribute('aria-pressed'), 'true');
    assert.equal(await tag(1260, 'spare').getAttribute('aria-pressed'), 'false');
    checks.push('Characters1260 and1401 keep independent ID statuses even though their maid picture is shared');

    const tagFilter = flag => panel.locator('.gc-status-filter[data-flag="' + flag + '"]');
    assert.equal(await panel.locator('.gc-status-filter').count(), 9);
    await search.fill('');
    await filter.selectOption('broken');
    await tagFilter('done').click();
    assert.equal(await filter.inputValue(), 'all');
    await card(1260).waitFor();
    assert.equal(await panel.locator('.gc-card').count(), 1);
    assert.equal(await tagFilter('done').getAttribute('aria-pressed'), 'true');
    await tagFilter('done').click();
    assert.equal(await tagFilter('').getAttribute('aria-pressed'), 'true');
    assert.equal(await panel.locator('.gc-card').count(), 12);
    await tagFilter('branch').click();
    assert.deepEqual(await panel.locator('.gc-card').evaluateAll(cards => cards.map(c => Number(c.dataset.characterId))), [1100,1260]);
    await search.fill('1100');
    assert.equal(await panel.locator('.gc-card').count(), 1);
    assert.equal(await search.inputValue(), '1100');
    await tagFilter('spare').click();
    assert.equal(await search.inputValue(), '1100', 'Changing a status filter must preserve search');
    assert.equal(await panel.locator('.gc-card').count(), 1);
    await tagFilter('').click();
    await search.fill('');
    await sort.selectOption('id-desc');
    assert.equal(await panel.locator('.gc-card').first().getAttribute('data-character-id'), String(Math.max(...allowedCharacterIds)));
    await sort.selectOption('id');
    assert.equal(await panel.locator('.gc-card').first().getAttribute('data-character-id'), String(Math.min(...allowedCharacterIds)));
    await sort.selectOption('name');
    const expectedNames = manifest.characters.slice().sort((a,b) => a.name.localeCompare(b.name,'ko') || a.id-b.id).slice(0,12).map(c => c.id);
    assert.deepEqual(await panel.locator('.gc-card').evaluateAll(cards => cards.map(c => Number(c.dataset.characterId))), expectedNames);
    await sort.selectOption('id');
    await find(1260);
    checks.push('Eight status filters plus All filter characters, include completed IDs, toggle off, preserve search, and cooperate with ID/name ordering');

    statusAvailable = false;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => document.querySelector('#jo9-girls-checklist').textContent.includes('상태 연결 확인 필요'));
    assert.equal(await panel.locator('.gc-tag').evaluateAll(buttons => buttons.every(button => button.disabled)), true);
    const unavailableCalls = statusCalls.length;
    await tag(1260, 'todo').evaluate(button => button.click());
    assert.equal(statusCalls.length, unavailableCalls);
    statusAvailable = true;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => [...document.querySelectorAll('#jo9-girls-checklist .gc-tag')].some(button => !button.disabled));
    await find(1100);
    checks.push('Unavailable shared status disables every tag and sends no POST; successful reconnection enables tags again');

    const chooser = page.waitForEvent('filechooser');
    await maid().getByRole('button', {name: 'PNG 추가', exact: true}).click();
    await (await chooser).setFiles([]);
    await page.waitForTimeout(50);
    assert.equal(applyCalls.length, 0);
    assert.equal(fileCalls.length, 0);
    checks.push('Canceled file selection sends no file or apply request');

    const input = png(64, 100, [190, 90, 40, 255]);
    async function select() {
      const choice = page.waitForEvent('filechooser');
      await maid().getByRole('button', {name: 'PNG 추가', exact: true}).click();
      await (await choice).setFiles({name: 'synthetic.png', mimeType: 'image/png', buffer: input});
      await page.locator('dialog.gc-preview').waitFor();
      await page.locator('dialog.gc-preview img').evaluate(img => img.decode());
    }
    await select();
    assert.equal(applyCalls.length, 0);
    assert.deepEqual(await page.locator('dialog.gc-preview img').evaluate(img => [img.naturalWidth,img.naturalHeight]), [795,596]);
    assert.match(await page.locator('dialog.gc-preview').innerText(), /누락된 PNG 추가 확인/);
    await page.locator('dialog.gc-preview').getByRole('button', {name: '취소', exact: true}).click();
    assert.equal(applyCalls.length, 0);
    checks.push('Selected PNG is sized to795x596, requires preview approval, and preview cancellation writes nothing');

    await select();
    const approved = await page.locator('dialog.gc-preview img').getAttribute('src');
    await page.locator('dialog.gc-preview').getByRole('button', {name: '이 PNG 저장', exact: true}).click();
    await page.waitForFunction(() => document.querySelector('#jo9-girls-checklist').textContent.includes('원본 백업과 이미지 패치 기록이 생성됐습니다.'));
    assert.equal(applyCalls.length, 1);
    const job = applyCalls[0].jobs[0];
    const character = manifest.characters.find(c => String(c.id) === '1100');
    assert.equal(job.path, character.refs.fullmade);
    assert.equal(job.before, null);
    assert.equal(job.createMissing, true);
    assert.equal(job.width, 795);
    assert.equal(job.height, 596);
    assert.equal(job.cap, 60 * 1024 * 1024);
    assert.equal('data:image/png;base64,' + job.data, approved);
    assert.equal(await maid().getByRole('button', {name: 'PNG 교체', exact: true}).count(), 1);
    checks.push('Missing registered maid creates only its exact path and exact approved preview through one apply job');

    await panel.getByRole('button', {name: 'WORK 이미지 상태 새로고침', exact: true}).click();
    await page.waitForFunction(() => document.querySelector('#jo9-girls-checklist').textContent.includes('이미지 파일 상태를 갱신했습니다'));
    assert.equal(await maid().getByRole('button', {name: 'PNG 교체', exact: true}).count(), 1);
    checks.push('Mock rescan retains newly filled image state');

    await panel.locator('input[type=checkbox]').uncheck();
    assert.equal(await panel.locator('.gc-slot img').count(), 0);
    await page.screenshot({path: path.join(root, 'browser-synthetic.png'), fullPage: false});
    checks.push('Preview toggle removes thumbnails; screenshot contains no real character imagery');
    const downloadEvent = page.waitForEvent('download');
    await panel.getByRole('button', {name: '현재 목록 HTML 저장', exact: true}).click();
    const download = await downloadEvent;
    assert.equal(await download.failure(), null);
    await download.saveAs(exportedPath);
    const exportedHtml = fs.readFileSync(exportedPath, 'utf8');
    assert.match(exportedHtml, /JO9_SYNTHETIC_IMAGE_FIXTURE/);
    assert(!exportedHtml.includes('token:"fixture"'));
    const offline = await browser.newPage({viewport: {width: 1450, height: 1000}});
    offline.on('pageerror', error => errors.push('offline: ' + error.message));
    await offline.goto(require('node:url').pathToFileURL(exportedPath).href);
    const offlinePanel = offline.locator('#jo9-girls-checklist');
    await offlinePanel.locator('.gc-card').first().waitFor();
    assert.equal(await offlinePanel.getAttribute('open'), '');
    await offlinePanel.locator('select').first().selectOption('all');
    await offlinePanel.locator('input[type=search]').fill('1100');
    await offlinePanel.locator('.gc-card[data-character-id="1100"]').waitFor();
    assert.equal(await offlinePanel.locator('.gc-card').count(), 1);
    const writeButtons = offlinePanel.getByRole('button', {name: /^PNG (추가|교체)$/});
    assert((await writeButtons.count()) > 0);
    assert.equal(await writeButtons.evaluateAll(buttons => buttons.every(button => button.disabled)), true);
    assert.equal(await offlinePanel.getByRole('button', {name: 'WORK 이미지 상태 새로고침', exact: true}).isDisabled(), true);
    assert.equal(await offlinePanel.locator('.gc-tag').evaluateAll(buttons => buttons.length > 0 && buttons.every(button => button.disabled)), true);
    const offlineCharacter = offlinePanel.locator('.gc-card[data-character-id="1100"]');
    assert.equal(await offlineCharacter.locator(':scope > .gc-tags .gc-tag[data-flag="branch"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await offlineCharacter.locator(':scope > .gc-tags .gc-tag[data-flag="spare"]').getAttribute('aria-pressed'), 'true');
    await offlinePanel.locator('.gc-status-filter[data-flag="done"]').click();
    assert.equal(await offlinePanel.locator('.gc-card').count(), 0, 'Offline status filtering must preserve the existing1100 search');
    await offlinePanel.locator('input[type=search]').fill('');
    await offlinePanel.locator('.gc-card[data-character-id="1260"]').waitFor();
    assert.equal(await offlinePanel.locator('.gc-card').count(), 1);
    assert.deepEqual(statusStore.items, initialFileItems);
    assert.equal(applyCalls.length, 1);
    await offline.close();
    checks.push('Downloaded standalone HTML reopens offline, exact numeric search returns one card, and all write controls are disabled');
    assert.deepEqual(errors, []);
    assert.deepEqual(requestErrors, []);
    assert(fs.readFileSync(uiPath).equals(originalUi), 'UI changed during test');
    assert(fs.readFileSync(manifestPath).equals(originalManifest), 'Manifest changed during test');
    const report = {
      status: 'PASS',
      createdAt: new Date().toISOString(),
      characters: manifest.characters.length,
      uiSha256: hash(originalUi),
      manifestSha256: hash(originalManifest),
      generatedStandaloneSha256: hash(builtStandalone),
      checks,
      syntheticApplyCalls: applyCalls.length,
      syntheticStatusCalls: statusCalls.length,
      existingFileStatusUnchanged: true,
      gameWrites: 0,
      limits: 'Isolated mock HTTP API with synthetic solid-color PNGs. No WORK reads of image contents or image/JSON/QSP writes. Tests real browser UI, not PIC server integration.'
    };
    fs.writeFileSync(path.join(root, 'browser-test-report.json'), JSON.stringify(report,null,2) + '\n');
    console.log(JSON.stringify(report,null,2));
  } finally {
    if (fs.existsSync(exportedPath)) fs.unlinkSync(exportedPath);
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
