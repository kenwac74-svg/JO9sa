/* JO9 BATTLE LOG PAGING CANDIDATE 20261027.
   Display-only: no QSP variables, callbacks, combat values or source colors change. */
(function () {
 'use strict';
 var root=document.getElementById('jo9_battle_test_v01'),log=root&&root.querySelector('#fight_txt');
 if(!root||!log)return;
 if(log.__jo9BattleLog){window.JO9BattleLog=log.__jo9BattleLog;log.__jo9BattleLog.layout();return;}
 var source=log.cloneNode(true),brs=source.querySelectorAll('br'),i,n;
 /* Keep whitespace text nodes so sourceText is unchanged; remove only duplicate BR siblings. */
 for(i=0;i<brs.length;i++)if(brs[i].parentNode){
  n=brs[i].nextSibling;
  while(n){
   if(n.nodeType===3&&!/\S/.test(n.nodeValue)){n=n.nextSibling;continue;}
   if(n.nodeType===1&&n.tagName==='BR'){var after=n.nextSibling;n.parentNode.removeChild(n);n=after;continue;}
   break;
  }
 }
 var units=[],starts=[],view=log,controls=null,prev=null,next=null,count=null,retries=0;
 function point(node,offset){return{node:node,offset:offset};}
 function collect(parent){
  for(var node=parent.firstChild,index=0;node;node=node.nextSibling,index++){
   if(node.nodeType===3){
    var s=node.nodeValue,k=0,end;
    while(k<s.length){end=k+1;if(s.charCodeAt(k)>=55296&&s.charCodeAt(k)<=56319&&end<s.length&&s.charCodeAt(end)>=56320&&s.charCodeAt(end)<=57343)end++;
     units.push({start:point(node,k),end:point(node,end)});k=end;}
   }else if(node.nodeType===1){
    if(node.tagName==='BR'||!node.firstChild)units.push({start:point(parent,index),end:point(parent,index+1)});
    else collect(node);
   }
  }
 }
 collect(source);
 function html(from,to){
  if(from>=to)return '';
  var range=document.createRange(),a=units[from].start,b=units[to-1].end;
  range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);
  var frag=range.cloneContents(),ancestor=range.commonAncestorContainer;
  if(ancestor.nodeType!==1)ancestor=ancestor.parentNode;
  /* cloneContents excludes its common ancestor; restore its color/style wrappers. */
  while(ancestor&&ancestor!==source){var wrap=ancestor.cloneNode(false);wrap.appendChild(frag);frag=wrap;ancestor=ancestor.parentNode;}
  var box=document.createElement('div');box.appendChild(frag);return box.innerHTML;
 }
 var api={ready:false,settled:false,layoutPass:0,pagesHTML:[],pages:[],html:source.innerHTML,sourceText:source.textContent,
  current:0,index:0,root:root,log:log,viewport:log,controls:null,prev:null,next:null,error:'',show:show,layout:layout};
 log.__jo9BattleLog=api;window.JO9BattleLog=api;
 function fits(target){return target.clientHeight>0&&target.scrollHeight<=target.clientHeight&&target.scrollWidth<=target.clientWidth;}
 function expose(){api.viewport=view;api.controls=controls;api.prev=prev;api.next=next;}
 function show(page){
  if(!api.pagesHTML.length)return;
  page=Math.max(0,Math.min(api.pagesHTML.length-1,Number(page)||0));
  api.current=api.index=page;view.innerHTML=api.pagesHTML[page];
  if(controls){count.textContent=(page+1)+' / '+api.pagesHTML.length;prev.setAttribute('aria-disabled',page===0?'true':'false');next.setAttribute('aria-disabled',page===api.pagesHTML.length-1?'true':'false');}
 }
 function onPage(delta){return function(e){if(e){e.preventDefault();e.stopPropagation();}show(api.current+delta);return false;};}
 function makeControls(){
  view=document.createElement('div');view.className='jo9-battle-log-view';
  controls=document.createElement('div');controls.id='jo9_battle_log_controls';controls.className='jo9-battle-log-controls';
  controls.innerHTML='<a id="jo9_battle_log_prev" href="#" role="button">이전</a><span id="jo9_battle_log_count"></span><a id="jo9_battle_log_next" href="#" role="button">다음</a>';
  log.innerHTML='';log.appendChild(view);log.appendChild(controls);
  prev=controls.querySelector('#jo9_battle_log_prev');next=controls.querySelector('#jo9_battle_log_next');count=controls.querySelector('#jo9_battle_log_count');
  prev.onclick=onPage(-1);next.onclick=onPage(1);expose();
 }
 function layout(){
  if(document.getElementById('jo9_battle_test_v01')!==root)return;
  if(log.clientWidth<1||log.clientHeight<=24){if(retries++<20)setTimeout(layout,50);else api.error='Log viewport is too small';return;}
  var keep=starts[api.current]||0,pages=[],newStarts=[],from=0,lo,hi,mid,best;
  api.ready=false;api.error='';log.innerHTML=api.html;view=log;controls=prev=next=count=null;expose();
  if(fits(log)||!units.length){pages=[api.html];newStarts=[0];}
  else{
   makeControls();view.style.visibility='hidden';
   while(from<units.length){
    lo=from+1;hi=units.length;best=from;
    while(lo<=hi){mid=Math.floor((lo+hi)/2);view.innerHTML=html(from,mid);if(fits(view)){best=mid;lo=mid+1;}else hi=mid-1;}
    if(best===from){
     /* Never declare an unfit page valid or discard its text. Normal log atoms are text/BR. */
     api.error='A log atom cannot fit the fixed viewport';log.innerHTML=api.html;view=log;controls=prev=next=count=null;expose();api.pagesHTML=api.pages=[];return;
    }
    newStarts.push(from);pages.push(html(from,best));from=best;
   }
   view.style.visibility='';
  }
  starts=newStarts;api.pagesHTML=api.pages=pages;var page=0;
  for(i=0;i<starts.length;i++)if(starts[i]<=keep)page=i;
  show(page);api.layoutPass++;api.ready=true;
 }
 layout();
 setTimeout(function(){layout();api.settled=true;},500);
}());
