'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process'),zlib=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const temp='G:/Codex/tmp/jo9-hassa-dialogue-20261111',record=repo+'/records/hassa-vip-20261111';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const id='2026-11-11_hassa_vip_dialogue',marker='HASSA_VIP_DIALOGUE_20261111';
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=p=>core.hash(fs.readFileSync(p));
fs.mkdirSync(temp,{recursive:true});
const manuscript=fs.readFileSync(game+'/content/modworkpic/JO9_Hassa_VIP_Handoff_20261110.md','utf8');
const paragraphs=manuscript.split(/\r?\n/).filter(s=>s.startsWith('> ')).map(s=>s.slice(2).replaceAll('`',''));
assert.equal(paragraphs.length,3);
const completion='[하사]<br>&nbsp;'+paragraphs.join('<br><br>');
const raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw);
const getBody=name=>core.shift(doc.lines[doc.locations.find(l=>l.name===name).body],5);
const edits=[];
const definitions={};
function replace(name,old,next){
 const current=getBody(name);
 assert.equal(current.split(old).length-1,1,name+' ambiguous or changed');
 const location=doc.locations.find(l=>l.name===name);
 doc.lines[location.body]=core.shift(current.replace(old,next),-5);
 edits.push({location:name,field:'body',old,new:next,count:1,patchId:marker});
}
function findLine(name,prefix){
 const matches=getBody(name).split('\r\n').filter(s=>s.trim().startsWith(prefix));
 assert.equal(matches.length,1,prefix);
 return matches[0];
}
function replaceDefinition(name,key,value){
 const old=findLine(name,key+' =');
 const next=key+' = '+quote(value);
 replace(name,old,next);
 definitions[name+'|'+key]=next;
}
const mode=process.argv[2];
if(mode==='prepare'){
 assert(core.serialize(doc).equals(raw));
 assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),doc.hash);
 assert(!getBody('$ongload').includes(marker));
 replaceDefinition('#static_txt','$hassa_win[1]',completion);
 const scene=getBody('interaction_city').match(/^IF interaction_city = 9143:\r\n[\s\S]*?^END/m)[0];
 const oldSceneLine=scene.split('\r\n').find(s=>s.trim().startsWith('$text[1] ='));
 replace('interaction_city',oldSceneLine,' $text[1] = '+quote(completion));
 const oldQuest=findLine('#static_txt','$hassa_quest[4] =');
 const newQuest=oldQuest.replace('동방 구역에는 평범한 인간은 들어가기 아주 힘든 장소가 하나 있어요.','홍등가에는 평범한 인간은 들어가기 아주 힘든 VIP 클럽이 하나 있어요.').replace('들어가는 법을 알려 줄게요.','당신도 드나들 수 있도록 주선해 줄게요.');
 assert.notEqual(oldQuest,newQuest);
 replace('#static_txt',oldQuest,newQuest);
 for(const location of ['#npc_base','#npc_base_woman']){
  for(const [npc,addition]of [['Hassa',' 하사는 홍등가 VIP 클럽의 주인 콘스탄틴과 연인 관계다. 콘스탄틴은 오빠 아나멜레의 둘도 없는 친구이기도 하다.'],['anameleh',' 하사의 연인인 콘스탄틴과는 둘도 없는 친구다.']]){
   const key="$npc_info['"+npc+"']";
   const old=findLine(location,key+' =');
   assert(old.endsWith("'"));
   const next=old.slice(0,-1)+addition+"'";
   replace(location,old,next);
   definitions[location+'|'+key]=next;
  }
  replaceDefinition(location,"$npc_info['Konstantin']",'홍등가 VIP 클럽의 주인이다. 하사와 연인 관계이며, 하사의 오빠 아나멜레와는 둘도 없는 친구다.');
 }
 const gates=read(repo+'/mods/2026-11-11_hassa_vip_access.json').edits;
 let cache='! JO9 MOD START '+marker+'\r\n';
 cache+=definitions['#static_txt|$hassa_win[1]']+'\r\n'+newQuest+'\r\n';
 cache+='if hero_choice > 100:\r\n';
 for(const npc of ['Hassa','anameleh','Konstantin'])cache+=' '+definitions["#npc_base_woman|$npc_info['"+npc+"']"]+'\r\n';
 cache+='else\r\n';
 for(const npc of ['Hassa','anameleh','Konstantin'])cache+=' '+definitions["#npc_base|$npc_info['"+npc+"']"]+'\r\n';
 cache+='end\r\n';
 for(const gate of gates){
  const newCondition=gate.new.split('\r\n').find(s=>s.startsWith('IF '));
  for(const array of ['$woman_dosug_options[1]','$dosug_options[1]'])cache+=array+' = replace('+array+', '+quote(gate.old)+', '+quote(newCondition)+')\r\n';
 }
 cache+="local jo9_hassa_cache_page\r\nfor jo9_hassa_cache_page = 0 to arrsize('$display_options') - 1 step 1:\r\n";
 for(const gate of gates){const next=gate.new.split('\r\n').find(s=>s.startsWith('IF '));cache+=" $display_options[jo9_hassa_cache_page] = replace($display_options[jo9_hassa_cache_page], "+quote(gate.old)+', '+quote(next)+')\r\n';}
 cache+='end\r\n! JO9 MOD END '+marker+'\r\n';
 const load=getBody('$ongload');
 replace('$ongload',load.split('\r\n')[0],cache+load.split('\r\n')[0]);
 const candidate=core.serialize(doc);
 qa.inspectWorld(candidate);
 const backup='G:/somi/JO9_work_backups/hassa-dialogue-20261111-'+core.hash(raw).slice(0,12);
 fs.mkdirSync(backup,{recursive:true});
 const gzip=zlib.gzipSync(raw);assert(zlib.gunzipSync(gzip).equals(raw));
 fs.writeFileSync(backup+'/before.qsp.gz',gzip);
 fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const mod={id,status:'APPROVED',description:'Apply supplied three-paragraph Hassa reward manuscript at both sources, align VIP quest location and three-person relationship introductions, refresh saved text and menu conditions on load without replaying quest rewards.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
 fs.mkdirSync(temp+'/mods',{recursive:true});
 write(temp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);
 fs.writeFileSync(temp+'/candidate.qsp',candidate);fs.writeFileSync(temp+'/replay.qsp',raw);
 write(record+'/dialogue-prepared.json',{before:mod.before_sha256,after:mod.after_sha256,backup,completion,definitions,manuscriptSha256:hash(game+'/content/modworkpic/JO9_Hassa_VIP_Handoff_20261110.md')});
 const normalize=s=>s.replace(/\r\n/g,'\n').replace(/\n/g,'\r\n');
 const cacheAssertions=`
if instr($hassa_win[1],'QA MASTER')=0: qa_fail+=1
if instr($hassa_win[1],'<br><br>')=0: qa_fail+=1
if instr($hassa_quest[4],'홍등가')=0 or instr($hassa_quest[4],'VIP 클럽')=0: qa_fail+=1
if instr($npc_info['Hassa'],'연인')=0 or instr($npc_info['anameleh'],'친구')=0 or instr($npc_info['Konstantin'],'VIP 클럽')=0: qa_fail+=1
if instr($woman_dosug_options[1],"or npc_progress['Hassa'] = 2")=0 or instr($dosug_options[1],"or npc_progress['Hassa'] = 2")=0: qa_fail+=1
if instr($display_options[0],"or npc_progress['Hassa'] = 2")=0 or instr($display_options[1],"or npc_progress['Hassa'] = 2")=0: qa_fail+=1
if sparks!200 or npc_progress['Hassa']!2 or npc_progress['Konstantin']!0: qa_fail+=1`;
 const start=normalize(`
$master_name='QA MASTER'
sparks=200 & npc_progress['Hassa']=2 & npc_progress['Konstantin']=0
qa_fail=0
for qa_gender=0 to 1 step 1:
 hero_choice=iif(qa_gender=0,12,112)
 $woman_dosug_options[1]=${quote(gates[0].old)}
 $dosug_options[1]=${quote(gates[1].old)}
 $display_options[0]=${quote(gates[0].old)}
 $display_options[1]=${quote(gates[1].old)}
 gs 'Cache'
 ${cacheAssertions}
 $qa_previous=$hassa_win[1]
 gs 'Cache'
 ${cacheAssertions}
 if $qa_previous!$hassa_win[1]: qa_fail+=1
end
gs 'Direct'
if $text[1]!$hassa_win[1]: qa_fail+=1
if qa_fail>0: msg 'FAIL Hassa manuscript/load checks '+qa_fail & exit
msg 'JO9_QA_HASSA_dialogue_load_COMPLETE'
exit`.trim());
 const lines=['QSPGAME','','',core.shift('3',-5)];
 for(const [name,script]of [['Start',start],['Cache',cache],['Direct',' $text[1] = '+quote(completion)]])lines.push(core.shift(name,-5),'',core.shift(script,-5),core.shift('0',-5));lines.push('');
 const dir=temp+'/native';fs.mkdirSync(dir,{recursive:true});
 fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(dir+'/dialogue.qsp',core.serialize({lines}));
 write(dir+'/plan.json',[{name:'dialogue',file:dir+'/dialogue.qsp',marker:'JO9_QA_HASSA_dialogue_load_COMPLETE',checkpoint:'male/female and repeated load: supplied manuscript paragraphs/master token, both saved menu arrays/display cache, relationships, direct override equality, state/payment unchanged'}]);
 console.log(dir+'/plan.json');
}
if(mode==='install'){
 const state=read(record+'/dialogue-prepared.json');
 assert(read(temp+'/native/client-results.json').every(v=>v.pass));
 assert.equal(core.hash(raw),state.before);assert.equal(hash(temp+'/replay.qsp'),state.after);assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),state.before);
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',temp+'/mods'];
 for(const action of ['apply','reapply']){const result=cp.execFileSync('powershell.exe',args,{windowsHide:true});fs.writeFileSync(record+'/dialogue-'+action+'.log',new TextDecoder('euc-kr').decode(result));assert.equal(hash(game+'/jack.qsp'),state.after);}
 fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const p=repo+'/assets/runtime-source-2.4.1.json',manifest=read(p);assert.equal(manifest.sourceQspSha256,state.before);manifest.sourceQspSha256=state.after;
 for(const f of manifest.files)if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){f.sha256=state.after;f.bytes=fs.statSync(game+'/jack.qsp').size;}
 manifest.latestHassaVip.dialogueMod=id;manifest.latestHassaVip.dialoguePending=false;write(p,manifest);
 const final=core.parse(fs.readFileSync(game+'/jack.qsp')),previous=core.parse(zlib.gunzipSync(fs.readFileSync(state.backup+'/before.qsp.gz')));
 const changed=previous.locations.filter(l=>previous.lines[l.body]!==final.lines[l.body]).map(l=>l.name);assert.equal(changed.length,5);
 write(record+'/dialogue-verification.json',{before:state.before,after:state.after,backup:state.backup,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),providedParagraphs:3,completionSourcesMatch:true,manuscriptSha256:state.manuscriptSha256,loadCacheChecked:true,workSourceMatch:true});
 fs.copyFileSync(temp+'/native/client-results.json',record+'/native-dialogue.json');fs.copyFileSync(temp+'/native/dialogue-stderr.log',record+'/native-dialogue.log');console.log('Supplied manuscript and relationship/cache updates installed.');
}
