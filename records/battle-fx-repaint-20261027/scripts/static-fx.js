
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
