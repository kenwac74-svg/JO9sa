'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),save=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const T='G:/Codex/tmp/save-autoclean-20261118/native',meta=JSON.parse(fs.readFileSync(__dirname+'/native-prepared.json','utf8'));
const log=fs.readFileSync(T+'/stderr.log','utf8');a(log.includes('JO9_CLEAN_FINAL_PASS_'+meta.assertions));a(!log.includes('JO9_CLEAN_FAIL'));
const rawNormal=fs.readFileSync(T+'/normal.sav'),rawClean=fs.readFileSync(T+'/clean.sav'),n=save.parse(rawNormal),cl=save.parse(rawClean),scope=require('./scope/whitelist.json');
const record=(s,key)=>s.vars.filter(v=>v.name===key.replace(/^\$/,'').toUpperCase());
a.equal(record(n,'VOICE_FRAGMENT_IDS')[0].values.length,9120);a.equal(record(n,'VOICE_FRAGMENT_ITEM')[0].values.length,69717);
for(const key of scope.cacheVariables)for(const v of record(cl,key)){a.equal(v.values.length,0,'Cache values excluded: '+key);a.equal(v.idx.length,0,'Cache keys excluded: '+key);}
a.equal(save.value(cl,'VOICE_FRAGMENT_REVISION')[0],'0');
const excluded=new Set([...scope.cacheVariables.map(s=>s.replace(/^\$/,'')),...scope.invalidateTogether,'qa_prior_calls'].map(s=>s.toUpperCase()));
const normalKept=n.vars.filter(v=>!excluded.has(v.name)),cleanKept=cl.vars.filter(v=>!excluded.has(v.name));
a.deepEqual(cleanKept,normalKept,'Every other native saved variable must be identical, including slots and duplicate records');
const result={status:'PASS',nativeAssertions:meta.assertions,nativeEngine:'WORK engine/jack.exe',nativeCandidateSha256:meta.candidateSha256,normalBytes:rawNormal.length,cleanBytes:rawClean.length,normalVoiceRows:9120,normalLookupRows:69717,cleanVoiceDataValues:0,otherVariableRecordsIdentical:normalKept.length,previousSaveHookCalls:{normal:save.value(n,'QA_PRIOR_CALLS')[0],clean:save.value(cl,'QA_PRIOR_CALLS')[0]},normalSaveKeepsCache:true,cleanIsExplicit:true,originalUserSaveWritten:false,actualGuiSaveDialog:'not automated; direct SAVEGAME path and rendered home/city settings guards verified'};
fs.writeFileSync(__dirname+'/native-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
