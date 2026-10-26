'use strict';
// Read-only reproduction. Writes one isolated diagnostic world under G:/Codex/tmp only.
// The normal game, JSON, assets, saves, and Full installation are never written.
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const root=path.resolve(process.argv[2]||'G:/Codex/tmp/jo9-catfight-return-audit-20261026-repro');
if(!root.replaceAll('\\','/').startsWith('G:/Codex/tmp/')||fs.existsSync(root))throw Error('Use a new task directory under G:/Codex/tmp');
const source=fs.readFileSync(game+'/jack.qsp');
if(c.hash(source)!=='060295923fd646e87148dc0e900ef7acce92e1086b6376e1f1fc9d12298513b7')throw Error('Expected source hash changed');
const d=c.parse(source),cr=s=>s.replace(/\r?\n/g,'\r\n');
const loc=n=>{const l=d.locations.find(x=>x.name===n);if(!l)throw Error(n);return l;};
const body=n=>c.shift(d.lines[loc(n).body],5),set=(n,s)=>d.lines[loc(n).body]=c.shift(cr(s),-5);
const prefix=(n,s)=>set(n,s+'\n'+body(n)),tail=(n,s)=>set(n,body(n)+'\n'+s);
const check=(e,id)=>`if (${e})=0: msg 'FAIL_CFRETURN_${id}' & exit\n`,q=s=>"'"+s.replaceAll("'","''")+"'";
const prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/JO9_TEST_20261023_01_HOME.sav'))).code;
set('Start',`usehtml=1\n${prime}\n$onnewloc='' & $counter=''\ngs 'refresh_database'\n$onnewloc='' & $counter=''\nautosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0\nsnk_room_target=0 & is_home=0 & game_difficulty=0\nday=102 & sparks=10000 & master_energy=5 & master_half_action=0\nslave_state=CONST_INT['slave_exist'] & assistant_state=CONST_INT['slave_exist']\nslave['id']=91401 & assistant['id']=91402 & slave['age']=2 & assistant['age']=2\nslave_type=2571 & assistant_type=2571 & $slave_name='Adult QA Slave' & $assistant_name='Adult QA Assistant'\nslave['stamina']=50 & assistant['stamina']=50 & slave['gladiatrix']=50 & assistant['gladiatrix']=50\nslave['energy']=5 & assistant['energy']=5 & slave['catfight_level']=1\nsp_txt_is_set_from_save=0 & txt_is_set_from_save=0 & get_weapon=0 & colosseum_fight=0\nqa_cf_case=0 & qa_cf_arrivals=0 & qa_cf_forward=0 & qa_cf_pages=0\ngt 'jo9_qa_cf_next'`);
let next='qa_cf_case+=1\n';
for(let i=0;i<4;i++)next+=`if qa_cf_case=${i+1}:\n hero_choice=${i<2?1:101}\n interaction_city=${i%2===0?103004:103005}\n $return_lock='goto_loc'\n city_form=0\n gt 'interaction_city'\nend\n`;
next+="msg 'FAIL_CFRETURN_NO_CASE'";
const count=d.locations.length;
d.lines.splice(-1,0,c.shift('jo9_qa_cf_next',-5),c.shift('',-5),c.shift(cr(next),-5),c.shift('0',-5));d.lines[3]=c.shift(String(count+1),-5);
const js=`(function(){function tick(){var as=document.getElementsByTagName('a');for(var i=0;i<as.length;i++){if(/forward_button[.]png/.test(as[i].innerHTML)){var im=as[i].querySelector('img')||as[i],r=im.getBoundingClientRect();if(r.width<=0||r.height<=0)continue;var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,r.left+r.width/2,r.top+r.height/2,false,false,false,false,0,null);as[i].dispatchEvent(e);return}}setTimeout(tick,60)}setTimeout(tick,120)}());`;
tail('interaction_screen_city',check("$return_lock='city_menu_form' and city_form=121",'RESULT_DESTINATION')+`qa_cf_pages+=1\n*p ${q('<script type="text/javascript">'+js+'</script>')}\n`);
prefix('$objsel',`if $selobj='<img src = "content\\pic\\buttons\\forward_button.png">': qa_cf_forward+=1\n`);
prefix('city_menu_form',check("city_form=121 and $return_lock='city_menu_form'",'ARRIVAL')+`qa_cf_arrivals+=1\n`+check('qa_cf_arrivals=qa_cf_case','CASE_ORDER')+`if qa_cf_case<4: gt 'jo9_qa_cf_next'\n`+check('qa_cf_arrivals=4 and qa_cf_forward=6 and qa_cf_pages=6','FOUR_CASES_SIX_FORWARD')+`msg 'JO9_QA_CFRETURN_results_COMPLETE'\nexit\n`);
const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.mkdirSync(root,{recursive:true});fs.writeFileSync(root+'/results.qsp',bytes);
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf']){fs.mkdirSync(path.dirname(root+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,root+'/'+rel);}
for(const rel of ['content','json'])fs.symlinkSync(game+'/'+rel,root+'/'+rel,'junction');
fs.writeFileSync(root+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(root+'/plan.json',JSON.stringify([{name:'results',file:root.replaceAll('\\','/')+'/results.qsp',marker:'JO9_QA_CFRETURN_results_COMPLETE',checkpoint:'Original interaction_city103004/103005 x hero1/101 -> original Qt forward objects -> original city_menu_form entry121'}],null,2));
console.log(JSON.stringify({root,sourceSha256:c.hash(source),diagnosticSha256:c.hash(bytes)}));
// Run hidden with tools/qa/run-client-smoke.ps1 -Engine <WORK/game/engine/jack.exe> -Plan <root/plan.json> -TimeoutSeconds 25.
// Preserve logs, then delete only this diagnostic directory; remove junction entries without following targets first.