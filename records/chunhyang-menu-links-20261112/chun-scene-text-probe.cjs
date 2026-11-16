'use strict';
const fs=require('fs'),assert=require('assert/strict');const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/chunhyang-menu-links-20261112',tmp='G:/Codex/tmp/chunhyang-menu-links-20261112/text-probe';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);
const source=fs.readFileSync(rec+'/chun-menu-probe.cjs','utf8'),boot=JSON.parse(source.match(/const boot=("(?:\\.|[^"\\])*");/)[1]);
const strip=s=>s.split(/\r?\n/).filter(l=>!l.startsWith('! JO9 MOD ')).join('\n');const shared=strip(body('interaction_city').match(/! JO9 MOD START CHUNHYANG_CLUB_TEXT_20261112[\s\S]*?! JO9 MOD END CHUNHYANG_CLUB_TEXT_20261112/)[0]);const sale=strip(body('slave_sell').match(/! JO9 MOD START CHUNHYANG_SUPPLY_VOICE_20261112[\s\S]*?! JO9 MOD END CHUNHYANG_SUPPLY_VOICE_20261112/)[0]);
let code=boot+"saved_game_loaded=0\n$ongload='qa_unused'\n$game_ver='잭 오 나인 테일 v2.4.1 Kor Ver'\none_time_conversion_of_interaction_counter_arrays=4\n";
code+="egeya_lose=0\ninteraction_city=103001\n$text[1]='LEGACY_EGEYA_SENTINEL'\ndynamic {"+shared+"}\nif $text[1] ! 'LEGACY_EGEYA_SENTINEL': msg 'FAIL_LEGACY_TEXT_CHANGED' & exit\nqa_checks+=1\n";
code+="$npc_id='egeya'\n$text[1]='PRICE_SENTINEL'\nsl_txt=1\ndynamic {"+sale+"}\nif $text[1] ! 'PRICE_SENTINEL': msg 'FAIL_OTHER_BUYER_CHANGED' & exit\nqa_checks+=1\n";
for(const [i,value]of [100,101,102,103,104,105,1,2,3].entries())code+='qa_sale_cases['+i+']='+value+'\n';
code+="$npc_id='chunhyang'\nfor qa_case=0 to 8:\n sl_txt=qa_sale_cases[qa_case]\n $text[1]='PRICE_SENTINEL'\n dynamic {"+sale+"}\n if instr($text[1],'PRICE_SENTINEL') ! 1 or instr($text[1],'[춘향]') = 0: msg 'FAIL_SUPPLY_TEXT' & exit\n qa_checks+=1\nend\negeya_lose=1\nqa_scene_step=1\ninteraction_city=103001\ngt 'interaction_city'\n";
const capture=`
if qa_scene_step=1:
 if instr($text[1],'[춘향]')=0 or instr($text[1],'다음 선수는')=0 or instr($text[1],'소오오개')>0: msg 'FAIL_REGULAR_INTRO_VOICE' & exit
 if $special_image[1] ! 'bg\\chunhyang.png' or $text[2]='': msg 'FAIL_REGULAR_INTRO_IMAGES' & exit
 if instr($maintxt,'content/pic/bg/chunhyang.png')=0: msg 'FAIL_REGULAR_INTRO_RENDER' & exit
 qa_checks+=3
 $qa_intro=$maintxt
 qa_scene_step=2
 jo9_fate['mode']=2
 jo9_fate['phase']=3
 jo9_fate['choice']=2
 interaction_city=103005
 gt 'interaction_city'
end
if qa_scene_step=2:
 if instr($text[1],'[춘향]')=0 or instr($text[1],'약속한 상금')=0: msg 'FAIL_REGULAR_WIN_VOICE' & exit
 if instr($text[1],'살려주기로')=0 or instr($text[1],'상금: $100')=0 or purse ! 100: msg 'FAIL_WIN_FACTS_PRESERVED' & exit
 qa_checks+=2
 $qa_win=$maintxt
 savegame 'scene-text.sav'
 msg 'JO9_QA_CHUNSCENE_text_COMPLETE'
 exit
end
`;
put('Start',code);put('interaction_screen_city',body('interaction_screen_city')+capture);const out=c.serialize(d);qa.inspectWorld(out);fs.mkdirSync(tmp+'/content/pic/bg',{recursive:true});fs.writeFileSync(tmp+'/scene-text.qsp',out);fs.copyFileSync(game+'/content/pic/bg/chunhyang.png',tmp+'/content/pic/bg/chunhyang.png');fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(tmp+'/plan.json',JSON.stringify([{name:'scene-text',file:tmp+'/scene-text.qsp',marker:'JO9_QA_CHUNSCENE_text_COMPLETE',checkpoint:'Legacy and other buyers preserved,9 supply dialogues,real intro/mercy win and payout preserved'}],null,2));console.log('Scene text diagnostic ready');
