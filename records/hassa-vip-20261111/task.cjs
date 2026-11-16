'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const zlib=require('node:zlib');
const repo='G:/somi/JO9sa';
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
const temp='G:/Codex/tmp/jo9-hassa-vip-20261111';
const record=repo+'/records/hassa-vip-20261111';
const core=require(repo+'/tools/text-workshop/core.cjs');
const qa=require(repo+'/tools/qa/release-check.cjs');
const id='2026-11-11_hassa_vip_access';
const marker='HASSA_VIP_ACCESS_20261111';
const writeJson=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const fileHash=p=>core.hash(fs.readFileSync(p));
fs.mkdirSync(temp,{recursive:true});
fs.mkdirSync(record,{recursive:true});
const raw=fs.readFileSync(game+'/jack.qsp');
const doc=core.parse(raw);
const location=doc.locations.find(l=>l.name==='#options');
const body=core.shift(doc.lines[location.body],5);

function createProbe(bytes,stage){
 const source=core.parse(bytes);
 const options=core.shift(source.lines[source.locations.find(l=>l.name==='#options').body],5);
 const blocks=[];
 for(const threshold of [2,4]){
  const lines=options.split('\r\n');
  const index=lines.findIndex((line,i)=>line.includes("faction_fame['RedLight'] >= "+threshold)&&lines.slice(i+1,i+4).some(next=>next.includes("'VIP 클럽을 방문한다'")));
  assert(index>=0);
  const end=lines.findIndex((line,i)=>i>index&&line.trim()==='END');
  assert(end>index);
  blocks.push(lines.slice(index,end+1).join('\r\n'));
 }
 const start=`
qa_count=0 & qa_failed=0
for qa_menu=0 to 1 step 1:
 for qa_hassa=0 to 2 step 1:
  for qa_konstantin=0 to 1 step 1:
   for qa_fame=0 to 4 step 1:
    for qa_cash=199 to 200 step 1:
     npc_progress['Hassa']=qa_hassa
     npc_progress['Konstantin']=qa_konstantin*2
     faction_fame['RedLight']=qa_fame
     sparks=qa_cash
     qa_open=-1
     gs 'Gate'+str(qa_menu)
     qa_threshold=iif(qa_menu=0,2,4)
     qa_expected=(qa_cash>=200 and (qa_hassa=2 or (qa_konstantin=1 and qa_fame>=qa_threshold)))
     if qa_open!qa_expected: qa_failed+=1
     if sparks!qa_cash or npc_progress['Hassa']!qa_hassa or npc_progress['Konstantin']!qa_konstantin*2: qa_failed+=1
     qa_count+=1
    end
   end
  end
 end
end
if qa_count!120: msg 'FAIL case count '+qa_count & exit
if qa_failed>0: msg 'FAIL Hassa VIP checks '+qa_failed & exit
msg 'JO9_QA_HASSA_vip_matrix_COMPLETE'
exit`.trim().replace(/\n/g,'\r\n');
 const lines=['QSPGAME','','',core.shift('4',-5)];
 const locations=[['Start',start],['Gate0',blocks[0]],['Gate1',blocks[1]],['$menu',"qa_open=iif($args[0]='interaction_city',1,0)"]];
 for(const [name,script]of locations)lines.push(core.shift(name,-5),'',core.shift(script,-5),core.shift('0',-5));
 lines.push('');
 const dir=temp+'/'+stage;
 fs.mkdirSync(dir,{recursive:true});
 fs.copyFileSync(game+'/config.xml',dir+'/config.xml');
 fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 fs.writeFileSync(dir+'/vip.qsp',core.serialize({lines}));
 writeJson(dir+'/plan.json',[{name:'vip',file:dir+'/vip.qsp',marker:'JO9_QA_HASSA_vip_matrix_COMPLETE',checkpoint:'120 combinations across actual two menu gates, Hassa states0/1/2, Konstantin completion, fame0..4, cash199/200, no fee or completion changes'}]);
 console.log(dir+'/plan.json');
}

const mode=process.argv[2];
if(mode==='before')createProbe(raw,'before');
if(mode==='prepare'){
 assert(core.serialize(doc).equals(raw));
 assert(!body.includes(marker));
 assert.equal(fileHash(repo+'/assets/runtime/2.4.1/jack.qsp'),doc.hash);
 assert(readJson(temp+'/before/client-results.json').some(r=>!r.pass));
 const edits=[];
 let next=body;
 for(const threshold of [2,4]){
  const old="IF faction_fame['RedLight'] >= "+threshold+" and npc_progress['Konstantin'] = 2 and sparks >= 200:";
  assert.equal(next.split(old).length-1,1);
  const replacement='! JO9 MOD START '+marker+'_'+threshold+'\r\n'+"IF sparks >= 200 and ((faction_fame['RedLight'] >= "+threshold+" and npc_progress['Konstantin'] = 2) or npc_progress['Hassa'] = 2):"+'\r\n! JO9 MOD END '+marker+'_'+threshold;
  next=next.replace(old,replacement);
  edits.push({location:'#options',field:'body',old,new:replacement,count:1,patchId:marker+'_'+threshold});
 }
 doc.lines[location.body]=core.shift(next,-5);
 const candidate=core.serialize(doc);
 qa.inspectWorld(candidate);
 const backup='G:/somi/JO9_work_backups/hassa-vip-20261111-'+doc.hash.slice(0,12);
 fs.mkdirSync(backup,{recursive:true});
 const gzip=zlib.gzipSync(raw);
 assert(zlib.gunzipSync(gzip).equals(raw));
 fs.writeFileSync(backup+'/before.qsp.gz',gzip);
 fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const mod={id,status:'APPROVED',description:'Hassa completed request grants VIP access through both existing menus with the existing 200-spark possession minimum.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
 fs.mkdirSync(temp+'/mods',{recursive:true});
 writeJson(temp+'/mods/'+id+'.json',mod);
 writeJson(repo+'/mods/'+id+'.json',mod);
 fs.writeFileSync(temp+'/candidate.qsp',candidate);
 fs.writeFileSync(temp+'/replay.qsp',raw);
 writeJson(record+'/prepared.json',{before:mod.before_sha256,after:mod.after_sha256,backup});
 createProbe(candidate,'after');
}
if(mode==='install'){
 const state=readJson(record+'/prepared.json');
 assert(readJson(temp+'/after/client-results.json').every(r=>r.pass));
 assert.equal(core.hash(raw),state.before);
 assert.equal(fileHash(temp+'/replay.qsp'),state.after);
 assert.equal(fileHash(repo+'/assets/runtime/2.4.1/jack.qsp'),state.before);
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',temp+'/mods'];
 for(const action of ['apply','reapply']){
  const output=cp.execFileSync('powershell.exe',args,{windowsHide:true});
  fs.writeFileSync(record+'/'+action+'.log',new TextDecoder('euc-kr').decode(output));
  assert.equal(fileHash(game+'/jack.qsp'),state.after);
 }
 fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const manifestPath=repo+'/assets/runtime-source-2.4.1.json';
 const manifest=readJson(manifestPath);
 assert.equal(manifest.sourceQspSha256,state.before);
 manifest.sourceQspSha256=state.after;
 manifest.snapshotDate='2026-11-11';
 for(const file of manifest.files)if(file.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){
  file.sha256=state.after;
  file.bytes=fs.statSync(game+'/jack.qsp').size;
 }
 manifest.latestHassaVip={date:'2026-11-11',mod:id,report:'records/hassa-vip-20261111/REPORT_KO.md'};
 writeJson(manifestPath,manifest);
 const final=core.parse(fs.readFileSync(game+'/jack.qsp'));
 const previous=core.parse(zlib.gunzipSync(fs.readFileSync(state.backup+'/before.qsp.gz')));
 const changed=previous.locations.filter(l=>previous.lines[l.body]!==final.lines[l.body]).map(l=>l.name);
 assert.deepEqual(changed,['#options']);
 writeJson(record+'/verification.json',{...state,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),nativeScenarios:120,workSourceMatch:true,existingSaveFlagReused:true,dialoguePending:true});
 for(const stage of ['before','after']){
  fs.copyFileSync(temp+'/'+stage+'/client-results.json',record+'/native-'+stage+'.json');
  fs.copyFileSync(temp+'/'+stage+'/vip-stderr.log',record+'/native-'+stage+'.log');
 }
 console.log('VIP gates installed. Dialogue manuscript pending.');
}
