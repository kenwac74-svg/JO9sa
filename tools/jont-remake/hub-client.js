/* Local project setup only; analysis/generation remain in the original tool. */
(async()=>{
 const $=id=>document.getElementById(id),form=$('remakeSetup'),status=$('remakeMessage');
 const request=async(url,body)=>{const r=await fetch(url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'요청을 처리하지 못했습니다.');return j;};
 try{
  const c=await request('/api/hub/settings');$('remakeFolder').value=c.sourceFolder;$('remakeSource').value=c.sourceId;$('remakeTarget').value=c.targetId;$('remakeMention').value=c.mageMention;$('remakeModel').value=c.model;
  $('remakeSettings').open=!c.configured;$('remakeProjectLabel').textContent=c.configured?`${c.sourceId} → ${c.targetId}`:'원본 폴더를 선택하세요';
 }catch(e){status.textContent=e.message;$('remakeSettings').open=true;}
 $('remakePick').onclick=async()=>{const b=$('remakePick');b.disabled=true;status.textContent='폴더 선택창을 여는 중입니다.';try{const result=await request('/api/hub/folder',{initial:$('remakeFolder').value});if(!result.cancelled&&result.path){$('remakeFolder').value=result.path;if(!$('remakeSource').value)$('remakeSource').value=result.path.replace(/[\\/]+$/,'').split(/[\\/]/).pop();}status.textContent='';}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};
 form.onsubmit=async event=>{event.preventDefault();const b=$('remakeApply');b.disabled=true;status.textContent='설정을 적용하고 있습니다.';try{await request('/api/hub/settings',{sourceFolder:$('remakeFolder').value,sourceId:$('remakeSource').value,targetId:$('remakeTarget').value,mageMention:$('remakeMention').value,model:$('remakeModel').value});location.reload();}catch(e){status.textContent=e.message;b.disabled=false;}};
 $('remakeReload').onclick=async()=>{const b=$('remakeReload');b.disabled=true;status.textContent='작업표를 다시 읽고 있습니다.';try{await request('/api/hub/reload',{});location.reload();}catch(e){status.textContent=e.message;b.disabled=false;}};
})();
