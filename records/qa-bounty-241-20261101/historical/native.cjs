'use strict';
// Isolated regression adapters. No production writes, no personal SAV, no image renderer.
// prepare <Full/game/jack.qsp> <full SHA256>; run <prepared plan path> after engine-slot approval.
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+String(s).replaceAll("'","''")+"'";
const body=(d,n)=>{const l=d.locations.find(x=>x.name===n);assert(l,'Missing '+n);return c.shift(d.lines[l.body],5);};
const set=(d,n,s)=>{const l=d.locations.find(x=>x.name===n);assert(l,n);d.lines[l.body]=c.shift(cr(s),-5);};
const add=(d,n,s)=>{assert(!d.locations.some(x=>x.name===n));d.lines.splice(-1,0,c.shift(n,-5),'',c.shift(cr(s),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.locations=c.parse(c.serialize(d)).locations;};
const A=(condition,label)=>'qa_checks+=1\nif ('+condition+")=0: qa_failures+=1 & $qa_failed_keys+="+q(label+'|')+'\n';
const completion=marker=>"savegame 'result.sav'\nif qa_failures=0:\n msg "+q(marker)+"\nelse\n msg 'JO9_QA_HISTORICAL_ASSERTION_FAILED'\nend\nexit";
const initTail="\nsettimer 0\n$counter=''\n$ongload=''\n$onnewloc=''\nautosave=0\ndecadesave=0\nautosave_day=0\nautosave_decade=0\nsound_on=0\nusehtml=0\nSHOWOBJS 0\nSHOWACTS 0\nSHOWSTAT 0\nSHOWINPUT 0\nqa_checks=0\nqa_failures=0\n$qa_failed_keys=''\n";
function prepare(input,expected){
 assert.equal(path.resolve(input),path.resolve(W+'/jack.qsp'),'Independent QA uses the pinned current WORK only');
 const raw=fs.readFileSync(input),sha=c.hash(raw);assert.equal(sha,expected);assert.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),sha,'Full must match latest WORK');qa.inspectWorld(raw);
 const T='G:/Codex/tmp/qa-bounty-241-historical-'+sha.slice(0,8);qa.assertOutside(T,[R,W,F,'G:/somi/JO9O']);assert(!fs.existsSync(T),'Refuse existing diagnostic directory');fs.mkdirSync(T,{recursive:true});
 // Only an already-approved public test fixture supplies representative non-private state.
 const statePath=F+'/save/TC_01_HOME_TRAITS.sav',saveRaw=fs.readFileSync(statePath),prime=qa.primeState(sc.parse(saveRaw));
 const init='killall\n'+prime.code+"\ngs 'refresh_database'"+initTail;
 const cases=[],sources=[];
 function build(name,fn,evidence){const d=c.parse(raw),dir=T+'/'+name,marker='JO9_QA_HIST20261101_'+name.replaceAll('-','_')+'_COMPLETE';fs.mkdirSync(dir);fs.symlinkSync(fs.realpathSync(F+'/json'),dir+'/json','junction');fs.copyFileSync(F+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fn(d,marker,dir);const b=c.serialize(d);qa.inspectWorld(b);const file=dir+'/'+name+'.qsp';fs.writeFileSync(file,b);cases.push({name,file,marker,checkpoint:evidence,diagnosticSha256:c.hash(b),resultSave:dir+'/result.sav'});}
 const auction=require(R+'/records/auction-consignment-fix-20261028/tests/harness.cjs');sources.push(R+'/records/auction-consignment-fix-20261028/tests/harness.cjs',R+'/records/auction-consignment-fix-20261028/tests/green.cjs');
 build('auction-custody',(d,marker)=>{
  auction.isolate(d);set(d,'jo9_farid_consignment',auction.instrumentMessages(body(d,'jo9_farid_consignment')));set(d,'$slave_price','slaveprice=200');
  let s='killall\n'+auction.init(d).replace('usehtml=1','usehtml=0')+initTail;
  const call=mode=>"qa_result=func('jo9_farid_consignment',"+q(mode)+")\n";
  s+="farid_debt=0\nfarid_potential_debt=0\njo9_farid_stored_valid=0\nsparks=100\n"+auction.actor('stock',41001,1)+call('deposit');
  s+=A("qa_result=1 and jo9_farid_stored_valid=1 and jo9_farid_stored['id']=41001 and stock_state=0 and farid_potential_debt=100",'deposit');
  s+=auction.actor('stock',42002,0)+"dynamic $clear_slave_instance,'stock'\n"+auction.actor('stock',42003,0)+call('return');
  s+=A("qa_result=1 and slave_state=1 and slave['id']=41001 and slave['jo9_learning_trait']=1 and sparks=95 and farid_potential_debt=0 and jo9_farid_stored_valid=0",'return-original');
  for(const expr of ["slave['qa_sentinel']=731","$slave['qa_sentinel']='STRING_KEEP'","slave_rate['qa_sentinel']=732","slave_inventory['qa_item']=17","slave_already_done_total['qa_sentinel']=19","stock['id']=42003"])s+=A(expr,'identity-sentinel');
  s+=call('return')+A('qa_result=-1 and sparks=95','return-once');
  s+="dynamic $clear_slave_instance,'slave'\n"+auction.actor('stock',41011,1)+call('deposit')+call('settle')+A('qa_result=100 and farid_debt=100 and farid_potential_debt=0','settle')+call('settle')+A('qa_result=0 and farid_debt=100','settle-once')+call('collect')+A('qa_result=100 and sparks=195 and farid_debt=0','collect')+call('collect')+A('qa_result=0 and sparks=195','collect-once');
  s+="farid_potential_debt=100\nfarid_debt=25\n"+auction.actor('stock',999,1)+call('return')+A('qa_result=-3 and sparks=195 and farid_potential_debt=100 and slave_state=0','unverified-legacy-not-promoted');
  set(d,'Start',s+completion(marker));
 },'Actual custody helper and original role schema; only display refresh and appraisal isolated. Synthetic actor sentinel fields, no personal save.');
 const dealerSource=fs.readFileSync(R+'/records/dealer-economy-20261024/scripts/reproduce.cjs','utf8');const fixture=new Function(dealerSource.slice(dealerSource.indexOf('function fixture('),dealerSource.indexOf('const phase='))+';return fixture;')();sources.push(R+'/records/dealer-economy-20261024/scripts/reproduce.cjs',R+'/records/sale-cap-b-20261026/trader-tests/run.cjs');
 build('dealer-cap-obedience',(d,marker)=>{
  // Fix only the pre-existing appraisal stage; execute the current quote, obedience and cap logic.
  set(d,'$slave_price',"rating=6\nslave_base_price=2000\nslaveprice=10000\nslave['obedience']=qa_obedience");
  let s=init;
  for(const n of [5999,6000,6001]){s+=fixture({obed:2})+"gs '$slave_price'\nauction_price[6]="+n+"\nqa_amount=func('jo9_traits_value','dealer_quote','wong')\n"+A('qa_amount='+Math.min(n,6000),'cap-'+n);}
  s+=fixture({obed:0})+"qa_obedience=1\ncommon_price[6]=10000\nqa_full=func('jo9_traits_value','dealer_quote','wong')\nqa_obedience=0\nqa_untrained=func('jo9_traits_value','dealer_quote','wong')\n"+A('qa_full=6000 and qa_untrained=1500','native-20-percent-before-normal-payout');
  set(d,'Start',s+completion(marker));
 },'Current quote helper, $6000 boundary and existing untrained depreciation; appraisal fixed to isolate payout arithmetic. $8000 private routes checked separately statically.');
 build('catfight-settlement',(d,marker)=>{
  set(d,'Start',init+"qa_cf_case=0\ngt 'qa_cf_next'");
  const scenarios=[...Array.from([1,101],hero=>[1,2].map(choice=>({hero,choice}))).flat()];let next='qa_cf_case+=1\n';
  scenarios.forEach((x,i)=>{next+='if qa_cf_case='+(i+1)+':\n'+"killvar 'slave'\nkillvar 'slave_rate'\nkillvar 'jo9_combat'\nkillvar 'jo9_fog'\nkillvar 'jo9_fate'\nslave_state=1\nslave_type=2571\n$slave_name='QA_CAT'\n$assistant_name='QA_OTHER'\nslave['id']=9001\nslave['catfight_level']=2\nslave['arena_level']=2\nslave['energy']=5\nslave['stamina']=6\nslave['temper']=10\nslave['calories']=500\nslave['gladiatrix']=2\nslave['sensitivity']=3\nslave['totalEarned']=77\nslave['winning_series']=7\nslave['jo9_learning_trait']=0\nslave['angst']=0\nassistant['catfight_level']=9\nslave_rate['fame']=23\nassistant_rate['fame']=61\nsparks=1000\nmaster_energy=10\ncombatant=1\ncolosseum_fight=0\nsnk_room_target=0\n$place='catfightclub'\n$g_type='dimacherus'\n$fight_return='Start1'\n$итог_боя='победа'\n"+'hero_choice='+x.hero+"\njo9_fate['mode']=2\njo9_fate['phase']=2\njo9_fate['choice']="+x.choice+"\ngt 'выход_из_боя'\nend\n";});
  for(const hero of [1,101])for(const wins of [0,2,3,9])next+='hero_choice='+hero+"\nslave_state=1\nslave['arena_level']=2\nslave['energy']=5\nslave['catfight_level']="+wins+"\n$text_display=''\ndynamic $catfightclub_options[1]\n"+A("(instr($text_display,'combatant = 1')>0)="+(wins<3?1:0),'menu-'+hero+'-'+wins);
  next+=completion(marker);add(d,'qa_cf_next',next);
  const checks=A('interaction_city=103005','result-route')+A("sparks=1100 and purse=100 and slave['totalEarned']=177",'prize-once')+A("slave['catfight_level']=3 and assistant['catfight_level']=9",'single-win-correct-actor')+A("txt_count=1 and instr($text[1],'상금: $100')>0",'single-receipt-page')+A("$special_image_full[1]=$special_bg",'result-image-render-path')+"gt 'qa_cf_next'";
  set(d,'interaction_screen_city',checks);
 },'Actual battle exit, city result and common completion counter; final renderer intercepted. Current and legacy protagonist branches; both outcome choices; menu 0/2/3/9 wins.');
 const spawn=require(R+'/records/spawn-stage-image-fix-20261030/native.cjs');sources.push(R+'/records/spawn-stage-image-fix-20261030/native.cjs');
 build('monster-stages',(d,marker)=>{const p=spawn.makeCode(c.parse(raw),{phase:'green',trophy:false});set(d,'Start',p.code.replace("'spawn-green.sav'","'result.sav'").replace(q(p.marker),q(marker)));},'Actual opponent definitions and sprite lookup, 4 stage/context variants, unchanged numeric stats and live combat sentinels; no combat image rendering.');
 const food=require(R+'/records/agrabah-special-food-20261030/native.cjs');sources.push(R+'/records/agrabah-special-food-20261030/native.cjs');
 build('gold-special-food',(d,marker)=>{const icons=JSON.parse(fs.readFileSync(F+'/json/menu_icon.json','utf8')).menu_item,p=food.build({phase:'green'},prime.code+'\nusehtml=0',icons);set(d,'Start',p.code.replaceAll("savegame 'owned-stock.sav'",'').replace("savegame 'diagnostic.sav'","savegame 'result.sav'").replace(q(p.marker),q(marker)));set(d,'interaction_result_city',"qa_result_city_hits+=1\ngt 'Start','qa_resume'");set(d,'shop_general',"qa_shop_return_hits+=1\ngt 'Start','qa_resume'");},'Reused real-menu and purchase-handler matrix; special-food stock and ordinary-fridge isolation. Approved public test state primed; end dialogues not rendered.');
 build('bankruptcy-assets',(d,marker)=>{
  const fixtureRaw=fs.readFileSync(F+'/save/TC_05_BANKRUPTCY_CHAIN.sav'),p=qa.primeState(sc.parse(fixtureRaw));
  let s='killall\n'+p.code+"\ngs 'refresh_database'"+initTail+"qa_cash=sparks\ngs 'jo9_liquidation_assets','sell','decor'\nqa_after_decor=sparks\ngs 'jo9_liquidation_assets','sell','decor'\n"+A('sparks=qa_after_decor','decor-no-double');
  s+="gs 'jo9_liquidation_assets','quote_move'\nqa_move_value=jo9_lq_value['relocation']\nqa_before_move=sparks\ngs 'jo9_liquidation_assets','move_slums'\n"+A("$estate='slum_house' and owner=0 and kulaconstruct=0",'move-slums-rooms-reset')+A('sparks=qa_before_move+qa_move_value','move-value-once');
  for(const k of ['lab','boudoir','dungeon','barn','pen','stasis_tank'])s+=A(k+'=0','rental-'+k);
  for(const role of ['room1','room2','room3','room4','prisoner','farmhand','cow','harpy','pig',...Array.from({length:18},(_,i)=>'iced_'+(i+1))])s+=A(role+'_state=0','occupant-'+role);
  s+="qa_after_move=sparks\ngs 'jo9_liquidation_assets','move_slums'\n"+A('sparks=qa_after_move','move-no-double')+"gs 'jo9_liquidation_assets','quote_move'\n"+A("jo9_lq_value['relocation']=0",'completed-move-zero-quote');
  set(d,'Start',s+completion(marker));
 },'Actual liquidation asset helper with previously approved public TC05 fixture; decoration, relocation, facility/occupant reset and repeated-credit boundaries. No full bankruptcy UI/quest storyline rendered.');
 const plan=cases.map(({diagnosticSha256,resultSave,...x})=>x),planPath=T+'/plan.json';fs.writeFileSync(planPath,JSON.stringify(plan,null,2));
 const meta={source:input,sourceSha256:sha,sourcePublicFixture:statePath,publicFixtureSha256:c.hash(saveRaw),diagnosticRoot:T,engine:F+'/engine/jack.exe',cases,reusedSources:sources.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})),privateSavesRead:false,productionWrites:false,imagesRendered:false,engineExecuted:false,limits:['Synthetic/approved-test state, not GUI load of any personal save.','Final scene renderers are replaced by assertion destinations; no layout certification.','Dealer appraisal is controlled; valuation growth and private-buyer $8000 routes are distinct static checks.','No runtime QSP/CSS/JSON/asset changed; diagnostic JSON junction is read-only by convention and never written by this script.']};
 fs.writeFileSync(T+'/prepared.json',JSON.stringify(meta,null,2));fs.writeFileSync(__dirname+'/native-historical-prepared.json',JSON.stringify(meta,null,2));assert.equal(c.hash(fs.readFileSync(input)),sha);console.log(JSON.stringify({prepared:true,sourceSha256:sha,cases:cases.length,planPath}));return meta;
}
function run(planPath){const base=path.dirname(planPath),meta=JSON.parse(fs.readFileSync(base+'/prepared.json','utf8'));assert(base.startsWith('G:/Codex/tmp/qa-bounty-241-historical-'));assert.equal(c.hash(fs.readFileSync(meta.source)),meta.sourceSha256);
 const selected=process.argv.slice(4),client=[];let processExit=0;
 for(const item of meta.cases){const dir=path.dirname(item.file),onePlan=dir+'/plan.json';
  if(!selected.length||selected.includes(item.name)){
   fs.writeFileSync(onePlan,JSON.stringify([{name:item.name,file:item.file,marker:item.marker,checkpoint:item.checkpoint}],null,2));
   const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',meta.engine,'-Plan',onePlan,'-TimeoutSeconds','40'],{encoding:'utf8',windowsHide:true,timeout:50000});
   fs.writeFileSync(dir+'/runner.log',(r.stdout||'')+(r.stderr||''));if(r.status!==0)processExit=1;
  }
  if(fs.existsSync(dir+'/client-results.json'))client.push(...JSON.parse(fs.readFileSync(dir+'/client-results.json','utf8').replace(/^\uFEFF/,'')));else client.push({name:item.name,pass:false,reason:'Not executed'});
 }
 const results=meta.cases.map(x=>{if(!fs.existsSync(x.resultSave))return{name:x.name,pass:false,missingResult:true};const s=sc.parse(fs.readFileSync(x.resultSave)),num=n=>+sc.value(s,n)[0],str=n=>sc.value(s,n)[1];const failures=x.name==='monster-stages'?num('qa_spawn_failures'):num('qa_failures');return{name:x.name,checks:x.name==='monster-stages'?num('qa_spawn_checks'):num('qa_checks'),failures,failedKeys:x.name==='monster-stages'?str('qa_spawn_failed_keys'):str('qa_failed_keys'),pass:failures===0};});const report={source:meta.source,sourceSha256:meta.sourceSha256,pass:processExit===0&&client.every(x=>x.pass)&&results.every(x=>x.pass),processExit,client,results,checks:results.reduce((a,x)=>a+(x.checks||0),0),productionUnchanged:c.hash(fs.readFileSync(meta.source))===meta.sourceSha256,privateSavesRead:false,imagesRendered:false,fixtureCorrections:['Initial aggregate plan was rejected before engine launch because the official runner requires each QSP beside its plan; corrected to one plan per case directory.',...(meta.fixtureCorrections||[])],limits:meta.limits};fs.writeFileSync(__dirname+'/native-historical-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;}
if(require.main===module){const mode=process.argv[2];if(mode==='prepare')prepare(process.argv[3],process.argv[4]);else if(mode==='run')run(process.argv[3]);else throw Error('prepare or run required');}
module.exports={prepare,run};
