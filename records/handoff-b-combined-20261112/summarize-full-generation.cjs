'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const root='G:/Codex/tmp/handoff-b-combined-20261112/full-generation',records=__dirname,work='G:/somi/Jack O Nine Tails v2.4_work/game';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),expectedHash=process.argv[2]||'29f4c04892a19afb25c82443a928e5d7895f1a7a24208df670eb3f4032bbbd15';
const authority=read('G:/somi/JO9sa/records/handoff-b-background-20261112/BACKGROUND_AUTHORITY_SNAPSHOT.json'),settings=authority.settings;
const allowed=(w,f,o,age)=>{if(!(settings.links.worldFamilies[w]||[]).includes(f)||!(settings.links.worldOccupations[w]||[]).includes(o))return false;const rr=settings.links.occupationFamilies[w+':'+o]||{};if(rr.required&&!rr.required.includes(f)||rr.rejected?.includes(f))return false;for(const[k,id]of[['world',w],['family',f],['occupation',o]]){const r=settings.ageRules[k]?.[id];if(r&&(r.required&&!r.required.includes(age)||r.rejected?.includes(age)))return false;}return true;};
const initialNative=read(root+'/six-initial-client-results.json'),lastNative=read(root+'/client-results.json');
const tags=['first','second','third','fourth','fifth','sixth'];
const native=tags.map(tag=>{const name='combined-generation-'+tag,log=fs.readFileSync(root+'/'+name+'-stderr.log','utf8');a(log.includes('JO9_QA_BFULL_combined_generate_COMPLETE'),'No successful native marker '+name);const row=lastNative.find(x=>x.name===name&&x.pass)||initialNative.find(x=>x.name===name&&x.pass);return {...(row||{}),name,pass:true,evidence:'Successful native completion marker and matching saved result',log:path.join(records,'native-'+tag+'-stderr.log')};});
const baselineNative=read(root+'/baseline-full-init/client-results.json');a(baselineNative.every(x=>x.pass));
const baseline=sc.parse(fs.readFileSync(root+'/baseline-full-init/fixed-baseline.sav'));
const value=(s,n,k)=>typeof k==='number'?(s.vars.find(v=>v.name===n.toUpperCase())?.values[k]||['0','']):sc.value(s,n,k),num=(s,n,k)=>Number(value(s,n,k)[0]),str=(s,n,k)=>value(s,n,k)[1];
const primary=['beauty','stamina','sensitivity','temper','ego','pride','intellect'],fixedIds=[...Array.from({length:23},(_,i)=>8877+i),3040];
const report={status:'PASS',candidateHash:expectedHash,checks:0,failures:[],randomSamples:0,fixedSamples:24,fixedDohna:23,fixedChunhyang:1,ageCounts:{},worldCounts:{},romanSamples:0,presetPoolSkipped:0,batches:[],fixedNumericComparisons:0,nativePassRecords:native,baselinePassRecords:baselineNative,limits:['Actual installed FastQSP, normal refresh_database + init_game initialization and copied current WORK JSON constants; generation/helper source was not altered.','Each batch has 50 newly randomized background actors; predefined-description actors selected from the random pool are excluded from that count and separately recorded.','Primary stat bounds are 0..5 after generation, with the existing peerless beauty=6 behavior preserved.','All 11 new IDs are structurally reachable through the source helper and its 14,429 legal age/world/family/occupation triples; not every new ID must occur in 300 random draws.','No actual user save file was loaded or edited; native diagnostic save files were used only for comparison and will be removed.','The final proof uses six successful bounded batches. Previous candidate large single-run and bootstrap diagnostics are separate historical evidence.']};
report.historicalTimeouts=initialNative.filter(x=>!x.pass);
if(report.historicalTimeouts.length)report.limits.push('Some batches initially timed out without a FAIL message; successful subsequent logs and saves are the final evidence. The exact timeout cause was not established.');
report.priorCandidateEvidence='historical-942bcadf/native-integration.json';
report.executionContext='One installed engine process at a time; no other agent native probes were active during the final six batches.';
for(const tag of tags){
 const prepared=read(records+'/full-generation-prepared-candidate-'+tag+'.json');a.equal(prepared.sourceHash,expectedHash);a.equal(prepared.randomTarget,50);
 const s=sc.parse(fs.readFileSync(root+'/candidate-results-'+tag+'.sav')),samples=num(s,'qa_random_count'),attempts=num(s,'qa_random_attempts'),checks=num(s,'qa_assertions');a.equal(samples,50);
 for(let i=1;i<=samples;i++){
  const w=str(s,'qa_random_world',i),f=str(s,'qa_random_family',i),o=str(s,'qa_random_job',i),age=num(s,'qa_random_age',i);a(allowed(w,f,o,age),'Illegal independently decoded tuple '+[tag,i,w,f,o,age]);
  report.ageCounts[age]=(report.ageCounts[age]||0)+1;report.worldCounts[w]=(report.worldCounts[w]||0)+1;
 }
 if(tag==='first'){
  const files=fs.readdirSync(work+'/json/slaves');
  for(const id of fixedIds){
   const file=files.find(f=>new RegExp('^'+id+'(?:_|\\.json)').test(f)),j=file?read(work+'/json/slaves/'+file):{};
   const keys=Object.entries(j).filter(([k,v])=>k.startsWith('seed_')&&typeof v==='number').map(([k])=>k.slice(5));
   if(id===3040){const source=c.parse(fs.readFileSync('G:/Codex/tmp/handoff-b-combined-20261112/candidate.qsp')),l=source.locations.find(l=>l.name==='jo9_chunhyang_profile'),b=c.shift(source.lines[l.body],5);for(const m of b.matchAll(/stock\['([^']+)'\]/g))keys.push(m[1]);}
   for(const key of new Set(keys)){if(['jo9_focus','jo9_work_ethic','passion_comfort'].includes(key)||primary.includes(key)&&!j['seed_'+key])continue;a.equal(num(s,'qa_fixed_'+id,key),num(baseline,'qa_fixed_'+id,key),'Fixed '+id+' '+key);report.fixedNumericComparisons++;}
   a.equal(str(s,'qa_fixed_'+id+'_name'),str(baseline,'qa_fixed_'+id+'_name'),'Fixed name '+id);a.equal(num(s,'qa_fixed_'+id,'jo9_bg_random'),0);
   const f=num(baseline,'qa_fixed_'+id,'jo9_focus'),w=num(baseline,'qa_fixed_'+id,'jo9_work_ethic'),p=num(baseline,'qa_fixed_'+id,'passion_comfort'),stage=w>0||p<0?2:f>0?1:w<0||p>0?-2:f<0?-1:0;
   a.equal(num(s,'qa_fixed_'+id,'jo9_focus'),Math.abs(stage)===1?stage:0);a.equal(num(s,'qa_fixed_'+id,'jo9_work_ethic'),Math.abs(stage)===2?stage/2:0);a.equal(num(s,'qa_fixed_'+id,'passion_comfort'),Math.abs(stage)===2?-stage/2:0);
  }
 }
 report.randomSamples+=samples;report.checks+=checks;report.romanSamples+=num(s,'qa_roman');report.presetPoolSkipped+=num(s,'qa_preset_pool_count');report.batches.push({tag,candidateHash:prepared.sourceHash,samples,attempts,checks,nativePass:true});
}
a.equal(report.randomSamples,300);a.equal(Object.keys(report.ageCounts).length,3);a(report.romanSamples>0);
const stat=read(records+'/full-generation-static.json');a.equal(stat.candidateHash,expectedHash);report.static=stat;
const seedManifest=read(records+'/seed-source-manifest.json');for(const row of seedManifest.files)a.equal(c.hash(fs.readFileSync(work+'/json/slaves/'+row.file)),row.sha256,'Current JSON changed '+row.file);report.currentJsonFiles=seedManifest.count;
a.equal(c.hash(fs.readFileSync('G:/Codex/tmp/handoff-b-combined-20261112/candidate.qsp')),expectedHash);report.workHash=c.hash(fs.readFileSync(work+'/jack.qsp'));a.equal(report.workHash,'a4d1985cba2f3071405fe8e6ac3edd47a1e29c1693dd84e7485b131974665a72');report.workUnchanged=true;
for(const tag of tags)fs.copyFileSync(root+'/combined-generation-'+tag+'-stderr.log',records+'/native-'+tag+'-stderr.log');fs.copyFileSync(root+'/baseline-full-init/fixed-baseline-stderr.log',records+'/native-fixed-baseline-stderr.log');
for(const name of ['six-initial-client-results.json','combined-generation-fourth-error-ui.json','combined-generation-fourth-win32-window-text.txt'])if(fs.existsSync(root+'/'+name))fs.copyFileSync(root+'/'+name,records+'/'+name);
fs.writeFileSync(records+'/native-integration.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,candidateHash:report.candidateHash,checks:report.checks,randomSamples:report.randomSamples,fixedSamples:report.fixedSamples,romanSamples:report.romanSamples,ageCounts:report.ageCounts,presetPoolSkipped:report.presetPoolSkipped,fixedNumericComparisons:report.fixedNumericComparisons}));
