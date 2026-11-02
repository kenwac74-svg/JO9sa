'use strict';
module.exports=function(){
 function box(n){if(!n)return null;var r=n.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height,scrollH:n.scrollHeight,fontSize:getComputedStyle(n).fontSize};}
 function observe(retry){
  var imgs=document.querySelectorAll('img'),wait=0,bad=[],out=[];
  for(var i=0;i<imgs.length;i++){var im=imgs[i];if(!im.complete)wait++;if(im.complete&&!im.naturalWidth)bad.push(im.getAttribute('src'));out.push({src:im.getAttribute('src'),naturalW:im.naturalWidth,naturalH:im.naturalHeight,box:box(im)});}
  if(wait&&retry<40){setTimeout(function(){observe(retry+1);},50);return;}
  var p=document.querySelector('#side_panel_text'),head=document.querySelector('#side_panel_main');
  var result={images:out,missingImages:bad,panel:p?{text:p.textContent,box:box(p)}:null,heading:head?{text:head.textContent,box:box(head)}:null,allText:document.body.textContent};
  var callback=document.getElementById('qa_dom_callback'),data=encodeURIComponent(JSON.stringify(result)).replace(/'/g,'%27');
  callback.setAttribute('href',"EXEC: $qa_dom='"+data+"' & gs 'qa_finish'");var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);callback.dispatchEvent(e);
 }
 setTimeout(function(){observe(0);},100);
};
