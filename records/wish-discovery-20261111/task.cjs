'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),cp=require('node:child_process'),z=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-wish-discovery-20261111',rec=repo+'/records/wish-discovery-20261111';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const id='2026-11-11_wish_trait_discovery',marker='WISH_TRAIT_DISCOVERY_20261111';
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(rec,{recursive:true});
const fields=['sport','expression','pet','dressage','cowSK','nurse','service','cook','gladiatrix','enchanter','art','music','calisthenics','secretary'].map(k=>k+'_affinity');
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),loc=d.locations.find(l=>l.name==='chose_answer'),body=c.shift(d.lines[loc.body],5);
function probe(bytes,kind){
 const doc=c.parse(bytes),answer=c.shift(doc.lines[doc.locations.find(l=>l.name==='chose_answer').body],5);
 const init=fields.map((f,i)=>`$qa_fields[${i}]='${f}'`).join('\n');
 const start=`
$voice_native={$result=$args[0]}
$update_slave_features_list={qa_refreshes+=1}
$enchanter_like='MAGIC ORIGINAL'
${init}
interaction=1114
qa_count=0 & qa_fail=0
for qa_field=0 to 13 step 1:
 for qa_value=-1 to 1 step 1:
  for qa_seen=0 to 2 step 1:
   killvar 'slave' & killvar '$text' & killvar '$special_action'
   slave[$qa_fields[qa_field]]=qa_value
   slave[$qa_fields[qa_field]+'_revealed']=qa_seen
   qa_refreshes=0
   gs 'Answer'
   if slave[$qa_fields[qa_field]+'_revealed']!qa_seen: qa_fail+=1
   if qa_value>0:
    if $special_action[0]='': qa_fail+=1
    if qa_field=9 and $text[0]!$enchanter_like: qa_fail+=1
   end
   if $special_action[0]!'': dynamic $special_action[0]
   qa_expected=iif(qa_value>0,2,qa_seen)
   if slave[$qa_fields[qa_field]+'_revealed']!qa_expected: qa_fail+=1
   if slave[$qa_fields[qa_field]]!qa_value: qa_fail+=1
   if $special_action[0]!'': dynamic $special_action[0]
   if slave[$qa_fields[qa_field]+'_revealed']!qa_expected: qa_fail+=1
   qa_count+=1
  end
 end
end
killvar 'slave' & killvar '$text' & killvar '$special_action'
for qa_field=0 to 13 step 1:
 slave[$qa_fields[qa_field]]=1
end
gs 'Answer'
for qa_page=0 to 13 step 1:
 if $special_action[qa_page]='': qa_fail+=1
 if $special_action[qa_page]!'': dynamic $special_action[qa_page]
 for qa_check=0 to 13 step 1:
  qa_expected=iif(qa_check<=qa_page,2,0)
  if slave[$qa_fields[qa_check]+'_revealed']!qa_expected: qa_fail+=1
 end
 qa_count+=1
end
killvar 'slave' & killvar '$text' & killvar '$special_action'
slave['cowSK_affinity']=1
gs 'Answer'
interaction=1113
if $special_action[0]!'': dynamic $special_action[0]
if slave['cowSK_affinity_revealed']!0: qa_fail+=1
interaction=1114 & slave['cowSK_affinity']=0
if $special_action[0]!'': dynamic $special_action[0]
if slave['cowSK_affinity_revealed']!0: qa_fail+=1
qa_count+=2
if qa_count!142: msg 'FAIL count '+qa_count & exit
if qa_fail>0: msg 'FAIL wish discovery checks '+qa_fail & exit
msg 'JO9_QA_WISH_discovery_COMPLETE'
exit`.trim().replace(/\n/g,'\r\n');
 const lines=['QSPGAME','','',c.shift('2',-5)];for(const [name,b]of [['Start',start],['Answer',answer]])lines.push(c.shift(name,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');
 const dir=tmp+'/'+kind;fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(dir+'/wish.qsp',c.serialize({lines}));
 write(dir+'/plan.json',[{name:'wish',file:dir+'/wish.qsp',marker:'JO9_QA_WISH_discovery_COMPLETE',checkpoint:'142 scenarios:14 affinities x values -1/0/1 x reveal0/1/2, 14 sequential pages and 2 stale guards; original chosen-answer code with voice/render stubs'}]);console.log(dir+'/plan.json');
}
const mode=process.argv[2];if(mode==='before')probe(raw,'before');
if(mode==='prepare'){
 a(!body.includes(marker));a(c.serialize(d).equals(raw));a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),d.hash);a(read(tmp+'/before/client-results.json').some(x=>!x.pass));
 const old=body.match(/^if interaction = 1114:\r\n[\s\S]*?^end/m)[0];let next=old;let count=0;
 for(const field of fields){
  const match=next.match(new RegExp('\\tif slave\\[\''+field+'\'\\] > 0:\\r\\n([^\\r]+)\\r\\n\\tend'));a(match,field);
  const line=field==='enchanter_affinity'?"\t\t$text[] = $enchanter_like":match[1];
  const replacement=match[0].replace(match[1],line+'\r\n'+"\t\t$special_action[arrsize('$text')-1] = {\r\n\t\t if interaction = 1114 and slave['"+field+"'] > 0:\r\n\t\t  slave['"+field+"_revealed'] = 2\r\n\t\t  dynamic $replace($update_slave_features_list, 'dyn'+'slave', 'slave')\r\n\t\t end\r\n\t\t}");
  next=next.replace(match[0],replacement);count++;
 }
 a.equal(count,14);next='! JO9 MOD START '+marker+'\r\n'+next+'\r\n! JO9 MOD END '+marker;
 d.lines[loc.body]=c.shift(body.replace(old,next),-5);const candidate=c.serialize(d);qa.inspectWorld(candidate);
 const backup='G:/somi/JO9_work_backups/wish-discovery-20261111-'+c.hash(raw).slice(0,12);fs.mkdirSync(backup,{recursive:true});const gz=z.gzipSync(raw);a(z.gunzipSync(gz).equals(raw));fs.writeFileSync(backup+'/before.qsp.gz',gz);fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const mod={id,status:'APPROVED',description:'Reveal an existing positive affinity on its displayed wish page using existing special-action callbacks; restore original magic/alchemy wish. New sexual-trait dialogue remains uninstalled pending user approval.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:[{location:'chose_answer',field:'body',old,new:next,count:1,patchId:marker}]};
 fs.mkdirSync(tmp+'/mods',{recursive:true});write(tmp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',candidate);fs.writeFileSync(tmp+'/replay.qsp',raw);
 write(rec+'/prepared.json',{before:mod.before_sha256,after:mod.after_sha256,backup,affinities:fields});probe(candidate,'after');
}
if(mode==='install'){
 const s=read(rec+'/prepared.json');a(read(tmp+'/after/client-results.json').every(x=>x.pass));a.equal(c.hash(raw),s.before);a.equal(hash(tmp+'/replay.qsp'),s.after);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.before);
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/mods'];
 for(const name of ['apply','reapply']){const b=cp.execFileSync('powershell.exe',args,{windowsHide:true});fs.writeFileSync(rec+'/'+name+'.log',new TextDecoder('euc-kr').decode(b));a.equal(hash(game+'/jack.qsp'),s.after);}
 fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');const p=repo+'/assets/runtime-source-2.4.1.json',m=read(p);a.equal(m.sourceQspSha256,s.before);m.sourceQspSha256=s.after;m.snapshotDate='2026-11-11';for(const f of m.files)if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){f.sha256=s.after;f.bytes=fs.statSync(game+'/jack.qsp').size;}m.latestWishDiscovery={date:'2026-11-11',mod:id,report:'records/wish-discovery-20261111/REPORT_KO.md',pendingNewDialogue:true};write(p,m);
 const final=c.parse(fs.readFileSync(game+'/jack.qsp')),prior=c.parse(z.gunzipSync(fs.readFileSync(s.backup+'/before.qsp.gz')));const changed=prior.locations.filter(l=>prior.lines[l.body]!==final.lines[l.body]).map(l=>l.name);a.deepEqual(changed,['chose_answer']);write(rec+'/verification.json',{...s,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),nativeScenarios:142,newPersistentVariables:0,existingCallbacksReused:true,magicOriginalRestored:true,newSexualDialogueInstalled:false,fullTouched:false,commit:false,push:false});
 for(const stage of ['before','after'])for(const [src,dst]of [['client-results.json','native-'+stage+'.json'],['wish-stderr.log','native-'+stage+'.log']])fs.copyFileSync(tmp+'/'+stage+'/'+src,rec+'/'+dst);console.log('Installed; only chose_answer changed.');
}
