'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const moduleFile = path.join(__dirname, 'appearance-sharing.cjs');
const core = fs.existsSync(moduleFile) ? require(moduleFile) : null;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
function fixture(t) {
  assert.ok(core && core.create, 'common appearance resolver is not implemented');
  const root = fs.mkdtempSync(path.join(__dirname, '.fixture-'));
  t.after(() => { assert.ok(root.startsWith(__dirname + path.sep)); fs.rmSync(root, {recursive:true, force:true}); });
  const game = path.join(root, 'game');
  fs.mkdirSync(path.join(game, 'json/slaves'), {recursive:true});
  const image = ref => { const target = path.join(game, 'content/pic', ref + '.png'); fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, png); return target; };
  const json = (id, data) => { const file = path.join(game, 'json/slaves', typeof id === 'number' ? id + '_fixture.json' : id.slice(5)); fs.writeFileSync(file, JSON.stringify(data, null, 4).replace(/\n/g, '\r\n') + '\r\n'); return file; };
  image('girls/full/shared'); image('characters/title'); image('girls/full/cloth/maid'); image('girls/full/secretary/secr'); image('girls/full/mistress/dom');
  const donor = {seed_name:'Source', fullimage:'girls/full/shared', indpack_naked:'girls/full/shared', indpack_title:'characters/title', fullmade:'girls/full/cloth/maid', fullsecretary:'girls/full/secretary/secr', fullmistress:'girls/full/mistress/dom', seed_stamina:4, manual:'keep me'};
  const a = json(2580, donor), b = json(2608, {seed_name:'Peer', fullimage:'girls/full/shared', manual:'peer text', seed_stamina:2});
  return {root, game, image, json, a, b, donor, api:core.create(game)};
}
function request(api, id, peerIds) { const d=api.describe(id); return {id, peerIds, expectedHash:d.expectedHash, policyHash:d.policyHash}; }
test('missing outfit slots resolve equally without changing original JSON bytes', t => {
  const f=fixture(t), before=fs.readFileSync(f.b); const actual=f.api.resolve(2608);
  assert.equal(actual.fullmade, 'girls/full/cloth/maid'); assert.equal(actual.indpack_title, 'characters/title');
  assert.equal(actual.manual, 'peer text'); assert.equal(actual.seed_stamina, 2);
  assert.deepEqual(fs.readFileSync(f.b), before); assert.deepEqual(f.api.targets(2608), [2580,2608]);
  assert.deepEqual(f.api.describe(2608).inheritedFields, ['fullmade','fullmistress','fullsecretary','indpack_naked','indpack_title']);
});
test('explicit paths and empty aliases survive and conflicting donors are skipped', t => {
  const f=fixture(t); f.image('girls/full/cloth/own'); f.image('girls/full/mistress/other');
  f.json(2608, {fullimage:'girls/full/shared', fullmade:'girls/full/cloth/own', indpack_secr:''});
  f.json(2700, {fullimage:'girls/full/shared', fullmistress:'girls/full/mistress/other'});
  const actual=f.api.resolve(2608); assert.equal(actual.fullmade,'girls/full/cloth/own'); assert.equal(actual.indpack_secr,''); assert.ok(!('fullsecretary' in actual)); assert.ok(!('fullmistress' in actual));
  fs.unlinkSync(path.join(f.game,'content/pic/characters/title.png')); assert.ok(!('indpack_title' in core.create(f.game).resolve(2608)));
});
test('materialize adds only inherited image fields and preserves untouched formatting', t => {
  const f=fixture(t), before=fs.readFileSync(f.a); const out=f.api.materialize([2608]);
  assert.deepEqual(out.changedIds,[2608]); assert.deepEqual(fs.readFileSync(f.a),before);
  const text=fs.readFileSync(f.b,'utf8'); assert.ok(text.includes('    "manual": "peer text",\r\n    "seed_stamina": 2'));
  assert.equal(JSON.parse(text).fullsecretary,'girls/full/secretary/secr');
});
test('detach copies shared PNGs, preserves originals, and stops automatic rejoining', t => {
  const f=fixture(t), beforeA=fs.readFileSync(f.a), original=fs.readFileSync(path.join(f.game,'content/pic/girls/full/shared.png'));
  const req=request(f.api,2608,[]), plan=f.api.preview(req);
  assert.equal(plan.copyCount,5); assert.ok(plan.copyBytes>0); assert.deepEqual(fs.readFileSync(f.a),beforeA);
  const saved=f.api.apply({...req,planHash:plan.planHash}); assert.deepEqual(saved.changedIds,[2608]);
  assert.deepEqual(f.api.targets(2608),[2608]); assert.deepEqual(f.api.targets(2580),[2580]);
  assert.deepEqual(fs.readFileSync(f.a),beforeA); assert.deepEqual(fs.readFileSync(path.join(f.game,'content/pic/girls/full/shared.png')),original);
  const own=JSON.parse(fs.readFileSync(f.b)); assert.match(own.fullmade,/^girls\/full\/cloth\/2608_/); assert.match(own.indpack_title,/^characters\/2608_/);
  const again=core.create(f.game); assert.deepEqual(again.targets(2608),[2608]); assert.equal(again.describe(2608).candidates.find(x=>x.id===2580).checked,false);
  const join=request(again,2608,[2580]), joined=again.preview(join); again.apply({...join,planHash:joined.planHash});
  assert.deepEqual(again.targets(2580),[2580,2608]); assert.equal(JSON.parse(fs.readFileSync(f.a)).fullmade,own.fullmade);
});
test('sharing joins chosen peers using current appearance and preserves non-image data', t => {
  const f=fixture(t); f.image('girls/full/cloth/own'); f.json(2608,{fullimage:'girls/full/shared',fullmade:'girls/full/cloth/own',manual:'peer text',seed_stamina:2});
  const req=request(f.api,2608,[2580]), p=f.api.preview(req); assert.equal(p.copyCount,0);
  f.api.apply({...req,planHash:p.planHash}); assert.equal(JSON.parse(fs.readFileSync(f.a)).fullmade,'girls/full/cloth/own'); assert.equal(JSON.parse(fs.readFileSync(f.a)).seed_stamina,4);
});
test('apply rejects stale peer JSON, policy, and copy sources without writing', t => {
  const f=fixture(t), req=request(f.api,2608,[]), p=f.api.preview(req), before=fs.readFileSync(f.b);
  f.json(2580,{...f.donor,manual:'changed'}); assert.throws(()=>f.api.apply({...req,planHash:p.planHash}),/changed|stale|변경/); assert.deepEqual(fs.readFileSync(f.b),before);
  const req2=request(f.api,2608,[]), p2=f.api.preview(req2); fs.appendFileSync(path.join(f.game,'content/pic/girls/full/shared.png'),Buffer.from('changed'));
  assert.throws(()=>f.api.apply({...req2,planHash:p2.planHash}),/changed|stale|변경/); assert.deepEqual(fs.readFileSync(f.b),before);
});
test('numeric, json filename identities and Pelageya defaults are supported', t => {
  const f=fixture(t); f.json('json:custom.json',{fullimage:'girls/full/shared',seed_name:'Named'});
  assert.ok(f.api.targets('json:custom.json').includes(2580));
  f.json(2577,{fullimage:'girls/full/shared'}); f.image('girls/full/other'); f.json(2585,{fullimage:'girls/full/other'}); f.json(2607,{fullimage:'girls/full/other'});
  const refreshed=core.create(f.game); assert.ok(refreshed.targets(2577).includes(2585)); assert.ok(refreshed.targets(2607).includes(2577));
});
test('CLI resolve returns the same effective JSON as the module', t => {
  const f=fixture(t); const run=cp.spawnSync(process.execPath,[moduleFile],{input:JSON.stringify({game:f.game,action:'resolve',id:2608}),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr); assert.deepEqual(JSON.parse(run.stdout),f.api.resolve(2608));
});
test('outside and symlink image paths cannot become inherited or copied', t => {
  const f=fixture(t); f.json(2580,{...f.donor,fullmade:'../outside',fullsecretary:'girls/full/secretary/link'});
  const outside=path.join(f.root,'outside.png'); fs.writeFileSync(outside,png);
  let linked=false; try { fs.symlinkSync(outside,path.join(f.game,'content/pic/girls/full/secretary/link.png'),'file'); linked=true; } catch(e) { if(!['EPERM','EACCES'].includes(e.code))throw e; }
  const result=f.api.resolve(2608); assert.ok(!('fullmade' in result)); if(linked)assert.ok(!('fullsecretary' in result));
});
test('failed policy installation rolls back JSONs, copies and the absent policy', t => {
  const f=fixture(t), beforeA=fs.readFileSync(f.a), beforeB=fs.readFileSync(f.b), req=request(f.api,2608,[]), plan=f.api.preview(req);
  const originalRename=fs.renameSync; let failed=false;
  fs.renameSync=function(from,to){originalRename.call(fs,from,to);if(!failed&&String(to).endsWith('character-image-sharing.json')){failed=true;throw Error('simulated disk failure');}};
  try { assert.throws(()=>f.api.apply({...req,planHash:plan.planHash}),/simulated disk failure/); } finally { fs.renameSync=originalRename; }
  assert.deepEqual(fs.readFileSync(f.a),beforeA); assert.deepEqual(fs.readFileSync(f.b),beforeB);
  assert.ok(!fs.existsSync(path.join(f.game,'modtools/character-image-sharing.json')));
  for(const copy of plan.copies)assert.ok(!fs.existsSync(path.join(f.game,'content/pic',copy.to)));
});
test('rollback preserves an external JSON edit and reports the conflicting file', t => {
  const f=fixture(t), req=request(f.api,2608,[]), plan=f.api.preview(req), manual=Buffer.from('{"manual":"concurrent edit"}\n');
  const originalRename=fs.renameSync; let failed=false;
  fs.renameSync=function(from,to){originalRename.call(fs,from,to);if(!failed&&String(to).endsWith('character-image-sharing.json')){failed=true;fs.writeFileSync(f.b,manual);throw Error('simulated failure after manual edit');}};
  try { assert.throws(()=>f.api.apply({...req,planHash:plan.planHash}),error=>/rollback conflict/i.test(error.message)&&error.message.includes('2608_fixture.json')); } finally { fs.renameSync=originalRename; }
  assert.deepEqual(fs.readFileSync(f.b),manual);
});
test('a policy edit invalidates a prior preview and pending override values remain authoritative', t => {
  const f=fixture(t); const pending={fullimage:'girls/full/shared',fullsecretary:'',manual:'unsaved'};
  const value=f.api.resolve(2608,pending); assert.equal(value.fullsecretary,''); assert.equal(value.manual,'unsaved'); assert.equal(value.fullmade,'girls/full/cloth/maid');
  const req=request(f.api,2608,[]), plan=f.api.preview(req); fs.mkdirSync(path.join(f.game,'modtools'),{recursive:true}); fs.writeFileSync(path.join(f.game,'modtools/character-image-sharing.json'),JSON.stringify({version:1,groups:[[2608],[2580]],families:[[2580,2608]]}));
  assert.throws(()=>f.api.apply({...req,planHash:plan.planHash}),/policy changed/);
});
