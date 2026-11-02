'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
const materials=["lab_store['slime']","lab_store['koffe']","lab_store['kanabis']","lab_store['meth']","lab_store['opium']",'molar_of_wolf'];
const potions=['вакхический_нектар','тонизируюзщий_эликсир','целительный_бальзам','афродизиак','мощный_афодизиак','приворотное_зелье','вода_леты','brainwashing_potion','potion_of_mystra','жир_плюс','жир_минус','метаболизм_плюс','метаболизм_минус','chaotic_essence'];
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function body(doc,name){const l=doc.locations.find(x=>x.name===name);assert(l,'Missing '+name);return core.shift(doc.lines[l.body],5);}
function diagnostic(raw){
 const doc=core.parse(raw),source=body(doc,'master_stat'),cut=source.indexOf('*p \'<div id="left_column_master">\'');assert(cut>0,'Storage prefix boundary');
 // Actual production render code; only external normalization/layout/furniture dependencies are stubbed.
 const render=source.slice(0,cut);for(const name of ['$newloc','stats_layout','$furniture_list']){const l=doc.locations.find(x=>x.name===name);assert(l);doc.lines[l.body]=core.shift(name==='$furniture_list'?"$furniture_list='QA FURNITURE 2'":'! isolated no-op',-5);}
 const code=['DEBUG=1','autosave=0','decadesave=0','sound_on=0','snk_room_target=0','master_stat_screen=0','ui_style=2','slot=0','barn=1','qa_storage_checks=0','sparks=12345','spawn_semen=222','lab_items=9999','fridge_items=81',"$estate='QA'","estate_size['QA']=250","$jo9_storage_potions='STALE_GLOBAL_SENTINEL'",'xжир_минус=999'];
 materials.forEach((s,i)=>code.push(s+'='+(11+i)));potions.forEach((s,i)=>code.push(s+'='+(1+i)));
 let count=0;function check(cond,label){count++;code.push('if '+cond+':',' qa_storage_checks+=1','else',' msg '+quote('JO9_QA_STORAGE_FAIL_'+label),' exit','end');}
 for(const [n,lab,kitchen,fruit]of [['lab',1,1,0],['no-lab',0,0,0],['fruit',1,0,3]]){
  code.push('lab='+lab,'kitchen='+kitchen,"jo9_agraba_stock['fruit']="+fruit,"jo9_agraba_stock['wine']=0",'*clr',"gs 'qa_storage_render'",'$qa_storage_html=$maintxt');
  for(const cls of ['jo9-storage-food','jo9-storage-materials','jo9-storage-potions','jo9-storage-furniture'])check('instr($qa_storage_html,'+quote(cls)+')>0',n+'_column_'+cls);
  check('instr($qa_storage_html,'+quote('재료상자 [81]</u>')+')>0',n+'_material_count');
  check('instr($qa_storage_html,'+quote('물약상자 [105]</u>')+')>0',n+'_potion_count');
  for(const [label,value]of [['와그의 어금니',16],['지방-',11],['카오틱 에센스',14]])check('instr($qa_storage_html,'+quote(label+' *'+value)+')>0',n+'_quantity_'+value);
  const pMat='instr($qa_storage_html,'+quote('jo9-storage-materials')+')',pPot='instr($qa_storage_html,'+quote('jo9-storage-potions')+')',pWarg='instr($qa_storage_html,'+quote('와그의 어금니 *16')+')';
  check(pMat+'<'+pWarg+' and '+pWarg+'<'+pPot,n+'_warg_in_materials');
  check("sparks=12345 and spawn_semen=222 and lab_items=9999",n+'_resources_preserved');
  check("$jo9_storage_potions='STALE_GLOBAL_SENTINEL'",n+'_local_render_scope');
  materials.forEach((s,i)=>check(s+'='+(11+i),n+'_material_unchanged_'+i));
  potions.forEach((s,i)=>check(s+'='+(1+i),n+'_potion_unchanged_'+i));
  if(fruit>0)check('instr($qa_storage_html,'+quote('신선한 과일 *3')+')>0',n+'_fruit_without_kitchen');
 }
 for(const tab of [1,2,3]){
  code.push('master_stat_screen='+tab,'*clr',"gs 'qa_storage_render'",'$qa_storage_html=$maintxt');
  for(const cls of ['jo9-storage-food','jo9-storage-materials','jo9-storage-potions','jo9-storage-furniture'])check('instr($qa_storage_html,'+quote(cls)+')=0','tab_'+tab+'_no_'+cls);
 }
 const marker='JO9_QA_S20261102_storage_ui_COMPLETE';check('qa_storage_checks='+count,'check_count');code.push('msg '+quote(marker));
 doc.lines[doc.locations.find(x=>x.name==='Start').body]=core.shift(code.join('\r\n'),-5);
 doc.lines.splice(doc.lines.length-1,0,...['qa_storage_render','',render,'0'].map(s=>core.shift(s,-5)));doc.lines[3]=core.shift(String(doc.locations.length+1),-5);
 return {raw:core.serialize(doc),marker,assertions:count};
}
if(require.main===module){const [file,out]=process.argv.slice(2);assert(file&&out);const p=diagnostic(fs.readFileSync(file));fs.mkdirSync(out,{recursive:true});const target=path.resolve(out,'storage-ui.qsp');fs.writeFileSync(target,p.raw);fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'storage-ui',marker:p.marker,checkpoint:'actual-storage-render-only',file:target}],null,2));fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({source:path.resolve(file),sha256:core.hash(fs.readFileSync(file)),assertions:p.assertions},null,2));console.log(JSON.stringify({target,assertions:p.assertions}));}
module.exports={materials,potions,body,diagnostic};
