'use strict';
// JO9 MOD START MOB_BACKGROUND_ADOPTION_20261029
// User-approved same-path PNG adoption. Reads the reviewed manifest, validates
// both source and replacement hashes, backs up originals outside the game,
// updates only the128 image rows and132 corresponding MOB slots, and records
// existing image-patch history. No QSP, save, portrait, group or deployment edit.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),a=require('assert/strict');
const review=fs.existsSync(__dirname+'/manifest.json')?__dirname:'C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/mob-background-composites-20261029',repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',cat=game+'/modtools/catalog';
const id='mob-backgrounds-adopted-20261029',rec=repo+'/records/'+id,backup='G:/somi/JO9_work_backups/'+id;
const ct=require(repo+'/tools/text-workshop/catalog.cjs'),clone=x=>JSON.parse(JSON.stringify(x));
const read=p=>fs.readFileSync(p),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=p=>hash(read(p));
const v=JSON.parse(read(review+'/manifest.json')),hp=cat+'/catalog_merge_vs_original.html',sp=cat+'/catalog_status.js',ip=cat+'/catalog_work_ids.json',gp=repo+'/tools/mob-image-sets/group-sets.json',cp=repo+'/tools/mob-image-sets/background-contexts.json',docp=repo+'/docs/MOB_BACKGROUND_CONTEXTS_KO.md';
a.equal(v.adopted,false,'Review already adopted; inspect record instead of repeating');
a.equal(v.summary.composited,128);a(!fs.existsSync(backup),'Backup ID already exists; do not repeat');
const qspBefore=sha(game+'/jack.qsp');a.equal(qspBefore,v.workQspSha256);
const hb=read(hp),sb=read(sp),ib=read(ip),gb=read(gp),cb=read(cp),db=read(docp);
let html=hb.toString('utf8');const dm=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/),mm=html.match(/window.JO9_MOB_SETS=(.*?);<\/script>/);a(dm);a(mm);
const oldRows=JSON.parse(dm[1]),rows=clone(oldRows),oldM=JSON.parse(mm[1]),m=clone(oldM),oldState=ct.parseStatus(sb.toString('utf8')),state=clone(oldState),context=JSON.parse(cb);
const files=v.files.filter(f=>f.status==='composited').map(f=>({path:f.path,source:review+'/'+f.output,before:f.sourceSha256,after:f.outputSha256,plate:f.plate,backgroundCrop:f.backgroundCrop,characterCrop:f.characterCrop,characterScale:f.characterScale,translate:f.translate}));
const affected=new Map(files.map(f=>[f.path.toLowerCase(),f]));a.equal(affected.size,128);
const aliases=read(repo+'/assets/compatibility-aliases/2026-10-28_fullimage.json').toString('utf8').toLowerCase();
for(const f of files){
 a(!aliases.includes(f.path.toLowerCase()),'Protected alias affected: '+f.path);
 a(f.path.startsWith('content/pic/')&&!f.path.split('/').some(x=>x==='..'||x==='.'||!x));
 const source=read(f.source);a.equal(hash(source),f.after);a.equal(source.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(source.readUInt32BE(16),795);a.equal(source.readUInt32BE(20),596);
 a.equal(sha(game+'/'+f.path),f.before,'WORK changed since review: '+f.path);
 a(fs.realpathSync(game+'/'+f.path).toLowerCase().startsWith(fs.realpathSync(game).toLowerCase()+path.sep),'Runtime path resolves outside WORK');
 const tracked=repo+'/resources/new/'+f.path;f.trackedBefore=fs.existsSync(tracked)?sha(tracked):null;
 f.bytes=source.length;f.beforePath=backup+'/original/'+f.path;
 f.trackedBeforePath=f.trackedBefore===null?null:f.trackedBefore===f.before?f.beforePath:backup+'/tracked-original/'+f.path;
 const row=rows.find(x=>x[0].replaceAll('\\','/').toLowerCase()===f.path.toLowerCase());a(row,'Existing catalog row absent');
 row[3]=f.bytes;row[5]=795;row[6]=596;
 const flags=new Set(state.items[row[0]]||[]);flags.delete('todo');flags.delete('wip');flags.add('done');state.items[row[0]]=[...flags];
}
const created=new Date().toISOString();let slots=0;
function refresh(slot){if(!slot||!slot.path)return;const f=affected.get(slot.path.toLowerCase());if(!f)return;
 Object.assign(slot,{exists:true,width:795,height:596,bytes:f.bytes,sha256:f.after,workLabel:'장소별 배경 합성 반영 완료 · 2026-10-29',backgroundComposition:{date:'2026-10-29',record:id,plate:f.plate,opaque:true,characterCrop:f.characterCrop,characterScale:f.characterScale,translate:f.translate}});slots++;
}
for(const entry of m.entries)for(const kind of ['standing','defeat'])refresh(entry[kind]);
a.equal(slots,132);
const kimerianNote='배경 수정 완료(2026-10-29): 전투 전신 gladiator_kimerian_5.png의 숲 배경을 분리하고 콜로세움 배경으로 합성했다. 원본 RGB를 보존한 알파 마스크 사용.';
const spawnNote='아레나 전신 배경 수정 완료(2026-10-29): gladiator_spawn.png의 늪 배경을 분리하고 아레나 배경으로 합성했다. 원본 인물에게 가려진 신체는 머리·목 확대 구도로 화면 밖 처리. 초상 공유는 기존 기록대로 유지.';
for(const list of [m.entries,context.entries]){
 for(const entry of list){
  if(entry.key==='kimerian_e')entry.backgroundNotes=[...(entry.backgroundNotes||[]).filter(s=>!s.includes('gladiator_kimerian_5.png')),kimerianNote];
  if((entry.standing?.path||entry.slots?.standing?.path)==='content/pic/mob/gladiator_spawn.png')entry.backgroundNotes=[...(entry.backgroundNotes||[]),spawnNote];
 }
}
m.workUpdate={...m.workUpdate,lastBackgroundComposition:{date:'2026-10-29',files:128,slots,opaque:true,size:[795,596],record:id}};
context.lastImageAdoption={date:'2026-10-29',record:id,files:128,standingAndDefeatOnly:true,qspChanged:false};
html=html.replace(dm[1],()=>JSON.stringify(rows)).replace(mm[0],()=> 'window.JO9_MOB_SETS='+JSON.stringify(m).replaceAll('<','\\u003c')+';</script>');
// Preserve unrelated row fields, all portraits, group definitions, stable IDs,
// custom flags and autoDone; do not use catalog.update()'s paired-image cascade.
for(let i=0;i<oldRows.length;i++){
 if(!affected.has(oldRows[i][0].replaceAll('\\','/').toLowerCase()))a.deepEqual(rows[i],oldRows[i]);
 else for(const k of [0,1,2,4,7])a.deepEqual(rows[i][k],oldRows[i][k]);
}
for(let i=0;i<oldM.entries.length;i++){
 a.deepEqual(m.entries[i].portrait,oldM.entries[i].portrait);
 for(const kind of ['standing','defeat'])if(oldM.entries[i][kind]&&!affected.has(oldM.entries[i][kind].path.toLowerCase()))a.deepEqual(m.entries[i][kind],oldM.entries[i][kind]);
 a.deepEqual(m.entries[i].appearanceContexts,oldM.entries[i].appearanceContexts);
}
a.deepEqual(m.groups,oldM.groups);a.deepEqual(state.autoDone,oldState.autoDone);
for(const [p,flags] of Object.entries(oldState.items))if(!affected.has(p.replaceAll('\\','/').toLowerCase()))a.deepEqual(state.items[p],flags);
const summary={files:files.length,slots,existingTracked:files.filter(f=>f.trackedBefore!==null).length,newTracked:files.filter(f=>f.trackedBefore===null).length,divergentTracked:files.filter(f=>f.trackedBefore&&f.trackedBefore!==f.before).length,qspUnchanged:true,portraitsAffected:0,groupsAffected:0};
if(process.argv[2]!=='--apply'){console.log(JSON.stringify({status:'PREFLIGHT_PASS',...summary}));process.exit(0);}
fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(backup,{recursive:true});
const meta=[['catalog-before.html',hb],['catalog-status-before.js',sb],['catalog-work-ids-before.json',ib],['group-sets-before.json',gb],['background-contexts-before.json',cb],['background-context-doc-before.md',db],['review-manifest-before.json',read(review+'/manifest.json')],['review-index-before.html',read(review+'/index.html')],['review-readme-before.md',read(review+'/README_KO.md')]];
const history=cat+'/image_work/history.jsonl',historyBefore=fs.existsSync(history)?read(history):null;
if(historyBefore)meta.push(['image-history-before.jsonl',historyBefore]);
const ledger=cat+'/image_work/personal-patch/events.jsonl',ledgerBefore=fs.existsSync(ledger)?read(ledger):null;
if(ledgerBefore)meta.push(['personal-patch-events-before.jsonl',ledgerBefore]);
const planp=repo+'/records/full-client-preparation-20261029/full-client-input-plan.json';if(fs.existsSync(planp))meta.push(['full-client-input-plan-before.json',read(planp)]);
for(const [name,b] of meta)fs.writeFileSync(backup+'/'+name+'.gz',zlib.gzipSync(b,{level:9}),{flag:'wx'});
for(const f of files){
 fs.mkdirSync(path.dirname(f.beforePath),{recursive:true});fs.copyFileSync(game+'/'+f.path,f.beforePath,fs.constants.COPYFILE_EXCL);a.equal(sha(f.beforePath),f.before);
 if(f.trackedBeforePath&&f.trackedBeforePath!==f.beforePath){fs.mkdirSync(path.dirname(f.trackedBeforePath),{recursive:true});fs.copyFileSync(repo+'/resources/new/'+f.path,f.trackedBeforePath,fs.constants.COPYFILE_EXCL);a.equal(sha(f.trackedBeforePath),f.trackedBefore);}
}
const installation={id,status:'BACKED_UP',approval:'User: 워크 반영해',created,files,summary,backup,qspBefore,saveWrites:false,fullSynced:false,releaseZipChanged:false,commitPush:false};
const save=()=>fs.writeFileSync(rec+'/installation.json',JSON.stringify(installation,null,2));save();
// Recheck every mutable source immediately before the first runtime write.
a(read(hp).equals(hb));a(read(sp).equals(sb));a(read(ip).equals(ib));a(read(gp).equals(gb));a(read(cp).equals(cb));
for(const f of files){a.equal(sha(game+'/'+f.path),f.before);a.equal(fs.existsSync(repo+'/resources/new/'+f.path)?sha(repo+'/resources/new/'+f.path):null,f.trackedBefore);}
installation.status='APPLYING';save();
for(const f of files){
 const target=game+'/'+f.path,tracked=repo+'/resources/new/'+f.path,b=read(f.source);
 a.equal(sha(target),f.before);ct.atomic(target,b);fs.mkdirSync(path.dirname(tracked),{recursive:true});ct.atomic(tracked,b);
 a.equal(sha(target),f.after);a.equal(sha(tracked),f.after);
}
const patch=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,cat).record({id,created,files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath}))},'approved-mob-background-composition');
a(patch,'Patch event unexpectedly duplicated');
a(read(hp).equals(hb));a(read(sp).equals(sb));ct.atomic(hp,html);state.savedAt=Math.max(Date.now(),Number(oldState.savedAt||0)+1);ct.atomic(sp,'window.CATALOG_STATUS='+JSON.stringify(state)+';\n');
ct.atomic(cp,JSON.stringify(context,null,2)+'\n');
fs.writeFileSync(docp,db.toString('utf8')+'\n\n## 2026-10-29 이미지 반영 갱신\n\n승인된 배경 합성128장을 WORK 및 resources/new에 반영했다. 원본 배경 유지13장, 파일 없는 패배 슬롯14곳, 편집 제외1곳은 유지한다. 전신·패배132슬롯의 해시/크기를 갱신했으며 초상·단체8컷·QSP 근거는 보존했다. 킴메르 투사E와 아레나 산란괴물의 잘못된 배경은 수정 완료다. 상세 파일 및 복구 위치: records/'+id+'/installation.json. 기존 본문의 전투 배경 경로는 QSP가 그리는 부모 배경을 뜻하며, 이번 PNG에 합성한 배경과 구분한다.\n');
fs.mkdirSync(path.dirname(history),{recursive:true});fs.appendFileSync(history,JSON.stringify({event:'approved_mob_background_composition',id,created,files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath})),backup_path:backup,gameplay_verified_by_user:false})+'\n');
a(read(ip).equals(ib));a(read(gp).equals(gb));a.equal(sha(game+'/jack.qsp'),qspBefore);
for(const row of v.files)if(row.status!=='composited'&&!row.missing)a.equal(sha(row.absolutePath),row.sourceSha256,'Preserved asset changed');
v.adopted=true;v.adoptedAt=created;v.adoptionRecord=rec+'/installation.json';fs.writeFileSync(review+'/manifest.json',JSON.stringify(v,null,2));
let preview=read(review+'/index.html').toString('utf8');preview=preview.replace('검토본입니다. WORK 이미지·QSP·세이브·체크리스트는 변경하지 않았습니다.','승인된128장을 WORK에 반영했습니다. 이미지 패치 체크리스트를 갱신했으며 QSP·세이브는 보존했습니다.');
// WORK is now the installed version; before-comparison reads the verified backup.
for(const f of files)preview=preview.replaceAll(new URL('file:///'+(game+'/'+f.path).replaceAll('\\','/')).href,new URL('file:///'+f.beforePath.replaceAll('\\','/')).href);
fs.writeFileSync(review+'/index.html',preview);
let readme=read(review+'/README_KO.md').toString('utf8');readme=readme.replace('2026-10-29. 게임에 적용하기 전 검토용 자료입니다. WORK, 배포 폴더, QSP, 세이브, 이미지 패치 체크리스트의 적용 상태는 변경하지 않았습니다.','2026-10-29. 사용자 승인으로 합성128장을 WORK에 반영하고 이미지 패치 체크리스트를 갱신했습니다. 배포 폴더·QSP·세이브는 보존했습니다. 이 폴더는 검토 및 반영 근거를 함께 보관합니다.');readme+='\n\n## WORK 반영 완료\n\n기록: '+rec+'/installation.json. 원본 복구 위치: '+backup+'. 비교 카탈로그의 원본 링크는 교체 전 백업을 참조하도록 바꿨습니다. 기존 검토 ZIP은 검토 당시 상태로 보존하며 다시 만들지 않았습니다.\n';fs.writeFileSync(review+'/README_KO.md',readme);
installation.status='INSTALLED';installation.catalogSha256=sha(hp);installation.qspAfter=sha(game+'/jack.qsp');installation.patchKey=patch.key;installation.stableIDsPreserved=true;installation.groupsPreserved=true;installation.unrelatedFlagsPreserved=true;save();
fs.copyFileSync(__filename,rec+'/adopt_work.cjs');console.log(JSON.stringify({status:'INSTALLED',...summary,backup,record:rec+'/installation.json'}));
// JO9 MOD END MOB_BACKGROUND_ADOPTION_20261029
