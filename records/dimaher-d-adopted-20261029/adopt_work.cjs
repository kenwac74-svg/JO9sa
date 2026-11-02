'use strict';
// JO9 MOD START DIMAHER_D_ADOPTION_20261029
// Approved same-path PNG adoption. No game code, IDs, saves or portrait changes.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),a=require('assert/strict');
const review='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/dimaher-d-adopted-20261029';
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',cat=game+'/modtools/catalog';
const id='dimaher-d-adopted-20261029',rec=repo+'/records/'+id,backup='G:/somi/JO9_work_backups/'+id;
const ct=require(repo+'/tools/text-workshop/catalog.cjs'),clone=x=>JSON.parse(JSON.stringify(x));
const read=p=>fs.readFileSync(p),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=p=>hash(read(p));
const currentSha=p=>fs.existsSync(p)?sha(p):null;
const v=JSON.parse(read(review+'/manifest.json')),files=clone(v.files),affected=new Map(files.map(f=>[f.path.toLowerCase(),f]));
a.equal(files.length,2);a.equal(affected.size,2);a.deepEqual(v.sourceDrift,[]);a(!fs.existsSync(backup),'Already backed up; inspect installation instead of repeating');
const hp=cat+'/catalog_merge_vs_original.html',sp=cat+'/catalog_status.js',ip=cat+'/catalog_work_ids.json',gp=repo+'/tools/mob-image-sets/group-sets.json',cp=repo+'/tools/mob-image-sets/background-contexts.json',docp=repo+'/docs/MOB_BACKGROUND_CONTEXTS_KO.md';
const originals=new Map([hp,sp,ip,gp,cp,docp].map(p=>[p,read(p)]));
let html=originals.get(hp).toString('utf8');
const dm=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/),mm=html.match(/window.JO9_MOB_SETS=(.*?);<\/script>/);a(dm);a(mm);
const oldRows=JSON.parse(dm[1]),rows=clone(oldRows),oldM=JSON.parse(mm[1]),m=clone(oldM),oldState=ct.parseStatus(originals.get(sp).toString('utf8')),state=clone(oldState),oldGroups=JSON.parse(originals.get(gp)),groups=clone(oldGroups),context=JSON.parse(originals.get(cp));
const qspBefore=sha(game+'/jack.qsp');a.equal(qspBefore,v.qspBefore);
const protectedAliases=read(repo+'/assets/compatibility-aliases/2026-10-28_fullimage.json').toString('utf8').toLowerCase();
for(const f of files){
 a(!protectedAliases.includes(f.path.toLowerCase()),'Protected alias: '+f.path);
 a(f.path.startsWith('content/pic/mob/')&&!f.path.split('/').some(x=>x==='..'||x==='.'||!x));
 const b=read(f.source);a.equal(hash(b),f.after);a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(b.readUInt32BE(16),795);a.equal(b.readUInt32BE(20),596);
 a.equal(currentSha(game+'/'+f.path),f.before,'WORK changed: '+f.path);
 a(fs.realpathSync(fs.existsSync(game+'/'+f.path)?game+'/'+f.path:path.dirname(game+'/'+f.path)).toLowerCase().startsWith(fs.realpathSync(game).toLowerCase()+path.sep));
 const tracked=repo+'/resources/new/'+f.path;f.trackedBefore=fs.existsSync(tracked)?sha(tracked):null;f.bytes=b.length;f.beforePath=f.before===null?null:backup+'/original/'+f.path;
 f.trackedBeforePath=f.trackedBefore===null?null:f.trackedBefore===f.before?f.beforePath:backup+'/tracked-original/'+f.path;
 const row=rows.find(r=>r[0].replaceAll('\\','/').toLowerCase()===f.path.toLowerCase());a(row,'Missing target row: '+f.path);
 row[3]=f.bytes;row[5]=795;row[6]=596;
 const flags=new Set(state.items[row[0]]||[]);flags.delete('todo');flags.delete('wip');flags.add('done');state.items[row[0]]=[...flags];
}
const created=new Date().toISOString();let entrySlots=0,groupSlots=0,canonicalGroups=0;
function refresh(slot){
 if(!slot?.path)return false;const f=affected.get(slot.path.toLowerCase());if(!f)return false;
 Object.assign(slot,{exists:true,width:795,height:596,bytes:f.bytes,sha256:f.after,workLabel:'재작화 승인·WORK 반영 완료 · 2026-10-29',imageRedraw:{date:'2026-10-29',record:id,generator:'built-in image_gen.imagegen',opaque:true}});
 delete slot.backgroundComposition;return true;
}
for(const e of m.entries)for(const kind of ['standing','defeat'])if(refresh(e[kind]))entrySlots++;
for(const g of m.groups)if(refresh(g.defeat))groupSlots++;
for(const g of groups)if(refresh(g.defeat))canonicalGroups++;
a.equal(entrySlots,2);a.equal(groupSlots,0);a.equal(canonicalGroups,0);
m.workUpdate={...m.workUpdate,lastImageRedraw:{date:'2026-10-29',files:2,entrySlots,groupSlots,size:[795,596],record:id}};
context.lastImageAdoption={date:'2026-10-29',record:id,files:2,standingAndDefeatOnly:true,qspChanged:false};
m.summary={...m.summary,missingStanding:m.entries.filter(e=>e.standing?.path&&!affected.has(e.standing.path.toLowerCase())&&!fs.existsSync(game+'/'+e.standing.path)).length,missingDefeat:m.entries.filter(e=>e.defeat?.path&&!affected.has(e.defeat.path.toLowerCase())&&!fs.existsSync(game+'/'+e.defeat.path)).length};
html=html.replace(dm[1],()=>JSON.stringify(rows)).replace(mm[0],()=> 'window.JO9_MOB_SETS='+JSON.stringify(m).replaceAll('<','\\u003c')+';</script>');
for(let i=0;i<oldRows.length;i++){
 if(!affected.has(oldRows[i][0].replaceAll('\\','/').toLowerCase()))a.deepEqual(rows[i],oldRows[i]);
 else for(const k of [0,1,2,4,7])a.deepEqual(rows[i][k],oldRows[i][k]);
}
for(let i=0;i<oldM.entries.length;i++){
 a.deepEqual(m.entries[i].portrait,oldM.entries[i].portrait);
 for(const k of ['standing','defeat']){
  const old=oldM.entries[i][k];if(!old)continue;
  if(!affected.has(old.path.toLowerCase()))a.deepEqual(m.entries[i][k],old);
  else a.deepEqual(m.entries[i][k].mageEdit,old.mageEdit);
 }
 a.deepEqual(m.entries[i].appearanceContexts,oldM.entries[i].appearanceContexts);
}
for(let i=0;i<oldM.groups.length;i++){
 const old=oldM.groups[i];if(!affected.has(old.defeat.path.toLowerCase()))a.deepEqual(m.groups[i],old);
 else a.deepEqual(m.groups[i].defeat.mageEdit,old.defeat.mageEdit);
}
a.deepEqual(state.autoDone,oldState.autoDone);
for(const [p,flags] of Object.entries(oldState.items))if(!affected.has(p.replaceAll('\\','/').toLowerCase()))a.deepEqual(state.items[p],flags);
const summary={files:2,newRuntimeFiles:files.filter(f=>f.before===null).length,replacedRuntimeFiles:files.filter(f=>f.before!==null).length,entrySlots,groupSlots,existingTracked:files.filter(f=>f.trackedBefore!==null).length,newTracked:files.filter(f=>f.trackedBefore===null).length,unrelatedRows:oldRows.length-2,portraitsAffected:0,qspUnchanged:true};
if(process.argv[2]!=='--apply'){console.log(JSON.stringify({status:'PREFLIGHT_PASS',...summary}));process.exit(0);}
fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(backup,{recursive:true});
const extra=[cat+'/image_work/history.jsonl',cat+'/image_work/personal-patch/events.jsonl',repo+'/records/full-client-preparation-20261029/full-client-input-plan.json'];
let n=0;const backups=[];
for(const [p,b] of [...originals,...extra.filter(p=>fs.existsSync(p)).map(p=>[p,read(p)])]){
 const target=backup+'/metadata-'+(++n)+'-'+path.basename(p)+'.gz';fs.writeFileSync(target,zlib.gzipSync(b,{level:9}),{flag:'wx'});backups.push({path:p,backup:target,sha256:hash(b)});
}
for(const f of files){
 if(f.beforePath){fs.mkdirSync(path.dirname(f.beforePath),{recursive:true});fs.copyFileSync(game+'/'+f.path,f.beforePath,fs.constants.COPYFILE_EXCL);a.equal(sha(f.beforePath),f.before);}
 if(f.trackedBeforePath&&f.trackedBeforePath!==f.beforePath){fs.mkdirSync(path.dirname(f.trackedBeforePath),{recursive:true});fs.copyFileSync(repo+'/resources/new/'+f.path,f.trackedBeforePath,fs.constants.COPYFILE_EXCL);a.equal(sha(f.trackedBeforePath),f.trackedBefore);}
}
const installation={id,status:'BACKED_UP',approval:v.approval,created,files,summary,backup,metadataBackups:backups,qspBefore,saveWrites:false,fullSynced:false,releaseZipChanged:false,commitPush:false};
const save=()=>fs.writeFileSync(rec+'/installation.json',JSON.stringify(installation,null,2));save();
for(const [p,b] of originals)a(read(p).equals(b),'Concurrent metadata edit: '+p);
for(const f of files){a.equal(currentSha(game+'/'+f.path),f.before);a.equal(fs.existsSync(repo+'/resources/new/'+f.path)?sha(repo+'/resources/new/'+f.path):null,f.trackedBefore);}
installation.status='APPLYING';save();
for(const f of files){
 const b=read(f.source),p=game+'/'+f.path,t=repo+'/resources/new/'+f.path;
 a.equal(currentSha(p),f.before);ct.atomic(p,b);fs.mkdirSync(path.dirname(t),{recursive:true});ct.atomic(t,b);a.equal(sha(p),f.after);a.equal(sha(t),f.after);
}
const event=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,cat).record({id,created,files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath}))},'approved-mob-redraw');a(event);
for(const [p,b] of originals)a(read(p).equals(b),'Concurrent metadata edit: '+p);
ct.atomic(hp,html);state.savedAt=Math.max(Date.now(),Number(oldState.savedAt||0)+1);ct.atomic(sp,'window.CATALOG_STATUS='+JSON.stringify(state)+';\n');
a(read(gp).equals(originals.get(gp)));ct.atomic(cp,JSON.stringify(context,null,2)+'\n');
ct.atomic(docp,originals.get(docp).toString('utf8')+'\n\n## 2026-10-29 전투·패배 재작화 반영\n\n승인된 쌍수 투사D(dimaher_d)의 전투·패배2장을 WORK 및 resources/new에 반영했다. 전투 장소·경로·집단 구성·초상·Mage Edit 프롬프트와 다른 이미지의 기존 사용자 작업을 보존하고 PNG2개 및 체크리스트2슬롯만 갱신했다. 795×596 불투명 장면이며 QSP는 변경하지 않았다. 상세 원본·최종 해시와 복구 위치: records/'+id+'/installation.json.\n');
fs.appendFileSync(cat+'/image_work/history.jsonl',JSON.stringify({event:'approved_mob_redraw',id,created,files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath})),backup_path:backup,gameplay_verified_by_user:false})+'\n');
a(read(ip).equals(originals.get(ip)));a.equal(sha(game+'/jack.qsp'),qspBefore);
installation.status='INSTALLED';installation.catalogSha256=sha(hp);installation.qspAfter=sha(game+'/jack.qsp');installation.patchKey=event.key;installation.stableIDsPreserved=true;installation.unrelatedFlagsPreserved=true;save();
fs.copyFileSync(__filename,rec+'/adopt_work.cjs');fs.copyFileSync(review+'/manifest.json',rec+'/approved-input.json');
console.log(JSON.stringify({status:'INSTALLED',...summary,backup,record:rec+'/installation.json'}));
// JO9 MOD END DIMAHER_D_ADOPTION_20261029
