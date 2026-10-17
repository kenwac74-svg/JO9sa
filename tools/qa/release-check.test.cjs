'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('../text-workshop/core.cjs');
const target=path.join(__dirname,'release-check.cjs');
const qa=fs.existsSync(target)?require(target):{};
function fixture(entries){return Buffer.from(['QSPGAME','','',core.shift(String(entries.length),-5),...entries.flatMap(([name,body])=>[core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5)]),''].join('\r\n'),'utf16le');}
test('accepts byte-preserving world; rejects case-insensitive duplicate location names',()=>{
 assert.equal(typeof qa.inspectWorld,'function');
 assert.equal(qa.inspectWorld(fixture([['Start','msg 1']])).locations,1);
 assert.throws(()=>qa.inspectWorld(fixture([['Start',''],['START','']])),/duplicate/i);
});
test('rejects split CRLF at a comment/END boundary and malformed/truncated containers',()=>{
 assert.equal(typeof qa.inspectWorld,'function');
 assert.throws(()=>qa.inspectWorld(fixture([['Start','if a:\r\n! marker\nend']])),/line ending/i);
 assert.throws(()=>qa.inspectWorld(fixture([['Start','']]).subarray(0,15)));
});
test('checks location action scripts as well as main bodies',()=>{
 const d=core.parse(fixture([['Start','! main']]));
 d.lines[7]=core.shift('1',-5);
 d.lines.splice(8,0,'',core.shift('action',-5),core.shift('! marker\nend',-5));
 assert.throws(()=>qa.inspectWorld(core.serialize(d)),/line ending/i);
});
test('release cannot pass when a required check was skipped; static is labelled separately',()=>{
 assert.equal(typeof qa.verdict,'function');
 const checks=[{status:'PASS',required:true},{status:'SKIP',required:true}];
 assert.equal(qa.verdict(checks,'release'),'INCOMPLETE');
 assert.equal(qa.verdict([{status:'FAIL',required:true}],'release'),'FAIL');
 assert.equal(qa.verdict([{status:'PASS',required:true}],'static'),'STATIC_PASS');
});
test('patch validation rejects empty replacement searches and wrong pinned hashes',()=>{
 assert.equal(typeof qa.validatePatchSet,'function');
 const h='a'.repeat(64),p={id:'one',before_sha256:h,after_sha256:h,edits:[{location:'Start',field:'body',old:'one',new:'two',count:1}]};
 assert.doesNotThrow(()=>qa.validatePatchSet([p],h,h));
 assert.throws(()=>qa.validatePatchSet([{...p,edits:[{...p.edits[0],old:''}]}],h,h),/old/i);
 assert.throws(()=>qa.validatePatchSet([p],'b'.repeat(64),h),/baseline/i);
 assert.throws(()=>qa.validatePatchSet([p],h,'b'.repeat(64)),/candidate/i);
});
test('save primer omits callbacks, multiline cached code and interpolation; disables autosaves',()=>{
 assert.equal(typeof qa.primeState,'function');
 const doc={vars:[{name:'SLAVE_STATE',idx:[],values:[['1','']]},{name:'ONNEWLOC',idx:[],values:[['0','danger']]},{name:'CACHED',idx:[],values:[['0','if a:\r\nend']]},{name:'TEXT',idx:[],values:[['0','<<dynamic>>']]},{name:'NAME',idx:[],values:[['0',"O'Brien"]]}]};
 const p=qa.primeState(doc);assert.match(p.code,/SLAVE_STATE\[0\]=1/);assert.match(p.code,/O''Brien/);
 assert.doesNotMatch(p.code,/danger|if a|dynamic/);assert.match(p.code,/autosave=0/);
 assert.equal(p.code.replace(/\r\n/g,'').includes('\n'),false);
});
test('smoke fixtures retain the candidate lifecycle bodies, use unique markers and assert cache reset',()=>{
 assert.equal(typeof qa.buildSmoke,'function');
 const raw=fixture(['Start','main_screen','end_day_screen','menu_form','refresh_database','init_game','start_game','next_day','$newloc','interaction_city','interaction_screen_city','начать_бой','боевое_меню','боевой_интерфейс'].map(n=>[n,'! original']));
 const probes=qa.buildSmoke(raw,'slave_state=1\r\nassistant_state=1',2,'ABC123');
 assert.equal(probes.length,9);assert.equal(new Set(probes.map(p=>p.marker)).size,9);
 for(const p of probes){const d=core.parse(p.raw);assert.deepEqual(core.serialize(d),p.raw);qa.inspectWorld(p.raw);}
 const cache=core.parse(probes.find(p=>p.name==='cache').raw);
 const body=core.shift(cache.lines[cache.locations.find(l=>l.name==='main_screen').body],5);
 assert.match(body,/jo9_traits_revision=2/);assert.match(body,/code_defined\['interaction_result_make_slave_do'\]=0/);
 const start=core.shift(cache.lines[cache.locations.find(l=>l.name==='Start').body],5);
 assert.match(start,/jo9_traits_revision=1/);
 assert.throws(()=>qa.buildSmoke(raw,'',NaN,'ABC123'),/revision/i);
});
test('output isolation rejects the game directory and its descendants',()=>{
 assert.equal(typeof qa.assertOutside,'function');
 const tmp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'jo9-path-test-'));
 const game=path.join(tmp,'game');fs.mkdirSync(game);
 assert.throws(()=>qa.assertOutside(game,[game]),/outside/i);
 assert.throws(()=>qa.assertOutside(path.join(game,'qa'),[game]),/outside/i);
 assert.doesNotThrow(()=>qa.assertOutside(path.join(tmp,'reports'),[game]));
 fs.rmSync(tmp,{recursive:true});
});
test('patch applicator rejects a newly split CRLF before writing the QSP or backup',{skip:process.platform!=='win32'},()=>{
 const tmp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'jo9-patch-guard-'));
 const qsp=path.join(tmp,'world.qsp'),mods=path.join(tmp,'mods');fs.mkdirSync(mods);
 const before=fixture([['Start','! marker\r\nend']]);fs.writeFileSync(qsp,before);
 fs.writeFileSync(path.join(mods,'one.json'),JSON.stringify({id:'split-boundary',edits:[{location:'Start',field:'body',old:'! marker\r\nend',new:'! marker\nend',count:1}]}));
 const r=require('node:child_process').spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.resolve(__dirname,'../apply_mods.ps1'),'-Qsp',qsp,'-ModsDir',mods],{encoding:'utf8',windowsHide:true,timeout:20000});
 assert.ifError(r.error);assert.notEqual(r.status,0,'A corrupt newline must be rejected');
 assert.deepEqual(fs.readFileSync(qsp),before);assert.equal(fs.readdirSync(tmp).some(n=>n.includes('.bak_')),false);
 fs.rmSync(tmp,{recursive:true});
});
test('CLI exit codes distinguish static pass, missing release checks and corrupt files',()=>{
 const tmp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'jo9-cli-test-'));
 const input=path.join(tmp,'input');fs.mkdirSync(input);const qsp=path.join(input,'world.qsp');
 fs.writeFileSync(qsp,fixture([['Start','! valid']]));
 const invoke=args=>require('node:child_process').spawnSync(process.execPath,[target,'--candidate',qsp,'--out',path.join(tmp,'reports'),...args],{encoding:'utf8',windowsHide:true,timeout:20000});
 const statics=invoke(['--profile','static']);assert.ifError(statics.error);assert.equal(statics.status,0);assert.match(statics.stdout,/STATIC_PASS/);
 const incomplete=invoke([]);assert.ifError(incomplete.error);assert.equal(incomplete.status,2);assert.match(incomplete.stdout,/INCOMPLETE/);
 fs.writeFileSync(qsp,fixture([['Start','! invalid\nend']]));
 const corrupt=invoke([]);assert.ifError(corrupt.error);assert.equal(corrupt.status,1);assert.match(corrupt.stdout,/Invalid line endings/);
 fs.rmSync(tmp,{recursive:true});
});
