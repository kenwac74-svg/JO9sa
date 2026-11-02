'use strict';
const fs=require('fs'),cp=require('child_process'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/cruel-mercy-rules-20261101',O=T+'-release';
function node(args){const p=cp.spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true});a.equal(p.status,0,'failed '+args[0]);}
node([__dirname+'/build.cjs']);node([__dirname+'/verify-evidence.cjs']);
node([R+'/tools/qa/release-check.cjs','--candidate',T+'/candidate.qsp','--baseline',T+'/before.qsp','--mods-dir',T+'/mods','--engine',W+'/engine/jack.exe','--game-dir',W,'--state-save','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_01_HOME_TRAITS.sav','--cache-revision','3','--client-timeout-seconds','30','--profile','release','--out',O]);
const h=JSON.parse(fs.readFileSync(T+'/prepared.json')).after;
const reports=fs.readdirSync(O,{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name.startsWith('run-')).map(x=>O+'/'+x.name+'/report.json').filter(p=>fs.existsSync(p)).map(path=>({path,data:JSON.parse(fs.readFileSync(path,'utf8').replace(/^\uFEFF/,''))})).filter(x=>x.data.verdict==='PASS'&&x.data.checks[0].detail.candidate===h);
a(reports.length);node([__dirname+'/install.cjs',reports.at(-1).path]);
