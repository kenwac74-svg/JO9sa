'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
console.log=()=>{};
async function main(){
 const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),doc=core.parse(raw),loc=doc.locations.find(x=>x.name==='interaction_city'),city=core.shift(doc.lines[loc.body],5);
 const code=JSON.parse(fs.readFileSync(__dirname+'/logic.json','utf8'));
 const fashion=code.fashion.filter(x=>['102031','102032','102033'].includes(x.id)).slice(0,3).map(x=>x.body).join('\r\n');
 const lo=city.indexOf('IF interaction_city = 6021:'),hi=city.indexOf('IF interaction_city = 6022:',lo),witch=city.slice(lo,hi);
 assert(lo>=0&&hi>lo);
 const fields=['QSPGAME','quest route audit','',core.shift('1',-5),core.shift('Start',-5),'',core.shift('exit',-5),core.shift('0',-5),''];
 const fixture=Buffer.from(fields.join('\r\n'),'utf16le'),api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm');
 const errors=[];api.on('error',e=>errors.push(e));
 for(const ev of ['timer','main_changed','stats_changed','actions_changed','objects_changed','refresh','show_window','panel_visibility','close_file'])api.on(ev,()=>{});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const results=[];
 for(const state of [{progress:2,slave:0,expected:102032},{progress:2,slave:1,expected:102032},{progress:1,slave:1,expected:102033},{progress:0,slave:0,expected:102032}]){
  api.execCode(`killall\r\nCONST_INT['slave_exist']=1\r\ninteraction_city=102031\r\nnpc_progress['Amarida']=${state.progress}\r\nslave_state=${state.slave}\r\nslave['brand']=1\r\n${fashion}`);
  assert.equal(errors.length,0,JSON.stringify(errors));const route=api.readVariable('interaction_city'),progress=api.readVariable('npc_progress','Amarida');assert.equal(route,state.expected);assert.equal(progress,1);
  results.push({kind:'Amarida',beforeProgress:state.progress,carryingSlave:state.slave,route,afterProgress:progress});
 }
 for(const claimed of [0,1]){
  api.execCode(`killall\r\n$quest[14]='qa14'\r\n$quest[15]='qa15'\r\nactive['qa14']=2\r\nactive['qa15']=2\r\nrevolution=1\r\nwitch_text=2\r\nwitch_talk=${claimed}\r\ninteraction_city=6021\r\n${witch}\r\nqa_reward_available=iif(revolution=1 and witch_talk=0,1,0)`);
  assert.equal(errors.length,0,JSON.stringify(errors));const route=api.readVariable('interaction_city');assert.equal(route,6024);
  results.push({kind:'Priscilla',rebellionComplete:true,rewardAlreadyClaimed:Boolean(claimed),route,rewardMenuAvailable:api.readVariable('qa_reward_available')===1,quest15State:api.readVariable('active','qa15'),revolution:api.readVariable('revolution')});
 }
 const result={status:'PASS',sourceQspSha256:doc.hash,cases:results,scope:'Exact current routing/offer bodies; GUI, full deliveries and player saves not executed',gameModified:false};fs.writeFileSync(__dirname+'/probe.json',JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify(result)+'\n');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
