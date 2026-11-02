'use strict';

// Feature-only native verification. Production files are read and hashed only.
// This does not run or repair the deferred whole-world release gate.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const TASK = 'galateya-outfits-20261101';
const REPO = 'G:/somi/JO9sa';
const GAME = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const TMP_BASE = 'G:/Codex/tmp/' + TASK;
const SCRIPT_DIR = __dirname;
let allowedExistingPids = new Set();
let allowedProcessBaseline = null;
const core = require(REPO + '/tools/text-workshop/core.cjs');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const q = value => "'" + String(value).replace(/'/g, "''") + "'";
const crlf = text => text.replace(/\r?\n/g, '\r\n');
const normalized = value => path.resolve(value).replace(/\\/g, '/').toLowerCase();
const inside = (parent, child) => normalized(child).startsWith(normalized(parent) + '/');
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });

function walkFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      assert(!entry.isSymbolicLink(), 'Linked input is outside this verification scope: ' + target);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) files.push(target);
      else throw Error('Unsupported filesystem entry: ' + target);
    }
  }
  visit(root);
  return files.sort();
}

function processes() {
  const command = "$ErrorActionPreference='Stop'; $qaGalateyaProcesses=@(Get-Process -Name jack -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path,@{Name='startedUtc';Expression={$_.StartTime.ToUniversalTime().ToString('o')}}); ConvertTo-Json -InputObject @($qaGalateyaProcesses) -Compress";
  const result = cp.spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024
  });
  assert.equal(result.status, 0, 'Cannot verify current engine processes: ' + (result.stderr || result.error || ''));
  const value = JSON.parse((result.stdout || '').trim() || '[]');
  return Array.isArray(value) ? value : [value];
}

function processObservation(label) {
  const entries = processes();
  const unexpected = entries.filter(entry => !allowedExistingPids.has(entry.Id));
  if (allowedProcessBaseline === null) allowedProcessBaseline = entries.filter(entry => allowedExistingPids.has(entry.Id));
  const allowedPreserved = allowedProcessBaseline.every(prior => entries.some(entry => entry.Id === prior.Id && entry.Path === prior.Path && entry.startedUtc === prior.startedUtc));
  return { label, checkedAt: new Date().toISOString(), processes: entries, unexpectedProcesses: unexpected, allowedExistingPreserved: allowedPreserved };
}

function noOtherEngine(label, requirePreserved = true) {
  const observation = processObservation(label);
  assert.equal(observation.unexpectedProcesses.length, 0, label + ': another unapproved jack.exe is running; it will not be stopped.');
  if (requirePreserved) assert(observation.allowedExistingPreserved, label + ': a permitted existing game process changed.');
  return observation;
}

function pngInfo(file) {
  const data = fs.readFileSync(file);
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Not a PNG: ' + file);
  assert.equal(data.subarray(12, 16).toString('ascii'), 'IHDR', 'Missing PNG IHDR: ' + file);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), bitDepth: data[24], colorType: data[25] };
}

function saveStats() {
  return walkFiles(GAME + '/save').map(file => {
    const info = fs.statSync(file);
    return { path: path.relative(GAME, file).replace(/\\/g, '/'), bytes: info.size, modifiedMs: info.mtimeMs };
  });
}

function body(doc, name) {
  const location = doc.locations.find(item => item.name === name);
  assert(location, 'Missing location: ' + name);
  return core.shift(doc.lines[location.body], 5);
}

function check(expression, label) {
  return 'qa_galateya_checks+=1\r\nif (' + expression + ')=0: msg ' + q('FAIL_GALATEYA_' + label + '|observed=<<$qa_galateya_boot_after>>|initial=<<$qa_galateya_boot_initial>>') + ' & exit';
}

function nativeDom() {
  var attempts = 0;
  function emit(ok, result) {
    if (window.__qaGalateyaDone) return;
    window.__qaGalateyaDone = true;
    var link = document.createElement('a');
    link.href = "EXEC: $qa_galateya_metrics='" + JSON.stringify(result).replace(/'/g, "''") + "' & msg '" + (ok ? qaMarker : 'FAIL_GALATEYA_DOM') + "'";
    document.body.appendChild(link);
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    link.dispatchEvent(event);
  }
  function inspect() {
    var images = [], ready = true, ok = true;
    for (var i = 0; i < qaExpected.length; i++) {
      var expected = qaExpected[i];
      var image = document.querySelector('#qa_galateya_' + expected.role + ' img');
      if (!image || !image.complete || !image.naturalWidth) { ready = false; break; }
      var source = (image.getAttribute('src') || '').replace(/\\/g, '/').replace(/\/+/g, '/');
      var rectangle = image.getBoundingClientRect();
      var pass = source === expected.path && image.naturalWidth === expected.width && image.naturalHeight === expected.height;
      if (!pass) ok = false;
      images.push({ role: expected.role, source: source, natural: [image.naturalWidth, image.naturalHeight], bounds: { width: rectangle.width, height: rectangle.height }, pass: pass });
    }
    if (!ready) {
      if (++attempts < 160) { setTimeout(inspect, 50); return; }
      emit(false, { error: 'native-image-load-timeout', images: images });
      return;
    }
    var controls = [];
    for (var id = 10; id <= 13; id++) {
      var exists = !!document.getElementById('chekbox_' + id + 'r');
      controls.push(exists);
      if (!exists) ok = false;
    }
    var label = document.getElementById('assistant_appear');
    emit(ok, { images: images, controls: controls, appearanceLabels: label ? label.textContent : '', menuSource: 'verbatim assistant_stat appearance section only', bootObservation: { firstStart: qaBootInitial, afterEngineBootEventLoop: qaBootAfter } });
  }
  setTimeout(inspect, 150);
}

function prepare() {
  const processChecks = [noOtherEngine('before preparation')];
  const templatePath = GAME + '/json/slaves/2583_galateya.json';
  const template = json(templatePath);
  const expected = {
    fullimage: 'girls/full/galateya_purple_long',
    fullmade: 'girls/full/2583/2583_full_maid',
    fullsecretary: 'girls/full/2583/2583_full_secr',
    fullmistress: 'girls/full/2583/2583_full_dom',
    indpack_title: 'characters/galateya',
    indpack_naked: 'characters/galateya',
    indpack_maid: 'girls/full/2583/2583_full_maid',
    indpack_secr: 'girls/full/2583/2583_full_secr',
    indpack_dom: 'girls/full/2583/2583_full_dom'
  };
  for (const [key, value] of Object.entries(expected)) assert.equal(template[key], value, 'Registration is not ready: ' + key);
  assert.equal(template.seed_age, 0, 'Preserve adult young=0; do not change age for this test.');
  assert.equal(template.seed_name, 'Galateya', 'The requested change does not rename Galateya.');

  const pngRelative = [
    'content/pic/characters/galateya.png',
    'content/pic/girls/full/2583/2583_full_maid.png',
    'content/pic/girls/full/2583/2583_full_secr.png',
    'content/pic/girls/full/2583/2583_full_dom.png',
    'content/pic/ui/buttons/legacy/sel_button.png',
    'content/pic/ui/buttons/legacy/unsel_button.png'
  ];
  const dimensions = {};
  for (const relative of pngRelative.slice(0, 4)) dimensions[relative] = pngInfo(GAME + '/' + relative);
  for (const relative of pngRelative.slice(1, 4)) assert.deepEqual(dimensions[relative], { width: 795, height: 596, bitDepth: 8, colorType: 6 }, 'New costume must be 795x596 RGBA8.');

  const copyInputs = [GAME + '/config.xml', ...walkFiles(GAME + '/json'), ...walkFiles(GAME + '/css'), ...walkFiles(GAME + '/fonts'), ...pngRelative.map(relative => GAME + '/' + relative)];
  const additionalProtected = [
    GAME + '/jack.qsp', GAME + '/engine/jack.exe', GAME + '/FastQSP.ini', REPO + '/tools/qa/run-client-smoke.ps1',
    GAME + '/content/pic/girls/full/galateya_purple_long.png',
    GAME + '/content/modworkpic/galateya_made.png',
    GAME + '/content/modworkpic/galateya_sec.png',
    GAME + '/content/modworkpic/galateya_dom.png'
  ];
  const protectedFiles = [...new Set([...copyInputs, ...additionalProtected])].map(file => ({ path: file, bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) }));
  const protectedInventory = ['json', 'css', 'fonts'].map(relative => ({ relative, files: walkFiles(GAME + '/' + relative).map(file => path.relative(GAME, file).replace(/\\/g, '/')) }));

  const id = new Date().toISOString().replace(/[-:.TZ]/g, '') + '-' + crypto.randomBytes(3).toString('hex');
  const fixture = path.join(TMP_BASE, 'native-' + id);
  assert(inside(TMP_BASE, fixture), 'Fixture must stay in the named temporary task directory.');
  assert(!fs.existsSync(fixture), 'Do not overwrite an earlier native fixture.');
  fs.mkdirSync(fixture, { recursive: true });
  writeJson(path.join(fixture, '.galateya-fixture-owned.json'), { task: TASK, fixture, createdAt: new Date().toISOString() });
  for (const input of copyInputs) {
    assert(inside(GAME, input));
    const destination = path.join(fixture, path.relative(GAME, input));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(input, destination, fs.constants.COPYFILE_EXCL);
    assert.equal(sha(fs.readFileSync(destination)), sha(fs.readFileSync(input)));
  }
  fs.writeFileSync(path.join(fixture, 'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n', { flag: 'wx' });

  const raw = fs.readFileSync(GAME + '/jack.qsp');
  const doc = core.parse(raw);
  assert(core.serialize(doc).equals(raw), 'Current QSP must roundtrip unchanged.');
  const originalLines = doc.lines.slice();
  const originalStart = body(doc, 'Start');
  const originalAppearance = body(doc, 'assistant_stat');
  const appearanceStart = originalAppearance.indexOf('!assistant alternate appearances');
  const appearanceEndKey = "killvar '$assistant_appearance'";
  const appearanceEnd = originalAppearance.indexOf(appearanceEndKey, appearanceStart);
  assert(appearanceStart >= 0 && appearanceEnd >= appearanceStart, 'Appearance menu boundaries changed.');
  const appearanceSection = originalAppearance.slice(appearanceStart, appearanceEnd + appearanceEndKey.length);
  const observation = ['fullimage', 'indpack_title', 'indpack_naked', 'indpack_maid', 'indpack_secr', 'indpack_dom'].map((name, index) => q((index ? '|' : '') + name + '=') + '+$' + name + '[2583]').join('+');
  const deferBoot = '(function(){setTimeout(function(){var a=document.createElement("a");a.href="EXEC: gs \'Start\', \'after-boot\'";document.body.appendChild(a);var e=document.createEvent("MouseEvents");e.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e);},250);})();';
  const lines = [
    '! Isolated Galateya feature diagnostic. No seed-array bootstrap precedes registration assertions.',
    '! Normal engine new-game order returns from the first Start, then executes JSON.',
    "if $args[0] ! 'after-boot':",
    '$qa_galateya_boot_initial=' + observation,
    "$counter=''", "$ongload=''", "$onnewloc=''", 'settimer 0', 'usehtml=1',
    '*p ' + q('<script type="text/javascript">' + deferBoot + '</script>'),
    'exit', 'end',
    '$qa_galateya_boot_after=' + observation,
    'qa_galateya_checks=0'
  ];
  // These are the first assertions after the normal engine boot has returned to
  // the Qt event loop, before killall, refresh, priming, or seed-array assignments.
  for (const [key, value] of Object.entries(expected)) lines.push(check('$' + key + '[2583]=' + q(value), 'COLD_JSON_' + key.toUpperCase()));
  lines.push(check("$seed_name[2583]='Galateya' and seed_age[2583]=0", 'COLD_JSON_IDENTITY'));
  for (const key of ['indpack_title', 'indpack_naked', 'indpack_maid', 'indpack_secr', 'indpack_dom']) {
    for (const suffix of ['_horny', '_rebel']) lines.push(check('$' + key + suffix + "[2583]=''", 'ABSENT_MOOD_VARIANT_' + key + suffix));
  }
  lines.push("$counter=''", "$ongload=''", "$onnewloc=''", 'settimer 0', 'usehtml=1', 'sound_on=0', 'autosave=0', 'decadesave=0', 'autosave_day=0', 'autosave_decade=0', 'snk_room_target=0', 'nsfw=0', "gs '#static_base'", "$counter=''", "$ongload=''", "$onnewloc=''", 'settimer 0');

  const modes = [[0, 'naked'], [2, 'maid'], [3, 'secr'], [1, 'dom']];
  const actorSetup = (mode, moral, arousal) => [
    'assistant_type=2583', "assistant_state=CONST_INT['slave_exist']", "$assistant_name='Galateya'", "assistant['age']=0", "assistant['moral']=" + moral, "assistant['arousal']=" + arousal, "assistant['image_mode']=" + mode, "$assistant['cloth']='голая'", "$assistant['fullimage']=" + q(expected.fullimage), "$assistant['fullmade']=''", "$assistant['fullsecretary']=''", "$assistant['fullmistress']=''"
  ];
  let routeCases = 0;
  for (const [mode, role] of modes) for (const [moral, arousal] of [[4, 0], [2, 0], [4, 4]]) {
    const wanted = 'content/pic/' + expected['indpack_' + role] + '.png';
    lines.push(...actorSetup(mode, moral, arousal), "$qa_galateya_image=func('display_fullimage','assistant','qa_route','psy')", check("instr($replace($replace($qa_galateya_image,'\\','/'),'//','/')," + q(wanted) + ')>0', 'ROUTE_' + mode + '_' + moral + '_' + arousal));
    lines.push(check("$assistant['fullimage']=" + q(expected.fullimage) + " and $assistant['fullmade']='' and $assistant['fullsecretary']='' and $assistant['fullmistress']=''", 'OLD_ACTOR_CACHE_UNCHANGED_' + routeCases));
    routeCases++;
  }
  const aliasCases = [[expected.fullimage, 'fullimage', expected.indpack_title], [expected.fullmade, 'fullimage', expected.indpack_maid], [expected.fullsecretary, 'fullimage', expected.indpack_secr], [expected.fullmistress, 'fullimage', expected.indpack_dom], ['custom/galateya_manual_path', 'fullimage', 'custom/galateya_manual_path']];
  for (let index = 0; index < aliasCases.length; index++) {
    const [input, key, output] = aliasCases[index];
    lines.push('$qa_galateya_alias_input=' + q(input), "$qa_galateya_resolved=func('jo9_seed_role_images','resolve',2583,$qa_galateya_alias_input," + q(key) + ')', check('$qa_galateya_resolved=' + q(output) + ' and $qa_galateya_alias_input=' + q(input), 'READ_ALIAS_' + index));
  }
  lines.push('*clr');
  const domExpected = [];
  for (const [mode, role] of modes) {
    lines.push(...actorSetup(mode, 4, 0), "*p func('display_fullimage','assistant'," + q('qa_galateya_' + role) + ",'psy')");
    const relative = 'content/pic/' + expected['indpack_' + role] + '.png';
    domExpected.push({ role, path: relative, width: dimensions[relative].width, height: dimensions[relative].height });
  }
  lines.push(...actorSetup(0, 4, 0), appearanceSection, check("assistant_alt_appearance_count=3 and instr($maintxt,'chekbox_10r')>0 and instr($maintxt,'chekbox_11r')>0 and instr($maintxt,'chekbox_12r')>0 and instr($maintxt,'chekbox_13r')>0", 'FOUR_APPEARANCE_CONTROLS'));
  const marker = 'JO9_QA_GALATEYA_routing_dom_COMPLETE';
  const driver = 'var qaExpected=' + JSON.stringify(domExpected) + ',qaMarker=' + JSON.stringify(marker) + ',qaBootInitial="<<$qa_galateya_boot_initial>>",qaBootAfter="<<$qa_galateya_boot_after>>";(' + nativeDom.toString() + ')();';
  lines.push('*p ' + q('<script type="text/javascript">' + driver.replace(/\r?\n/g, ' ') + '</script>'));
  const newStart = crlf(lines.join('\n'));
  assert(!/\r(?!\n)|(?<!\r)\n/.test(newStart), 'Diagnostic Start must use CRLF.');
  const start = doc.locations.find(item => item.name === 'Start');
  doc.lines[start.body] = core.shift(newStart, -5);
  const diagnostic = core.serialize(doc);
  const reparsed = core.parse(diagnostic);
  assert(core.serialize(reparsed).equals(diagnostic));
  assert.equal(doc.locations.length, reparsed.locations.length);
  for (let index = 0; index < doc.lines.length; index++) if (index !== start.body) assert.equal(reparsed.lines[index], originalLines[index]);
  const diagnosticPath = path.join(fixture, 'routing-dom.qsp');
  fs.writeFileSync(diagnosticPath, diagnostic, { flag: 'wx' });
  const planPath = path.join(fixture, 'plan.json');
  writeJson(planPath, [{ name: 'routing-dom', file: diagnosticPath, marker, checkpoint: 'Normal engine cold-boot JSON registration after first Start return, without bootstrap; 12 real display routes with old actor caches; 5 read-only alias cases; four native PNG loads and existing appearance controls.' }]);
  const reportPath = path.join(SCRIPT_DIR, 'native-' + id + '-report.json');
  const prepared = {
    task: TASK, id, fixture, planPath, reportPath, createdAt: new Date().toISOString(), processChecks, allowedExistingPids: [...allowedExistingPids],
    sourceQsp: { path: GAME + '/jack.qsp', sha256: sha(raw), originalStartSha256: sha(Buffer.from(originalStart)), diagnosticSha256: sha(diagnostic), changedLocationsInFixture: ['Start'], productionChanged: false },
    appearanceSection: { source: 'assistant_stat', sha256: sha(Buffer.from(appearanceSection)), mode: 'verbatim excerpt; full profile not executed' },
    coverage: { nativeProcesses: 1, displayRoutes: routeCases, readAliases: aliasCases.length, nativeImages: 4, appearanceControls: 4, actualColdJsonRegistration: true, coldBootCheckpoint: 'Qt EXEC event after first Start returned', seedArrayBootstrap: false },
    protectedFiles, protectedInventory, dimensions, domExpected, productionSaveStats: saveStats(),
    limits: [
      'Feature-only isolated native verification; whole-world release validation is deferred.',
      'The known pre-existing isolated LF in credits is preserved byte for byte and is not repaired.',
      'No actual save selection UI or full profile execution; old actor image fields are primed directly without priming JSON-owned globals.',
      'DOM assertions cover completed image loads, original pixel dimensions, and menu controls; rendered bounds are recorded but full profile layout is not asserted.',
      'The existing age-dependent secretary caption remains unchanged; young=0 is adult and the current menu may say school uniform.',
      'No WORK writes, Full synchronization, packaging, commit, push, or source PNG replacement.',
      'Production save files are not opened or loaded; their names, byte sizes, and modification times are compared. Save contents are not hashed.'
    ]
  };
  writeJson(path.join(fixture, 'prepared.json'), prepared);
  return prepared;
}

function preservation(prepared) {
  const results = prepared.protectedFiles.map(file => {
    try {
      const exists = fs.existsSync(file.path);
      const actual = exists ? sha(fs.readFileSync(file.path)) : null;
      return { path: file.path, expected: file.sha256, actual, unchanged: actual === file.sha256 };
    } catch (error) {
      return { path: file.path, expected: file.sha256, actual: null, unchanged: false, error: error.message };
    }
  });
  const inventories = prepared.protectedInventory.map(entry => {
    try {
      const actual = walkFiles(GAME + '/' + entry.relative).map(file => path.relative(GAME, file).replace(/\\/g, '/'));
      return { relative: entry.relative, unchanged: JSON.stringify(actual) === JSON.stringify(entry.files) };
    } catch (error) {
      return { relative: entry.relative, unchanged: false, error: error.message };
    }
  });
  let saves;
  try { saves = { files: prepared.productionSaveStats.length, namesBytesTimesUnchanged: JSON.stringify(saveStats()) === JSON.stringify(prepared.productionSaveStats) }; }
  catch (error) { saves = { files: prepared.productionSaveStats.length, namesBytesTimesUnchanged: false, error: error.message }; }
  return { allUnchanged: results.every(item => item.unchanged) && inventories.every(item => item.unchanged) && saves.namesBytesTimesUnchanged, protectedFileCount: results.length, files: results, inventories, productionSaves: saves };
}

function run(prepared) {
  let result, failure, metrics;
  try {
    prepared.processChecks.push(noOtherEngine('immediately before native launch'));
    result = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', REPO + '/tools/qa/run-client-smoke.ps1', '-Engine', GAME + '/engine/jack.exe', '-Plan', prepared.planPath, '-TimeoutSeconds', '45'], {
      encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 4 * 1024 * 1024
    });
    fs.writeFileSync(path.join(prepared.fixture, 'runner.log'), (result.stdout || '') + '\n' + (result.stderr || ''), { flag: 'wx' });
    assert.equal(result.status, 0, 'Native runner failed: ' + (result.stdout || '') + (result.stderr || result.error || ''));
    const clients = json(path.join(prepared.fixture, 'client-results.json'));
    assert.equal(clients.length, 1);
    assert.equal(clients[0].pass, true, 'Native completion marker was not reached.');
    const stderr = fs.readFileSync(path.join(prepared.fixture, 'routing-dom-stderr.log'), 'utf8');
    const match = stderr.match(/\$qa_galateya_metrics='([^']+)' & msg/);
    assert(match, 'Native DOM metrics were not emitted.');
    metrics = JSON.parse(decodeURIComponent(match[1]));
    assert.equal(metrics.images.length, 4);
    assert(metrics.images.every(item => item.pass));
    assert.deepEqual(metrics.controls, [true, true, true, true]);
  } catch (error) { failure = error.stack || String(error); }
  finally {
    try {
      const snapshot = processObservation('after native runner, including failure');
      prepared.processChecks.push(snapshot);
      if (snapshot.unexpectedProcesses.length) failure = (failure || '') + '\nAn unexpected jack.exe process remained after the native runner; it was not stopped by this script.';
      if (!snapshot.allowedExistingPreserved) failure = (failure || '') + '\nA permitted existing game process changed during the native verification.';
    } catch (error) {
      prepared.processChecks.push({ label: 'after native runner, including failure', checkedAt: new Date().toISOString(), error: error.message });
      failure = (failure || '') + '\nCannot inspect processes after native runner: ' + error.message;
    }
  }
  const preserved = preservation(prepared);
  if (!preserved.allUnchanged) failure = (failure || '') + '\nProtected production inputs changed during verification.';
  const report = { status: failure ? 'FAIL' : 'PASS', ...prepared, completedAt: new Date().toISOString(), runnerExit: result?.status ?? null, metrics, preservation: preserved, failure: failure || null };
  writeJson(prepared.reportPath, report);
  const evidence = path.join(SCRIPT_DIR, 'native-' + prepared.id + '-evidence');
  fs.mkdirSync(evidence);
  for (const file of ['prepared.json', 'plan.json', 'runner.log', 'client-results.json', 'routing-dom-stderr.log', 'routing-dom-stdout.log']) {
    const input = path.join(prepared.fixture, file);
    if (fs.existsSync(input)) fs.copyFileSync(input, path.join(evidence, file), fs.constants.COPYFILE_EXCL);
  }
  console.log(JSON.stringify({ status: report.status, report: prepared.reportPath, evidence, fixture: prepared.fixture, coverage: prepared.coverage, protectedInputsUnchanged: preserved.allUnchanged, failure: report.failure }, null, 2));
  if (failure) process.exitCode = 1;
}

function cleanup(reportPath, supersedingPassPath) {
  const report = json(reportPath);
  assert.equal(report.task, TASK);
  if (report.status !== 'PASS') {
    assert(supersedingPassPath, 'A reviewed failed fixture requires a later successful report before cleanup.');
    const successful = json(supersedingPassPath);
    assert.equal(successful.task, TASK);
    assert.equal(successful.status, 'PASS');
    assert.equal(successful.sourceQsp.sha256, report.sourceQsp.sha256);
    assert(successful.completedAt > report.completedAt, 'The successful verification must follow the failed probe.');
    assert(preservation(successful).allUnchanged, 'Current production inputs differ from the successful verification.');
  }
  const target = fs.realpathSync(report.fixture);
  assert(inside(TMP_BASE, target), 'Cleanup target escaped the named task temporary root.');
  assert(!inside(GAME, target));
  const owned = json(path.join(target, '.galateya-fixture-owned.json'));
  assert.equal(owned.task, TASK);
  assert.equal(normalized(owned.fixture), normalized(target));
  allowedExistingPids = new Set(report.allowedExistingPids || []);
  allowedProcessBaseline = report.processChecks[0].processes.filter(entry => allowedExistingPids.has(entry.Id));
  noOtherEngine('before fixture cleanup', false);
  const files = walkFiles(target); // Reject every link/junction before recursive removal.
  assert(files.every(file => inside(target, fs.realpathSync(file))));
  const keep = [reportPath, __filename, path.join(SCRIPT_DIR, 'native-' + report.id + '-evidence')];
  assert(keep.every(file => !inside(target, file)), 'Keep reports, scripts, and evidence outside the fixture.');
  const preserved = preservation(report);
  assert(preserved.allUnchanged, 'Production inputs changed after verification; review before cleanup.');
  const bytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
  fs.rmSync(target, { recursive: true, force: false });
  const cleanupPath = path.join(SCRIPT_DIR, 'native-' + report.id + '-cleanup.json');
  writeJson(cleanupPath, { task: TASK, removedFixture: target, generatedFiles: files.length, generatedBytes: bytes, preserved: keep, reviewedFailureSupersededBy: supersedingPassPath || null, productionInputsUnchanged: true, removed: !fs.existsSync(target), completedAt: new Date().toISOString() });
  console.log(JSON.stringify({ cleaned: true, removedFixture: target, generatedFiles: files.length, generatedBytes: bytes, report: cleanupPath }, null, 2));
}

try {
  const args = process.argv.slice(2);
  for (let index = args.indexOf('--allow-existing-pid'); index >= 0; index = args.indexOf('--allow-existing-pid')) {
    const id = Number(args[index + 1]);
    assert(Number.isSafeInteger(id) && id > 0, 'An explicit positive existing process ID is required.');
    allowedExistingPids.add(id);
    args.splice(index, 2);
  }
  if (args[0] === '--run' && args.length === 1) run(prepare());
  else if (args[0] === '--prepare' && args.length === 1) {
    const prepared = prepare();
    console.log(JSON.stringify({ prepared: true, fixture: prepared.fixture, plan: prepared.planPath, note: 'No engine was launched.' }, null, 2));
  } else if (args[0] === '--cleanup' && args.length === 2) cleanup(path.resolve(args[1]));
  else if (args[0] === '--cleanup' && args.length === 4 && args[2] === '--verified-by') cleanup(path.resolve(args[1]), path.resolve(args[3]));
  else throw Error('Usage: node verify-galateya-native.cjs --run [--allow-existing-pid <known-user-game-pid>] | --prepare | --cleanup <native-report.json> [--verified-by <later-pass-report.json>]');
} catch (error) { console.error(error.stack || String(error)); process.exitCode = 1; }
