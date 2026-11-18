'use strict';
// Builds an in-memory QSP candidate and declarative patch. Never writes an installed QSP.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const helperName='jo9_random_stock_allowed';
function checkedIds(values,label){
 assert(Array.isArray(values),label+' must be an explicit reviewed ID array');
 for(const id of values)assert(Number.isSafeInteger(id)&&id>0,label+' contains an invalid ID');
 return [...new Set(values)].sort((a,b)=>a-b);
}
function buildStage(raw,catalogue){
 assert(catalogue&&typeof catalogue==='object','A reviewed catalogue must be supplied');
 // Only the explicit exclusion list is consumed. Names or numeric ranges never imply uniqueness.
 const uniqueIds=checkedIds(catalogue.blockedIds||catalogue.ids,'blocked IDs');
 assert(uniqueIds.length>0,'A nonempty reviewed exclusion list is required');
 const compatibilityIds=checkedIds(catalogue.compatibilityDeniedIds||[1450],'compatibility exclusions');
 const blockedIds=[...new Set([...uniqueIds,...compatibilityIds,1448,1450,2339])].sort((a,b)=>a-b);
 const preservedIds=checkedIds(catalogue.preserveGenericIds||catalogue.preservedTemplateIds||[],'preserved generic IDs');
 const guaranteedGeneric=[...Array.from({length:18},(_,i)=>2586+i),...Array.from({length:728},(_,i)=>4000+i)];
 for(const id of [...preservedIds,...guaranteedGeneric])assert(!blockedIds.includes(id),'A preserved generic template was excluded: '+id);
 const doc=core.parse(raw);
 assert(!doc.locations.some(l=>l.name===helperName),'This source already contains the exclusion helper');
 const loc=doc.locations.find(l=>l.name==='generate_stock');assert(loc,'Missing generate_stock');
 const originalBody=core.shift(doc.lines[loc.body],5);
 const helperBody=[
  '! JO9 MOD START UNIQUE_RANDOM_FILTER_20261117',
  '! Live code, not a save-cached array. Only unrequested random selection calls this gate.',
  '! Explicit special_stock and quest acquisition paths remain outside this filter.',
  'result=1',
  'if args[0]<=0: result=0 & exit',
  "if instr('|"+blockedIds.join('|')+"|','|'+str(args[0])+'|')>0: result=0",
  '! JO9 MOD END UNIQUE_RANDOM_FILTER_20261117',
  ''
 ].join('\r\n');
 const specs=[
  ["if stock_type > 0 and stock_type ! 1448 and stock_type ! 1450 and stock_type ! 2339:",
   "! JO9 MOD START UNIQUE_RANDOM_FILTER_FALLBACK_20261117\r\n\t\t\tif func('"+helperName+"',stock_type)=1:\r\n\t\t\t\t! JO9 MOD END UNIQUE_RANDOM_FILTER_FALLBACK_20261117"],
  ["if stock_type = 1448 or (meta_type = 2 and stock_type = 1450): jump 'loop_type'",
   "! JO9 MOD START UNIQUE_RANDOM_FILTER_PICK_20261117\r\n\t\tif func('"+helperName+"',stock_type)=0: jump 'loop_type'\r\n\t\t! JO9 MOD END UNIQUE_RANDOM_FILTER_PICK_20261117"],
  ["if stock_type = 2339: jump 'loop_type'","! The shared live random-selection gate also covers the existing Yagisuna exclusion."]
 ];
 let changed=originalBody;
 const edits=specs.map(([old,replacement],i)=>{
  assert.equal(changed.split(old).length-1,1,'Expected exactly one generator selection anchor '+i);
  changed=changed.replace(old,replacement);
  return {location:'generate_stock',field:'body',old,new:replacement,count:1,patchId:'UNIQUE_RANDOM_FILTER_20261117'};
 });
 assert(changed.includes('if jo9_gen_type_tries > 32:'),'The existing type retry cap must remain');
 assert(changed.includes('if jo9_gen_meta_tries < 32:'),'The existing meta retry cap must remain');
 doc.lines[loc.body]=core.shift(changed,-5);
 const count=doc.locations.length+1;
 doc.lines[3]=core.shift(String(count),-5);
 doc.lines.pop();
 doc.lines.push(core.shift(helperName,-5),'',core.shift(helperBody,-5),core.shift('0',-5),'');
 const after=core.serialize(doc),parsed=core.parse(after);
 const patch={id:'2026-11-17_unique_random_filter',description:'Exclude reviewed unique characters from ordinary random stock and its bounded fallback; preserve explicit acquisition, all reviewed generic templates and the existing retry limits.',before_sha256:core.hash(raw),after_sha256:parsed.hash,edits,add_locations:[{name:helperName,body:helperBody,actions:[]}]};
 return {raw:after,patch,helperBody,helperName,blockedIds,uniqueIds,compatibilityIds,preservedIds,sourceHash:doc.hash,candidateHash:parsed.hash};
}
module.exports={buildStage,helperName};
if(require.main===module){
 const cataloguePath=process.argv[2];assert(cataloguePath,'Usage: node generator-stage.cjs <reviewed-catalogue.json> [source.qsp]');
 const source=process.argv[3]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
 const result=buildStage(fs.readFileSync(source),JSON.parse(fs.readFileSync(cataloguePath,'utf8')));
 const output=path.join(__dirname,'generator-stage.patch.json');
 fs.writeFileSync(output,JSON.stringify(result.patch,null,2)+'\n');
 process.stdout.write(JSON.stringify({output,sourceHash:result.sourceHash,candidateHash:result.candidateHash,uniqueIds:result.uniqueIds.length,blockedIds:result.blockedIds.length,preservedIds:result.preservedIds.length,installedQspWritten:false})+'\n');
}
