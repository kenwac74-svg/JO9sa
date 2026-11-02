'use strict';
// JO9 MOD START QUEST_COMBAT_ADOPTION_20261030
// User-approved same-path images only; no QSP, save or portrait changes.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),a=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',cat=game+'/modtools/catalog';
const id='quest-combat-adopted-20261030',rec=repo+'/records/'+id,backup='G:/somi/JO9_work_backups/'+id;
const ct=require(repo+'/tools/text-workshop/catalog.cjs'),clone=x=>JSON.parse(JSON.stringify(x));
const read=p=>fs.readFileSync(p),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=p=>hash(read(p));
const currentSha=p=>fs.existsSync(p)?sha(p):null,norm=p=>p.replaceAll('\\','/').toLowerCase();
const v=JSON.parse(read(here+'/manifest.json')),files=clone(v.files),affected=new Map(files.map(f=>[norm(f.path),f]));
a.equal(files.length,9);a.equal(affected.size,9);a.deepEqual(v.sourceDrift,[]);
const apply=process.argv[2]==='--apply';
a(!fs.existsSync(backup),'Installation already has backup; inspect before repeating');
for(const [p,h] of Object.entries(v.protectedHashes))a.equal(sha(p),h,'Protected input changed: '+p);
const hp=cat+'/catalog_merge_vs_original.html',sp=cat+'/catalog_status.js',ip=cat+'/catalog_work_ids.json';
const seed=repo+'/tools/local-workspace/catalog-seed',seedHp=seed+'/catalog_merge_vs_original.html',seedSp=seed+'/catalog_status.js';
const planp=repo+'/records/full-client-preparation-20261029/full-client-input-plan.json';
const cp=repo+'/tools/mob-image-sets/background-contexts.json',docp=repo+'/docs/MOB_BACKGROUND_CONTEXTS_KO.md';
const ledgers=[cat+'/image_work/history.jsonl',cat+'/image_work/personal-patch/events.jsonl'];
const originals=new Map([hp,sp,ip,seedHp,seedSp,planp,cp,docp,...ledgers].map(p=>[p,read(p)]));
for(const p of ledgers)a(!originals.get(p).toString('utf8').split('\n').filter(Boolean).map(JSON.parse).some(x=>x.id===id),'Duplicate event '+p);
for(const f of files){
 a(f.path.startsWith('content/pic/mob/')&&!f.path.split('/').some(x=>x==='..'||x==='.'||!x));
 const b=read(f.source);a.equal(hash(b),f.after);a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(b.readUInt32BE(16),795);a.equal(b.readUInt32BE(20),596);a.equal(b.length,f.bytes);
 const p=game+'/'+f.path;a.equal(currentSha(p),apply?f.after:f.before,'WORK changed: '+f.path);
 a(fs.realpathSync(p).toLowerCase().startsWith(fs.realpathSync(game).toLowerCase()+path.sep));
 a.equal(currentSha(repo+'/resources/new/'+f.path),f.trackedBefore,'Tracked original changed: '+f.path);
 if(apply)a.equal(sha(f.beforePath),f.before,'Original not archived: '+f.path);
}
if(apply){
 const receipt=JSON.parse(read(here+'/runtime-original-swap.json'));a.equal(receipt.status,'SWAPPED');a.equal(receipt.files.length,9);
 for(const f of files){const x=receipt.files.find(x=>norm(x.path)===norm(f.path));a(x,'Missing swap receipt '+f.path);a.equal(x.before,f.before);a.equal(x.after,f.after);a.equal(norm(x.archive),norm(f.beforePath));}
}
function updateCatalog(hbuf,sbuf,label){
 let html=hbuf.toString('utf8');const dm=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/),mm=html.match(/window.JO9_MOB_SETS=(.*?);<\/script>/);a(dm&&mm);
 const oldRows=JSON.parse(dm[1]),rows=clone(oldRows),oldM=JSON.parse(mm[1]),m=clone(oldM),oldState=ct.parseStatus(sbuf.toString('utf8')),state=clone(oldState);
 let rowCount=0,slotCount=0,newDefeats=0;
 for(const row of rows){const f=affected.get(norm(row[0]));if(!f)continue;row[3]=f.bytes;row[5]=795;row[6]=596;rowCount++;
  const flags=new Set(state.items[row[0]]||[]);flags.delete('todo');flags.delete('wip');flags.add('done');state.items[row[0]]=[...flags];
 }
 for(const e of m.entries)for(const phase of ['standing','defeat']){
  const slot=e[phase];if(!slot?.path)continue;const f=affected.get(norm(slot.path));if(!f)continue;
  if(phase==='defeat'&&!slot.exists)newDefeats++;
  Object.assign(slot,{exists:true,width:795,height:596,bytes:f.bytes,sha256:f.after,workLabel:'재작화 승인·WORK 반영 완료 · 2026-10-30',imageRedraw:{date:'2026-10-30',record:id,generator:'built-in image_gen.imagegen',opaque:true}});
  delete slot.backgroundComposition;slotCount++;
 }
 a.equal(rowCount,9,label+' rows');a.equal(slotCount,9,label+' slots');a.equal(newDefeats,0,label+' new defeat');
 m.summary.missingDefeat-=newDefeats;a(m.summary.missingDefeat>=0);
 m.workUpdate={...m.workUpdate,lastImageRedraw:{date:'2026-10-30',files:9,entrySlots:9,groupSlots:0,size:[795,596],record:id}};
 a.deepEqual(state.autoDone,oldState.autoDone);
 for(let i=0;i<rows.length;i++){
  if(!affected.has(norm(oldRows[i][0])))a.deepEqual(rows[i],oldRows[i]);
  else for(let j=0;j<rows[i].length;j++)if(![3,5,6].includes(j))a.deepEqual(rows[i][j],oldRows[i][j]);
 }
 for(let i=0;i<oldM.entries.length;i++){
  const x=oldM.entries[i],y=m.entries[i];for(const k of Object.keys(x))if(!['standing','defeat'].includes(k))a.deepEqual(x[k],y[k]);
  for(const phase of ['standing','defeat'])if(x[phase]){
   if(!affected.has(norm(x[phase].path)))a.deepEqual(x[phase],y[phase]);
   else a.deepEqual(x[phase].mageEdit,y[phase].mageEdit);
  }
 }
 a.deepEqual(m.groups,oldM.groups);
 for(const [p,flags] of Object.entries(oldState.items))if(!affected.has(norm(p)))a.deepEqual(state.items[p],flags);
 state.savedAt=Math.max(Date.now(),Number(oldState.savedAt||0)+1);
 return {html:html.replace(dm[1],()=>JSON.stringify(rows)).replace(mm[0],()=> 'window.JO9_MOB_SETS='+JSON.stringify(m).replaceAll('<','\\u003c')+';</script>'),status:'window.CATALOG_STATUS='+JSON.stringify(state)+';\n',summary:m.summary};
}
const workUpdate=updateCatalog(originals.get(hp),originals.get(sp),'WORK'),seedUpdate=updateCatalog(originals.get(seedHp),originals.get(seedSp),'seed');
const plan=JSON.parse(originals.get(planp)),oldPlan=clone(plan);a.equal(plan.status,'BUILD_INPUT_PLAN_NOT_RELEASE_ZIP');a.equal(plan.qspSha256,v.qspBefore);
let planExisting=0;for(const row of plan.files){const f=affected.get(norm(row.path).replace(/^game\//,''));if(f){a.equal(row.sha256,f.before);row.bytes=f.bytes;row.sha256=f.after;planExisting++;}}
a.equal(planExisting,9);a.equal(plan.files.length,oldPlan.files.length);
plan.summary.includedBytes=plan.files.reduce((sum,f)=>sum+f.bytes,0);
a.equal(plan.summary.includedFiles,oldPlan.summary.includedFiles);
const context=JSON.parse(originals.get(cp));context.lastImageAdoption={date:'2026-10-30',record:id,files:9,standingAndDefeatOnly:true,qspChanged:false};
const summary={files:9,subjects:5,standing:5,defeat:4,replacedRuntimeFiles:9,newRuntimeFiles:0,entrySlots:9,groupSlots:0,missingDefeatBefore:workUpdate.summary.missingDefeat,missingDefeatAfter:workUpdate.summary.missingDefeat,planExisting:9,planAdded:0,portraitsAffected:0,qspUnchanged:true};
if(!apply){console.log(JSON.stringify({status:'PREFLIGHT_PASS',...summary}));process.exit(0);}
fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(backup,{recursive:true});
const backups=[];let i=0;
for(const [p,b] of originals){const dest=backup+'/metadata-'+(++i)+'-'+path.basename(p)+'.gz';fs.writeFileSync(dest,zlib.gzipSync(b,{level:9}),{flag:'wx'});backups.push({path:p,backup:dest,sha256:hash(b)});}
const installation={id,status:'BACKED_UP',approval:v.approval,created:new Date().toISOString(),files,summary,backup,metadataBackups:backups,protectedHashes:v.protectedHashes,qspBefore:v.qspBefore,saveWrites:false,fullSynced:false,releaseZipChanged:false,commitPush:false,originalArchive:v.archiveRoot,heldRetained:v.heldRetained};
const save=()=>fs.writeFileSync(rec+'/installation.json',JSON.stringify(installation,null,2));save();
for(const [p,b] of originals)a(read(p).equals(b),'Concurrent metadata edit: '+p);
installation.status='APPLYING';save();
for(const f of files){const b=read(f.source),p=game+'/'+f.path,t=repo+'/resources/new/'+f.path;
 a.equal(currentSha(p),f.after);a.equal(currentSha(t),f.trackedBefore);
 fs.mkdirSync(path.dirname(t),{recursive:true});ct.atomic(t,b);
 a.equal(sha(p),f.after);a.equal(sha(t),f.after);
}
for(const [p,b] of originals)a(read(p).equals(b),'Concurrent metadata edit: '+p);
const event=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,cat).record({id,created:installation.created,files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath}))},'approved-mob-redraw');a(event);
ct.atomic(hp,workUpdate.html);ct.atomic(sp,workUpdate.status);ct.atomic(seedHp,seedUpdate.html);ct.atomic(seedSp,seedUpdate.status);ct.atomic(planp,JSON.stringify(plan,null,2)+'\n');
ct.atomic(cp,JSON.stringify(context,null,2)+'\n');
ct.atomic(docp,originals.get(docp).toString('utf8')+'\n\n## 2026-10-30 퀘스트 전투·패배 재작화 반영\n\n에게야·성기사·포털 가디언·그린치·엘자의 승인 시안9장(전투5·패배4)을 WORK와 resources/new에 반영했다. 에게야 패배1장은 기존 그림·경로·표시를 유지했다. 각 장소의 환경, 기존 무기·초상·등장 조건·Mage Edit 프롬프트·QSP·세이브는 변경하지 않았다. 기존9원본은 G:/somi/JO9resource/mob_body/quest_originals_20261030에 실제 이동 보관했다. 성기사의 옛 무기명 대사5곳은 별도 미결 항목이며 이번 이미지 반영에서는 코드를 수정하지 않았다. 상세 해시 및 복구 경로: records/'+id+'/installation.json.\n');
fs.appendFileSync(ledgers[0],JSON.stringify({event:'approved_mob_redraw',id,created:installation.created,files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath})),backup_path:backup,gameplay_verified_by_user:false})+'\n');
for(const [p,h] of Object.entries(v.protectedHashes))a.equal(sha(p),h,'Protected file changed '+p);
installation.status='INSTALLED';installation.catalogSha256=sha(hp);installation.qspAfter=sha(game+'/jack.qsp');installation.patchKey=event.key;installation.stableIDsPreserved=true;installation.unrelatedFlagsPreserved=true;save();
for(const name of ['adopt_work.cjs','manifest.json','runtime-original-swap.json'])fs.copyFileSync(here+'/'+name,rec+'/'+name);
console.log(JSON.stringify({status:'INSTALLED',...summary,record:rec+'/installation.json'}));
// JO9 MOD END QUEST_COMBAT_ADOPTION_20261030
