'use strict';
// JO9 MOD START SEED_NAMESPACE_GUARD_TESTS_20261020
const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {inspectDirectory,assertRegistry}=require('./check-slave-template-ids.cjs');
const base=path.join(__dirname,'_tmp');fs.mkdirSync(base,{recursive:true});
function fixture(t){const dir=fs.mkdtempSync(path.join(base,'registry-'));t.after(()=>{const resolved=fs.realpathSync(dir);assert.ok(resolved.startsWith(fs.realpathSync(base)+path.sep));fs.rmSync(resolved,{recursive:true});});return dir;}
const put=(dir,name,obj)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(obj));

test('rejects colliding filename IDs regardless of character name or identical bytes',t=>{
 const d=fixture(t);put(d,'2579_egeya.json',{seed_name:'Egeya'});put(d,'2579_kirakira.json',{seed_name:'키라키라'});
 const r=inspectDirectory(d);assert.equal(r.valid,false);assert.equal(r.collisions.length,1);assert.equal(r.collisions[0].id,2579);assert.equal(r.collisions[0].files.length,2);
 assert.throws(()=>assertRegistry(d),/2579/);
});
test('accepts separate namespaces and original authored aliases',t=>{
 const d=fixture(t);put(d,'2579_egeya.json',{seed_name:'Egeya'});put(d,'8879_kirakira.json',{seed_name:'키라키라'});
 put(d,'2580_marselina.json',{seed_name:'Marselina',stock_id:123});put(d,'2608_marselina.json',{seed_name:'Marselina',stock_id:123});
 const r=assertRegistry(d);assert.equal(r.files,4);assert.equal(r.numericIds,4);
});
test('reports invalid JSON and invalid top-level data instead of silently skipping',t=>{
 const d=fixture(t);fs.writeFileSync(path.join(d,'211.json'),'{"fullimage":"unterminated,\n"seed_name":"x"}');put(d,'212.json',[]);
 const r=inspectDirectory(d);assert.equal(r.valid,false);assert.equal(r.issues.filter(i=>i.code==='invalid-json'||i.code==='invalid-object').length,2);
});
test('reports mismatched embedded pack ID',t=>{
 const d=fixture(t);put(d,'1160_test.json',{seed_name:'x',indpack_info:{girl_id:1161}});
 const r=inspectDirectory(d);assert.equal(r.valid,false);assert.ok(r.issues.some(i=>i.code==='embedded-id-mismatch'));
});
test('normalizes leading zero IDs for collision detection and rejects invalid filename IDs',t=>{
 const d=fixture(t);put(d,'005_name.json',{});put(d,'5.json',{});put(d,'not-an-id.json',{});put(d,'2147483648_bad.json',{});
 const r=inspectDirectory(d);assert.equal(r.collisions[0].id,5);assert.ok(r.issues.some(i=>i.code==='invalid-filename-id'));
});
test('accepts the original zero template ID',t=>{
 const d=fixture(t);put(d,'0_template.json',{seed_name:'template'});
 assert.equal(assertRegistry(d).numericIds,1);
});
test('accepts UTF8 BOM and ignores non-JSON sidecars',t=>{
 const d=fixture(t);fs.writeFileSync(path.join(d,'2579_egeya.json'),'\uFEFF{"seed_name":"Egeya"}');fs.writeFileSync(path.join(d,'notes.txt'),'text');
 assert.equal(assertRegistry(d).files,1);
});
test('release gate refuses colliding JSON even when QSP container is valid',t=>{
 const d=fixture(t),qa=require('./release-check.cjs'),core=require('../text-workshop/core.cjs');
 const game=path.join(d,'game'),slaves=path.join(game,'json/slaves');fs.mkdirSync(slaves,{recursive:true});put(slaves,'2579_egeya.json',{});put(slaves,'2579_kirakira.json',{});
 const raw=Buffer.from(['QSPGAME','','',core.shift('1',-5),core.shift('Start',-5),'',core.shift('! valid',-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
 const candidate=path.join(game,'jack.qsp');fs.writeFileSync(candidate,raw);
 const result=qa.run({candidate,'game-dir':game,profile:'static',out:path.join(d,'reports')});
 assert.equal(result.report.verdict,'FAIL');assert.equal(result.report.checks.find(c=>c.name==='slave-template-registry').status,'FAIL');
});
// JO9 MOD END SEED_NAMESPACE_GUARD_TESTS_20261020
