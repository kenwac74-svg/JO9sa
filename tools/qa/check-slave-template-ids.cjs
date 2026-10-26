'use strict';
// JO9 MOD START SEED_NAMESPACE_GUARD_20261020
// Read-only check of the engine's numeric JSON filename namespace.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');

function inspectDirectory(directory){
 const root=fs.realpathSync(directory),groups=new Map(),templates=[],issues=[];
 function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const file=path.join(dir,entry.name),relative=path.relative(root,file);
   if(entry.isSymbolicLink()) {issues.push({code:'linked-template-path',file:relative,message:'연결 경로 안의 인물 JSON은 검사할 수 없습니다.'});continue;}
   if(entry.isDirectory()){walk(file);continue;}
   if(!entry.isFile()||!entry.name.toLowerCase().endsWith('.json'))continue;
   const match=/^(\d+)(?:_.+)?\.json$/i.exec(entry.name),id=match?Number(match[1]):NaN;
   const validId=Number.isSafeInteger(id)&&id>=0&&id<=2147483647;
   if(!validId)issues.push({code:'invalid-filename-id',file:relative,message:'0 이상의 정수 인물 번호로 시작하는 JSON 파일명이 필요합니다.'});
   const raw=fs.readFileSync(file);let data;
   try{data=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));}
   catch(error){issues.push({code:'invalid-json',file:relative,message:error.message});}
   if(data!==undefined&&(!data||typeof data!=='object'||Array.isArray(data)))issues.push({code:'invalid-object',file:relative,message:'인물 JSON의 최상위 값은 객체여야 합니다.'});
   const embedded=data?.indpack_info?.girl_id;
   if(validId&&embedded!==undefined&&Number(embedded)!==id)issues.push({code:'embedded-id-mismatch',file:relative,id,embedded,message:'indpack_info.girl_id가 파일명 번호와 다릅니다.'});
   const record={id:validId?id:null,file:relative,name:data?.seed_name||'',sha256:crypto.createHash('sha256').update(raw).digest('hex')};
   templates.push(record);
   if(validId){if(!groups.has(id))groups.set(id,[]);groups.get(id).push(relative);}
  }
 }
 walk(root);
 const collisions=[...groups].filter(([,files])=>files.length>1).map(([id,files])=>({id,files:files.sort()})).sort((a,b)=>a.id-b.id);
 for(const collision of collisions)issues.push({code:'duplicate-id',...collision,message:'같은 인물 번호에 JSON이 둘 이상 등록됩니다.'});
 return {schema:1,directory:root,valid:issues.length===0,files:templates.length,numericIds:groups.size,collisions,issues,templates};
}
function assertRegistry(directory){
 const report=inspectDirectory(directory);
 if(!report.valid){const error=Error('인물 JSON 등록 검사 실패: '+report.issues.map(i=>i.code==='duplicate-id'?i.id+' ['+i.files.join(', ')+']':i.file+' '+i.message).join('; '));error.issues=report.issues;throw error;}
 return report;
}
if(require.main===module){
 try{
  const args=process.argv.slice(2);if(args.length!==1)throw Error('사용법: node check-slave-template-ids.cjs <game/json/slaves>');
  const report=inspectDirectory(args[0]);console.log(JSON.stringify({valid:report.valid,files:report.files,numericIds:report.numericIds,collisions:report.collisions,issues:report.issues},null,2));process.exitCode=report.valid?0:1;
 }catch(error){console.error(error.message);process.exitCode=2;}
}
module.exports={inspectDirectory,assertRegistry};
// JO9 MOD END SEED_NAMESPACE_GUARD_20261020
