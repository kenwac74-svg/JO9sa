'use strict';
// Focused helper behavior in an isolated WASM world; no native game/save I/O.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const lazy=require('../lazy/lazy_patch.cjs'),scope=require('../scope/whitelist.json');
const red=process.argv.includes('--red'),helper=red?{name:'jo9_save_maintenance',body:''}:require('./maintenance.cjs').buildHelper();
const q=s=>"'"+s.replaceAll("'","''")+"'",nl=s=>s.replace(/\r\n|\r|\n/g,'\r\n');
function world(locs){const lines=['QSPGAME','','',core.shift(String(locs.length),-5)];for(const [name,body]of locs)lines.push(core.shift(name,-5),'',core.shift(nl(body),-5),core.shift('0',-5));lines.push('');return Buffer.from(lines.join('\r\n'),'utf16le');}
const worldRaw=world([['Start',''],[helper.name,helper.body],['prior_save',"qa_prior_calls+=1\nqa_prior_bank=arrsize('$voice_fragment_ids')\nmaster['prior_hook_tick']+=1"],['#txt_man',"if $args[0]='jo9_voice_fragment_data': qa_rebuild_calls+=1 & voice_fragment_revision=8 & $voice_fragment_ids[9119]='dependency-last-id'"]]);
const vendor=process.env.JO9_RUNTIME_VENDOR||'G:/somi/JO9sa/tools/modding-hub/vendor/qsp';const {initQspEngine}=require(path.join(vendor,'wasm-engine.cjs'));
const emit=process.stdout.write.bind(process.stdout);console.log=()=>{};
(async()=>{
 const api=await initQspEngine(path.join(vendor,'qsp-engine.wasm')),errors=[];
 api.on('error',e=>errors.push(e));for(const event of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(event,(...args)=>{const cb=args.find(x=>typeof x==='function');if(cb)cb(event==='input'?'':event==='is_play'?false:event==='version'?'5.7.0':-1);});
 api.openGame(worldRaw.buffer.slice(worldRaw.byteOffset,worldRaw.byteOffset+worldRaw.byteLength),true);
 const run=code=>{api.execCode(nl(code));assert.deepEqual(errors,[],'QSP helper execution must not error');};
 const num=expr=>{run('qa_number='+expr);return api.readVariable('qa_number');};
 const str=expr=>{run('$qa_string='+expr);return api.readVariable('$qa_string');};
 const size=name=>num('arrsize('+q(name)+')');
 const invoke=(mode='load')=>run('gs '+q(helper.name)+','+q(mode));
 const safe=lazy.PICKER_NEW_PREFIX+'\r\n $result=$args[1]';
 const seedBank=()=>run(scope.cacheVariables.map(name=>'killvar '+q(name)+'\n'+name+'[0]='+(name.startsWith('$')?q('cache-value'):'7')).join('\n')+'\nvoice_fragment_revision=8');
 const installPicker=text=>run('$voice_pick_fragment='+q(text));
 const seedMeal=(copies,changeIndex=-1,extra=false)=>{const a=scope.meal.currentIds;let code="killvar '$meal_id'\n";for(let i=0;i<a.length*copies+(extra?1:0);i++)code+='$meal_id['+i+']='+q(i===changeIndex?'custom-mismatch':a[i%a.length])+'\n';run(code);};
 const checks=[];const check=(name,fn)=>{const t=Date.now();fn();checks.push({name,status:'PASS',elapsedMs:Date.now()-t});};
 check('normal save retains bank and prior hook runs once only when actual save handler runs',()=>{
  installPicker(safe);seedBank();run("$ongsave='prior_save'\n$jo9_previous_save_hook=''\nmaster['prior_hook_tick']=11\n$text[1]='selected-page'\n$special_part='deferred-scene'\nqa_prior_calls=0");
  invoke('install');assert.equal(str('$ongsave'),'jo9_save_maintenance');assert.equal(str('$jo9_previous_save_hook'),'prior_save');assert.equal(size('$voice_fragment_ids'),1);assert.equal(num('qa_prior_calls'),0);
  invoke('install');assert.equal(str('$jo9_previous_save_hook'),'prior_save');
  run('gs $ongsave');assert.equal(num('qa_prior_calls'),1);assert.equal(num('qa_prior_bank'),1);assert.equal(num("master['prior_hook_tick']"),12);assert.equal(size('$voice_fragment_ids'),1);assert.equal(num('voice_fragment_revision'),8);assert.equal(num('jo9_save_clean_revision'),1);assert.equal(str('$text[1]'),'selected-page');assert.equal(str('$special_part'),'deferred-scene');
  invoke('clean');assert.equal(num('qa_prior_calls'),1);assert.equal(size('$voice_fragment_ids'),0);run('gs $ongsave');assert.equal(num('qa_prior_calls'),2);assert.equal(num('qa_prior_bank'),0);
 });
 check('stale cached picker is repaired at accepted opening then lazily rebuilds with original arguments',()=>{
  for(const lead of ['',' ','\r\n']){
   const old=lead+lazy.PICKER_OLD_PREFIX+'\r\n $result=$args[1]';installPicker(old);seedBank();invoke();
   assert.equal(str('$voice_pick_fragment'),lead+safe);assert.equal(size('$voice_fragment_ids'),1);assert.equal(num('voice_fragment_revision'),8);
   invoke('clean');assert.equal(size('$voice_fragment_ids'),0);assert.equal(num('voice_fragment_revision'),0);
  }
  run("$qa_picked=$dyneval($voice_pick_fragment,'unused-pool','kept-fallback-argument')");assert.equal(str('$qa_picked'),'kept-fallback-argument');assert.equal(size('$voice_fragment_ids'),9120);assert.equal(num('voice_fragment_revision'),8);
 });
 check('missing or partial unsafe picker retains complete existing cache and revision',()=>{
  installPicker('');seedBank();invoke('clean');for(const name of scope.cacheVariables)assert.equal(size(name),1,name);assert.equal(num('voice_fragment_revision'),8);
  run("killvar '$voice_fragment_ids'\nkillvar '$voice_fragment_text'");installPicker(lazy.PICKER_OLD_PREFIX+'\r\n ! '+lazy.MARKER+'\r\n $result=\'untrusted-marker-only\'');invoke('clean');
  assert.equal(size('$voice_fragment_ids'),0);assert.equal(size('$voice_fragment_text'),0);assert.equal(size('$voice_fragment_item'),1);assert.equal(num('voice_fragment_revision'),8);
 });
 check('unrecognized opening is preserved and cache retained despite old prefix later in script',()=>{
  const old='xxx'+lazy.PICKER_OLD_PREFIX+'\r\n $result=\'later\'';installPicker(old);seedBank();invoke('clean');assert.equal(str('$voice_pick_fragment'),old);assert.equal(size('$voice_fragment_ids'),1);assert.equal(num('voice_fragment_revision'),8);
 });
 check('exact whitelist cleanup preserves actor history, script callbacks, small tables and battle state',()=>{
  installPicker(safe);seedBank();const keep=[...new Set([...scope.battleExclusion.kept,...scope.explicitlyKeptOtherStaticArrays,'$seed_ava','$master_vars','$voice_fragment_ids_backup','$voice_fragment_custom','$slave','$assistant','$room1','$food_stock'])];
  run(keep.map(name=>name+'[0]='+(name.startsWith('$')?q('keep-'+name):'67')).join('\n')+"\nmaster['progress']=73\n$slave['jo9_voice_last1_1112']='history'\n$masters_vars[0]='obsolete'\n$masters_vars[1]='obsolete'");
  const keptBefore=new Map(keep.map(name=>[name,name.startsWith('$')?str(name+'[0]'):num(name+'[0]')]));invoke('clean');
  for(const name of scope.cacheVariables)assert.equal(size(name),0,name);assert.equal(num('voice_fragment_revision'),0);for(const name of keep)assert.equal(name.startsWith('$')?str(name+'[0]'):num(name+'[0]'),keptBefore.get(name),name);assert.equal(num("master['progress']"),73);assert.equal(str("$slave['jo9_voice_last1_1112']"),'history');assert.equal(size('$masters_vars'),0);
 });
 check('meal exact repeated bank compacts while mismatches, partial repeats and numeric payload survive',()=>{
  installPicker(safe);seedMeal(2);invoke();assert.equal(size('$meal_id'),76);assert.equal(str('$meal_id[0]'),scope.meal.currentIds[0]);assert.equal(str('$meal_id[75]'),scope.meal.currentIds[75]);assert.equal(size('$j9sm_expected'),0);assert.equal(size('$j9sm_first'),0);
  seedMeal(2,151);invoke();assert.equal(size('$meal_id'),152);assert.equal(str('$meal_id[151]'),'custom-mismatch');
  seedMeal(1,-1,true);invoke();assert.equal(size('$meal_id'),77);
  seedMeal(2);run('meal_id[0]=77');invoke();assert.equal(size('$meal_id'),152);assert.equal(num('meal_id[0]'),77);
  seedMeal(1);invoke();assert.equal(size('$meal_id'),76);
 });
 check('normal load/save retain bank; explicit clean is idempotent and never chains helper to itself',()=>{
  installPicker(safe);seedBank();seedMeal(2);run("$ongsave='jo9_save_maintenance'\n$jo9_previous_save_hook='jo9_save_maintenance'\nqa_prior_calls=0");invoke();const cached=str('$voice_pick_fragment');invoke();run('gs $ongsave');assert.equal(size('$voice_fragment_ids'),1);assert.equal(num('voice_fragment_revision'),8);
  invoke('clean');invoke('clean');invoke();run('gs $ongsave');assert.equal(str('$voice_pick_fragment'),cached);assert.equal(size('$voice_fragment_ids'),0);assert.equal(size('$meal_id'),76);assert.equal(num('qa_prior_calls'),0);assert.equal(num('voice_fragment_revision'),0);assert.equal(num('jo9_save_clean_revision'),1);
 });
 const report={status:'PASS',red,engine:api.version(),checks,helperBytes:Buffer.byteLength(helper.body,'utf8'),limitations:['WASM invokes registered save-hook location using GS. Native before-save event timing and full game integration are root-owned.','No native process, original source/save writes, or runtime-speed claims.']};fs.writeFileSync(path.join(__dirname,red?'red-unexpected-pass.json':'green.json'),JSON.stringify(report,null,2)+'\n');emit(JSON.stringify({status:report.status,checks:checks.length,engine:report.engine})+'\n');
})().catch(error=>{const report={status:'FAIL',red,expectedMissingHelperFailure:red,message:error.message};fs.writeFileSync(path.join(__dirname,red?'red.json':'green-failure.json'),JSON.stringify(report,null,2)+'\n');emit(JSON.stringify(report)+'\n');process.exitCode=1;});


