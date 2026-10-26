'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),zlib=require('zlib'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-collar-runtime-20261025',out=root+'/load';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),'a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a');
const base=c.parse(zlib.gunzipSync(fs.readFileSync(repo+'/records/golden-collar-fix-20261025/before.qsp.gz'))),body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const def=(s,name)=>{const x=s.indexOf(name+' = {'),e=s.indexOf('\r\n}',x);a(x>=0&&e>x);return s.slice(x,e+3);};
const oldProperty=def(body(base,'#item_base'),"$item_property['golden_collar']");
fs.mkdirSync(out,{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf','content/pic/buttons/approve.png','content/pic/buttons/deny.png','content/pic/msg_bg.png','content/pic/buttons/ok-icon.png']){fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,out+'/'+rel);}
fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/JO9_TEST_20261023_01_HOME.sav'))).code;
const mode=process.argv.includes('--load')?'load':'write',names=['pending-yes','pending-no','accepted','refunded'],plans=[];
for(const name of names){
 const d=c.parse(raw),set=(n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5),append=(n,s)=>set(n,body(d,n)+'\n'+s);
 const marker='JO9_QA_GCSAVE_'+name.replaceAll('-','_')+'_'+mode+'_COMPLETE';
 const js=`(function(){function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function fail(s){var a=document.createElement('a');a.href="EXEC: msg 'FAIL_GCSAVE_"+s+"'";document.body.appendChild(a);click(a)}var sent=false,n=0;function f(){var m=document.getElementById('__message__');if(m){var a=document.querySelector('a[href="api/closemsg"]');if(!a){if(++n<100)setTimeout(f,30);else fail('MSG_CLOSE_MISSING');return}var r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!a.contains(hit)){fail('MSG_COVERED');return}click(a);return}var a=document.querySelector('#${name==='pending-no'?'deny':'approve'} a');if(!a){if(++n<100)setTimeout(f,30);else fail('BUTTON_MISSING');return}var r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!a.contains(hit)||r.width<=0||r.height<=0){fail('BUTTON_COVERED');return}if(!sent){sent=true;click(a)}setTimeout(f,30)}setTimeout(f,150)}());`;
 const setup=`usehtml=1
${prime}
gs 'refresh_database'
sound_on=0 & nsfw=1 & snk_room_target=0
copyarr 'prisoner','slave'
copyarr 'prisoner_rate','slave_rate'
prisoner_state=CONST_INT['slave_exist'] & prisoner_type=2571 & prisoner['id']=71401 & prisoner['age']=2
$prisoner_name='금장 목줄 검사 대상'
prisoner['passion_luxury']=0 & prisoner['obedience']=-1 & prisoner['beaten_ever']=0 & prisoner['domini_dictum']=0
$prisoner_psy_status='qa_rebell' & rebell['qa_rebell']=1
prisoner['calories']=50 & prisoner['ego']=2 & prisoner['virtue']=3 & prisoner['sin']=1 & prisoner['stamina']=3 & prisoner['sensitivity']=1 & prisoner['wounds']=0 & prisoner['hygiene']=0
killvar 'prisoner_inventory'
$prisoner['collar']='golden_collar'
master_str=2 & master_fighter=1 & master_str_rate=0 & is_kid=0
day=102 & sparks=19995 & jo9_lq['active']=0 & jo9_lq['bill']=375
$return_lock=''
qa_writer=1 & qa_load_entered=0 & qa_newloc_entered=0 & qa_next_day_entered=0 & qa_finish=0
$qa_mode=${q(name)}
${oldProperty}
dynamic $replace($item_property['golden_collar'],'dyn'+'slave','prisoner')
msg 'FAIL_GCSAVE_NO_PROMPT'
`;
 set('Start',mode==='write'?setup:`usehtml=1\nopengame ${q(name+'.sav')}\nmsg 'FAIL_GCSAVE_LOAD_RETURNED'`);
 set('$ongload',"qa_load_entered+=1\n"+body(d,'$ongload'));
 set('$newloc',"qa_newloc_entered+=1\n"+body(d,'$newloc'));
 set('next_day',"qa_next_day_entered+=1\n"+body(d,'next_day'));
 let tail=`if qa_writer=1:
 qa_writer=0
 ${name==='accepted'?"prisoner['beaten_ever']=1 & prisoner['beaten']=1":name==='refunded'?"$prisoner['collar']='пусто' & prisoner_inventory['golden_collar']=1":'! pending'}
 savegame ${q(name+'.sav')}
 msg ${q(marker)}
 exit
end
if qa_load_entered>0 and qa_finish=0:
 if instr($yes,'GC_CHOICE_20261025')=0 or $return_lock!'menu_form': msg 'FAIL_GCSAVE_NOT_REPAIRED' & exit
 $qa_callback=${name==='pending-no'?'$no':'$yes'}
 *p ${q('<script type="text/javascript">'+js+'</script>')}
end`;
 append('choice_screen',tail);
 let done=`if qa_load_entered>0 and qa_finish=0:
 qa_finish=1
 if qa_load_entered!1 or qa_newloc_entered<1 or qa_next_day_entered!0: msg 'FAIL_GCSAVE_CALLBACK_PATH' & exit
 if day!102 or sparks!19995 or jo9_lq['bill']!375 or jo9_lq['active']!0: msg 'FAIL_GCSAVE_DUPLICATE_SETTLEMENT' & exit
 if instr($item_property['golden_collar'],'GC_CHOICE_20261025')=0: msg 'FAIL_GCSAVE_CACHE_STALE' & exit
`;
 if(name==='pending-yes')done+=" if prisoner['beaten_ever']!1 or prisoner['calories']!49 or master_str_rate!1 or prisoner_inventory['golden_collar']!0: msg 'FAIL_GCSAVE_FORCE' & exit\n";
 if(name==='pending-no'||name==='refunded')done+=" if prisoner_inventory['golden_collar']!1 or $prisoner['collar']!'пусто' or prisoner['calories']!50 or master_str_rate!0: msg 'FAIL_GCSAVE_REFUND' & exit\n";
 if(name==='accepted')done+=" if prisoner['beaten_ever']!1 or prisoner['calories']!50 or master_str_rate!0 or prisoner_inventory['golden_collar']!0: msg 'FAIL_GCSAVE_ACCEPTED_REPLAY' & exit\n";
 done+=` qa_calories=prisoner['calories'] & qa_refund=prisoner_inventory['golden_collar'] & qa_strength=master_str_rate
 dynamic $qa_callback
 if prisoner['calories']!qa_calories or prisoner_inventory['golden_collar']!qa_refund or master_str_rate!qa_strength: msg 'FAIL_GCSAVE_DUPLICATE_CALLBACK' & exit
 savegame ${q(name+'-after.sav')}
 msg ${q(marker)}
end`;
 append('main_screen',done);
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+name+'-'+mode+'.qsp';fs.writeFileSync(file,bytes);plans.push({name:name+'-'+mode,file,marker,checkpoint:'Native SAVEGAME/LOADGAME of full long cached callbacks; actual $ongload, menu_form->$newloc, actual choice/force/GT and main_screen. Assertions appended only.'});
}
fs.writeFileSync(out+'/'+mode+'-plan.json',JSON.stringify(plans,null,2));let ps=fs.readFileSync(repo+'/tools/qa/run-client-smoke.ps1','utf8').replace("if($probeLog -match 'showMessage\\(\\)')","if($probeLog -match 'showMessage\\(\\), str:\\s*\"FAIL_')");fs.writeFileSync(out+'/runner.ps1',ps);
if(!process.argv.includes('--run')){console.log('Prepared '+mode);process.exit();}
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/'+mode+'-plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:200000,maxBuffer:1000000});const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
const snapshots=names.map(n=>{const file=out+'/'+n+(mode==='write'?'':'-after')+'.sav';if(!fs.existsSync(file))return{name:n,missing:true};const s=sc.parse(fs.readFileSync(file));return{name:n,sha256:c.hash(fs.readFileSync(file)),day:sc.value(s,'DAY')[0],sparks:sc.value(s,'SPARKS')[0],longCachedYes:sc.value(s,'YES')[1].length,oldGoldenCache:!sc.value(s,'ITEM_PROPERTY','golden_collar')[1].includes('GC_CHOICE_20261025'),ongload:sc.value(s,'ONGLOAD')[1],loadEntered:sc.value(s,'QA_LOAD_ENTERED')[0],newlocEntered:sc.value(s,'QA_NEWLOC_ENTERED')[0],nextDayEntered:sc.value(s,'QA_NEXT_DAY_ENTERED')[0],refund:sc.value(s,'PRISONER_INVENTORY','golden_collar')[0],beatenEver:sc.value(s,'PRISONER','beaten_ever')[0]};});
const report={status:run.status===0&&results.every(x=>x.pass)?'PASS':'FAIL',mode,work:c.hash(raw),results,snapshots,stdout:run.stdout,stderr:run.stderr,limits:['Generated representative old-cache saves, not the unprovided reporter save.','Native LOADGAME used; engine configured ignoreCRC for isolated different instrumented fixture world CRCs.','Current product locations/helpers intact apart from counters and terminal assertions; synthetic DOM clicks on original EXEC controls.']};fs.writeFileSync(out+'/'+mode+'-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));a.equal(report.status,'PASS');
