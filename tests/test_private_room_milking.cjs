// Execute shipped button conditions, links, bridge and original room milk arithmetic.
// Rendering/result helpers are stubbed; this is not a desktop playthrough.
const fs=require('fs'),path=require('path'),assert=require('assert');
const vendor=path.resolve(__dirname,'../audits/reward-diagnostic/vendor-legacy/package');
const {initQspEngine}=require(path.join(vendor,'dist/node/wasm-engine.cjs'));
const p=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(process.argv[2],'qsp-patches.json'),'utf8')).map(x=>[x.Name,x.Text.replace(/\r\n/g,'\n')]));
const shift=s=>[...s].map(c=>String.fromCharCode((c.charCodeAt(0)-5)&65535)).join('');
function game(l){let f=['QSPGAME','','',shift(String(l.length))];for(const[n,c]of l)f.push(shift(n),'',shift(c.replace(/\r?\n/g,'\r\n')),shift('0'));let b=Buffer.from(f.join('\r\n')+'\r\n','utf16le');return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}
const quick=s=>s.slice(s.indexOf('*p \'<div id="snk_room_quick">'),s.indexOf("if (exam_in_progress = 1",s.indexOf('snk_room_quick')));
(async()=>{
 const api=await initQspEngine(path.join(vendor,'dist/qsp-engine.wasm'));let errors=[],main='';
 api.on('error',e=>errors.push(e));api.on('main_changed',s=>main=s);
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1)});
 const swap=p['#static_base'].match(/\$swap_slave_instances = \{[\s\S]*?\n\}/)[0];
 const start=`CONST_INT['slave_exist']=1\nCONST_INT['no_slave']=0\n$slave_vars[0]='instance'\n$slave_vars[1]='instance_state'\n$update_slave_features_list='! stub'\n${swap}`;
 const milk=p.interaction.slice(p.interaction.indexOf('if interaction = 596:'),p.interaction.indexOf('if interaction = 7770:'));
 const locs=[['start',start],['snk_room_bridge',p.snk_room_bridge],['#var_base',''],['#txt_man',''],['#txt_2_man',''],['display_pic',"$result=''"],['menu_form',quick(p.snk_room_menu_screen)],['interaction',"gs 'snk_room_bridge', 'guard', 'interaction'\n"+milk]];
 for(let n=1;n<=4;n++)locs.push([`slave_private_room${n}`,quick(p[`slave_private_room${n}`])]);
 api.openGame(game(locs),true);api.restartGame();
 function run(s){api.execCode(s);assert.deepStrictEqual(errors,[])}
 const num=n=>Number(api.readVariable(n)),v=(a,k)=>Number(api.readVariableByKey(a,k));
 for(let n=1;n<=4;n++)for(const submenu of [false,true]){
  for(const [lactation,amount,state] of [[0,30,'hidden'],[1,0,'disabled'],[1,9,'disabled'],[1,10,'enabled'],[1,25,'enabled']]){
   run(`slave_state=1 & slave['id']=900 & slave['milk_summ']=77 & room${n}_state=1 & room${n}['id']=${n} & room${n}['lactation']=${lactation} & room${n}['milk_summ']=${amount}`);
   if(submenu)run(`gs 'snk_room_bridge', 'enter', ${n}, 15 & gt 'menu_form'`);else run(`gt 'slave_private_room${n}'`);
   assert(!main.includes('fast_button.png')&&!main.includes('안개 괴물'));
   if(state==='hidden')assert(!main.includes('milking'));
   if(state==='disabled'){assert(main.includes('action_milking_gray.png'));assert(!main.includes('tooltip-data="노예 착유"'));assert(main.includes('젖이 부족함'))}
   if(state==='enabled'){
    assert(main.indexOf('action_milking.png')>main.indexOf('action_wash.png'));
    const cmd=main.match(/tooltip-data="노예 착유" href="EXEC: ([^"]+)"/)[1];run(cmd);
    assert.equal(num('interaction'),595+n);assert.equal(num('snk_room_target'),0);
    assert.equal(v(`room${n}`,'id'),n);assert.equal(v('slave','id'),900);assert.equal(v('slave','milk_summ'),77);
    assert.equal(v(`room${n}`,'milk_summ'),amount%10);assert.equal(num('milk_bottle_plus'),Math.floor(amount/10));
    assert.equal(api.readVariable('$return_lock'),`slave_private_room${n}`);
   }
   run("gs 'snk_room_bridge', 'leave'");
  }
 }
 console.log('PASS: 40 visibility/routing cases; 4 rooms and submenus; thresholds 0/9/10/25; original milk arithmetic; active slave preserved; room return destination; excluded work absent.');
})().catch(e=>{console.error(e);process.exitCode=1});
