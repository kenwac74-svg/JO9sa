'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),codec=require(repo+'/tools/qa/save-codec.cjs');
const q=s=>"'"+String(s).replaceAll("'","''")+"'",e='\r\n';
const source=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);qa.assertOutside(out,[game,repo]);
const raw=fs.readFileSync(source),sourceHash=core.hash(raw);fs.mkdirSync(out,{recursive:true});
for(const n of ['json','config.xml'])if(!fs.existsSync(path.join(out,n)))fs.cpSync(path.join(game,n),path.join(out,n),{recursive:n==='json'});
fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan=[],manifest=[];
for(const [file,name] of [['1.sav','save-slot-one'],['auto_decade.sav','save-decade']]){
 const savePath=path.join(game,'save',file),saveRaw=fs.readFileSync(savePath),s=codec.parse(saveRaw);
 assert(codec.serialize(s).equals(saveRaw));assert.equal(codec.value(s,'ongload')[1],'$ongload');
 assert(!s.vars.some(v=>v.name==='QA_SAVE_STAGE'),'Fixture stage variable must not exist');
 const input=path.join(out,name+'-input.sav'),roundtrip=path.join(out,name+'-roundtrip.sav');fs.writeFileSync(input,saveRaw);
 const terms=[];
 for(const role of ['slave','assistant']){
  const v=s.vars.find(v=>v.name===role.toUpperCase());assert(v);assert(['0','2'].includes(codec.value(s,role,'age')[0]));
  for(const [index,key] of v.idx){if(key==='ERO_RWD_CNT')continue;terms.push(role+'['+q(key)+']='+Number(v.values[index][0]));}
 }
 for(const name of ['day','decadecount','sparks','slave_state','assistant_state'])terms.push(name+'='+Number(codec.value(s,name)[0]));
 const test=terms.map((t,i)=>'if ('+t+') = 0: msg '+q('JO9_QA_SAVE_ASSERT_'+i)+' & exit').join(e);
 const marker='JO9_QA_VARBASESAVE_'+name.replaceAll('-','_')+'_COMPLETE';
 const d=core.parse(raw),loc=n=>{const l=d.locations.find(l=>l.name===n);assert(l,'Missing '+n);return l;};
 const shutdown=["settimer 0","$counter=''","$onnewloc=''","$ongsave=''",'autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','snk_room_target=0'].join(e);
 const hook=[shutdown,'if qa_save_stage=0:',test,"gs 'refresh_database'",test,'qa_save_stage=1','savegame '+q(path.basename(roundtrip)),'opengame '+q(path.basename(roundtrip)),'elseif qa_save_stage=1:',test,'msg '+q(marker),'else',"msg 'JO9_QA_SAVE_BAD_STAGE'",'end'].join(e);
 d.lines[loc('$ongload').body]=core.shift(hook,-5);
 d.lines[loc('Start').body]=core.shift(shutdown+e+'opengame '+q(path.basename(input)),-5);
 const probeRaw=core.serialize(d);qa.inspectWorld(probeRaw);const probe=path.join(out,name+'.qsp');fs.writeFileSync(probe,probeRaw);
 plan.push({name,file:probe,marker,checkpoint:'$ongload isolated save hook'});
 manifest.push({name,inputSource:savePath,inputCopy:input,roundtrip,sourceSaveSha256:core.hash(saveRaw),checksPerStage:terms.length,limits:['Replaces diagnostic onload callback; verifies actual save decoding, refresh and native save/reload, not original GUI callback route.','ignoreCRC=true matches installed FastQSP compatibility mode; strict-CRC mode is not verified.']});
 assert.equal(core.hash(fs.readFileSync(savePath)),core.hash(saveRaw));
}
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({source,sourceHash,probes:manifest},null,2));
assert.equal(core.hash(fs.readFileSync(source)),sourceHash);console.log(JSON.stringify({built:plan.length,sourceHash,checks:manifest.map(x=>x.checksPerStage),plan:path.join(out,'plan.json')}));