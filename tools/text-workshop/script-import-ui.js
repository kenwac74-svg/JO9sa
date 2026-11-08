/* JO9 MOD START SCRIPT_IMPORT_REVIEW_UI_20261108 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),ui=window.JO9ScriptReview;
 if(!$('scriptImport')||!ui||typeof api!=='function')return;
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const gate=ui.createGate();let review=null,excluded=new Set(),busy=false,savedSnapshot='',pendingLayout=null;const inlineErrors=new Set();
 const inputs=['scriptAdapted','scriptImportId','scriptAllowMissing','scriptRevalidate','scriptLayoutWidth','scriptLayoutHeight','scriptLayoutFont'];
 const values=()=>Object.fromEntries(inputs.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]));
 const snapshot=()=>JSON.stringify({...values(),exclude:[...excluded]});
 function persist(){try{sessionStorage.setItem('jo9-script-adapted',JSON.stringify(values()));}catch{}}
 try{const saved=JSON.parse(sessionStorage.getItem('jo9-script-adapted')||'null');if(saved)for(const id of inputs)if(id in saved){if($(id).type==='checkbox')$(id).checked=saved[id]===true;else $(id).value=saved[id];}}catch{}
 function clear(note,keepCards=false){gate.invalidate();review=null;pendingLayout=null;savedSnapshot='';$('scriptApproved').checked=false;$('scriptApproved').disabled=true;$('scriptApply').disabled=true;if(!keepCards){$('scriptPreview').disabled=busy;inlineErrors.clear();$('scriptChanges').replaceChildren();}$('scriptLayoutResults').replaceChildren();if(note!==undefined)$('scriptImportStatus').textContent=note;}
 function changed(){excluded=new Set();persist();clear('입력이나 검토 설정이 바뀌었습니다. 구문·화면 검토를 다시 누르세요.');}
 function syncHeader(){const m=$('scriptAdapted').value.match(/#\s*각본 ID:\s*([a-f0-9]{16})\b/i);if(m)$('scriptImportId').value=m[1];}
 for(const id of inputs)$(id).addEventListener('input',()=>{if(id==='scriptAdapted')syncHeader();changed();});
 function source(r){if(r?.exportId&&!$('scriptAdapted').value.trim()){$('scriptImportId').value=r.exportId;persist();clear('원본 각본 ID를 연결했습니다. 수정본을 아래에 넣으세요.');}}
 window.JO9ScriptImporter={source};
 async function openFile(id,original){
  const f=$(id).files?.[0];if(!f||busy)return;
  try{if(f.size>20000000)throw Error('TXT는 20MB까지 열 수 있습니다.');const text=(await f.text()).replace(/^\uFEFF/,'');
   if(original){const m=text.match(/#\s*각본 ID:\s*([a-f0-9]{16})\b/i);if(!m)throw Error('원본 TXT에 # 각본 ID가 없습니다. 편집실에서 저장한 원본을 선택하세요.');$('scriptImportId').value=m[1];}
   else {$('scriptAdapted').value=text;syncHeader();}
   changed();$('scriptImportStatus').textContent=f.name+'을 열었습니다. 구문·화면 검토를 누르세요.';
  }catch(e){clear('파일 열기 실패: '+e.message);}
 }
 $('scriptOriginalFile').onchange=()=>openFile('scriptOriginalFile',true);$('scriptAdaptedFile').onchange=()=>openFile('scriptAdaptedFile',false);
 function inlineChanged(id,editor){
  if(busy)return;let note=id+' 수정문을 전체 각본에 반영했습니다. 구문·화면 검토를 다시 누르세요.';
  try{$('scriptAdapted').value=ui.replaceBlock($('scriptAdapted').value,id,editor.value);inlineErrors.delete(id);persist();}
  catch(e){inlineErrors.add(id);note=id+' 편집 오류: '+e.message+' 이 입력칸을 바로잡아 주세요.';}
  clear(note,true);$('scriptPreview').disabled=inlineErrors.size>0;
 }
 function render(r){
  if($('workshopScriptPanel').hidden){pendingLayout=r;$('scriptApproved').disabled=true;$('scriptImportStatus').textContent='각본 탭으로 돌아오면 화면 분량 검토를 마칩니다.';return;}
  pendingLayout=null;
  const list=$('scriptChanges');list.replaceChildren();$('scriptLayoutResults').replaceChildren();
  for(const c of r.changes){
   const card=node('div',undefined,'chg'+(c.excluded?' off':'')),head=node('label'),check=node('input');check.type='checkbox';check.checked=!c.excluded;
   check.onchange=()=>{if(check.checked)excluded.delete(c.id);else excluded.add(c.id);return preview(false);};
   head.append(check,' ',node('strong',c.id),node('span',' · '+c.location+' '+c.line+'행','muted'));card.append(head);
   for(const w of c.warnings)card.append(node('div','⚠ '+w,'warn'));
   const cols=node('div',undefined,'cols'),editLabel=node('label','수정문 · 직접 편집'),edit=node('textarea',undefined,'scriptPageEditor');
   edit.value=c.newPlain;edit.rows=3;edit.spellcheck=false;edit.setAttribute('aria-label',c.id+' 수정문');edit.dataset.pageId=c.id;edit.oninput=()=>inlineChanged(c.id,edit);editLabel.append(edit);
   cols.append(node('div',c.oldPlain,'old'),editLabel);card.append(cols);list.append(card);
  }
  const sizes=ui.dimensions({width:$('scriptLayoutWidth').value,height:$('scriptLayoutHeight').value,font:$('scriptLayoutFont').value});
  const measured=ui.draw(document,$('scriptLayoutResults'),r.changes,sizes),overflow=measured.filter(c=>c.horizontal||c.vertical),warned=r.changes.filter(c=>!c.excluded&&c.warnings.length).length;
  const checks=r.checks||{};
  $('scriptImportStatus').textContent='검토 완료 · 반영 '+r.count+'개 / 변경 '+r.changes.length+'개 · 그대로 '+r.unchanged+'개'+(r.missing?' · 빠진 번호 '+r.missing+'개(원문 유지)':'')+' · 구조·치환변수·문자열 왕복 검사 통과 · 화면 '+sizes.width+'×'+sizes.height+' / '+sizes.font+'px · 넘침 '+overflow.length+'개'+(warned?' · 문구 경고 '+warned+'개':'')+(checks.normalizedMarkers?' · 구분선 이스케이프 '+checks.normalizedMarkers+'줄 복원':'')+(checks.revalidated?' · 현재 WORK 원문 재대조 완료':'');
  $('scriptApproved').disabled=!r.id;$('scriptApply').disabled=true;
  r.layout={...sizes,overflow,measured};
 }
 window.addEventListener('jo9:workshop-mode',event=>{if(event.detail==='script'&&pendingLayout&&snapshot()===savedSnapshot)render(pendingLayout);});
 async function preview(resetExclusions=true){
  if(busy)return;if(inlineErrors.size){$('scriptImportStatus').textContent='편집 오류가 있는 페이지를 먼저 바로잡아 주세요.';return;}if(resetExclusions)excluded=new Set();clear();busy=true;$('scriptPreview').disabled=true;const ticket=gate.begin(),mine=snapshot();
  try{
   const text=$('scriptAdapted').value,header=(text.match(/#\s*각본 ID:\s*([a-f0-9]{16})\b/i)||[])[1],explicit=$('scriptImportId').value.trim();
   if(header&&explicit&&header!==explicit)throw Error('수정본의 각본 ID와 연결한 원본 ID가 다릅니다. 해당 원본 TXT를 다시 여세요.');
   $('scriptImportStatus').textContent='원문·구문과 변경 내용을 검토하는 중…';
   const r=await api('/api/script/preview',{text,exportId:header||explicit,allowMissing:$('scriptAllowMissing').checked,revalidate:$('scriptRevalidate').checked,exclude:[...excluded]});
   if(!gate.current(ticket)||snapshot()!==mine)return;
   review=r;savedSnapshot=mine;render(r);
  }catch(e){if(gate.current(ticket))clear('검토 실패: '+e.message);}
  finally{busy=false;$('scriptPreview').disabled=false;}
 }
 $('scriptPreview').onclick=()=>preview(false);
 $('scriptApproved').onchange=()=>{$('scriptApply').disabled=!(review?.id&&$('scriptApproved').checked&&snapshot()===savedSnapshot&&!busy);};
 function lock(v){for(const id of [...inputs,'scriptOriginalFile','scriptAdaptedFile','scriptPreview'])$(id).disabled=v;for(const input of $('scriptChanges').querySelectorAll('input,textarea'))input.disabled=v;$('scriptApproved').disabled=v||!review?.id;}
 $('scriptApply').onclick=async()=>{
  if(busy||!review?.id||!$('scriptApproved').checked||snapshot()!==savedSnapshot)return;
  busy=true;lock(true);$('scriptApply').disabled=true;
  try{
   const count=review.count;await api('/api/apply',{id:review.id,approved:true});window.dispatchEvent(new Event('jo9:text-changed'));
   clear('각본 '+count+'개 대사를 WORK에 반영했습니다. 백업과 수정 기록이 남았습니다. 수정 탭의 변경 기록에서 되돌릴 수 있습니다.');persist();
   if(window.JO9BatchEditor?.afterApply)await window.JO9BatchEditor.afterApply();
   if(typeof say==='function')say('각본 '+count+'개 대사를 반영했습니다. 게임에서 해당 장면을 다시 열어 확인하세요.');
  }catch(e){clear('반영 실패: '+e.message+' 구문·화면 검토를 다시 실행하세요.');}
  finally{busy=false;lock(false);$('scriptApply').disabled=true;}
 };
})();
/* JO9 MOD END SCRIPT_IMPORT_REVIEW_UI_20261108 */
