const fs=require('fs'),cp=require('child_process'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root='G:/Codex/tmp/cruel-mercy-20261029',game='G:/somi/Jack O Nine Tails v2.4_work/game',mode=process.argv[2]||'red',out=root+'/'+mode;
fs.mkdirSync(out,{recursive:true});const d=c.parse(fs.readFileSync(mode==='red'?game+'/jack.qsp':root+'/candidate.qsp'));
let lines=[],assertions=0;const check=x=>{lines.push("if "+x+": msg 'FAIL_"+(++assertions)+"' & exit");};
function setup(m=2,count=1){lines.push("killvar 'jo9_fate'","killvar 'jo9_fate_enemy'","количество_врагов="+count,"jo9_fate['mode']="+m,"jo9_fate['phase']=1","jo9_fate['count']="+count,"$итог_боя='победа'");for(let i=1;i<=count;i++)lines.push("jo9_fate_enemy["+i+"]=1");}
lines.push("killvar 'jo9_cruel_mercy'");check('jo9_cruel_mercy ! 0');
setup();lines.push("gs 'jo9_battle_fate','choose',1");check('jo9_cruel_mercy ! -1');
lines.push("gs 'jo9_battle_fate','choose',1","gs 'jo9_battle_fate','choose',2");check('jo9_cruel_mercy ! -1');
setup();lines.push("gs 'jo9_battle_fate','choose',2");check('jo9_cruel_mercy ! 0');
setup();lines.push("gs 'jo9_battle_fate','choose',2");check('jo9_cruel_mercy ! 1');
setup(1,5);lines.push("gs 'jo9_battle_fate','choose',2");check('jo9_cruel_mercy ! 1');check("jo9_fate['phase'] ! 1");
lines.push("gs 'jo9_battle_fate','choose',1");check('jo9_cruel_mercy ! 0');
for(const [key,value] of [["mode",0],["phase",0],["phase",2],["count",0]]){setup();lines.push("jo9_fate['"+key+"']="+value,"gs 'jo9_battle_fate','choose',1");check('jo9_cruel_mercy ! 0');}
setup();lines.push("$итог_боя='поражение'","gs 'jo9_battle_fate','choose',1");check('jo9_cruel_mercy ! 0');
setup();lines.push("gs 'jo9_battle_fate','choose',99");check('jo9_cruel_mercy ! 0');
for(const role of [0,1,2]){setup();lines.push('combatant='+role,"gs 'jo9_battle_fate','choose',2");check('jo9_cruel_mercy ! '+(role+1));}
lines.push("gs 'jo9_battle_fate','init','normal'");check('jo9_cruel_mercy ! 3');
if(mode==='green'){lines.push("gs 'init_game'");check('jo9_cruel_mercy ! 0');}
const marker='JO9_QA_CM20261029_balance_COMPLETE';lines.push("msg '"+marker+"'");
d.lines[d.locations.find(l=>l.name==='Start').body]=c.shift(lines.join('\r\n'),-5);fs.writeFileSync(out+'/probe.qsp',c.serialize(d));
for(const name of ['css','content','fonts','json'])if(!fs.existsSync(out+'/'+name))fs.symlinkSync(fs.realpathSync(game+'/'+name),out+'/'+name,'junction');
fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'cruel-mercy',file:out+'/probe.qsp',marker,checkpoint:'Signed choice accumulation, duplicate rejection, group once, invalid choices, roles, battle init preservation'}]));
const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','15'],{windowsHide:true,encoding:'utf8',timeout:30000});
const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));const report={mode,assertions,pass:r.status===0&&results.every(x=>x.pass),results};fs.writeFileSync(__dirname+'/'+mode+'-report.json',JSON.stringify(report,null,2));console.log(report);
if(mode==='green')a(report.pass);else a(!report.pass);
