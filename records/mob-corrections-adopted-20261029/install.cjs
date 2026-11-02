'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),crypto=require('crypto'),zlib=require('zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',cat=game+'/modtools/catalog',rec=repo+'/records/mob-corrections-adopted-20261029',backup='G:/somi/JO9_work_backups/mob-corrections-adopted-20261029';
const review='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/mob-corrections-20261029';
const read=p=>fs.readFileSync(p),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=p=>hash(read(p)),ct=require(repo+'/tools/text-workshop/catalog.cjs'),clone=x=>JSON.parse(JSON.stringify(x));
const manifestFile=review+'/review-manifest.json',reviewBefore=read(manifestFile),v=JSON.parse(reviewBefore);
a.equal(v.newArt.length,10);a(!fs.existsSync(backup),'Unique backup exists: inspect before repeat');
const qspBefore=sha(game+'/jack.qsp'),hp=cat+'/catalog_merge_vs_original.html',sp=cat+'/catalog_status.js',gp=repo+'/tools/mob-image-sets/group-sets.json',ip=cat+'/catalog_work_ids.json';
const hb=read(hp),sb=read(sp),gb=read(gp),ib=read(ip),ids=JSON.parse(ib);
let html=hb.toString('utf8');const dm=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/),mm=html.match(/window.JO9_MOB_SETS=(.*?);<\/script>/);a(dm);a(mm);
const oldRows=JSON.parse(dm[1]),rows=clone(oldRows),oldM=JSON.parse(mm[1]),m=clone(oldM),state=ct.parseStatus(sb.toString('utf8'));
const files=v.newArt.map(x=>({key:x.key,source:x.review,path:x.proposedTarget,before:x.runtimeBeforeReviewSHA256,after:x.reviewSHA256,width:795,height:596,revision:x.revision||null}));
const portrait=v.portraitProposal;files.push({key:'canibal_portrait',source:portrait.source,path:portrait.target,before:'0caecee8fe1a517702583de7bfa83e5147a7454b74dded3877980ba3f61226a4',after:sha(portrait.source),width:150,height:150,revision:'existing_asymmetric_default_frame'});
const affected=new Map(files.map(f=>[f.path.toLowerCase(),f]));a.equal(affected.size,11);
const aliasText=read(repo+'/assets/compatibility-aliases/2026-10-28_fullimage.json').toString('utf8');
for(const f of files){a(!aliasText.toLowerCase().includes(f.path.toLowerCase()),'Compatibility alias affected');const b=read(f.source);a.equal(hash(b),f.after);a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(b.readUInt32BE(16),f.width);a.equal(b.readUInt32BE(20),f.height);a.equal(sha(game+'/'+f.path),f.before,'WORK changed since review: '+f.path);f.trackedBefore=fs.existsSync(repo+'/resources/new/'+f.path)?sha(repo+'/resources/new/'+f.path):null;if(f.trackedBefore!==null)a.equal(f.trackedBefore,f.before,'Tracked source changed: '+f.path);f.bytes=b.length;f.beforePath=backup+'/original/'+f.path;const row=rows.find(x=>x[0].replaceAll('\\','/').toLowerCase()===f.path.toLowerCase());a(row,'Missing catalog row');row[3]=b.length;row[5]=f.width;row[6]=f.height;const flags=new Set(state.items[row[0]]||[]);flags.delete('todo');flags.delete('wip');flags.add('done');state.items[row[0]]=[...flags];}
let slotUpdates=0;
function refresh(slot){if(!slot)return;const f=affected.get(slot.path.toLowerCase());if(!f)return;Object.assign(slot,{exists:true,width:f.width,height:f.height,bytes:f.bytes,sha256:f.after,workLabel:'승인된 외형 수정 반영 완료 · 2026-10-29'});slotUpdates++;}
for(const e of m.entries)for(const kind of ['portrait','standing','defeat'])refresh(e[kind]);
for(const g of m.groups)refresh(g.defeat);
a.equal(slotUpdates,11);
m.workUpdate={...m.workUpdate,lastApprovedCorrection:{date:'2026-10-29',battleImages:10,portrait:1,files:11}};
html=html.replace(dm[1],()=>JSON.stringify(rows)).replace(mm[0],()=> 'window.JO9_MOB_SETS='+JSON.stringify(m).replaceAll('<','\\u003c')+';</script>');
// Check all non-target rows and slots remain identical before making the first runtime write.
for(let i=0;i<oldRows.length;i++)if(!affected.has(oldRows[i][0].replaceAll('\\','/').toLowerCase()))a.deepEqual(rows[i],oldRows[i]);
for(let i=0;i<oldM.entries.length;i++)for(const k of ['portrait','standing','defeat'])if(oldM.entries[i][k]&&!affected.has(oldM.entries[i][k].path.toLowerCase()))a.deepEqual(m.entries[i][k],oldM.entries[i][k]);
for(let i=0;i<oldM.groups.length;i++)if(!affected.has(oldM.groups[i].defeat.path.toLowerCase()))a.deepEqual(m.groups[i],oldM.groups[i]);
fs.mkdirSync(backup,{recursive:true});
for(const [n,b]of[['catalog-before.html.gz',hb],['catalog-status-before.js.gz',sb],['review-manifest-before.json.gz',reviewBefore]])fs.writeFileSync(backup+'/'+n,zlib.gzipSync(b),{flag:'wx'});
fs.writeFileSync(backup+'/group-sets-before.json',gb,{flag:'wx'});fs.writeFileSync(backup+'/catalog-work-ids-before.json',ib,{flag:'wx'});
for(const f of files){fs.mkdirSync(path.dirname(f.beforePath),{recursive:true});fs.copyFileSync(game+'/'+f.path,f.beforePath,fs.constants.COPYFILE_EXCL);a.equal(sha(f.beforePath),f.before);}
a(read(hp).equals(hb));a(read(sp).equals(sb));a(read(gp).equals(gb));
for(const f of files){a.equal(sha(game+'/'+f.path),f.before);a.equal(fs.existsSync(repo+'/resources/new/'+f.path)?sha(repo+'/resources/new/'+f.path):null,f.trackedBefore);fs.writeFileSync(game+'/'+f.path,read(f.source));fs.writeFileSync(repo+'/resources/new/'+f.path,read(f.source));a.equal(sha(game+'/'+f.path),f.after);a.equal(sha(repo+'/resources/new/'+f.path),f.after);}
require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,cat).record({id:'mob-corrections-adopted-20261029',created:new Date().toISOString(),files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath}))},'approved-mob-corrections');
a(read(hp).equals(hb));a(read(sp).equals(sb));ct.atomic(hp,html);state.savedAt=Date.now();ct.atomic(sp,'window.CATALOG_STATUS='+JSON.stringify(state)+';\n');fs.writeFileSync(gp,JSON.stringify(m.groups,null,2));ct.create(cat).snapshot();
a.deepEqual(JSON.parse(read(ip)),ids);a.equal(sha(game+'/jack.qsp'),qspBefore);
const events=read(cat+'/image_work/personal-patch/events.jsonl').toString('utf8').trim().split(/\r?\n/).map(JSON.parse),event=events.filter(e=>e.id==='mob-corrections-adopted-20261029');a.equal(event.length,1);a.equal(event[0].files.length,11);
for(const f of files)a(event[0].files.some(x=>x.path===f.path.replace(/^content\/pic\//,'')&&x.after===f.after&&x.before===f.before));
for(const x of v.newArt){x.runtimeInstalled=true;x.installedTarget=x.proposedTarget;x.installedSHA256=x.reviewSHA256;}
v.portraitProposal.runtimeInstalled=true;v.portraitProposal.installedSHA256=files[10].after;v.status='APPROVED_INSTALLED';v.adoptionRecord='G:/somi/JO9sa/records/mob-corrections-adopted-20261029/installation.json';fs.writeFileSync(manifestFile,JSON.stringify(v,null,2));
const rp=review+'/review.html';let rh=read(rp).toString('utf8');rh=rh.replaceAll('795×596 · 검토용 / WORK 미반영','795×596 · 승인·WORK 반영 완료').replace('새로 만든 아래 수정안은 아직 WORK에 교체하지 않았습니다. 승인한 중간 화풍 배경과 기존 제작 전신 재사용은 별도 반영 기록을 따릅니다.','아래 수정안 10장과 식인종 대체 초상을 승인받아 WORK에 반영했습니다. 승인한 배경과 기존 전신 재사용 기록도 함께 보존합니다.');fs.writeFileSync(rp,rh);
const report={status:'INSTALLED',approval:'User: 반영해',files,qspSHA256:qspBefore,qspChanged:false,metadata:{rows:11,slots:11,groups:3,portrait:1,stableIDsPreserved:true,unrelatedRowsAndSlotsPreserved:true,compatibilityAliasesAffected:0,ledgerEvents:1,sourceSynced:true},backup,saveWrites:false,FullSynced:false,zipCreated:false,commitPush:false};
fs.writeFileSync(rec+'/installation.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,files:files.length,qspUnchanged:true,slots:slotUpdates,ledgerEvents:1,stableIDsPreserved:true}));

