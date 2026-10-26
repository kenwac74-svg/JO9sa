(function(){
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function fail(code){var a=document.createElement('a');a.href='EXEC: msg '+String.fromCharCode(39)+'FAIL_TRAITDOM_JS_'+String(code).replace(/[^A-Za-z0-9_]/g,'_')+String.fromCharCode(39);document.body.appendChild(a);click(a)}
 window.onerror=function(message,url,line){if(/msg\.style/.test(String(message)))return false;fail('LINE_'+line+'_'+String(message).slice(0,100));return false};
 var tries=0;function done(){
  var actualMessage=document.getElementById('__message__');if(actualMessage){var actualClose=document.querySelector('a[href="api/closemsg"]');if(actualClose){var image=actualClose.querySelector('img')||actualClose,r=image.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(actualClose.contains(hit)){click(actualClose);return}}setTimeout(done,30);return}
  var api=window.JO9TraitView;if(!api||api.root.getAttribute('data-ready')!=='1'){if(++tries<100)setTimeout(done,30);else fail('NO_API');return}
  api.measure();var root=api.root,left=api.list.children,total=left.length,ordinary=0,titles=0,statesFirst=true,seenOther=false,visibleFits=true,links=true,i;
  var column=root.parentElement,limit=api.footer.getBoundingClientRect().top-4,cb=column.getBoundingClientRect();
  for(i=0;i<left.length;i++){var kind=left[i].getAttribute('data-kind');if(kind==='state'&&seenOther)statesFirst=false;if(kind!=='state')seenOther=true;if(kind==='title')titles++;else ordinary++;
   if(getComputedStyle(left[i]).display!=='none'&&left[i].getBoundingClientRect().bottom>limit+.1)visibleFits=false;
   if(!(parseInt(left[i].getAttribute('data-index'),10)>0))links=false;
  }
  var footer=api.footer.getBoundingClientRect(),closedOK=total>=16&&root.getAttribute('data-overflow')==='1'&&!api.footer.hidden&&footer.bottom<=cb.bottom+.1&&visibleFits&&statesFirst&&links;
  if(root.getAttribute('data-open')==='0'){
   var maxBottom=0,visibleCount=0;for(i=0;i<left.length;i++){if(getComputedStyle(left[i]).display!=='none'){maxBottom=Math.max(maxBottom,left[i].getBoundingClientRect().bottom);visibleCount++}}
   var cs=getComputedStyle(column),details=[total,root.getAttribute('data-overflow'),api.footer.hidden,footer.top,footer.bottom,cb.top,cb.bottom,cb.height,column.offsetHeight,cs.position,cs.top,cs.height,cs.display,visibleCount,maxBottom,visibleFits,statesFirst,links].join(',');
   var h=document.getElementById('jo9_tv_heading');h.setAttribute('href','EXEC: $qa_dom_closed_debug='+String.fromCharCode(39)+details+String.fromCharCode(39)+' & qa_dom_closed='+Number(closedOK)+' & '+h.getAttribute('href').replace(/^exec:\s*/i,''));click(h);return;
  }
  var cols=api.columns,panel=api.panel.getBoundingClientRect(),orderedOK=cols[0].children.length+cols[1].children.length===ordinary&&cols[2].children.length===titles;
  var all=[];for(i=0;i<3;i++){for(var k=0;k<cols[i].children.length;k++){var n=cols[i].children[k];all.push(n);if(i===2&&n.getAttribute('data-kind')!=='title')orderedOK=false}}
  var first=parseInt(all[0].getAttribute('data-index'),10),fonts=true;
  for(i=0;i<all.length;i++){var s=getComputedStyle(all[i]);if(s.fontSize!==getComputedStyle(column).fontSize||s.fontFamily!==getComputedStyle(column).fontFamily)fonts=false}
  var m=document.createElement('div');m.id='__message__';m.style.cssText='position:fixed;left:200px;top:0;width:500px;height:375px;background:#eee';m.innerHTML='<a href="api/closemsg" style="position:absolute;top:340px;left:250px;width:32px;height:32px;background:#111">OK</a>';document.body.appendChild(m);
  var hit=document.elementFromPoint(462,352),layer=m.contains(hit);m.querySelector('a').onclick=function(e){e.preventDefault();m.parentNode.removeChild(m)};click(m.querySelector('a'));layer=layer&&!document.getElementById('__message__')&&!api.panel.hidden;
  var openOK=closedOK&&!api.panel.hidden&&orderedOK&&fonts&&panel.left===245&&panel.top===35&&panel.width===795&&panel.height===595&&document.getElementById('info').getBoundingClientRect().top>=panel.bottom&&layer;
  var openedDetails=[closedOK,api.panel.hidden,orderedOK,fonts,panel.left,panel.top,panel.right,panel.bottom,panel.width,panel.height,api.panel.offsetHeight,getComputedStyle(api.panel).height,getComputedStyle(api.panel).display,document.getElementById('info').getBoundingClientRect().top,layer,visibleFits,statesFirst,links,footer.bottom,cb.bottom].join(',');
  var callback=document.getElementById('qa_dom_callback');callback.setAttribute('href','EXEC: $qa_dom_open_debug='+String.fromCharCode(39)+openedDetails+String.fromCharCode(39)+' & qa_dom_opened='+Number(openOK)+' & qa_dom_first='+first+' & qa_dom_total='+total+' & qa_dom_titles='+titles+' & gs '+String.fromCharCode(39)+'qa_dom_done'+String.fromCharCode(39));click(callback);
 }setTimeout(done,150);
}());