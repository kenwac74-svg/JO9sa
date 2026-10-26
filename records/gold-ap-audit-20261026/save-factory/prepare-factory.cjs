'use strict';
// One-case native full-table save factory. No WORK writes, no fake variable slots.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/gold-test-save-20261026',record=repo+'/records/gold-ap-audit-20261026/save-factory';
const c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const source=work+'/jack.qsp',base=work+'/save/JO9_MANUAL_20261025/01_검사완료재확인/02_prod-size1.sav';
const raw=fs.readFileSync(source),baseRaw=fs.readFileSync(base),d=c.parse(raw),input=s.parse(baseRaw);
assert.equal(c.hash(raw),'ed7f14b5a892f2dc695e8b90a29dfd1331c31536b604911fb2fddd9af8107648');assert(s.serialize(input).equals(baseRaw));
assert.equal(s.value(input,'SLAVE_TYPE')[0],'2579');assert.equal(s.value(input,'ASSISTANT_TYPE')[0],'2571');assert.equal(s.value(input,'ASSISTANT','age')[0],'2');
assert(!input.vars.some(v=>/^(QA_|JO9SV_)/.test(v.name)));
const required=['DEATH','ITEM_PRICE','ITEM_DESCRIPTION','ITEM_DEMO','МОДИФИКАТОР_ХОЛОДНОЕ_ЖЕЛЕЗО','МОДИФИКАТОР_СЕРЕБРО','БЕЗУСТАЛИ','МОДИФИКАТОР_СВЕТ','ХРУПКИЙ','В_ОТКЛЮЧКЕ','МОДИФИКАТОР_ПСИХИЧЕСКИЙ','ТРУП','БЕССТРАШНЫЙ','МОДИФИКАТОР_ТЬМА','БЕССМЕРТНЫЙ'];
for(const name of required){const v=input.vars.find(v=>v.name===name);assert(v&&!v.idx.some(x=>x[0]===0),'Missing unaliased scalar '+name);}
const q=x=>"'"+String(x).replace(/'/g,"''")+"'",cr=x=>x.replace(/\r?\n/g,'\r\n');
function get(n){const l=d.locations.find(l=>l.name===n);assert(l,n);return c.shift(d.lines[l.body],5);}
function set(n,text){const l=d.locations.find(l=>l.name===n);assert(l,n);d.lines[l.body]=c.shift(cr(text),-5);}
function add(n,text){assert(!d.locations.some(l=>l.name===n));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift(n,-5),c.shift('',-5),c.shift(cr(text),-5),c.shift('0',-5));d.locations=c.parse(c.serialize(d)).locations;}
const setup=[
"usehtml=1","snk_room_target=0","snk_room_inventory=0","gs 'refresh_database'",
"autosave=0","decadesave=0","autosave_day=0","autosave_decade=0","sound_on=0",
"$ongload='$ongload'","$ongsave=''","$counter=''","$onnewloc=''","settimer 0",
"jo9_lq['active']=0","end_of_the_day=0","end_day_phase=0","exam_in_progress=0",
"cheat_inf_en=0","bull_ring_on=0","easy_for_master=0","easy_for_assistant=0","easy_for_slave=0",
"creating_clone=0","cheat_h=0","cheat_j=0","cheat_k=0","cheat_l=0","get_girl=0",
"special_stock=2617","gs 'generate_stock'","gs 'stock_to_slave_nogt'","gs '$slave_price'",
"slave['brand']=0","tattoo_brand=0","unique_slave['jasmine']=1","npc_progress['jasmine']=1",
"active[$event['Akabur_quest']]=12","lost_quest_slave=0","lost_quest_slave_jasmine=0",
"Jasmine_job=0","first_job_in_a_balsam_boutique=0",
"gold=0","sparks=5000","master_energy=5","master_half_action=0",
"assistant['energy']=5","assistant['half_action']=0","assistant['jo9_voice_trait']=0",
"slave['energy']=5","slave['half_action']=0",
"is_home=0","city_district=1","city_form=121","menu_form=0","interaction_city=3021","sp_txt=1",
"skip_to=0","txt=0","txt_count=0","get_weapon=0","colosseum_fight=0","not_safe=0",
"$info_text=''","$bg_path=''","$special_bg=''","killvar '$special_image'","killvar '$special_action'",
"jo9sv_ready=1","gt 'interaction_city'"
];
const guard="$place='balsam_boutique' and interaction_city=3021 and sp_txt=1 and gold=0 and sparks=5000 and slave_type=2617 and assistant_type=2571 and slave_state=1 and assistant_state=1 and slave['age']=0 and assistant['age']=2 and master_energy=5 and master_half_action=0 and assistant['energy']=5 and assistant['half_action']=0 and assistant['jo9_voice_trait']=0 and cheat_inf_en=0 and bull_ring_on=0 and Jasmine_job=0 and first_job_in_a_balsam_boutique=0 and active[$event['Akabur_quest']]=12 and unique_slave['jasmine']=1 and npc_progress['jasmine']=1 and lost_quest_slave=0 and lost_quest_slave_jasmine=0";
set('Start',"usehtml=1\r\n*pl '<p>Native full-state factory. Use Game - Load and select input.sav.</p>'");
set('shop_general',get('shop_general')+"\r\ngs 'jo9sv_emit_gold_ap'");
add('jo9sv_boot_gold_ap',setup.join('\n'));
add('jo9sv_emit_gold_ap',"if jo9sv_ready=1:\n if "+guard+":\n  killvar 'JO9SV_READY'\n  savegame 'out/factory-native.sav'\n else\n  msg 'SAVE_FACTORY_GUARD_FAILED'\n end\nend");
const inputHook=input.vars.find(v=>v.name==='ONGLOAD');assert(inputHook);const originalHook=inputHook.values[0][1];assert.equal(originalHook,'$ongload');inputHook.values[0][1]='jo9sv_boot_gold_ap';
fs.mkdirSync(root+'/out',{recursive:true});fs.mkdirSync(root+'/staged',{recursive:true});fs.mkdirSync(record,{recursive:true});
for(const p of [root+'/live.qsp',root+'/input.sav',root+'/work.qsp'])assert(!fs.existsSync(p),'Do not overwrite '+p);
const world=c.serialize(d);qa.inspectWorld(world);fs.writeFileSync(root+'/live.qsp',world,{flag:'wx'});fs.writeFileSync(root+'/input.sav',s.serialize(input),{flag:'wx'});fs.writeFileSync(root+'/work.qsp',raw,{flag:'wx'});
fs.copyFileSync(work+'/config.xml',root+'/config.xml');fs.writeFileSync(root+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
for(const part of ['content','css','fonts','json']){const dest=root+'/'+part;assert(!fs.existsSync(dest));fs.symlinkSync(work+'/'+part,dest,'junction');}
const recipe={schema:1,source,sourceSha256:c.hash(raw),baseSave:base,baseSha256:c.hash(baseRaw),baseBytes:baseRaw.length,inputSave:root+'/input.sav',inputSha256:c.hash(s.serialize(input)),factoryQsp:root+'/live.qsp',workCopy:root+'/work.qsp',factoryOutput:root+'/out/factory-native.sav',stagedOutput:root+'/staged/ready-for-work.sav',finalNativeOutput:root+'/out/JO9_GOLD_AP_CHECK_20261026.sav',target:work+'/save/JO9_GOLD_AP_CHECK_20261026.sav',inputOnlyChangedExistingField:'ONGLOAD[0].string',originalLoadCallback:originalHook,goldSlotInitiallyPresent:input.vars.some(v=>v.name==='GOLD'),goldSlotAllocatedBy:'native gold=0 assignment after full native Load',scalarRepairsNeeded:0,setup,guard,refresh:'Full native variable-table Load then current refresh_database. No qa.primeState/literal table rebuild.',images:'Full state retains seed arrays including Jasmine2617; production resources linked read-only.',userOriginalsPreserved:true,guiLaunched:false,limits:['One representative full save with explicit test-state changes; does not preserve the replaced test actor as the active slave. Original base save remains untouched.','Final CRC must come from native Save in byte-identical work.qsp. Factory CRC is not a production checksum.','Native Game/Load and Save are needed only for manufacture. No gameplay or strict-CRC reload test is requested. OPENGAME is not saved-state loading in this installed client.']};
fs.writeFileSync(root+'/recipe.json',JSON.stringify(recipe,null,2)+'\n');fs.writeFileSync(record+'/recipe.json',JSON.stringify(recipe,null,2)+'\n');
fs.copyFileSync(__filename,record+'/prepare-factory.cjs');
assert.equal(c.hash(fs.readFileSync(source)),recipe.sourceSha256);assert.equal(c.hash(fs.readFileSync(base)),recipe.baseSha256);
console.log(JSON.stringify({prepared:true,factory:recipe.factoryQsp,input:recipe.inputSave,workCopy:recipe.workCopy,expectedNativeOutput:recipe.factoryOutput,finalOutput:recipe.finalNativeOutput,goldSlotInitiallyPresent:recipe.goldSlotInitiallyPresent,fullVariableTablePreserved:true,scalarRepairsNeeded:0,guiLaunched:false}));
