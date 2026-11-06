'use strict';
// Tiny native-client fixture. No game assets, saves, or production files are copied/modified.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const args=process.argv.slice(2),o={};for(let i=0;i<args.length;i+=2)o[args[i].replace(/^--/,'')]=args[i+1];
if(!o.qsp||!o.out)throw Error('--qsp and --out required');
const raw=fs.readFileSync(o.qsp),doc=core.parse(raw),body=n=>{const l=doc.locations.find(x=>x.name===n);if(!l)throw Error('Missing '+n);return core.shift(doc.lines[l.body],5);};
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function def(loc,name){const b=body(loc),a=b.indexOf(name+' = {'),tail=b.slice(a),m=tail.match(/\r\n[ \t]*\}/);if(a<0||!m)throw Error('Missing '+name);return tail.slice(0,m.index+m[0].length);}
const lines=[def('#static_base','$update_slave_energy_stars'),def('$calculate_attributes','$update_master_energy_stars'),def('#dynamic','$dynamic_energy_drop'),def('next_day','$next_day_energy_refresh'),"CONST_INT['no_slave']=0","CONST_INT['slave_exist']=1","CONST_INT['slave_faint']=2",'qa_passed=0','qa_failed=0',"$qa_details=''",'master_energy=4','master_half_action=1','cheat_inf_en=0'];
let assertions=0;
function expect(name,expression,want){assertions++;lines.push(`if (${expression}) = ${want}:\n qa_passed += 1\nelse\n qa_failed += 1\n $qa_details += ${quote(name+': got=')} + $str(${expression}) + ${quote(' want='+want+'; ')}\nend`);}
function setup(role,s,e,h,d=2){lines.push(`killvar '${role}'\nkillvar '${role}_rate'\nkillvar '${role}_already_done_today'\n${role}_state=1\n${role}['stamina']=${s}\n${role}['energy']=${e}\n${role}['half_action']=${h}\n${role}_already_done_today['exertion']=-1\ndifficulty_setting=${d}\ngame_difficulty=2\neasy_for_${role}=0\nassistant_state=${role==='assistant'?1:0}\nfarmhand_state=${role==='farmhand'?1:0}\nmaster_medic=0`);}
function dyn(name,role){lines.push('dynamic $replace('+name+", 'dynslave', "+quote(role)+')');}
const curve=[[0,2,3,4,5,5],[0,2,3,4,5,5],[0,1,2,3,4,5]];
for(const role of ['slave','assistant','room1','room2','room3','room4','farmhand','iced_2'])for(let d=0;d<3;d++)for(let s=0;s<=5;s++){
 setup(role,s,10,0,d);dyn('$update_slave_energy_stars',role);
 expect(`cap ${role} D${d} S${s}`,`${role}['energy']`,curve[d][s]);
 expect(`half ${role} D${d} S${s}`,`${role}['half_action']`,0);
 if(s===0)expect(`html ${role} D${d} S${s}`,`iif($${role}_energy_stars = '-', 1, 0)`,1);
 else expect(`html ${role} D${d} S${s}`,`(len($${role}_energy_stars)-len($replace($${role}_energy_stars, '<img ', '')))/5`,5);
}
for(const [name,e,h,we,wh]of [['spent-half',2,1,2,1],['bonus-half',2,-1,2,-1],['bonus-three',1,-3,2,-1],['bonus-from-zero',0,-3,1,-1],['excess-refill',3,1,2,0],['negative',-2,1,-2,1],['floor',-7,0,-5,0],['spent-three',2,3,1,1],['spent-four',2,4,0,0],['bonus-at-cap',2,-3,2,-3]]){setup('slave',2,e,h);dyn('$update_slave_energy_stars','slave');expect(name+' energy',"slave['energy']",we);expect(name+' half',"slave['half_action']",wh);}
for(let d=0;d<3;d++)for(let s=0;s<=5;s++){setup('slave',s,-2,0,d);lines.push("slave['wounds']=0");dyn('$next_day_energy_refresh','slave');expect(`recovery D${d} S${s}`,"slave['energy']",-2+curve[d][s]);}
for(const [name,nurse,medic,want]of [['no-support',0,0,-1],['nurse-equal',3,0,-1],['nurse-higher',4,0,1],['medic-equal',0,3,-1],['medic-higher',0,4,1]]){setup('slave',2,0,0);lines.push(`slave['wounds']=3\nassistant_state=1\nassistant['nurse']=${nurse}\nmaster_medic=${medic}`);dyn('$next_day_energy_refresh','slave');expect(name,"slave['energy']",want);}
setup('slave',2,3,0,1);dyn('$update_slave_energy_stars','slave');lines.push('difficulty_setting=2');dyn('$update_slave_energy_stars','slave');expect('switch-to-hard',"slave['energy']",2);lines.push('difficulty_setting=1');dyn('$update_slave_energy_stars','slave');expect('switch-to-normal-no-refill',"slave['energy']",2);
expect('master-energy','master_energy',4);expect('master-half','master_half_action',1);
for(let d=0;d<3;d++)for(const [e,h,we,wh]of [[10,1,5,0],[4,-3,5,-1],[-8,0,-5,0]]){lines.push(`difficulty_setting=${d}\nmaster_energy=${e}\nmaster_half_action=${h}\ndynamic $update_master_energy_stars`);expect(`master D${d} E${e} H${h} energy`,'master_energy',we);expect(`master D${d} E${e} H${h} half`,'master_half_action',wh);}
const marker='JO9_QA_APNATIVE_hard_ap_COMPLETE';
lines.push(`if qa_failed=0:\n msg '${marker}'\nelse\n msg 'JO9_QA_APNATIVE_hard_ap_FAILED|JO9_AP_RESULT passed=<<qa_passed>> failed=<<qa_failed>> details=<<$qa_details>>'\nend`);
const start=lines.join('\r\n').replace(/\r\n|\r|\n/g,'\r\n');
const fixture=Buffer.from(['QSPGAME','','',core.shift('1',-5),core.shift('Start',-5),'',core.shift(start,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
const out=path.resolve(o.out);fs.mkdirSync(out,{recursive:true});const file=path.join(out,'hard-ap.qsp'),plan=path.join(out,'plan.json');
fs.writeFileSync(file,fixture);fs.writeFileSync(plan,JSON.stringify([{name:'hard-ap',file,marker,checkpoint:'actual AP fragments and full energy-star renderer'}],null,2));
fs.writeFileSync(path.join(out,'config.xml'),'<game width="640" height="480" title="JO9 disposable AP diagnostic"/>\r\n');
fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const engine=o.engine||'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe';
const runner=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',engine,'-Plan',plan,'-TimeoutSeconds','20'],{encoding:'utf8',windowsHide:true,timeout:35000});
const stderrFile=path.join(out,'hard-ap-stderr.log'),log=fs.existsSync(stderrFile)?fs.readFileSync(stderrFile,'utf8'):'';
const m=log.match(/JO9_AP_RESULT passed=(\d+) failed=(\d+) details=([^"\r\n]*)/);
const completed=log.includes('"'+marker+'"');
const report={createdAt:new Date().toISOString(),input:path.resolve(o.qsp),inputSha256:core.hash(raw),engine,engineSha256:core.hash(fs.readFileSync(engine)),assertions,fixtureBytes:fixture.length,passed:completed?assertions:m?Number(m[1]):null,failed:completed?0:m?Number(m[2]):null,details:completed?'':m?m[3]:null,runnerExit:runner.status,runnerOutput:(runner.stdout||'')+(runner.stderr||''),inputUnchanged:core.hash(fs.readFileSync(o.qsp))===core.hash(raw),limits:['Tiny diagnostic QSP executes actual full energy-star function, actual energy-drop function, and actual recovery function with synthetic actors.','No personal saves, whole next_day lifecycle, actor creation/acquisition, or visual gameplay verified.','HTML image count is checked; images are not rendered or inspected.']};
report.verdict=completed&&report.failed===0&&report.passed===assertions&&runner.status===0&&report.inputUnchanged?'PASS':m?'FAIL':'ERROR';
fs.writeFileSync(path.join(out,'native-report.json'),JSON.stringify(report,null,2)+'\n');
// The synthetic QSP and launcher configuration are reproducible; preserve source and results only.
for(const name of ['hard-ap.qsp','plan.json','config.xml','FastQSP.ini','hard-ap-stdout.log']){const target=path.join(out,name);if(fs.existsSync(target))fs.unlinkSync(target);}
console.log(JSON.stringify({verdict:report.verdict,assertions,passed:report.passed,failed:report.failed,inputSha256:report.inputSha256,runnerExit:report.runnerExit,fixtureBytes:fixture.length}));
process.exitCode=report.verdict==='PASS'?0:report.verdict==='FAIL'?1:2;
