'use strict';
const fs=require('fs'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/chunhyang-menu-links-20261112',tmp='G:/Codex/tmp/chunhyang-menu-links-20261112';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const json=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);
fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(tmp,{recursive:true});
const phase=process.argv[2],variant=process.argv[3]||'before';
const boot="killall\nautosave=0\ndecadesave=0\nsound_on=0\n$onnewloc=''\n$ongload=''\n$ongsave=''\n$counter=''\nsettimer 0\nsnk_room_target=0\nhero_choice=1\ngs '#variative'\ngs '#static_base'\ngs '#dynamic'\ngs '#var_base'\ngs '#options'\ngs '#противники'\negeya_lose=1\njo9_chunhyang['open']=1\nday=20\nsparks=250000\nmaster_str=5\nmaster_fighter=6\nmaster_cha=5\nmaster_domination=5\nmaster_energy=5\nmaster_hygiene=5\nbull_ring_on=1\nsnake_amulet_on=1\n$master_armor='без_брони'\n$master_name='QA'\n$master_ava='content/pic/empty.png'\n$estate='slum_house'\n$place='catfightclub'\nui_style=2\ngame_difficulty=2\ndifficulty_setting=2\ncheat_fight_dif=1\nslave_state=CONST_INT['slave_exist']\nslave_type=1000\n$slave_name='QA slave'\nslave['age']=2\nslave['stamina']=5\nslave['gladiatrix']=5\nslave['gladiatrix_affinity']=1\nslave['ego']=3\nslave['energy']=5\nslave['arena_level']=0\nslave['jo9_chun_entries']=0\nslave['brand']=1\n";
function done(name){return "\nsavegame '"+name+".sav'\nmsg 'JO9_QA_CHUNMENU_"+name.replaceAll('-','_')+"_COMPLETE'\nexit";}
function base(){const raw=fs.readFileSync(variant==='candidate'?tmp+'/candidate.qsp':game+'/jack.qsp'),d=c.parse(raw);assert(c.serialize(d).equals(raw));if(variant==='after'){let n=0;put(d,'jo9_chun_club',body(d,'jo9_chun_club').replace(/"gt 'jo9_chun_club','(\w+)'"/g,(_,mode)=>{n++;return "'gt \"jo9_chun_club\",\""+mode+"\"'";}));assert.equal(n,7);}return d;}
function fixture(name,code,mutate){const d=base();if(mutate)mutate(d);put(d,'Start',boot+code+done(name));const raw=c.serialize(d);qa.inspectWorld(raw);fs.writeFileSync(tmp+'/'+name+'.qsp',raw);return{name,file:tmp+'/'+name+'.qsp',marker:'JO9_QA_CHUNMENU_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Actual generated links and native dispatch'};}
if(phase==='capture'){
 const plan=[fixture(variant+'-capture',"gs 'jo9_chun_club','menu'\n$qa_open=$text_display\njo9_chunhyang['won']=1\njo9_chunhyang['owned']=1\nslave_state=CONST_INT['no_slave']\ngs 'jo9_chun_club','city'\n$qa_city=$text_display\ngs 'jo9_chun_club','menu'\n$qa_claim=$text_display\n")];json(tmp+'/plan.json',plan);fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');console.log(variant+' capture ready');
}else if(phase==='extract'){
 const name=variant+'-capture',s=sc.parse(fs.readFileSync(tmp+'/'+name+'.sav')),val=n=>s.vars.find(v=>v.name===n.toUpperCase())?.values[0]?.[1]||'';
 const pages={open:val('qa_open'),city:val('qa_city'),claim:val('qa_claim')};for(const [key,html]of Object.entries(pages))fs.writeFileSync(rec+'/'+variant+'-'+key+'.html',html);json(rec+'/'+variant+'-capture.json',{sourceHash:c.hash(fs.readFileSync(variant==='candidate'?tmp+'/candidate.qsp':game+'/jack.qsp')),pages});fs.copyFileSync(tmp+'/'+name+'-stderr.log',rec+'/'+name+'-native.log');console.log('Captured '+Object.keys(pages).join(', '));
}else if(phase==='routes'){
 const links=read(rec+'/'+variant+'-links.json').open,plan=[];
 for(const key of (process.argv[4]?process.argv[4].split(','):(variant==='before'?['leave','watch']:['about','duel','pref','style','supply','leave','watch']))){
  const link=links.find(x=>x.key===key);assert(link,key);const name=variant+'-'+key,command=link.href.replace(/^EXEC:\s*/i,'');
  // Capture actual route targets. Start invokes exactly the browser-parsed href.
  const targets={about:'shop_general',pref:'shop_general',duel:'shop_general',style:'shop_general',supply:'slave_sell',leave:'city_screen',watch:'interaction_screen_city'};
  const noticeFlags="saved_game_loaded=0\n$ongload='qa_unused'\n$game_ver='잭 오 나인 테일 v2.4.1 Kor Ver'\none_time_conversion_of_interaction_counter_arrays=4\n";
  plan.push(fixture(name,noticeFlags+"interaction_city=904030\nsp_txt=1\n$display_options[1]={gs 'jo9_chun_club','menu'}\ndynamic {"+command+"}\nmsg 'FAIL_CHUNMENU_NO_ROUTE_"+key+"'\nexit",d=>{
   const target=targets[key],checks=key==='about'?"if instr($sp_text[1],'대쥬신제국')=0: msg 'FAIL_ABOUT_TEXT' & exit":key==='pref'?"if instr($sp_text[1],'체력이 A 이상')=0: msg 'FAIL_PREF_TEXT' & exit":key==='duel'?"if $place ! 'chunhyang_battle' or get_weapon ! 1: msg 'FAIL_DUEL_START' & exit":key==='style'?"if sp_txt ! 3: msg 'FAIL_STYLE' & exit":key==='supply'?"if $npc_id ! 'chunhyang': msg 'FAIL_SUPPLY' & exit":key==='leave'?"if city_form ! 121 or $place ! 'eastkvartal_district': msg 'FAIL_LEAVE' & exit":"if interaction_city ! 102019: msg 'FAIL_WATCH' & exit";
   if(key==='duel'){put(d,target,body(d,target)+"\nif qa_duel_repaint=0: qa_duel_repaint=1 & gt 'shop_general'\nif len($sp_text[1])-len(replace($sp_text[1],'[춘향]','')) ! 4: msg 'FAIL_REPEATED_DUEL_INTRO' & exit");} const visual=['about','pref','duel','style','supply','watch'].includes(key)?"\nif instr($maintxt,'content/pic/bg/chunhyang.png')=0: msg 'FAIL_SCENE_BACKGROUND' & exit\nif instr($maintxt,'width=\"795\" height=\"596\"')=0: msg 'FAIL_SCENE_SIZE' & exit\n":''; put(d,target,body(d,target)+'\n'+checks+visual+'\n$qa_render=$maintxt'+done(name));
  }));
 }
 json(tmp+'/plan.json',plan);console.log('Route fixtures: '+plan.length);
}else if(phase==='results'){
 const latest=read(tmp+'/client-results.json'),file=rec+'/'+variant+'-routes.json',prior=fs.existsSync(file)?read(file):[];for(const row of latest){const i=prior.findIndex(x=>x.name===row.name);if(i>=0)prior[i]=row;else prior.push(row);fs.copyFileSync(tmp+'/'+row.name+'-stderr.log',rec+'/'+row.name+'-native.log');}json(file,prior);console.log(JSON.stringify(prior));
}else throw Error('Unknown phase');
