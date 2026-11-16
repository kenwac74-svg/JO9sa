'use strict';
const fs=require('fs'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const vendor='G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package';
const {initQspEngine}=require(vendor+'/dist/node/wasm-engine.cjs');
const input=fs.readFileSync(process.argv[2]),raw=process.argv[2].endsWith('.gz')?require('zlib').gunzipSync(input):input,d=c.parse(raw);
const body=n=>{const l=d.locations.find(x=>x.name===n);return l?c.shift(d.lines[l.body],5):'';};
(async()=>{
 const api=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),errors=[];
 api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...args)=>{const cb=args.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 const run=s=>{api.execCode(s.replace(/\r\n|\n/g,'\r\n'));assert.deepEqual(errors,[]);};
 const num=s=>{run('qa_n='+s);return api.readVariable('qa_n');};
 const str=s=>{run('$qa_s='+s);return api.readVariable('$qa_s');};
 if(body('jo9_cow_costume'))run("gs 'jo9_cow_costume','data'");
 assert.equal(str("$item_name['cow_costume']"),'젖소 코스튬','The new wearable item must be registered');
 assert.equal(num("item_price['cow_costume']"),25);
 const recalc=body('#item_base').match(/\$recalc_equipment_bonuses = \{[\s\S]*?\r\n\}/)[0];
 run(recalc);
 let cases=0;
 for(const actor of ['slave','assistant','room1'])for(const intellect of [0,2,5])for(const pride of [0,1,5]){
  run(`killvar '${actor}'\nkillvar '${actor}_rate'\nCONST_INT['no_slave']=0\n${actor}_state=1\n$${actor}['cloth']='cow_costume'\n${actor}['intellect']=${intellect}\n${actor}['pride']=${pride}\ndynamic $replace($recalc_equipment_bonuses,'dyn'+'slave','${actor}')`);
  assert.equal(num("daily_bonus['intellect']"),0);assert.equal(num("daily_bonus['pride']"),0);
  assert.equal(num("daily_bonus['instinct']"),1);assert.equal(num("learn_bonus['cowSK']"),2);
  assert.equal(num(`${actor}['ex_plus']`),1);assert.equal(num(`${actor}['st_plus']`),-1);
  assert.equal(num(`${actor}['neg_clothes']`),0);
  assert.equal(num(`${actor}['intellect']`),intellect);assert.equal(num(`${actor}['pride']`),pride);
  run(`$${actor}['cloth']='none'\ndynamic $replace($recalc_equipment_bonuses,'dyn'+'slave','${actor}')`);
  assert.equal(num("daily_bonus['instinct']"),0);assert.equal(num("learn_bonus['cowSK']"),0);
  assert.equal(num(`${actor}['ex_plus']`),0);assert.equal(num(`${actor}['st_plus']`),0);
  cases++;
 }
 console.log('PASS costume registration, price, effects and unequip: '+cases+' actor/stat combinations');
 const assignment=(loc,name)=>{const s=body(loc),at=s.indexOf(name+' = {');assert(at>=0,name);const end=s.indexOf('\r\n}',at);assert(end>at);return s.slice(at,end+3);};
 run(assignment('#dynamic','$slave_cloth_list')+'\n'+assignment('#dynamic','$assistant_cloth_list')+'\n'+assignment('#dynamic','$get_non_combat_equipment'));
 run(assignment('#options','$baraholka_s_options[3]')+'\n'+assignment('#options','$baraholka_a_options[3]'));
 run("$display_options[3]=$baraholka_s_options[3]\n$baraholka_s_options[4]='manual accessory data'\n$item_name['manual_item']='manual name'\ngs 'jo9_cow_costume','load'");
 const cacheNames=['$slave_cloth_list','$assistant_cloth_list','$baraholka_s_options[3]','$baraholka_a_options[3]','$display_options[3]'];
 const once=cacheNames.map(n=>str(n));for(const s of once)assert(s.includes('cow_costume'));
 run("gs 'jo9_cow_costume','load'");assert.deepEqual(cacheNames.map(n=>str(n)),once);
 assert.equal(str("$baraholka_s_options[4]"),'manual accessory data');assert.equal(str("$item_name['manual_item']"),'manual name');
 run(assignment('#dynamic','$slave_cloth_list')+'\n'+assignment('#dynamic','$assistant_cloth_list'));
 run("$slave_cloth_list=replace($slave_cloth_list,'cow_gear','old_cow_gear')\n$assistant_cloth_list=replace($assistant_cloth_list,'cow_gear','old_cow_gear')\ngs 'jo9_cow_costume','equipment'");
 assert(str('$slave_cloth_list').includes('cow_costume'));assert(str('$assistant_cloth_list').includes('cow_costume'));
 assert(str('$slave_cloth_list').includes('old_cow_gear'));
 const actualPurchase=body('interaction_result_city').slice(body('interaction_result_city').indexOf("if $interaction_type = 'buy_item':"),body('interaction_result_city').indexOf('!interaction type - purchase item for the home')).replace("gt 'item_buy'",'exit');
 for(const cash of [24,25,50]){
  run(`sparks=${cash}\nkillvar 'inventory'\n$item_id='cow_costume'\n$interaction_type='buy_item'\nitem_qty=1\none_time_aurabound_items_hint=1\nsound_on=0\n${actualPurchase}`);
  if(cash<25){assert.equal(str('$do_buy'),'');assert.equal(num('sparks'),24);}
  else{run('dynamic $do_buy');assert.equal(num('sparks'),cash-25);assert.equal(num("inventory['cow_costume']"),1);}
 }
 for(const [actor,slot]of [['slave',24],['assistant',44]]){
  run(`killvar '${actor}_inventory'\nkillvar 'inventory'\ninventory['cow_costume']=1\n${actor}_state=1\n$${actor}['cloth']='none'\nis_home=1\n$return_lock='none'\n$new_item='cow_costume'\nslot=${slot}\ngs 'item_change'`);
  assert.equal(str(`$${actor}['cloth']`),'cow_costume');assert.equal(num("inventory['cow_costume']"),0);
 }
 console.log('PASS old-cache update/idempotency, purchase boundaries and actual equip; image route is tested with native client');
})();
