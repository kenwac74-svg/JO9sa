'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const args = process.argv.slice(2);
const get = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const helperPath = path.resolve(get('--helper', path.join(__dirname, '../installer/INSTALL_HELPER.ps1')));
const reportPath = path.resolve(get('--report', path.join(__dirname, 'report.json')));
const tempRoot = path.resolve(get('--temp-root', 'G:/Codex/tmp/jo9-jsonfull-patch-20261105/tests'));
const shell = get('--shell', 'powershell.exe');
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
const write = (p, b) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b); };
const report = { schema: 1, helperPath, shell, startedAt: new Date().toISOString(), sourceGameOrWorkTouched: false, tests: [], limits: ['Real GUI auto-discovery, folder selection and cancellation are independently reviewed, not automated by -NonInteractive.'] };
function finish(status, exitCode) { report.status = status; report.finishedAt = new Date().toISOString(); fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8'); console.log(JSON.stringify({ status, passed: report.tests.filter(x => x.pass).length, failed: report.tests.filter(x => !x.pass).length, reportPath }, null, 2)); process.exitCode = exitCode; }
if (!fs.existsSync(helperPath)) { report.tests.push({ name: 'TDD_missing_helper', pass: false, expected: 'Installer helper exists before execution', actual: 'Helper file is absent' }); finish('RED_MISSING_HELPER', 1); }
else if (args.includes('--red-only')) { report.tests.push({ name: 'TDD_missing_helper', pass: true, actual: 'Helper is now available; preserved earlier RED report is the prerequisite evidence.' }); finish('HELPER_AVAILABLE', 0); }
else main().catch(e => { report.fatal = String(e.stack || e); finish('HARNESS_ERROR', 1); });

async function main() {
  const helperRaw = fs.readFileSync(helperPath), originalHelperHash = digest(helperRaw);
  report.originalHelperSha256 = originalHelperHash;
  // Codex starts from PowerShell7 and prepends its7-only modules. A native5.1
  // child must use its own module paths, just as INSTALL.cmd does from Explorer.
  const childEnv = { ...process.env };
  if (/(?:^|[\\/])powershell(?:\.exe)?$/i.test(shell)) {
    childEnv.PSModulePath = (process.env.PSModulePath || '').split(';').filter(x => /WindowsPowerShell[\\/]Modules|WindowsPowerShell[\\/]v1\.0[\\/]Modules/i.test(x)).join(';');
    report.childPSModulePathNormalization = 'PowerShell5.1 child only: retained WindowsPowerShell modules and excluded inherited PowerShell7-only Codex modules; system/user environment was not changed.';
  }
  if (!helperRaw.toString('utf8').includes('__MANIFEST_SHA256__')) throw Error('Expected fixture substitution token is absent; refusing to alter an unknown constant.');
  const runRoot = path.join(tempRoot, 'run-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'));
  fs.mkdirSync(runRoot, { recursive: true }); report.fixtureRoot = runRoot;
  function safeRemove(p) { const target = path.resolve(p), root = path.resolve(runRoot); assert.ok(target.startsWith(root + path.sep), 'Fixture deletion escaped run root: ' + target); if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true }); }
  function snapshot(root) {
    const files = {};
    function walk(p, rel) { for (const d of fs.readdirSync(p, { withFileTypes: true })) { const dest = path.join(p, d.name), r = rel ? rel + '/' + d.name : d.name; if (d.isSymbolicLink()) { files[r] = 'REPARSE:' + fs.readlinkSync(dest); continue; } if (d.isDirectory()) { files[r + '/'] = 'DIRECTORY'; walk(dest, r); } else if (d.isFile()) files[r] = digest(fs.readFileSync(dest)); } }
    walk(root, ''); return files;
  }
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS7sAAAAASUVORK5CYII=', 'base64');
  function fixture(name, options = {}) {
    const base = path.join(runRoot, name), target = path.join(base, '기존 게임 루트'), source = options.inplace ? target : path.join(base, '압축 해제 폴더');
    fs.mkdirSync(target, { recursive: true }); fs.mkdirSync(source, { recursive: true });
    const protectedFiles = { 'game/save/personal.sav': 'PERSONAL_SAVE', 'game/engine/setting.ini': 'ENGINE_USER_SETTING', 'FastQSP.ini': 'ROOT_SETTING', 'game/content/pic/unrelated.png': 'UNRELATED_IMAGE', 'my notes/keep.txt': 'USER_NOTES' };
    write(path.join(target, 'Jack-o-nine-tails.exe'), 'FAKE_EXISTING_GAME_EXE');
    write(path.join(target, 'game/jack.qsp'), 'OLD_QSP');
    write(path.join(target, 'game/content/pic/fixture/tiny 한글.png'), 'OLD_PNG');
    write(path.join(target, 'game/json/slaves/old-name.json'), '{"old":true}');
    write(path.join(target, 'game/json/obsolete/nested.txt'), 'OLD_JSON_TREE_EXTRA');
    write(path.join(target, 'game/json/save_config.json'), '{"playerPreference":"KEEP"}');
    for (const [p, b] of Object.entries(protectedFiles)) write(path.join(target, p), b);
    const payload = [
      { path: 'game/json/slaves/1.json', bytes: Buffer.from('{"fullimage":"girls/full/fixture","seed_name":"한글 시험"}', 'utf8'), kind: 'json' },
      { path: 'game/content/pic/fixture/tiny 한글.png', bytes: png, kind: 'image' },
      { path: 'game/jack.qsp', bytes: Buffer.from('NEW_QSP_FIXTURE'), kind: 'qsp' }
    ];
    for (const f of payload) write(path.join(source, f.path), f.bytes);
    write(path.join(source, 'game/content/pic/not-in-manifest.png'), 'DO_NOT_COPY');
    const f = { name, base, target, source, payload, protectedFiles, manifest: { schema: 1, files: payload.map(x => ({ path: x.path, bytes: x.bytes.length, sha256: digest(x.bytes), kind: x.kind })) } };
    f.prepare = () => { const manifestBytes = Buffer.from(JSON.stringify(f.manifest, null, 2) + '\n', 'utf8'); write(path.join(source, 'PATCH_MANIFEST.json'), manifestBytes); const script = helperRaw.toString('utf8').replaceAll('__MANIFEST_SHA256__', digest(manifestBytes)); write(path.join(source, 'INSTALL_HELPER.ps1'), script); };
    f.prepare(); return f;
  }
  function execute(script, extraArgs, cwd) { const result = cp.spawnSync(shell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, ...extraArgs], { cwd, env: childEnv, encoding: 'utf8', timeout: 60000, windowsHide: true }); return { code: result.status, signal: result.signal, error: result.error?.message, stdout: result.stdout || '', stderr: result.stderr || '' }; }
  function run(f) { return execute(path.join(f.source, 'INSTALL_HELPER.ps1'), ['-TargetRoot', f.target, '-NonInteractive'], f.source); }
  function assertInstalled(f) {
    for (const x of f.payload) assert.equal(digest(fs.readFileSync(path.join(f.target, x.path))), digest(x.bytes), x.path + ' payload mismatch');
    for (const [p, b] of Object.entries(f.protectedFiles)) assert.equal(fs.readFileSync(path.join(f.target, p), 'utf8'), b, p + ' was modified');
    assert.equal(fs.readFileSync(path.join(f.target, 'game/json/save_config.json'), 'utf8'), '{"playerPreference":"KEEP"}', 'Player JSON setting was lost');
    assert.equal(fs.existsSync(path.join(f.target, 'game/json/slaves/old-name.json')), false, 'Old JSON remained');
    assert.equal(fs.existsSync(path.join(f.target, 'game/json/obsolete')), false, 'Old JSON subtree remained');
    if (f.source !== f.target) assert.equal(fs.existsSync(path.join(f.target, 'game/content/pic/not-in-manifest.png')), false, 'Unlisted source image copied');
  }
  async function test(name, fn) { if (get('--filter', '') && !name.includes(get('--filter', ''))) return; const started = Date.now(); let details; try { details = await fn(); report.tests.push({ name, pass: true, durationMs: Date.now() - started, ...details }); } catch (e) { report.tests.push({ name, pass: false, durationMs: Date.now() - started, error: String(e.stack || e), ...e.testDetails }); } console.log(JSON.stringify({ test: name, pass: report.tests.at(-1).pass })); }
  function requireSuccess(result) { if (result.code !== 0) { const e = Error('Installer did not succeed'); e.testDetails = { execution: result }; throw e; } }
  function requireFailure(result) { if (result.code === 0 || result.error) { const e = Error('Installer accepted invalid input or harness could not execute'); e.testDetails = { execution: result }; throw e; } }
  async function rejected(name, change, options = {}) { await test(name, () => { const f = fixture(name, options); change(f); f.prepare(); const before = snapshot(f.target), fixtureBefore = snapshot(f.base), result = run(f); requireFailure(result); assert.deepEqual(snapshot(f.target), before, 'Rejected installation mutated existing target'); assert.deepEqual(snapshot(f.base), fixtureBefore, 'Rejected installation wrote outside target or changed source'); return { exitCode: result.code, stderr: result.stderr.slice(-1800), stdout: result.stdout.slice(-1800) }; }); }
  await test('separate_source_unicode_spaces_full_json_replace_and_settings_preserved', () => { const f = fixture('normal'); const result = run(f); requireSuccess(result); assertInstalled(f); return { exitCode: result.code }; });
  await test('repeat_same_installer_is_idempotent', () => { const f = fixture('repeat'); requireSuccess(run(f)); const before = snapshot(f.target); requireSuccess(run(f)); assertInstalled(f); assert.deepEqual(snapshot(f.target), before); });
  await test('source_equals_target_stages_manifest_json_and_removes_old_extras', () => { const f = fixture('inplace', { inplace: true }); const result = run(f); requireSuccess(result); assertInstalled(f); return { exitCode: result.code }; });
  await test('inplace_repeat_is_idempotent', () => { const f = fixture('inplace-repeat', { inplace: true }); requireSuccess(run(f)); const before = snapshot(f.target); requireSuccess(run(f)); assertInstalled(f); assert.deepEqual(snapshot(f.target), before); });
  await test('valid_target_with_missing_json_folder_is_recovered', () => { const f = fixture('missing-json'); safeRemove(path.join(f.target, 'game/json')); requireSuccess(run(f)); for (const x of f.payload) assert.equal(digest(fs.readFileSync(path.join(f.target, x.path))), digest(x.bytes)); });
  await rejected('target_missing_root_exe_rejected', f => safeRemove(path.join(f.target, 'Jack-o-nine-tails.exe')));
  await rejected('target_missing_qsp_rejected', f => safeRemove(path.join(f.target, 'game/jack.qsp')));
  await rejected('manifest_parent_traversal_rejected', f => { f.manifest.files[1].path = 'game/../../escape.png'; });
  await rejected('manifest_backslash_traversal_rejected', f => { f.manifest.files[1].path = 'game\\..\\..\\escape.png'; });
  await rejected('manifest_absolute_path_rejected', f => { f.manifest.files[1].path = 'C:/outside-fixture.png'; });
  await rejected('manifest_exact_duplicate_rejected', f => { f.manifest.files.push({ ...f.manifest.files[0] }); });
  await rejected('manifest_case_collision_rejected', f => { f.manifest.files.push({ ...f.manifest.files[0], path: 'game/json/SLAVES/1.json' }); });
  await rejected('manifest_unknown_kind_rejected', f => { f.manifest.files[1].kind = 'unapproved-executable'; });
  await rejected('manifest_invalid_hash_format_rejected', f => { f.manifest.files[1].sha256 = 'not-a-hash'; });
  await rejected('manifest_valid_hash_but_wrong_payload_rejected', f => { f.manifest.files[1].sha256 = '0'.repeat(64); });
  await rejected('source_payload_missing_rejected_before_target_writes', f => { safeRemove(path.join(f.source, f.payload[0].path)); });
  await test('manifest_fixed_sha_tampering_rejected', () => { const f = fixture('manifest-tamper'); fs.appendFileSync(path.join(f.source, 'PATCH_MANIFEST.json'), ' '); const before = snapshot(f.target), result = run(f); requireFailure(result); assert.deepEqual(snapshot(f.target), before); return { exitCode: result.code }; });
  await test('malformed_signed_manifest_rejected', () => { const f = fixture('malformed'); const bytes = Buffer.from('{NOT JSON'); write(path.join(f.source, 'PATCH_MANIFEST.json'), bytes); write(path.join(f.source, 'INSTALL_HELPER.ps1'), helperRaw.toString('utf8').replaceAll('__MANIFEST_SHA256__', digest(bytes))); const before = snapshot(f.target), result = run(f); requireFailure(result); assert.deepEqual(snapshot(f.target), before); return { exitCode: result.code }; });
  await test('target_json_junction_rejected_and_external_files_preserved', () => { const f = fixture('json-junction'), outside = path.join(f.base, '외부 자료'); write(path.join(outside, 'sentinel.json'), 'OUTSIDE'); safeRemove(path.join(f.target, 'game/json')); fs.symlinkSync(outside, path.join(f.target, 'game/json'), 'junction'); const before = snapshot(f.target), outsideBefore = snapshot(outside), result = run(f); requireFailure(result); assert.deepEqual(snapshot(f.target), before); assert.deepEqual(snapshot(outside), outsideBefore); return { exitCode: result.code }; });
  await test('target_json_nested_stale_junction_rejected_and_external_files_preserved', () => { const f = fixture('json-nested-junction'), outside = path.join(f.base, '외부 하위 자료'); write(path.join(outside, 'sentinel.json'), 'OUTSIDE_NESTED'); fs.symlinkSync(outside, path.join(f.target, 'game/json/stale-linked-folder'), 'junction'); const before = snapshot(f.base), result = run(f); requireFailure(result); assert.deepEqual(snapshot(f.base), before, 'Nested JSON junction rejection changed fixture or outside tree'); return { exitCode: result.code }; });
  await test('target_payload_parent_junction_rejected_and_external_files_preserved', () => { const f = fixture('png-junction'), outside = path.join(f.base, '외부 이미지'); write(path.join(outside, 'tiny 한글.png'), 'OUTSIDE_PNG'); safeRemove(path.join(f.target, 'game/content/pic/fixture')); fs.symlinkSync(outside, path.join(f.target, 'game/content/pic/fixture'), 'junction'); const before = snapshot(f.target), outsideBefore = snapshot(outside), result = run(f); requireFailure(result); assert.deepEqual(snapshot(f.target), before); assert.deepEqual(snapshot(outside), outsideBefore); return { exitCode: result.code }; });
  await test('partial_runtime_copy_failure_restores_earlier_png_and_partial_qsp', () => {
    const f = fixture('copy-failure'), before = snapshot(f.target), marker = path.join(f.base, 'fault-fired.marker'), wrapper = path.join(f.base, 'inject-copy-failure.ps1');
    const q = s => "'" + s.replaceAll("'", "''") + "'";
    const script = [
      "$global:FixtureCopyFaultFired=$false",
      '$global:FixtureFaultDestination=' + q(path.join(f.target, 'game/jack.qsp')),
      '$global:FixtureFaultMarker=' + q(marker),
      'function global:Copy-Item {',
      ' [CmdletBinding()] param([string]$LiteralPath,[string]$Destination,[switch]$Force)',
      ' if(-not $global:FixtureCopyFaultFired -and $Destination.Equals($global:FixtureFaultDestination,[StringComparison]::OrdinalIgnoreCase)) {',
      '  $global:FixtureCopyFaultFired=$true',
      '  [IO.File]::WriteAllBytes($Destination,[byte[]](80,65,82,84))',
      "  [IO.File]::WriteAllText($global:FixtureFaultMarker,'INJECTED_PARTIAL_COPY')",
      "  throw 'INJECTED_PARTIAL_RUNTIME_COPY'",
      ' }',
      ' Microsoft.PowerShell.Management\\Copy-Item @PSBoundParameters',
      '}',
      '& ' + q(path.join(f.source, 'INSTALL_HELPER.ps1')) + ' -TargetRoot ' + q(f.target) + ' -NonInteractive',
      'exit $LASTEXITCODE'
    ].join('\r\n');
    write(wrapper, '\uFEFF' + script + '\r\n');
    const result = execute(wrapper, [], f.source); requireFailure(result);
    assert.equal(fs.readFileSync(marker, 'utf8'), 'INJECTED_PARTIAL_COPY', 'Fault did not run at the destination copy');
    assert.deepEqual(snapshot(f.target), before, 'Partial nonJSON copy failure did not restore previous game files');
    return { exitCode: result.code, injectedPartialWrite: true, stdout: result.stdout.slice(-2400), stderr: result.stderr.slice(-2400) };
  });
  await test('target_locked_qsp_failure_preserves_previous_files', async () => {
    const f = fixture('locked-qsp'), before = snapshot(f.target), locked = path.join(f.target, 'game/jack.qsp'), hold = path.join(f.base, 'hold.lock'), ready = path.join(f.base, 'ready.marker');
    write(hold, 'HOLD_EXCLUSIVE_FILE_HANDLE');
    const quote = x => x.replaceAll("'", "''");
    const command = "$ErrorActionPreference='Stop'; $s=[System.IO.File]::Open('" + quote(locked) + "',[System.IO.FileMode]::Open,[System.IO.FileAccess]::ReadWrite,[System.IO.FileShare]::None); [System.IO.File]::WriteAllText('" + quote(ready) + "','READY'); try { while([System.IO.File]::Exists('" + quote(hold) + "')) { Start-Sleep -Milliseconds 100 } } finally { $s.Dispose() }";
    const holderScript = path.join(f.base, 'hold-exclusive-file.ps1'); write(holderScript, '\uFEFF' + command + '\r\n');
    const lock = cp.spawn(shell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', holderScript], { env: childEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let lockOutput = ''; lock.stdout.on('data', b => { lockOutput += b.toString(); }); lock.stderr.on('data', b => { lockOutput += b.toString(); });
    try { await new Promise((resolve, reject) => { const began = Date.now(); const poll = () => { if (fs.existsSync(ready)) return resolve(); if (lock.exitCode !== null) return reject(Error('Lock helper exited: ' + lock.exitCode + ': ' + lockOutput)); if (Date.now() - began > 15000) return reject(Error('Lock helper timeout: ' + lockOutput)); setTimeout(poll, 25); }; poll(); }); const result = run(f); requireFailure(result); fs.unlinkSync(hold); if (lock.exitCode === null) await new Promise(resolve => lock.on('exit', resolve)); assert.deepEqual(snapshot(f.target), before, 'I/O failure left modified target files'); return { exitCode: result.code, stdout: result.stdout.slice(-2200), stderr: result.stderr.slice(-2200) }; } finally { if (fs.existsSync(hold)) fs.unlinkSync(hold); if (lock.exitCode === null) lock.kill(); }
  });
  report.originalHelperUnchanged = digest(fs.readFileSync(helperPath)) === originalHelperHash;
  assert.equal(report.originalHelperUnchanged, true, 'Original helper changed during tests');
  // Every created file is reproducible fixture data. Keep only the adjacent reports and harness.
  const resolved = path.resolve(runRoot); assert.ok(resolved.startsWith(tempRoot + path.sep)); assert.equal(fs.lstatSync(resolved).isSymbolicLink(), false); fs.rmSync(resolved, { recursive: true, force: true }); report.temporaryFixtureTreeRemoved = true;
  finish(report.tests.every(x => x.pass) ? 'PASS' : 'FAIL', report.tests.every(x => x.pass) ? 0 : 1);
}
