/* JO9 MOD START SCRIPT_ROUTE_LOCK_20261110 */
(function(){
 'use strict';
 if(typeof api!=='function'||!document.getElementById('navigation'))return;
 const $=id=>document.getElementById(id),node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const preview=text=>String(text||'').replace(/<<([\s\S]*?)>>/g,'〈$1〉').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
 let startPoint=null,endPoint=null,choices={},pins=[],routes=[],current=null,stageEntries=[],busy=false,pending=false,stale=false,lastResult=null;
 try{const saved=JSON.parse(sessionStorage.getItem('jo9-script-range')||'null');if(saved){startPoint=saved.start||null;endPoint=saved.end||null;choices=saved.choices||{};pins=Array.isArray(saved.pins)?saved.pins:[];routes=Array.isArray(saved.routes)?saved.routes:[];stale=!!saved.stale;lastResult=saved.result||null;}}catch{}
 let needsReindex=!!startPoint;
 const entryKey=e=>[e.location.toLowerCase(),e.fieldIndex,e.start,e.end].join(':');
 const sceneKey=p=>p.location.toLowerCase()+':'+p.sceneId;
 const choiceKey=p=>sceneKey(p)+':page:'+p.at;
 const persist=()=>{try{sessionStorage.setItem('jo9-script-range',JSON.stringify({start:startPoint,end:endPoint,choices,pins,routes,stale,result:lastResult}));}catch{}};
 function clearFollowingRoutes(p){
  const at=routes.findIndex(r=>sceneKey(r.from)===sceneKey(p)),removed=at>=0?routes.splice(at):[],downstream=new Set(removed.map(r=>sceneKey(r.to)));
  delete choices[sceneKey(p)+':route'];for(const r of removed)delete choices[r.id];
  pins=pins.filter(x=>{if(!downstream.has(sceneKey(x)))return true;delete choices[choiceKey(x)];return false;});
  for(const scene of downstream)for(const id of Object.keys(choices))if(id.startsWith(scene+':'))delete choices[id];
 }
 function buttons(){
  const selected=!!current?.selection,locked=busy||needsReindex;
  $('rangeMarkStart').disabled=locked||stale||!selected||!!startPoint;
  $('rangeMarkStart').textContent=startPoint?'시작 고정됨':'이 대사를 시작으로 지정';
  $('rangeMarkEnd').disabled=locked||stale||!selected||!startPoint;
  $('rangeStage').disabled=busy||!stageEntries.length;
  $('rangeSave').disabled=locked||pending||stale||!startPoint||!endPoint;
  $('rangePreview').disabled=$('rangeSave').disabled;
  $('rangeDownload').disabled=locked||pending||stale||!lastResult;
  $('rangeReset').disabled=busy;
 }
 function output(r){
  $('rangeText').value=r?.text||'';
  $('rangeSavedPath').textContent=r?.savedPath?'저장 위치: '+r.savedPath:'아직 파일로 저장하지 않았습니다. 각본 파일 저장을 누르면 아래 안내 폴더에 TXT를 만듭니다.';
  if(r){$('rangePreviewBox').open=true;window.JO9ScriptImporter?.source(r);}
 }
 function clearOutput(){lastResult=null;output(null);}
 const summary=p=>p?(p.uiStage?p.uiStage.number+' / '+p.uiStage.total+'단계\n':'')+preview(p.selection.text).slice(0,260):'미지정';
 function labels(){
  $('rangeStartLabel').textContent=summary(startPoint);$('rangeEndLabel').textContent=summary(endPoint);
  const list=$('rangePinned');
  if(list){list.replaceChildren();if(!pins.length)list.append(node('p',startPoint?'아래 분기의 「이 대사 선택」을 누르면 이 경로에 고정됩니다. 공통 대사는 자동으로 포함합니다.':'장면에서 시작 대사를 먼저 고정하세요.'));
   for(const [i,p]of pins.entries()){const row=node('li');row.append(node('strong',(i+1)+'. '+(p.uiStage?p.uiStage.number+'단계 · ':'' )+'고정'),node('span',preview(p.selection.text)));list.append(row);}
   if(routes.length)list.append(node('li','다음 장면 이동 '+routes.length+'개도 선택한 경로에 고정했습니다.'));
  }
  buttons();window.dispatchEvent(new Event('jo9:range-changed'));
 }
 function point(c,entry=c.selection){const usage=c.flow?.usage;return {selection:entry,location:usage?.location||c.location,sceneId:usage?.sceneId||c.scene?.id,edition:/woman/i.test(entry.location)?'woman':'man'};}
 function withStage(p){const stages=current?.flow?.stages||[],stage=stages.find(s=>s.variants.some(v=>v.entry.fieldIndex===p.selection.fieldIndex&&v.entry.start===p.selection.start));return stage?{...p,uiStage:{number:stage.number,total:stages.length}}:p;}
 function markStale(){stale=true;pending=false;persist();labels();$('rangeStatus').textContent='게임 파일이 바뀌었습니다. 시작과 고정한 경로는 보존했습니다. 현재 원문과 다른 각본의 출력을 막았습니다. 새 각본 시작을 눌러 다시 선택하세요.';}
 function select(c){
  current=c;pending=false;$('rangePrompt').replaceChildren();
  $('rangeCurrent').textContent=preview(c.selection?.text)||'아래에서 대사를 검색하고 결과를 선택하세요.';
  stageEntries=[];$('rangeStage').replaceChildren();
  if(c.flow?.stages)for(const st of c.flow.stages)for(const v of st.variants||[])stageEntries.push({entry:v.entry,label:String(st.number)+'단계 · '+preview(v.entry.text).slice(0,110)});
  else for(const [i,e]of(c.texts||[]).entries())stageEntries.push({entry:e,label:String(i+1)+' · '+preview(e.text).slice(0,110)});
  for(const [i,s]of stageEntries.entries()){$('rangeStage').add(new Option(s.label,String(i)));if(s.entry.fieldIndex===c.selection?.fieldIndex&&s.entry.start===c.selection?.start)$('rangeStage').value=String(i);}
  const hash=c.hash||c.selection?.hash;
  if(hash&&((startPoint&&startPoint.selection.hash!==hash)||(endPoint&&endPoint.selection.hash!==hash))){markStale();return;}
  if(needsReindex&&!busy&&!stale){reindex().catch(()=>{});return;}
  labels();
 }
 async function reindex(){
  busy=true;buttons();
  try{
   const normalize=async p=>{if(!p)return null;const r=await api('/api/script/boundary',{hash:p.selection.hash,role:'start',point:p});return {...r.selected,...(p.uiStage?{uiStage:p.uiStage}:{})};};
   const normalized=await Promise.all([normalize(startPoint),normalize(endPoint),...pins.map(normalize)]),oldPins=pins;
   startPoint=normalized[0];endPoint=normalized[1];pins=normalized.slice(2);
   for(const p of oldPins)delete choices[choiceKey(p)];
   for(const p of pins)choices[choiceKey(p)]=entryKey(p.selection);
   needsReindex=false;persist();if(!lastResult)$('rangeStatus').textContent='이전에 고정한 시작과 경로를 복원했습니다. 이어서 선택하거나, 다른 범위를 만들려면 새 각본 시작을 누르세요.';
  }catch(e){if(/QSP가 바뀌|대사 원문이 바뀌/.test(e.message)){needsReindex=false;markStale();}else $('rangeStatus').textContent='고정한 경로는 보존했습니다. 현재 위치를 다시 확인하지 못했습니다. 새로고침해 다시 확인하세요. '+e.message;}
  finally{busy=false;labels();}
 }
 $('rangeStage').onchange=async()=>{const e=stageEntries[Number($('rangeStage').value)]?.entry;if(!e||typeof selectEntry!=='function'||busy)return;busy=true;buttons();try{await selectEntry(e,undefined,false);}catch(err){$('rangeStatus').textContent=err.message;}finally{busy=false;labels();}};
 function accept(role,p){
  pending=false;p=withStage(p);
  if(role==='start'){startPoint=p;endPoint=null;choices={};pins=[];routes=[];stale=false;needsReindex=false;}else endPoint=p;
  clearOutput();persist();$('rangePrompt').replaceChildren();labels();
  $('rangeStatus').textContent=role==='start'?'시작 대사를 고정했습니다. 아래에서 원하는 분기를 고르고, 마지막 대사를 마무리로 지정하세요.':('마무리를 고정했습니다. 선택한 분기 '+pins.length+'개를 유지했습니다. 미리보기 또는 각본 파일 저장을 누르세요.');
 }
 async function mark(role){
  if(!current?.selection||busy||needsReindex)return;
  if(stale){$('rangeStatus').textContent='게임 파일이 바뀌었습니다. 고정한 경로를 확인한 뒤 새 각본 시작을 누르세요.';return;}
  if(role==='start'&&startPoint){$('rangeStatus').textContent='시작 대사는 이미 고정되어 있습니다. 바꾸려면 새 각본 시작을 누르세요.';return;}
  if(role==='end'&&!startPoint){$('rangeStatus').textContent='시작 대사를 먼저 고정하세요.';return;}
  busy=true;buttons();$('rangePrompt').replaceChildren();
  try{
   const r=await api('/api/script/boundary',{hash:current.hash,role,point:point(current)});
   if(role==='end'&&sceneKey(startPoint)===sceneKey(r.selected)&&r.selected.at<startPoint.at)throw Error('마무리가 고정한 시작 대사보다 앞에 있습니다.');
   accept(role,r.selected);
   if(r.needsConfirmation){
    const host=$('rangePrompt');host.append(node('p',role==='start'?'이 앞에도 대사가 있습니다. 방금 선택한 대사를 시작으로 고정했습니다. 앞 대사까지 포함하려면 새 각본 시작을 누르세요.':'이 뒤에도 대사가 있습니다. 방금 선택한 대사를 마무리로 고정했습니다.'));
    if(role==='end'){host.append(node('p','예상되는 마지막 대사: '+preview(r.proposed.selection.text).slice(0,450)));const last=node('button','예상 마지막 대사까지 포함');last.type='button';last.onclick=()=>accept('end',r.proposed);host.append(last);}
   }
  }catch(e){$('rangeStatus').textContent=e.message;}
  finally{busy=false;labels();}
 }
 async function pick(entry,sceneId){
  if(busy||needsReindex)return;
  if(!startPoint)throw Error('시작 대사를 먼저 고정하세요.');
  if(stale)throw Error('게임 파일이 바뀌었습니다. 기존 고정은 보존했습니다. 새 각본 시작을 눌러 다시 선택하세요.');
  busy=true;buttons();
  try{
   await selectEntry(entry,sceneId,false);
   if(stale)throw Error('게임 파일이 바뀌어 경로를 추가하지 않았습니다. 기존 고정은 보존했습니다.');
   const r=await api('/api/script/boundary',{hash:current.hash,role:'start',point:point(current)}),p=withStage(r.selected),id=choiceKey(p);
   if(p.edition!==startPoint.edition)throw Error('같은 주인공 판본의 대사를 선택하세요.');
   if(sceneKey(p)===sceneKey(startPoint)&&p.at<startPoint.at)throw Error('시작 대사보다 앞의 대사는 각본에 넣지 않았습니다. 시작 고정은 유지됩니다.');
   if(sceneKey(p)===sceneKey(startPoint)&&p.at===startPoint.at){if(entryKey(p.selection)!==entryKey(startPoint.selection))throw Error('시작 대사와 같은 단계의 다른 변형입니다. 시작을 바꾸려면 새 각본 시작을 누르세요.');return;}
   let at=pins.findIndex(x=>choiceKey(x)===id),changedTail=false;
   if(at>=0&&entryKey(pins[at].selection)!==entryKey(p.selection)){clearFollowingRoutes(p);const removed=pins.splice(at);for(const x of removed)delete choices[choiceKey(x)];endPoint=null;changedTail=true;at=-1;}
   if(at<0&&routes.some(r=>sceneKey(r.from)===sceneKey(p))){clearFollowingRoutes(p);endPoint=null;changedTail=true;}
   if(at<0){const earlier=pins.findIndex(x=>sceneKey(x)===sceneKey(p)&&x.at>p.at);if(earlier>=0){clearFollowingRoutes(p);for(const x of pins.splice(earlier))delete choices[choiceKey(x)];endPoint=null;changedTail=true;}pins.push(p);}
   choices[id]=entryKey(p.selection);
   if(endPoint&&sceneKey(endPoint)===sceneKey(p)&&p.at>endPoint.at)endPoint=null;
   clearOutput();persist();labels();
   $('rangeStatus').textContent='선택한 대사를 각본 경로에 고정했습니다. '+(changedTail?'뒤쪽 경로는 다시 선택하세요. ':'')+'아래의 다음 대사를 이어서 고르세요.';
  }finally{busy=false;labels();}
 }
 async function follow(fromContext,toContext){
  if(!startPoint||busy||needsReindex||stale||!fromContext?.selection||!toContext?.selection)return;
  const fromPoint=point(fromContext),nextPoint=point(toContext);
  if(sceneKey(fromPoint)===sceneKey(nextPoint))return;
  busy=true;buttons();
  try{
   const r=await api('/api/script/boundary',{hash:toContext.hash,role:'start',point:nextPoint,fromPoint});
   if(!r.routeChoice){$('rangeStatus').textContent='시작과 고정한 대사는 유지했습니다. 목적지가 여러 선택지와 연결되어 있으면 출력할 때 경로를 한 번 더 확인합니다.';return;}
   const route=r.routeChoice;
   if(choices[route.id]!==undefined&&choices[route.id]!==route.optionId){
    clearFollowingRoutes(fromPoint);endPoint=null;
   }
   if(endPoint&&sceneKey(endPoint)===sceneKey(fromPoint))endPoint=null;
   choices[route.id]=route.optionId;if(!routes.some(r=>r.id===route.id))routes.push({...route,from:fromPoint,to:nextPoint});clearOutput();persist();labels();
   $('rangeStatus').textContent='선택한 다음 장면을 각본 경로에 고정했습니다. 시작과 앞서 고른 대사는 유지됩니다.';
  }finally{busy=false;labels();}
 }
 $('rangeMarkStart').onclick=()=>mark('start');$('rangeMarkEnd').onclick=()=>mark('end');
 function download(r){const safe=s=>String(s).replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,50),blob=new Blob(['\uFEFF'+r.text.replace(/\r?\n/g,'\r\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download='JO9_각본_'+safe(startPoint.location)+'_'+startPoint.selection.line+'-'+endPoint.selection.line+'.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
 async function make(saveFile){
  if(busy||needsReindex||pending||stale||!startPoint||!endPoint)return;busy=true;buttons();$('rangePrompt').replaceChildren();$('rangeStatus').textContent='고정한 경로로 각본을 만들고 있습니다…';
  try{
   const r=await api('/api/script/range',{hash:startPoint.selection.hash,start:startPoint,end:endPoint,choices,save:saveFile===true});
   if(r.status==='choice'){
    const host=$('rangePrompt');host.append(node('strong','아직 고르지 않은 분기가 있습니다. '+r.choice.title));
    for(const o of r.choice.options){const b=node('button',o.label+(o.preview?'\n'+o.preview:''));b.type='button';b.onclick=()=>{choices[r.choice.id]=o.id;persist();labels();return make(saveFile);};host.append(b);}
    $('rangeStatus').textContent='이미 고정한 시작과 분기는 유지했습니다. 건너뛴 분기만 선택하면 이어서 각본을 만듭니다.';return;
   }
   if(r.status!=='ready'||!r.text)throw Error('각본 내용을 만들지 못했습니다. 시작과 마무리를 확인하세요.');
   lastResult=r;output(r);persist();
   $('rangeStatus').textContent=(r.savedPath?'각본 파일을 저장했습니다.':'각본 미리보기를 만들었습니다. 아직 파일 저장 전입니다.')+' 장면 '+r.stats.scenes+'개 · 대사 '+r.stats.pages+'개 · 선택한 분기 '+r.stats.choices+'개. 마무리 뒤의 대사는 제외했습니다.';
   $('rangePreviewBox').scrollIntoView({block:'nearest'});
  }catch(e){if(/QSP가 바뀌|대사 원문이 바뀌/.test(e.message))markStale();$('rangeStatus').textContent=e.message+' 저장되지 않았으며 기존 고정은 보존했습니다.';}
  finally{busy=false;labels();}
 }
 $('rangePreview').onclick=()=>make(false);$('rangeSave').onclick=()=>make(true);
 $('rangeDownload').onclick=()=>{if(!lastResult||busy||pending||stale)return;download(lastResult);$('rangeStatus').textContent='브라우저에 TXT 다운로드를 요청했습니다. 브라우저의 다운로드 폴더 또는 저장 대화상자를 확인하세요.';};
 $('rangeReset').onclick=()=>{pending=false;stale=false;needsReindex=false;startPoint=endPoint=null;choices={};pins=[];routes=[];clearOutput();persist();$('rangePrompt').replaceChildren();$('rangeStatus').textContent='새 각본을 시작합니다. 장면에서 시작 대사를 고정하세요.';labels();};
 $('rangeBackToFlow').onclick=()=>($('gameLines').querySelector('.line.selected')||$('navigation')).scrollIntoView({block:'center'});
 window.JO9ScriptRange={mark,pick,follow,state:()=>({start:startPoint,end:endPoint,choices:{...choices},pins:[...pins],routes:[...routes],stale,busy:busy||needsReindex})};
 window.addEventListener('jo9:selection',event=>select(event.detail));
 output(lastResult);labels();if(lastResult)$('rangeStatus').textContent=lastResult.savedPath?'저장한 각본을 미리보기에 복원했습니다. 저장 위치를 아래에서 확인하세요.':'직전 각본 미리보기를 복원했습니다. 아직 파일 저장 전입니다.';if(typeof context!=='undefined'&&context)select(context);
})();
/* JO9 MOD END SCRIPT_ROUTE_LOCK_20261110 */
