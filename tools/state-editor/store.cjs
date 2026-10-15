'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('../text-workshop/core.cjs');
const registry=require('./registry.cjs');
const {readIcon}=require('./assets.cjs');
const digest=raw=>core.hash(raw);
function failure(message,status=400){const error=new Error(message);error.status=status;return error;}
function samePath(a,b){return path.resolve(a).toLowerCase()===path.resolve(b).toLowerCase();}
function atomicWrite(file,bytes){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const temp=file+'.tmp-'+crypto.randomBytes(8).toString('hex');let fd;
  try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}
  finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
function jsonWrite(file,value){atomicWrite(file,JSON.stringify(value,null,2)+'\n');}
function createStore({targets,runtime}){
  if(!Array.isArray(targets)||!targets.length)throw failure('QSP 대상 설정이 없습니다.');
  runtime=path.resolve(runtime);fs.mkdirSync(runtime,{recursive:true});
  if(!samePath(fs.realpathSync(runtime),runtime))throw failure('runtime 심볼릭 링크는 지원하지 않습니다.');
  const targetMap=new Map();
  for(const entry of targets){
    if(!/^[a-z][a-z0-9_-]{0,30}$/.test(entry.id)||targetMap.has(entry.id))throw failure('대상 ID가 잘못되었거나 중복됩니다.');
    const full=path.resolve(entry.path);
    if(path.extname(full).toLowerCase()!=='.qsp'||/(^|[\\/])JO9O([\\/]|$)/i.test(full))throw failure('지원하지 않는 QSP 대상 경로입니다.');
    if([...targetMap.values()].some(t=>samePath(t.path,full)))throw failure('서로 다른 대상이 같은 파일을 가리킵니다.');
    targetMap.set(entry.id,{id:entry.id,label:String(entry.label||entry.id),path:full});
  }
  for(const dir of['previews','transactions','backups'])fs.mkdirSync(path.join(runtime,dir),{recursive:true});
  const id=()=>crypto.randomBytes(16).toString('hex');
  function byId(value){const t=targetMap.get(value);if(!t)throw failure('등록되지 않은 대상입니다.');return t;}
  function readTarget(target){
    if(!fs.existsSync(target.path)||!fs.statSync(target.path).isFile())throw failure('QSP 파일을 찾을 수 없습니다: '+target.label,409);
    if(!samePath(fs.realpathSync(target.path),target.path)||fs.statSync(target.path).nlink>1)throw failure('링크된 QSP 파일은 적용 대상이 될 수 없습니다.',409);
    return fs.readFileSync(target.path);
  }
  function validId(value){if(typeof value!=='string'||!/^\w{32}$/.test(value)||!/^[a-f0-9]+$/.test(value))throw failure('잘못된 기록 ID입니다.');return value;}
  function artifact(kind,key){return path.join(runtime,kind,validId(key)+'.json');}
  function readRecord(kind,key){const file=artifact(kind,key);if(!fs.existsSync(file))throw failure('기록을 찾을 수 없습니다.',404);const value=JSON.parse(fs.readFileSync(file,'utf8'));if(value.id!==key||value.version!==1)throw failure('기록 형식이 올바르지 않습니다.');return value;}
  function hashGuard(raw,expected,label){if(typeof expected!=='string'||digest(raw)!==expected)throw failure(label+' 원본이 변경되어 충돌했습니다. 다시 읽고 비교해 주세요.',409);}
  function metadata(){return[...targetMap.values()].map(t=>{try{return{...t,available:true,hash:digest(readTarget(t))};}catch(e){return{...t,available:false,error:e.message};}});}
  function publicRecord(r){return{id:r.id,status:r.status,createdAt:r.createdAt,updatedAt:r.updatedAt,error:r.error,targets:r.targets.map(t=>({id:t.id,label:t.label,path:t.path,beforeHash:t.beforeHash,afterHash:t.afterHash,status:t.status}))};}
  function history(){return fs.readdirSync(path.join(runtime,'transactions')).filter(n=>/^[a-f0-9]{32}\.json$/.test(n)).map(n=>{try{return publicRecord(JSON.parse(fs.readFileSync(path.join(runtime,'transactions',n),'utf8')));}catch{return null;}}).filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,40);}
  function snapshot(sourceId){const target=byId(sourceId),raw=readTarget(target),inspection=registry.inspect(raw);return{target:{...target,hash:digest(raw)},targets:metadata(),inspection,history:history()};}
  function checkEdits(edits){if(!Array.isArray(edits)||edits.length>200)throw failure('편집 목록이 올바르지 않습니다.');return edits;}
  function validateIcons(target,raw,changes){const fields=registry.inspect(raw).fields;for(const edit of changes){const field=fields.find(f=>f.id===edit.id);if(field?.kind==='icon'&&edit.value!==field.value)readIcon(target,edit.value);}}
  function reserveCacheRevision(){const file=path.join(runtime,'cache-revision.json');let previous=0;if(fs.existsSync(file)){previous=JSON.parse(fs.readFileSync(file,'utf8')).revision;if(!Number.isInteger(previous)||previous<0)throw failure('캐시 버전 원장을 확인해 주세요.');}const revision=Math.max(previous+1,Math.floor((Date.now()-Date.UTC(2020,0,1))/1000),1);if(revision>2147483646)throw failure('캐시 버전 범위를 초과했습니다.');jsonWrite(file,{revision});return revision;}
  function preview(input){
    const source=byId(input.sourceId),sourceRaw=readTarget(source);hashGuard(sourceRaw,input.hashes?.[input.sourceId],source.label);const featureId=registry.inspect(sourceRaw).feature.id;checkEdits(input.edits);
    const ids=input.targetIds;
    if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw failure('적용할 대상을 중복 없이 선택해 주세요.');
    if(input.refreshCache!==undefined&&typeof input.refreshCache!=='boolean')throw failure('캐시 갱신 설정이 올바르지 않습니다.');
    const createdAt=new Date().toISOString(),key=id(),rows=[];let changeCount=0;
    const cached=input.refreshCache||input.edits.some(e=>e?.id==='training.xp'||/^state\.[0-4]\.label$/.test(e?.id||'')),cacheRevision=cached?reserveCacheRevision():0;
    for(const targetId of ids){const t=byId(targetId),raw=readTarget(t);hashGuard(raw,input.hashes?.[targetId],t.label);const prepared=registry.prepare(raw,input.edits,input.hashes[targetId],{refreshCache:input.refreshCache===true,cacheRevision});validateIcons(t,raw,prepared.changes.map(c=>({id:c.id,value:c.after})));if(!core.serialize(core.parse(prepared.raw)).equals(prepared.raw))throw failure('후보 QSP 왕복 검사 실패');rows.push({...t,beforeHash:prepared.beforeHash,afterHash:prepared.afterHash,changes:prepared.changes,patch:prepared.patch,raw:prepared.raw});changeCount+=prepared.changes.length;}
    const effectiveRevision=Math.max(cacheRevision,...rows.flatMap(r=>r.changes.filter(c=>c.id==='cache.revision').map(c=>c.after)));if(cached&&effectiveRevision>cacheRevision)jsonWrite(path.join(runtime,'cache-revision.json'),{revision:effectiveRevision});
    const folder=path.join(runtime,'previews',key);fs.mkdirSync(folder);
    for(const row of rows){const candidate=path.join(folder,row.id+'.qsp');atomicWrite(candidate,row.raw);hashGuard(fs.readFileSync(candidate),row.afterHash,row.label+' 후보');delete row.raw;}
    const record={version:1,id:key,featureId,sourceId:input.sourceId,createdAt,targets:rows,changeCount};jsonWrite(artifact('previews',key),record);return record;
  }
  function lock(action){
    const file=path.join(runtime,'write.lock');let fd;
    try{fd=fs.openSync(file,'wx',0o600);}catch(e){
      if(e.code!=='EEXIST')throw e;
      const saved=fs.readFileSync(file);let owner;try{owner=JSON.parse(saved.toString('utf8'));}catch{throw failure('잠금 기록을 확인할 수 없습니다. runtime/write.lock을 확인해 주세요.',409);}
      if(!Number.isInteger(owner.pid)||owner.pid<1)throw failure('잠금 프로세스를 확인할 수 없습니다.',409);
      let alive=true;try{process.kill(owner.pid,0);}catch(error){if(error.code==='ESRCH')alive=false;}
      if(alive)throw failure('다른 적용/복원이 진행 중입니다. 잠금 프로세스를 종료한 뒤 다시 시도해 주세요.',409);
      if(!fs.readFileSync(file).equals(saved))throw failure('잠금 기록이 변경되었습니다. 다시 시도해 주세요.',409);
      fs.renameSync(file,path.join(runtime,'stale-lock-'+id()+'.json'));
      try{fd=fs.openSync(file,'wx',0o600);}catch{throw failure('다른 작업이 잠금을 사용 중입니다.',409);}
    }
    try{fs.writeFileSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));fs.fsyncSync(fd);return action();}finally{fs.closeSync(fd);fs.unlinkSync(file);}
  }
  function saveJournal(record){record.updatedAt=new Date().toISOString();jsonWrite(artifact('transactions',record.id),record);}
  function checkRecordTarget(row){const t=byId(row.id);if(!samePath(t.path,row.path))throw failure('기록과 현재 대상 경로가 다릅니다.',409);return t;}
  function candidateBytes(previewId,row){const file=path.join(runtime,'previews',validId(previewId),byId(row.id).id+'.qsp');const raw=fs.readFileSync(file);hashGuard(raw,row.afterHash,row.label+' 후보');core.parse(raw);return raw;}
  function backupBytes(record,row){const file=path.join(runtime,'backups',validId(record.id),byId(row.id).id+'.qsp');const raw=fs.readFileSync(file);hashGuard(raw,row.beforeHash,row.label+' 백업');core.parse(raw);return raw;}
  function apply({previewId}){return lock(()=>{
    const p=readRecord('previews',previewId);
    if(p.changeCount===0)return{id:p.id,status:'no_op',targets:p.targets};
    if(fs.existsSync(artifact('transactions',p.id)))throw failure('이미 처리한 미리보기입니다. 다시 읽고 새 후보를 만들어 주세요.',409);
    const rows=p.targets.map(row=>{const t=checkRecordTarget(row),raw=readTarget(t);hashGuard(raw,row.beforeHash,t.label);validateIcons(t,raw,row.changes.map(c=>({id:c.id,value:c.after})));return{...row,original:raw,candidate:candidateBytes(p.id,row),status:'prepared'};});
    const folder=path.join(runtime,'backups',p.id);fs.mkdirSync(folder);
    for(const row of rows){atomicWrite(path.join(folder,row.id+'.qsp'),row.original);hashGuard(fs.readFileSync(path.join(folder,row.id+'.qsp')),row.beforeHash,row.label+' 백업');}
    const record={version:1,id:p.id,previewId:p.id,status:'prepared',createdAt:new Date().toISOString(),targets:rows.map(({original,candidate,...row})=>row)};saveJournal(record);
    try{
      for(const row of rows)hashGuard(readTarget(checkRecordTarget(row)),row.beforeHash,row.label);
      record.status='applying';saveJournal(record);
      for(const row of rows){hashGuard(readTarget(checkRecordTarget(row)),row.beforeHash,row.label);if(row.beforeHash!==row.afterHash)atomicWrite(row.path,row.candidate);hashGuard(readTarget(checkRecordTarget(row)),row.afterHash,row.label+' 적용 결과');record.targets.find(t=>t.id===row.id).status='applied';saveJournal(record);}
      record.status='applied';saveJournal(record);return publicRecord(record);
    }catch(error){
      let failed=false;
      for(const row of rows){try{const t=checkRecordTarget(row),raw=readTarget(t),current=digest(raw);if(current===row.afterHash&&current!==row.beforeHash)atomicWrite(t.path,backupBytes(record,row));else if(current!==row.beforeHash)throw failure('복구 중 원본 충돌');hashGuard(readTarget(t),row.beforeHash,row.label+' 복구 결과');record.targets.find(t=>t.id===row.id).status='rolled_back';}catch(e){failed=true;record.targets.find(t=>t.id===row.id).status='rollback_failed';}}
      record.status=failed?'rollback_failed':'rolled_back';record.error=error.message;try{saveJournal(record);}catch{}throw failure('적용 실패: '+error.message+(failed?' · 일부 파일은 복구가 필요합니다.':''),409);
    }
  });}
  function restore({id:key}){return lock(()=>{
    const record=readRecord('transactions',key);if(record.status==='restored'||record.status==='rolled_back')return publicRecord(record);
    const rows=record.targets.map(row=>{const t=checkRecordTarget(row),current=readTarget(t),currentHash=digest(current);if(currentHash!==row.afterHash&&currentHash!==row.beforeHash)throw failure(row.label+'에 이후 변경이 있어 복원 충돌했습니다.',409);return{...row,current,currentHash,backup:backupBytes(record,row)};});
    record.status='restoring';saveJournal(record);
    try{for(const row of rows){const t=checkRecordTarget(row);hashGuard(readTarget(t),row.currentHash,row.label);if(row.currentHash!==row.beforeHash)atomicWrite(t.path,row.backup);hashGuard(readTarget(t),row.beforeHash,row.label+' 복원 결과');record.targets.find(t=>t.id===row.id).status='restored';saveJournal(record);}record.status='restored';saveJournal(record);return publicRecord(record);}
    catch(error){record.status='restoring';record.error=error.message;try{saveJournal(record);}catch{}throw failure('복원 중단: '+error.message+' · 기록을 보존했습니다. 다시 복구할 수 있습니다.',409);}
  });}
  function saveProject(input){const t=byId(input.sourceId),raw=readTarget(t);checkEdits(input.edits);hashGuard(raw,input.hashes?.[input.sourceId],t.label);registry.prepare(raw,input.edits,input.hashes[input.sourceId]);const project={version:1,featureId:registry.inspect(raw).feature.id,sourceId:input.sourceId,hashes:input.hashes,edits:input.edits,savedAt:new Date().toISOString()};jsonWrite(path.join(runtime,'project.json'),project);return{project};}
  function loadProject(){const file=path.join(runtime,'project.json');if(!fs.existsSync(file))return{project:null};const project=JSON.parse(fs.readFileSync(file,'utf8'));if(project.version!==1||project.featureId!==registry.inspect(readTarget(byId(project.sourceId))).feature.id)throw failure('프로젝트 형식이 지원되지 않습니다.');checkEdits(project.edits);return{project};}
  function exportPatch(key){const p=readRecord('previews',key);return{version:1,featureId:p.featureId,createdAt:p.createdAt,targets:p.targets.map(t=>({id:t.id,label:t.label,path:t.path,beforeHash:t.beforeHash,afterHash:t.afterHash,patch:t.patch}))};}
  return{snapshot,preview,apply,restore,saveProject,loadProject,exportPatch};
}
module.exports={createStore,atomicWrite,failure};
