/* JO9 MOD START TEXT_BATCH_REPLACE_UI | 2026-10-18 checkbox word replacement */
(function(root){
 'use strict';
 function createSelection(){
  let all=false;const chosen=new Set(),excluded=new Set();
  return {
   setAll(value){all=!!value;chosen.clear();excluded.clear();},
   toggle(id,checked){if(all){if(checked)excluded.delete(id);else excluded.add(id);}else{if(checked)chosen.add(id);else chosen.delete(id);}},
   has:id=>all?!excluded.has(id):chosen.has(id),
   count:total=>Math.max(0,Math.min(total,all?total-excluded.size:chosen.size)),
   payload:()=>all?{all:true,except:[...excluded]}:{all:false,ids:[...chosen]}
  };
 }
 const replaceLiteral=(text,query,replacement)=>query?text.split(query).join(replacement):text;
 if(typeof module==='object'&&module.exports){module.exports={createSelection,replaceLiteral};return;}
 function init(){
  const bridge=root.JO9BatchEditor;if(!bridge)return;
  const $=id=>document.getElementById(id),choice=createSelection(),PAGE=50;
  let scope=null,results=[],total=0,occurrences=0,offset=0,busy=false,searchVersion=0,previewVersion=0,previewId=null,review=null;
  const selected=()=>choice.count(total);
  function resetPreview(){previewVersion++;previewId=null;review=null;$('bulkReview').hidden=true;$('bulkApproved').checked=false;$('bulkReviewResults').replaceChildren();buttons();}
  function resetSearch(){searchVersion++;scope=null;results=[];total=0;occurrences=0;offset=0;choice.setAll(false);resetPreview();render();}
  function buttons(){
   const count=selected();$('bulkSearch').disabled=busy;$('bulkSelectAll').disabled=busy||!scope||!total;$('bulkClear').disabled=busy||!count;
   $('bulkSelectAll').checked=!!total&&count===total;$('bulkSelectAll').indeterminate=count>0&&count<total;
   $('bulkPrev').disabled=busy||offset===0;$('bulkNext').disabled=busy||offset+PAGE>=total;
   $('bulkPreview').disabled=busy||!scope||!count||scope.query===$('bulkReplacement').value;
   $('bulkApproved').disabled=busy||!previewId;$('bulkApply').disabled=busy||!previewId||!$('bulkApproved').checked;
   $('bulkReviewPrev').disabled=busy||!review||review.offset===0;
   $('bulkReviewNext').disabled=busy||!review||review.offset+PAGE>=review.totalChanges;
   for(const box of $('bulkResults').querySelectorAll('input[type=checkbox]'))box.disabled=busy;
  }
  function status(){
   $('bulkCount').textContent=scope?`${total.toLocaleString()}곳에서 ${occurrences.toLocaleString()}회 발견 · 선택 ${selected().toLocaleString()}곳`:'찾을 단어를 입력하고 치환 대상 찾기를 누르세요.';
   $('bulkPage').textContent=total?`${Math.floor(offset/PAGE)+1} / ${Math.ceil(total/PAGE)}쪽`:'0 / 0쪽';buttons();
  }
  function pair(label,text){const box=document.createElement('div'),title=document.createElement('strong'),value=document.createElement('pre');title.textContent=label;value.textContent=text;box.append(title,value);return box;}
  function card(row,selectable){
   const el=document.createElement('article');el.className='bulkCard';const head=document.createElement('div');head.className='bulkRowHead';
   const where=document.createElement('span');where.textContent=`${row.location} · ${row.field==='desc'?'설명':row.line+'행'} · ${row.occurrences}회`;
   if(selectable){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.dataset.bulkId=row.id;box.checked=choice.has(row.id);box.setAttribute('aria-label',`${row.location} ${row.field==='desc'?'설명':row.line+'행'} 치환 선택`);
    box.onchange=()=>{choice.toggle(row.id,box.checked);resetPreview();status();};label.append(box,where);head.append(label);
   }else head.append(where);
   const texts=document.createElement('div');texts.className='bulkPair';const old=selectable?row.text:row.old,fresh=selectable?replaceLiteral(old,scope.query,$('bulkReplacement').value):row.new;
   texts.append(pair('치환 전',old),pair('치환 후',fresh));el.append(head,texts);return el;
  }
  function render(){const list=$('bulkResults');list.replaceChildren();for(const row of results)list.append(card(row,true));status();}
  function renderReview(p){review=p;const list=$('bulkReviewResults');list.replaceChildren();for(const row of p.changes)list.append(card(row,false));$('bulkReviewPage').textContent=p.totalChanges?`${Math.floor(p.offset/PAGE)+1} / ${Math.ceil(p.totalChanges/PAGE)}쪽`:'0 / 0쪽';$('bulkReviewSummary').textContent=`선택한 ${p.count.toLocaleString()}곳 · 단어 ${p.occurrences.toLocaleString()}회 치환. 한 번의 백업과 수정 기록으로 저장합니다.`;$('bulkReview').hidden=false;buttons();}
  async function run(fn){if(busy)return;busy=true;buttons();try{await fn();}catch(e){bridge.say(e.message,true);}finally{busy=false;buttons();}}
  async function page(at,newSearch=false){
   if(newSearch){resetSearch();scope={query:$('bulkQuery').value,location:$('bulkLocation').value.trim(),mode:$('viewMode').value==='all'?'all':'text'};if(!scope.query){scope=null;throw Error('찾을 단어를 입력하세요.');}}
   if(newSearch)bridge.say('치환 대상을 찾고 있습니다.');
   const version=searchVersion,params=new URLSearchParams({q:scope.query,location:scope.location,mode:scope.mode,offset:String(at),limit:String(PAGE)}),answer=await bridge.api('/api/batch/search?'+params);
   if(version!==searchVersion)return;
   if(scope.hash&&scope.hash!==answer.hash){resetSearch();throw Error('검색 이후 QSP가 바뀌었습니다. 치환 대상을 다시 찾아 주세요.');}
   scope.hash=answer.hash;total=answer.total;occurrences=answer.occurrences;offset=answer.offset;results=answer.results;render();
   if(newSearch)bridge.say(total?'치환할 항목을 체크하거나 검색 결과 전체 선택을 사용하세요.':'일치하는 단어가 없습니다.');
  }
  $('bulkSearch').onclick=()=>run(()=>page(0,true));
  $('bulkPrev').onclick=()=>run(()=>page(Math.max(0,offset-PAGE)));$('bulkNext').onclick=()=>run(()=>page(offset+PAGE));
  $('bulkSelectAll').onchange=()=>{choice.setAll($('bulkSelectAll').checked);resetPreview();render();};
  $('bulkClear').onclick=()=>{choice.setAll(false);resetPreview();render();};
  $('bulkQuery').addEventListener('input',resetSearch);$('bulkLocation').addEventListener('input',resetSearch);$('viewMode').addEventListener('change',resetSearch);
  $('bulkReplacement').addEventListener('input',()=>{resetPreview();render();});
  $('bulkQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('bulkSearch').click();}});
  $('batchReplaceBox').addEventListener('toggle',()=>{if($('batchReplaceBox').open&&!$('bulkQuery').value){$('bulkQuery').value=$('query').value;$('bulkLocation').value=$('location').value;}});
  $('bulkPreview').onclick=()=>run(async()=>{
   bridge.beforePreview();resetPreview();const version=previewVersion;bridge.say(`선택한 ${selected().toLocaleString()}곳의 치환 미리보기를 만들고 있습니다.`);
   const p=await bridge.api('/api/batch/preview',{...scope,selection:choice.payload(),replacement:$('bulkReplacement').value});
   if(version!==previewVersion)return;previewId=p.id;renderReview(p);bridge.say('치환 전·후를 확인하고 일괄 치환 승인에 체크하세요.');
  });
  async function reviewPage(at){const id=previewId,version=previewVersion,p=await bridge.api('/api/batch/preview?'+new URLSearchParams({id,offset:String(at),limit:String(PAGE)}));if(id===previewId&&version===previewVersion)renderReview(p);}
  $('bulkReviewPrev').onclick=()=>run(()=>reviewPage(Math.max(0,review.offset-PAGE)));$('bulkReviewNext').onclick=()=>run(()=>reviewPage(review.offset+PAGE));
  $('bulkApproved').onchange=buttons;
  $('bulkApply').onclick=()=>run(async()=>{
   if(!previewId||!$('bulkApproved').checked)throw Error('일괄 치환 미리보기와 승인이 필요합니다.');
   bridge.say('원본을 백업하고 선택한 항목을 저장하고 있습니다.');
   const m=await bridge.api('/api/apply',{id:previewId,approved:true});resetSearch();await bridge.afterApply(m);
   bridge.say(`${m.count.toLocaleString()}곳에서 단어 ${m.occurrences.toLocaleString()}회를 치환했습니다. 백업·수정 기록: ${m.id}`);
  });
  root.addEventListener('jo9:single-preview',resetPreview);root.addEventListener('jo9:text-changed',resetSearch);render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(globalThis);
/* JO9 MOD END TEXT_BATCH_REPLACE_UI */
