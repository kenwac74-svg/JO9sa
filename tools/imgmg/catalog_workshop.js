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
  function accept(v){baseline=JSON.parse(JSON.stringify(v.items||{}));S=JSON.parse(JSON.stringify(baseline));codes=v.codes||codes;unitCodes=v.unitCodes||unitCodes;window.CATALOG_STATUS=v;try{localStorage.setItem('imgmg_status',JSON.stringify({savedAt:v.savedAt,items:S}));}catch(e){}el('save').textContent='편집실과 공유 저장 · '+new Date(v.savedAt||Date.now()).toLocaleTimeString();redraw();}
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
  function locate(){var p=new URLSearchParams(location.search).get('image');if(!p)return;var target=D.find(function(d){return d[0].toLowerCase()===p.replace(/\//g,'\\').toLowerCase();});if(!target){el('save').textContent='체크리스트에 없는 이미지입니다: '+p;return;}var parent=target[7]||target[0];curDir='';el('small').checked=true;['fs','st','src'].forEach(function(k){el(k).value='';});el('q').value=parent;filter();var i=R.findIndex(function(d){return d[0]===target[0];});if(i>=0){var card=el('r'+i);card.style.outline='3px solid #d8a958';card.scrollIntoView({block:'center'});}}
  applyCodesOffline();
  if(!config||!window.fetch){if(window.URLSearchParams)locate();return;}
  request('api/catalog/state').then(function(v){
    if(!v.available)throw Error('체크리스트 연결 없음');remote=true;
    // Import only unsaved browser deltas against the file used when the page opened.
    var edits=changes(fileBase,initial);accept(v);return edits.length?request('api/catalog/status',{actions:edits}).then(accept):null;
  }).then(locate).catch(function(e){remote=false;el('save').textContent='공유 연결 대기: '+e.message+' · 현재 브라우저에 저장';locate();});
  window.addEventListener('focus',refresh);setInterval(refresh,5000);
})();
