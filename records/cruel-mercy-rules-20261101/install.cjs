'use strict';
const fs=require('fs'),cp=require('child_process'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',T='G:/Codex/tmp/cruel-mercy-rules-20261101',record=R+'/records/cruel-mercy-rules-20261101',backup='G:/somi/JO9_work_backups/cruel-mercy-rules-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),meta=JSON.parse(fs.readFileSync(T+'/prepared.json')),release=JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'')),evidence=JSON.parse(fs.readFileSync(__dirname+'/evidence-correlation.json'));
a.equal(release.verdict,'PASS');const verifiedRebase=process.argv.includes('--verified-dialogue-rebase');
if(!verifiedRebase)a.equal(release.checks[0].detail.candidate,meta.after);
a.equal(release.checks.find(x=>x.name==='installed-client-smoke').detail.passed,9);a.equal(evidence.pass,true);a.equal(evidence.candidate,meta.after);
if(verifiedRebase){const delta=JSON.parse(fs.readFileSync(__dirname+'/concurrent-user-edits.json'));a.equal(delta.current,meta.before);a(delta.changes.every(x=>x.location==='interaction_city'&&x.removed===1&&x.added===1&&x.old[0].trimStart().startsWith('$sp_text[10385] =')&&x.new[0].trimStart().startsWith('$sp_text[10385] =')),'only verified unrelated authored dialogue may use this route');}
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),meta.before,'WORK changed; merge before install');
const protectedFiles=[W+'/css/base.css',F+'/jack.qsp',F+'/css/base.css',...['core.cjs','scenes.cjs','flow.cjs','index.html','server.cjs'].map(n=>W+'/modtools/text-workshop/'+n)];
const protectedHashes=protectedFiles.map(path=>({path,sha256:c.hash(fs.readFileSync(path))}));
fs.mkdirSync(record,{recursive:true});fs.mkdirSync(backup,{recursive:true});const before=fs.readFileSync(T+'/before.qsp'),gzip=z.gzipSync(before,{level:9});a(z.gunzipSync(gzip).equals(before));fs.writeFileSync(backup+'/before.qsp.gz',gzip);
for(const n of fs.readdirSync(__dirname))if(/\.(cjs|json|md|txt)$/.test(n))fs.copyFileSync(__dirname+'/'+n,record+'/'+n);
fs.copyFileSync(T+'/prepared.json',record+'/prepared.json');fs.copyFileSync(process.argv[2],record+'/release-report.json');
const mod='2026-11-01_cruel_mercy_rules.json';a(!fs.existsSync(R+'/mods/'+mod));fs.copyFileSync(T+'/mods/'+mod,R+'/mods/'+mod);
// Final compare immediately before the supported patch writer.
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),meta.before,'WORK changed during record preparation');
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',W+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8',windowsHide:true});fs.writeFileSync(record+'/install.log',(run.stdout||'')+(run.stderr||''));a.equal(run.status,0,'apply failed');
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),meta.after);for(const x of protectedHashes)a.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'unintended change '+x.path);
fs.writeFileSync(record+'/installed.json',JSON.stringify({...meta,backup,protectedHashes,installed:true,releaseVerdict:verifiedRebase?'PENDING_FINAL_EXACT_HASH_RECHECK':release.verdict,preflightCandidate:release.checks[0].detail.candidate,mandatoryNativePaths:9,commit:false,push:false,distributionModified:false},null,2)+'\n');console.log(JSON.stringify({installed:true,qsp:meta.after,record,protectedInputsUnchanged:protectedHashes.length}));
