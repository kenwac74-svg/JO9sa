// Packaged bridge executed by QSP 5.8; minimal screens isolate targeting/return.
const fs=require('fs'),path=require('path'),assert=require('assert');
const vendor=path.resolve(__dirname,'../audits/reward-diagnostic/vendor-legacy/package');
const {initQspEngine}=require(path.join(vendor,'dist/node/wasm-engine.cjs'));
const p=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(process.argv[2],'qsp-patches.json'),'utf8')).map(x=>[x.Name,x.Text]));
const shift=s=>[...s].map(c=>String.fromCharCode((c.charCodeAt(0)-5)&65535)).join('');
function game(l){let f=['QSPGAME','','',shift(String(l.length))];for(const[n,c]of l)f.push(shift(n),'',shift(c.replace(/\r?\n/g,'\r\n')),shift('0'));let b=Buffer.from(f.join('\r\n')+'\r\n','utf16le');return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}
(async()=>{
 const api=await initQspEngine(path.join(vendor,'dist/qsp-engine.wasm'));let errors=[];
 api.on('error',e=>errors.push(e));
 let main='';api.on('main_changed',s=>{main=s});
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1)});
 const swap=p['#static_base'].match(/\$swap_slave_instances = \{[\s\S]*?\n\}/)[0];
 const start=`CONST_INT['slave_exist']=1\n$slave_vars[0]='instance'\n$slave_vars[1]='instance_state'\n$slave_vars[2]='$instance_psy_status'\n$update_slave_features_list='! stub'\n${swap}`;
 const guard=n=>`gs 'snk_room_bridge', 'guard', '${n}'\n$seen='${n}'`;
 const locs=[['start',start],['snk_room_bridge',p.snk_room_bridge],['#var_base',''],['#txt_man',''],['#txt_2_man',''],['slave_stat',guard('slave_stat')],['debug_info',guard('debug_info')],['item_change',guard('item_change')+"\nslave['equipment_test']=99\ngt 'slave_stat'"],['master_stat',"$seen='master_stat'"],['menu_form',p.menu_form.split(/\r?\n/).slice(0,2).join('\n')]];
 locs.find(x=>x[0]==='debug_info')[1]=p.debug_info;
 locs.find(x=>x[0]==='menu_form')[1]=p.menu_form.split('!main menu')[0]+"\n*p 'MENU_BASE'";
 locs.push(['$slave_price',''],['main_layout','layout_replaced += 1']);
 for(let n=1;n<=4;n++)locs.push([`slave_private_room${n}`,`$seen='slave_private_room${n}' & *p 'ROOMBASE${n}'`]);
 api.openGame(game(locs),true);api.restartGame();
 function run(s){api.execCode(s);assert.deepStrictEqual(errors,[])}
 const num=n=>Number(api.readVariable(n)),str=n=>api.readVariable(n),v=(a,k)=>Number(api.readVariableByKey(a,k));
 for(let n=1;n<=4;n++){
  run(`slave_state=1 & slave['id']=900 & room${n}_state=1 & room${n}['id']=${n}`);
  for(const route of ['inventory','portrait']){
   run(`gs 'snk_room_bridge', '${route}', ${n}`);
   assert.equal(str('$seen'),route==='summary'?'debug_info':'slave_stat');assert.equal(v('slave','id'),n);
   if(route==='inventory'){assert.equal(num('slave_stat_screen'),2);run("slot=24 & gt 'item_change'");assert.equal(v('slave','equipment_test'),99)}
   if(route==='portrait')assert.equal(num('slave_stat_screen'),0);
   run("gs 'snk_room_bridge', 'inventory_close'");assert.equal(str('$seen'),`slave_private_room${n}`);assert.equal(v('slave','id'),900);assert.equal(v(`room${n}`,'id'),n);assert.equal(num('snk_room_target'),0);
  }
  run(`gt 'slave_private_room${n}'`);
  run(`$room${n}_name='Resident${n}' & $room${n}_psy_status='servile' & gs 'snk_room_bridge', 'summary', ${n}`);
  assert(main.includes(`ROOMBASE${n}`)&&main.includes('snk_summary_layer')&&main.includes(`Resident${n}`));
  assert(!main.includes('debug_quit_'));assert.equal(num('layout_replaced'),0);assert.equal(v('slave','id'),900);
  if(n===1)fs.writeFileSync(path.join(__dirname,'../audits/test11-summary-fragment.html'),main.replace('ROOMBASE1',''));
  assert.equal(str(`$room${n}_psy_status`),'servile');
  const close=main.match(/id="snk_summary_close"[\s\S]*?href="EXEC: ([^"]+)"/)[1];
  assert.equal(close,'gt $curloc');run(close);
  assert(main.includes(`ROOMBASE${n}`)&&!main.includes('snk_summary_layer'));
  run(`gs 'snk_room_bridge', 'enter', ${n}, 15 & gt 'menu_form'`);
  run(`gs 'snk_room_bridge', 'summary', ${n}`);
  assert(main.includes('MENU_BASE')&&main.includes('snk_summary_layer'));assert.equal(num('snk_room_target'),n);
  run(close);assert(main.includes('MENU_BASE')&&!main.includes('snk_summary_layer'));assert.equal(num('menu_form'),15);
  run("gs 'snk_room_bridge', 'leave'");assert.equal(v('slave','id'),900);
  run(`gs 'snk_room_bridge', 'master', ${n}`);assert.equal(str('$seen'),'master_stat');run("gs 'snk_room_bridge', 'master_close'");assert.equal(str('$seen'),`slave_private_room${n}`);
  run(`gs 'snk_room_bridge', 'enter', ${n}, 15 & gs 'snk_room_bridge', 'master', snk_room_target`);run("gt 'menu_form'");assert.equal(str('$seen'),`slave_private_room${n}`);assert.equal(v('slave','id'),900);
 }
 console.log('PASS QSP '+api.version()+': inventory, equipment changes, portrait, summary, master close/ESC, 4 rooms, active-slave restoration');
})().catch(e=>{console.error(e);process.exitCode=1});
