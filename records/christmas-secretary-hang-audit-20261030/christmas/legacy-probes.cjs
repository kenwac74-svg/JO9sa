'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',out='G:/Codex/tmp/jo9-christmas-audit-20261030/legacy';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),hash=c.hash(raw);
a.equal(hash,'1e8e489eb4a2c6412f81af0e50b69d409bc9ffd5d5edb69e2308cd3e9f71bc7c');
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n');
const check=(x,n)=>`if (${x})=0: msg 'FAIL_${n}' & exit\n`;
const q=s=>"'"+s.replaceAll("'","''")+"'";
fs.mkdirSync(out,{recursive:true});const plans=[];
function make(name,start,locs){
 const marker='JO9_QA_XMAS_'+name.replaceAll('-','_')+'_COMPLETE';
 const entries=[['Start','killall\nautosave=0\nsound_on=0\n'+start+'\nmsg '+q(marker)],...Object.entries(locs)];
 const p={lines:d.lines.slice(0,4)};p.lines[3]=c.shift(String(entries.length),-5);
 for(const[n,b]of entries)p.lines.push(c.shift(n,-5),'',c.shift(cr(b),-5),c.shift('0',-5));p.lines.push('');
 const bytes=c.serialize(p);qa.inspectWorld(bytes);const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plans.push({name,file,marker,checkpoint:'Current original scoped saved-state boundary, not an actual user SAV load'});
}
const options=body('#options'),start=options.indexOf('$edge_of_mists[10384] = {'),block=options.slice(start,options.indexOf('\r\n}',start)+3);
const prefix=body('shop_general').slice(0,body('shop_general').indexOf('npc = 0'));
make('legacy-prebattle',block+"\n$place='Grinch_battle'\ninteraction_city=10384\nget_weapon=0\nsp_txt=14\n$sp_text[14]='LEGACY INTRO'\n$display_options[14]={qa_wrong=1}\ngs 'probe'\n"+check("sp_txt=10384 and $sp_text[10384]='LEGACY INTRO'",'LEGACY_INDEX')+"dynamic $display_options[sp_txt]\n"+check("qa_wrong=0 and instr($text_display,'начать_бой')>0",'LEGACY_LINK'),{'probe':prefix,'_layout':'','colosseum_fight':'','$menu':body('$menu')});
make('weapon-page-guard',"$place='Grinch_battle'\ninteraction_city=901\nget_weapon=1\nsp_txt=1\n$display_options[1]={qa_weapon=1}\ngs 'probe'\ndynamic $display_options[sp_txt]\n"+check('get_weapon=1 and sp_txt=1 and qa_weapon=1','WEAPON_UNCHANGED'),{'probe':prefix,'_layout':'','colosseum_fight':''});
make('stale-fate-reset',"jo9_fate['mode']=1\njo9_fate['phase']=3\njo9_fate['count']=2\njo9_fate_enemy[1]=1\n$place='Grinch_battle'\nколичество_врагов=1\n$враг[1]='grinch'\ngs 'jo9_battle_fate','init','normal'\n"+check("jo9_fate['mode']=0 and jo9_fate['phase']=0 and jo9_fate['count']=0 and arrsize('jo9_fate_enemy')=0",'STALE_FATE'),{'jo9_battle_fate':body('jo9_battle_fate')});
fs.writeFileSync(out+'/plan.json',JSON.stringify(plans,null,2));
const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json'],{encoding:'utf8',windowsHide:true,timeout:60000});
fs.writeFileSync(out+'/runner.log',r.stdout+'\n'+r.stderr);
const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
console.log(JSON.stringify({hash,exit:r.status,results}));
fs.writeFileSync(out+'/report.json',JSON.stringify({hash,exit:r.status,results,limits:['Scoped current QSP paths only; no actual unknown user SAV was available.','Current game and user saves were not written.']},null,2));
