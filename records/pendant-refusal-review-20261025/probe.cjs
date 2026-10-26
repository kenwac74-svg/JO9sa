'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-pendant-refusal-20261025',out=__dirname;
const raw=fs.readFileSync(game+'/jack.qsp'),before=c.hash(raw),d=c.parse(raw);
a.equal(before,'be2c993d24911fec5edfc0efceee9d4bd570c2d9e3a511975a69e29e383ba898');
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const item=body('#item_base'),start=item.indexOf("$item_property['golden_collar'] = {"),end=item.indexOf('\r\n}',start);
a(start>=0&&end>start);const def=item.slice(start,end+3),q=s=>"'"+s.replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
fs.mkdirSync(tmp,{recursive:true});fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const cases=[{role:'prisoner',ret:'',dest:''},{role:'prisoner',ret:'prison_cell',dest:'prison_cell'},{role:'slave',ret:'',dest:'slave_stat'},{role:'assistant',ret:'',dest:'assistant_stat'}],plan=[];
for(let i=0;i<cases.length;i++){
 const t=cases[i],name=['prisoner-empty','prisoner-return','slave-empty','assistant-empty'][i],marker='JO9_QA_PENDANT_'+name.replace(/-/g,'_')+'_COMPLETE';
 let setup=`usehtml=1\n$onnewloc=''\n$counter=''\nCONST_INT['slave_exist']=1\n${t.role}_state=1\n$${t.role}_psy_status='arrogant'\nrebell['arrogant']=1\n${t.role}['passion_luxury']=0\n${t.role}['obedience']=-1\n${t.role}['beaten_ever']=0\n${t.role}['domini_dictum']=0\n$${t.role}['collar']='golden_collar'\n${t.role}_inventory['golden_collar']=0\n$return_lock=${q(t.ret)}\n`;
 setup+=def+'\n'+`dynamic $replace($item_property['golden_collar'],'dyn'+'slave',${q(t.role)})\nmsg 'FAIL_PENDANT_NO_PROMPT'\n`;
 const callback=`if $no='': msg 'FAIL_PENDANT_EMPTY_CALLBACK' & exit\n`+
 `if instr($no,'gt iif(')=0: msg 'FAIL_PENDANT_UNEXPECTED_RETURN' & exit\n`+
 `$qa_no=$replace($no,'gt iif(','$qa_destination=iif(')\n`+
 `dynamic $qa_no\n`+
 `if $qa_destination!${q(t.dest)}: msg 'FAIL_PENDANT_DESTINATION' & exit\n`+
 `if $${t.role}['collar']!'пусто' or ${t.role}_inventory['golden_collar']!1: msg 'FAIL_PENDANT_FIRST_REFUND' & exit\n`+
 `dynamic $qa_no\n`+
 `if ${t.role}_inventory['golden_collar']!2: msg 'FAIL_PENDANT_REPEAT_NOT_OBSERVED' & exit\n`+
 `savegame ${q(name+'-after.sav')}\nmsg ${q(marker)}\n`;
 const lines=d.lines.slice(0,4);lines[3]=c.shift('2',-5);
 for(const [n,code] of [['Start',setup],['choice_screen',callback]])lines.push(c.shift(n,-5),c.shift('',-5),c.shift(cr(code),-5),c.shift('0',-5));lines.push('');
 const bytes=c.serialize({lines});c.parse(bytes);const file=tmp+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plan.push({name,file,marker,checkpoint:'Exact current golden_collar source creates role-specific yes/no; intercept only GT to inspect its destination, then execute original No mutation twice. Expected '+t.role+' destination '+(t.dest||'<empty>')+'.'});
}
fs.writeFileSync(tmp+'/plan.json',JSON.stringify(plan,null,2)+'\n');
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',tmp+'/plan.json','-TimeoutSeconds','12'],{encoding:'utf8',windowsHide:true,timeout:59000,maxBuffer:1000000});
const results=fs.existsSync(tmp+'/client-results.json')?JSON.parse(fs.readFileSync(tmp+'/client-results.json','utf8').replace(/^\uFEFF/,'')):[];
for(const p of plan)for(const kind of ['stdout','stderr']){const f=tmp+'/'+p.name+'-'+kind+'.log';if(fs.existsSync(f))fs.copyFileSync(f,out+'/'+p.name+'-'+kind+'.log');}
const report={status:run.status===0&&results.length===4&&results.every(x=>x.pass)?'REPRODUCED_MECHANICALLY':'INCOMPLETE',workSha256:before,method:'Installed native engine executes exact golden_collar property and generated No callback. Only GT is intercepted to inspect the exact requested return without stopping diagnostic execution.',cases,results,observations:['With post-day empty return, prisoner callback requests empty destination; direct prisoner page return and slave/assistant role page are nonempty.','Original No callback returns inventory once, but executing unchanged cached callback a second time returns it again.'],limits:['Synthetic representative equipment/refusal state, not the user save or full day transition.','Actual X pointer hitbox, native force/bruising MSG acknowledgment, and unmodified failing GT not exercised.','No product fix, balance change, save migration, or current game process manipulation.'],workUnchanged:c.hash(fs.readFileSync(game+'/jack.qsp'))===before,stdout:run.stdout,stderr:run.stderr};
fs.writeFileSync(out+'/native-mechanical-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
a.equal(report.status,'REPRODUCED_MECHANICALLY');a(report.workUnchanged);
