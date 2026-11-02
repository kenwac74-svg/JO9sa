'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',B='G:/Codex/tmp/image-cut-conditions-build-v2-20261101',D=R+'/records/image-cut-conditions-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const mod=JSON.parse(fs.readFileSync(B+'/mods/2026-11-01_image_cut_conditions_core.json','utf8'));
const current=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(current),mod.before_sha256,'WORK changed after candidate verification; stop without overwriting');
const serverBefore='5a33f5ec648c6b9e9a9de145c24883cfbe1518628160934c3a4e7acec0b66f39';
for(const file of [R+'/tools/text-workshop/server.cjs',W+'/modtools/text-workshop/server.cjs'])a.equal(c.hash(fs.readFileSync(file)),serverBefore,'Server changed since staging: '+file);
const fullBefore=c.hash(fs.readFileSync(F+'/jack.qsp')),catalogBefore=c.hash(fs.readFileSync(W+'/modtools/catalog/catalog_cuts.js'));
fs.mkdirSync(D,{recursive:true});a(!fs.existsSync(D+'/before.qsp.gz'),'Recovery archive already exists');
const zipped=z.gzipSync(current);a(z.gunzipSync(zipped).equals(current));fs.writeFileSync(D+'/before.qsp.gz',zipped);fs.copyFileSync(R+'/tools/text-workshop/server.cjs',D+'/server.before.cjs');
const applied=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',W+'/jack.qsp','-ModsDir',B+'/mods'],{encoding:'utf8',windowsHide:true,timeout:120000});
fs.writeFileSync(D+'/apply.log',(applied.stdout||'')+(applied.stderr||''));a.equal(applied.status,0,'apply_mods failed; see apply.log');
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),mod.after_sha256);qa.inspectWorld(fs.readFileSync(W+'/jack.qsp'));
const deployed=[];
for(const name of ['server.cjs','image-cut-conditions.cjs','image-cut-condition-rules.cjs','catalog-cut-conditions.js']){
 const raw=fs.readFileSync(__dirname+'/'+name);for(const dir of [R+'/tools/text-workshop',W+'/modtools/text-workshop']){fs.writeFileSync(dir+'/'+name,raw);a(fs.readFileSync(dir+'/'+name).equals(raw));deployed.push({path:dir+'/'+name,sha256:c.hash(raw)});}
 const syntax=cp.spawnSync(process.execPath,['--check',R+'/tools/text-workshop/'+name],{encoding:'utf8',windowsHide:true});a.equal(syntax.status,0,syntax.stderr);
}
for(const name of ['image-cut-condition-rules.test.cjs','image-cut-conditions.test.cjs','catalog-cut-conditions.test.cjs'])fs.copyFileSync(__dirname+'/'+name,R+'/tools/text-workshop/'+name);
fs.copyFileSync(B+'/mods/'+mod.id+'.json',R+'/mods/'+mod.id+'.json');
a.equal(c.hash(fs.readFileSync(F+'/jack.qsp')),fullBefore,'Full must remain unchanged in this feature task');a.equal(c.hash(fs.readFileSync(W+'/modtools/catalog/catalog_cuts.js')),catalogBefore,'Existing cut editor must remain unchanged');
fs.writeFileSync(__dirname+'/installed.json',JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,record:D,deployed,fullUnchanged:fullBefore,existingCutEditorUnchanged:catalogBefore,world:qa.inspectWorld(fs.readFileSync(W+'/jack.qsp'))},null,2));
console.log(JSON.stringify({installed:true,qsp:mod.after_sha256,fullUnchanged:true,files:deployed.length}));
