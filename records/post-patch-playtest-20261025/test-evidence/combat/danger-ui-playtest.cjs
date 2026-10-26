'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',out='G:/Codex/tmp/jo9-post-patch-playtest-20261025/combat/danger';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),hash=c.hash(raw),prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/JO9_TEST_20261023_01_HOME.sav'))).code;
const cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",get=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
const drafts=JSON.parse(fs.readFileSync(repo+'/records/combat-danger-dialogue-20261025/drafts.json','utf8')),cases=[];
for(const x of drafts.drafts){cases.push({...x,day:x.event===61112?2:1});if(x.event===61112)cases.push({...x,day:1});}
fs.mkdirSync(out,{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf']){fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});if(!fs.existsSync(out+'/'+rel))fs.copyFileSync(game+'/'+rel,out+'/'+rel);}
for(const rel of ['content','json'])if(!fs.existsSync(out+'/'+rel))fs.symlinkSync(game+'/'+rel,out+'/'+rel,'junction');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
function add(n,s){const count=d.locations.length;d.lines.splice(-1,0,c.shift(n,-5),'',c.shift(cr(s),-5),c.shift('0',-5));d.lines[3]=c.shift(String(count+1),-5);}
const check=(expr,id)=>`if (${expr})=0: msg 'FAIL_DANGER_UI_${id}_<<qa_step>>' & exit\n`;
set('Start',`usehtml=1\n${prime}\n$onnewloc='' & $counter=''\ngs 'refresh_database'\n$onnewloc='' & $counter=''\nautosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0\nqa_step=0 & qa_dom_count=0 & qa_battle_count=0\ngt 'qa_danger_next'`);
let step=`qa_step+=1\nif qa_step>16:\n`+check('qa_dom_count=16 and qa_battle_count=0','TOTALS')+`savegame 'danger-complete.sav'\nmsg 'JO9_QA_DANGER_ui_COMPLETE'\nexit\nend\n$place='edge_patrol' & is_home=0 & colosseum_fight=0 & get_weapon=0 & snk_room_target=0\nmaster_energy=5 & slave['energy']=5 & assistant['energy']=5 & sparks=1234\nslave_state=CONST_INT['slave_exist'] & assistant_state=CONST_INT['slave_exist']\nslave['age']=2 & assistant['age']=2\ncombatant=77 & $итог_боя='QA_NOT_SELECTED'\ncity_already_done_ever[611]=0\n`;
cases.forEach((x,i)=>step+=`if qa_step=${i+1}: interaction_city=${x.event} & day=${x.day} & $qa_hint=${q(x.text)}\n`);
step+="gt 'interaction_city'";add('qa_danger_next',step);
let tail=check("instr($maintxt,$qa_hint)>0 and instr($maintxt,'<div id=\"jo9_scene_menu\"')>instr($maintxt,$qa_hint)",'SOURCE_ORDER')+check("master_energy=5 and slave['energy']=5 and assistant['energy']=5 and sparks=1234 and combatant=77 and $итог_боя='QA_NOT_SELECTED'",'UNCHARGED');
for(let i=0;i<cases.length;i++){
 const hint=JSON.stringify(cases[i].text);
 const js=`(function(){var n=0;function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function call(code){var a=document.createElement('a');a.href='EXEC: '+code;document.body.appendChild(a);click(a)}function tick(){var menu=document.getElementById('jo9_scene_menu'),hint=${hint},all=document.body.innerText||'',as=document.getElementsByTagName('a'),fight=0;for(var i=0;i<as.length;i++)if((as[i].getAttribute('href')||'').indexOf('jo9_fog_relay')>=0)fight++;if(!menu||all.indexOf(hint)<0||fight!==3){if(++n<80){setTimeout(tick,50);return}call("msg 'FAIL_DANGER_UI_DOM_"+${i+1}+"'");return}var walker=document.createTreeWalker(document.body,4,null,false),node,found=null;while(node=walker.nextNode()){if((node.nodeValue||'').indexOf(hint)>=0){found=node;break}}if(!found||(found.compareDocumentPosition(menu)&4)===0){call("msg 'FAIL_DANGER_UI_ORDER_"+${i+1}+"'");return}call("qa_dom_count+=1 & gt 'qa_danger_next'")}setTimeout(tick,180)}());`;
 tail+=`if qa_step=${i+1}:\n*p ${q('<script type="text/javascript">'+js+'</script>')}\nend\n`;
}
set('shop_general',get('shop_general')+'\n'+tail);
for(const n of ['начать_бой','$catfight_fight_start','$gladiator_fight_start'])set(n,'qa_battle_count+=1\n'+get(n));
// Check untouched arena/catfight source contains none of the new fog hints.
const exclusions=['$catfight_fight_start','$gladiator_fight_start','colosseum_fight'];
const exclusionChecks=exclusions.map(n=>({location:n,containsHint:cases.some(x=>get(n).includes(x.text))}));a(exclusionChecks.every(x=>!x.containsHint));
const file=out+'/danger-ui.qsp';qa.inspectWorld(c.serialize(d));fs.writeFileSync(file,c.serialize(d));
fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'danger-ui',file,marker:'JO9_QA_DANGER_ui_COMPLETE',checkpoint:'16 original encounters -> real shop render -> native DOM hint and 3 fight links -> test next case'}],null,2));
const runner=fs.readFileSync(repo+'/tools/qa/run-client-smoke.ps1','utf8');fs.writeFileSync(out+'/runner.ps1',runner);
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:1000000});
const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
const report={hash,exit:run.status,results,cases:cases.map(x=>({event:x.event,day:x.day,hintHash:c.hash(Buffer.from(x.text))})),exclusionChecks,limits:['Native Qt DOM is inspected after actual encounter and shop rendering. Only diagnostic navigation between independent encounters is injected.','No fight callback is selected in this pre-choice display test. Actual fog fight callbacks are covered by native-playtest.cjs.','Arena exclusion is source-level verification, not an exhaustive arena UI playthrough.']};
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
