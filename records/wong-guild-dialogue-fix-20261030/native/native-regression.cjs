'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',out='G:/Codex/tmp/jo9-wong-fix-20261030/native-regression',keep=__dirname;
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const candidatePath=process.argv[2];assert(candidatePath&&candidatePath.endsWith('.qsp'),'Provide review candidate QSP path');
const restoreDynamic=process.argv.includes('--restore-dynamic'),only=process.argv.find(z=>z.startsWith('--case='))?.slice(7),label=restoreDynamic?'-fatal-rehydrated':'';
const qsp=game+'/jack.qsp',sav=game+'/save/JO9_GOLD_AP_CHECK_20261026.sav';
const raw=fs.readFileSync(candidatePath),work=fs.readFileSync(qsp),seed=fs.readFileSync(sav),before={workQsp:c.hash(work),candidate:c.hash(raw),save:c.hash(seed)};
const prime=qa.primeState(sc.parse(seed)).code,cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
fs.mkdirSync(out,{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf']){
 fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});if(!fs.existsSync(out+'/'+rel))fs.copyFileSync(game+'/'+rel,out+'/'+rel);
}
for(const rel of ['content','json'])if(!fs.existsSync(out+'/'+rel))fs.symlinkSync(game+'/'+rel,out+'/'+rel,'junction');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const cases=[
 {name:'illness-one',ill:1,para:0,warn:0,rate:50,after:40,fatal:false},
 {name:'illness-three',ill:3,para:0,warn:0,rate:50,after:20,fatal:false},
 {name:'parasite-first-one',ill:0,para:1,warn:0,rate:50,after:0,fatal:false},
 {name:'parasite-first-three',ill:0,para:3,warn:0,rate:90,after:10,fatal:false},
 {name:'both-first-one',ill:1,para:1,warn:0,rate:100,after:10,fatal:false},
 {name:'parasite-repeat-fatal',ill:0,para:1,warn:1,rate:100,after:20,fatal:true}
].filter(x=>!only||x.name===only);assert(cases.length>0);if(restoreDynamic)assert(cases.length===1&&cases[0].fatal,'Rehydration confined to fatal fixture');
const plans=[],instrumentation=[];
for(const x of cases){
 const d=c.parse(raw),loc=n=>{const l=d.locations.find(z=>z.name===n);assert(l,n);return l},body=n=>c.shift(d.lines[loc(n).body],5),set=(n,b)=>d.lines[loc(n).body]=c.shift(cr(b),-5);
 const rehydrate=restoreDynamic?"gs '#dynamic'\nif instr($death, \"day = 0\")=0 or instr($death, \"gt 'exit'\")=0: msg 'FAIL_WONG_DEATH_NOT_CODE' & exit\n":'';
 set('Start',`usehtml=1\n${prime}\n$onnewloc='' & $counter=''\ngs 'refresh_database'\n$onnewloc='' & $counter=''\n${rehydrate}autosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0\nsnk_room_target=0 & is_home=0\ngave_guild_ill_slave=${x.ill} & gave_guild_parasite_slave=${x.para}\nsold_ill_slave=0 & sold_parasite_slave=0\nguild_reputation_rate=${x.rate} & guild_reputation=10\nend_day_guild_visit=0 & end_day_phase=1\nparasite_slave_warned_before=${x.warn}\nsparks=100000 & day=102 & master_energy=5\nEndOfDayEventCnt=0\ngt 'end_day_screen'`);
 let b=body('end_day_screen');
 const anchor='!Delayed consequences of ill or parasite-infected slaves being sold to clients or given to the guild - ImperatorAugustus';assert.equal(b.split(anchor).length,2);
 b=b.replace(anchor,":qaWong\r\n"+anchor);
 const lines=b.split('\r\n');assert.equal(lines[20],'npc = 0');assert.equal(lines[21],'');lines.splice(22,0,"jump 'qaWong'");b=lines.join('\r\n');
 const marker='JO9_QA_WONGFIX_'+x.name.replaceAll('-','_')+'_COMPLETE';
 function observer(id){
 const js=`(function(){var n=0;function emit(s){var a=document.createElement('a');a.href="EXEC: msg '${marker}|REP=<<guild_reputation_rate>>|ILL=<<gave_guild_ill_slave>>|PARA=<<gave_guild_parasite_slave>>|GUARD=<<end_day_guild_visit>>|WARN=<<parasite_slave_warned_before>>|NPC=<<$npc_id>>|DAY=<<day>>|EVENTS=<<EndOfDayEventCnt>>|"+s+"'";a.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px';document.body.appendChild(a);var r=a.getBoundingClientRect(),e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,r.left,r.top,false,false,false,false,0,null);a.dispatchEvent(e)}function tick(){var t=document.getElementById('${id}');if(t){var z=t.textContent||'',s=document.getElementById('side_panel_main');emit('DOMLEN='+z.length+'|WONG='+(s&&s.textContent.indexOf('웡')>=0?1:0)+'|INTRO='+(z.indexOf('문을 두드리는')>=0?1:0)+'|SPEAKER='+(z.indexOf('웡 나으리')>=0?1:0)+'|ILLTEXT='+(z.indexOf('병')>=0?1:0)+'|PARATEXT='+(/유충|애벌/.test(z)?1:0)+'|EXTRA='+(z.indexOf('벌금과 함께')>=0?1:0)+'|EXPEL='+(z.indexOf('방출')>=0?1:0)+'|GAMEOVER='+(z.indexOf('Game Over')>=0?1:0)+'|CLIENTHEIGHT='+t.clientHeight+'|SCROLLHEIGHT='+t.scrollHeight+'|CLIENTWIDTH='+t.clientWidth+'|SCROLLWIDTH='+t.scrollWidth);return}if(++n<120)setTimeout(tick,60);else emit('DOM_MISSING=1')}setTimeout(tick,180)}());`;
 return '\r\n*p '+q('<script type="text/javascript">'+js+'</script>')+'\r\n';
 }
 if(!x.fatal)b+=observer('text');set('end_day_screen',b);
 if(x.fatal)set('exit',body('exit')+observer('jo9_gameover_message'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+x.name+'.qsp';fs.writeFileSync(file,bytes);
 plans.push({name:x.name,file,marker,checkpoint:'Current repair candidate; actual Wong '+(x.fatal?'original fatal dynamic death/exit':'loop/footer')+' renderer'});
 instrumentation.push({...x,qspSha:c.hash(bytes),candidateHelpersUnchanged:true,fixtureDynamicRehydrated:restoreDynamic,source:before.candidate,changes:['Start read-only seed and case fixture',...(restoreDynamic?["Diagnostic Start calls original #dynamic after refresh_database and verifies $death contains day=0 / gt exit; product helper code is not changed"]:[]),'Jump after original first 22 lines over unrelated earlier daily events','qaWong entry label',x.fatal?'Tail-only exit DOM observer':'Tail-only end_day_screen DOM observer']});
}
write(out+'/plan.json',plans);write(keep+'/fixture-manifest'+label+'.json',{before,candidatePath,cases,instrumentation,sourceSave:sav,output:out,healthyNoEvent:'Original nested event condition requires illness>0 or parasite>0; parent verifies unchanged gate by source diff.'});
fs.copyFileSync(keep+'/run-regression.ps1',out+'/runner.ps1');console.log(JSON.stringify({prepared:plans.length,out,before}));
if(!process.argv.includes('--run'))process.exit();
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:230000,maxBuffer:1000000});
fs.writeFileSync(keep+'/runner'+label+'.log',run.stdout+'\n'+run.stderr);
const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
for(const x of plans){for(const suffix of ['stderr','stdout']){const p=out+'/'+x.name+'-'+suffix+'.log';if(fs.existsSync(p))fs.copyFileSync(p,keep+'/'+x.name+label+'-'+suffix+'.log');}}
const after={workQsp:c.hash(fs.readFileSync(qsp)),candidate:c.hash(fs.readFileSync(candidatePath)),save:c.hash(fs.readFileSync(sav))};assert.deepEqual(after,before);
write(keep+'/results'+label+'.json',{before,after,sourceUnchanged:true,exit:run.status,results,instrumentation,limits:['No WORK, QSP helper, source save or user settings writes.','Candidate is copied into isolated diagnostic QSP fixtures; actual native FastQSP renders their original event/loop/footer or fatal death/exit.','No OS mouse, no saved game output; native page DOM callback only.','Healthy or previously-cleared no-event gating is source-diff validated by parent, not an extra native run.',...(restoreDynamic?['Fatal fixture explicitly rehydrates the original #dynamic after database refresh; its previous refresh-only fixture held a battle description in $death and could not reach exit. Actual loaded-save global death-namespace restoration is not verified by this corrected fixture.']:[])]});
console.log(JSON.stringify({exit:run.status,sourceUnchanged:true,results}));
