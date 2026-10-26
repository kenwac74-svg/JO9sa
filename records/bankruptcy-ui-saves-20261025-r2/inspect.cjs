'use strict';
// Independent, read-only inspection of native-created final saves.
// This script writes only its JSON report, never a .sav or a runtime file.
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const task='G:/Codex/tmp/bankruptcy-ui-saves-20261025-r2';
const pack=path.resolve(process.argv[2]||task+'/pack');
const referenceFile=path.resolve(process.argv[3]||task+'/verify/work-reference.sav');
const recipeFile=path.resolve(process.argv[4]||__dirname+'/recipes.json');
const reportFile=path.resolve(process.argv[5]||__dirname+'/independent-inspection.json');
if(/\.sav$/i.test(reportFile)||reportFile.toLowerCase().startsWith(path.resolve(game).toLowerCase()+path.sep))throw Error('Report must be outside runtime/save tree');
const parseJson=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const inputRecipes=parseJson(recipeFile),recipes=Array.isArray(inputRecipes)?inputRecipes:inputRecipes.recipes||inputRecipes.all||inputRecipes.files;
if(!Array.isArray(recipes)||recipes.length!==9)throw Error('Expected exactly nine final save recipes');
const referenceRaw=fs.readFileSync(referenceFile),reference=sc.parse(referenceRaw);
if(!sc.serialize(reference).equals(referenceRaw))throw Error('Native CRC reference does not roundtrip');
const crc=reference.lines[2];
const sourceRaw=fs.readFileSync(game+'/jack.qsp'),source=c.parse(sourceRaw);
const sourceHash=c.hash(sourceRaw),expectedSource='256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a';
if(sourceHash!==expectedSource)throw Error('WORK changed; inspection expectations require refresh');
const sourceDynamic=c.shift(source.lines[source.locations.find(l=>l.name==='#dynamic').body],5);
const roles=['slave','assistant','prisoner','farmhand','cow','harpy','pig','room1','room2','room3','room4',...Array.from({length:18},(_,i)=>'iced_'+(i+1))];
const diagnosticText=/jo9sv2_boot|jo9sv2_emit|qa_emit2|QA_R2_|jo9sv2_case|qa_profile_ui_done|qa_dom_finish/i;
const diagnosticName=/^(?:QA_|JO9SV|JO9SV2_|R2TEST_)/i;
const rows=[];
function inside(root,file){const rel=path.relative(root,file);return rel!==''&&!rel.startsWith('..')&&!path.isAbsolute(rel);}
function aliases(d,errors){
 const names=new Set(),slots=new Set();
 for(const v of d.vars){
  if(names.has(v.name))errors.push('Duplicate variable '+v.name);names.add(v.name);
  if(slots.has(v.slot))errors.push('Duplicate native slot '+v.slot);slots.add(v.slot);
  const keys=new Set();
  for(const [at,key]of v.idx){if(at<0||at>=v.values.length)errors.push('Invalid alias '+v.name+'.'+key);if(keys.has(key))errors.push('Duplicate alias '+v.name+'.'+key);keys.add(key);}
 }
}
function cachedInterior(d,errors){
 const val=(n,k)=>sc.value(d,n,k),str=(n,k)=>val(n,k)[1],changes=[];
 const roomSpecs=[['study','STUDY','STUDY',true,'home_lux'],['bedroom','BED','BED',true,'bedroom_lux'],['bathroom','BATH','BATH',+val('BATH')[0]>0,'bathroom_lux'],['dungeon','DUNGEON','DUNGEON',+val('DUNGEON')[0]>0,'dungeon_lux'],['kitchen','KITCHEN','KITCHEN',+val('KITCHEN')[0]>0,'kitchen_lux'],['lab','LAB','LAB',+val('LAB')[0]>0,'lab_lux'],['boudoir','BOUDOIR','BOUDOIR',+val('BOUDOIR')[0]>0,'boudoir_lux'],['barn','BARN','BARN',+val('BARN')[0]>0,'barn_lux']];
 for(const [room,field,stem,enabled,large]of roomSpecs){
  if(!enabled)continue;const style=str(field);
  const expected=room==='barn'?str('INTERIOR_BARN'):str('INTERIOR_'+stem,style),wide=room==='barn'?str('INTERIOR_BARN_LARGE'):str('INTERIOR_'+stem+'_LARGE',style);
  if(!expected||!wide){errors.push('Missing current interior lookup '+room+' style='+style);continue;}
  const actual=str('BG',room),actualWide=str('BG',large);
  if(actual!==expected)errors.push('Stale BG.'+room+': '+actual+' != '+expected);
  if(actualWide!==wide)errors.push('Stale BG.'+large+': '+actualWide+' != '+wide);
  changes.push({room,style,normal:actual,large:actualWide});
 }
 return changes;
}
function declarativeExpected(d,recipe,errors){
 const e=recipe.expected||recipe.expectState;if(!e||Array.isArray(e))return;
 if(e.location&&sc.dec(d.lines[10])!==e.location)errors.push('Expected location '+e.location);
 for(const [key,n]of Object.entries(e.numeric||{})){const [name,index]=key.split('.');if(+sc.value(d,name,index)[0]!==+n)errors.push('Expected '+key+'='+n);}
 for(const [key,t]of Object.entries(e.strings||{})){const [name,index]=key.split('.');if(sc.value(d,name,index)[1]!==t)errors.push('Expected '+key+'='+t);}
}
for(const recipe of recipes){
 const filename=recipe.file||recipe.filename||recipe.path;
 if(!filename)throw Error('Recipe lacks final filename: '+JSON.stringify(recipe).slice(0,200));
 const file=path.resolve(pack,filename);if(!inside(pack,file))throw Error('Final save outside pack');
 const errors=[];let row={id:recipe.id||filename,file:filename,pass:false,errors};
 try{
  const raw=fs.readFileSync(file),d=sc.parse(raw),val=(n,k)=>sc.value(d,n,k),num=(n,k)=>+val(n,k)[0],str=(n,k)=>val(n,k)[1];
  if(!sc.serialize(d).equals(raw))errors.push('Save byte roundtrip mismatch');
  if(d.lines[1]!=='5.7.0')errors.push('Unexpected save version');
  if(d.lines[2]!==crc)errors.push('CRC differs from current native WORK reference');
  const location=sc.dec(d.lines[10]);if(recipe.checkpoint&&location!==recipe.checkpoint)errors.push('Checkpoint '+location+' != '+recipe.checkpoint);
  if(str('ONGLOAD')!=='$ongload')errors.push('Normal load callback missing');
  if(str('ONOBJSEL')!=='$objsel')errors.push('Normal object callback missing');
  for(const name of ['COUNTER','ONNEWLOC','ONGSAVE'])if(str(name)!=='')errors.push('Unexpected callback '+name+'='+str(name));
  for(const name of ['AUTOSAVE','AUTOSAVE_DAY','AUTOSAVE_DECADE','DECADESAVE'])if(num(name)!==0)errors.push('Automatic save enabled '+name);
  const death=d.vars.find(v=>v.name==='DEATH');
  if(!death||!death.values[0]?.[1].includes("gt 'exit'"))errors.push('Incomplete native DEATH[0]');
  else if(!sourceDynamic.includes(death.values[0][1]))errors.push('DEATH[0] does not match current native source');
  for(const name of ['DEATH','ITEM_PRICE','ITEM_DESCRIPTION','ITEM_DEMO']){const v=d.vars.find(v=>v.name===name);if(!v||v.idx.some(([at])=>at===0))errors.push('Default scalar slot is aliased away: '+name);}
  aliases(d,errors);
  const occupied=[];
  for(const role of roles)if(num(role+'_state')!==0){if(num(role,'age')!==2)errors.push('Nonadult occupied test actor '+role);occupied.push({role,state:num(role+'_state'),type:num(role+'_type'),name:str(role+'_name'),age:num(role,'age')});}
  const header=d.lines.slice(0,d.start).map(sc.dec).join('\n');
  if(diagnosticText.test(header))errors.push('Diagnostic helper in saved header/draw text');
  const diagnosticVariables=d.vars.filter(v=>diagnosticName.test(v.name));
  if(diagnosticVariables.length)errors.push('Diagnostic variable records remain: '+diagnosticVariables.map(v=>v.name).join(','));
  let multilineScripts=0;
  for(const v of d.vars)for(const [,text]of v.values){if(diagnosticText.test(text))errors.push('Diagnostic helper retained in '+v.name);if(text.length>500&&/[\r\n]/.test(text))multilineScripts++;}
  if(multilineScripts<100)errors.push('Full multiline cached state appears truncated');
  const interior=cachedInterior(d,errors);
  if(location==='jo9_liquidation'){
   if(num('JO9_LQ','active')!==1)errors.push('Bankruptcy screen is not pending');
   if(num('SPARKS')>=num('JO9_LQ','bill'))errors.push('No shortage at bankruptcy start');
   const derived=num('JO9_LQ_VALUE','decor')>0?0:num('JO9_LQ_AVAILABLE','relocation')===1?1:num('JO9_LQ_SALE_PRICE','slave')>0?2:num('JO9_LQ_SALE_PRICE','assistant')>0?3:4;
   if(num('JO9_LQ','page')!==derived)errors.push('Not first remaining asset stage: page='+num('JO9_LQ','page')+' expected='+derived);
   if(!header.includes('jo9_bankruptcy_seizure.png')||!header.includes('파산 위기'))errors.push('Expected bankruptcy event image/title missing');
  }
  if(location==='slave_stat'||location==='assistant_stat'){
   if(num('JO9_LQ','active')!==0)errors.push('UI case accidentally enters pending bankruptcy');
   if(!header.includes('jo9_traits_view.js?v=20261025r2')||!header.includes('jo9_traits_view.css?v=20261025r2'))errors.push('Old trait UI cached resource link');
  }
  for(const key of ['JO9_GENIUS_TEXT','JO9_IDIOT_TEXT'])if(/[0-9%]/.test(str(key)))errors.push('Exact numeric trait explanation retained '+key);
  if(str('INDOLENT').includes('1.5'))errors.push('Old numeric cow trait description retained');
  declarativeExpected(d,recipe,errors);
  if(recipe.id==='contract-return'){
   const quest10=d.vars.find(v=>v.name==='QUEST')?.values[10]?.[1];
   if(!quest10||num('ACTIVE',quest10)!==1)errors.push('Guild contract quest is not active at initial checkpoint');
   if(str('ROOM4','contractor')!=='')errors.push('Contract return case is not a guild-owned trainee');
  }
  row={...row,pass:errors.length===0,bytes:raw.length,sha256:c.hash(raw),crc:sc.dec(d.lines[2]),location,variables:d.vars.length,multilineScripts,occupied,interior,state:{day:num('DAY'),money:num('SPARKS'),estate:str('ESTATE'),owner:num('OWNER'),kula:num('KULACONSTRUCT'),active:num('JO9_LQ','active'),bill:num('JO9_LQ','bill'),page:num('JO9_LQ','page'),decor:num('JO9_LQ_VALUE','decor'),relocation:num('JO9_LQ_VALUE','relocation'),relocationPeople:num('JO9_LQ_VALUE','relocation_people'),relocationRooms:num('JO9_LQ_VALUE','relocation_rooms'),relocationHouse:num('JO9_LQ_VALUE','relocation_house'),masterAP:num('MASTER_ENERGY')}};
 }catch(error){errors.push(error.stack||String(error));}
 rows.push(row);
}
let inputPreservation=null;
const inputsFile=fs.existsSync(task+'/inputs.json')?task+'/inputs.json':__dirname+'/inputs.json';
if(fs.existsSync(inputsFile)){const raw=parseJson(inputsFile),items=Array.isArray(raw)?raw:raw.files||raw.inputs;if(Array.isArray(items)){const changed=[];for(const v of items)if(c.hash(fs.readFileSync(v.path))!==v.sha256)changed.push(v.path);inputPreservation={count:items.length,changed};}}
const report={status:rows.length===9&&rows.every(r=>r.pass)&&(!inputPreservation||inputPreservation.changed.length===0)?'PASS':'FAIL',filesReviewed:rows.length,passCount:rows.filter(r=>r.pass).length,sourceHash,reference:{path:referenceFile,sha256:c.hash(referenceRaw),nativeCrc:sc.dec(crc)},inputPreservation,rows,limits:['Read-only save structure/cache/state inspection; actual native Game→Load and subsequent interaction are separately verified by the root.','CRC is compared with the provided native current-WORK reference; provenance/strict acceptance still requires native verification.']};
fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,files:rows.length,passed:report.passCount,report:reportFile,errors:rows.filter(r=>!r.pass).map(r=>({file:r.file,errors:r.errors}))}));
if(report.status!=='PASS')process.exitCode=1;
