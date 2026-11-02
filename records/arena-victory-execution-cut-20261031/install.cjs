'use strict';
const fs=require('fs'),cp=require('child_process'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full',T='G:/Codex/tmp/arena-victory-execution-cut-20261031',REC=R+'/records/arena-victory-execution-cut-20261031',c=require(R+'/tools/text-workshop/core.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const p=j(__dirname+'/prepared.json'),native=j(__dirname+'/native-report.json');
a.equal(native.pass,true);a.equal(native.candidate,p.after);a.equal(native.client.length,6);
for(const g of [W,F+'/game'])a.equal(hash(g+'/jack.qsp'),p.before);
a.equal(hash(p.backup+'/before.qsp'),p.before);a.equal(hash(p.candidate),p.after);
for(const target of p.targets)a.equal(hash(target),p.imageSha);a.equal(hash(p.source),p.imageSha);
const mf=j(F+'/BUILD_MANIFEST.json'),protectedFiles=[...mf.testSaves,...mf.files.filter(x=>/game\/content\/pic\/scene\/(coldef[123]|practice_(master|slave)_(win|loss))\.png$/.test(x.path))].map(x=>({path:F+'/'+x.path,sha256:x.sha256}));
for(const row of protectedFiles)a.equal(hash(row.path),row.sha256);
const candidate=c.parse(fs.readFileSync(p.candidate)),baseline=c.parse(fs.readFileSync(p.backup+'/before.qsp')),mod=j(T+'/mods/'+p.id+'.json');
const restored=c.parse(fs.readFileSync(p.candidate));
for(const edit of [...mod.edits].reverse()){const loc=restored.locations.find(x=>x.name===edit.location),body=c.shift(restored.lines[loc.body],5);a.equal(body.split(edit.new).length,2);restored.lines[loc.body]=c.shift(body.replace(edit.new,edit.old),-5);}
a.deepEqual(c.serialize(restored),fs.readFileSync(p.backup+'/before.qsp'));a.equal(candidate.locations.length,baseline.locations.length);
const appliedBackups=[];for(const g of [W,F+'/game']){const old=fs.readdirSync(g).filter(n=>n.startsWith('jack.qsp.bak_'));const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',g+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8',windowsHide:true,timeout:30000});a.equal(r.status,0,(r.stdout||'')+(r.stderr||''));a.equal(hash(g+'/jack.qsp'),p.after);appliedBackups.push(...fs.readdirSync(g).filter(n=>n.startsWith('jack.qsp.bak_')&&!old.includes(n)).map(n=>g+'/'+n));}
for(const row of protectedFiles)a.equal(hash(row.path),row.sha256);
fs.mkdirSync(REC,{recursive:true});for(const n of fs.readdirSync(__dirname))if(fs.statSync(__dirname+'/'+n).isFile())fs.copyFileSync(__dirname+'/'+n,REC+'/'+n);
a(!fs.existsSync(R+'/mods/'+p.id+'.json'));fs.copyFileSync(T+'/mods/'+p.id+'.json',R+'/mods/'+p.id+'.json');
const v={status:'INSTALLED_AWAITING_RELEASE',before:p.before,after:p.after,backup:p.backup,relative:p.relative,imageSha:p.imageSha,imageBytes:p.bytes,source:p.source,targets:p.targets,changedLocations:['interaction_city','jo9_battle_fate'],edits:3,newPersistentFields:0,numericEffectsUnchanged:true,nativePaths:6,protectedFiles,appliedBackups,workFullEqual:true,zip:false,commit:false,push:false};fs.writeFileSync(REC+'/verification.json',JSON.stringify(v,null,2)+'\n');console.log(JSON.stringify({installed:true,qsp:p.after,image:p.relative,nativePaths:6}));
