'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const crc=require('../colosseum-slave-death-save-20261029/native-helper/fastqsp-crc.cjs');
const OUT=__dirname,resume=process.argv.includes('--resume'),T=resume?JSON.parse(fs.readFileSync(OUT+'/snapshot.json','utf8')).tempRoot:'G:/Codex/tmp/portal-paladin-event-saves-20261102-'+Date.now();
const raw=fs.readFileSync(G+'/jack.qsp'),expected='6bb939464a7370526ced33c6b51fcb4f0b5023b94bbe1d1bd78dba6bec44398d';a.equal(c.hash(raw),expected);
const cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const get=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const set=(d,n,s)=>{d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);};
function add(d,n,b){d.lines.splice(-1,0,c.shift(n,-5),'',c.shift(cr(b),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.locations=c.parse(c.serialize(d)).locations;}
const prior=fs.readFileSync(R+'/records/full-client-build-20261031/build-test-saves.cjs','utf8');
const common=vm.runInNewContext('('+prior.match(/const common=(\[[^\n]+\]);/)[1]+')');
const base=c.parse(raw),price=get(base,'#static_base');
const generalSkills=[...new Set([...price.matchAll(/skill_sum\s*(?:\+=|=)\s*dynslave\['([^']+)'\]/g)].map(x=>x[1]))];a(generalSkills.length>12);
const advancedSkills=[...new Set([...price.matchAll(/dynslave\['sex_sum'\]\s*(?:\+=|=)\s*dynslave\['([^']+)'\]/g)].map(x=>x[1]))];a.equal(advancedSkills.length,9);
const subSkills=[...get(base,'#variative').matchAll(/\$sex_atr\[\d+\]\s*=\s*'([^']+)'/g)].map(x=>x[1]);a.equal(subSkills.length,39);
const companionStats=[...new Set([...generalSkills,...advancedSkills,...subSkills,'stamina','sensitivity','temper','intellect','ego','base_beauty','beauty','fame','prestige','style','exotic','devotion','moral','instinct','custom','rational'])];
const masterStats=['str','cha','style','libido','tutor','fighter','butler','artdirector','medic','mage','torture','domination','bondage','flagelation','petting','oral','penetration','fetish','stamina'];
const cases=[{id:'guardian',name:'TC_09_PORTAL_GUARDIAN_EVENT.sav',paladin:2,target:62172,prep:6216,enemy:'strazhnik'},{id:'paladin',name:'TC_10_VATICAN_PALADIN_EVENT.sav',paladin:1,target:62171,prep:6215,enemy:'vatican_paladin'}];
fs.mkdirSync(T,{recursive:true});fs.mkdirSync(OUT+'/ready',{recursive:true});
for(const n of ['json','css','fonts','content'])if(!fs.existsSync(T+'/'+n))fs.symlinkSync(fs.realpathSync(G+'/'+n),T+'/'+n,'junction');
fs.copyFileSync(G+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const manifest={createdAt:new Date().toISOString(),tempRoot:T,source:G+'/jack.qsp',sourceSha256:expected,workCrc:crc.crc(raw),generalSkills,advancedSkills,companionStats,masterStats,privateSavesRead:false,workWritten:false,fullWritten:false,guiLoadVerified:false,created:[]};
fs.writeFileSync(OUT+'/snapshot.json',JSON.stringify(manifest,null,2)+'\n');
function run(id,file,marker){const plan=T+'/'+id+'-plan.json';fs.writeFileSync(plan,JSON.stringify([{name:id,file,marker,checkpoint:'Native SAVEGAME and original portal callback route'}]));const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',G+'/engine/jack.exe','-Plan',plan,'-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:60000});fs.writeFileSync(OUT+'/'+id+'-runner.log',(r.stdout||'')+(r.stderr||''));for(const ext of ['stderr.log','stdout.log'])if(fs.existsSync(T+'/'+id+'-'+ext))fs.copyFileSync(T+'/'+id+'-'+ext,OUT+'/'+id+'-'+ext);a.equal(r.status,0,'Native run failed '+id+': '+r.stdout+' '+r.stderr);}
function readSave(file){const b=fs.readFileSync(file),s=sc.parse(b);a(sc.serialize(s).equals(b));return {b,s};}
function requireValue(s,n,v,key){a.equal(sc.value(s,n,key)[0],String(v),n+' '+(key||''));}
for(const spec of cases){
 const dir=T+'/'+spec.id;fs.mkdirSync(dir+'/out',{recursive:true});
 // Resource junctions resolve relative to each diagnostic world's location.
 for(const n of ['json','css','fonts','content'])if(!fs.existsSync(dir+'/'+n))fs.symlinkSync(fs.realpathSync(G+'/'+n),dir+'/'+n,'junction');
 fs.copyFileSync(G+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const d=c.parse(raw);
 set(d,'Start',["killall","gs 'refresh_database'","gs 'init_game'","$master_name='잭'","hero_choice=13","$estate='white_house'","$onnewloc=''","$counter=''","$ongload='$ongload'","$code_rev='2.4.1'","$title_fix='잭 오 나인 테일 v<<$code_rev>> Kor Ver'","$game_ver=$title_fix","one_time_conversion_of_interaction_counter_arrays=1","newloc_do_once_per_game=1","settimer 0","tc_portal=0","gt 'start_game'"].join('\n'));
 set(d,'main_screen',get(d,'main_screen')+"\nif tc_portal=0: tc_portal=1 & gt 'tc_portal_boot'");
 const setup=[...common,...masterStats.map(k=>'master_'+k+'=5'),...['slave','assistant'].flatMap(role=>companionStats.map(k=>role+"['"+k+"']=5")),...['slave','assistant'].flatMap(role=>[...companionStats.map(k=>role+"_rate['"+k+"']=0"),...['beauty','fame','style','exotic'].map(k=>role+"_rate['"+k+"']=cont_atr_max"),...['bruises','scars','hygiene','wounds'].map(k=>role+"_rate['"+k+"']=0"),...['perfume','manicure','epilation','hairstyle'].map(k=>role+"['"+k+"']=1"),role+"['fat']=1",role+"['ill']=0",role+"['parasite']=0"]),"difficulty_setting=0","game_difficulty=0","cheat_fight_dif=0","master_energy=5","master_half_action=0","sparks=10000","гладиус=1","$master_right_wpn='гладиус'","$master_left_wpn='безоружный'","$master_armor='без_брони'","is_home=0","city_district=6","city_form=120","$place='fogs_district'","$return_lock='city_menu_form'","active[$quest[17]]=2","бой_с_паладином="+spec.paladin,"бой_с_паладиом=0","бой_со_стражником=0","npc_progress['pope']=2","master_check=0","master_visage=1","master_haircut=1","master_hygiene_rate=0","noble_msg=1","interaction_city=0","combatant=0","tc_portal=2","gt 'city_menu_form'"];
 if(spec.id==='paladin'){
  const pendingTraits=[...new Set([...price.matchAll(/dynslave\['([^']+_revealed)'\]/g)].map(x=>x[1]))];
  setup.splice(-2,0,...['slave','assistant'].flatMap(role=>pendingTraits.map(k=>"if "+role+"['"+k+"']=1: "+role+"['"+k+"']=2")));
 }
 fs.writeFileSync(OUT+'/'+spec.id+'-setup.json',JSON.stringify(setup,null,2)+'\n');add(d,'tc_portal_boot',setup.join('\n'));
 const guard="city_form!120 or $place!'fogs_district' or slave_type!2579 or assistant_type!2571 or slave_state!1 or assistant_state!1 or get_weapon!0 or количество_врагов!0 or active[$quest[17]]!2";
 set(d,'city_screen',get(d,'city_screen')+"\nif tc_portal=2:\n if "+guard+": msg 'FAIL_PORTAL_CITY_GUARD' & exit\n if instr($text_display,'6217')=0: msg 'FAIL_PORTAL_CITY_LINK' & exit\n killvar 'TC_PORTAL'\n savegame 'out/city-native.sav'\n tc_portal=3\n dynamic $menu_links[1]\nend");
 const forwardObject='<img src = "content/pic/ui/buttons/legacy/forward_button.png">';
 const selector="if $selobj = "+q(forwardObject)+":";a.equal(get(d,'$objsel').split(selector).length,2);
 // Only the selector input is adapted in this diagnostic world. The original
 // forward branch body is retained, but this does not verify native UI selection.
 set(d,'$objsel',get(d,'$objsel').replace(selector,"if $args[0] = "+q(forwardObject)+":"));
 set(d,'interaction_screen_city',get(d,'interaction_screen_city')+"\nif tc_portal=3 and interaction_city=6217:\n if txt<1 or txt>3 or arrsize('$text')!4: msg 'FAIL_PORTAL_INTRO' & exit\n savegame 'out/intro<<txt>>.sav'\n gs '$objsel', "+q(forwardObject)+"\nend");
 set(d,'shop_general',get(d,'shop_general')+"\nif tc_portal=3:\n if $place='fogs_street' and interaction_city=6217:\n  if sp_txt!1 or instr($text_display,'"+spec.target+"')=0: msg 'FAIL_PORTAL_TARGET_LINK' & exit\n  savegame 'out/portal-menu.sav'\n  dynamic $menu_links[0]\n end\n if interaction_city="+spec.prep+":\n  if sp_txt!"+spec.prep+" or $враг[1]!"+q(spec.enemy)+" or get_weapon!0 or instr($text_display,'싸운다')=0: msg 'FAIL_PORTAL_PREPARATION' & exit\n  savegame 'out/preparation.sav'\n  local $tc_join = $strfind($text_display, 'EXEC: ([^'']+)', 1)\n  if instr($tc_join,'начать_бой')=0: msg 'FAIL_PORTAL_BATTLE_CALLBACK' & exit\n  dynamic $tc_join\n end\n if interaction_city=901:\n  if get_weapon!1 or $справа!'гладиус' or гладиус<1 or instr($text_display,'오른손')=0: msg 'FAIL_PORTAL_WEAPON_MENU' & exit\n  savegame 'out/weapon-menu.sav'\n  msg 'JO9_QA_PORTALSAVE_route_COMPLETE'\n end\nend");
 // Keep the world directly under the plan root; its explicit output path is per case.
 // Work directory is the plan root, while relative resources resolve to the world directory.
 // SAVEGAME filenames use case-specific relative paths accepted by this client.
 for(const n of ['city_screen','interaction_screen_city','shop_general'])set(d,n,get(d,n).replaceAll("'out/",q(spec.id+'/out/').slice(0,-1)));
 const factory=c.serialize(d);qa.inspectWorld(factory);fs.writeFileSync(T+'/'+spec.id+'-factory.qsp',factory);
 if(!(resume&&fs.existsSync(dir+'/out/weapon-menu.sav')))run(spec.id+'-factory',T+'/'+spec.id+'-factory.qsp','JO9_QA_PORTALSAVE_route_COMPLETE');
 const nativeFile=dir+'/out/city-native.sav',{b:native,s}=readSave(nativeFile);a.equal(Number(sc.dec(s.lines[2])),crc.crc(factory),'Native CRC equals helper on exact factory bytes');
 a.equal(sc.dec(s.lines[10]),'city_screen');a.equal(sc.value(s,'place')[1],'fogs_district');requireValue(s,'city_form',120);requireValue(s,'hero_choice',13);requireValue(s,'game_difficulty',0);requireValue(s,'difficulty_setting',0);requireValue(s,'cheat_fight_dif',0);requireValue(s,'master_energy',5);requireValue(s,'sparks',10000);requireValue(s,'slave_type',2579);requireValue(s,'assistant_type',2571);requireValue(s,'slave_state',1);requireValue(s,'assistant_state',1);requireValue(s,'бой_с_паладином',spec.paladin);requireValue(s,'бой_с_паладиом',0);requireValue(s,'бой_со_стражником',0);requireValue(s,'npc_progress',2,'pope');requireValue(s,'гладиус',1);requireValue(s,'количество_врагов',0);requireValue(s,'get_weapon',0);
 for(const role of ['slave','assistant']){requireValue(s,role,2,'age');for(const k of companionStats.filter(k=>k!=='prestige'))requireValue(s,role,5,k);for(const k of ['cooks_rule','cleans_rule','washes_master_rule','blowjob_rule'])requireValue(s,role,0,k);}
 for(const k of masterStats)requireValue(s,'master_'+k,5);for(const k of ['autosave','decadesave','autosave_day','autosave_decade'])requireValue(s,k,0);
 const quest=s.vars.find(v=>v.name==='QUEST').values[17][1];a(quest);requireValue(s,'active',2,quest);
 a.equal(sc.value(s,'ongload')[1],'$ongload');const helperVariables=s.vars.filter(v=>v.name==='TC_PORTAL');a.equal(helperVariables.length,1);a.equal(helperVariables[0].values.length,0);a.equal(helperVariables[0].idx.length,0);const helperSlots=helperVariables.map(v=>v.slot);
 const leaked=s.vars.flatMap(v=>v.values.map(x=>x[1])).filter(x=>/tc_portal|JO9_QA_PORTALSAVE|FAIL_PORTAL_/i.test(x));a.equal(leaked.length,0,'No saved helper scripts');
 s.lines[2]=sc.enc(crc.crc(raw));const final=sc.serialize(s);a(sc.serialize(sc.parse(final)).equals(final));
 const staged=OUT+'/ready/'+spec.name;if(fs.existsSync(staged))a(fs.readFileSync(staged).equals(final),'Do not overwrite differing prior staged save');else fs.writeFileSync(staged,final);a(crc.verify(G+'/jack.qsp',staged).pass);
 // Confirm each native-rendered introduction page produced a checkpoint.
 for(let page=1;page<=3;page++){
  const v=readSave(dir+'/out/intro'+page+'.sav');a.equal(sc.dec(v.s.lines[10]),'interaction_screen_city');requireValue(v.s,'txt',page);a(v.s.vars.find(v=>v.name==='TEXT').values[page][1]);
 }
 const menu=readSave(dir+'/out/portal-menu.sav'),prep=readSave(dir+'/out/preparation.sav'),weapon=readSave(dir+'/out/weapon-menu.sav');
 a.equal(sc.dec(menu.s.lines[10]),'shop_general');a(sc.value(menu.s,'text_display')[1].includes(String(spec.target)));a.equal(sc.value(prep.s,'враг','1')[1]||prep.s.vars.find(v=>v.name==='ВРАГ').values[1][1],spec.enemy);requireValue(prep.s,'sp_txt',spec.prep);requireValue(weapon.s,'get_weapon',1);a.equal(sc.value(weapon.s,'справа')[1],'гладиус');requireValue(weapon.s,'гладиус',1);
 const prepHtml=sc.dec(prep.s.lines[8]);
 const row={...spec,file:staged,bytes:final.length,sha256:c.hash(final),nativeCrc:crc.crc(factory),nativeCrcMatchesHelper:true,crc:crc.crc(raw),location:'city_screen',place:'fogs_district',cityForm:120,quest17:quest,activeQuestValue:2,slaveType:2579,assistantType:2571,slaveState:1,assistantState:1,helperVariables:1,emptyHelperSlots:helperSlots,helperScriptLeaks:0,nativeSlotsPreserved:true,nativePayloadPreservedExceptHeader2:true,masterEnergy:5,masterHalfAction:0,slavePrestige:+sc.value(s,'slave','prestige')[0],assistantPrestige:+sc.value(s,'assistant','prestige')[0],allScriptsKept:true,route:{actualCityMenuLink:true,introPages:3,originalForwardBranchBody:true,forwardSelectorAdapted:true,nativeObjectSelectionVerified:false,targetMenu:spec.target,preparation:spec.prep,enemy:spec.enemy,weaponMenu:true,gladiusOwned:1,guiClicks:false,combatRun:false},nativeOriginal:nativeFile,diagnosticFolder:dir,prepHtmlContainsRetiredScene:/scene[\\/]?(vatican_paladin|strazhnik)/i.test(prepHtml)};
 manifest.created.push(row);fs.writeFileSync(OUT+'/created.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(row));
}
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),expected,'Source unchanged');manifest.sourceUnchanged=true;fs.writeFileSync(OUT+'/created.json',JSON.stringify(manifest,null,2)+'\n');
