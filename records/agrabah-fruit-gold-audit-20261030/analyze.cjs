'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const H=__dirname,T='G:/Codex/tmp/agrabah-fruit-gold-audit-20261030',G='G:/somi/Jack O Nine Tails v2.4_work/game';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,''));
const p=json(H+'/prepared.json'),runs=json(T+'/client-results.json');a.equal(runs.length,6);a(runs.every(x=>x.pass));
const state=sc.parse(read(T+'/transactions.sav')),keys=['qa_gold_after_exchange','qa_minibox_gold_bought','qa_minibox_sparks_bought','qa_banquet_gold_before','qa_banquet_gold_bought','qa_banquet_sparks_bought','qa_first_job_gold','qa_after_repeat','qa_after_refresh','gold','sparks'];
const transactions=Object.fromEntries(keys.map(k=>[k,Number(sc.value(state,k)[0])]));
a.equal(transactions.qa_gold_after_exchange,25);a.equal(transactions.qa_first_job_gold,85);a.equal(transactions.qa_after_repeat,transactions.qa_after_refresh);a(transactions.qa_after_repeat>=120&&transactions.qa_after_repeat<=145);
const menus=[];
for(const run of runs.filter(x=>x.name.startsWith('menu-'))){const s=sc.parse(read(T+'/'+run.name+'.sav')),raw=sc.value(s,'qa_fruit_menu')[1];let observed;try{observed=JSON.parse(decodeURIComponent(raw));}catch{const decoded=decodeURIComponent(raw),mini=decoded.match(/"mini":(true|false)/),maxi=decoded.match(/"maxi":(true|false)/);a(mini&&maxi);observed={mini:mini[1]==='true',maxi:maxi[1]==='true',raw,metadataNote:'Boolean fields are intact. Native URL handling changes quotes inside nested href strings, so raw text is retained rather than treated as valid JSON.'};}
 menus.push({name:run.name,gold:Number(sc.value(s,'gold')[0]),sparks:Number(sc.value(s,'sparks')[0]),questStage:Number(sc.value(s,'active',sc.value(s,'event','Akabur_quest')[1])[0]),minibox:Number(sc.value(s,'fruits_minibox')[0]),maxibox:Number(sc.value(s,'fruits_maxibox')[0]),observed,pass:run.pass});}
a.equal(c.hash(read(G+'/jack.qsp')),p.qsp);a.equal(c.hash(read(p.sourceSave)),p.saveHash);
const result={pass:true,nativeCases:6,transactions,menus,workUnchanged:true,sourceSaveUnchanged:true,qspSha256:p.qsp,sourceSaveSha256:p.saveHash,reporterSaveAvailable:false,fullReporterGuiLoadTested:false,fixtureQuestStage:p.fixtureStage[0],limitations:p.limits};
fs.writeFileSync(H+'/native-results.json',JSON.stringify(result,null,2));fs.copyFileSync(T+'/client-results.json',H+'/client-results.json');
for(const run of runs)for(const suffix of ['-stderr.log','-stdout.log'])fs.copyFileSync(T+'/'+run.name+suffix,H+'/'+run.name+suffix);
console.log(JSON.stringify({pass:true,cases:6,transactions,menus:menus.map(x=>({name:x.name,gold:x.gold,stage:x.questStage,mini:x.observed.mini,maxi:x.observed.maxi})),workUnchanged:true,sourceSaveUnchanged:true},null,2));
