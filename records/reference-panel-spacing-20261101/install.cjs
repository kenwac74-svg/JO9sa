'use strict';
const fs=require('fs'),z=require('zlib'),cp=require('child_process'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/reference-panel-layout-20261101';
const c=require(repo+'/tools/text-workshop/core.cjs');
const report=repo+'/records/reference-panel-spacing-20261101',backup='G:/somi/JO9_work_backups/reference-panel-spacing-20261101';
const coverage=JSON.parse(fs.readFileSync(tmp+'/coverage.json')),patch=JSON.parse(fs.readFileSync(tmp+'/mods/2026-11-01_reference_panel_spacing.json'));
const releasePath=process.argv[2];if(!releasePath)throw Error('release report required');
const release=JSON.parse(fs.readFileSync(releasePath,'utf8').replace(/^\uFEFF/,''));
if(release.verdict!=='PASS')throw Error('release gate not PASS');
const native=JSON.parse(fs.readFileSync(__dirname+'/green-report.json'));
if(!native.nativeCompleted||native.sourceSha256!==coverage.candidateSha)throw Error('native candidate not current');
for(const x of native.results){
 assert.equal(x.payload.header.reference,null,x.name+' unexpected label');
 assert.equal(x.payload.body.firstActual.firstChar.top,206,x.name+' text position');
 assert.equal(x.payload.body.fontSize,'20px');
 assert.equal(x.payload.body.lineHeight,'25px');
 assert.equal(x.payload.body.textFits,true,x.name+' fit');
}
const expected={qsp:coverage.baselineSha,css:coverage.baseCssBefore};
assert.equal(c.hash(fs.readFileSync(work+'/jack.qsp')),expected.qsp,'WORK changed; regenerate/revalidate');
assert.equal(c.hash(fs.readFileSync(work+'/css/base.css')),expected.css,'WORK CSS changed');
assert.equal(c.hash(fs.readFileSync(repo+'/assets/css-2.4/base.css')),expected.css,'tracked CSS differs; merge first');
const full='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',fullBefore={qsp:c.hash(fs.readFileSync(full+'/jack.qsp')),css:c.hash(fs.readFileSync(full+'/css/base.css'))};
fs.mkdirSync(report,{recursive:true});fs.mkdirSync(backup,{recursive:true});
for(const [name,file] of [['before.qsp',tmp+'/before.qsp'],['base.css',work+'/css/base.css']]){
 const raw=fs.readFileSync(file),gz=z.gzipSync(raw,{level:9});assert(z.gunzipSync(gz).equals(raw));
 fs.writeFileSync(backup+'/'+name+'.gz',gz);
}
const patchPath=repo+'/mods/'+patch.id+'.json';if(fs.existsSync(patchPath))throw Error('patch exists; inspect first');
fs.copyFileSync(tmp+'/mods/'+patch.id+'.json',patchPath);
for(const file of ['coverage.json'])fs.copyFileSync(tmp+'/'+file,report+'/'+file);
for(const file of ['build.cjs','probe.cjs','install.cjs','REPORT_KO.md','MANUAL_KO.md','baseline-measurements.json','baseline-report.json','baseline-extras-report.json','green-report.json','independent-native-summary.json','source-audit.json']){
 if(!fs.existsSync(__dirname+'/'+file))throw Error('missing record '+file);
 fs.copyFileSync(__dirname+'/'+file,report+'/'+file);
}
fs.copyFileSync(releasePath,report+'/release-report.json');
const pre={before:coverage.baselineSha,after:coverage.candidateSha,baseCssBefore:coverage.baseCssBefore,baseCssAfter:coverage.baseCssAfter,backup,fullBefore,newLocation:'jo9_reference_panel',newSaveFields:0};
fs.writeFileSync(report+'/prepared.json',JSON.stringify(pre,null,2)+'\n');
// Only the approved, pinned patch is passed to the patcher; no replay of historical mods.
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true});
fs.writeFileSync(report+'/install.log',(run.stdout||'')+(run.stderr||''));
if(run.status!==0)throw Error('apply_mods failed; CSS untouched');
assert.equal(c.hash(fs.readFileSync(work+'/jack.qsp')),coverage.candidateSha,'installed QSP differs');
const css=fs.readFileSync(tmp+'/css/base.css');
fs.writeFileSync(work+'/css/base.css',css);fs.writeFileSync(repo+'/assets/css-2.4/base.css',css);
assert.equal(c.hash(fs.readFileSync(work+'/css/base.css')),coverage.baseCssAfter);
assert.equal(c.hash(fs.readFileSync(repo+'/assets/css-2.4/base.css')),coverage.baseCssAfter);
const manifestPath=repo+'/assets/css-2.4/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^\uFEFF/,''));
manifest.files['base.css']=coverage.baseCssAfter;
manifest.updates.push({id:patch.id,scope:'WORK QSP/CSS and tracked patch/CSS source only; Full remains manual',playQsp:coverage.candidateSha,baseCssBefore:coverage.baseCssBefore,baseCssAfter:coverage.baseCssAfter,report:'records/reference-panel-spacing-20261101/REPORT_KO.md'});
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const fullAfter={qsp:c.hash(fs.readFileSync(full+'/jack.qsp')),css:c.hash(fs.readFileSync(full+'/css/base.css'))};assert.deepEqual(fullAfter,fullBefore,'Full changed');
fs.writeFileSync(report+'/installed.json',JSON.stringify({...pre,fullAfter,installed:true,releaseVerdict:release.verdict,nativeCases:native.results.length},null,2)+'\n');
console.log(JSON.stringify({installed:true,qsp:coverage.candidateSha,css:coverage.baseCssAfter,report,backup,fullUnchanged:true}));
