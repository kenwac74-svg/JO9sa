'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const OUT = __dirname;
const SOURCE = 'G:/somi/JO9sa/tools/text-workshop/catalog-cut-conditions.js';
const RULES = 'G:/somi/JO9sa/tools/text-workshop/image-cut-condition-rules.cjs';
const QSP = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const BASE_URL = 'http://127.0.0.1:3813/';
const profile = path.join(OUT, 'owned-browser-profile');
const expectedValues = ['-9999', ...Array.from({length:41}, (_, i) => String(-10 + i / 2)), '9999'];
const expectedLabels = expectedValues.map(v => Number(v) > 0 ? '+' + v : v);
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const fileHash = p => hash(fs.readFileSync(p));
let checks = 0;
const check = (value, message) => { checks++; assert.ok(value, message); };
const same = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };

async function snapshot(page) {
  return page.evaluate(() => ({
    state: JO9_IMAGE_CONDITIONS.state(),
    cards: [...document.querySelectorAll('.jo9-image-condition-card')].map(card => ({
      path: card.dataset.cutPath,
      enabled: card.querySelectorAll('input[type=checkbox]')[0].checked,
      moralityEnabled: card.querySelectorAll('input[type=checkbox]')[1].checked,
      selects: [...card.querySelectorAll('select')].slice(0, 2).map(select => ({
        value: select.value,
        options: [...select.options].map(option => ({value: option.value, label: option.textContent}))
      }))
    }))
  }));
}

function checkSnapshot(snap, rules, label) {
  check(snap.state.open && !snap.state.loading && snap.cards.length > 0, label + ': opened populated dialog');
  for (const card of snap.cards) {
    for (const select of card.selects) {
      same(select.options.map(o => o.value), expectedValues, label + ': exactly 43 ordered values');
      same(select.options.map(o => o.label), expectedLabels, label + ': signed endpoint labels');
    }
    const saved = rules.find(rule => rule.path.toLowerCase() === card.path.toLowerCase());
    const morality = saved?.morality;
    same(card.selects.map(s => s.value), [String(morality?.min ?? -10), String(morality?.max ?? 10)], label + ': saved/default values restored');
    same(card.moralityEnabled, !!morality, label + ': saved morality checkbox restored');
    same(card.enabled, !!saved, label + ': saved row enable state restored');
  }
}

async function fixtureChecks(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.setContent('<!doctype html><html lang="ko"><meta charset="utf-8"><title>Read only condition QA</title><body><button id="launch">열기</button></body></html>');
  await page.evaluate(() => {
    window.JO9_CATALOG_BRIDGE = {url:'http://fixture.invalid/', token:'fixture-only'};
    window.rowHtml = () => '<div>기존 카드</div>';
    window.qaCalls = [];
    window.fetch = async (url, options) => {
      const action = url.split('/').pop();
      window.qaCalls.push(action);
      if (action !== 'info') throw Error('QA blocks all writes');
      return {ok:true, status:200, json:async () => structuredClone(window.qaInfo)};
    };
  });
  await page.addScriptTag({path:SOURCE});
  const base = 'content/pic/scene/read-only-fixture.png';
  const options = require(RULES).OPTIONS;
  const family = {base, items:[
    {path:base, file:'read-only-fixture.png', cutIndex:1},
    {path:base.replace('.png', ' (2).png'), file:'read-only-fixture (2).png', cutIndex:2}
  ]};
  const results = [];
  for (const [label, morality] of [
    ['default', null],
    ['legacy-saved-halfpoints', {min:-4.5,max:2.5}],
    ['saved-extremes', {min:-9999,max:9999}]
  ]) {
    const rules = morality ? [{base,path:family.items[1].path,morality,money:null,rank:null,reputation:null}] : [];
    const info = {base,qspHash:'read-only-fixture',family,rules,options};
    await page.evaluate(info => { window.qaInfo = info; }, info);
    await page.evaluate(async base => { await JO9_IMAGE_CONDITIONS.open(base); }, base);
    const snap = await snapshot(page);
    checkSnapshot(snap, rules, 'fixture ' + label);
    results.push({label,...snap});
    await page.keyboard.press('Escape');
    check(!(await page.evaluate(() => JO9_IMAGE_CONDITIONS.state().open)), 'fixture closes on Escape');
  }
  same(await page.evaluate(() => qaCalls), ['info','info','info'], 'fixture only performs info calls');
  same(errors, [], 'fixture has no page errors');
  await page.close();
  return {pass:true,infoRequests:3,saveRequests:0,pageErrors:errors,snapshots:results};
}

async function liveChecks(context) {
  const page = await context.newPage();
  const errors = [], infoResponses = [], infoRequests = [], blockedRequests = [], saveAttempts = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('response', response => {
    if (new URL(response.url()).pathname === '/api/catalog/cut-conditions/info') {
      infoResponses.push(response.json());
    }
  });
  await page.route('**/*', async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/catalog/cut-conditions/save') saveAttempts.push(pathname);
    if (request.method() === 'POST' && pathname === '/api/catalog/cut-conditions/info') {
      infoRequests.push(JSON.parse(request.postData() || '{}'));
    }
    const readPost = /^\/api\/catalog\/(?:cut-conditions\/info|cuts\/(?:info|families|file))$/.test(pathname);
    if (!['GET','HEAD'].includes(request.method()) && !(request.method() === 'POST' && readPost)) {
      blockedRequests.push({method:request.method(),path:pathname});
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  await page.goto(BASE_URL + 'catalog?image=' + encodeURIComponent('content/pic/bg/beach.png'), {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => !!window.JO9_IMAGE_CONDITIONS?.installed, {timeout:30000});
  const served = await page.request.get(BASE_URL + 'catalog-cut-conditions.js');
  check(served.status() === 200, 'live addon served');
  same(hash(await served.body()), fileHash(SOURCE), 'live addon equals reviewed repository source');
  const results = [];
  for (const target of ['content/pic/bg/beach.png','content/pic/bg/hospital.png','content/pic/characters/archmage_zephiros.png','content/pic/scene/arena_end.png']) {
    const at = infoResponses.length;
    await page.evaluate(async target => { await JO9_IMAGE_CONDITIONS.open(target); }, target);
    check(infoResponses.length === at + 1, 'live open issues one info request');
    const info = await infoResponses[at];
    same(info.options.moralityExtremes, [-9999,9999], 'live API exposes endpoint options');
    same([info.options.moralityMin,info.options.moralityMax,info.options.moralityStep], [-10,10,.5], 'live API keeps regular range');
    const snap = await snapshot(page);
    checkSnapshot(snap, info.rules, 'live ' + target);
    results.push({target,savedMoralityRules:info.rules.filter(r => r.morality).map(r => ({path:r.path,morality:r.morality})),...snap});
    await page.keyboard.press('Escape');
    check(!(await page.evaluate(() => JO9_IMAGE_CONDITIONS.state().open)), 'live closes on Escape');
  }
  same(saveAttempts, [], 'live never attempts condition save');
  same(errors, [], 'live has no page errors');
  same(blockedRequests, [], 'live requires no blocked non-read-only request');
  await page.close();
  return {pass:true,baseUrl:BASE_URL,infoRequests:infoRequests.length,saveRequests:saveAttempts.length,blockedRequests,pageErrors:errors,snapshots:results};
}

(async () => {
  let context;
  const before = fileHash(QSP);
  const report = {pass:false,source:SOURCE,sourceSha256:fileHash(SOURCE),qspBefore:before,readOnly:true};
  try {
    check(!fs.existsSync(profile), 'owned profile path starts unused');
    context = await chromium.launchPersistentContext(profile, {
      executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      headless:true,viewport:{width:1200,height:900},
      downloadsPath:path.join(OUT,'owned-downloads'),tracesDir:path.join(OUT,'owned-traces')
    });
    report.fixture = await fixtureChecks(context);
    report.live = await liveChecks(context);
    report.pass = true;
  } catch (error) {
    report.error = String(error.stack || error);
    process.exitCode = 1;
  } finally {
    if (context) await context.close();
    report.qspAfter = fileHash(QSP);
    report.qspUnchanged = report.qspAfter === before;
    if (!report.qspUnchanged) { report.pass = false; process.exitCode = 1; }
    for (const name of ['owned-browser-profile','owned-downloads','owned-traces']) {
      const target = path.resolve(OUT,name);
      if (!target.startsWith(path.resolve(OUT)+path.sep)) throw Error('Refusing cleanup outside QA output');
      if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isSymbolicLink()) throw Error('Refusing symbolic QA cleanup root');
        fs.rmSync(target,{recursive:true,force:true});
      }
    }
    report.checks = checks;
    fs.writeFileSync(path.join(OUT,'browser-dom-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
    console.log(JSON.stringify({pass:report.pass,checks,fixtureInfoRequests:report.fixture?.infoRequests,liveInfoRequests:report.live?.infoRequests,saveRequests:(report.fixture?.saveRequests||0)+(report.live?.saveRequests||0),qspUnchanged:report.qspUnchanged,error:report.error}));
  }
})();
