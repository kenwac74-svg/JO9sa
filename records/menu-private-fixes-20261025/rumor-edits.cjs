'use strict';
const assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
function buildRumorEdits(doc){
 const location='jo9_buyer_rumors',loc=doc.locations.find(l=>l.name===location);assert(loc);
 let body=c.shift(doc.lines[loc.body],5);const edits=[];
 function replace(old,next){assert.equal(body.split(old).length-1,1,'Unique rumor edit: '+old.slice(0,90));edits.push({location,field:'body',old,new:next,count:1});body=body.replace(old,()=>next);}
 for(const [provider,mark,exitLine,extra]of [
  ['skups','SKUPS',"\tfunc('$menu', 'goto_city', $menu_item_end_conv, guild, '#options', 'guild', '대화 종료')",true],
  ['barman','BARMAN',"\tfunc('$menu', 'exec_options', $menu_item_Leavebar, 'sp_txt = 1 & gt $curloc', '대화를 끝낸다')",false],
  ['anes','ANES',"FUNC('$menu', 'city_form', $menu_item_redlight, menu_leaveredlight_district, '카페를 떠난다')",false],
 ]){
  const block="! JO9 MOD START BUYER_RUMOR_MENU_"+mark+" | 2026-10-24_buyer_rumors\r\ngs 'jo9_buyer_rumors', 'menu', '"+provider+"'\r\n! JO9 MOD END BUYER_RUMOR_MENU_"+mark;
  if(extra){
   const exitBlock='! JO9 MOD START J9M2441 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included\r\n'+exitLine+'\r\n! JO9 MOD END J9M2441';
   replace(exitBlock+'\r\n'+block,block+'\r\n'+exitBlock);
  }else replace(exitLine+'\r\n'+block,block+'\r\n'+exitLine);
 }
 const lines=body.split('\r\n').filter(l=>l.includes("func('$menu', 'exec_options'")&&l.includes("''jo9_buyer_rumors''"));
 assert.equal(lines.length,4,'Consult, previous, next and back must all be repaired');
 for(const [index,line]of lines.entries()){
  const id=['CONSULT','PREVIOUS','NEXT','BACK'][index];
  const next=line.replace("func('$menu', 'exec_options'","func('$menu', 'exec'");
  replace(line,'! JO9 MOD START RUMOR_ANCHOR_'+id+'_20261025\r\n'+next+'\r\n! JO9 MOD END RUMOR_ANCHOR_'+id+'_20261025');
 }
 assert(body.includes("iif(jo9_rumor_discount[$jo9_rm_provider] = 1, 5, 10)"));
 assert(body.includes('sparks -= jo9_rm_fee'));
 return edits;
}
module.exports={buildRumorEdits};
