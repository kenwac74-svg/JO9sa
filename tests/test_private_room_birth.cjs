// Shipped dispatcher, original birth branches and return handler in QSP WASM.
// Screen and common interaction helpers are isolated; not a desktop playthrough.
const fs=require('fs'),path=require('path'),assert=require('assert');
const vendor=path.resolve(__dirname,'../audits/reward-diagnostic/vendor-legacy/package');
const {initQspEngine}=require(path.join(vendor,'dist/node/wasm-engine.cjs'));
const p=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(process.argv[2],'qsp-patches.json'),'utf8')).map(x=>[x.Name,x.Text.replace(/\r\n/g,'\n')]));
const shift=s=>[...s].map(c=>String.fromCharCode((c.charCodeAt(0)-5)&65535)).join('');
function game(l){let f=['QSPGAME','','',shift(String(l.length))];for(const[n,c]of l)f.push(shift(n),'',shift(c.replace(/\r?\n/g,'\r\n')),shift('0'));let b=Buffer.from(f.join('\r\n')+'\r\n','utf16le');return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}
(async()=>{
 const api=await initQspEngine(path.join(vendor,'dist/qsp-engine.wasm'));let errors=[];
 api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1)});
 const swap=p['#static_base'].match(/\$swap_slave_instances = \{[\s\S]*?\n\}/)[0];
 const start=`CONST_INT['slave_exist']=1\nCONST_INT['no_slave']=0\nCONST_INT['loli_age']=-99\n$slave_vars[0]='instance'\n$slave_vars[1]='instance_state'\n$slave_vars[2]='$instance_name'\n$update_slave_features_list='! stub'\n${swap}`;
 const birth=p.interaction.slice(p.interaction.indexOf('if interaction = 9914:'),p.interaction.indexOf('!100',p.interaction.indexOf('if interaction = 9914:')));
 const locs=[['start',start],['snk_room_bridge',p.snk_room_bridge],['snk_room_birth_check',p.snk_room_birth_check],['snk_room_birth_return',p.snk_room_birth_return],['#var_base',''],['#txt_man',''],['#txt_2_man',''],['menu_form',p.menu_form.split('!main menu')[0]],['interaction',birth+"\n$seen='hospital'"],['finish',"gt $return_lock"]];
 for(let n=1;n<=4;n++){
  assert(p[`slave_private_room${n}`].includes("gs 'snk_room_birth_check'"));
  locs.push([`slave_private_room${n}`,`$seen='room${n}'\ngs 'snk_room_birth_check'`]);
 }
 assert(p.snk_room_menu_screen.includes("gs 'snk_room_birth_check'"));
 api.openGame(game(locs),true);api.restartGame();
 function run(s){api.execCode(s);assert.deepStrictEqual(errors,[])}
 const num=n=>Number(api.readVariable(n)),str=n=>api.readVariable(n),v=(a,k)=>Number(api.readVariableByKey(a,k));
 let cases=0;
 for(let n=1;n<=4;n++)for(const submenu of [false,true])for(const day of [149,150,151])for(const money of [0,499,500]){
  run("snk_birth_active=0 & snk_room_target=0 & slave_state=1 & slave['id']=900 & slave['pregnant']=23 & slave['mood']=4 & $seen='idle'");
  for(let r=1;r<=4;r++)run(`room${r}_state=0 & room${r}['pregnant']=0`);
  run(`room${n}_state=1 & room${n}['id']=${n} & $room${n}_name='Resident${n}' & room${n}['pregnant']=${day} & room${n}['아기']=0 & room${n}['mood']=3 & room${n}['energy']=10 & room${n}['angst']=0 & room${n}_rate['bruises']=0 & sparks=${money}`);
  if(submenu)run(`gs 'snk_room_bridge', 'enter', ${n}, 15`);
  run("gs 'snk_room_birth_check'");
  if(day===149){assert.equal(num('snk_birth_active'),0);run("gs 'snk_room_bridge', 'leave'");assert.equal(v(`room${n}`,'pregnant'),149);continue}
  assert.equal(str('$seen'),'hospital');assert.equal(str('$place'),'hospital');assert.equal(num('interaction'),9913+n);
  assert.equal(num('snk_room_target'),0);assert.equal(v('slave','id'),900);assert.equal(v('slave','pregnant'),23);assert.equal(v('slave','mood'),4);
  assert.equal(v(`room${n}`,'id'),n);assert.equal(v(`room${n}`,'pregnant'),0);assert.equal(v(`room${n}`,'아기'),1);assert.equal(v(`room${n}`,'lactation'),1);
  assert.equal(num('sparks'),money<500?money:0);
  if(money<500){assert.equal(v(`room${n}`,'mood'),-8);assert.equal(v(`room${n}`,'energy'),4);assert.equal(v(`room${n}`,'angst'),2);assert.equal(v(`room${n}_rate`,'bruises'),100);assert(String(api.readVariable('$text',1)).includes(`Resident${n}`));assert(String(api.readVariable('$text',6)).length>0)}
  run("gs 'snk_room_birth_check'");assert.equal(v(`room${n}`,'아기'),1);
  run(submenu?"gt 'menu_form'":"gt 'finish'");assert.equal(str('$seen'),`room${n}`);assert.equal(num('snk_birth_active'),0);cases++;
 }
 // Two due rooms serialize; returning from the first starts the second once.
 run("room1_state=1 & room2_state=1 & room3_state=0 & room4_state=0 & room1['pregnant']=150 & room2['pregnant']=151 & sparks=0 & gs 'snk_room_birth_check'");
 assert.equal(num('snk_birth_active'),1);run("gt 'finish'");assert.equal(num('snk_birth_active'),2);run("gt 'finish'");assert.equal(str('$seen'),'room2');assert.equal(num('snk_birth_active'),0);
 console.log(`PASS: 72 threshold/funds/target scenarios (${cases} births), same-room normal/ESC return, negative dialogue and mood, original-slot preservation, duplicate prevention, two pending births.`);
})().catch(e=>{console.error(e);process.exitCode=1});
