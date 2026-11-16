'use strict';
// JO9 MOD START CHARACTER_PORTRAIT_FRAME_20261111
const crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fields={seed_ava_clear:'',seed_ava_gray:'_gray',seed_ava:'_sepia'};
const normal=p=>String(p||'').replaceAll('\\','/').replace(/^content\/pic\//i,'').toLowerCase();
function create(characterImages,localPic,options={}){
 const processor=options.processor||require('./portrait-frame.cjs');
 function preview(input){
  if(!input||!Object.hasOwn(fields,input.field))throw Error('자동 테두리는 컬러·흑백·세피아 초상에서만 사용할 수 있습니다.');
  if(!((Number.isSafeInteger(input.id)&&input.id>=0)||(typeof input.id==='string'&&/^json:[^\\/<>:"|?*\x00-\x1f]+\.json$/i.test(input.id))))throw Error('캐릭터 번호 또는 JSON 파일을 확인하세요.'); // JO9 MOD JSON_CHARACTER_DISCOVERY_20261111
  const characters=characterImages.read().characters,c=characters.find(c=>c.id===input.id);
  if(!c)throw Error('캐릭터 JSON을 찾지 못했습니다.');
  if(c.jsonSha256!==input.expectedHash)throw Error('캐릭터 JSON이 변경됐습니다. 목록을 새로고침하세요.');
  const selected=c.refs[input.field];if(!selected)throw Error('연결된 초상 PNG가 없습니다. 먼저 파일 선택·연결을 사용하세요.');
  const image=characterImages.resolve(selected);
  const referenceFrames=Object.entries(fields).map(([field,suffix])=>({name:field,bytes:characterImages.resolve('girls/face/0001_black_long_loli'+suffix+'.png').bytes}));
  const frame=referenceFrames.find(f=>f.name===input.field);
  const result=processor.composePortraitFrame({pngBytes:image.bytes,frameBytes:frame.bytes,referenceFrames,borderWidth:5});
  const sharedWith=characters.filter(other=>other.id!==input.id&&Object.values(other.refs||{}).some(p=>normal(p)===normal(image.path))).map(other=>other.id).sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
  return{id:input.id,field:input.field,expectedHash:c.jsonSha256,path:image.path,before:sha(image.bytes),after:sha(result.pngBytes),frameHash:sha(frame.bytes),frameState:result.status,reason:result.reason,changed:result.changed,width:result.width,height:result.height,borderWidth:5,centerPixelsPreserved:result.centerPixelsPreserved,sharedWith,data:result.pngBytes.toString('base64'),originalData:image.bytes.toString('base64')};
 }
 function apply(input){
  const current=preview(input);
  if(current.path!==input.path)throw Error('초상 연결 경로가 변경됐습니다. 다시 미리보기하세요.');
  if(current.before!==input.before)throw Error('초상 이미지가 변경됐습니다. 다시 미리보기하세요.');
  if(current.frameHash!==input.frameHash)throw Error('참조 테두리가 변경됐습니다. 다시 미리보기하세요.');
  if(current.after!==input.after)throw Error('미리보기 결과가 바뀌었습니다. 다시 확인하세요.');
  if(!current.changed)return{status:'unchanged',path:current.path,reason:'기존 테두리가 있어 현재 PNG를 유지했습니다.'};
  if(current.frameState==='uncertain'&&input.confirmed!==true)throw Error('기존 테두리 여부가 불확실합니다. 미리보기 확인 후 적용하세요.');
  const record=localPic.apply([{path:current.path,before:current.before,data:current.data,width:current.width,height:current.height,cap:60*1024*1024}],'portrait-frame');
  return{...record,path:current.path,sharedWith:current.sharedWith,centerPixelsPreserved:current.centerPixelsPreserved};
 }
 return{preview,apply};
}
module.exports={create};
// JO9 MOD END CHARACTER_PORTRAIT_FRAME_20261111
