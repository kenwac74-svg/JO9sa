export function settingsFilename(date=new Date()){
 const pad=n=>String(n).padStart(2,'0');
 return `잭오나_전체설정백업_${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.json`;
}

// Call directly from a click handler so the picker retains user activation.
export async function saveSettingsFile(text,name,picker){
 if(typeof picker!=='function')return {status:'unsupported'};
 let writable;
 try{
  const handle=await picker({suggestedName:name,id:'jo9-settings-backup',startIn:'downloads',types:[{description:'잭오나 전체 설정 백업 JSON',accept:{'application/json':['.json']}}]});
  writable=await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return {status:'saved',name:handle.name||name};
 }catch(error){
  if(writable?.abort)try{await writable.abort();}catch{}
  return {status:error?.name==='AbortError'?'cancelled':'error',message:error?.message||'파일 저장에 실패했습니다.'};
 }
}

export function openSettingsSave({text,name,download,toast}){
 document.getElementById('settingsSaveDialog')?.remove();
 const dialog=document.createElement('dialog');dialog.id='settingsSaveDialog';
 dialog.innerHTML=`<h2>전체 설정 파일 저장</h2>
 <p>파일명: <strong id="settingsSaveName"></strong></p>
 <p>아래 버튼으로 폴더와 파일명을 선택하세요. 파일 쓰기가 끝나야 저장 완료로 표시합니다.</p>
 <p class="fine-print">GPT 원격 브라우저 안에서는 선택한 폴더도 원격 환경의 폴더입니다. 내 PC 폴더에 바로 저장하려면 내 PC 브라우저에서 조정기를 열어 주세요.</p>
 <p id="settingsSaveStatus" role="status" aria-live="polite"></p>
 <div class="dialog-actions"><button type="button" id="settingsChooseLocation" class="button primary">저장 위치 선택…</button><button type="button" id="settingsBrowserDownload" class="button secondary">브라우저 다운로드</button><button type="button" id="settingsCopy" class="button secondary">JSON 복사</button><button type="button" id="settingsSaveClose" class="button secondary">닫기</button></div>
 <details><summary>JSON 원문 보기 · 직접 복사</summary><textarea id="settingsSaveJson" readonly aria-label="전체 설정 백업 JSON 원문" style="width:100%;height:180px;margin-top:12px"></textarea></details>`;
 document.body.append(dialog);
 const q=id=>dialog.querySelector('#'+id),status=q('settingsSaveStatus');
 q('settingsSaveName').textContent=name;q('settingsSaveJson').value=text;
 const picker=typeof window.showSaveFilePicker==='function'?window.showSaveFilePicker.bind(window):null;
 if(!picker){q('settingsChooseLocation').disabled=true;status.textContent='이 환경은 저장 위치 선택을 지원하지 않습니다. 브라우저 다운로드 또는 JSON 복사를 이용하세요. 다운로드 요청만으로 저장 완료를 확인할 수는 없습니다.';}
 q('settingsChooseLocation').onclick=async()=>{
  const button=q('settingsChooseLocation');button.disabled=true;
  const pending=saveSettingsFile(text,name,picker);
  status.textContent='선택한 위치에 저장하는 중…';
  const result=await pending;button.disabled=!picker;
  if(result.status==='saved'){status.textContent=`파일 저장 완료: ${result.name} (선택한 폴더)`;toast(status.textContent);}
  else if(result.status==='cancelled')status.textContent='저장을 취소했습니다. 다른 위치를 선택하거나 닫을 수 있습니다.';
  else status.textContent=`저장하지 못했습니다. ${result.message||'저장 위치 선택을 지원하지 않습니다.'} 브라우저 다운로드 또는 JSON 복사를 이용하세요.`;
 };
 q('settingsBrowserDownload').onclick=()=>{download(text,name);status.textContent=`다운로드를 요청했습니다: ${name}. 브라우저 다운로드 목록에서 완료와 실제 위치를 확인하세요. GPT 사이드뷰에서는 원격 환경에 저장될 수 있습니다.`;};
 q('settingsCopy').onclick=async()=>{
  try{await navigator.clipboard.writeText(text);status.textContent='JSON을 클립보드에 복사했습니다. 텍스트 편집기에 붙여넣고 위 파일명으로 저장하세요.';}
  catch{dialog.querySelector('details').open=true;q('settingsSaveJson').focus();q('settingsSaveJson').select();status.textContent='자동 복사를 지원하지 않습니다. 선택된 원문을 Ctrl+C로 복사한 뒤 텍스트 편집기에 저장하세요.';}
 };
 q('settingsSaveClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
