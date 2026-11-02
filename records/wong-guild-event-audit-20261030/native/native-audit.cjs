'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const out='G:/Codex/tmp/jo9-wong-audit-20261030',keep=__dirname;
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const qsp=game+'/jack.qsp',sav=game+'/save/JO9_GOLD_AP_CHECK_20261026.sav';
const raw=fs.readFileSync(qsp),seed=fs.readFileSync(sav),before={qsp:c.hash(raw),save:c.hash(seed)};
const prime=qa.primeState(sc.parse(seed)).code,cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
fs.mkdirSync(out,{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf']){
 fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});if(!fs.existsSync(out+'/'+rel))fs.copyFileSync(game+'/'+rel,out+'/'+rel);
}
for(const rel of ['content','json'])if(!fs.existsSync(out+'/'+rel))fs.symlinkSync(game+'/'+rel,out+'/'+rel,'junction');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const fixture=`usehtml=1\n${prime}\n$onnewloc='' & $counter=''\ngs 'refresh_database'\n$onnewloc='' & $counter=''\nautosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0\nsnk_room_target=0 & is_home=0\ngave_guild_ill_slave=1 & gave_guild_parasite_slave=0\nsold_ill_slave=0 & sold_parasite_slave=0\nguild_reputation_rate=50 & guild_reputation=10\nend_day_guild_visit=0 & end_day_phase=1\nparasite_slave_warned_before=0\nsparks=100000 & day=102 & master_energy=5\nEndOfDayEventCnt=0\ngt 'end_day_screen'`;
const plans=[],instrumentation=[];
for(const candidate of [false,true]){
 const name=candidate?'candidate':'baseline',d=c.parse(raw),loc=n=>{const l=d.locations.find(x=>x.name===n);assert(l,n);return l},body=n=>c.shift(d.lines[loc(n).body],5),set=(n,b)=>d.lines[loc(n).body]=c.shift(cr(b),-5);
 set('Start',fixture);
 let b=body('end_day_screen');
 const anchor='!Delayed consequences of ill or parasite-infected slaves being sold to clients or given to the guild - ImperatorAugustus';
 assert.equal(b.split(anchor).length,2);
 b=b.replace(anchor,":qaWong\r\n"+anchor);
 const initialLines=b.split('\r\n');assert.equal(initialLines[20],'npc = 0');assert.equal(initialLines[21],'');
 initialLines.splice(22,0,"jump 'qaWong'");b=initialLines.join('\r\n');
 const jump="\t\tend_day_guild_visit = 1\r\n\t\tjump 'loop' &! assistant_quiet_rule does not suppress this - ImperatorAugustus";
 const wongStart=b.indexOf(':qaWong'),wongEnd=b.indexOf('\telseif sold_ill_slave',wongStart);assert(wongEnd>wongStart);
 const wongBranch=b.slice(wongStart,wongEnd);assert.equal(wongBranch.split(jump).length,2);
 if(candidate)b=b.slice(0,wongStart)+wongBranch.replace(jump,"\t\tend_day_guild_visit = 1\r\n\t\t$text = $text[1] + '<br><br>' + $text[2]\r\n\t\tjump 'loop' &! assistant_quiet_rule does not suppress this - ImperatorAugustus")+b.slice(wongEnd);
 const marker='JO9_QA_WONG_'+name+'_COMPLETE';
 const js=`(function(){var n=0;function emit(s){var a=document.createElement('a');a.href="EXEC: msg '${marker}|REP=<<guild_reputation_rate>>|ILL=<<gave_guild_ill_slave>>|PARA=<<gave_guild_parasite_slave>>|GUARD=<<end_day_guild_visit>>|NPC=<<$npc_id>>|TXT2LEN=<<len($text[2])>>|EVENTS=<<EndOfDayEventCnt>>|"+s+"'";a.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px';document.body.appendChild(a);var r=a.getBoundingClientRect(),e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,r.left,r.top,false,false,false,false,0,null);a.dispatchEvent(e)}function tick(){var t=document.getElementById('text'),s=document.getElementById('side_panel_main');if(t&&s){var z=t.textContent||'';emit('DOMLEN='+z.length+'|WONG='+(s.textContent.indexOf('웡')>=0?1:0)+'|LINE1='+(z.indexOf('문을 두드리는')>=0?1:0)+'|LINE2='+(z.indexOf('병에 걸려')>=0?1:0));return}if(++n<120)setTimeout(tick,60);else emit('DOM_MISSING=1')}setTimeout(tick,180)}());`;
 const observedJs=js.replace("+'|LINE2='+(z.indexOf('병에 걸려')>=0?1:0)","+'|LINE2='+(z.indexOf('병에 걸려')>=0?1:0)+'|CLIENTHEIGHT='+t.clientHeight+'|SCROLLHEIGHT='+t.scrollHeight+'|CLIENTWIDTH='+t.clientWidth+'|SCROLLWIDTH='+t.scrollWidth");
 assert.notEqual(observedJs,js);
 b+='\r\n*p '+q('<script type="text/javascript">'+observedJs+'</script>')+'\r\n';set('end_day_screen',b);
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plans.push({name,file,marker,checkpoint:'Real end_day_screen initial layout+reset, original Wong illness branch, loop+footer; '+(candidate?'one-line dialogue assembly candidate':'unaltered event logic')});
 instrumentation.push({name,qspSha:c.hash(bytes),candidateDialogueAssembly:candidate,savesWritten:false,originalLocationRetained:true,changes:['Start seed and state fixture','jump over unrelated earlier daily events after original first 22 lines','qaWong entry label','footer DOM observer',...(candidate?['one-line text[1]+text[2] assembly before native jump loop']:[])]});
}
write(out+'/plan.json',plans);write(keep+'/fixture-manifest.json',{before,instrumentation,sourceSave:sav,output:out});
fs.copyFileSync(keep+'/run-diagnostic.ps1',out+'/runner.ps1');
console.log(JSON.stringify({prepared:2,out,before}));
if(!process.argv.includes('--run'))process.exit();
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:1000000});
fs.writeFileSync(keep+'/runner.log',run.stdout+'\n'+run.stderr);
const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
for(const x of plans){const src=out+'/'+x.name+'-stderr.log';if(fs.existsSync(src))fs.copyFileSync(src,keep+'/'+x.name+'-stderr.log');}
const after={qsp:c.hash(fs.readFileSync(qsp)),save:c.hash(fs.readFileSync(sav))};assert.deepEqual(after,before);
write(keep+'/results.json',{before,after,sourceUnchanged:true,exit:run.status,results,instrumentation,limits:['Existing user save is read-only input; no savegame command is added.','No OS mouse; DOM observer executes in actual native FastQSP page and sends marker through native EXEC/msg.','Initial real layout/reset, Wong illness event body, common loop and footer execute. Unrelated earlier daily events are skipped explicitly.','Candidate is diagnostic only and does not write WORK or repository code.']});
console.log(JSON.stringify({exit:run.status,sourceUnchanged:true,results}));
