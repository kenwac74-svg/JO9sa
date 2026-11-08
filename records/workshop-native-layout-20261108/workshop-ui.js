/* JO9 MOD START WORKSHOP_NATIVE_LAYOUT_20261108 */
(function(root,factory){
 const module=factory();
 if(typeof exports==='object')Object.assign(exports,module);
 else root.JO9WorkshopUI=module.create(root.document,root);
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function dockHeight(value,closed,viewport){const expanded=Math.max(180,Math.min(Number.isFinite(value)?value:330,Math.max(180,viewport-100)));return {expanded,height:closed?48:expanded};}
 function create(document,events){
  const get=id=>document.getElementById(id),keys=['script','edit'];let selected='script';
  const buttons={script:get('workshopScriptTab'),edit:get('workshopEditTab')};
  function choose(value){
   if(!keys.includes(value))value='script';selected=value;
   get('workshopScriptPanel').hidden=value!=='script';get('workshopEditPanel').hidden=value!=='edit';get('dialogueAI').hidden=value!=='edit';
   for(const key of keys){buttons[key].setAttribute('aria-selected',String(key===value));buttons[key].tabIndex=key===value?0:-1;}
   events.dispatchEvent(new CustomEvent('jo9:workshop-mode',{detail:value}));
  }
  for(const key of keys)buttons[key].onclick=()=>choose(key);
  get('rangeTaskTabs').addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();const key=event.key==='Home'?'script':event.key==='End'?'edit':selected==='script'?'edit':'script';choose(key);buttons[key].focus();
  });
  choose('script');return {choose,current:()=>selected,dockHeight};
 }
 return {create,dockHeight};
});
/* JO9 MOD END WORKSHOP_NATIVE_LAYOUT_20261108 */
