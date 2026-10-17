'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=m=>{throw Error(m)};
function create(game,catalogRoot,catalog,originalCuts={}){
 const personalPatch=require('./personal-patch.cjs').create(game,catalogRoot);
 const root=path.join(game,'content','pic'),real=fs.existsSync(root)?fs.realpathSync(root):null,backupName='__JO9_ImageBackups';let index=null,locked=false;
 function resolve(rel,backup=false){
  if(!real)fail('플레이 폴더에 content/pic 폴더가 없습니다.');
  if(typeof rel!=='string'||!rel||rel.includes('\\')||/[\x00-\x1f:]/.test(rel)||rel.startsWith('/')||rel.split('/').some(n=>!n||n==='.'||n==='..'||/[. ]$/.test(n)))fail('잘못된 PIC 경로입니다.');
  if(!backup&&rel.split('/').some(n=>/^(?:_|backup)/i.test(n)))fail('백업 폴더는 교체 대상이 아닙니다.');
  const full=path.resolve(root,...rel.split('/'));if(!full.startsWith(root+path.sep))fail('PIC 밖의 경로입니다.');
  let cursor=root;for(const part of rel.split('/')){const next=path.join(cursor,part);if(!fs.existsSync(next))break;if(!fs.readdirSync(cursor).includes(part))fail('파일명의 대소문자가 다릅니다. 정확한 이름으로 선택하세요: '+rel);cursor=next;}
  let ancestor=full;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
  const actual=fs.realpathSync(ancestor);if(actual!==real&&!actual.startsWith(real+path.sep))fail('PIC 밖으로 연결된 경로입니다.');
  return full;
 }
 function png(b){if(b.length<33||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.toString('ascii',12,16)!=='IHDR')fail('PNG 파일이 아닙니다.');const width=b.readUInt32BE(16),height=b.readUInt32BE(20);if(!width||!height||width*height>32000000)fail('이미지 크기를 확인하세요.');return{width,height};}
 // JO9 MOD START WINDOWS_IMAGE_SLOTS_20261018_PIC_LIST: annotate an actual original B once; absent files stay absent.
 function scan(force){if(index&&!force)return index;const out=[];function walk(dir,p=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isSymbolicLink())continue;if(e.isDirectory()){if(/^_JO9|^__JO9|^\.git$|backup/i.test(e.name))continue;walk(path.join(dir,e.name),p+e.name+'/');}else if(e.isFile()&&/\.png$/i.test(e.name))out.push({path:p+e.name,name:e.name});}}walk(root);for(const entry of Object.values(originalCuts.originals?.()||{})){const item=out.find(e=>e.path.toLowerCase()===entry.alias.toLowerCase());if(item)Object.assign(item,{originalCut:true,readOnly:true});}index=out.sort((a,b)=>a.path.localeCompare(b.path));return index;}
 function entries(rel){const dir=rel?resolve(rel,true):root;if(!fs.existsSync(dir))return{missing:true};const entries=fs.readdirSync(dir,{withFileTypes:true}).filter(e=>!e.isSymbolicLink()).map(e=>({name:e.name,kind:e.isDirectory()?'directory':'file'}));for(const entry of Object.values(originalCuts.originals?.()||{}))if(path.posix.dirname(entry.alias)===(rel||'.')){const item=entries.find(e=>e.name.toLowerCase()===path.posix.basename(entry.alias).toLowerCase());if(item)Object.assign(item,{originalCut:true,readOnly:true});}return{entries};}
 // JO9 MOD END WINDOWS_IMAGE_SLOTS_20261018_PIC_LIST
 function file(rel){const alias=originalCuts.resolveAlias?.(rel);if(alias){const b=fs.readFileSync(alias);return{data:b.toString('base64'),name:path.basename(rel),lastModified:fs.statSync(alias).mtimeMs,originalCut:true,readOnly:true};}const p=resolve(rel,true);if(!fs.existsSync(p)||!fs.statSync(p).isFile())return{missing:true};if(!/\.png$/i.test(rel)&&!new RegExp('^'+backupName+'/[^/]+/manifest\\.json$').test(rel))fail('읽을 수 없는 파일입니다.');const b=fs.readFileSync(p);return{data:b.toString('base64'),name:path.basename(p),lastModified:fs.statSync(p).mtimeMs};}
 function refreshCatalog(files,record){
  const htmlFile=path.join(catalogRoot,'catalog_merge_vs_original.html');let html=fs.readFileSync(htmlFile,'utf8');const m=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);if(!m)fail('카탈로그 목록 형식이 다릅니다.');let a=m[1];const rows=JSON.parse(a);
  for(const f of files){const rel='content\\pic\\'+f.path.replaceAll('/','\\'),d=rows.find(x=>x[0]===rel);if(!d)continue;const b=fs.readFileSync(resolve(f.path)),size=png(b),n=[d[0],d[4]?'r':'a','etc',b.length,d[4],size.width,size.height,d[7]];a=a.replace(JSON.stringify(d),JSON.stringify(n));}
  const dir=path.join(catalogRoot,'image_work','backups','localhost_'+record.id);fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(htmlFile,path.join(dir,'catalog_merge_vs_original.html'));
  catalog.load();const actions=[];for(const f of files){const meta=catalog.meta('content\\pic\\'+f.path.replaceAll('/','\\'));if(!meta)continue;actions.push({path:meta.path,flag:'done',checked:true,expected:meta.flags.includes('done')});for(const flag of ['wip','todo'])if(meta.flags.includes(flag))actions.push({path:meta.path,flag,checked:false,expected:true});}
  if(actions.length)catalog.update(actions);
  if(a!==m[1]){catalogModuleAtomic(htmlFile,html.replace(m[1],a));catalog.load();}
  const work=path.join(catalogRoot,'image_work');fs.mkdirSync(work,{recursive:true});fs.appendFileSync(path.join(work,'history.jsonl'),JSON.stringify({event:'localhost_image_replace',...record,backup_path:path.join(root,backupName,record.id)})+'\n');
  const progressFile=path.join(work,'progress.json');if(fs.existsSync(progressFile)){fs.copyFileSync(progressFile,path.join(dir,'progress.json'));const progress=JSON.parse(fs.readFileSync(progressFile,'utf8').replace(/^\uFEFF/,''));for(const f of files){const rel='content\\pic\\'+f.path.replaceAll('/','\\'),meta=catalog.meta(rel),v={relative_path:rel,work_code:meta?.code,catalog_tags:meta?.flags||[],work_status:'placed',completed_at:record.created,sha256_before:f.before,sha256_after:f.after,game_path:resolve(f.path),backup_paths:[path.join(root,backupName,record.id)],gameplay_verified_by_user:false};const i=progress.items.findIndex(x=>x.relative_path===rel);if(i<0)progress.items.push(v);else progress.items[i]={...progress.items[i],...v};}progress.updated_at=record.created;catalogModuleAtomic(progressFile,JSON.stringify(progress,null,2)+'\n');}
 }
 function catalogModuleAtomic(p,text){const temp=p+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';fs.writeFileSync(temp,text,{flag:'wx'});fs.renameSync(temp,p);}
 function apply(jobs,operation='replace'){
  if(locked)fail('다른 이미지 반영이 진행 중입니다.');if(!Array.isArray(jobs)||!jobs.length||jobs.length>200)fail('교체 목록을 확인하세요.');locked=true;
  let record,dir;try{
   // JO9 MOD START WINDOWS_IMAGE_SLOTS_20261018_PIC_WRITE: missing-original metadata does not reserve an ordinary B.
   const protectedAliases=new Set([...Object.values(originalCuts.originals?.()||{}),...Object.values(originalCuts.reservations?.()||{}).filter(e=>e.status==='linked')].map(e=>e.alias.toLowerCase()));
   const seen=new Set(),prepared=jobs.map(j=>{if(protectedAliases.has(String(j.path).toLowerCase()))fail('B컷은 JO9O 원본용으로 예약되어 있습니다. 새 그림은 전환 컷 추가로 저장하세요.');const full=resolve(j.path);if(!/\.png$/i.test(j.path)||seen.has(j.path.toLowerCase()))fail('중복되거나 잘못된 이미지 경로입니다.');seen.add(j.path.toLowerCase());const old=fs.existsSync(full)?fs.readFileSync(full):null;if((old?sha(old):null)!==j.before)fail('이미지가 바뀌었습니다. 다시 선택하세요: '+j.path);if(!old&&!j.createMissing)fail('새 파일 생성 승인이 필요합니다.');if(typeof j.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(j.data))fail('파일 데이터 형식이 다릅니다.');const data=Buffer.from(j.data,'base64'),size=png(data),prior=old?png(old):{width:j.width,height:j.height};if(size.width!==prior.width||size.height!==prior.height||!Number.isSafeInteger(j.cap)||j.cap<1||j.cap>60*1024*1024||data.length>j.cap)fail('이미지 크기 또는 용량 한도를 확인하세요.');return{...j,full,old,data,after:sha(data)};});
   // JO9 MOD END WINDOWS_IMAGE_SLOTS_20261018_PIC_WRITE
   const id=new Date().toISOString().replace(/[:.]/g,'-')+'_'+crypto.randomBytes(4).toString('hex');dir=path.join(root,backupName,id);fs.mkdirSync(dir,{recursive:true});record={version:2,id,created:new Date().toISOString(),status:'prepared',files:prepared.map(j=>({path:j.path,before:j.before,after:j.after,existed:j.old!==null}))};
   for(const j of prepared)if(j.old){const dest=path.join(dir,'original',...j.path.split('/'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,j.old,{flag:'wx'});if(sha(fs.readFileSync(dest))!==j.before)fail('백업 확인 실패');}
   const save=()=>fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(record,null,2));save();
   for(const j of prepared)if((fs.existsSync(j.full)?sha(fs.readFileSync(j.full)):null)!==j.before)fail('반영 직전에 파일이 바뀌었습니다.');record.status='applying';save();
   for(const j of prepared){if((fs.existsSync(j.full)?sha(fs.readFileSync(j.full)):null)!==j.before)fail('다른 창에서 파일을 바꿨습니다.');fs.mkdirSync(path.dirname(j.full),{recursive:true});const temp=j.full+'.'+id+'.tmp';fs.writeFileSync(temp,j.data,{flag:'wx'});if(sha(fs.readFileSync(temp))!==j.after)fail('저장 확인 실패');fs.renameSync(temp,j.full);}
   record.status='applied';record.operation=operation;save();index=null;try{personalPatch.record(record,operation);}catch(e){record.patchWarning='패치 자동 기록 실패: '+e.message;save();}try{refreshCatalog(record.files,record);}catch(e){record.catalogWarning='이미지는 저장됐지만 체크리스트 기록을 확인하세요: '+e.message;save();}return record;
  }catch(e){if(record&&dir){record.status='interrupted';record.error=e.message;fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(record,null,2));}throw e;}finally{locked=false;}
 }
 function revisions(paths){if(!Array.isArray(paths)||paths.length>500)fail('표시 이미지 목록을 확인하세요.');const result={};for(const p of paths){try{const full=originalCuts.resolveAlias?.(p)||resolve(p),st=fs.statSync(full);result[p]={version:st.size+':'+st.mtimeMs,work:catalog.meta('content\\pic\\'+p.replaceAll('/','\\'))};}catch{}}return result;}
 function restore(id){
  if(typeof id!=='string'||!/^[A-Za-z0-9_-]+$/.test(id))fail('잘못된 백업 번호입니다.');
  const manifest=resolve(backupName+'/'+id+'/manifest.json',true),record=JSON.parse(fs.readFileSync(manifest,'utf8'));if(!Array.isArray(record.files)||!record.files.length)fail('백업 기록을 확인하세요.');
  const jobs=[];for(const f of record.files){if(!f.before)fail('새로 생성했던 파일이 포함된 복구는 기존 워크샵에서 진행하세요.');const full=resolve(f.path),now=fs.readFileSync(full),before=fs.readFileSync(resolve(backupName+'/'+id+'/original/'+f.path,true));if(sha(before)!==f.before||![f.before,f.after].includes(sha(now)))fail('백업 또는 현재 이미지가 바뀌었습니다. 복구를 중단했습니다.');const size=png(before);jobs.push({path:f.path,before:sha(now),data:before.toString('base64'),cap:Math.max(now.length,before.length),...size});}
  const result=apply(jobs,'restore');record.status='restored';fs.writeFileSync(manifest,JSON.stringify(record,null,2));return result;
 }
 return{scan,entries,file,apply,revisions,restore};
}
module.exports={create};
