'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs'),{body,materials,potions}=require('./probe.cjs');
const materialRows=[['안개 괴물 점액질','lab_store["slime"]'],['삼나무 진액','lab_store["koffe"]'],['낙원의 독말풀','lab_store["kanabis"]'],['요정의 가루','lab_store["meth"]'],['망각의 정수','lab_store["opium"]'],['와그의 어금니','molar_of_wolf']];
const potionNames=['바커스의 술','자양 강장제','기적의 향유','최음제','배란 유발제','순애의 미약','저승의 강물','각인의 물약','미스트라의 비약','지방+','지방-','대사+','대사-','카오틱 에센스'];
const icon=(name,size,align)=>`<img src="content/pic/ui/dialogue_emoji/${name}.png" width="${size}" height="${size}" style="vertical-align:${align}px">`;
const chest=icon('chest',19,-4),potion=icon('potion',24,-5),bread=icon('bread',19,-4);
function rows(target,header,entries){return `${target} = '${header}<br>' + _\r\n`+entries.map(([label,v],i)=>` '${label} *<<${v}>>${i<entries.length-1?'<br>':''}'${i<entries.length-1?' + _':''}`).join('\r\n');}
function build(raw){
 const doc=core.parse(raw);assert(core.serialize(doc).equals(raw),'Byte-exact roundtrip');
 const loc=doc.locations.find(x=>x.name==='master_stat');assert(loc);
 let source=body(doc,'master_stat');const original=source,edits=[];
 function replace(old,replacement){assert(old&&old!==replacement);assert.equal(source.split(old).length-1,1,'Unique patch anchor');source=source.replace(old,replacement);edits.push({location:'master_stat',field:'body',old,new:replacement,count:1});}
 replace(`<div style="line-height:50%"></div><u>${bread}식품 저장고</u> : [<<fridge_items>>/<<estate_size[$estate]>>]<br><div style="line-height:50%"></div>`,`<u>${bread}식품 저장고 [<<fridge_items>>/<<estate_size[$estate]>>]</u><br>`);
 const start=source.indexOf('if lab > 0:\r\n'),end=source.indexOf('! JO9 MOD START J9M1562');assert(start>0&&end>start);
 const oldBlock=source.slice(start,end);
 assert(oldBlock.endsWith('end\r\n\r\n'),'Complete old lab branch');
 const newBlock=[
  '! JO9 MOD START STORAGE_FOUR_COLUMNS_20261102',
  'local jo9_storage_materials_count = '+materials.join(' + '),
  'local jo9_storage_potions_count = '+potions.join(' + '),
  "local $jo9_storage_potions = ''",
  rows('$middle_text_list',`<u>${chest}재료상자 [<<jo9_storage_materials_count>>]</u>`,materialRows),
  rows('$jo9_storage_potions',`<u>${potion}물약상자 [<<jo9_storage_potions_count>>]</u>`,potionNames.map((n,i)=>[n,potions[i]])),
  '! JO9 MOD END STORAGE_FOUR_COLUMNS_20261102','',
 ].join('\r\n')+'\r\n';
 replace(oldBlock,newBlock);
 replace(`<u>${chest}가구 및 용품</u> [<<house_items>>]:<br>`,`<u>${chest}가구 및 용품 [<<house_items>>]</u><br>`);
 const renderOld=[
  '! JO9 MOD START AGRABA_SPECIAL_FOOD_STORAGE_CLASS_20261030',
  '\t*p \'<div id = "left_text" class="jo9-agraba-food-storage"><<$left_text_list>></div>\'',
  '! JO9 MOD END AGRABA_SPECIAL_FOOD_STORAGE_CLASS_20261030',
  '\t*p \'<div id = "middle_text"><<$middle_text_list>></div>\'',
  '\t*p \'<div id = "right_text"><<$right_text_list>></div>\'',
 ].join('\r\n');
 const columns=[['left_text','jo9-agraba-food-storage jo9-storage-food',270,210,'$left_text_list'],['middle_text','jo9-storage-materials',488,185,'$middle_text_list'],['jo9_storage_potions','jo9-storage-potions',681,180,'$jo9_storage_potions'],['right_text','jo9-storage-furniture',869,170,'$right_text_list']];
 const renderNew=['! JO9 MOD START STORAGE_FOUR_COLUMNS_RENDER_20261102',...columns.map(([id,cls,x,w,v])=>`\t*p '<div id="${id}" class="${cls}" style="position:absolute;left:${x}px;top:40px;width:${w}px;height:540px;text-align:left;font-family:Sandoll 미생;font-size:26px;font-weight:400;line-height:110%;color:#191970;white-space:nowrap"><<${v}>></div>'`),'! JO9 MOD END STORAGE_FOUR_COLUMNS_RENDER_20261102'].join('\r\n');
 replace(renderOld,renderNew);
 doc.lines[loc.body]=core.shift(source,-5);const candidate=core.serialize(doc),parsed=core.parse(candidate),originalDoc=core.parse(raw);
 assert(core.serialize(parsed).equals(candidate));assert.equal(parsed.locations.length,originalDoc.locations.length);
 for(let i=0;i<originalDoc.lines.length;i++)if(i!==loc.body)assert.equal(parsed.lines[i],originalDoc.lines[i],'Unrelated field changed '+i);
 assert.equal(source.slice(source.indexOf('*p \'<div id="left_column_master">\'')),original.slice(original.indexOf('*p \'<div id="left_column_master">\'')),'Non-storage tabs and profile preserved');
 const patch={id:'2026-11-02_storage_four_columns',description:'Approved inventory UI: food, six materials, fourteen potions, furniture; preserve inventory and crafting; correct fat-minus display reference.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
 return {raw:candidate,patch,source,report:{schema:1,beforeSha256:patch.before_sha256,afterSha256:patch.after_sha256,locations:parsed.locations.length,changedLocations:['master_stat'],edits:edits.length,materials:materialRows.map(x=>x[0]),potions:potionNames,columns:columns.map(([id,cls,x,width])=>({id,x,width,top:40,height:540,font:'Sandoll 미생',fontSize:26,lineHeight:'110%'})),roundtrip:true,unrelatedFieldsPreserved:true,nonStorageTabsAndProfilePreserved:true,externalCssChanged:false}};
}
if(require.main===module){const [input,out]=process.argv.slice(2);assert(input&&out);const r=build(fs.readFileSync(input));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'jack.qsp'),r.raw);fs.writeFileSync(path.join(out,'patch.json'),JSON.stringify(r.patch,null,2)+'\n');fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(r.report,null,2)+'\n');fs.writeFileSync(path.join(out,'master_stat.qsps'),r.source);console.log(JSON.stringify(r.report));}
module.exports={build};
