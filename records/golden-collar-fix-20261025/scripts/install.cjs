'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),zlib=require('zlib'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-golden-collar-fix-20261025',rec=repo+'/records/golden-collar-fix-20261025';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const patch=read(tmp+'/mods/2026-10-25_golden_collar_refusal_return.json'),last=read(tmp+'/mods/2026-10-25_golden_collar_scope_preserve.json');
const releaseRoot='G:/Codex/tmp/jo9-gc-release-20261025';
const releasePath=fs.readdirSync(releaseRoot).map(n=>releaseRoot+'/'+n+'/report.json').filter(p=>fs.existsSync(p)).find(p=>{const r=read(p);return r.verdict==='PASS'&&JSON.stringify(r).includes(last.after_sha256);});a(releasePath,'Final candidate release PASS');
const release=read(releasePath),ui=read(tmp+'/ui-load/report.json'),native=read(tmp+'/native-fixtures/results.json');
a.equal(release.verdict,'PASS');a.equal(ui.status,'PASS');a(native.results.length===86&&native.results.every(x=>x.pass));
a.equal(ui.candidate,last.after_sha256);a.equal(native.candidate.sha256,last.after_sha256);
const bytes=fs.readFileSync(tmp+'/candidate.qsp');a.equal(c.hash(bytes),last.after_sha256);a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),last.before_sha256);a.equal(c.hash(zlib.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),patch.before_sha256);
const inputs=read(rec+'/inputs.json');for(const f of inputs)a.equal(c.hash(fs.readFileSync(f.path)),f.sha256,'Protected file changed '+f.path);
// Record additional unchanged CSS inputs before this QSP-only installation.
for(const n of fs.readdirSync(game+'/css')){const p=game+'/css/'+n;if(fs.statSync(p).isFile()&&!inputs.some(f=>f.path===p))inputs.push({path:p,sha256:c.hash(fs.readFileSync(p))});}
fs.writeFileSync(rec+'/inputs.json',JSON.stringify(inputs,null,2)+'\n');
const beforeFiles=new Set(fs.readdirSync(game));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:1000000});
fs.writeFileSync(rec+'/install.log',run.stdout+'\n'+run.stderr);a.equal(run.status,0,'Installer');
a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),last.after_sha256);qa.inspectWorld(fs.readFileSync(game+'/jack.qsp'));
for(const f of inputs)a.equal(c.hash(fs.readFileSync(f.path)),f.sha256,'Protected file changed '+f.path);
const previous=read(rec+'/installed.json'),made=[...previous.newGameFolderFiles,...fs.readdirSync(game).filter(n=>!beforeFiles.has(n))];
fs.writeFileSync(rec+'/installed.json',JSON.stringify({status:'APPLIED_WORK_ONLY',before:patch.before_sha256,intermediate:last.before_sha256,after:last.after_sha256,protectedFiles:inputs.length,saveFiles:inputs.filter(f=>f.path.startsWith(game+'/save/')).length,unchangedProtectedFiles:true,newGameFolderFiles:made,officialRelease:'PASS',releasePath,nativeAutomatic:86,nativeUiLoad:6,otherRolesPreserved:3,noCommit:true,noPush:true,noFullSync:true},null,2)+'\n');
console.log(fs.readFileSync(rec+'/installed.json','utf8'));
