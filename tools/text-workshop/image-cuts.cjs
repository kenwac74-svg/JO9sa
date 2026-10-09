'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const core=require('./core.cjs');
const {checkSyntax}=require('./check-image-cycle-syntax.cjs');
const hash=core.hash,quote=s=>"'"+s.replaceAll("'","''")+"'";
function create(game,catalogRoot,catalog,runtime){
 const pic=path.join(game,'content/pic'),target=path.join(game,'jack.qsp'),originalManifest=path.join(game,'modtools/image-original-cuts.json'),originalLink=path.join(game,'content/jo9o_original_cuts');let locked=false,originalStamp='',originalCache=Object.create(null),reservationCache=Object.create(null);
 function pngPath(input){
  const rel=String(input||'').replaceAll('\\','/');
  if(!/\.png$/i.test(rel)||rel.split('/').some(s=>!s||s==='.'||s==='..'||/[\x00-\x1f:*?"<>|]/.test(s)))throw Error('PNG 파일의 상대 경로를 확인하세요.');
  return rel;
 }
 function imagePath(input){
  const rel=pngPath(String(input||'').replaceAll('\\','/').replace(/^content\/pic\//i,''));
  if(!/^(bg|characters|scene|reserve)\/.+\.png$/i.test(rel))throw Error('배경·캐릭터·장면·보관 폴더의 PNG를 선택하세요.');
  return rel;
 }
 function originalFile(entry){
  const suffix=entry.target.slice('content/jo9o_original_cuts/'.length),full=path.resolve(originalLink,suffix),root=fs.realpathSync(originalLink),actual=fs.realpathSync(full);
  if(!full.startsWith(originalLink+path.sep)||!actual.startsWith(root+path.sep)||!fs.statSync(actual).isFile())throw Error('원본 B컷 연결 밖의 경로입니다.');
  return actual;
 }
 function originals(){
  if(!fs.existsSync(originalManifest)){originalStamp='';originalCache=Object.create(null);reservationCache=Object.create(null);return originalCache;}
  const stat=fs.statSync(originalManifest),stamp=stat.mtimeMs+':'+stat.size;if(stamp===originalStamp)return originalCache;
  if(stat.size>4000000)throw Error('원본 B컷 연결 목록이 너무 큽니다.');
  const doc=JSON.parse(fs.readFileSync(originalManifest,'utf8').replace(/^\uFEFF/,'')),entries=doc.originals,next=Object.create(null),reservations=doc.reservations||{},nextReservations=Object.create(null);
  if(doc.version!==1||!entries||typeof entries!=='object'||Array.isArray(entries))throw Error('원본 B컷 연결 목록 형식을 확인하세요.');
  if(typeof reservations!=='object'||Array.isArray(reservations))throw Error('원본 B컷 예약 목록 형식을 확인하세요.');
  for(const [key,value] of Object.entries(reservations)){
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('원본 B컷 예약 항목을 확인하세요.');
   const base=imagePath(value.base),alias=imagePath(value.alias);
   if(key!==key.toLowerCase()||key!==base.toLowerCase()||/ \((?:[2-9]|[1-9][0-9]+)\)\.png$/i.test(base)||alias.toLowerCase()!==base.replace(/\.png$/i,' (2).png').toLowerCase()||!['linked','missing-original'].includes(value.status))throw Error('원본 B컷 예약 파일명을 확인하세요.');
   if(fs.existsSync(path.join(pic,alias)))throw Error('원본 B컷 예약과 기존 (2) 파일이 충돌합니다: '+alias);
   nextReservations[key]={...value,base,alias};
  }
  for(const [key,value] of Object.entries(entries)){
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('원본 B컷 항목 형식을 확인하세요.');
   const base=imagePath(value.base),alias=imagePath(value.alias),source=String(value.source||'').replaceAll('\\','/'),targetPath=String(value.target||'').replaceAll('\\','/');
   const expected=base.replace(/\.png$/i,' (2).png');
   if(key!==key.toLowerCase()||key!==base.toLowerCase()||/ \((?:[2-9]|[1-9][0-9]+)\)\.png$/i.test(base)||alias.toLowerCase()!==expected.toLowerCase()||!/^content\/pic\//i.test(source)||!/^content\/jo9o_original_cuts\//i.test(targetPath))throw Error('원본 B컷 파일명과 연결 경로를 확인하세요.');
   const sourceRel=pngPath(source.slice('content/pic/'.length)),targetRel=pngPath(targetPath.slice('content/jo9o_original_cuts/'.length));
   if(sourceRel.toLowerCase()!==targetRel.toLowerCase()||sourceRel.toLowerCase()!==base.replace(/^reserve\//i,'').toLowerCase()||!(/^[0-9a-f]{64}$/i.test(value.sourceSha))||!Number.isSafeInteger(value.bytes)||value.bytes<45||!Number.isSafeInteger(value.width)||!Number.isSafeInteger(value.height)||value.width<1||value.height<1||value.width*value.height>32000000)throw Error('원본 B컷 파일 정보가 올바르지 않습니다.');
   const entry={...value,base,alias,source:'content/pic/'+sourceRel,target:'content/jo9o_original_cuts/'+targetRel},full=originalFile(entry),fileStat=fs.statSync(full),header=Buffer.alloc(24),fd=fs.openSync(full,'r');
   try{fs.readSync(fd,header,0,header.length,0);}finally{fs.closeSync(fd);}
   if(fileStat.size!==entry.bytes||header.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||header.toString('ascii',12,16)!=='IHDR'||header.readUInt32BE(16)!==entry.width||header.readUInt32BE(20)!==entry.height)throw Error('원본 B컷 파일이 연결 목록과 다릅니다: '+base);
   if(fs.existsSync(path.join(pic,alias)))throw Error('원본 B컷과 기존 (2) 파일이 충돌합니다: '+alias);
   next[key]=entry;
  }
  for(const [key,reservation] of Object.entries(nextReservations))if((reservation.status==='linked')!==!!next[key])throw Error('원본 B컷 예약 상태와 연결 목록이 다릅니다: '+reservation.base);
  originalCache=next;reservationCache=nextReservations;originalStamp=stamp;return originalCache;
 }
 function reservations(){originals();return reservationCache;}
 function resolveAlias(input){
  if(!/ \(2\)\.png$/i.test(String(input||'')))return null;
  if(!/^(?:content[\\/]pic[\\/])?(?:bg|characters|scene|reserve)[\\/]/i.test(String(input||'')))return null;
  const alias=imagePath(input),base=alias.replace(/ \(2\)(\.png)$/i,'$1'),entry=originals()[base.toLowerCase()];
  if(!entry||alias.toLowerCase()!==entry.alias.toLowerCase())return null;
  return originalFile(entry);
 }
 function basePath(input){
  let rel=imagePath(input).replace(/ \((?:[2-9]|[1-9][0-9]+)\)(\.png)$/i,'$1');
  let cursor=pic;const actual=[];
  for(const part of rel.split('/')){const names=fs.readdirSync(cursor),matches=names.includes(part)?[part]:names.filter(n=>n.toLowerCase()===part.toLowerCase());if(matches.length!==1)throw Error('이미지 파일을 정확히 찾을 수 없습니다.');actual.push(matches[0]);cursor=path.join(cursor,matches[0]);if(fs.lstatSync(cursor).isSymbolicLink())throw Error('PIC 밖의 경로입니다.');}
  rel=actual.join('/');
  const full=path.resolve(pic,rel),real=fs.realpathSync(pic);
  if(!full.startsWith(pic+path.sep)||!fs.statSync(full).isFile()||!fs.realpathSync(full).startsWith(real+path.sep))throw Error('게임 PIC 밖의 경로입니다.');
  return rel;
 }
 function size(b){if(b.length<45||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.toString('ascii',12,16)!=='IHDR'||b.toString('ascii',b.length-8,b.length-4)!=='IEND')throw Error('완성된 PNG 파일이 아닙니다.');const width=b.readUInt32BE(16),height=b.readUInt32BE(20);if(!width||!height||width*height>32000000)throw Error('이미지 크기를 확인하세요.');return{width,height};}
 function cycleDocument(raw){if(!raw.includes(Buffer.from(core.shift('! JO9 image-cycle:',-5),'utf16le')))throw Error('게임 시작 화면 복구를 위해 추가 컷 저장을 잠시 중지했습니다. 기존 이미지는 보존되어 있습니다.');const doc=core.parse(raw),loc=doc.locations.find(l=>l.name==='interior_change');if(!loc)throw Error('이미지 전환 패치가 없습니다.');const syntax=checkSyntax(core.shift(doc.lines[loc.body],5));if(!syntax.ok)throw Error('이미지 전환 코드의 따옴표·END 검사에 실패했습니다. 추가 컷을 저장하지 않았습니다.');return doc;}
 function info(input,readOnly=false){if(!readOnly)cycleDocument(fs.readFileSync(target));const base=basePath(input),data=fs.readFileSync(path.join(pic,base)),folder=path.dirname(base),stem=path.basename(base).replace(/\.png$/i,''),names=fs.readdirSync(path.join(pic,folder));
  const escaped=stem.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp('^'+escaped+' \\((\\d+)\\)\\.png$','i'),originalCut=originals()[base.toLowerCase()]||null,reservedCut=reservationCache[base.toLowerCase()]||null;let last=originalCut||reservedCut?2:1;const cuts=[base],variants=[];
  if(originalCut){originalFile(originalCut);cuts.push(originalCut.alias);}
  for(const n of names){const m=n.match(re);if(m&&+m[1]>=2){const variantPath=path.join(folder,n).replaceAll('\\','/');if(n.slice(0,stem.length)!==stem&&basePath(variantPath)!==base)continue;if((originalCut||reservedCut)&&+m[1]===2)throw Error('원본 B컷과 기존 (2) 파일이 충돌합니다: '+(originalCut||reservedCut).alias);last=Math.max(last,+m[1]);variants.push({n:+m[1],p:variantPath});}}
  cuts.push(...variants.sort((a,b)=>a.n-b.n).map(v=>v.p));
  return{base,next:path.join(folder,stem+' ('+(last+1)+').png').replaceAll('\\','/'),cuts,originalCut,reservedCut,originalPending:!!(reservedCut&&!originalCut),before:hash(data),...size(data)};
 }
 function registry(){const groups=[],originalEntries=originals(),bases=new Map(),variantGroups=new Map();function walk(dir){return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isSymbolicLink()?[]:e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[]):[];}
  for(const category of ['bg','characters','scene','reserve'])for(const p of walk(path.join(pic,category))){
   if(!/\.png$/i.test(p))continue;const variant=p.match(/^(.*) \(([2-9]|[1-9][0-9]+)\)\.png$/i);
   if(variant){const key=(variant[1]+'.png').toLowerCase(),list=variantGroups.get(key)||[];list.push({n:+variant[2],p});variantGroups.set(key,list);}else bases.set(p.toLowerCase(),p);
  }
  const keys=new Set([...variantGroups.keys(),...Object.keys(originalEntries).map(base=>path.join(pic,base).toLowerCase())]);
  for(const key of [...keys].sort()){
   const p=bases.get(key);if(!p)continue;const base=path.relative(pic,p).replaceAll('\\','/'),originalCut=originalEntries[base.toLowerCase()],reservedCut=reservationCache[base.toLowerCase()],variants=variantGroups.get(key)||[];
   if(originalCut)originalFile(originalCut);
   if((originalCut||reservedCut)&&variants.some(v=>v.n===2))throw Error('원본 B컷과 기존 (2) 파일이 충돌합니다: '+(originalCut||reservedCut).alias);
   const paths=[path.relative(game,p).replaceAll('\\','/'),...(originalCut?[originalCut.target]:[]),...variants.sort((a,b)=>a.n-b.n).map(v=>path.relative(game,v.p).replaceAll('\\','/'))];
   if(paths.length>1)groups.push({base:path.relative(game,p).replaceAll('\\','/').toLowerCase(),paths});
  }
  return groups.map(g=>`if $jo9_base = ${quote(g.base)}:\r\n\tjo9_count = ${g.paths.length}\r\n`+g.paths.map((p,i)=>`\tif jo9_selected = ${i}: $jo9_path = ${quote(p)}\r\n`).join('')+'end').join('\r\n');
 }
 function refresh(id){const raw=fs.readFileSync(target),doc=cycleDocument(raw);if(!core.serialize(doc).equals(raw))throw Error('QSP 왕복 검사 실패');const loc=doc.locations.find(l=>l.name==='interior_change');
  const body=core.shift(doc.lines[loc.body],5),start=' if jo9_selected < 0: jo9_selected = 0\r\n',end='\r\n if jo9_selected >= jo9_count:',a=body.indexOf(start),b=body.indexOf(end,a);if(!body.startsWith('! JO9 image-cycle:')||a<0||b<0)throw Error('이미지 전환 패치를 먼저 설치하세요.');
  const next=body.slice(0,a+start.length)+' '+registry()+body.slice(b);if(!checkSyntax(next).ok)throw Error('추가 컷 등록 코드의 따옴표·END 검사 실패');if(body===next)return{unchanged:true};doc.lines[loc.body]=core.shift(next,-5);const after=core.serialize(doc);if(!core.serialize(core.parse(after)).equals(after))throw Error('QSP 출력 검사 실패');
  const record={id,description:'JO9O 원본 B컷 경로와 Windows 복사 이름을 이미지 전환 목록에 등록',before_sha256:hash(raw),after_sha256:hash(after),edits:[{location:'interior_change',field:'body',old:body,new:next,count:1}]};
  const dir=path.join(runtime,'cut-mods',id);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify(record,null,2));
  const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'apply_mods.ps1'),'-Qsp',target,'-ModsDir',dir],{encoding:'utf8',windowsHide:true,timeout:60000});
  if(hash(fs.readFileSync(target))!==record.after_sha256)throw Error('전환 목록 갱신 실패: '+(result.stderr||result.error?.message||result.stdout));
  const canonical=path.resolve(__dirname,'../../mods/2026-10-08_persistent_image_cycle.json');
  if(fs.existsSync(canonical)){const mod=JSON.parse(fs.readFileSync(canonical,'utf8')),edit=mod.edits.find(e=>e.location==='interior_change'),anchor='!Move to a different room in your apartment';if(edit&&next.includes(anchor)){edit.new=next.slice(0,next.indexOf(anchor))+anchor;mod.after_sha256=record.after_sha256;fs.writeFileSync(canonical,JSON.stringify(mod,null,2));}}
  return{hash:record.after_sha256,mod:path.join(dir,id+'.json')};
 }
 function add(input){if(locked)throw Error('추가 컷 저장 중입니다.');locked=true;let full,data,id;
  try{const plan=info(input.base);if(input.before!==plan.before||input.next!==plan.next)throw Error('원본 또는 컷 번호가 바뀌었습니다. 다시 열어 주세요.');if(typeof input.data!=='string'||input.data.length>85000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data))throw Error('파일 데이터를 확인하세요.');data=Buffer.from(input.data,'base64');const dimensions=size(data);if(data.length>60*1024*1024||dimensions.width!==plan.width||dimensions.height!==plan.height)throw Error('원본과 같은 픽셀 크기로 변환하세요.');
   id=new Date().toISOString().replace(/[:.]/g,'-')+'_'+crypto.randomBytes(4).toString('hex');full=path.join(pic,plan.next);fs.writeFileSync(full,data,{flag:'wx'});
   const qspBefore=hash(fs.readFileSync(target));let qsp;try{qsp=refresh(id);}catch(e){if(hash(fs.readFileSync(target))===qspBefore&&fs.existsSync(full)&&hash(fs.readFileSync(full))===hash(data))fs.unlinkSync(full);throw e;}
   const record={id,created:new Date().toISOString(),base:plan.base,path:plan.next,sha256:hash(data),originalCut:plan.originalCut,originalPending:plan.originalPending,reservedCut:plan.reservedCut,qsp};
   fs.mkdirSync(path.join(runtime,'cut-history'),{recursive:true});fs.writeFileSync(path.join(runtime,'cut-history',id+'.json'),JSON.stringify(record,null,2));
   try{const file=path.join(catalogRoot,'catalog_merge_vs_original.html'),html=fs.readFileSync(file,'utf8'),m=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);if(!m)throw Error('카탈로그 형식 확인 필요');const rows=JSON.parse(m[1]),rel='content\\pic\\'+plan.next.replaceAll('/','\\'),original=rows.find(d=>d[0].toLowerCase()===('content\\pic\\'+plan.base.replaceAll('/','\\')).toLowerCase());
    rows.push([rel,'a','etc',data.length,0,plan.width,plan.height,original?.[7]||original?.[0]||'']);fs.copyFileSync(file,path.join(runtime,'cut-history',id+'.catalog.html'));const temp=file+'.'+id+'.tmp';fs.writeFileSync(temp,html.replace(m[1],JSON.stringify(rows)));fs.renameSync(temp,file);catalog.load();catalog.update([{path:rel,flag:'done',checked:true,expected:false}]);
   }catch(e){record.warning='컷과 전환 목록은 저장됨. 체크리스트 갱신 확인: '+e.message;fs.writeFileSync(path.join(runtime,'cut-history',id+'.json'),JSON.stringify(record,null,2));}
   try{require('./personal-patch.cjs').create(game,catalogRoot).record(record,'cut');}catch(e){record.patchWarning='패치 자동 기록 실패: '+e.message;fs.writeFileSync(path.join(runtime,'cut-history',id+'.json'),JSON.stringify(record,null,2));}
   return record;
  }finally{locked=false;}
 }
 function family(input){const plan=info(input,true);return{requested:input,base:plan.base,next:plan.next,originalPending:plan.originalPending,items:plan.cuts.map((rel,i)=>{const original=plan.originalCut?.alias===rel,full=original?originalFile(plan.originalCut):path.join(pic,rel),data=fs.readFileSync(full);return{path:'content/pic/'+rel,file:path.basename(rel),folder:rel.split('/')[0],base:plan.base,cutIndex:i===0?1:Number(rel.match(/ \((\d+)\)\.png$/i)?.[1]),originalCut:original,readOnly:original,size:data.length,...size(data)};})};}
 return{info,add,family,refresh,originals,reservations,resolveAlias};
}
module.exports={create};
