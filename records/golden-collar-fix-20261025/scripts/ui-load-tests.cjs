'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-golden-collar-fix-20261025',out=root+'/ui-load';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(root+'/candidate.qsp'),before=c.parse(fs.readFileSync(root+'/before.qsp')),body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const def=(b,name)=>{const s=b.indexOf(name+' = {'),e=b.indexOf('\r\n}',s);a(s>=0&&e>s);return b.slice(s,e+3);};
const oldProperty=def(body(before,'#item_base'),"$item_property['golden_collar']");
fs.mkdirSync(out,{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf','content/pic/buttons/approve.png','content/pic/buttons/deny.png','content/pic/msg_bg.png','content/pic/buttons/ok-icon.png']){fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,out+'/'+rel);}
fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/JO9_TEST_20261023_01_HOME.sav'))).code;
const plan=[];
for(const mode of ['yes','no','legacy-pending','legacy-accepted','legacy-refunded','unrelated']){
 const d=c.parse(raw),set=(n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);
 const marker='JO9_QA_GCUI_'+mode.replaceAll('-','_')+'_COMPLETE';
 const setup=`usehtml=1
${prime}
$onnewloc='' & $counter=''
gs 'refresh_database'
$onnewloc='' & $counter=''
sound_on=0 & nsfw=1 & snk_room_target=0
slave_state=0 & assistant_state=0 & cow_state=0
prisoner_state=CONST_INT['slave_exist']
prisoner_type=2571 & prisoner['id']=71401 & prisoner['age']=2
$prisoner_name='검사 대상'
prisoner['passion_luxury']=0 & prisoner['obedience']=-1 & prisoner['beaten_ever']=0 & prisoner['domini_dictum']=0
$prisoner_psy_status='qa_rebell' & rebell['qa_rebell']=1
prisoner['calories']=50 & prisoner['ego']=2 & prisoner['virtue']=3 & prisoner['sin']=1 & prisoner['stamina']=3 & prisoner['sensitivity']=1 & prisoner['wounds']=0 & prisoner['hygiene']=0
$prisoner['collar']='golden_collar' & prisoner_inventory['golden_collar']=0
master_str=2 & master_fighter=1 & master_str_rate=0 & is_kid=0
day=102 & sparks=19995 & jo9_lq['active']=0 & jo9_lq['bill']=375
$return_lock=''
qa_ui_loaded=0 & qa_ui_clicks=0
`;
 let start=setup;
 if(mode.startsWith('legacy'))start+=oldProperty+'\n';
 if(mode==='unrelated'){
  start+="$yes='QA unrelated yes' & $no='QA unrelated no'\ngt 'choice_screen'";
 }else start+="dynamic $replace($item_property['golden_collar'],'dyn'+'slave','prisoner')\nmsg 'FAIL_GCUI_NO_PROMPT'";
 set('Start',start);
 const js=`(function(){function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function fail(s){var a=document.createElement('a');a.href="EXEC: msg 'FAIL_GCUI_"+s+"'";document.body.appendChild(a);click(a)}var sent=false,n=0;function tick(){var m=document.getElementById('__message__');if(m){var a=document.querySelector('a[href="api/closemsg"]');if(!a){if(++n<100)setTimeout(tick,30);else fail('MSG_CLOSE_MISSING');return}var r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!a.contains(hit)){fail('MSG_COVERED');return}click(a);return}var a=document.querySelector('#${mode==='no'?'deny':'approve'} a');if(!a){if(++n<100)setTimeout(tick,30);else fail('BUTTON_MISSING');return}var r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!a.contains(hit)||r.width<=0||r.height<=0){fail('BUTTON_COVERED');return}if(!sent){sent=true;click(a)}setTimeout(tick,30)}setTimeout(tick,150)}());`;
 let choice=body(d,'choice_screen');
 if(mode==='unrelated')choice="gs '#item_base','golden_collar_load'\nif $yes!'QA unrelated yes' or $no!'QA unrelated no': msg 'FAIL_GCUI_UNRELATED' & exit\nmsg '"+marker+"'\nexit";
 else if(mode.startsWith('legacy')){
  const state=mode==='legacy-accepted'?"prisoner['beaten_ever']=1\n":mode==='legacy-refunded'?"$prisoner['collar']='пусто' & prisoner_inventory['golden_collar']=1\n":'';
  choice="if qa_ui_loaded=0:\n qa_ui_loaded=1\n "+state+" gs '#item_base','golden_collar_load'\nend\n"+choice;
  if(mode==='legacy-pending')choice+="\nif instr($yes,'GC_CHOICE_20261025')=0 or $return_lock!'menu_form': msg 'FAIL_GCUI_LEGACY' & exit\nmsg '"+marker+"'\nexit";
 }else choice+="\n$qa_callback="+(mode==='yes'?'$yes':'$no')+"\n*p "+q('<script type="text/javascript">'+js+'</script>')+'\n';
 set('choice_screen',choice);
 let arrival="if day!102 or sparks!19995 or jo9_lq['bill']!375 or jo9_lq['active']!0: msg 'FAIL_GCUI_BILL' & exit\n";
 if(mode==='yes')arrival+="if prisoner['beaten_ever']!1 or prisoner['beaten']!1 or prisoner['calories']!49 or master_str_rate!1 or prisoner['neg_forced']!2 or prisoner['virtue']!0 or prisoner_rate['bruises']<=0: msg 'FAIL_GCUI_FORCE' & exit\n";
 if(mode==='no')arrival+="if $prisoner['collar']!'пусто' or prisoner_inventory['golden_collar']!1 or master_str_rate!0 or prisoner['calories']!50: msg 'FAIL_GCUI_REFUND' & exit\n";
 if(mode==='legacy-accepted')arrival+="if prisoner['beaten_ever']!1 or prisoner_inventory['golden_collar']!0 or prisoner['calories']!50: msg 'FAIL_GCUI_LEGACY_ACCEPTED' & exit\n";
 if(mode==='legacy-refunded')arrival+="if prisoner_inventory['golden_collar']!1 or prisoner['calories']!50: msg 'FAIL_GCUI_LEGACY_REFUNDED' & exit\n";
 if(mode==='yes'||mode==='no')arrival+="dynamic $qa_callback\nif $yes!'' or $no!'': msg 'FAIL_GCUI_NOT_CONSUMED' & exit\n";
 arrival+="msg '"+marker+"'\nexit";
 set('menu_form',arrival);set('prison_cell',arrival);
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+mode+'.qsp';fs.writeFileSync(file,bytes);plan.push({name:mode,file,marker,checkpoint:'Actual choice_screen, original DOM EXEC links, native force/MSG and live legacy cache restoration. Destination rendering instrumented.'});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));
let ps=fs.readFileSync(repo+'/tools/qa/run-client-smoke.ps1','utf8').replace("if($probeLog -match 'showMessage\\(\\)')","if($probeLog -match 'showMessage\\(\\), str:\\s*\"FAIL_')");fs.writeFileSync(out+'/runner.ps1',ps);
if(!process.argv.includes('--run')){console.log('Prepared '+plan.length+' native UI/load fixtures');process.exit();}
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:205000,maxBuffer:1000000});
const results=fs.existsSync(out+'/client-results.json')?JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,'')):[];
const report={status:run.status===0&&results.length===plan.length&&results.every(x=>x.pass)?'PASS':'FAIL',results,stdout:run.stdout,stderr:run.stderr,candidate:c.hash(raw),limits:['Representative adult prisoner state primed from save, not the reporters actual save.','Original UI EXEC anchors synthetically clicked inside installed native engine, pointer hit-tested; no external mouse automation.','Destination instrumented to check effects and prevent unrelated gameplay. Full day cycle covered separately.']};fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));a.equal(report.status,'PASS');
