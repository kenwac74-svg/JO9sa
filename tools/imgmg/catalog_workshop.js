/* Shared catalog/workshop status bridge. Classic globals remain compatible with the existing catalog. */
(function(){
  'use strict';
  var config=window.JO9_CATALOG_BRIDGE,remote=false,baseline={},codes=window.JO9_WORK_CODES||{},unitCodes=window.JO9_WORK_UNITS||{},pending=[],saving=false,refreshing=false;
  var originalSave=saveNow,originalSet=setSt,originalBulk=bulkSet,originalRow=rowHtml,originalMatch=match;
  var initial=JSON.parse(JSON.stringify(S)),fileBase=(window.CATALOG_STATUS||{}).items||{};
  var codeStyle=document.createElement('style'),codeCss='.tag.workcode{background:#263f5e;color:#fff;font:600 12px Consolas,monospace;padding:4px 7px;border-radius:4px}.tag.workunit{background:#dfedf8;color:#25476d;padding:4px 7px;border-radius:4px}';
  if(codeStyle.styleSheet)codeStyle.styleSheet.cssText=codeCss;else codeStyle.textContent=codeCss;document.head.appendChild(codeStyle);
  function redraw(){summary();drawTree();render();}
  function same(a,b){return JSON.stringify(a||[])===JSON.stringify(b||[]);}
  function changes(from,to){var keys={},out=[];Object.keys(from).concat(Object.keys(to)).forEach(function(k){keys[k]=1;});Object.keys(keys).forEach(function(p){STS.forEach(function(f){var before=(from[p]||[]).indexOf(f[0])>=0,after=(to[p]||[]).indexOf(f[0])>=0;if(before!==after)out.push({path:p,flag:f[0],expected:before,checked:after});});});return out;}
  function request(route,data){var headers={'X-JO9-Token':config.token};if(data)headers['Content-Type']='application/json';return fetch(config.url+route,{method:data?'POST':'GET',headers:headers,body:data?JSON.stringify(data):undefined}).then(function(r){return r.json().then(function(v){if(!r.ok)throw Error(v.error);return v;});});}
  openFolder=function(full){
    try{var shell=new ActiveXObject('WScript.Shell');shell.Run('explorer.exe /select,"'+full+'"');return false;}catch(e){}
    var roots=[MR,OR],original=false,rel=null;
    for(var n=0;n<roots.length;n++){if(full.toLowerCase().indexOf((roots[n]+'\\').toLowerCase())===0){rel=full.substring(roots[n].length+1);original=n===1;break;}}
    if(!config||!window.fetch||rel===null){alert('탐색기 연결을 위해 대사 편집실을 켜 주세요.');return false;}
    request('api/catalog/open-folder',{path:rel,original:original}).catch(function(e){alert('폴더 열기 실패: '+e.message);});
    return false;
  };
  var copySide=side;
  side=function(lab,root,rel,len,orig){
    var html=copySide(lab,root,rel,len,orig);
    if(len&&(root===OR||root===MR)&&isImg(rel)){
      if(orig)rel=rel.replace(/^content\\pic\\reserve\\/i,'content\\pic\\');
      var button=' <button type="button" class="copy-original" title="이 이미지를 modworkpic으로 복사" onclick="copyCatalogImage(\''+js(rel)+'\',this,'+(orig?'true':'false')+')">작업폴더로 복사</button>';
      html=html.replace('</a></div></div>','</a>'+button+'</div></div>');
    }
    return html;
  };
  window.copyCatalogOriginal=function(rel,button){return window.copyCatalogImage(rel,button,true);};
  window.copyCatalogImage=async function(rel,button,original){
    if(!config){alert('로컬 체크리스트에서 사용해 주세요.');return;}
    button.disabled=true;
    try{
      var result=await request('api/catalog/copy-original',{path:rel,original:original});
      if(result.conflict){
        if(!confirm(result.name+' 파일이 modworkpic에 이미 있습니다. 기존 파일을 백업하고 선택한 이미지로 덮어쓸까요?'))return;
        result=await request('api/catalog/copy-original',{path:rel,original:original,replaceHash:result.hash});
      }
      button.textContent=result.unchanged?'이미 복사됨':'복사 완료';
      button.title=result.destination;
      if(window.JO9_GROK_SELECT)window.JO9_GROK_SELECT(rel,Object.assign({},result,{original:original}));
    }catch(e){alert('이미지 복사 실패: '+e.message);}
    finally{button.disabled=false;}
  };
  function accept(v){if(v.originalCutSync){Object.assign(config.originalCuts||(config.originalCuts={}),v.originalCutSync.originalCuts||{});Object.assign(config.originalReservations||(config.originalReservations={}),v.originalCutSync.originalReservations||{});}baseline=JSON.parse(JSON.stringify(v.items||{}));S=JSON.parse(JSON.stringify(baseline));codes=v.codes||codes;unitCodes=v.unitCodes||unitCodes;window.CATALOG_STATUS=v;try{localStorage.setItem('imgmg_status',JSON.stringify({savedAt:v.savedAt,items:S}));}catch(e){}el('save').textContent='편집실과 공유 저장 · '+new Date(v.savedAt||Date.now()).toLocaleTimeString();redraw();if(v.originalCutSync){var sync=v.originalCutSync;el('save').textContent=sync.warning?'보관 상태 저장됨 · B컷 연결 확인 필요: '+sync.warning:'보관 상태 저장됨 · JO9O B컷 연결 '+sync.linked+'개'+(sync.pending?' · 원본 없는 B컷 예약 '+sync.pending+'개':'');}}
  rowHtml=function(d,i,kid){var html=originalRow(d,i,kid),code=codes[d[0]];if(code)html=html.replace('<span class="rel">','<span class="tag workcode" title="파일 분류와 고정 번호">'+esc(code)+'</span>'+(unitCodes[d[0]]?'<span class="tag workunit" title="큰 그림과 연결된 작업 단위">짝 '+esc(unitCodes[d[0]])+'</span>':'')+'<span class="rel">');return html;};
  match=function(d,fs,nd){var q=el('q').value.toLowerCase(),code=(codes[d[0]]||'').toLowerCase(),unit=(unitCodes[d[0]]||'').toLowerCase();if(q&&(code.indexOf(q)>=0||unit.indexOf(q)>=0)){var old=el('q').value;el('q').value='';try{return originalMatch(d,fs,nd);}finally{el('q').value=old;}}return originalMatch(d,fs,nd);};
  function applyCodesOffline(){redraw();}
  function flush(){
    if(saving||!pending.length)return;var batch=pending.splice(0);saving=true;
    request('api/catalog/status',{actions:batch}).then(function(v){var queued=pending.slice();accept(v);queued.forEach(function(a){if(a.checked)mark(a.path,a.flag);else unmark(a.path,a.flag);});redraw();}).catch(function(e){pending=[];el('save').textContent='공유 저장 실패: '+e.message+' · 선택 상태를 다시 불러옵니다';return request('api/catalog/state').then(accept).catch(function(){});}).finally(function(){saving=false;flush();});
  }
  saveNow=function(){if(!remote){originalSave();return;}var diff=changes(baseline,S);baseline=JSON.parse(JSON.stringify(S));pending=pending.concat(diff);flush();};
  setSt=function(i,s){if(remote&&(saving||pending.length)){el('save').textContent='상태 저장 중입니다. 저장 후 다시 선택하세요.';return;}originalSet(i,s);if(remote)saveNow();};
  bulkSet=function(){if(remote&&(saving||pending.length))return;originalBulk();};
  function refresh(){if(!remote||saving||pending.length||refreshing)return;refreshing=true;request('api/catalog/state?since='+encodeURIComponent(window.CATALOG_STATUS.savedAt||0)).then(function(v){if(!v.unchanged)accept(v);}).catch(function(){el('save').textContent='편집실 연결이 끊겼습니다 · 재연결 전에는 체크할 수 없습니다';}).finally(function(){refreshing=false;});}
  function locate(p){if(window.JO9_UNCHECKED_REVIEW&&window.JO9_UNCHECKED_REVIEW.active())return;if(typeof p!=='string')p=new URLSearchParams(location.search).get('image');if(!p)return;var target=D.find(function(d){return d[0].toLowerCase()===p.replace(/\//g,'\\').toLowerCase();});if(!target){el('save').textContent='체크리스트에 없는 이미지입니다: '+p;return;}var parent=target[7]||target[0];curDir='';el('small').checked=true;['fs','st','src'].forEach(function(k){el(k).value='';});el('q').value=parent;filter();var i=R.findIndex(function(d){return d[0]===target[0];});if(i>=0){var card=el('r'+i);card.style.outline='3px solid #d8a958';card.scrollIntoView({block:'center'});}}
  applyCodesOffline();
  if(!config||!window.fetch){if(window.URLSearchParams)locate();return;}
  request('api/catalog/state').then(function(v){
    if(!v.available)throw Error('체크리스트 연결 없음');remote=true;
    // Import only unsaved browser deltas against the file used when the page opened.
    var edits=changes(fileBase,initial);accept(v);return edits.length?request('api/catalog/status',{actions:edits}).then(accept):null;
  }).then(locate).catch(function(e){remote=false;el('save').textContent='공유 연결 대기: '+e.message+' · 현재 브라우저에 저장';locate();});
  window.addEventListener('focus',refresh);setInterval(refresh,5000);
  // This channel only changes the displayed catalog card; it never changes file/status data.
  var selectionRevision=0,selectionPolling=false;
  function followWorkshop(){
    if(!remote||selectionPolling)return;
    selectionPolling=true;
    request('api/catalog/selection').then(function(v){
      if(!v.path||v.id===selectionRevision)return;
      selectionRevision=v.id;
      var url=new URL(location.href);url.searchParams.set('image',v.path);
      history.replaceState(null,'',url);
      locate(v.path);
    }).catch(function(){}).finally(function(){selectionPolling=false;});
  }
  window.addEventListener('focus',followWorkshop);
  setInterval(followWorkshop,1000);

})();

/* Visible, live filename / work-code search. Reuse the catalog's filters and paired-image cards. */
(function(){
  'use strict';
  var query=document.getElementById('q'),main=document.getElementById('main');if(!query||!main)return;
  var style=document.createElement('style');style.textContent='#jo9SearchBar{position:sticky;top:0;z-index:700;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px;margin-bottom:12px;background:#20354d;color:#f1f6fc;border:1px solid #8fa9c6;border-radius:6px}#jo9SearchBar #q{flex:1;min-width:180px;width:auto;padding:9px;background:#fff;color:#172235;border:1px solid #9ab0c9;border-radius:4px;font-size:15px}#jo9SearchBar button{padding:7px 10px;background:#e7eef8;color:#172235;border:1px solid #9ab0c9;border-radius:4px;cursor:pointer}#jo9SearchBar label{color:#f1f6fc}';document.head.appendChild(style);
  var bar=document.createElement('div');bar.id='jo9SearchBar';bar.innerHTML='<strong>이미지 검색</strong><button id="jo9SearchGo" type="button">검색</button><button id="jo9SearchClear" type="button">검색 지우기</button><label><input id="jo9SearchAll" type="checkbox" checked> 전체 폴더 · 미적용 포함</label><span id="jo9SearchCount" aria-live="polite"></span>';
  query.placeholder='파일명 또는 작업번호 · 예: womens_attraction, bg-0028';query.setAttribute('aria-label','이미지 파일명 또는 작업번호 검색');bar.insertBefore(query,bar.children[1]);main.insertBefore(bar,main.firstChild);
  var scope=document.getElementById('jo9SearchAll'),counter=document.getElementById('jo9SearchCount'),beforeInDir=inDir,beforeMatch=match;
  function globalSearch(){return scope.checked&&!!query.value.trim();}
  inDir=function(d){return globalSearch()?true:beforeInDir(d);};
  match=function(d,fs,nd){if(!globalSearch())return beforeMatch(d,fs,nd);var savedDir=curDir;curDir=catalogDir(d[0]);try{return beforeMatch(d,fs,nd);}finally{curDir=savedDir;}};
  var timer,lastQuery=null;function run(force){clearTimeout(timer);var currentQuery=query.value.trim();query.value=currentQuery;if(globalSearch()&&(currentQuery!==lastQuery||force===true)){['fs','st','src'].forEach(function(id){document.getElementById(id).value='';});document.getElementById('small').checked=true;}lastQuery=currentQuery;filter();counter.textContent=currentQuery?'검색 결과 '+view.length+'개':'';}
  query.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(function(){run(false);},180);});query.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();run(true);}if(e.key==='Escape'){query.value='';run();}});
  document.getElementById('jo9SearchGo').onclick=function(){run(true);};document.getElementById('jo9SearchClear').onclick=function(){query.value='';run();query.focus();};scope.onchange=function(){run(true);};
})();

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
