'use strict';
// JO9 UI resources + battle typography. Run only after both native reports pass.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const rec=repo+'/records/ui-live-consolidation-20261027',tmp='G:/Codex/tmp/ui-live-consolidation-20261027';
const core=require(repo+'/tools/text-workshop/core.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=p=>core.hash(fs.readFileSync(p));
const migration=read(rec+'/migration-candidate.json'),font=read(rec+'/font-candidate.json');
const official=read(tmp+'/official/run-FDK3nS/report.json'),focused=read(rec+'/battle-font-native-results.json');
assert.equal(official.verdict,'PASS');assert.equal(official.checks.find(x=>x.name==='inputs-readable').detail.candidate,font.qspAfter);
assert.equal(focused.status,'PASS');assert.equal(focused.cases,6);assert.equal(focused.hashes.qsp,font.qspAfter);
assert.equal(focused.hashes.css['base.css'],font.cssAfter);
assert.equal(hash(work+'/jack.qsp'),migration.qspBefore,'WORK QSP changed after preparation');
assert.equal(hash(migration.backup+'/jack.qsp'),migration.qspBefore,'QSP backup mismatch');
const rows=migration.changedFiles.map(x=>({...x,after:x.path==='css/base.css'?font.cssAfter:x.after}));
const source=p=>repo+'/'+(p.startsWith('css/')?'assets/css-2.4/'+p.slice(4):'assets/'+p);
for(const row of rows){
 assert.equal(hash(work+'/'+row.path),row.before,'WORK changed: '+row.path);
 assert.equal(hash(source(row.path)),row.before,'Tracked source changed: '+row.path);
 assert.equal(hash(migration.backup+'/'+row.path),row.before,'Backup mismatch: '+row.path);
 assert.equal(hash(tmp+'/candidate/'+row.path),row.after,'Candidate mismatch: '+row.path);
}
const newJs='content/js/jo9_battle_log.js';
assert(!fs.existsSync(work+'/'+newJs),'New runtime JS already exists');assert(!fs.existsSync(source(newJs)),'New source JS already exists');
assert.equal(hash(tmp+'/candidate/'+newJs),font.jsAfter);
assert.equal(hash(tmp+'/candidate/jack.qsp'),font.qspAfter);
const journal={status:'ready',createdAt:new Date().toISOString(),work,backup:migration.backup,qspBefore:migration.qspBefore,qspAfter:font.qspAfter,files:rows,newFiles:[newJs],steps:[]};
const journalFile=rec+'/installation.json',write=()=>fs.writeFileSync(journalFile,JSON.stringify(journal,null,2)+'\n');write();
function atomicCopy(from,to){const temp=to+'.jo9-ui-stage';assert(!fs.existsSync(temp));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,temp);assert.equal(hash(temp),hash(from));fs.renameSync(temp,to);assert.equal(hash(to),hash(from));}
// Existing baseline backup is outside the game; apply only the two task patches.
const apply=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:2*1024*1024});
fs.writeFileSync(rec+'/installation-apply.log',apply.stdout+'\n'+apply.stderr);
assert.equal(apply.status,0,'Patch application failed; inspect installation-apply.log');assert.equal(hash(work+'/jack.qsp'),font.qspAfter);journal.steps.push('QSP patches applied');write();
for(const row of rows){atomicCopy(tmp+'/candidate/'+row.path,work+'/'+row.path);atomicCopy(tmp+'/candidate/'+row.path,source(row.path));journal.steps.push(row.path);write();}
atomicCopy(tmp+'/candidate/'+newJs,work+'/'+newJs);atomicCopy(tmp+'/candidate/'+newJs,source(newJs));journal.steps.push(newJs);write();
journal.status='complete';journal.completedAt=new Date().toISOString();journal.actualQsp=hash(work+'/jack.qsp');write();
fs.copyFileSync(__filename,rec+'/scripts/install-final.cjs');
console.log(JSON.stringify({status:journal.status,qsp:journal.actualQsp,files:rows.length+1,backup:migration.backup}));
