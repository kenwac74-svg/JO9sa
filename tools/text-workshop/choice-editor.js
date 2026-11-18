/* JO9 MOD START CHOICE_EDITOR_20261116 */
(()=>{'use strict';
 const el=id=>document.getElementById(id),fields=['choiceLabel','choiceActionCode','choiceCondition'];let drafts={},currentKey='',choicePreview=null,revision=0;
 try{drafts=JSON.parse(sessionStorage.getItem('jo9-choice-drafts')||'{}');}catch{}
 const read=()=>({label:el('choiceLabel').value,actionCode:el('choiceActionCode').value,condition:el('choiceCondition').value});
 const nonempty=value=>!!value&&[value.label,value.actionCode,value.condition].some(s=>String(s||'').trim());
 function save(){try{sessionStorage.setItem('jo9-choice-drafts',JSON.stringify(drafts));}catch{}}
 function remember(){if(!currentKey)return;const value=read();if(nonempty(value))drafts[currentKey]=value;else delete drafts[currentKey];save();}
 function fill(value){value=value||{};el('choiceLabel').value=value.label||'';el('choiceActionCode').value=value.actionCode||'';el('choiceCondition').value=value.condition||'';el('choiceAdditionBox').open=nonempty(value);}
 function sync(){const next=selection?key(selection):'';if(next===currentKey)return;remember();currentKey=next;fill(drafts[next]);revision++;choicePreview=null;}
 for(const id of fields)el(id).addEventListener('input',()=>{revision++;choicePreview=null;invalidate();remember();});
 window.addEventListener('jo9:selection',sync);
 window.addEventListener('jo9:single-preview',()=>{choicePreview=null;revision++;});
 window.addEventListener('jo9:text-changed',()=>{if(choicePreview&&previewId===choicePreview){delete drafts[currentKey];save();fill(null);}choicePreview=null;revision++;});
 el('choicePreview').onclick=async()=>{
  const button=el('choicePreview');button.disabled=true;try{
   if(!selection)throw Error('선택지를 붙일 대사를 먼저 선택하세요.');remember();invalidate();const selectedKey=key(selection),pending=api('/api/preview',{operation:'choice',selection,choice:read()}),stamp=++revision,p=await pending;
   if(stamp!==revision||!selection||key(selection)!==selectedKey)return;
   previewId=p.id;choicePreview=p.id;el('difference').hidden=false;el('diff').textContent='위치: '+p.location+' / '+p.line+'행\n\n'+p.new+(p.adjustments?.length?'\n\n확인 사항:\n'+p.adjustments.join('\n'):'');say('선택지 추가 미리보기입니다. 조건과 실행문을 확인하고 승인한 뒤 반영하세요.');
  }catch(error){say(error.message,true);}finally{button.disabled=false;}
 };
 window.JO9ChoiceEditor={dirty:()=>nonempty(read())||!!window.JO9ChoiceFormat?.dirty()||!!window.JO9InlinePage?.dirty(),remember};sync();
})();
/* JO9 MOD END CHOICE_EDITOR_20261116 */
