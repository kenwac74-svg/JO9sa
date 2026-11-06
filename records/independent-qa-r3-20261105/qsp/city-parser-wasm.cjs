'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const vendor='G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package';
const {initQspEngine}=require(vendor+'/dist/node/wasm-engine.cjs');
const source='G:/Codex/tmp/jo9-independent-qa-r2-20261105/qsp/jack.qsp',raw=fs.readFileSync(source),doc=core.parse(raw),enc=s=>core.shift(s,-5);
const fixture=Buffer.from(['QSPGAME','','',enc(String(doc.locations.length)),...doc.locations.flatMap(l=>[enc(l.name),'',enc(l.name==='interaction_city'?core.shift(doc.lines[l.body],5):l.name==='Start'?'':"result=0\r\n$qa_last_stub='"+l.name.replaceAll("'","''")+"'"),enc('0')]),''].join('\r\n'),'utf16le');
(async()=>{
 const api=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),errors=[],checks=[];
 api.on('error',e=>errors.push(e));for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 for(const hero of [1,101])for(const interaction of [0,111,10401]){
  const at=errors.length;api.execCode(`hero_choice=${hero}\r\ninteraction_city=${interaction}\r\nsnk_room_target=0\r\n$npc_id=''\r\n$place=''\r\n$qa_last_stub=''\r\ngs 'interaction_city'\r\nqa_after_city=1`);
  checks.push({hero,interaction,errors:errors.slice(at),npc:api.readVariable('$npc_id'),place:api.readVariable('$place'),lastStub:api.readVariable('$qa_last_stub'),after:api.readVariable('qa_after_city')});
 }
 const r={createdAt:new Date().toISOString(),source,inputSha256:core.hash(raw),engineVersion:api.version(),fixture:'Whole candidate interaction_city body unchanged; all other production locations are empty stubs returning zero and recording their name.',checks,limits:['This probes full interaction_city control flow only under synthetic minimum state.','Every other location is stubbed; no whole-game runtime or visual behavior is certified.','No game/native EXE launched.']};
 fs.writeFileSync(path.join(__dirname,'city-parser-wasm-results.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
