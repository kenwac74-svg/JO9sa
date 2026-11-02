'use strict';
const fs=require('fs'),cp=require('child_process'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/mob-sets-20261028',out=root+'/native';
const c=require(repo+'/tools/text-workshop/core.cjs'),m=require('./manifest.json'),raw=fs.readFileSync(root+'/candidate.qsp'),d=c.parse(raw);
fs.mkdirSync(out,{recursive:true});
const lines=['количество_врагов=1'],q=s=>"'"+s.replaceAll("'","''")+"'";let assertions=0;
function check(cond){assertions++;lines.push(`if ${cond}: msg 'FAIL_${assertions}' & exit`);}
for(const e of m.entries){const s=e.standing.runtimePath||e.standing.path,def=e.defeat.runtimePath||e.defeat.path;lines.push('$враг[1]='+q(e.key),'$силуэт_моба['+q(e.key)+']='+q(s));check(`$func('jo9_battle_fate','sprite',1,0) ! ${q(s)}`);check(`$func('jo9_battle_fate','sprite',1,1) ! ${q(def)}`);check('$силуэт_моба['+q(e.key)+'] ! '+q(s));}
check("$func('jo9_battle_fate','sprite',0,1) ! ''");check("$func('jo9_battle_fate','sprite',2,1) ! ''");
const marker='JO9_QA_MOB20261028_mob_sets_COMPLETE';lines.push('msg '+q(marker));
const start=d.locations.find(l=>l.name==='Start');d.lines[start.body]=c.shift(lines.join('\r\n'),-5);fs.writeFileSync(out+'/probe.qsp',c.serialize(d));
for(const dir of ['css','content','fonts','json'])if(!fs.existsSync(out+'/'+dir))fs.symlinkSync(fs.realpathSync(game+'/'+dir),out+'/'+dir,'junction');
fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'mob-sets',file:out+'/probe.qsp',marker,checkpoint:'All catalog sprite keys, defeat and standing paths, original array preservation and invalid slots'}]));
const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','30'],{windowsHide:true,encoding:'utf8',timeout:45000});
fs.writeFileSync(__dirname+'/native.log',(r.stdout||'')+(r.stderr||''));const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
const report={pass:r.status===0&&results.every(x=>x.pass),rows:m.entries.length,assertions,results,limits:'Native sprite function only; no interactive battle or existing save loaded.'};fs.writeFileSync(__dirname+'/native-report.json',JSON.stringify(report,null,2));console.log(report);a(report.pass);
