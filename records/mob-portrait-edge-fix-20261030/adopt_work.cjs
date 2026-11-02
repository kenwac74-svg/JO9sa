'use strict';
// JO9 MOD START MOB_PORTRAIT_EDGE_FIX_20261030
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),a=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',cat=game+'/modtools/catalog';
const id='mob-portrait-edge-fix-20261030',rec=repo+'/records/'+id,backup='G:/somi/JO9_work_backups/'+id;
const ct=require(repo+'/tools/text-workshop/catalog.cjs'),read=p=>fs.readFileSync(p),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=p=>hash(read(p));
const clone=x=>JSON.parse(JSON.stringify(x)),norm=p=>p.replaceAll('\\','/').toLowerCase(),existsHash=p=>fs.existsSync(p)?sha(p):null;
const m=JSON.parse(read(here+'/manifest.json')),files=m.files,affected=new Map(files.map(x=>[norm(x.path),x])),apply=process.argv[2]==='--apply';
for(const name of ['candidate-verification.json','independent-visual-verification.json']){
 const v=JSON.parse(read(here+'/'+name));a(v.pass===true,name);a.equal(v.manifestSha256,sha(here+'/manifest.json'),name+' stale');
}
a.equal(files.length,30);a.equal(affected.size,30);a(!fs.existsSync(backup),'Existing backup: inspect before repeating');
a.equal(sha(game+'/jack.qsp'),m.qspBefore);a.equal(sha(m.reference),m.referenceSha256);a.equal(sha(m.sourceImage),m.sourceSha256);
for(const x of m.unchangedPortraits)a.equal(sha(game+'/'+x.path),x.sha256,'Unchanged input drift '+x.path);
for(const f of files){
 a(f.path.startsWith('content/pic/mob/')&&!f.path.split('/').some(x=>x==='..'||!x));
 a.equal(sha(game+'/'+f.path),f.before,'WORK drift '+f.path);a.equal(sha(f.source),f.after);
 const b=read(f.source);a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(b.readUInt32BE(16),150);a.equal(b.readUInt32BE(20),150);
 a(fs.realpathSync(game+'/'+f.path).toLowerCase().startsWith(fs.realpathSync(game).toLowerCase()+path.sep));
 f.beforePath=backup+'/original/'+f.path;f.trackedBefore=existsHash(repo+'/resources/new/'+f.path);
}
const seed=repo+'/tools/local-workspace/catalog-seed',hp=cat+'/catalog_merge_vs_original.html',sp=cat+'/catalog_status.js',shp=seed+'/catalog_merge_vs_original.html',ssp=seed+'/catalog_status.js';
const pp=repo+'/records/full-client-preparation-20261029/full-client-input-plan.json',mp=repo+'/tools/mob-image-sets/mage-edit-prompts.json',history=cat+'/image_work/history.jsonl';
const metaPaths=[hp,sp,shp,ssp,pp,mp,history],originals=new Map(metaPaths.map(p=>[p,read(p)]));
function catalogUpdate(hbuf,sbuf){
 let html=hbuf.toString('utf8');const dm=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/),mm=html.match(/window.JO9_MOB_SETS=(.*?);<\/script>/);a(dm&&mm);
 const oldRows=JSON.parse(dm[1]),rows=clone(oldRows),oldM=JSON.parse(mm[1]),mob=clone(oldM),oldStatus=ct.parseStatus(sbuf.toString('utf8')),status=clone(oldStatus);
 let rowCount=0,slotCount=0;
 for(const row of rows){const f=affected.get(norm(row[0]));if(!f)continue;row[3]=f.bytes;row[5]=150;row[6]=150;rowCount++;
  const flags=new Set(status.items[row[0]]||[]);flags.delete('todo');flags.delete('wip');flags.add('done');status.items[row[0]]=[...flags];
 }
 for(const e of mob.entries){const s=e.portrait;if(!s?.path)continue;const f=affected.get(norm(s.path));if(!f)continue;
  Object.assign(s,{exists:true,width:150,height:150,bytes:f.bytes,sha256:f.after,workLabel:'경계 안티앨리어싱·매트 색 제거 · WORK 반영 · 2026-10-30',edgeCorrection:{date:'2026-10-30',record:id,method:f.method,changedPixels:f.changedPixels,interiorAndFramePreserved:true}});slotCount++;
 }
 a.equal(rowCount,30);a(slotCount>=28&&slotCount<=35);
 mob.workUpdate={...mob.workUpdate,lastPortraitEdgeCorrection:{date:'2026-10-30',record:id,files:30,entrySlots:slotCount}};
 for(let i=0;i<rows.length;i++)if(!affected.has(norm(oldRows[i][0])))a.deepEqual(rows[i],oldRows[i]);
 for(let i=0;i<mob.entries.length;i++){
  const before=oldM.entries[i],after=mob.entries[i];for(const k of Object.keys(before))if(k!=='portrait')a.deepEqual(after[k],before[k]);
  if(!affected.has(norm(before.portrait?.path||'')))a.deepEqual(after.portrait,before.portrait);
  else{a.equal(after.portrait.frameClass,before.portrait.frameClass);a.deepEqual(after.portrait.mageEdit,before.portrait.mageEdit);}
 }
 a.deepEqual(mob.groups,oldM.groups);a.deepEqual(status.autoDone,oldStatus.autoDone);
 for(const [p,v] of Object.entries(oldStatus.items))if(!affected.has(norm(p)))a.deepEqual(status.items[p],v);
 status.savedAt=Math.max(Date.now(),Number(oldStatus.savedAt||0)+1);
 return {html:html.replace(dm[1],()=>JSON.stringify(rows)).replace(mm[0],()=> 'window.JO9_MOB_SETS='+JSON.stringify(mob).replaceAll('<','\\u003c')+';</script>'),status:'window.CATALOG_STATUS='+JSON.stringify(status)+';\n',rowCount,slotCount};
}
const live=catalogUpdate(originals.get(hp),originals.get(sp)),seedUpdate=catalogUpdate(originals.get(shp),originals.get(ssp));
const plan=JSON.parse(originals.get(pp)),oldPlan=clone(plan);a.equal(plan.qspSha256,m.qspBefore);let planCount=0;
for(const row of plan.files){const f=affected.get(norm(row.path).replace(/^game\//,''));if(!f)continue;a.equal(row.sha256,f.before,'Plan drift '+f.path);row.sha256=f.after;row.bytes=f.bytes;planCount++;}
a.equal(planCount,30);plan.summary.includedBytes=plan.files.reduce((sum,f)=>sum+f.bytes,0);a.equal(plan.files.length,oldPlan.files.length);
const prompts=JSON.parse(originals.get(mp));let promptCount=0;
for(const e of prompts.entries||[]){const s=e.slots?.portrait;if(!s?.path)continue;const f=affected.get(norm(s.path));if(!f)continue;s.sourceSHA256=f.after;s.sourceExists=true;promptCount++;}
prompts.lastPortraitRefresh={date:'2026-10-30',record:id,files:30,slots:promptCount,note:'Portrait source hashes refreshed after edge correction; standing/defeat prompts retained.'};
const summary={files:30,edgeCorrections:30,characterReplaced:0,unaffectedPortraits:m.unchangedPortraits.length,catalogRows:live.rowCount,entrySlots:live.slotCount,promptSlots:promptCount,planRows:planCount,dimensions:[150,150],qspUnchanged:true,fullSynced:false,saveWrites:false,commitPush:false};
if(!apply){fs.writeFileSync(here+'/preflight.json',JSON.stringify({pass:true,...summary},null,2));console.log(JSON.stringify({status:'PREFLIGHT_PASS',...summary}));process.exit(0);}
fs.mkdirSync(backup,{recursive:true});fs.mkdirSync(rec,{recursive:true});
const metaBackups=[];let index=0;
for(const [p,b] of originals){const q=backup+'/metadata-'+(++index)+'-'+path.basename(p)+'.gz';fs.writeFileSync(q,zlib.gzipSync(b),{flag:'wx'});metaBackups.push({path:p,backup:q,sha256:hash(b)});}
for(const f of files){fs.mkdirSync(path.dirname(f.beforePath),{recursive:true});fs.writeFileSync(f.beforePath,read(game+'/'+f.path),{flag:'wx'});a.equal(sha(f.beforePath),f.before);
 if(f.trackedBefore&&f.trackedBefore!==f.before){const q=backup+'/previous-tracked/'+f.path;fs.mkdirSync(path.dirname(q),{recursive:true});fs.writeFileSync(q,read(repo+'/resources/new/'+f.path),{flag:'wx'});f.trackedBeforePath=q;}}
const receipt={id,status:'BACKED_UP',created:new Date().toISOString(),approval:m.approval,files,summary,metadataBackups:metaBackups,qspBefore:m.qspBefore,reference:m.reference,referenceSha256:m.referenceSha256,sourceImage:m.sourceImage,sourceSha256:m.sourceSha256};
const save=()=>fs.writeFileSync(rec+'/installation.json',JSON.stringify(receipt,null,2));save();
for(const [p,b] of originals)a(read(p).equals(b),'Metadata changed concurrently '+p);
for(const f of files){a.equal(sha(game+'/'+f.path),f.before);a.equal(existsHash(repo+'/resources/new/'+f.path),f.trackedBefore);}
receipt.status='APPLYING';save();
for(const f of files){const b=read(f.source),p=game+'/'+f.path,t=repo+'/resources/new/'+f.path;ct.atomic(p,b);fs.mkdirSync(path.dirname(t),{recursive:true});ct.atomic(t,b);a.equal(sha(p),f.after);a.equal(sha(t),f.after);}
for(const [p,b] of originals)a(read(p).equals(b),'Metadata changed concurrently '+p);
const event=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,cat).record({id,created:receipt.created,files:files.map(f=>({path:f.path.replace(/^content\/pic\//,''),before:f.before,after:f.after,beforePath:f.beforePath}))},'portrait-edge-fix');a(event);
ct.atomic(hp,live.html);ct.atomic(sp,live.status);ct.atomic(shp,seedUpdate.html);ct.atomic(ssp,seedUpdate.status);ct.atomic(pp,JSON.stringify(plan,null,2)+'\n');ct.atomic(mp,JSON.stringify(prompts,null,2)+'\n');
fs.appendFileSync(history,JSON.stringify({event:'portrait_edge_fix',id,created:receipt.created,files:receipt.files.map(({path,before,after,beforePath})=>({path,before,after,beforePath})),backup_path:backup,gameplay_verified_by_user:false})+'\n');
a.equal(sha(game+'/jack.qsp'),m.qspBefore);for(const x of m.unchangedPortraits)a.equal(sha(game+'/'+x.path),x.sha256);
receipt.status='INSTALLED';receipt.patchKey=event.key;receipt.qspAfter=sha(game+'/jack.qsp');receipt.catalogSha256=sha(hp);save();
fs.writeFileSync(here+'/installation.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify({status:receipt.status,...summary,record:rec+'/installation.json'}));
// JO9 MOD END MOB_PORTRAIT_EDGE_FIX_20261030
