'use strict';
// Stage or inspect one native full-table save; all outputs remain in the task root.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='G:/Codex/tmp/gold-test-save-20261026',repo='G:/somi/JO9sa',record=repo+'/records/gold-ap-audit-20261026/save-factory';
const c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs');
const recipe=JSON.parse(fs.readFileSync(root+'/recipe.json','utf8')),mode=process.argv[2]||'stage';
const input=mode==='verify'?(process.argv[3]||recipe.finalNativeOutput):recipe.factoryOutput;
const raw=fs.readFileSync(input),d=s.parse(raw);assert(s.serialize(d).equals(raw));
const removedEmptyFactoryVariables=[];d.vars=d.vars.filter(v=>{if(v.name==='JO9SV_READY'){assert.equal(v.values.length,0);assert.equal(v.idx.length,0);removedEmptyFactoryVariables.push({name:v.name,slot:v.slot});return false;}return true;});
function pair(name,key){return s.value(d,name,key)}
function num(name,key){return Number(pair(name,key)[0])}
function text(name,key){return pair(name,key)[1]}
function inspect(){
 const activeKey=text('EVENT','Akabur_quest');
 const checks={nativeSaveFormat:true,roundtrip:s.serialize(s.parse(s.serialize(d))).equals(s.serialize(d)),normalLoadCallback:text('ONGLOAD')==='$ongload',realSavedLocation:s.dec(d.lines[10])==='shop_general',slaveJasmine:num('SLAVE_TYPE')===2617,assistantIsabella:num('ASSISTANT_TYPE')===2571,slavePresent:num('SLAVE_STATE')===1,assistantPresent:num('ASSISTANT_STATE')===1,slaveAdult:num('SLAVE','age')===0,assistantAdult:num('ASSISTANT','age')===2,goldZero:num('GOLD')===0,sparks5000:num('SPARKS')===5000,masterAP5:num('MASTER_ENERGY')===5&&num('MASTER_HALF_ACTION')===0,assistantAP5:num('ASSISTANT','energy')===5&&num('ASSISTANT','half_action')===0,slaveAP5:num('SLAVE','energy')===5&&num('SLAVE','half_action')===0,normalAssistantVoice:num('ASSISTANT','jo9_voice_trait')===0,noInfiniteEnergy:num('CHEAT_INF_EN')===0,noHalfCostRing:num('BULL_RING_ON')===0,noEasyCredits:num('EASY_FOR_MASTER')===0&&num('EASY_FOR_ASSISTANT')===0&&num('EASY_FOR_SLAVE')===0,stage12:num('ACTIVE',activeKey)===12,jasmineOwned:num('UNIQUE_SLAVE','jasmine')===1,jasmineProgress:num('NPC_PROGRESS','jasmine')===1,notLost:num('LOST_QUEST_SLAVE')===0&&num('LOST_QUEST_SLAVE_JASMINE')===0,workAvailable:num('JASMINE_JOB')===0&&num('FIRST_JOB_IN_A_BALSAM_BOUTIQUE')===0,balsamStart:text('PLACE')==='balsam_boutique'&&num('SP_TXT')===1&&num('INTERACTION_CITY')===3021,noDiagnosticVariables:!d.vars.some(v=>/^(QA_|JO9SV_)/.test(v.name))};
 const storedText=[...d.lines.slice(0,d.start).map(s.dec),...d.vars.flatMap(v=>v.values.map(x=>x[1]))].join('\n');
 checks.noDiagnosticCalls=!/jo9sv_boot_gold_ap|jo9sv_emit_gold_ap|JO9SV_READY|JO9_QA_/i.test(storedText);
 checks.goldNativeSlotOnly=!d.vars.some((v,i)=>d.vars.some((other,j)=>j!==i&&other.slot===v.slot));
 const result={input,sha256:c.hash(raw),bytes:raw.length,crc:s.dec(d.lines[2]),variables:d.vars.length,stringsWithNewlines:d.vars.reduce((n,v)=>n+v.values.filter(x=>/[\r\n]/.test(x[1])).length,0),goldSlot:d.vars.find(v=>v.name==='GOLD')?.slot??null,checks};
 assert(Object.values(checks).every(Boolean),'Save inspection failed: '+Object.entries(checks).filter(([k,v])=>!v).map(([k])=>k).join(','));
 return result;
}
const before=inspect();
function interiorCache(){
 const changes=[],estate=text('ESTATE');
 function put(name,key,next){const v=d.vars.find(v=>v.name===name),i=v?.idx.find(x=>x[1]===key.toUpperCase())?.[0];assert(i!==undefined,name+'.'+key);const previous=v.values[i][1];v.values[i][1]=next;return previous}
 const rooms=[['study','STUDY','STUDY',true,'home_lux'],['bedroom','BED','BED',true,'bedroom_lux'],['bathroom','BATH','BATH',num('BATH')>0,'bathroom_lux'],['dungeon','DUNGEON','DUNGEON',num('DUNGEON')>0,'dungeon_lux'],['kitchen','KITCHEN','KITCHEN',num('KITCHEN')>0,'kitchen_lux'],['lab','LAB','LAB',num('LAB')>0,'lab_lux'],['boudoir','BOUDOIR','BOUDOIR',num('BOUDOIR')>0,'boudoir_lux'],['barn','BARN','BARN',num('BARN')>0,'barn_lux']];
 for(const [room,field,stem,enabled,large]of rooms){
  if(!enabled)continue;const key=text(field),value=room==='barn'?text('INTERIOR_BARN'):text('INTERIOR_'+stem,key),wide=room==='barn'?text('INTERIOR_BARN_LARGE'):text('INTERIOR_'+stem+'_LARGE',key);assert(value&&wide,'Existing interior lookup '+room);
  for(const [place,next]of [[room,value],[large,wide]]){const prev=put('BG',place,next);if(prev&&prev!==next){for(let j=0;j<d.start;j++){let t=s.dec(d.lines[j]);for(const slash of ['\\','/']){const url=x=>'content'+slash+'pic'+slash+'bg'+slash+x.replace(/[\\/]/g,slash)+'.png';t=t.split(url(prev)).join(url(next));}d.lines[j]=s.enc(t);}changes.push({place,from:prev,to:next})}}
  put('PLACE_NAME',room,text('ESTATE_'+stem+'_NAME',estate));put('PLACE_LOCATION',room,text('ESTATE_'+stem+'_LOCATION',estate));put('PLACE_INFO',room,room==='barn'?text('INTERIOR_BARN_INFO'):text('INTERIOR_'+stem+'_INFO',key));
 }
 return changes;
}
if(mode==='stage'){
 const variablesBefore=d.vars.length,namesBefore=d.vars.map(v=>[v.name,v.slot]),changes=interiorCache(),output=s.serialize(d);
 assert.equal(d.vars.length,variablesBefore);assert.deepEqual(d.vars.map(v=>[v.name,v.slot]),namesBefore);assert(s.serialize(s.parse(output)).equals(output));
 assert(!fs.existsSync(recipe.stagedOutput),'Do not overwrite staged save');fs.writeFileSync(recipe.stagedOutput,output,{flag:'wx'});
 const report={removedEmptyFactoryVariables,mode:'STAGED_REQUIRES_NATIVE_WORK_SAVE',factory:before,output:recipe.stagedOutput,sha256:c.hash(output),bytes:output.length,fullVariableTablePreserved:true,variableNamesAndNativeSlotsPreserved:true,interiorCacheRestoredByExistingFactoryRule:changes,crcBinding:'Unchanged factory CRC. Root must Load this in byte-identical work.qsp and Save through native menu solely for manufacture. No gameplay or CRC re-load testing.',protectedInputs:[{file:recipe.source,sha256:c.hash(fs.readFileSync(recipe.source))},{file:recipe.baseSave,sha256:c.hash(fs.readFileSync(recipe.baseSave))}]};
 assert.equal(report.protectedInputs[0].sha256,recipe.sourceSha256);assert.equal(report.protectedInputs[1].sha256,recipe.baseSha256);fs.writeFileSync(record+'/stage-inspection.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}else if(mode==='verify'){
 const report={mode:'FINAL_NATIVE_SAVE_INSPECTED',...before,strictCrcNativeLoad:'Not run at user request; native current-WORK Save is used only to manufacture the checksum-bound artifact.',originalSourceUnchanged:c.hash(fs.readFileSync(recipe.source))===recipe.sourceSha256,originalBaseUnchanged:c.hash(fs.readFileSync(recipe.baseSave))===recipe.baseSha256};
 assert(report.originalSourceUnchanged&&report.originalBaseUnchanged);fs.writeFileSync(record+'/final-save-inspection.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}else throw Error('stage or verify required');
