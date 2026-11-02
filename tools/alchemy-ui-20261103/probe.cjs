'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
const {materials,potions}=require('../storage-four-columns-20261102/probe.cjs');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function diagnostic(raw){
 const doc=core.parse(raw);
 function set(name,text){const l=doc.locations.find(x=>x.name===name);assert(l,name);doc.lines[l.body]=core.shift(text,-5);}
 // Actual complete shop_general runs. Stub only external layout and image-cycle wrappers.
 set('_layout','! isolated layout');set('interior_change','$result=$args[1]');
 const code=['DEBUG=1','autosave=0','decadesave=0','sound_on=0','snk_room_target=0','colosseum_fight=0','interaction_city=0','not_safe=0','skip_to=0','sp_txt=0','nsfw=0',"CONST_INT['slave_exist']=1",'assistant_state=1','slave_state=1',"assistant['alchemy']=4","assistant['enchanter']=2","slave['alchemy']=1","slave['enchanter']=3","$skill_grade[1]='D'","$skill_grade[2]='C'","$place_name['lab']='연구실'","$place_location['lab']='바티칸 교외'","$bg['lab']='lab'","$sp_text[0]='QA_NARRATIVE'",'sparks=12345','spawn_semen=222','lab_items=9999',"fridge['alcohol']=16",'qa_alchemy_checks=0'];
 materials.forEach((s,i)=>code.push(s+'='+(11+i)));potions.forEach((s,i)=>code.push(s+'='+(i+1)));
 const foreground='<div id="center_image_alchemist"><img src="QA_ACTOR.png"></div>';
 const menu='<div class="menu"><a href="EXEC: QA_CHOICE=1">QA_MENU</a> 안개 괴물 점액질</div>';
 let count=0;function check(condition,label){count++;code.push('if '+condition+':',' qa_alchemy_checks+=1','else',' msg '+quote('JO9_QA_ALCHEMY_FAIL_'+label),' exit','end');}
 for(const [name,role,actor]of [['assistant',1,true],['slave',0,true],['no-portrait',0,false]]){
  code.push("$place='lab'","assistant['alchemist_rule']="+role,"$display_options[0]="+quote('$text_display='+quote((actor?foreground:'')+menu)),'*clr',"gs 'shop_general'",'$qa_alchemy_html=$maintxt');
  check('instr($qa_alchemy_html,'+quote('id="jo9_lab_stock"')+')>0',name+'_stock_container');
  check('instr($qa_alchemy_html,'+quote('jo9-lab-materials')+')>0 and instr($qa_alchemy_html,'+quote('jo9-lab-potions')+')>0',name+'_two_columns');
  check('instr($qa_alchemy_html,'+quote('재료상자 [97]')+')>0 and instr($qa_alchemy_html,'+quote('물약상자 [105]')+')>0',name+'_category_totals');
  for(const text of ['증류주 *16','괴물 점액질 *11','와그의 어금니 *16','미스트라의 비약 *9','지방- *11','대사- *13','카오틱 에센스 *14'])check('instr($qa_alchemy_html,'+quote(text)+')>0',name+'_stock_'+text);
  check('instr($qa_alchemy_html,'+quote('QA_MENU')+')>0 and instr($qa_alchemy_html,'+quote('QA_NARRATIVE')+')>0',name+'_menu_and_narrative');
  check('instr($text_display,'+quote('안개 괴물 점액질')+')=0 and instr($text_display,'+quote('괴물 점액질')+')>0',name+'_cached_label');
  check('instr($qa_alchemy_html,'+quote('숙련도 (연금술 & 마녀술): '+(role?'C':'D'))+')>0',name+'_role_skill');
  if(actor){
   check('instr($text_display,'+quote('id="center_image_alchemist"')+')=0',name+'_foreground_removed_from_menu');
   check('instr($qa_alchemy_html,'+quote('<div id="bg">'+foreground+'</div>')+')>0',name+'_foreground_in_scene');
  }
  check("sparks=12345 and spawn_semen=222 and lab_items=9999 and fridge['alcohol']=16",name+'_resources_preserved');
  materials.forEach((s,i)=>check(s+'='+(11+i),name+'_material_'+i));potions.forEach((s,i)=>check(s+'='+(i+1),name+'_potion_'+i));
 }
 code.push("$place='QA_NON_LAB'","$place_info[$place]='QA_OTHER_INFO'","$display_options[0]="+quote('$text_display='+quote(foreground+menu)),'*clr',"gs 'shop_general'",'$qa_alchemy_html=$maintxt');
 check('instr($qa_alchemy_html,'+quote('id="jo9_lab_stock"')+')=0','nonlab_no_stock');
 check('instr($text_display,'+quote('id="center_image_alchemist"')+')>0','nonlab_foreground_unchanged');
 check('instr($qa_alchemy_html,'+quote('QA_OTHER_INFO')+')>0','nonlab_reference_unchanged');
 const onload=doc.locations.find(x=>x.name==='$ongload'),loadBody=core.shift(doc.lines[onload.body],5);
 const loadBlock=loadBody.match(/! JO9 MOD START ITEM_TERMS_CACHE_20261103\r\n([\s\S]*?)! JO9 MOD END ITEM_TERMS_CACHE_20261103/);
 code.push("$display_options[0]='도수높은 주류 x5 ($10)'","$sp_text[4]='안개 괴물의 점액질'","$gastronom_options[3]='도수높은 주류'","$lab_options[0]='안개 괴물 점액질'","$elixir_help[4]='안개 괴물의 점액질'","gs 'qa_term_cache'");
 for(const [v,expected]of [["$display_options[0]",'증류주 x5 ($10)'],["$sp_text[4]",'괴물 점액질'],["$gastronom_options[3]",'증류주'],["$lab_options[0]",'괴물 점액질'],["$elixir_help[4]",'괴물 점액질']])check(v+'='+quote(expected),'load_cache_'+v);
 const marker='JO9_QA_A20261103_alchemy_ui_COMPLETE';check('qa_alchemy_checks='+count,'check_count');code.push('msg '+quote(marker));set('Start',code.join('\r\n'));
 doc.lines.splice(doc.lines.length-1,0,...['qa_term_cache','',loadBlock?loadBlock[1]:'! unpatched terminology cache','0'].map(s=>core.shift(s,-5)));doc.lines[3]=core.shift(String(doc.locations.length+1),-5);
 return {raw:core.serialize(doc),marker,assertions:count};
}
if(require.main===module){const [file,out]=process.argv.slice(2);assert(file&&out);const r=diagnostic(fs.readFileSync(file));fs.mkdirSync(out,{recursive:true});const target=path.resolve(out,'alchemy-ui.qsp');fs.writeFileSync(target,r.raw);fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'alchemy-ui',marker:r.marker,checkpoint:'actual-complete-shop-general-isolated-layout',file:target}],null,2));fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({source:path.resolve(file),sha256:core.hash(fs.readFileSync(file)),assertions:r.assertions},null,2));console.log(JSON.stringify({target,assertions:r.assertions}));}
module.exports={diagnostic};
