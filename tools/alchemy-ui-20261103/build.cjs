'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
const {materials,potions}=require('../storage-four-columns-20261102/probe.cjs');
const names=['바커스의 술','자양 강장제','기적의 향유','최음제','배란 유발제','순애의 미약','저승의 강물','각인의 물약','미스트라의 비약','지방+','지방-','대사+','대사-','카오틱 에센스'];
const materialRows=[['증류주','fridge["alcohol"]'],['괴물 점액질','lab_store["slime"]'],['삼나무 진액','lab_store["koffe"]'],['낙원의 독말풀','lab_store["kanabis"]'],['요정의 가루','lab_store["meth"]'],['망각의 정수','lab_store["opium"]'],['와그의 어금니','molar_of_wolf']];
const icon=(name,size,align)=>`<img src="content/pic/ui/dialogue_emoji/${name}.png" width="${size}" height="${size}" style="vertical-align:${align}px">`;
const rowHtml=entries=>entries.map(([n,v])=>`${n} *<<${v}>>`).join('<br>');
function build(raw){
 const doc=core.parse(raw);assert(core.serialize(doc).equals(raw));const original=core.parse(raw),edits=[],terms=[];
 function body(name){const loc=doc.locations.find(x=>x.name===name);assert(loc,name);return core.shift(doc.lines[loc.body],5);}
 function replace(name,old,replacement,count=1){const loc=doc.locations.find(x=>x.name===name),text=body(name);assert.equal(text.split(old).length-1,count,'Anchor '+name);assert.notEqual(old,replacement);doc.lines[loc.body]=core.shift(text.replaceAll(old,replacement),-5);edits.push({location:name,field:'body',old,new:replacement,count});}
 for(const loc of doc.locations){
  if(loc.name==='jo9_reference_info')continue;
  for(const [old,replacement]of [['도수높은 주류','증류주'],['안개 괴물 점액질','괴물 점액질'],['안개 괴물의 점액질','괴물 점액질']]){
   const count=body(loc.name).split(old).length-1;if(count){replace(loc.name,old,replacement,count);terms.push({location:loc.name,old,new:replacement,count});}
  }
 }
 assert.equal(terms.reduce((n,t)=>n+t.count,0),12,'Expected visible terminology occurrences');
 replace('jo9_reference_info','도수높은 주류 x-?[0-9]+','(?:도수높은 주류|증류주) x-?[0-9]+');
 const normalize=v=>`${v} = replace(replace(replace(${v}, '도수높은 주류', '증류주'), '안개 괴물 점액질', '괴물 점액질'), '안개 괴물의 점액질', '괴물 점액질')`;
 const cache=[
  '! JO9 MOD START ITEM_TERMS_CACHE_20261103',
  '! Normalize only cached item names in existing saves; leave actions and stock variables intact.',
  'local jo9_term_i',
  "for jo9_term_i = 0 to arrsize('$display_options') - 1:",
  ' '+normalize('$display_options[jo9_term_i]'),'end',
  "for jo9_term_i = 0 to arrsize('$sp_text') - 1:",
  ' '+normalize('$sp_text[jo9_term_i]'),'end',
  normalize('$gastronom_options[3]'),normalize('$lab_options[0]'),normalize('$elixir_help[4]'),
  '! JO9 MOD END ITEM_TERMS_CACHE_20261103','',
 ].join('\r\n');
 replace('$ongload','! JO9 MOD START UI_RESOURCE_PATHS_20261027',cache+'! JO9 MOD START UI_RESOURCE_PATHS_20261027');
 const fore=[
  '! JO9 MOD START ALCHEMY_FOREGROUND_20261103',
  "if $place = 'lab':",
  " $text_display = replace(replace($text_display, '안개 괴물 점액질', '괴물 점액질'), '도수높은 주류', '증류주')",
  ' local jo9_lab_actor_start = instr($text_display, \'<div id="center_image_alchemist">\')',
  ' if jo9_lab_actor_start > 0:',
  '  local $jo9_lab_actor_tail = mid($text_display, jo9_lab_actor_start, len($text_display))',
  "  local jo9_lab_actor_end = instr($jo9_lab_actor_tail, '</div>')",
  '  if jo9_lab_actor_end > 0:',
  '   local $jo9_lab_actor = mid($jo9_lab_actor_tail, 1, jo9_lab_actor_end + 5)',
  "   $text_display = replace($text_display, $jo9_lab_actor, '')",
  '   *p \'<div id="bg">\' + $jo9_lab_actor + \'</div>\'',
  '  end',
  ' end',
  ' *p \'<style id="jo9_lab_foreground_fit">#bg>#center_image_alchemist{position:absolute;left:0;top:0;width:795px;height:595px;overflow:hidden;pointer-events:none;}#bg>#center_image_alchemist>img{position:absolute;left:212px;top:auto;bottom:0;max-width:795px;max-height:595px;width:auto;height:auto;display:block;}</style>\'',
  'end',
  '! JO9 MOD END ALCHEMY_FOREGROUND_20261103','',
 ].join('\r\n');
 replace('shop_general','! JO9 MOD START PLACE_STAGE_LIVE_GASTRONOM',fore+'! JO9 MOD START PLACE_STAGE_LIVE_GASTRONOM');
 const text=body('shop_general'),start=text.indexOf('! Brewing a potion in the laboratory'),end=text.indexOf('! JO9 MOD START PLACE_STAGE_PANEL_SOURCE');assert(start>0&&end>start);
 const oldLab=text.slice(start,end);
 const materialHeader=`<u>${icon('chest',19,-4)}재료상자 [<<jo9_lab_material_count>>]</u><br>`;
 const potionHeader=`<u>${icon('potion',24,-5)}물약상자 [<<jo9_lab_potion_count>>]</u><br>`;
 const newLab=[
  '! JO9 MOD START ALCHEMY_TWO_COLUMN_STOCK_20261103',
  "if $place = 'lab':",
  " if assistant['alchemist_rule'] = 1 and assistant_state = CONST_INT['slave_exist']:",
  "  brewing_skill = min(assistant['alchemy'], assistant['enchanter'])",
  ' else',
  "  brewing_skill = min(slave['alchemy'], slave['enchanter'])",
  ' end',
  " local jo9_lab_material_count = fridge['alcohol'] + "+materials.join(' + '),
  ' local jo9_lab_potion_count = '+potions.join(' + '),
  ' $jo9_place_live_info = \'<div style="font-family:경기천년제목 Medium;font-size:20px;line-height:125%;color:#000;white-space:nowrap">숙련도 (연금술 & 마녀술): <<$skill_grade[brewing_skill]>></div>\' + _',
  ` '<div class="jo9-lab-materials" style="position:absolute;left:0;top:50px;width:196px;height:520px;white-space:nowrap">${materialHeader}${rowHtml(materialRows)}</div>' + _`,
  ` '<div class="jo9-lab-potions" style="position:absolute;left:204px;top:50px;width:202px;height:520px;white-space:nowrap">${potionHeader}${rowHtml(names.map((n,i)=>[n,potions[i]]))}</div>'`,
  'end',
  '! JO9 MOD END ALCHEMY_TWO_COLUMN_STOCK_20261103','','',
 ].join('\r\n');
 replace('shop_general',oldLab,newLab);
 const labPanel=[
  "elseif $place = 'lab':",
  " $info_bar = ''",
  ' *p \'<div id="side_panel_main"><center><div style="font-size:40px;"><<$place_name[$place]>></div><<$place_location[$place]>><br></center></div>\'',
  ' *p \'<div id="jo9_lab_stock" style="position:absolute;left:847px;top:203px;width:406px;height:585px;text-align:left;font-family:Sandoll 미생;font-size:26px;font-weight:400;line-height:110%;color:#191970"><<$jo9_place_live_info>></div>\'',
  'elseif npc = 0:',
 ].join('\r\n');
 replace('shop_general','elseif npc = 0:',labPanel);
 const result=core.serialize(doc),parsed=core.parse(result);assert(core.serialize(parsed).equals(result));assert.equal(parsed.locations.length,original.locations.length);
 const allowed=new Set(edits.map(e=>original.locations.find(l=>l.name===e.location).body));
 for(let i=0;i<original.lines.length;i++)if(!allowed.has(i))assert.equal(parsed.lines[i],original.lines[i],'Unrelated field '+i);
 // User changes labels and layout only: the brewing engine remains byte-identical.
 assert.equal(parsed.lines[parsed.locations.find(l=>l.name==='interaction').body],original.lines[original.locations.find(l=>l.name==='interaction').body]);
 // shop_general retains old labels as migration inputs and changes label counts while
 // rebuilding its lab block. Store that field atomically so patch replay is idempotent.
 let shopStored=false;
 const storedEdits=edits.flatMap(e=>{
  if(e.location!=='shop_general')return [e];
  if(shopStored)return [];shopStored=true;
  return [{location:'shop_general',field:'body',old:core.shift(original.lines[original.locations.find(l=>l.name==='shop_general').body],5),new:body('shop_general'),count:1}];
 });
 const patch={id:'2026-11-03_alchemy_ui_terms',description:'Bottom-aligned clipped alchemy foreground; split ingredient/potion stocks; shorter Korean terms. No crafting rules or inventory changes.',before_sha256:core.hash(raw),after_sha256:core.hash(result),edits:storedEdits};
 return {raw:result,patch,shop:body('shop_general'),report:{beforeSha256:patch.before_sha256,afterSha256:patch.after_sha256,locations:parsed.locations.length,changedLocations:[...new Set(edits.map(e=>e.location))],editCount:storedEdits.length,sourceReplacements:edits.length,visibleTermOccurrences:12,terminology:terms,materials:materialRows.map(x=>x[0]),potions:names,foreground:{sourceX:216,backgroundX:4,imageLeft:212,height:595,bottom:0,clipped:true},roundtrip:true,unrelatedFieldsPreserved:true,brewingLogicPreserved:true,cssChanged:false}};
}
if(require.main===module){const [input,out]=process.argv.slice(2);assert(input&&out);const r=build(fs.readFileSync(input));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'jack.qsp'),r.raw);fs.writeFileSync(path.join(out,'patch.json'),JSON.stringify(r.patch,null,2));fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(r.report,null,2));fs.writeFileSync(path.join(out,'shop_general.qsps'),r.shop);console.log(JSON.stringify(r.report));}
module.exports={build};
