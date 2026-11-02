'use strict';
// Generator only: never launches an engine or writes a production game/save.
// node native.cjs --phase red --state-save <representative.sav>
// node native.cjs --phase green --state-save <representative.sav>
const fs=require('node:fs'), path=require('node:path'), a=require('node:assert/strict');
const R='G:/somi/JO9sa', G='G:/somi/Jack O Nine Tails v2.4_work/game';
const T='G:/Codex/tmp/agrabah-special-food-20261030';
const BASE='6106de161136062c21c1de3fe0a4a706fa45c9a9daade3459cd770a2282a9d1c';
const c=require(R+'/tools/text-workshop/core.cjs');
const qa=require(R+'/tools/qa/release-check.cjs');
const codec=require(R+'/tools/qa/save-codec.cjs');
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const FOOD=['alcohol','vegetables','grain','spice','cheese','eggs','milk','cream','mince','meat','virgin_meat'];
function args(argv){
 const o={};
 for(let i=0;i<argv.length;i+=2){a(['--phase','--state-save','--out'].includes(argv[i]),'Unknown option '+argv[i]);a(argv[i+1]&&!argv[i+1].startsWith('--'),'Missing value '+argv[i]);o[argv[i].slice(2)]=argv[i+1];}
 a(['red','green'].includes(o.phase),'--phase red|green required');
 a(o['state-save'],'--state-save required: representative values are primed, no original save is loaded by the engine');
 o.out=path.resolve(o.out||path.join(T,'native-'+o.phase));
 const rel=path.relative(path.resolve(T),o.out);a(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel),'Output must be a new child of the task temporary directory');
 return o;
}
function build(options,primeCode,icons){
 const lines=["if $args[0] = 'qa_resume': jump 'qa_call_' + str(qa_resume)",'killall',primeCode,'settimer 0',"$counter=''","$ongload=''","$onnewloc=''",'autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0','snk_room_target=0',"gs 'refresh_database'",'settimer 0',"$counter=''","$ongload=''","$onnewloc=''",'autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0','empty=0','qa_checks=0','qa_failures=0',"$qa_failed_keys=''",'qa_handler_returned=0','qa_result_city_hits=0','qa_shop_return_hits=0','Jasmine_job=1'];
 const expected=[];
 const emit=(...s)=>lines.push(...s);
 function check(key,expr,value){emit('qa_checks+=1','if ('+expr+') ! '+value+': qa_failures+=1 & $qa_failed_keys+='+q(key+'|'));expected.push({key,expression:expr,expected:value});}
 function truth(key,expr){check(key,'iif('+expr+',1,0)',1);}
 function present(html,needle){return 'instr('+html+','+q(needle)+')>0';}
 function menu(kind,target){
  emit('menu_item_counter=0',"$text_display=''");
  emit('dynamic $'+(kind==='fruit'?'balsam_boutique_options[3]':'maslab_tabern_options[1]'));
  emit('$'+target+'=$text_display');
 }
 function menuState(s){
  emit("active[$event['Akabur_quest']]="+s.stage,'fruits_minibox='+s.owned,'vine_butle='+s.owned,'fruits_maxibox='+s.owned,'vine_box='+s.owned,'gold='+s.gold,'sparks='+s.sparks);
 }
 function twoTips(key,html){
  emit('qa_tip_at=instr('+html+','+q('tooltip-data="')+')',"$qa_tip_tail=''",'if qa_tip_at>0: $qa_tip_tail=$mid('+html+',qa_tip_at+14,len('+html+'))');
  truth(key,'qa_tip_at>0 and instr($qa_tip_tail,'+q('tooltip-data="')+')>0');
 }
 const iconKeys=['menu_item_Balsam','menu_item_Balsam_gray','menu_item_maslab','menu_item_maslab_gray','menu_item_nobuy','menu_item_agraba'];
 for(const key of iconKeys){const actual=Object.keys(icons).find(k=>k.toLowerCase()===key.toLowerCase());a(actual,'Missing actual JSON icon '+key);emit('$'+key+'='+q(icons[actual]));}
 if(options.phase==='red'){
  menuState({stage:0,owned:1,gold:25,sparks:0});menu('fruit','qa_fruit_html');menu('wine','qa_wine_html');
  emit('qa_red_missing=0');
  for(const [html,needle]of [['$qa_fruit_html','interaction_city=30212'],['$qa_wine_html','interaction_city=30411'],['$qa_fruit_html','신선한 과일'],['$qa_wine_html','아그라바 와인']]) emit('if instr('+html+','+q(needle)+')=0: qa_red_missing+=1');
  emit("savegame 'diagnostic.sav'",'if qa_red_missing>0:'," msg 'JO9_QA_AGRABAH_SPECIAL_RED_EXPECTED_FAIL_COMPLETE'",'else'," msg 'JO9_QA_AGRABAH_SPECIAL_RED_UNEXPECTED_PASS'",'end','exit');
  return {code:lines.join('\r\n'),expected,marker:'JO9_QA_AGRABAH_SPECIAL_RED_EXPECTED_FAIL_COMPLETE',redRule:'At least one required always-sale/new-name feature is missing on the unchanged baseline.'};
 }
 const cases=[
  {stage:0,owned:0,gold:25,sparks:0}, {stage:0,owned:1,gold:25,sparks:0},
  {stage:11,owned:0,gold:24,sparks:249}, {stage:11,owned:0,gold:24,sparks:250},
  {stage:11,owned:0,gold:25,sparks:0}, {stage:11,owned:1,gold:25,sparks:0},
  {stage:11,owned:0,gold:1000,sparks:0}, {stage:11,owned:1,gold:1000,sparks:0},
  {stage:11,owned:0,gold:0,sparks:10000},
  {stage:12,owned:0,gold:25,sparks:0}, {stage:12,owned:1,gold:1000,sparks:10000}
 ];
 cases.forEach((s,i)=>{
  menuState(s);menu('fruit','qa_current_fruit_html');menu('wine','qa_current_wine_html');
  const smallFruit=s.gold>=25||s.sparks>=250, smallWine=s.gold>=25;
  const bulkFruit=s.stage===11&&!s.owned&&(s.gold>=1000||s.sparks>=10000), bulkWine=s.stage===11&&!s.owned&&s.gold>=1000;
  check('menu-'+i+'-small-fruit','iif('+present('$qa_current_fruit_html','interaction_city=30212')+',1,0)',+smallFruit);
  check('menu-'+i+'-small-wine','iif('+present('$qa_current_wine_html','interaction_city=30411')+',1,0)',+smallWine);
  check('menu-'+i+'-bulk-fruit','iif('+present('$qa_current_fruit_html','interaction_city=30213')+',1,0)',+bulkFruit);
  check('menu-'+i+'-bulk-wine','iif('+present('$qa_current_wine_html','interaction_city=30412')+',1,0)',+bulkWine);
  truth('menu-'+i+'-fruit-name',present('$qa_current_fruit_html','신선한 과일'));
  truth('menu-'+i+'-wine-name',present('$qa_current_wine_html','아그라바 와인'));
  truth('menu-'+i+'-bulk-fruit-visible',present('$qa_current_fruit_html','연회용 과일'));
  truth('menu-'+i+'-bulk-wine-visible',present('$qa_current_wine_html','연회용 와인'));
  twoTips('menu-'+i+'-fruit-two-tooltips','$qa_current_fruit_html');
  twoTips('menu-'+i+'-wine-two-tooltips','$qa_current_wine_html');
 });
 // Preserve representative hover material: repeatable small items, locked banquet bundles.
 menuState({stage:0,owned:1,gold:25,sparks:0});menu('fruit','qa_fruit_html');menu('wine','qa_wine_html');
 emit("active[$event['Akabur_quest']]=0",'fruits_minibox=0','vine_butle=0','fruits_maxibox=0','vine_box=0',"jo9_agraba_stock['fruit']=0","jo9_agraba_stock['wine']=0",'gold=50','sparks=500');
 let calls=0;
 function buy(id,label){calls++;emit('qa_resume='+calls,'interaction_city='+id,"gt 'interaction_city'",':qa_call_'+calls,'qa_handler_returned+=1');check(label+'-returned','qa_handler_returned',calls);}
 buy(30212,'fruit-first');buy(30212,'fruit-second');
 check('fruit-two-gold','gold',0);check('fruit-two-sparks','sparks',500);check('fruit-two-stock',"jo9_agraba_stock['fruit']",2);check('fruit-legacy-flag','fruits_minibox',1);
 emit('gold=24','sparks=250');buy(30212,'fruit-spark-boundary');
 check('fruit-spark-gold','gold',24);check('fruit-spark-cost','sparks',0);check('fruit-spark-stock',"jo9_agraba_stock['fruit']",3);
 emit('gold=24','sparks=249','qa_shop_before=qa_shop_return_hits','qa_result_before=qa_result_city_hits');buy(30212,'fruit-insufficient');
 check('fruit-insufficient-gold','gold',24);check('fruit-insufficient-sparks','sparks',249);check('fruit-insufficient-stock',"jo9_agraba_stock['fruit']",3);check('fruit-guard-shop','qa_shop_return_hits-qa_shop_before',1);check('fruit-guard-no-result','qa_result_city_hits-qa_result_before',0);
 emit('gold=25','sparks=249');buy(30212,'fruit-gold-boundary');check('fruit-gold-cost','gold',0);check('fruit-gold-keeps-sparks','sparks',249);check('fruit-four-stock',"jo9_agraba_stock['fruit']",4);
 emit('gold=50','sparks=1000');buy(30411,'wine-first');buy(30411,'wine-second');
 check('wine-two-gold','gold',0);check('wine-two-sparks','sparks',1000);check('wine-two-stock',"jo9_agraba_stock['wine']",2);check('wine-legacy-flag','vine_butle',1);
 emit('gold=24','sparks=10000','qa_shop_before=qa_shop_return_hits','qa_result_before=qa_result_city_hits');buy(30411,'wine-insufficient');
 check('wine-insufficient-gold','gold',24);check('wine-insufficient-sparks','sparks',10000);check('wine-insufficient-stock',"jo9_agraba_stock['wine']",2);check('wine-guard-shop','qa_shop_return_hits-qa_shop_before',1);check('wine-guard-no-result','qa_result_city_hits-qa_result_before',0);
 emit('gold=25','sparks=10000');buy(30411,'wine-gold-boundary');check('wine-gold-cost','gold',0);check('wine-gold-keeps-sparks','sparks',10000);check('wine-three-stock',"jo9_agraba_stock['wine']",3);
 check('quest-stage-not-advanced',"active[$event['Akabur_quest']]",0);check('bulk-fruit-unmodified','fruits_maxibox',0);check('bulk-wine-unmodified','vine_box',0);check('all-success-result-stubs','qa_result_city_hits',7);check('both-guard-stubs','qa_shop_return_hits',2);
 // Run actual master_stat with actual existing storage parameters. No daily meal is run.
 for(const key of FOOD)emit('fridge['+q(key)+']=1');
 emit('spawn_semen=4','kitchen=1','master_stat_screen=0','snk_room_target=0',"dynamic $get_fridge_space",'qa_capacity_before=estate_size[$estate]','qa_fridge_before=fridge_items','qa_space_before=fridge_space',"gs 'master_stat'",'$qa_storage_html=$maintxt','$qa_storage_list=$left_text_list');
 check('storage-fruit-count',"jo9_agraba_stock['fruit']",4);check('storage-wine-count',"jo9_agraba_stock['wine']",3);
 check('ordinary-fridge-total','fridge_items',11);check('ordinary-capacity-preserved','estate_size[$estate]-qa_capacity_before',0);check('ordinary-space-preserved','fridge_space-qa_space_before',0);
 for(const key of FOOD)check('ordinary-'+key,'fridge['+q(key)+']',1);
 truth('storage-fruit-row',present('$qa_storage_list','신선한 과일'));truth('storage-wine-row',present('$qa_storage_list','아그라바 와인'));
 truth('storage-real-html',present('$qa_storage_html','left_text'));
 emit("savegame 'owned-stock.sav'");
 emit('kitchen=0','*clr',"gs 'master_stat'",'$qa_no_kitchen_list=$left_text_list');
 truth('no-kitchen-fruit-row',present('$qa_no_kitchen_list','신선한 과일'));
 truth('no-kitchen-wine-row',present('$qa_no_kitchen_list','아그라바 와인'));
 check('no-kitchen-keeps-fruit',"jo9_agraba_stock['fruit']",4);check('no-kitchen-keeps-wine',"jo9_agraba_stock['wine']",3);
 emit("killvar 'jo9_agraba_stock'",'fruits_minibox=1','vine_butle=1','kitchen=1','*clr',"gs 'master_stat'",'$qa_legacy_storage_list=$left_text_list');
 check('legacy-fruit-starts-zero',"jo9_agraba_stock['fruit']",0);check('legacy-wine-starts-zero',"jo9_agraba_stock['wine']",0);
 check('legacy-fruit-flag-kept','fruits_minibox',1);check('legacy-wine-flag-kept','vine_butle',1);
 truth('legacy-storage-shows-fruit',present('$qa_legacy_storage_list','신선한 과일'));
 truth('legacy-storage-shows-wine',present('$qa_legacy_storage_list','아그라바 와인'));
 emit("savegame 'diagnostic.sav'",'if qa_failures=0:'," msg 'JO9_QA_AGRABAH_SPECIAL_GREEN_PASS_COMPLETE'",'else'," msg 'JO9_QA_AGRABAH_SPECIAL_GREEN_ASSERTION_FAILED'",'end','exit');
 return {code:lines.join('\r\n'),expected,marker:'JO9_QA_AGRABAH_SPECIAL_GREEN_PASS_COMPLETE',menuCases:cases,handlerCalls:calls};
}
function prepare(o){
 const baseline=path.join(T,'before.qsp'),source=path.join(T,o.phase==='red'?'before.qsp':'candidate.qsp');
 const before=fs.readFileSync(baseline),raw=fs.readFileSync(source),saved=fs.readFileSync(o['state-save']);
 a.equal(c.hash(before),BASE,'Unexpected before.qsp hash');qa.inspectWorld(before);qa.inspectWorld(raw);
 const state=codec.parse(saved);a(codec.serialize(state).equals(saved),'Representative save byte roundtrip failed');
 const prime=qa.primeState(state),icons=JSON.parse(fs.readFileSync(G+'/json/menu_icon.json','utf8')).menu_item;
 const probe=build(o,prime.code,icons),doc=c.parse(raw),original=doc.lines.slice();
 const replacements={Start:probe.code,interaction_result_city:"qa_result_city_hits+=1\r\ngt 'Start', 'qa_resume'",shop_general:"qa_shop_return_hits+=1\r\ngt 'Start', 'qa_resume'"};
 for(const [name,body]of Object.entries(replacements)){const loc=doc.locations.find(l=>l.name===name);a(loc,'Missing location '+name);doc.lines[loc.body]=c.shift(body,-5);}
 const changed=doc.locations.filter(l=>doc.lines[l.body]!==original[l.body]).map(l=>l.name).sort();a.deepEqual(changed,Object.keys(replacements).sort(),'Unexpected instrumentation');
 const output=c.serialize(doc);qa.inspectWorld(output);a(c.serialize(c.parse(output)).equals(output),'Diagnostic byte roundtrip failed');
 qa.assertOutside(o.out,[R,G,'G:/somi/JO9O']);a(!fs.existsSync(o.out),'Refusing to overwrite '+o.out);
 fs.mkdirSync(o.out,{recursive:true});fs.writeFileSync(path.join(o.out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const file=path.join(o.out,'agrabah-'+o.phase+'.qsp');fs.writeFileSync(file,output);
 const plan=[{name:'agrabah-'+o.phase,file,marker:probe.marker,checkpoint:'Real menus + unchanged purchase handlers with only their two exits stubbed; green also calls real master_stat'}];
 fs.writeFileSync(path.join(o.out,'plan.json'),JSON.stringify(plan,null,2)+'\n');
 const manifest={schema:1,phase:o.phase,preparedAt:new Date().toISOString(),baselineHash:c.hash(before),source,sourceHash:c.hash(raw),representativeSave:path.resolve(o['state-save']),representativeSaveHash:c.hash(saved),representativeAssignments:prime.assignments,nativeOriginalSaveLoad:false,engineExecutedByGenerator:false,instrumentedLocations:changed,actualHandlersUnchanged:true,cases:1,assertions:probe.expected.length,menuCases:probe.menuCases||[],handlerCalls:probe.handlerCalls||0,redRule:probe.redRule,expectedVariables:probe.expected,marker:probe.marker,saveFile:path.join(o.out,'diagnostic.sav'),savedHtmlVariables:['qa_fruit_html','qa_wine_html','qa_storage_html','qa_storage_list'],limits:['This script prepares files only; root must execute the installed native client.','Representative state is primed through release-check primeState; no original save is injected/loaded.','Start is replaced; interaction_result_city and shop_general are exit stubs only. Actual #options, $menu, interaction_city and master_stat are unchanged.','Full dialogue, shop_general rendering, daily meals, nutrition, abilities and native save-load restoration are not exercised.','Menu and storage HTML are captured; browser hover and CSS layout need root visual checks.']};
 fs.writeFileSync(path.join(__dirname,'native-prepared-'+o.phase+'.json'),JSON.stringify(manifest,null,2)+'\n');
 a.equal(c.hash(fs.readFileSync(source)),c.hash(raw),'Source input changed');a.equal(c.hash(fs.readFileSync(baseline)),BASE,'Baseline input changed');a.equal(c.hash(fs.readFileSync(o['state-save'])),c.hash(saved),'Original save input changed');
 return {prepared:true,phase:o.phase,cases:1,assertions:probe.expected.length,plan:path.join(o.out,'plan.json'),out:o.out};
}
if(require.main===module){try{console.log(JSON.stringify(prepare(args(process.argv.slice(2))),null,2));}catch(e){console.error(e.stack||e.message);process.exitCode=1;}}
module.exports={args,build,prepare};
