'use strict';
module.exports=function(point,nonce){
 function click(n){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);n.dispatchEvent(e);}
 function rect(n){if(typeof n==='string')n=document.querySelector(n);if(!n)return null;var r=n.getBoundingClientRect(),s=getComputedStyle(n);return {x:r.left,y:r.top,w:r.width,h:r.height,font:s.fontFamily,fontSize:s.fontSize,background:s.backgroundImage};}
 function go(retry){
  var imgs=document.querySelectorAll('img'),loading=0,bad=[],items=[];
  for(var i=0;i<imgs.length;i++){var im=imgs[i],src=im.getAttribute('src')||'';if(!im.complete)loading++;if(im.complete&&im.naturalWidth===0)bad.push(src);if(im.parentNode&&im.parentNode.id==='bg')items.push({src:src,w:im.naturalWidth,h:im.naturalHeight});}
  if(loading&&retry<30){setTimeout(function(){go(retry+1);},50);return;}
  var text=document.querySelector('#text'),main=document.querySelector('#main_screen'),links=[],list=document.querySelectorAll('a'),nodes=document.querySelectorAll('.jo9_tutorial_menu #under,.jo9_tutorial_menu #under_gray'),rows=[],okay=1;
  for(var j=0;j<list.length;j++){var a=list[j],p=a.parentNode;if(a.id!=='qa_dom_callback'&&(p&&p.id==='clear'||main&&main.contains(a)))links.push({text:a.textContent,href:a.getAttribute('href')});}
  for(var k=0;k<nodes.length;k++){var n=nodes[k],r=rect(n),anchor=n.querySelector('#clear a');r.text=n.textContent;r.href=anchor?anchor.getAttribute('href'):null;r.hit=rect(anchor);r.scrollH=n.scrollHeight;rows.push(r);if(Math.abs(r.w-330)>1||Math.abs(r.h-62)>1||r.fontSize!=='20px'||r.background.indexOf('/bar.png')<0||r.x<0||r.x+r.w>1000||r.y<0||r.y+r.h>800||r.scrollH>63)okay=0;if(anchor){var h=rect(anchor);if(Math.abs(h.w-r.w)>1||Math.abs(h.h-r.h)>1||Math.abs(h.x-r.x)>1||Math.abs(h.y-r.y)>1)okay=0;}}
  var potionOkay=1,cols=[],potion=main&&(' '+main.className+' ').indexOf(' jo9_home_potions ')>=0,colNodes=main?main.querySelectorAll('.menu_column_0,.menu_column_1'):[];
  for(var ci=0;ci<colNodes.length;ci++){var col=colNodes[ci],cs=getComputedStyle(col),cr=rect(col);cr.position=cs.position;cr.top=cs.top;cr.direct=col.parentNode===main;cols.push(cr);if(potion&&(!cr.direct||cr.position!=='absolute'||cr.top!=='63px'))potionOkay=0;}
  if(potion&&!colNodes.length)potionOkay=0;
  var data=encodeURIComponent(JSON.stringify({point:point,scene:rect('#bg'),text:rect('#text'),main:rect('#main_screen'),side:rect('#side_panel_main'),textContent:text?text.textContent:'',mainText:main?main.textContent:'',home:!!document.querySelector('#jo9_ui_home'),city:!!document.querySelector('#jo9_ui_city'),links:links,images:items,missingImages:bad,rows:rows,menuOkay:okay,potionColumns:cols,potionOkay:potionOkay})).replace(/'/g,'%27'),callback=document.getElementById('qa_dom_callback');
  callback.setAttribute('href',"EXEC: if qa_dom_nonce="+nonce+": $qa_dom_last='"+data+"' & qa_dom_missing="+bad.length+" & qa_dom_text="+(text?1:0)+" & qa_dom_home="+(document.querySelector('#jo9_ui_home')?1:0)+" & qa_dom_city="+(document.querySelector('#jo9_ui_city')?1:0)+" & qa_dom_menu_ok="+okay+" & qa_dom_potion_ok="+potionOkay+" & qa_dom_rows="+rows.length+" & gs 'qa_checkpoint'");click(callback);
 }
 setTimeout(function(){go(0);},80);
};
