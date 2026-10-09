/* Selecting a detected game image reveals its card in the already-open catalog. */
(function(){
  'use strict';
  var group=document.getElementById('screenGroups');
  if(!group)return;
  var pending=null,timer;
  function publish(path){
    if(!path)return;
    var clean=String(path).replace(/\\/g,'/');
    var at=clean.toLowerCase().indexOf('content/pic/');
    var rel=at>=0?clean.slice(at):'content/pic/'+clean.replace(/^\/+/, '');
    clearTimeout(timer);
    timer=setTimeout(function(){
      if(pending)pending.abort();
      pending=new AbortController();
      fetch('http://127.0.0.1:3813/api/catalog/selection',{
        method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},
        body:JSON.stringify({path:rel}),signal:pending.signal
      }).then(function(r){return r.json().then(function(v){if(!r.ok)throw Error(v.error||'연결 실패');});}).catch(function(e){
        if(e.name!=='AbortError')console.warn('체크리스트 이미지 연결: '+e.message);
      });
    },80);
  }
  group.addEventListener('change',function(e){
    if(e.target.dataset.action==='screen-select'&&e.target.checked)publish(e.target.dataset.path);
  });
  group.addEventListener('click',function(e){
    if(e.target.closest('input[type="checkbox"]'))return;
    var detail=e.target.closest('[data-action="screen-detail"]'),card=e.target.closest('[data-screen-card]');
    publish(detail?detail.dataset.path:card?card.dataset.screenCard:'');
  });
})();
