'use strict';
// Return surgical fantasy-creature quota edits. Never reads/writes a runtime file.
const assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
function buildTentacleEdits(doc){
 const bodies=new Map(),edits=[];
 function get(name){if(!bodies.has(name)){const loc=doc.locations.find(l=>l.name===name);assert(loc,name);bodies.set(name,c.shift(doc.lines[loc.body],5));}return bodies.get(name);}
 function replace(location,old,next){const body=get(location);assert.equal(body.split(old).length-1,1,'Unique quota edit '+location+': '+old.slice(0,100));edits.push({location,field:'body',old,new:next,count:1});bodies.set(location,body.replace(old,()=>next));}
 const ready="func('jo9_household_worker', 'tentacle_ready')";
 replace('jo9_household_worker',"$result=''\r\nlocal $jo9_rule",[
  '! JO9 MOD START TENTACLE_QUOTA_SHARED_20261025',
  "if $args[0] = 'tentacle_ready':",
  ' result = iif(pet_tentacle > 0 and tentacle_state ! 2 and spawn_milked <= tentacle_size, 1, 0)',
  ' exit',
  'end',
  "if $args[0] = 'tentacle_spent':",
  ' spawn_milked += max(args[1], iif(args[2] > 0, 1, 0))',
  ' if spawn_milked > tentacle_size: tentacle_state = 2',
  ' exit',
  'end',
  '! JO9 MOD END TENTACLE_QUOTA_SHARED_20261025',
  "$result=''",'local $jo9_rule'
 ].join('\r\n'));
 replace('jo9_household_worker',' if pet_tentacle<=0 or (tentacle_state!1 and spawn_milked!0): exit',
  ' if '+ready+' = 0 or (tentacle_state!1 and spawn_milked!0): exit');
 // Dedicated slave/assistant actions share readiness, including stale state/counter combinations.
 for(const role of ['assistant','slave']){
  const suffix=role==='assistant'?'A':'S';
  const old="\telseif tentacle_state = 2:\r\n\t\tfunc('$menu', 'exec', $menu_item_Milk_S_gray, empty, '착유 불가', '안개 괴물의 힘이 부족하다.')\r\n\telse\r\n\t\tfunc('$menu', 'goto', $menu_item_Milk_"+suffix;
  const next=old.replace('elseif tentacle_state = 2:','elseif '+ready+' = 0:');
  replace('menu_form',old,next);
 }
 // Only the fantasy item in the two education menus changes; other branches remain byte-identical.
 for(const role of ['slave','assistant']){
  const old="\telseif "+role+'["sub_tentacles"] <= 5:';
  const next=["\telseif "+ready+' = 0:',"\t\tfunc('$menu', 'exec', $menu_item_Fiend_gray, empty, '안개 괴물 작업 불가', '안개 괴물의 힘이 부족하다.')",old].join('\r\n');
  replace('menu_form',old,next);
 }
 // New-action setup dispatches. The rendered report/forward screen is untouched.
 const resultHead=get('interaction_result').split('\r\n').slice(0,3).join('\r\n');
 replace('interaction_result',resultHead,[
  '! JO9 MOD START TENTACLE_QUOTA_RESULT_ENTRY_20261025',
  'if interaction = 1354 or interaction = 7022 or (menu_Milk_A > 0 and interaction = menu_Milk_A) or (menu_Milk_S > 0 and interaction = menu_Milk_S):',
  " if "+ready+" = 0: gt 'menu_form'",
  'end',
  '! JO9 MOD END TENTACLE_QUOTA_RESULT_ENTRY_20261025',resultHead
 ].join('\r\n'));
 for(const [id,role,type]of [[1354,'slave','self_sex_lesson'],[7022,'assistant','self_sex_lesson_assistant']]){
  const old="if interaction = "+id+": $interaction_type = '"+type+"' & dynamic $replace($interaction_lesson_tentacles, 'dyn'+'slave', '"+role+"')";
  const next=['! JO9 MOD START TENTACLE_QUOTA_ENTRY_'+role.toUpperCase()+'_20261025','if interaction = '+id+':'," if "+ready+" = 0: gt 'menu_form'"," $interaction_type = '"+type+"'"," dynamic $replace($interaction_lesson_tentacles, 'dyn'+'slave', '"+role+"')",'end','! JO9 MOD END TENTACLE_QUOTA_ENTRY_'+role.toUpperCase()+'_20261025'].join('\r\n');
  replace('interaction',old,next);
 }
 for(const [suffix,role]of [['A','assistant'],['S','slave']]){
  const old='if interaction = menu_Milk_'+suffix+':\r\n';
  replace('interaction',old,old+" if "+ready+" = 0: gt 'menu_form'\r\n");
 }
 for(const [role,indent]of [['dynslave','\t\t'],['assistant','\t'],['slave','\t']]){
  const context=role==='dynslave'?"\t\tif dynslave['sub_tentacles'] > 5: $interaction_type = 'completed'\r\n":'';
  const old=context+indent+"$special_part = {\r\n"+indent+"\t$bg_path = func('display_pic', '"+role+"', 'tentacles', 'girls/sex_scenes/')";
  const next=context+indent+"$special_part = {\r\n"+indent+'\tlocal jo9_tentacle_before = spawn_semen\r\n'+indent+"\t$bg_path = func('display_pic', '"+role+"', 'tentacles', 'girls/sex_scenes/')";
  replace('interaction',old,next);
  const cost=indent+"\tspawn_milked += "+role+"['sub_tentacles']";
  replace('interaction',cost,indent+"\tgs 'jo9_household_worker', 'tentacle_spent', "+role+"['sub_tentacles'], spawn_semen - jo9_tentacle_before");
 }
 // The original auto report consumes only on its successful branch; retain that placement.
 for(const role of ['slave','assistant','room1','room2','room3','room4']){
  const old="\t\tspawn_milked += "+role+"['sub_tentacles']";
  replace('end_day_screen',old,"\t\tgs 'jo9_household_worker', 'tentacle_spent', "+role+"['sub_tentacles'], jo9_tentacle_report['"+role+"_gain']");
 }
 return edits;
}
module.exports={buildTentacleEdits};
