'use strict';
// JO9 MOD START WINDOWS_IMAGE_SLOTS_20261018_ORIGINAL_REGISTER
// Copy original B bytes to the physical Windows sibling (2); preserve A and source bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const normalize=s=>String(s).replaceAll('\\','/').replace(/^content\/pic\//i,'').toLowerCase();
const eligible=s=>/^(bg|characters|scene|mob|reserve)\/.+\.png$/i.test(s)&&!s.split('/').some(p=>!p||p==='.'||p==='..'||/[\x00-\x1f:*?"<>|]/.test(p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function readRows(catalogRoot){const html=fs.readFileSync(path.join(catalogRoot,'catalog_merge_vs_original.html'),'utf8'),m=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);if(!m)throw Error('카탈로그 목록을 읽지 못했습니다.');return JSON.parse(m[1]);}
function png(data){if(data.length<24||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('원본이 PNG가 아닙니다.');return{width:data.readUInt32BE(16),height:data.readUInt32BE(20)};}
function atomic(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomBytes(5).toString('hex')+'.tmp';fs.writeFileSync(temp,data,{flag:'wx'});fs.renameSync(temp,file);}
function register(game,catalogRoot,originalRoot,runtime,scope,reconcile=false){
 const rows=readRows(catalogRoot),statusFile=path.join(catalogRoot,'catalog_status.js'),text=fs.readFileSync(statusFile,'utf8').replace(/^\ufeff/,''),m=text.match(/window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$/);if(!m)throw Error('보관 상태를 읽지 못했습니다.');const state=JSON.parse(m[1]);
 const selected=rows.filter(d=>Array.isArray(state.items[d[0]])&&state.items[d[0]].includes('spare'));
 const scoped=scope?new Set(scope.map(normalize)):null;
 const manifestFile=path.join(game,'modtools/image-original-cuts.json'),prior=fs.existsSync(manifestFile)?fs.readFileSync(manifestFile):null;
 const next=prior?JSON.parse(prior):{version:1,originals:{},reservations:{}};next.originals||={};next.reservations||={};
 const before=JSON.stringify(next),registered=[],pending=[],ignored=[],released=[],copies=[];
 if(reconcile){const wanted=new Set(selected.filter(d=>eligible(normalize(d[0]))&&!/ \(\d+\)\.png$/i.test(d[0])).map(d=>normalize(d[0])));for(const key of new Set([...Object.keys(next.originals),...Object.keys(next.reservations)])){if(wanted.has(key))continue;const entry=next.originals[key]||next.reservations[key];released.push({...entry,preserveCatalog:fs.existsSync(path.join(game,'content/pic',entry.alias))});delete next.originals[key];delete next.reservations[key];}}
 if(!reconcile&&scoped&&!selected.some(d=>scoped.has(normalize(d[0]))))return{changed:false,registered,pending,ignored,manifest:manifestFile,backup:null,prior,link:path.join(game,'content/jo9o_original_cuts'),createdLink:false};
 const originalPic=path.join(originalRoot,'content/pic'),originalReal=fs.realpathSync(originalPic);
 const junction=path.join(game,'content/jo9o_original_cuts');
 if(fs.existsSync(junction)&&fs.realpathSync(junction).toLowerCase()!==originalReal.toLowerCase())throw Error('원본 B컷 연결 폴더가 다른 곳을 가리킵니다.');
 for(const d of selected){const base=d[0].replaceAll('\\','/').replace(/^content\/pic\//i,''),key=normalize(base);if(scoped&&!scoped.has(key))continue;
  if(!eligible(base)||/ \((?:[2-9]|[1-9][0-9]+)\)\.png$/i.test(base)){ignored.push(d[0]);continue;}
  const alias=base.replace(/\.png$/i,' (2).png'),sourceRel=base.replace(/^reserve\//i,''),source=path.join(originalPic,...sourceRel.split('/'));
  const a=path.join(game,'content/pic',...base.split('/'));if(!fs.existsSync(a)||!fs.statSync(a).isFile()){pending.push({base,reason:'플레이 A파일 없음'});continue;}
  const physicalB=path.join(game,'content/pic',...alias.split('/'));
  if(!fs.existsSync(source)||!fs.statSync(source).isFile()){if(next.originals[key])throw Error('이미 연결한 JO9O 원본에 접근할 수 없습니다: '+base);next.reservations[key]={base,alias,status:'missing-original'};pending.push({base,source:'content/pic/'+sourceRel,reason:'JO9O 원본 없음'});continue;}
  if(!fs.realpathSync(source).toLowerCase().startsWith(originalReal.toLowerCase()+path.sep))throw Error('원본 PIC 밖으로 연결된 파일입니다.');
  const data=fs.readFileSync(source),dimensions=png(data),entry={base,alias,source:'content/pic/'+sourceRel,target:'content/jo9o_original_cuts/'+sourceRel,sourceSha:hash(data),bytes:data.length,...dimensions};
  if(next.originals[key]&&next.originals[key].sourceSha!==entry.sourceSha)throw Error('이미 연결한 JO9O 원본이 기록과 다릅니다: '+base);
  if(fs.existsSync(physicalB)){const picReal=fs.realpathSync(path.join(game,'content/pic'));if(fs.lstatSync(physicalB).isSymbolicLink()||!fs.statSync(physicalB).isFile()||!fs.realpathSync(physicalB).toLowerCase().startsWith(picReal.toLowerCase()+path.sep)||hash(fs.readFileSync(physicalB))!==entry.sourceSha)throw Error('기존 B파일과 JO9O 원본이 충돌합니다: '+base);}
  else copies.push({source,full:physicalB,sha256:entry.sourceSha});
  next.originals[key]=entry;next.reservations[key]={base,alias,status:'linked'};registered.push(entry);
 }
 if(registered.length||pending.length||prior)next.sourceRoot=originalRoot;
 const changed=JSON.stringify(next)!==before;
 let createdLink=false,backup=null;const createdPhysical=[];
 try{
  if((registered.length||Object.keys(next.originals).length)&&!fs.existsSync(junction)){fs.symlinkSync(originalPic,junction,'junction');createdLink=true;}
  for(const copy of copies){const bytes=fs.readFileSync(copy.source);if(hash(bytes)!==copy.sha256)throw Error('원본 B컷이 복사 직전에 바뀌었습니다.');fs.writeFileSync(copy.full,bytes,{flag:'wx'});createdPhysical.push({path:copy.full,sha256:copy.sha256});if(hash(fs.readFileSync(copy.full))!==copy.sha256)throw Error('원본 B컷 복사 검증 실패');}
  if(changed){const id=new Date().toISOString().replace(/[:.]/g,'-')+'_'+crypto.randomBytes(3).toString('hex'),dir=path.join(runtime,'original-cut-history',id);fs.mkdirSync(dir,{recursive:true});if(prior){backup=path.join(dir,'image-original-cuts.before.json');fs.writeFileSync(backup,prior,{flag:'wx'});}else{backup=path.join(dir,'no-previous-manifest');fs.writeFileSync(backup,'');}atomic(manifestFile,JSON.stringify(next,null,2)+'\n');fs.writeFileSync(path.join(dir,'registration.json'),JSON.stringify({id,released:released.map(x=>x.base),registered:registered.map(x=>x.base),pending,ignored,createdPhysical,manifest:manifestFile},null,2));}
 }catch(error){for(const item of createdPhysical)if(fs.existsSync(item.path)&&hash(fs.readFileSync(item.path))===item.sha256)fs.unlinkSync(item.path);if(createdLink&&fs.existsSync(junction)&&fs.lstatSync(junction).isSymbolicLink())fs.unlinkSync(junction);if(changed&&fs.existsSync(manifestFile)&&fs.readFileSync(manifestFile,'utf8')===JSON.stringify(next,null,2)+'\n'){if(prior)atomic(manifestFile,prior);else fs.unlinkSync(manifestFile);}throw error;}
 return{changed,registered,pending,ignored,released,manifest:manifestFile,backup,prior,link:junction,createdLink,createdPhysical,originalReal};
}
function rollback(record){if(record.changed){if(record.prior)atomic(record.manifest,record.prior);else if(fs.existsSync(record.manifest))fs.unlinkSync(record.manifest);}for(const item of record.createdPhysical||[])if(fs.existsSync(item.path)&&hash(fs.readFileSync(item.path))===item.sha256)fs.unlinkSync(item.path);if(record.createdLink&&fs.lstatSync(record.link).isSymbolicLink()&&fs.realpathSync(record.link).toLowerCase()===record.originalReal.toLowerCase())fs.unlinkSync(record.link);}
// JO9 MOD END WINDOWS_IMAGE_SLOTS_20261018_ORIGINAL_REGISTER
function exposeCatalog(catalogRoot,catalog,entries,runtime,released=[]){
 const file=path.join(catalogRoot,'catalog_merge_vs_original.html'),html=fs.readFileSync(file,'utf8'),m=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);if(!m)throw Error('카탈로그 목록 형식 확인 필요');const releasedAliases=new Set(released.filter(e=>!e.preserveCatalog).map(e=>normalize(e.alias))),physicalAliases=new Set(released.filter(e=>e.preserveCatalog).map(e=>normalize(e.alias)));const beforeRows=JSON.parse(m[1]),rows=beforeRows.filter(d=>!(d[2]==='orig'&&releasedAliases.has(normalize(d[0])))),keys=new Set(rows.map(d=>normalize(d[0]))),added=[];let converted=false;for(const d of rows)if(d[2]==='orig'&&physicalAliases.has(normalize(d[0]))){d[2]='etc';converted=true;}
 for(const e of entries){if(keys.has(normalize(e.alias)))continue;const rel='content\\pic\\'+e.alias.replaceAll('/','\\'),parent=rows.find(d=>normalize(d[0])===normalize(e.base));rows.push([rel,'a','orig',e.bytes,0,e.width,e.height,parent?.[7]||parent?.[0]||'']);keys.add(normalize(e.alias));added.push(rel);}
 if(added.length||converted||rows.length!==beforeRows.length){const dir=path.join(runtime,'original-cut-history');fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(file,path.join(dir,'catalog.before-'+Date.now()+'.html'));atomic(file,html.replace(m[1],JSON.stringify(rows)));catalog.load();if(added.length)catalog.update(added.map(p=>({path:p,flag:'done',checked:true,expected:false})));}
 return added;
}
module.exports={register,rollback,exposeCatalog,readRows,normalize};
