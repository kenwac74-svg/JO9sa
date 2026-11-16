'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),cp=require('node:child_process'),z=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-shlyapkin-rating-20261111',rec=repo+'/records/shlyapkin-rating-20261111';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(tmp,{recursive:true});
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),loc=d.locations.find(l=>l.name==='interaction_city'),body=c.shift(d.lines[loc.body],5),block=body.match(/^IF interaction_city = 10372:\r\n[\s\S]*?^END/m)?.[0];a(block);
const id='2026-11-11_shlyapkin_target_rating',marker='SHLYAPKIN_TARGET_RATING_20261111';
function probe(bytes,kind){
 const doc=c.parse(bytes),b=c.shift(doc.lines[doc.locations.find(l=>l.name==='interaction_city').body],5).match(/^IF interaction_city = 10372:\r\n[\s\S]*?^END/m)[0];
 const code=`
CONST_INT['slave_exist']=1
qa_cases=0
for qa_assistant=-1 to 10 step 1:
 for qa_rank_index=0 to 2 step 1:
  qa_target_rank=6
  if qa_rank_index=1: qa_target_rank=7
  if qa_rank_index=2: qa_target_rank=10
  for qa_invalid=0 to 12 step 1:
   interaction_city=10372 & npc_progress['shlyapkin']=1
   slave_type=2613 & slave_state=1 & slave['brand']=0
   slave['beauty']=5 & slave['stamina']=4 & slave['temper']=4 & slave['intellect']=4
   slave['cook']=5 & slave['service']=5 & slave['expression']=4 & slave['calisthenics']=4 & slave['music']=4
   if qa_invalid=1: slave['beauty']=4
   if qa_invalid=2: slave['stamina']=3
   if qa_invalid=3: slave['temper']=3
   if qa_invalid=4: slave['intellect']=3
   if qa_invalid=5: slave['cook']=4
   if qa_invalid=6: slave['service']=4
   if qa_invalid=7: slave['expression']=3
   if qa_invalid=8: slave['calisthenics']=3
   if qa_invalid=9: slave['music']=3
   if qa_invalid=10: slave['brand']=1
   if qa_invalid=11: slave_type=2612
   if qa_invalid=12: slave_state=0
   assistant_state=iif(qa_assistant<0,0,1)
   rating=iif(qa_assistant<0,qa_target_rank,qa_assistant)
   qa_refreshes=0
   gs 'Check'
   qa_expected=iif(qa_target_rank>6 and qa_invalid=0,10375,10374)
   if interaction_city!qa_expected: msg 'FAIL target rank='+qa_target_rank+' assistant='+qa_assistant+' invalid='+qa_invalid & exit
   qa_cases+=1
  end
 end
end
if qa_cases!468: msg 'FAIL count' & exit
msg 'JO9_QA_SHLYAPKIN_rank_matrix_COMPLETE'
exit`.trim().replace(/\n/g,'\r\n');
 const parts=['QSPGAME','','',c.shift('3',-5)];
 for(const [name,script]of [['Start',code],['Check',b],['$slave_price',"if $args[0] ! 'slave': msg 'FAIL wrong rank subject' & exit\r\nrating=qa_target_rank\r\nqa_refreshes+=1"]])parts.push(c.shift(name,-5),'',c.shift(script,-5),c.shift('0',-5));parts.push('');
 const dir=tmp+'/'+kind;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/rank.qsp',c.serialize({lines:parts}));fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');write(dir+'/plan.json',[{name:'rank',file:dir+'/rank.qsp',marker:'JO9_QA_SHLYAPKIN_rank_matrix_COMPLETE',checkpoint:'468 cases: absent/0..10 assistant rank, target B+/A-/S+, 12 invalid delivery requirements; price callee spy isolates refreshed rank'}]);
 console.log(dir+'/plan.json');
}
const mode=process.argv[2];
if(mode==='before')probe(raw,'before');
if(mode==='prepare'){
 a(!body.includes(marker),'Patch already installed; do not prepare again');
 a(c.serialize(d).equals(raw));a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),d.hash);a(read(tmp+'/before/client-results.json').some(x=>!x.pass));
 const needle=block.split('\r\n').find(x=>x.includes('if slave_type = 2613 and rating > 6'));a(needle);
 const replacement='! JO9 MOD START '+marker+'\r\n  if slave_type = 2613 and slave_state = CONST_INT[\'slave_exist\']: gs \'$slave_price\', \'slave\'\r\n! JO9 MOD END '+marker+'\r\n'+needle;
 const newBody=body.replace(needle,replacement);a.notEqual(newBody,body);d.lines[loc.body]=c.shift(newBody,-5);const next=c.serialize(d);qa.inspectWorld(next);
 const mod={id,status:'APPROVED',description:'Recalculate Caroline delivery rank from slave immediately before Shlyapkin evaluation; ignore rank left by assistant UI. Requirements unchanged.',before_sha256:c.hash(raw),after_sha256:c.hash(next),edits:[{location:'interaction_city',field:'body',old:needle,new:replacement,count:1,patchId:marker}]};
 const backup='G:/somi/JO9_work_backups/shlyapkin-rating-20261111-'+c.hash(raw).slice(0,12);fs.mkdirSync(backup,{recursive:true});const gz=z.gzipSync(raw);a(z.gunzipSync(gz).equals(raw));fs.writeFileSync(backup+'/before.qsp.gz',gz);fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 fs.mkdirSync(tmp+'/mods',{recursive:true});write(tmp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',next);write(rec+'/prepared.json',{before:mod.before_sha256,after:mod.after_sha256,backup});probe(next,'after');
}
if(mode==='install'){
 const s=read(rec+'/prepared.json');a(read(tmp+'/after/client-results.json').every(x=>x.pass));a.equal(c.hash(raw),s.before);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.before);
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/mods'];
 fs.writeFileSync(rec+'/apply.log',cp.execFileSync('powershell.exe',args,{encoding:'utf8',windowsHide:true}));a.equal(hash(game+'/jack.qsp'),s.after);
 fs.writeFileSync(rec+'/reapply.log',cp.execFileSync('powershell.exe',args,{encoding:'utf8',windowsHide:true}));a.equal(hash(game+'/jack.qsp'),s.after);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const mp=repo+'/assets/runtime-source-2.4.1.json',m=read(mp);a.equal(m.sourceQspSha256,s.before);m.sourceQspSha256=s.after;m.snapshotDate='2026-11-11';for(const f of m.files)if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){f.sha256=s.after;f.bytes=fs.statSync(game+'/jack.qsp').size;}m.latestShlyapkinRankFix={date:'2026-11-11',mod:id,report:'records/shlyapkin-rating-20261111/REPORT_KO.md'};write(mp,m);
 const final=c.parse(fs.readFileSync(game+'/jack.qsp')),prior=c.parse(z.gunzipSync(fs.readFileSync(s.backup+'/before.qsp.gz')));const changed=prior.locations.filter(l=>prior.lines[l.body]!==final.lines[l.body]).map(l=>l.name);a.deepEqual(changed,['interaction_city']);
 write(rec+'/verification.json',{...s,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),nativeCases:468,rankCalculator:'unchanged; diagnostic callee double supplies rank and verifies slave subject',workSourceMatch:true,saveSchemaChanged:false,fullTouched:false,commit:false,push:false});
 for(const stage of ['before','after']){fs.copyFileSync(tmp+'/'+stage+'/client-results.json',rec+'/native-'+stage+'.json');fs.copyFileSync(tmp+'/'+stage+'/rank-stderr.log',rec+'/native-'+stage+'.log');}console.log('WORK installed, source aligned, reapplication unchanged.');
}
