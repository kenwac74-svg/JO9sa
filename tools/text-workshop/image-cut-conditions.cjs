'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('./core.cjs'),rules=require('./image-cut-condition-rules.cjs');
const imageExt=/\.(?:png|jpe?g|gif|webp|bmp)$/i;
const fieldKeys=(obj,allowed)=>{if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).some(k=>!allowed.includes(k)))throw Error('등장조건 요청 항목을 확인하세요.');};
function create(game,commit){
 const target=path.join(game,'jack.qsp'),pic=path.join(game,'content/pic');
 function family(input){
  if(typeof input!=='string')throw Error('이미지 경로를 선택하세요.');
  let rel=input.replaceAll('\\','/').replace(/^content\/pic\//i,'');
  if(!/^(bg|characters|scene)\//i.test(rel)||!imageExt.test(rel)||rel.split('/').some(p=>!p||p==='.'||p==='..'||/[\x00-\x1f:*?"<>|]/.test(p)))throw Error('bg·characters·scene 안의 이미지 파일을 선택하세요.');
  rel=rel.replace(/ \(([2-9]|[1-9][0-9]+)\)(\.[^.]+)$/i,'$2');
  let current=pic;const actual=[];
  for(const part of rel.split('/')){
   const names=fs.readdirSync(current),same=names.filter(n=>n.toLowerCase()===part.toLowerCase());
   if(same.length!==1)throw Error('기본 이미지 파일을 찾지 못했습니다. 이미지 목록을 갱신하세요.');
   current=path.join(current,same[0]);actual.push(same[0]);
   if(fs.lstatSync(current).isSymbolicLink())throw Error('연결된 외부 이미지 경로는 사용할 수 없습니다.');
  }
  const root=fs.realpathSync(pic),real=fs.realpathSync(current);
  if(!fs.statSync(current).isFile()||!real.toLowerCase().startsWith((root+path.sep).toLowerCase()))throw Error('이미지 폴더 밖의 경로입니다.');
  const base='content/pic/'+actual.join('/').toLowerCase(),ext=path.extname(current),stem=path.basename(current,ext),folder=path.dirname(current);
  const quote=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp('^'+quote(stem)+' \\(([2-9]|[1-9][0-9]+)\\)'+quote(ext)+'$','i');
  const items=[{path:base,file:path.basename(current),cutIndex:1}];
  for(const file of fs.readdirSync(folder)){
   const m=file.match(re);if(!m)continue;const n=Number(m[1]),full=path.join(folder,file);
   if(!Number.isSafeInteger(n)||n>2147473647||fs.lstatSync(full).isSymbolicLink()||!fs.statSync(full).isFile())continue;
   const fileRel=path.relative(pic,full).replaceAll('\\','/');items.push({path:'content/pic/'+fileRel.toLowerCase(),file,cutIndex:n});
  }
  items.sort((a,b)=>a.cutIndex-b.cutIndex);
  return{base,items};
 }
 function current(){
  const raw=fs.readFileSync(target),doc=core.parse(raw);
  if(!core.serialize(doc).equals(raw))throw Error('QSP 왕복 검사에 실패했습니다. 저장하지 않았습니다.');
  const locations=doc.locations.filter(l=>l.name==='interior_change');if(locations.length!==1)throw Error('이미지 전환 로케이션을 정확히 찾지 못했습니다.');
  const loc=locations[0],body=core.shift(doc.lines[loc.body],5),saved=rules.readRules(body);
  return{raw,doc,loc,body,saved,qspHash:core.hash(raw)};
 }
 function info(input){
  fieldKeys(input,['path']);const f=family(input.path),state=current();
  return{base:f.base,qspHash:state.qspHash,family:f,rules:state.saved.filter(r=>r.base===f.base),options:rules.OPTIONS};
 }
 function save(input){
  fieldKeys(input,['base','before','rules']);if(typeof input.before!=='string'||!/^[0-9a-f]{64}$/i.test(input.before))throw Error('저장 전 QSP 상태를 다시 읽어 주세요.');
  const f=family(input.base),state=current();if(input.before.toLowerCase()!==state.qspHash)throw Error('다른 편집으로 QSP가 바뀌었습니다. 입력한 조건을 확인한 뒤 다시 열어 저장하세요.');
  const nextRules=rules.normalizeRules(input.rules),members=new Set(f.items.filter(x=>x.cutIndex>1).map(x=>x.path));
  if(nextRules.some(r=>r.base!==f.base||!members.has(r.path)))throw Error('선택한 이미지의 실제 B·C컷에만 조건을 저장할 수 있습니다.');
  const all=rules.normalizeRules([...state.saved.filter(r=>r.base!==f.base),...nextRules]);
  const next=rules.buildBody(state.body,all);
  if(next===state.body)return{unchanged:true,qspHash:state.qspHash,base:f.base,rules:nextRules,totalRules:all.length};
  state.doc.lines[state.loc.body]=core.shift(next,-5);const after=core.serialize(state.doc);
  if(!core.serialize(core.parse(after)).equals(after))throw Error('QSP 출력 검사에 실패했습니다. 저장하지 않았습니다.');
  if(core.hash(fs.readFileSync(target))!==state.qspHash)throw Error('저장 직전에 QSP가 바뀌었습니다. 원래 파일은 유지했습니다.');
  const stamp=new Date().toISOString(),id=stamp.slice(0,10)+'_image_cut_conditions_'+stamp.slice(11,19).replaceAll(':','')+'_'+crypto.randomBytes(3).toString('hex');
  const mod={id,description:'이미지별 B·C컷 등장조건 설정',before_sha256:state.qspHash,after_sha256:core.hash(after),edits:[{location:'interior_change',field:'body',old:state.body,new:next,count:1}]};
  if(typeof commit!=='function')throw Error('조건 저장 기능이 연결되지 않았습니다.');
  const record=commit(state.raw,after,{kind:'image-cut-conditions',location:'interior_change',field:'body',base:f.base,count:nextRules.length,mod});
  if(core.hash(fs.readFileSync(target))!==mod.after_sha256)throw Error('저장 후 QSP가 달라졌습니다. 편집 기록을 확인하세요.');
  return{qspHash:mod.after_sha256,base:f.base,rules:nextRules,totalRules:all.length,recordId:record?.id,requiresGameRestart:true};
 }
 return{info,save,family};
}
module.exports={create};
