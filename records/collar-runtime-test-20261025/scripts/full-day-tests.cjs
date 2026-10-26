'use strict';
// Only disposable QSP copies are instrumented. Actual game locations and callbacks remain in use.
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const out='G:/Codex/tmp/jo9-collar-runtime-20261025/day';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),save=fs.readFileSync(game+'/save/JO9_TEST_20261023_01_HOME.sav');
a.equal(c.hash(raw),'a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a');
const cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
fs.mkdirSync(out,{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf','content/pic/buttons/forward_button.png','content/pic/buttons/approve.png','content/pic/buttons/deny.png','content/pic/msg_bg.png','content/pic/buttons/ok-icon.png']){fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,out+'/'+rel);}
fs.cpSync(game+'/json',out+'/json',{recursive:true});
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const prime=qa.primeState(sc.parse(save)).code;
function uiScript(kind,button){
 return `(function(){function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function fail(s){var a=document.createElement('a');a.href="EXEC: msg 'FAIL_GCDAY_"+s+"'";document.body.appendChild(a);click(a)}var sent=false,n=0;function tick(){var m=document.getElementById('__message__');if(m){var a=document.querySelector('a[href="api/closemsg"]');if(!a){if(++n<160)setTimeout(tick,30);else fail('MSG_CLOSE_MISSING');return}var r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!a.contains(hit)){fail('MSG_COVERED');return}click(a);setTimeout(tick,40);return}if(sent){setTimeout(tick,40);return}var a;${kind==='continue'?`var imgs=document.getElementsByTagName('img');for(var i=0;i<imgs.length;i++){if(/forward_button[.]png/.test(imgs[i].getAttribute('src')||'')){a=imgs[i];while(a&&a.tagName.toLowerCase()!=='a')a=a.parentNode;if(a)break}}`:`a=document.querySelector('#${button} a');`}if(!a){if(++n<160)setTimeout(tick,30);else fail('${kind.toUpperCase()}_BUTTON_MISSING');return}var r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!a.contains(hit)||r.width<=0||r.height<=0){fail('${kind.toUpperCase()}_BUTTON_COVERED');return}sent=true;click(a);setTimeout(tick,40)}setTimeout(tick,180)}());`;
}
const script=(kind,button)=>'*p '+q('<script type="text/javascript">'+uiScript(kind,button).replaceAll('var r=a.getBoundingClientRect()','var r=(a.querySelector("img")||a).getBoundingClientRect()').replace("fail('"+kind.toUpperCase()+"_BUTTON_COVERED')","fail('"+kind.toUpperCase()+"_BUTTON_COVERED_'+[r.left,r.top,r.width,r.height,hit&&hit.tagName,hit&&hit.id,hit&&hit.className,hit&&hit.outerHTML.slice(0,220)].join('_').replace(/[^a-zA-Z0-9_:.=-]/g,'_'))")+'</script>');
const plans=[];
const modes=process.argv.includes('--ordinary')?['yes','no']:['yes','no','bill-yes','bill-no'];
for(const name of modes){
 const bill=name.startsWith('bill'),yes=name.endsWith('yes'),startDay=bill?109:102;
 const d=c.parse(raw),loc=n=>{const l=d.locations.find(l=>l.name===n);a(l,n);return l;};
 const body=n=>c.shift(d.lines[loc(n).body],5),set=(n,s)=>d.lines[loc(n).body]=c.shift(cr(s),-5);
 const marker='JO9_QA_GCDAY_'+name.replaceAll('-','_')+'_COMPLETE';
 set('Start',`usehtml=1
${prime}
$onnewloc='' & $counter=''
gs 'refresh_database'
$onnewloc='' & $counter=''
sound_on=0 & nsfw=1 & snk_room_target=0
autosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0
slave_state=0 & assistant_state=0 & cow_state=0 & farmhand_state=0 & harpy_state=0 & pig_state=0
room1_state=0 & room2_state=0 & room3_state=0 & room4_state=0
pet_tentacle=0 & is_home=1 & city_district=-1 & menu_form=0 & exam_in_progress=0
prisoner_state=CONST_INT['slave_exist']
prisoner_type=2571 & prisoner['id']=71401 & prisoner['age']=2
$prisoner_name='검사 대상'
prisoner['passion_luxury']=0 & prisoner['obedience']=-100 & prisoner['beaten_ever']=0 & prisoner['beaten']=0 & prisoner['domini_dictum']=0
$prisoner_psy_status='arrogant' & $prisoner_psy_basic='arrogant'
prisoner['calories']=50 & prisoner['fat']=3 & prisoner['ego']=2 & prisoner['virtue']=3 & prisoner['sin']=1
prisoner['stamina']=3 & prisoner['sensitivity']=1 & prisoner['wounds']=0 & prisoner['hygiene']=0 & prisoner['energy']=3
prisoner['temper']=2 & prisoner['intellect']=2 & prisoner['pride']=3 & prisoner['instinct']=2
prisoner['prison_food_type']=0 & prisoner['prison_drink']=0 & prisoner['prison_bedding']=2 & prisoner['prison_light']=1
$prisoner['collar']='golden_collar' & prisoner_inventory['golden_collar']=0
master_str=2 & master_fighter=1 & master_str_rate=0 & is_kid=0
day=${startDay} & decadecount=${bill?9:2} & decade=10 & end_day_phase=0
sparks=20000 & jo9_lq['active']=0 & jo9_lq['bill']=375
$return_lock=''
qa_next_count=0 & qa_billing_count=0 & qa_menu_count=0 & qa_main_count=0 & qa_end_count=0 & qa_reset_count=0
qa_force_count=0 & qa_choice_count=0 & qa_forward_count=0 & qa_duplicate_phase=0
savegame '${name}-start.sav'
gs 'next_day'
msg 'FAIL_GCDAY_NEXT_DAY_RETURNED'`);
 set('next_day','qa_next_count+=1\n'+body('next_day'));
 set('billing','qa_billing_count+=1\n'+body('billing'));
 set('menu_form','qa_menu_count+=1\n'+body('menu_form'));
 set('$end_day_variable_reset','qa_reset_count+=1\n'+body('$end_day_variable_reset'));
 set('$objsel',`if $selobj = '<img src = "content\\pic\\buttons\\forward_button.png">': qa_forward_count+=1\n`+body('$objsel'));
 set('end_day_screen','qa_end_count+=1\n'+body('end_day_screen')+'\n'+script('continue'));
 const dyn=body('#dynamic');a(dyn.includes('$dyn_slave_forced = {\r\n'));
 set('#dynamic',dyn.replace('$dyn_slave_forced = {\r\n','$dyn_slave_forced = {\r\n qa_force_count+=1\r\n'));
 set('choice_screen',body('choice_screen')+`
qa_choice_count+=1
if qa_choice_count!1 or qa_next_count!1 or qa_reset_count!1 or day!${startDay+1} or end_day_phase!0: msg 'FAIL_GCDAY_CHOICE_ROUTE' & exit
if $return_lock!'menu_form' or instr($yes,'GC_CHOICE_20261025')=0 or prisoner['beaten_ever']!0: msg 'FAIL_GCDAY_REFUSAL_STATE' & exit
qa_choice_sparks=sparks & qa_choice_bill=jo9_lq['bill'] & qa_choice_food=total_food_cost & qa_choice_calories=prisoner['calories']
qa_choice_str_rate=master_str_rate & qa_choice_bruises=prisoner_rate['bruises']
$qa_callback=${yes?'$yes':'$no'}
savegame '${name}-choice.sav'
${script('choice',yes?'approve':'deny')}`);
 const check=`if day!${startDay+1} or qa_next_count!1 or qa_reset_count!1 or qa_choice_count!1 or qa_forward_count<1 or end_day_phase!0: msg 'FAIL_GCDAY_DAY_REPEAT' & exit
if jo9_lq['bill']!375 or jo9_lq['active']!0 or qa_billing_count!${bill?1:0}: msg 'FAIL_GCDAY_BILL_COUNT' & exit
if $yes!'' or $no!'': msg 'FAIL_GCDAY_CALLBACK_NOT_CONSUMED' & exit
${bill?"if decadecount!0 or decade!11 or sparks!qa_choice_sparks+barn_total_profit-final_payment: msg 'FAIL_GCDAY_BILL_AMOUNT' & exit":"if sparks!qa_choice_sparks or total_food_cost!qa_choice_food or decadecount!3 or decade!10: msg 'FAIL_GCDAY_ECONOMIC_REPEAT' & exit"}
${yes?"if qa_force_count!1 or prisoner['beaten_ever']!1 or prisoner['beaten']!1 or prisoner['calories']!qa_choice_calories-1 or master_str_rate!qa_choice_str_rate+1 or prisoner['virtue']!0 or prisoner_rate['bruises']<=qa_choice_bruises or prisoner_inventory['golden_collar']!0: msg 'FAIL_GCDAY_FORCE_ONCE' & exit":"if qa_force_count!0 or $prisoner['collar']!'пусто' or prisoner_inventory['golden_collar']!1 or prisoner['calories']!qa_choice_calories or master_str_rate!qa_choice_str_rate: msg 'FAIL_GCDAY_REFUND_ONCE' & exit"}
if qa_duplicate_phase=0:
 qa_duplicate_phase=1
 qa_first_sparks=sparks & qa_first_food=total_food_cost & qa_first_bruises=prisoner_rate['bruises'] & qa_first_main=qa_main_count
 savegame '${name}-first-main.sav'
 dynamic $qa_callback
 gt 'menu_form'
end
if sparks!qa_first_sparks or total_food_cost!qa_first_food or prisoner_rate['bruises']!qa_first_bruises or qa_main_count!qa_first_main+1: msg 'FAIL_GCDAY_DUPLICATE_EFFECT' & exit
savegame '${name}-complete.sav'
msg '${marker}'`;
 set('main_screen','qa_main_count+=1\n'+body('main_screen')+'\n'+check);
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plans.push({name,file,marker,checkpoint:'Actual next_day -> native forward object clicks -> end_day reset -> menu equipment refusal -> native Y/X/MSG -> actual menu/main including billing -> duplicate callback -> actual menu/main'});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plans,null,2));
let ps=fs.readFileSync(repo+'/tools/qa/run-client-smoke.ps1','utf8').replace("if($probeLog -match 'showMessage\\(\\)')","if($probeLog -match 'showMessage\\(\\), str:\\s*\"FAIL_')");
fs.writeFileSync(out+'/runner.ps1',ps);
if(!process.argv.includes('--run')){console.log('Prepared '+plans.length+' full day fixtures');process.exit();}
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:205000,maxBuffer:1000000});
const results=fs.existsSync(out+'/client-results.json')?JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,'')):[];
const keys=['DAY','DECADE','DECADECOUNT','SPARKS','TOTAL_FOOD_COST','FINAL_PAYMENT','BARN_TOTAL_PROFIT','QA_NEXT_COUNT','QA_BILLING_COUNT','QA_MENU_COUNT','QA_MAIN_COUNT','QA_END_COUNT','QA_RESET_COUNT','QA_FORCE_COUNT','QA_CHOICE_COUNT','QA_FORWARD_COUNT','QA_DUPLICATE_PHASE','QA_CHOICE_SPARKS','QA_CHOICE_FOOD','QA_CHOICE_CALORIES','QA_CHOICE_STR_RATE'];
const snapshots={};for(const plan of plans){snapshots[plan.name]={};for(const stage of ['start','choice','first-main','complete']){const f=out+'/'+plan.name+'-'+stage+'.sav';if(fs.existsSync(f)){const s=sc.parse(fs.readFileSync(f));snapshots[plan.name][stage]=Object.fromEntries(keys.map(n=>[n,s.vars.find(v=>v.name===n)?.values[0]]).filter(v=>v[1]));}}}
const report={status:run.status===0&&results.length===plans.length&&results.every(x=>x.pass)?'PASS':'FAIL',candidate:c.hash(raw),sourceSaveHash:c.hash(save),results,snapshots,stdout:run.stdout,stderr:run.stderr,instrumentedLocations:['Start','next_day','billing','menu_form','$end_day_variable_reset','$objsel','end_day_screen','#dynamic','choice_screen','main_screen'],limits:['Representative adult prisoner state primed from HOME save, not reporter actual save.','Original engine DOM forward object and Y/X EXEC anchors synthetically clicked and hit-tested; no external mouse automation.','Actual locations, GT destinations, callbacks, helper bodies, day processing, reset, equipment recalculation, and billing retained. Only counters, snapshots, assertions, and UI-driving scripts are added to diagnostic copy.']};
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));a.equal(report.status,'PASS');
