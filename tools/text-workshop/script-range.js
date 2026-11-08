/* JO9 MOD START SCRIPT_RANGE_UI_20261108 */
(function(){
 'use strict';
 if(typeof api!=='function'||!document.getElementById('navigation'))return;
 const $=id=>document.getElementById(id),node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const preview=text=>String(text||'').replace(/<<([\s\S]*?)>>/g,'〈$1〉').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
 const box=$('scriptRangeBox');
 let startPoint=null,endPoint=null,choices={},current=null,stageEntries=[],busy=false,pending=false;
 try{const saved=JSON.parse(sessionStorage.getItem('jo9-script-range')||'null');if(saved){startPoint=saved.start||null;endPoint=saved.end||null;choices=saved.choices||{};}}catch{}
 const persist=()=>{try{sessionStorage.setItem('jo9-script-range',JSON.stringify({start:startPoint,end:endPoint,choices}));}catch{}};
 function buttons(){const selected=!!current?.selection;$('rangeMarkStart').disabled=busy||!selected;$('rangeMarkEnd').disabled=busy||!selected;$('rangeStage').disabled=busy||!stageEntries.length;$('rangeSave').disabled=busy||pending||!startPoint||!endPoint;$('rangeReset').disabled=busy;}
 const summary=p=>p?preview(p.selection.text).slice(0,260):'미지정';
 function labels(){$('rangeStartLabel').textContent=summary(startPoint);$('rangeEndLabel').textContent=summary(endPoint);buttons();}
 function point(c,entry=c.selection){
  const usage=c.flow?.usage;
  return {selection:entry,location:usage?.location||c.location,sceneId:usage?.sceneId||c.scene?.id,edition:/woman/i.test(entry.location)?'woman':'man'};
 }
 function select(c){
  current=c;pending=false;$('rangePrompt').replaceChildren();
  $('rangeCurrent').textContent=preview(c.selection?.text)||'아래에서 대사를 검색하고 결과를 선택하세요.';
  stageEntries=[];$('rangeStage').replaceChildren();
  if(c.flow?.stages)for(const st of c.flow.stages)for(const v of st.variants||[])stageEntries.push({entry:v.entry,label:String(st.number)+'단계 · '+preview(v.entry.text).slice(0,110)});
  else for(const [i,e]of (c.texts||[]).entries())stageEntries.push({entry:e,label:String(i+1)+' · '+preview(e.text).slice(0,110)});
  for(const [i,s]of stageEntries.entries()){$('rangeStage').add(new Option(s.label,String(i)));if(s.entry.fieldIndex===c.selection?.fieldIndex&&s.entry.start===c.selection?.start)$('rangeStage').value=String(i);}
  if((startPoint&&startPoint.selection.hash!==c.hash)||(endPoint&&endPoint.selection.hash!==c.hash)){
   startPoint=endPoint=null;choices={};persist();$('rangeStatus').textContent='게임 파일이 바뀌어 이전 지정을 해제했습니다. 시작과 마무리를 다시 지정하세요.';
  }
  labels();if(window.JO9WorkshopUI.current()==='script')box.scrollIntoView({block:'start'});
 }
 $('rangeStage').onchange=async()=>{const e=stageEntries[Number($('rangeStage').value)]?.entry;if(!e||typeof selectEntry!=='function'||busy)return;busy=true;buttons();try{await selectEntry(e,undefined,false);}catch(err){$('rangeStatus').textContent=err.message;}finally{busy=false;buttons();}};
 function accept(role,p){
  pending=false;
  if(role==='start')startPoint=p;else endPoint=p;
  choices={};persist();$('rangePrompt').replaceChildren();$('rangeText').value='';labels();
  $('rangeStatus').textContent=startPoint&&endPoint?'각본 파일 저장을 누르세요. 갈림길이 있으면 선택 화면이 나옵니다.':'반대쪽 대사도 지정하세요.';
 }
 async function mark(role){
  if(!current?.selection||busy)return;busy=true;buttons();$('rangePrompt').replaceChildren();
  try{
   const r=await api('/api/script/boundary',{hash:current.hash,role,point:point(current)});
   if(!r.needsConfirmation){accept(role,r.selected);return;}
   pending=true;const host=$('rangePrompt');
   host.append(node('strong',role==='start'?'이 앞에 시작지점 대사가 있습니다.':'예상되는 끝지점이 있습니다. 선택한 대사를 그대로 마무리로 지정하시겠습니까?'));
   host.append(node('p',(role==='start'?'예상 시작: ':'예상 마무리: ')+preview(r.proposed.selection.text).slice(0,450)));
   const proposed=node('button',role==='start'?'첫 대사를 시작으로 지정':'예상 끝 대사로 변경'),keep=node('button','지금 선택한 대사 그대로 지정'),cancel=node('button','취소');
   for(const b of [proposed,keep,cancel])b.type='button';
   proposed.onclick=()=>accept(role,r.proposed);keep.onclick=()=>accept(role,r.selected);cancel.onclick=()=>{pending=false;host.replaceChildren();buttons();};host.append(proposed,keep,cancel);
   $('rangeStatus').textContent='선택 위치 '+r.position+' / '+r.total+'단계 · 위 안내에서 선택하세요.';
  }catch(e){$('rangeStatus').textContent=e.message;}
  finally{busy=false;buttons();}
 }
 $('rangeMarkStart').onclick=()=>mark('start');$('rangeMarkEnd').onclick=()=>mark('end');
 function download(r){
  const safe=s=>String(s).replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,50);
  const blob=new Blob(['\uFEFF'+r.text.replace(/\r?\n/g,'\r\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=node('a');
  link.href=url;link.download='JO9_각본_'+safe(startPoint.location)+'_'+startPoint.selection.line+'-'+endPoint.selection.line+'.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 async function make(){
  if(busy||pending||!startPoint||!endPoint)return;busy=true;buttons();$('rangePrompt').replaceChildren();$('rangeStatus').textContent='지정한 구간을 확인하고 있습니다…';
  try{
   const r=await api('/api/script/range',{hash:startPoint.selection.hash,start:startPoint,end:endPoint,choices});
   if(r.status==='choice'){
    const host=$('rangePrompt');host.append(node('strong',r.choice.title));
    for(const o of r.choice.options){const b=node('button',o.label+(o.preview?'\n'+o.preview:''));b.type='button';b.onclick=()=>{choices[r.choice.id]=o.id;persist();make();};host.append(b);}
    $('rangeStatus').textContent='갈림길에서 포함할 경로를 골라 주세요. 마무리 대사까지 이어서 확인합니다.';return;
   }
   $('rangeText').value=r.text;download(r);$('rangeStatus').textContent='각본 파일을 저장했습니다. 장면 '+r.stats.scenes+'개 · 대사 '+r.stats.pages+'개 · 선택한 분기 '+r.stats.choices+'개. 마무리 뒤의 대사는 제외했습니다.';
  }catch(e){$('rangeStatus').textContent=e.message;}
  finally{busy=false;buttons();}
 }
 $('rangeSave').onclick=make;
 $('rangeReset').onclick=()=>{pending=false;startPoint=endPoint=null;choices={};persist();$('rangePrompt').replaceChildren();$('rangeText').value='';$('rangeStatus').textContent='시작 대사와 마무리 대사를 지정하세요.';labels();};
 window.addEventListener('jo9:selection',event=>select(event.detail));
 labels();if(typeof context!=='undefined'&&context)select(context);
})();
/* JO9 MOD END SCRIPT_RANGE_UI_20261108 */
