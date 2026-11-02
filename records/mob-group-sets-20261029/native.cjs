'use strict';
const fs=require('fs'),cp=require('child_process'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/mob-group-sets-20261029',out=root+'/'+(process.argv[2]||'red');
const c=require(repo+'/tools/text-workshop/core.cjs'),m={entries:[]},raw=fs.readFileSync(process.argv[2]==='green'?root+'/candidate.qsp':game+'/jack.qsp'),d=c.parse(raw);
fs.mkdirSync(out,{recursive:true});
const lines=['количество_врагов=1'],q=s=>"'"+s.replaceAll("'","''")+"'";let assertions=0;
function check(cond){assertions++;lines.push(`if ${cond}: msg 'FAIL_${assertions}' & exit`);}
const groups=require('./groups.json');
for(const g of groups){
 const combinations=[];function enumerate(i,left,roster){if(i===g.roster.length-1){combinations.push([...roster,...Array(left).fill(g.roster[i])]);return;}for(let k=0;k<=left;k++)enumerate(i+1,left-k,[...roster,...Array(k).fill(g.roster[i])]);}
 if(g.random)enumerate(0,g.count,[]);else combinations.push(g.roster);
 for(const roster of combinations.flatMap(r=>[r,[...r].reverse()])){
  lines.push("killvar '$враг'","killvar 'враг'","количество_врагов="+roster.length,"текущий="+roster.length);
  roster.forEach((key,i)=>lines.push("$враг["+(i+1)+"]="+q(key),"враг["+(i+1)+"]=0"));
  check("$func('jo9_battle_fate','group') ! "+q(g.path));
 }
}
lines.push("количество_врагов=1");check("$func('jo9_battle_fate','group') ! ''");
lines.push("количество_врагов=6");check("$func('jo9_battle_fate','group') ! ''");
lines.push("количество_врагов=3","$враг[1]='egeya'");check("$func('jo9_battle_fate','group') ! ''");
const marker='JO9_QA_GROUP20261029_groups_COMPLETE';lines.push('msg '+q(marker));
const start=d.locations.find(l=>l.name==='Start');d.lines[start.body]=c.shift(lines.join('\r\n'),-5);fs.writeFileSync(out+'/probe.qsp',c.serialize(d));
for(const dir of ['css','content','fonts','json'])if(!fs.existsSync(out+'/'+dir))fs.symlinkSync(fs.realpathSync(game+'/'+dir),out+'/'+dir,'junction');
fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'mob-sets',file:out+'/probe.qsp',marker,checkpoint:'Group roster lookup, reversed order, inactive enemy slots, invalid counts and unknown roster'}]));
const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','30'],{windowsHide:true,encoding:'utf8',timeout:45000});
fs.writeFileSync(__dirname+'/native.log',(r.stdout||'')+(r.stderr||''));const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
const report={pass:r.status===0&&results.every(x=>x.pass),rows:m.entries.length,assertions,results,limits:'Actual group lookup only; no full battle playthrough.'};fs.writeFileSync(__dirname+'/'+(process.argv[2]||'red')+'-report.json',JSON.stringify(report,null,2));console.log(report);if(process.argv[2]==='green')a(report.pass);else a(!report.pass);
