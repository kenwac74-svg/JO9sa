'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
console.log=()=>{};
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
const source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const doc=core.parse(fs.readFileSync(source));
const body=name=>{let l=doc.locations.find(x=>x.name===name);assert(l,name);return core.shift(doc.lines[l.body],5);};
const city=body('interaction_city'),start=city.indexOf('if interaction_city = 6229:'),end=city.indexOf('if interaction_city = 6230:',start);
assert(start>=0&&end>start);
const branch=city.slice(start,end),renderer=body('interaction_screen_city');
function variable(loc,name){let text=body(loc),i=text.indexOf(name+' = {'),j=text.indexOf('\r\n}\r\n',i);assert(i>=0&&j>i,name);return text.slice(i,j+3);}
function fixture(entries){const lines=['QSPGAME','smuggling result display probe','',core.shift(String(entries.length),-5)];for(const[name,code]of entries)lines.push(core.shift(name,-5),'',core.shift(code,-5),core.shift('0',-5));lines.push('');return Buffer.from(lines.join('\r\n'),'utf16le');}
async function main(){
 const entries=[['Start','exit'],['generate_clone',"stock_state=1"],['stock_to_slave_nogt','exit'],['_layout','exit'],['#var_base','exit'],['#txt_man','exit'],['#txt_2_man','exit'],['jo9_reference_panel',"$result=''"],['interior_change',"if $args[0]='jo9_html':$result=$args[1]"],['interaction_screen_city',renderer]];
 const raw=fixture(entries);core.parse(raw);
 const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm');
 const errors=[];let html='';
 api.on('error',e=>errors.push(e));api.on('main_changed',text=>html=text);
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','view','open_game','load_save','save_game','sleep','panel_visibility','stats_changed','actions_changed','objects_changed','timer','user_input','system_cmd','refresh','show_window'])api.on(ev,(...args)=>{const cb=args.find(x=>typeof x==='function');if(cb)cb(ev==='version'?'5.7.0':ev==='is_play'?false:0);});
 api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 const q=value=>"'"+value.replaceAll("'","''")+"'";
 const scenarios=[{name:'high reputation without amulet',reputation:3,amulet:0,caught:true},{name:'high reputation with amulet',reputation:3,amulet:1,caught:false},{name:'low reputation without amulet',reputation:2,amulet:0,caught:false}];
 const results=[];
 for(const test of scenarios){
  html='';const before=errors.length;
  const setup=["killall","$onnewloc=''","$ongload=''","$counter=''","settimer 0","*clr","killobj","interaction_city=6229","sparks=10000",`brand_reputation=${test.reputation}`,`guild_reputation=${test.reputation}`,`snake_amulet_on=${test.amulet}`,"master_energy=10","assistant_state=1","assistant['energy']=10","CONST_INT['slave_exist']=1","$master_name='QA_MASTER'","$slave_vars[0]='instance'","$slave_vars[1]='instance_state'","$npc_image['master_skups']='master_scoops'","$npc_name['master_skups']='SKUPS'","$npc_image['bararaika']='bararaika'","$npc_name['bararaika']='BARARAIKA'","$bg['smugglers_den']='test-background'",variable('#static_base','$clear_slave_instance'),variable('#dynamic','$master_energy_drop'),variable('#dynamic','$assistant_energy_drop'),branch,"txt=1","gt 'interaction_screen_city'"].join('\r\n');
  fs.writeFileSync(__dirname+'/probe-setup.txt',setup);
  api.execCode(setup);
  if(errors.length>before){let lines=setup.split('\r\n'),at=errors[errors.length-1].line;process.stderr.write(lines.slice(Math.max(0,at-4),at+3).map((s,i)=>(Math.max(0,at-4)+i+1)+': '+s).join('\n')+'\n');}
  assert.equal(errors.length,before,JSON.stringify(errors.slice(before)));
  const values={npc:api.readVariable('npc'),npcId:api.readVariable('$npc_id'),text:api.readVariable('$text',1),returnTo:api.readVariable('$return_lock'),guildRate:api.readVariable('guild_reputation_rate'),brandRate:api.readVariable('brand_rate'),fine:api.readVariable('fine'),sparks:api.readVariable('sparks')};
  const showsSkups=html.includes('characters\\master_scoops.png');
  assert.equal(showsSkups,test.caught,'NPC image output mismatch: '+test.name);
  assert.equal(values.guildRate,test.caught?-10:-5);
  assert.equal(values.returnTo,test.caught?'guild':'shop_general');
  assert(html.includes(test.caught?'[마스터 스컵스]':'[발랄라이카]'));
  results.push({name:test.name,caught:test.caught,npcId:values.npcId,guildRate:values.guildRate,brandRate:values.brandRate,fine:values.fine,sparks:values.sparks,returnTo:values.returnTo,skupsImageInHtml:showsSkups,warningTextInHtml:html.includes('[마스터 스컵스]')});
 }
 const result={status:'PASS',sourceQspSha256:doc.hash,engine:'QSP WASM 5.8.0',scenarios:results,limitations:['Only the unchanged 6229 branch, energy/clear helpers and actual result renderer executed; generation/acquisition, database refresh and layout/interior formatting are stubbed.','No personal save loaded; native FastQSP window appearance not verified.'],gameFilesModified:false};
 fs.writeFileSync(__dirname+'/render-probe.json',JSON.stringify(result,null,2)+'\n');
 process.stdout.write(JSON.stringify(result)+'\n');
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
