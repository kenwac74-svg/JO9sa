/* JO9_UNCHECKED_REVIEW_BEGIN: dedicated, non-mutating review of every unmarked file. */
(function(){
  'use strict';
  var active=false,previous=null,timer;
  var beforeRender=render,beforeFilter=filter,beforeSummary=summary,beforeBulk=bulkSet;
  function unchecked(value){return value==null||value===''||(Array.isArray(value)&&value.length===0);}
  function candidates(rows,state){return rows.filter(function(d){return unchecked(state[d[0]]);});}
  window.JO9_UNCHECKED_REVIEW={isUnchecked:unchecked,candidates:candidates,active:function(){return active;}};
  var bar=document.createElement('div');bar.className='bar unchecked-review';
  bar.innerHTML='<button type="button" id="review-unchecked">미체크 전체 보기</button> <button type="button" id="review-normal" hidden>일반 보기로 돌아가기</button> <label id="review-folder-label" hidden>미체크 폴더 <select id="review-folder" aria-label="미체크 폴더"></select></label> <span id="review-description">상태 체크가 하나도 없는 이미지를 따로 확인합니다.</span>';
  var sum=el('sum');sum.parentNode.insertBefore(bar,sum.nextSibling);
  var style=document.createElement('style');style.textContent='.unchecked-review{padding:12px;border:1px solid #83996c;background:#263323;color:#f4f1df}.unchecked-review button{font-weight:bold}.unchecked-review.review-active{border-color:#d6bc71;background:#343421}.unchecked-review #review-description{display:block;margin-top:8px;color:#f4f1df;line-height:1.5}.unchecked-review #review-folder-label{margin-left:8px}.unchecked-review #review-folder{max-width:100%;width:420px;margin:6px 0;padding:6px}';document.head.appendChild(style);
  function refreshFolders(rows){
    var counts=Object.create(null);
    rows.forEach(function(d){
      var dir=catalogDir(d[0]),parts=dir.split('\\'),path='';
      for(var i=0;i<parts.length;i++){
        path+=(i?'\\':'')+parts[i];
        if(!counts[path])counts[path]={direct:0,subtree:0};
        counts[path].subtree++;
        if(i===parts.length-1)counts[path].direct++;
      }
    });
    if(curDir&&!counts[curDir])counts[curDir]={direct:0,subtree:0};
    var html='<option value="">전체 폴더 · '+rows.length.toLocaleString()+'개</option>';
    Object.keys(counts).sort(function(a,b){return a.toLowerCase().localeCompare(b.toLowerCase());}).forEach(function(dir){
      var count=counts[dir][el('sub').checked?'subtree':'direct'];
      html+='<option value="'+esc(dir)+'">'+esc(dir)+' · '+count.toLocaleString()+'개</option>';
    });
    el('review-folder').innerHTML=html;el('review-folder').value=curDir;
  }
  function refreshBadge(){
    var rows=candidates(D,S),total=rows.length;
    el('review-unchecked').textContent='미체크 전체 보기 ('+total.toLocaleString()+'개)';
    el('review-unchecked').disabled=active;el('review-normal').hidden=!active;
    bar.className='bar unchecked-review'+(active?' review-active':'');
    el('review-folder-label').hidden=!active;
    if(active)refreshFolders(rows);
    el('review-description').textContent=active?'위 폴더 선택 또는 왼쪽 폴더 목록으로 나눠 봅니다. 하위 폴더 포함을 끄면 해당 폴더만 표시합니다. 포트레이트·UI·미적용 시안도 포함하며, 미체크는 미사용 판정이 아닙니다.':'상태 체크가 하나도 없는 이미지를 따로 확인합니다.';
  }
  function visibleRows(){
    return candidates(D,S).filter(function(d){
      var dd=catalogDir(d[0]);
      if(curDir&&dd!==curDir&&(!el('sub').checked||dd.indexOf(curDir+'\\')!==0))return false;
      // Use the current workshop matcher for path and work-code searches, but
      // check state above and allow the root to include reserve images too.
      var old=curDir;curDir=dd;
      try{return match(d,'',true);}finally{curDir=old;}
    });
  }
  function withoutPairs(fn){var old=KIDS;KIDS={};try{return fn();}finally{KIDS=old;}}
  render=function(){
    if(!active)return beforeRender();
    el('fs').value='none';
    view=visibleRows();
    var result=withoutPairs(function(){return beforeRender();});
    el('cnt').textContent='미체크 '+view.length.toLocaleString()+'개 / 전체 미체크 '+candidates(D,S).length.toLocaleString()+'개';
    refreshBadge();return result;
  };
  filter=function(){if(!active)return beforeFilter();page=0;render();summary();};
  summary=function(){var result=beforeSummary();refreshBadge();return result;};
  bulkSet=function(){
    if(!active)return beforeBulk();
    // Existing bulk logic includes paired children; in this view each file is
    // independent, so checked relatives must never receive a bulk mutation.
    view=visibleRows();return withoutPairs(function(){return beforeBulk();});
  };
  function enter(){
    if(active)return;
    previous={dir:curDir,page:page,values:{},checks:{},disabled:{}};
    ['fs','st','src','q'].forEach(function(id){previous.values[id]=el(id).value;});
    ['small','sub'].forEach(function(id){previous.checks[id]=el(id).checked;});
    ['fs','small','sub'].forEach(function(id){previous.disabled[id]=el(id).disabled;el(id).disabled=id!=='sub';});
    active=true;curDir='';el('fs').value='none';el('st').value='';el('src').value='';el('q').value='';el('small').checked=true;el('sub').checked=true;
    drawTree();filter();
  }
  function leave(){
    if(!active)return;active=false;clearTimeout(timer);
    curDir=previous.dir;
    Object.keys(previous.values).forEach(function(id){el(id).value=previous.values[id];});
    Object.keys(previous.checks).forEach(function(id){el(id).checked=previous.checks[id];});
    Object.keys(previous.disabled).forEach(function(id){el(id).disabled=previous.disabled[id];});
    var oldPage=previous.page;drawTree();filter();page=oldPage;render();refreshBadge();
  }
  // Classic handlers captured the old filter function during page startup.
  // Capture only review controls; normal-mode event handling stays untouched.
  document.addEventListener('change',function(e){
    if(active&&['fs','st','src','per','small','sub'].indexOf(e.target.id)>=0){e.stopImmediatePropagation();filter();}
  },true);
  document.addEventListener('keyup',function(e){
    if(active&&e.target.id==='q'){e.stopImmediatePropagation();clearTimeout(timer);timer=setTimeout(filter,250);}
  },true);
  document.addEventListener('input',function(e){
    if(active&&e.target.id==='q'){e.stopImmediatePropagation();clearTimeout(timer);timer=setTimeout(filter,180);}
  },true);
  document.addEventListener('keydown',function(e){
    if(active&&e.target.id==='q'&&(e.key==='Enter'||e.key==='Escape')){e.stopImmediatePropagation();e.preventDefault();if(e.key==='Escape')el('q').value='';filter();}
  },true);
  document.addEventListener('click',function(e){
    if(active&&(e.target.id==='jo9SearchGo'||e.target.id==='jo9SearchClear')){e.stopImmediatePropagation();if(e.target.id==='jo9SearchClear')el('q').value='';filter();}
  },true);
  el('review-unchecked').onclick=enter;el('review-normal').onclick=leave;
  el('review-folder').onchange=function(){curDir=this.value;el('q').value='';drawTree();filter();};
  window.JO9_UNCHECKED_REVIEW.enter=enter;window.JO9_UNCHECKED_REVIEW.leave=leave;
  refreshBadge();
  if(new URLSearchParams(location.search).get('review')==='unchecked')enter();
})();
/* JO9_UNCHECKED_REVIEW_END */
