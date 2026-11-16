// JO9 MOD START WORKSHOP_BATCH_FRAME_20261111
function batchFrameRows(){return S.rows.filter(r=>r.selected!==false&&r.meta&&C.frameSpec(r.meta)&&!r.cutPlan&&!r.editCut)}
function canBatchFrames(){return batchFrameRows().length>0||(!S.inputs.length&&!!S.root&&selectedResources().some(r=>C.frameSpec(r)))}
async function stageFrameOnlyTargets(){
 if(S.inputs.length)return;
 if(!S.root)throw Error('PIC 폴더를 먼저 등록하세요.');
 for(const target of selectedResources()){
  if(!C.frameSpec(target))continue;
  if(S.inputs.length>=100)throw Error('한 번에 100개까지 테두리를 만들 수 있습니다.');
  const relative=relPicPath(target.path),meta=await C.describe(S.root,relative);
  if(!C.frameSpec(meta))continue;
  const file=new File([meta.bytes],relative.split('/').pop(),{type:'image/png'});
  S.inputs.push({...inputInfo(file,relative),id:crypto.randomUUID(),file,relative,url:URL.createObjectURL(file),signature:await C.hash(meta.bytes),mappedPath:target.path,frameOnly:true,faceCrop:{x:0,y:0,w:1,h:1}});
 }
 await rebuild();
 for(const row of S.rows){
  const input=S.inputs.find(s=>s.id===row.inputId&&s.frameOnly);if(!input)continue;
  if(!row.meta||row.meta.before!==input.signature){row.meta=null;row.error='원본 이미지가 변경됐습니다. 입력을 빼고 해당 이미지를 다시 선택하세요.';continue;}
  row.options={...row.options,frame:false,frameOnly:true};
 }
}
async function makeSelectedFrames(){
 if(S.busy)return;
 busy(true);let done=0,failed=0,skipped=0;
 try{
  const sourceSkipped=S.inputs.length?0:selectedResources().filter(r=>!C.frameSpec(r)).length;
  await stageFrameOnlyTargets();
  const rows=batchFrameRows(),duplicate=conflicts();
  skipped=sourceSkipped+S.rows.filter(r=>r.selected!==false).length-rows.length;
  if(!rows.length)throw Error(S.rows.find(r=>r.selected!==false&&r.error)?.error||'59×66 썸네일 또는 150×150·151×150 초상을 선택하세요. 새 이미지를 넣었다면 교체 대상을 먼저 지정하세요.');
  for(const row of rows){
   try{
    if(duplicate.has(C.norm(row.target||'')))throw Error('같은 교체 대상이 중복 선택됐습니다.');
    row.options={...row.options,makeFrame:true};
    await processRow(row);done++;
   }catch(error){row.error=error.message;failed++;}
  }
  render();renderScreenResources();
  msg(`테두리 ${done}개 생성 · 제외 ${skipped}개 · 실패 ${failed}개. 미리보기를 확인한 뒤 「백업 후 교체」로 저장하세요.`,failed>0);
 }catch(error){msg(error.message,true)}finally{busy(false)}
}
// JO9 MOD END WORKSHOP_BATCH_FRAME_20261111
