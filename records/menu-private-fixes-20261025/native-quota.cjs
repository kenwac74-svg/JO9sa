'use strict';
// Numeric/state-only native fantasy-creature regression. No nonfantasy branch is selected.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task=path.resolve('G:/Codex/tmp/menu-private-fixes-20261025');
const input=path.resolve(process.argv[2]||task+'/candidate-final.qsp'),out=path.resolve(process.argv[3]||task+'/native-quota');
const baselinePath=path.resolve(process.env.JO9_QUOTA_BASELINE||'G:/somi/JO9_work_backups/menu-private-fixes-20261025/jack.qsp');
const raw=fs.readFileSync(input),baseline=fs.readFileSync(baselinePath);
assert.equal(c.hash(raw),'8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5');assert.equal(c.hash(baseline),'38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed');
assert(!fs.existsSync(out));assert(path.relative(task,out)&&!path.relative(task,out).startsWith('..'));qa.assertOutside(out,[game,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);
let currentName='probe';
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n'),check=(s,id)=>'if ('+s+") = 0: savegame '"+currentName+"-failure.sav' & msg 'FAIL_QUOTA_"+id+"' & exit\r\n";
function ui(name,predicate,code='',remember=false){
 const js=`(function(){var n=0,sent=false;function click(a){var r=(a.querySelector('img')||a).getBoundingClientRect();if(r.width<=0||r.height<=0)return false;var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,r.left+r.width/2,r.top+r.height/2,false,false,false,false,0,null);a.dispatchEvent(e);return true}function fail(){var a=document.createElement('a');a.href="EXEC: msg 'FAIL_QUOTA_DOM_${name}'";document.body.appendChild(a);click(a)}function tick(){var m=document.getElementById('__message__');if(m){var close=document.querySelector('a[href="api/closemsg"]');if(close){click(close);setTimeout(tick,50);return}}if(sent){setTimeout(tick,80);return}var as=document.getElementsByTagName('a'),chosen=null;for(var i=0;i<as.length;i++){var h=as[i].getAttribute('href')||'';if(${predicate}){chosen=as[i];break}}if(chosen){var old=(chosen.getAttribute('href')||'').replace(/^exec:\\s*/i,'');${remember?`chosen.setAttribute('href',"EXEC:$qa_quota_old='"+old.replace(/'/g,"''")+"' & "+${JSON.stringify(code)}+old);`:code?`chosen.setAttribute('href','EXEC:'+${JSON.stringify(code)}+old);`:''}chosen.scrollIntoView(false);if(click(chosen)){sent=true;setTimeout(tick,80);return}}if(++n<160)setTimeout(tick,50);else fail()}setTimeout(tick,160)}());`;
 return '*p '+q('<script type="text/javascript">'+js+'</script>')+'\r\n';
}
function bridge(code){return '*p '+q('<script type="text/javascript">(function(){var a=document.createElement("a");a.setAttribute("href",'+JSON.stringify('EXEC:'+code)+');document.body.appendChild(a);var e=document.createEvent("MouseEvents");e.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);setTimeout(function(){a.dispatchEvent(e)},180)}());</script>')+'\r\n';}
fs.mkdirSync(out+'/save',{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf']){fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,out+'/'+rel);}
for(const rel of ['content','json'])fs.symlinkSync(game+'/'+rel,out+'/'+rel,'junction');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const jobs=[
 {name:'baseline-bypass',old:true,lesson:true,size:4,skill:5,special:4,gain:19,counter:10,preExhaust:true},
 {name:'blocked-lesson',lesson:true,size:4,skill:5,special:4,gain:0,counter:5,blocked:true,preExhaust:true},
 {name:'blocked-assistant',role:'assistant',size:4,skill:5,special:1,gain:0,counter:5,blocked:true,preExhaust:true},
 {name:'blocked-assistant-lesson',role:'assistant',lesson:true,size:4,skill:5,special:1,gain:0,counter:5,blocked:true,preExhaust:true},
 {name:'blocked-slave',role:'slave',size:4,skill:5,special:1,gain:0,counter:5,blocked:true,preExhaust:true},
 {name:'baseline-normal',old:true,role:'assistant',size:4,skill:5,special:1,gain:126,counter:5},
 {name:'normal-assistant',role:'assistant',size:4,skill:5,special:1,gain:126,counter:5},
 {name:'zero-reward',lesson:true,size:0,skill:0,special:4,gain:14,counter:1},
 {name:'zero-no-reward',lesson:true,size:0,skill:0,special:1,gain:0,counter:0,noStale:true},
 {name:'worker-shared',unit:true},
 {name:'auto-room',auto:true}
];
const plan=[],manifest=[];
for(const job of jobs.filter(j=>!process.argv[4]||j.name===process.argv[4])){
 const {name}=job,world=job.old?baseline:raw,d=c.parse(world),marker='JO9_QA_QUOTA_'+name.replaceAll('-','_')+'_COMPLETE';
 currentName=name;
 const seedFile=game+'/save/'+(job.auto?'JO9_TEST_20261023_18_AUTO-ROOM.sav':job.size===0?'JO9_TEST_20261023_11_SIZE0.sav':'JO9_TEST_20261023_15_SIZE4.sav'),seed=fs.readFileSync(seedFile),prime=qa.primeState(sc.parse(seed)).code;
 const get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);},tail=(n,s)=>set(n,get(n)+'\r\n'+s),prefix=(n,s)=>set(n,s+'\r\n'+get(n));
 let boot=['usehtml=1',prime,"$onnewloc='' & $counter='' & $ongload='' & $ongsave=''","gs 'refresh_database'","$onnewloc='' & $counter='' & $ongload='' & $ongsave=''",'settimer 0','autosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0','snk_room_target=0','is_home=1',"$return_lock='menu_form'",'qa_quota_started=0 & qa_quota_seen=0 & qa_quota_calls=0 & qa_quota_pages=0 & qa_quota_stale_result=0 & qa_quota_stale_link=0 & qa_quota_next=0 & qa_quota_reports=0'];
 const finish=check('spawn_semen='+job.gain+' and spawn_milked='+job.counter,'FINAL_VALUES')+check('master_energy=qa_quota_master_after and '+(job.role||'slave')+"['energy']=qa_quota_actor_after",'NO_REPEAT_ENERGY')+"savegame '"+name+"-complete.sav'\r\nmsg '"+marker+"'\r\n";
 prefix('interaction','qa_quota_calls+=1');
 if(job.unit){
  boot.push('pet_tentacle=1 & tentacle_size=4 & spawn_milked=0 & tentacle_state=1',check("func('jo9_household_worker','tentacle_ready')=1",'READY'),
   'spawn_milked=5',check("func('jo9_household_worker','tentacle_ready')=0",'COUNTER_BLOCK'),'spawn_milked=0 & tentacle_state=2',check("func('jo9_household_worker','tentacle_ready')=0",'STATE_BLOCK'),'tentacle_state=1 & pet_tentacle=0',check("func('jo9_household_worker','tentacle_ready')=0",'ABSENT_BLOCK'),'pet_tentacle=1 & spawn_milked=4',check("func('jo9_household_worker','tentacle_ready')=1",'BOUNDARY'),"gs 'jo9_household_worker','tentacle_spent',0,0",check('spawn_milked=4 and tentacle_state=1','ZERO_NO_GAIN'),"gs 'jo9_household_worker','tentacle_spent',0,12",check('spawn_milked=5 and tentacle_state=2','ZERO_GAIN_ONE'));
  for(const [i,role]of ['slave','assistant','room1','room2','room3','room4'].entries()){boot.push(role+"_state=1 & "+role+"['age']=2 & "+role+"['energy']=5 & "+role+"['tentacle_rule']=1 & "+role+"['sub_tentacles']="+(i===2?5:2));}
  boot.push('spawn_milked=0 & tentacle_state=1',check("$func('jo9_household_worker','tentacle')='slave'",'SLAVE_PRIORITY'),"slave['tentacle_rule']=0",check("$func('jo9_household_worker','tentacle')='assistant'",'ASSISTANT_PRIORITY'),"assistant['tentacle_rule']=0",check("$func('jo9_household_worker','tentacle')='room1'",'ROOM_WINNER'),'tentacle_state=2',check("$func('jo9_household_worker','tentacle')=''",'WORKER_EXHAUSTED'),"savegame '"+name+"-complete.sav'",'msg '+q(marker));
 }else if(job.auto){
  boot.push('qa_quota_decade_before=decade_semen','menu_form=0',"gt 'menu_form'");prefix('next_day','qa_quota_next+=1');
  tail('end_day_screen',"qa_quota_pages+=1\r\nif decade_semen = qa_quota_decade_before+201 and qa_quota_reports=0:\r\n"+check("jo9_tentacle_report['room1_gain']=201 and spawn_semen=201 and spawn_milked=5 and tentacle_state=2",'AUTO_ROOM_ONCE')+"qa_quota_reports=1\r\nend\r\n"+ui(name+'_forward',"/forward_button[.]png/.test(as[i].innerHTML)"));
  tail('main_screen',"if qa_quota_next=0:\r\n"+ui(name+'_begin',"h.indexOf('next_day')>=0")+"else\r\n"+check('qa_quota_next=1 and qa_quota_reports=1 and spawn_semen=201 and decade_semen=qa_quota_decade_before+201','AUTO_RETURN')+"savegame '"+name+"-complete.sav'\r\nmsg '"+marker+"'\r\nend");
 }else{
  const role=job.role||'slave',callback=job.lesson?(role==='assistant'?7022:1354):(role==='assistant'?45:59),entry='main_screen';
  boot.push('pet_tentacle=1 & tentacle_size='+job.size+' & spawn_milked=0 & tentacle_state=1 & spawn_semen=0',role+"['sub_tentacles']="+job.skill+' & '+role+"['virginity']="+job.special,role+"['obedience']=100 & "+role+"['energy']=5 & master_energy=5",'master_excitement=3',"slave['tentacle_rule']=0 & assistant['tentacle_rule']="+(role==='assistant'?1:0),'city_district=-1','menu_form='+(job.lesson?(role==='assistant'?235:135):(role==='slave'?5:0)),"gt 'menu_form'");
  tail('interaction_screen',"qa_quota_pages+=1\r\nif qa_quota_seen=0:\r\n"+check('spawn_semen='+job.gain+' and spawn_milked='+job.counter,'FIRST_EFFECT')+(job.old?'':check('tentacle_state='+(job.noStale?1:2),'FIRST_STATE'))+"qa_quota_seen=1\r\nqa_quota_master_after=master_energy\r\nqa_quota_actor_after="+role+"['energy']\r\nend\r\n"+ui(name+'_forward',"/forward_button[.]png/.test(as[i].innerHTML)"));
  let enterCode='qa_quota_started=1 & ';if(job.noStale)enterCode+=role+"['jo9_meiki_known']=0 & ";if(job.preExhaust)enterCode+='spawn_milked=5 & tentacle_state=2 & ';
  let returned="if qa_quota_started=0:\r\n"+ui(name+'_begin',"(/interaction *= *"+callback+"(?:[^0-9]|$)/).test(h)",enterCode,true)+"else\r\n";
  if(job.blocked)returned+=check('qa_quota_seen=0 and spawn_semen=0 and spawn_milked=5 and tentacle_state=2 and master_energy=5 and '+role+"['energy']=5 and menu_form=0",'BLOCKED_NO_EFFECT')+"qa_quota_master_after=master_energy & qa_quota_actor_after="+role+"['energy']\r\n";
  else returned+=check('qa_quota_seen=1 and spawn_semen='+job.gain+' and spawn_milked='+job.counter,'REPORT_RETURN');
  if(job.old||job.noStale)returned+=finish;
  else returned+="if qa_quota_stale_result=0:\r\n"+bridge("qa_quota_stale_result=1 & gt 'interaction_result'")+"elseif qa_quota_stale_link=0:\r\n"+bridge('qa_quota_stale_link=1 & dynamic $qa_quota_old')+"else\r\n"+finish+"end\r\n";
  returned+='end\r\n';if(job.lesson)returned='if menu_form='+(role==='assistant'?235:135)+' or qa_quota_started=1:\r\n'+returned+'end\r\n';tail(entry,returned);
 }
 set('Start',boot.join('\r\n'));const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint:job.unit?'Native shared-ready/consume and slave→assistant→room priority':job.auto?'Original next-day anchor, original report and forward objects, return once':'Original fantasy anchor, native effects, full forward return; exhausted cached setup/result commands rejected'});manifest.push({name,sourceHash:c.hash(world),seed:seedFile,seedHash:c.hash(seed),job,narrativeLiteralsEdited:0,nonfantasyBranchExecuted:false});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');fs.writeFileSync(out+'/prepared.json',JSON.stringify({candidate:c.hash(raw),baseline:c.hash(baseline),cases:manifest,preparedOnly:true,limits:['Numeric adult fixtures only; original narrative and callbacks retained. No real-animal branch selected.','DOM synthetic clicks are native QtWebKit events, not physical mouse verification.','Only stage counters and remembered commands prepend original menu hrefs. Original result and forward objects remain unchanged.','Input saves are read/primed in diagnostic copies, not modified. Current production and candidate are never written.']},null,2)+'\n');
let runner=fs.readFileSync('G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','utf8').replace(/^\uFEFF+/,'').replace("if($probeLog -match 'showMessage\\(\\)')","if($probeLog -match 'showMessage\\(\\), str:\\s*\"FAIL_')");fs.writeFileSync(out+'/runner.ps1','\uFEFF'+runner);
console.log(JSON.stringify({out,cases:plan.length,candidate:c.hash(raw),preparedOnly:true}));
