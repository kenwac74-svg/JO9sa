'use strict';
// JO9 MOD START APPEARANCE_SHARING_20261117
// Shared by the checklist and character editor. Game saves receive no new fields.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const outfits=['title','naked','apron','maid','secr','dom','nurse','school','sorc','leotard','chainmail','kimono','sundress','lace','cocktail','latex','exotic','corset','gorgeous','bride','tail','cow','pet','restrain'];
const imageFields=new Set(['fullimage','fullmade','fullsecretary','fullmistress','fullpregnant','seed_ava','seed_ava_gray','seed_ava_clear',...outfits.flatMap(role=>['indpack_'+role,'indpack_'+role+'_horny','indpack_'+role+'_rebel'])]);
const slots=[['indpack_naked'],['indpack_title'],['fullmade','indpack_maid'],['fullsecretary','indpack_secr'],['fullmistress','indpack_dom'],['fullpregnant'],['seed_ava'],['seed_ava_gray'],['seed_ava_clear'],...outfits.filter(role=>!['title','naked','maid','secr','dom'].includes(role)).map(role=>['indpack_'+role]),...outfits.flatMap(role=>[['_horny',role],['_rebel',role]].map(([suffix,role])=>['indpack_'+role+suffix]))];
const validId=id=>(Number.isSafeInteger(id)&&id>=0)||(typeof id==='string'&&/^json:[^\\/<>:"|?*\x00-\x1f]+\.json$/i.test(id));
const key=id=>typeof id+':'+id;
const sorted=ids=>[...new Map(ids.map(id=>[key(id),id])).values()].sort((a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b)));
function patchStrings(source,updates){
 const edits=[],missing=[];
 for(const [field,value] of Object.entries(updates)){
  const matches=[...source.matchAll(new RegExp('"'+field+'"\\s*:\\s*','g'))];
  if(matches.length>1)throw Error('Duplicate JSON key: '+field);
  if(!matches.length){missing.push([field,value]);continue;}
  const at=matches[0].index+matches[0][0].length;
  if(source[at]!=='"')throw Error('Image field is not a string: '+field);
  let end=at+1;for(;end<source.length;end++){if(source[end]==='\\')end++;else if(source[end]==='"')break;}
  if(end===source.length)throw Error('Unterminated JSON string');
  edits.push({at,end:end+1,text:JSON.stringify(value)});
 }
 let out=source;for(const edit of edits.sort((a,b)=>b.at-a.at))out=out.slice(0,edit.at)+edit.text+out.slice(edit.end);
 if(missing.length){const at=out.lastIndexOf('}'),before=out.slice(0,at).replace(/\s*$/,''),nl=out.includes('\r\n')?'\r\n':'\n',indent=out.match(/\r?\n([ \t]+)"/)?.[1]||'    ',has=Object.keys(JSON.parse(source.replace(/^\uFEFF/,''))).length>0;out=before+(has?',':'')+nl+missing.map(([field,value])=>indent+JSON.stringify(field)+': '+JSON.stringify(value)).join(','+nl)+nl+out.slice(at);}
 JSON.parse(out.replace(/^\uFEFF/,''));return Buffer.from(out,'utf8');
}
function create(game,options={}){
 game=path.resolve(game);if(fs.lstatSync(game).isSymbolicLink())throw Error('Linked game roots are not supported');game=fs.realpathSync(game);
 const policyRelative='modtools/character-image-sharing.json';let cached,imageCache=new Map();
 function guarded(relative,missing=false){
  if(typeof relative!=='string'||!relative||relative.includes('\0'))throw Error('Invalid relative path');
  const parts=relative.replaceAll('\\','/').split('/');if(parts.some(part=>!part||part==='.'||part==='..'||/[<>:"|?*]/.test(part)))throw Error('Path outside game root');
  let target=game;for(const part of parts){target=path.join(target,part);try{if(fs.lstatSync(target).isSymbolicLink())throw Error('Linked paths are not supported: '+relative);}catch(e){if(e.code!=='ENOENT'||!missing)throw e;}}
  const rel=path.relative(game,target);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Path outside game root');return target;
 }
 function image(value,required=false){
  const cacheKey=String(required)+':'+value;if(imageCache.has(cacheKey))return imageCache.get(cacheKey);
  try{if(typeof value!=='string'||!value)return null;let rel=value.replaceAll('\\','/').replace(/^content\/pic\//i,'');if(!/\.png$/i.test(rel)){if(path.posix.extname(rel))return null;rel+='.png';}const full=guarded('content/pic/'+rel,!required);if(required&&!fs.statSync(full).isFile())return null;const result={rel,full,key:full.toLowerCase()};imageCache.set(cacheKey,result);return result;}catch(e){if(required){imageCache.set(cacheKey,null);return null;}throw e;}
 }
 function load(fresh=false){
  if(cached&&!fresh)return cached;
  imageCache=new Map();
  const dir=guarded('json/slaves'),names=fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isFile()&&!e.isSymbolicLink()&&/\.json$/i.test(e.name)).map(e=>e.name).sort();
  const number=name=>{const match=name.match(/^(\d+)(?:_|\.json$)/i);const n=match?Number(match[1]):null;return Number.isSafeInteger(n)?n:null;},counts=new Map();for(const name of names){const n=number(name);if(n!==null)counts.set(n,(counts.get(n)||0)+1);}
  const records=new Map(),errors=new Map();for(const name of names){const n=number(name),id=n!==null&&counts.get(n)===1?n:'json:'+name;try{const file=guarded('json/slaves/'+name),bytes=fs.readFileSync(file),data=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Character JSON must be an object');records.set(key(id),{id,file,json:'json/slaves/'+name,bytes,data,sha:hash(bytes)});}catch(e){if(e.message.startsWith('Linked'))throw e;errors.set(key(id),{id,json:'json/slaves/'+name,error:e.message});}}
  const policyFile=guarded(policyRelative,true),policyBytes=fs.existsSync(policyFile)?fs.readFileSync(policyFile):Buffer.alloc(0),policy=policyBytes.length?JSON.parse(policyBytes.toString('utf8').replace(/^\uFEFF/,'')):{version:1,groups:[],families:[]};
  if(policy.version!==1||!Array.isArray(policy.groups)||!Array.isArray(policy.families))throw Error('Invalid appearance sharing policy');
  const assigned=new Set();for(const group of policy.groups){if(!Array.isArray(group)||!group.length||group.some(id=>!validId(id)||assigned.has(key(id))))throw Error('Invalid appearance sharing group');for(const id of group)assigned.add(key(id));}for(const family of policy.families)if(!Array.isArray(family)||family.some(id=>!validId(id)))throw Error('Invalid appearance sharing family');
  return cached={records,errors,policy,policyFile,policyBytes,policyHash:hash(policyBytes)};
 }
 function record(state,id){if(!validId(id)||!state.records.has(key(id)))throw Error('Character JSON does not exist: '+id);return state.records.get(key(id));}
 function defaultGroups(state){
  if(state.defaultGroups)return state.defaultGroups;
  const groups=[],used=new Set(),byBase=new Map(),explicit=new Set(state.policy.groups.flat().map(key));
  for(const rec of state.records.values()){if(explicit.has(key(rec.id)))continue;let base;try{base=image(rec.data.fullimage);}catch{}if(base){if(!byBase.has(base.key))byBase.set(base.key,[]);byBase.get(base.key).push(rec.id);}}
  for(const members of byBase.values())groups.push(members);
  const pelageya=[2577,2585,2607].filter(id=>state.records.has(key(id))&&!explicit.has(key(id)));
  if(pelageya.length){let merged=[...pelageya];for(let i=groups.length-1;i>=0;i--)if(groups[i].some(id=>pelageya.includes(id)))merged.push(...groups.splice(i,1)[0]);groups.push(sorted(merged));}
  for(const group of state.policy.groups)groups.push(group.filter(id=>state.records.has(key(id))));
  for(const group of groups)for(const id of group)used.add(key(id));for(const rec of state.records.values())if(!used.has(key(rec.id)))groups.push([rec.id]);state.defaultGroups=groups.filter(group=>group.length).map(sorted);state.memberMap=new Map();for(const group of state.defaultGroups)for(const id of group)state.memberMap.set(key(id),group);return state.defaultGroups;
 }
 function members(state,id){record(state,id);defaultGroups(state);return state.memberMap.get(key(id))||[id];}
 function writableMembers(state,id){
  const group=members(state,id),explicit=state.policy.groups.find(group=>group.some(peer=>key(peer)===key(id))),assigned=new Set(state.policy.groups.flat().map(key)),legacy=[2577,2585,2607].filter(peer=>!assigned.has(key(peer)));
  const expected=sorted([...group,...(explicit||((group.some(peer=>legacy.includes(peer)))?legacy:[]))]);
  for(const peer of expected)if(!state.records.has(key(peer))){const failure=state.errors.get(key(peer));throw Error('Shared character JSON is unavailable: '+peer+(failure?' ('+failure.json+': '+failure.error+')':''));}
  return group;
 }
 function candidateIds(state,id){
  record(state,id);if(state.candidateMap)return state.candidateMap.get(key(id))||[id];
  const sameBase=new Map();for(const rec of state.records.values()){let base;try{base=image(rec.data.fullimage);}catch{}if(base){if(!sameBase.has(base.key))sameBase.set(base.key,[]);sameBase.get(base.key).push(rec.id);}}
  const families=[...sameBase.values(),...state.policy.families,...defaultGroups(state)],parent=new Map([...state.records.keys()].map(k=>[k,k]));
  const find=k=>{while(parent.get(k)!==k){parent.set(k,parent.get(parent.get(k)));k=parent.get(k);}return k;};
  for(const family of families){const present=family.filter(peer=>parent.has(key(peer)));if(!present.length)continue;for(const peer of present)parent.set(find(key(peer)),find(key(present[0])));}
  const components=new Map();for(const rec of state.records.values()){const root=find(key(rec.id));if(!components.has(root))components.set(root,[]);components.get(root).push(rec.id);}state.candidateMap=new Map();for(const group of components.values())for(const peer of group)state.candidateMap.set(key(peer),sorted(group));return state.candidateMap.get(key(id))||[id];
 }
 function effective(state,id,override){
  const rec=record(state,id),data=override===undefined?rec.data:override;if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Image data override must be an object');const out={...data};
  for(const fields of slots){if(fields.some(field=>own(data,field)))continue;const choices=new Map();
   for(const peer of members(state,id)){if(key(peer)===key(id))continue;const donor=record(state,peer).data;const field=fields.find(field=>typeof donor[field]==='string'&&donor[field]);if(!field)continue;const img=image(donor[field],true);if(img)choices.set(img.key,{field,value:donor[field]});}
   if(choices.size===1){const choice=choices.values().next().value;out[choice.field]=choice.value;}
  }
  return out;
 }
 function describe(id){const state=load(),rec=record(state,id),group=members(state,id),result=effective(state,id);return {id,expectedHash:rec.sha,policyHash:state.policyHash,members:group,candidates:candidateIds(state,id).filter(peer=>key(peer)!==key(id)).map(peer=>{const rec=record(state,peer);return {id:peer,name:rec.data.seed_name||path.basename(rec.json,'.json'),json:rec.json,checked:group.some(member=>key(member)===key(peer))};}),inheritedFields:Object.keys(result).filter(field=>!own(rec.data,field)).sort()};}
 function copyTarget(state,id,field,source,sourceBytes){
  const prefix=typeof id==='number'?String(id):'json_'+hash(id).slice(0,10),stamp=hash(source.rel+'\0'+hash(sourceBytes)).slice(0,12),dedicated=['girls/full/','girls/face/','girls/sex_scenes/'].some(dir=>{try{return fs.statSync(guarded('content/pic/'+dir+prefix)).isDirectory();}catch{return false;}});
  let folder;
  if(field.startsWith('seed_ava'))folder='girls/face'+(dedicated?'/'+prefix:'');
  else if(dedicated)folder='girls/full/'+prefix;
  else if(field==='indpack_title')folder='characters';
  else if(['fullmade','indpack_maid'].includes(field))folder='girls/full/cloth';
  else if(['fullsecretary','indpack_secr'].includes(field))folder='girls/full/secretary';
  else if(['fullmistress','indpack_dom'].includes(field))folder='girls/full/mistress';
  else if(['fullimage','indpack_naked'].includes(field))folder='girls/full';
  else folder=path.posix.dirname(source.rel);
  const name=prefix+'_shared_'+field+'_'+stamp+'.png';return {rel:folder+'/'+name,full:guarded('content/pic/'+folder+'/'+name,true)};
 }
 function planning(input){
  const state=load(true),{id,expectedHash,policyHash}=input,rec=record(state,id);
  if(expectedHash!==rec.sha||policyHash!==state.policyHash)throw Error('Character or sharing policy changed; refresh the preview');
  writableMembers(state,id);
  if(!Array.isArray(input.peerIds)||input.peerIds.some(peer=>!validId(peer)||key(peer)===key(id)))throw Error('Invalid sharing peer list');
  const candidates=candidateIds(state,id);if(input.peerIds.some(peer=>!candidates.some(candidate=>key(candidate)===key(peer))))throw Error('Sharing peer is not a candidate');for(const peer of input.peerIds)writableMembers(state,peer);
  const chosen=sorted([id,...input.peerIds]),chosenKeys=new Set(chosen.map(key)),oldGroups=defaultGroups(state),involved=oldGroups.filter(group=>group.some(peer=>chosenKeys.has(key(peer)))),removed=sorted(involved.flat().filter(peer=>!chosenKeys.has(key(peer)))),affectedIds=sorted([...chosen,...removed]);
  const source=effective(state,id),updates=new Map(),copies=[],copyBySource=new Map(),outsideRefs=new Set();
  if(removed.length)for(const other of state.records.values())if(!chosenKeys.has(key(other.id)))for(const [field,value]of Object.entries(effective(state,other.id)))if(imageFields.has(field)&&value){const ref=image(value,true);if(ref)outsideRefs.add(ref.key);}
  const shared={...source};
  if(removed.length)for(const [field,value]of Object.entries(source))if(imageFields.has(field)&&value){const ref=image(value,true);if(!ref)throw Error('Cannot detach a missing or unsafe image: '+field);if(!outsideRefs.has(ref.key))continue;
   let target=copyBySource.get(ref.key);if(!target){const bytes=fs.readFileSync(ref.full);target=copyTarget(state,id,field,ref,bytes);const exists=fs.existsSync(target.full);if(exists&&!fs.readFileSync(target.full).equals(bytes))throw Error('Detached image target already exists with different bytes');target={...target,source:ref,bytes,exists};copyBySource.set(ref.key,target);if(!exists)copies.push(target);}
   const pref=value.replaceAll('\\','/').toLowerCase().startsWith('content/pic/')?'content/pic/':'';shared[field]=pref+target.rel.replace(/\.png$/i,'');
  }
  for(const peer of chosen){const data=record(state,peer).data,update={};for(const field of new Set([...Object.keys(data),...Object.keys(shared)]))if(imageFields.has(field)){const value=own(shared,field)?shared[field]:'';if(typeof value==='string'&&data[field]!==value)update[field]=value;}if(Object.keys(update).length)updates.set(key(peer),{rec:record(state,peer),fields:update});}
  const untouched=state.policy.groups.filter(group=>!group.some(peer=>affectedIds.some(id=>key(peer)===key(id)))),partitions=involved.map(group=>group.filter(peer=>!chosenKeys.has(key(peer)))).filter(group=>group.length),groups=[...untouched,...partitions,chosen].map(sorted).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  let family=sorted([...candidateIds(state,id),...affectedIds]);const families=[];for(const existing of state.policy.families){if(existing.some(peer=>family.some(id=>key(peer)===key(id))))family=sorted([...family,...existing]);else families.push(existing);}families.push(family);const policy={version:1,groups,families};
  const changes=[...updates.values()].map(update=>({id:update.rec.id,json:update.rec.json,fields:Object.keys(update.fields).sort()}));
  const result={id,peerIds:chosen.filter(peer=>key(peer)!==key(id)),expectedHash,policyHash,affectedIds,changes,copies:copies.map(copy=>({from:copy.source.rel,to:copy.rel,bytes:copy.bytes.length})),copyCount:copies.length,copyBytes:copies.reduce((sum,copy)=>sum+copy.bytes.length,0)};
  const revision=[...state.records.values()].map(rec=>[rec.id,rec.sha]);const copyRevision=[...copyBySource.values()].map(copy=>[copy.source.rel,hash(copy.bytes),copy.rel,copy.exists]);
  result.planHash=hash(JSON.stringify({result,revision,copyRevision,policy}));return {state,result,updates,copies,policy,sources:[...copyBySource.values()]};
 }
 function transaction(state,updates,copies,policy,sources=[]){
  const writes=[...updates.values()].map(update=>({file:update.rec.file,before:update.rec.bytes,next:patchStrings(update.rec.bytes.toString('utf8'),update.fields)}));
  if(policy)writes.push({file:state.policyFile,before:state.policyBytes.length?state.policyBytes:null,next:Buffer.from(JSON.stringify(policy,null,2)+'\n')});
  const made=[],written=[],createdDirs=[],temporaries=[];let historyDir;
  function ensure(folder){if(fs.existsSync(folder))return;ensure(path.dirname(folder));fs.mkdirSync(folder);createdDirs.push(folder);}
  const currentHash=file=>fs.existsSync(file)?hash(fs.readFileSync(file)):null;
  function temporary(file,bytes){const temp=file+'.sharing-'+crypto.randomBytes(7).toString('hex')+'.tmp';temporaries.push(temp);fs.writeFileSync(temp,bytes,{flag:'wx'});return temp;}
  function atomic(file,bytes){fs.renameSync(temporary(file,bytes),file);}
  // Recheck the complete request snapshot before creating any backup, copy, or JSON.
  for(const rec of state.records.values()){guarded(rec.json);if(currentHash(rec.file)!==rec.sha)throw Error('Character JSON changed before applying sharing');}
  guarded(policyRelative,true);if(currentHash(state.policyFile)!==(state.policyBytes.length?state.policyHash:null))throw Error('Sharing policy changed before applying');
  for(const source of sources){guarded('content/pic/'+source.source.rel);if(currentHash(source.source.full)!==hash(source.bytes))throw Error('Copy source changed before applying sharing');}
  try{
   if(writes.length){const historyRoot=options.historyRoot?path.resolve(options.historyRoot):guarded('modtools/character-image-sharing-history',true);const inside=path.relative(game,historyRoot);if(inside.startsWith('..')||path.isAbsolute(inside))throw Error('History must remain inside the game root');guarded(inside.replaceAll('\\','/'),true);ensure(historyRoot);historyDir=path.join(historyRoot,Date.now()+'-'+crypto.randomBytes(5).toString('hex'));ensure(historyDir);for(let i=0;i<writes.length;i++)if(writes[i].before)fs.writeFileSync(path.join(historyDir,i+'-before.bin'),writes[i].before,{flag:'wx'});fs.writeFileSync(path.join(historyDir,'manifest.json'),JSON.stringify(writes.map((write,index)=>({file:path.relative(game,write.file).replaceAll('\\','/'),before:write.before?index+'-before.bin':null,after:hash(write.next)})),null,2));}
   for(const copy of copies){guarded('content/pic/'+copy.rel,true);ensure(path.dirname(copy.full));const temp=temporary(copy.full,copy.bytes);made.push(copy);fs.copyFileSync(temp,copy.full,fs.constants.COPYFILE_EXCL);fs.unlinkSync(temp);}
   for(const write of writes){const relative=path.relative(game,write.file).replaceAll('\\','/');guarded(relative,true);if(currentHash(write.file)!==(write.before===null?null:hash(write.before)))throw Error('File changed while applying sharing');ensure(path.dirname(write.file));written.push(write);atomic(write.file,write.next);}
  }catch(error){
   const conflicts=[];
   for(const write of written.reverse())try{guarded(path.relative(game,write.file).replaceAll('\\','/'),true);const current=currentHash(write.file),before=write.before===null?null:hash(write.before);if(current===before)continue;if(current!==hash(write.next)){conflicts.push(path.relative(game,write.file));continue;}if(write.before===null)fs.unlinkSync(write.file);else atomic(write.file,write.before);}catch(rollback){conflicts.push(path.relative(game,write.file)+': '+rollback.message);}
   for(const copy of made.reverse())try{guarded('content/pic/'+copy.rel,true);const current=currentHash(copy.full);if(current===null)continue;if(current!==hash(copy.bytes)){conflicts.push('content/pic/'+copy.rel);continue;}fs.unlinkSync(copy.full);}catch(rollback){conflicts.push('content/pic/'+copy.rel+': '+rollback.message);}
   if(conflicts.length)error.message+='; rollback conflict: '+conflicts.join(', ');throw error;
  }finally{for(const temp of temporaries)try{if(fs.existsSync(temp))fs.unlinkSync(temp);}catch{}for(const dir of createdDirs.slice().reverse())try{if(fs.readdirSync(dir).length===0)fs.rmdirSync(dir);}catch{}cached=undefined;}
  cached=undefined;return {history:historyDir?path.relative(game,historyDir).replaceAll('\\','/'):null};
 }
 function apply(input){const plan=planning(input);if(input.planHash!==plan.result.planHash)throw Error('Sharing plan changed; preview again');const audit=transaction(plan.state,plan.updates,plan.copies,plan.policy,plan.sources);return {...plan.result,...audit,sharing:describe(input.id),changedIds:[...plan.updates.values()].map(update=>update.rec.id),copiedFiles:plan.result.copies.map(copy=>copy.to)};}
 function materialize(ids){const state=load(true);if(ids===undefined)ids=[...state.records.values()].map(rec=>rec.id);if(!Array.isArray(ids)||ids.some(id=>!validId(id)))throw Error('Invalid materialization IDs');const selected=sorted(ids),updates=new Map();for(const id of selected){writableMembers(state,id);const rec=record(state,id),resolved=effective(state,id),fields={};for(const field of Object.keys(resolved))if(imageFields.has(field)&&!own(rec.data,field))fields[field]=resolved[field];if(Object.keys(fields).length)updates.set(key(id),{rec,fields});}const result=transaction(state,updates,[],null);return {...result,changedIds:[...updates.values()].map(update=>update.rec.id),affectedIds:selected,changes:[...updates.values()].map(update=>({id:update.rec.id,json:update.rec.json,fields:Object.keys(update.fields).sort()}))};}
 return {resolve:(id,dataOverride)=>effective(load(),id,dataOverride),describe,targets:id=>writableMembers(load(),id),preview:input=>planning(input).result,apply,materialize};
}
module.exports={create,imageFields,patchStrings};
if(require.main===module){try{const input=JSON.parse(fs.readFileSync(0,'utf8')),api=create(input.game,input.options||{});let result;if(input.action==='resolve')result=api.resolve(input.id,input.dataOverride);else if(input.action==='describe')result=api.describe(input.id);else if(input.action==='targets')result=api.targets(input.id);else if(input.action==='preview')result=api.preview(input);else if(input.action==='apply')result=api.apply(input);else if(input.action==='materialize')result=api.materialize(input.ids);else throw Error('Unknown appearance sharing action');process.stdout.write(JSON.stringify(result));}catch(error){process.stderr.write(JSON.stringify({error:error.message}));process.exitCode=1;}}
// JO9 MOD END APPEARANCE_SHARING_20261117
