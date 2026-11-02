/* JO9 MOD START BATTLE_LOG_SCROLL_20261027
   Display-only: retain the complete log and its native vertical scrolling. */
(function () {
 'use strict';
 var root=document.getElementById('jo9_battle_test_v01'),log=root&&root.querySelector('#fight_txt');
 if(!log)return;
 var brs=log.querySelectorAll('br'),i,node,after;
 /* Remove only consecutive BR elements separated by whitespace-only text. */
 for(i=0;i<brs.length;i++)if(brs[i].parentNode){
  node=brs[i].nextSibling;
  while(node){
   if(node.nodeType===3&&!/\S/.test(node.nodeValue)){node=node.nextSibling;continue;}
   if(node.nodeType===1&&node.tagName==='BR'){after=node.nextSibling;node.parentNode.removeChild(node);node=after;continue;}
   break;
  }
 }
}());
/* JO9 MOD END BATTLE_LOG_SCROLL_20261027 */

/* JO9 MOD START BATTLE_FX_STATIC_LIFETIME_20261027 */
(function () {
 'use strict';
 var root=document.getElementById('jo9_battle_test_v01');
 var layer=root&&root.querySelector('#jo9_battle_fx_layer');
 if(!layer)return;
 function play(node,milliseconds){
  if(!node||node.__jo9StaticFxPlayed)return;
  node.__jo9StaticFxPlayed=true;
  node.style.visibility='visible';
  setTimeout(function(){
   if(document.getElementById('jo9_battle_test_v01')!==root)return;
   if(node.parentNode===layer)node.style.visibility='hidden';
  },milliseconds);
 }
 play(layer.querySelector('.jo9-battle-hit'),600);
 play(layer.querySelector('.jo9-battle-player-hit'),500);
}());
/* JO9 MOD END BATTLE_FX_STATIC_LIFETIME_20261027 */

/* JO9 MOD BATTLE_FOLLOWUP_20261028: execution is a persistent CSS filter and has no timer. */
