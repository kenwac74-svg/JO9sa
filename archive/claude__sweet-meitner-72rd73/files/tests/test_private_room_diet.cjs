// Executes the packaged QSP rules in the legacy QSP WASM core.
// This is a logic test, not a FastQSP desktop/playthrough claim.
const fs=require('fs'),path=require('path'),assert=require('assert');
const vendor=path.resolve(__dirname,'../audits/reward-diagnostic/vendor-legacy/package');
const {initQspEngine}=require(path.join(vendor,'dist/node/wasm-engine.cjs'));
const pkg=path.resolve(process.argv[2]);
const patches=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(pkg,'qsp-patches.json'),'utf8')).map(p=>[p.Name,p.Text]));
const shift=s=>[...s].map(c=>String.fromCharCode((c.charCodeAt(0)-5)&65535)).join('');
function game(locs){const f=['QSPGAME','','',shift(String(locs.length))];for(const [n,c] of locs)f.push(shift(n),'',shift(c.replace(/\r?\n/g,'\r\n')),shift('0'));const b=Buffer.from(f.join('\r\n')+'\r\n','utf16le');return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}
(async()=>{
 const api=await initQspEngine(path.join(vendor,'dist/qsp-engine.wasm'));
 const errors=[];api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1)});
 for(const ev of ['main_changed','stats_changed','actions_changed','objects_changed','panel_visibility','user_input','view','timer'])api.on(ev,()=>{});
 const daily=[1,2,3,4].map(n=>patches.next_day.match(new RegExp(`! SNK_DIET_BEGIN_room${n}[\\s\\S]*?! SNK_DIET_END_room${n}`))[0]).join('\n');
 api.openGame(game([['start',"CONST_INT['slave_exist']=1 & CONST_INT['no_slave']=0 & CONST_INT['slave_dead']=3\n$next_day_starvation_effects='starvation_calls += 1'"],['daily',daily],['snk_room_diet_migrate',patches.snk_room_diet_migrate]]),true);api.restartGame();
 function run(s){api.execCode(s);assert.deepStrictEqual(errors,[]);}
 const num=n=>Number(api.readVariable(n));const val=(a,k)=>Number(api.readVariableByKey(a,k));
 run("room1_ration=-1 & room2_ration=0 & room3_ration=1 & room4_ration=2 & gs 'snk_room_diet_migrate'");
 assert.deepStrictEqual([1,2,3,4].map(n=>num(`room${n}_ration`)),[1,0,1,1]);
 run("room1_ration=2 & gs 'snk_room_diet_migrate'");assert.equal(num('room1_ration'),2);
 for(let n=1;n<=4;n++)run(`room${n}_state=1 & room${n}_ration=2 & room${n}['fat']=1 & room${n}['moral']=2`);
 for(let d=1;d<=10;d++){
  run("gs 'daily'");assert.equal(num('total_food_cost'),32*d);
  for(let n=1;n<=4;n++){
   const a=`room${n}`;assert.equal(val(a,'special_diet_days'),d);assert.equal(val(a,'calories'),3);
   assert.equal(val(a,'pos_cookie'),d>=5?1:0);assert.equal(val(a,'pos_dessert'),d>=10?1:0);
   assert.equal(val(a+'_rate','spoil'),Math.max(0,d-4)*3);
  }
 }
 run("room1_ration=1 & room2_ration=0 & room3_state=0 & room4_state=3 & total_food_cost=0 & room2['lactation']=2 & room2['neg_hungry']=1 & room2['stamina']=4 & gs 'daily'");
 assert.equal(num('total_food_cost'),6);assert.equal(val('room2','calories'),12);
 for(let n=1;n<=4;n++)assert.equal(val(`room${n}`,'special_diet_days'),0);
 for(let n=1;n<=4;n++){
  run(`room${n}_state=1 & room${n}_ration=1 & room${n}['neg_hungry']=0 & room${n}['fat']=0`);
 }
 run("gs 'daily'");for(let n=1;n<=4;n++)assert.equal(val(`room${n}`,'calories'),6);
 run("room1['fat']=3 & room1['stamina']=2 & room1['neg_hungry']=1 & gs 'daily'");assert.equal(val('room1','calories'),-4);
 const saved=api.saveGame();assert(saved);run('snk_room_diet_version=0');api.loadSave(saved);assert.equal(num('snk_room_diet_version'),1);
 console.log('PASS QSP '+api.version()+': migration, migration persistence, 4 rooms, days 1–10, costs, moodlets, spoil, nutrition, empty/dead rooms');
})().catch(e=>{console.error(e);process.exitCode=1});
