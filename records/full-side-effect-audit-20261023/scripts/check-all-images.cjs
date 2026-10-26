'use strict';
// Read-only production audit. Only this task's exact temporary root is written.
// Native fixtures have a tiny world, byte-identical production helper/display
// bodies, JSON-derived registry data, and independently materialized expected
// answers. No production location is instrumented; no engine is launched here.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const {checkSyntax}=require(repo+'/tools/check-image-cycle-syntax.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
const input=game+'/jack.qsp',before='G:/somi/JO9_work_backups/isabella_event_image_20261023/before.qsp';
const root=path.resolve('G:/Codex/tmp/jo9-full-audit-20261023/images');
const report=__dirname,sha='5aeff11fffe6e5f2523749987577f42dab870f4d0adee0df385375f9eefb074f';
const aliases=['fullimage','fullmade','fullsecretary','fullmistress'];
const packFor={fullimage:'indpack_title',fullmade:'indpack_maid',fullsecretary:'indpack_secr',fullmistress:'indpack_dom'};
const oldStems=['medico','por','kirakira','tsuina','yammy','antenna','alyce','mist','joker','Inui','zion','rin','kikuchiyo','Ririe','Kyoka','Noelle','Miruki','Tamaki','Chiharu','Fumi','Sana','Nanami','Shuko','celestine','olga'];
const oldRoles=['fullmade','fullsecretary','fullmistress','fullpregnant'],oldDirs=['maid','secretary','mistress','pregnant'];
const q=s=>"'"+String(s).replaceAll("'","''")+"'",crlf=s=>s.replace(/\r?\n/g,'\r\n');
function body(doc,name){const l=doc.locations.find(x=>x.name===name);assert(l,'Missing location '+name);return core.shift(doc.lines[l.body],5);}
function oldPaths(id){return id<2577||id>2601?[]:oldDirs.flatMap((dir,i)=>i===3&&[2585,2597,2600,2601].includes(id)?[]:['girls/full/'+dir+'/'+oldStems[id-2577]]);}
function priorExpected(j,id,cached,wanted){if(!oldPaths(id).includes(cached))return cached;return oldRoles.includes(wanted)?j[wanted]||j.fullimage||'':j.fullimage||'';}
// Oracle uses declared alias precedence and JSON, rather than translating or
// evaluating the implementation source. Results are literal fixture data.
function expected(j,id,cached,wanted='fullimage'){
 if(wanted!=='fullimage'||!cached)return priorExpected(j,id,cached,wanted);
 const match=aliases.find(k=>j[k]===cached);
 return match&&(j[packFor[match]]||j.indpack_title)||priorExpected(j,id,cached,wanted);
}
function check(expr,label){return 'if '+expr+':\r\nelse\r\n msg '+q('JO9_QA_ASSERT_FAILED_'+label)+'\r\n exit\r\nend';}
function world(production,nativeStart,extra={},headers=['QSPGAME','4.0.0 beta 1','']){
 const syntax=checkSyntax(crlf(nativeStart));assert(syntax.ok,'Harness Start syntax: '+JSON.stringify(syntax.errors));
 const locations={Start:nativeStart,...production,...extra};
 const lines=[...headers,core.shift(String(Object.keys(locations).length),-5)];
 for(const [name,code]of Object.entries(locations))lines.push(core.shift(name,-5),'',core.shift(crlf(code),-5),core.shift('0',-5));
 lines.push('');const raw=core.serialize({lines});qa.inspectWorld(raw);const parsed=core.parse(raw);
 for(const [name,code]of Object.entries(production))assert.equal(body(parsed,name),code,'Changed production source '+name);
 return raw;
}
function readData(){const dir=game+'/json/slaves',files=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort((a,b)=>Number(a.match(/^\d+/)[0])-Number(b.match(/^\d+/)[0]));
 return files.map(file=>{const raw=fs.readFileSync(dir+'/'+file),j=JSON.parse(raw.toString('utf8'));return{id:Number(file.match(/^\d+/)[0]),file,sha256:core.hash(raw),j};});}
function inventory(doc,data){
 const callsites=[],references=[],suspect=[];
 for(const l of doc.locations){const text=body(doc,l.name),lines=text.split('\r\n');
  for(let i=0;i<lines.length;i++){
   const code=lines[i];if(code.includes('jo9_seed_role_images')){
    const resolverCalls=[...code.matchAll(/func\(["']jo9_seed_role_images["']/gi)].length;
    const entry={location:l.name,line:i+1,resolverCalls,kind:resolverCalls?'resolver':'cleanup',code};
    references.push(entry);if(resolverCalls)callsites.push(entry);
   }
   if(/jo9_seed/.test(code)&&!code.includes('jo9_seed_role_images')&&l.name!=='jo9_seed_role_images')suspect.push({location:l.name,line:i+1,code});
  }
 }
 const imageFields=[...new Set(data.flatMap(({j})=>Object.keys(j).filter(k=>(k.startsWith('full')||k.startsWith('indpack_'))&&typeof j[k]==='string')))].sort();
 const shared=new Map(),withinId=[];let aliasesNonempty=0;
 for(const {id,j}of data){for(const k of aliases)if(j[k]){aliasesNonempty++;const a=shared.get(j[k])||[];a.push({id,key:k,pack:j[packFor[k]]||j.indpack_title||''});shared.set(j[k],a);}
  for(let i=0;i<aliases.length;i++)for(let z=0;z<i;z++)if(j[aliases[i]]&&j[aliases[i]]===j[aliases[z]])withinId.push({id,first:aliases[z],later:aliases[i]});
 }
 const sharedPaths=[...shared].filter(([,a])=>new Set(a.map(x=>x.id)).size>1).map(([value,entries])=>({value,entries}));
 const selected=[];for(const {id,j,file}of data)for(const key of aliases)if(j[key]){const value=expected(j,id,j[key]);if(value!==j[key])selected.push({id,file,key,from:j[key],to:value,exists:fs.existsSync(path.join(game,'content/pic',value+'.png'))});}
 return{imageFields,templateCount:data.length,titlePacks:data.filter(x=>x.j.indpack_title).length,aliasesNonempty,withinIdAliasCollisions:withinId,sharedAliasPathsAcrossIds:sharedPaths.length,sharedPaths,selectedPaths:selected,missingSelectedPng:selected.filter(x=>!x.exists),references,callsites,resolverCallLines:callsites.length,resolverCallExpressions:callsites.reduce((n,x)=>n+x.resolverCalls,0),cleanupCalls:references.filter(x=>!x.resolverCalls).length,splitNameCandidates:suspect};
}
function seededActors(data){const known=data.find(x=>x.id===2571).j,roles=['slave','assistant','prisoner','cow','stock','farmhand','room1','room2','room3','room4','harpy','pig','dynslave'];
 const lines=[];for(const role of roles){lines.push(role+'_type=2571',role+'_state=1',role+"['moral']=4",role+"['arousal']=0",role+"['image_mode']=0",role+"['audit_numeric']=731",'$'+role+"['audit_string']='keep'",'$'+role+"['cloth']='leather_corset'");for(const key of [...aliases,'fullpregnant'])lines.push('$'+role+'['+q(key)+']='+q(known[key]||''));}
 return{roles,lines};
}
function commonRegistry(data,imageFields){const lines=[];for(const {id,j}of data)for(const field of imageFields)if(Object.hasOwn(j,field))lines.push('$'+field+'['+id+']='+q(j[field]));return lines;}
function snapshots(roles,fields){const init=[],verify=[];
 for(const name of [...roles,...fields]){const nameQ=q('$'+name),snapQ=q('$qa_snapshot_'+name),numSnapQ=q('qa_snapshot_'+name);init.push('copyarr '+snapQ+', '+nameQ,'copyarr '+numSnapQ+', '+q(name));
  verify.push(check('arrsize('+nameQ+')=arrsize('+snapQ+') and arrsize('+q(name)+')=arrsize('+numSnapQ+')','size_'+name),
   'if arrsize('+snapQ+')>0:\r\n for qa_snapshot_i=0 to arrsize('+snapQ+')-1:\r\n'+check('$'+name+'[qa_snapshot_i]=$qa_snapshot_'+name+'[qa_snapshot_i]','string_'+name)+'\r\n end\r\nend',
   'if arrsize('+numSnapQ+')>0:\r\n for qa_snapshot_i=0 to arrsize('+numSnapQ+')-1:\r\n'+check(name+'[qa_snapshot_i]=qa_snapshot_'+name+'[qa_snapshot_i]','numeric_'+name)+'\r\n end\r\nend');
 }
 return{init,verify};
}
function materializedCases(cases){const lines=[];cases.forEach((c,i)=>{lines.push('qa_id['+i+']='+c.id,'$qa_cached['+i+']='+q(c.cached),'$qa_wanted['+i+']='+q(c.wanted||'fullimage'),'$qa_expected['+i+']='+q(c.expected));});return lines;}
function runCases(cases){return ['qa_case_count='+cases.length,'for qa_case_i=0 to qa_case_count-1:'," $qa_answer=func('jo9_seed_role_images','resolve',qa_id[qa_case_i],$qa_cached[qa_case_i],$qa_wanted[qa_case_i])",
 ' if $qa_answer ! $qa_expected[qa_case_i]:',"  msg 'JO9_QA_ASSERT_FAILED_CASE_'+$str(qa_case_i)+'_ID_'+$str(qa_id[qa_case_i])",'  exit',' end','end'];}
function build(){
 const raw=fs.readFileSync(input);assert.equal(core.hash(raw),sha,'Current Work changed');const doc=core.parse(raw),oldRaw=fs.readFileSync(before),oldDoc=core.parse(oldRaw),data=readData();assert.equal(data.length,1126);assert.equal(new Set(data.map(x=>x.id)).size,data.length);
 const inv=inventory(doc,data),resolver=body(doc,'jo9_seed_role_images'),oldResolver=body(oldDoc,'jo9_seed_role_images');
 const block=/! JO9 MOD START INDIE_EVENT_FULLIMAGE_20261023[^\r\n]*\r\n[\s\S]*?! JO9 MOD END INDIE_EVENT_FULLIMAGE_20261023\r\n/;
 assert.equal(resolver.replace(block,''),oldResolver,'Prior helper changed outside new block');
 const source={jo9_seed_role_images:resolver,display_pic:body(doc,'display_pic'),display_fullimage:body(doc,'display_fullimage')};
 const reg=commonRegistry(data,inv.imageFields),actors=seededActors(data),snap=snapshots(actors.roles,inv.imageFields);
 const common=['killall','usehtml=1','settimer 0','snk_room_target=0',"CONST_INT['slave_exist']=1","CONST_INT['no_slave']=0",...reg,...actors.lines];
 const fixtures=[],coverage={};
 function make(name,tests,cases=[],options={}){const marker='JO9_QA_ALLIMAGES_'+name.replaceAll('-','_')+'_COMPLETE';const init=options.snapshot===false?[]:snap.init,verify=options.snapshot===false?[]:snap.verify;
  const code=[...common,...(options.pre||[]),...init,...materializedCases(cases),...runCases(cases),...tests,...verify,'msg '+q(marker)].join('\r\n');
  const actual=options.old?{...source,jo9_seed_role_images:oldResolver}:source;
  const bytes=world(actual,code,options.extra||{},doc.lines.slice(0,3));fixtures.push({name,marker,raw:bytes,checkpoint:'All-template image path and state assertions; '+name});coverage[name]={cases:cases.length,bytes:bytes.length,...options.counts};
 }
 const corpus=[];for(const {id,j}of data){for(const key of aliases)corpus.push({id,cached:j[key]||'',wanted:'fullimage',expected:expected(j,id,j[key]||''),tag:key});for(const cached of ['qa/custom/preserved/'+id,'',j.indpack_title||'qa/already-selected/'+id])corpus.push({id,cached,expected:expected(j,id,cached)});}
 make('all-current-templates',[],corpus);
 const explicit=[];for(const {id,j}of data)for(const wanted of oldRoles)for(const key of aliases){const cached=j[key]||'';explicit.push({id,cached,wanted,expected:priorExpected(j,id,cached,wanted)});}
 make('explicit-role-requests',[],explicit);
 const missingRole=[],noPack=[],rolePre=[],allPre=[];
 for(const {id,j}of data){const roleMissing={...j,indpack_maid:'',indpack_secr:'',indpack_dom:''},none={...roleMissing,indpack_title:''};for(const key of ['indpack_maid','indpack_secr','indpack_dom'])rolePre.push('$'+key+'['+id+"]=''");for(const key of ['indpack_title','indpack_maid','indpack_secr','indpack_dom'])allPre.push('$'+key+'['+id+"]=''");
  for(const key of aliases){const cached=j[key]||'';missingRole.push({id,cached,expected:expected(roleMissing,id,cached)});noPack.push({id,cached,expected:expected(none,id,cached)});}}
 make('missing-role-packs',[],missingRole,{pre:rolePre});make('all-packs-empty',[],noPack,{pre:allPre});
 make('packs-absent',[],noPack,{pre:['killvar \'indpack_title\'','killvar \'indpack_maid\'','killvar \'indpack_secr\'','killvar \'indpack_dom\'']});
 const dona=[];for(const {id,j}of data)for(const cached of oldPaths(id))for(const wanted of ['fullimage',...oldRoles])dona.push({id,cached,wanted,expected:expected(j,id,cached,wanted)});
 make('dona-legacy-read-resolver',[],dona,{counts:{knownLegacyAliases:dona.length/5}});
 const cleanupPre=[],cleanupCheck=[];for(const {id}of data)for(let i=0;i<4;i++)if(oldPaths(id).includes('girls/full/'+oldDirs[i]+'/'+oldStems[id-2577])){cleanupPre.push('$'+oldRoles[i]+'['+id+']='+q('girls/full/'+oldDirs[i]+'/'+oldStems[id-2577]));cleanupCheck.push(check('$'+oldRoles[i]+'['+id+"]=''",'cleanup_'+id+'_'+oldRoles[i]));}
 // Cleanup is intentionally allowed to edit global legacy role registrations.
 // Its actor snapshots remain strict, including unregistered pregnancy aliases.
 const excluded=[2585,2597,2600,2601];for(const id of excluded)cleanupPre.push('$fullpregnant['+id+']='+q('girls/full/pregnant/'+oldStems[id-2577]));
 const actorSnap=snapshots(actors.roles,[]);const cleanTests=[...actorSnap.init,"gs 'jo9_seed_role_images'",...cleanupCheck];
 for(const id of excluded)cleanTests.push(check('$fullpregnant['+id+']='+q('girls/full/pregnant/'+oldStems[id-2577]),'pregnancy_excluded_'+id));
 cleanTests.push(...actorSnap.verify);make('cleanup-before-and-after-registry',cleanTests,[],{pre:cleanupPre,snapshot:false,counts:{knownLegacyAliases:cleanupCheck.length,excludedPregnancyAliases:excluded.length}});
 make('registry-after-cleanup',[],corpus,{pre:[...cleanupPre,"gs 'jo9_seed_role_images'",...reg],counts:{order:'legacy registry -> cleanup -> current JSON registry -> reads'}});
 make('cleanup-after-registry',["gs 'jo9_seed_role_images'",...runCases(corpus)],corpus,{counts:{order:'current JSON registry -> reads -> cleanup -> reads'}});
 const unknown=[];for(const id of [-1,999999])for(const cached of ['',data.find(x=>x.id===2571).j.fullimage,'qa/custom'])for(const wanted of ['fullimage',...oldRoles])unknown.push({id,cached,wanted,expected:cached});
 make('unknown-ids',[],unknown);
 // Same-ID ambiguous aliases do not currently exist; synthetic equality tests
 // document the source precedence instead of claiming that caches encode roles.
 const synthetic=99990,ambigPre=[];for(const key of aliases)ambigPre.push('$'+key+'['+synthetic+"]='qa/shared-alias'");for(const [i,key]of Object.values(packFor).entries())ambigPre.push('$'+key+'['+synthetic+']='+q('qa/pack/'+i));
 make('synthetic-alias-precedence',[],[{id:synthetic,cached:'qa/shared-alias',expected:'qa/pack/0'}],{pre:ambigPre});
 // Exact caller statements, including quoted deferred $special_action text and
 // interpolation in $special_image, execute without rewriting their call sites.
 const contexts=[],contextCounts={sourceLines:inv.callsites.filter(x=>!['display_pic','display_fullimage'].includes(x.location)).length,executions:0,displayPicCalls:0,displayFullimageCalls:0,sexPartnerBranches:0};
 const representatives=[2571,2323,96,2579];
 for(const id of representatives){const j=data.find(x=>x.id===id).j;
  for(const role of actors.roles){contexts.push(role+'_type='+id);for(const key of [...aliases,'fullpregnant'])contexts.push('$'+role+'['+q(key)+']='+q(j[key]||''));}
  contexts.push(...actorSnap.init);
  for(const site of inv.callsites){if(['display_pic','display_fullimage'].includes(site.location))continue;let code=site.code;const n=contextCounts.executions++;
   if(site.location==='stasis_cell'){
    // Preserve the actual stasis statement; an explicit identity test double
    // isolates its unrelated interior_change HTML skinning dependency.
    contexts.push('cla',code,check('instr($replace($maintxt,\'\\\',\'/\'),'+q('content/pic/'+(j.indpack_title||expected(j,id,j.fullimage||''))+'.png')+')>0','stasis_'+id));continue;
   }
   contexts.push(code);
   const target=(code.match(/\$(bg_path|special_action\[\d+\]|special_image\[\d+\])/i)||[])[0];assert(target,'Unrecognized caller assignment '+site.location+':'+site.line);
   const actor=(code.match(/resolve["'],\s*(\w+)_type/i)||[])[1];assert(actor);const want=expected(j,id,j.fullimage||'');
   if(target==='$bg_path')contexts.push(check(target+'='+q(want),'context_'+n));else if(target.startsWith('$special_action'))contexts.push(check('instr('+target+','+q(want)+')>0','context_'+n),'dynamic '+target,check('$bg_path='+q(want),'dynamic_context_'+n));else contexts.push(check(target+'='+q(want+'.png'),'context_'+n));
   if(site.location==='sex_interaction_result'){contexts.push("$sex['partner']='qa_nonempty'",code,check('$bg_path='+q(want),'sex_other_'+id),"$sex['partner']=''");contextCounts.sexPartnerBranches+=2;}
  }
  // All 10 display_pic actor branches, full unmodified production location.
  for(const role of actors.roles.slice(0,10)){contexts.push("$qa_answer=func('display_pic',"+q(role)+",'fullimage')",check('$qa_answer='+q(expected(j,id,j.fullimage||'')),'pic_'+id+'_'+role));contextCounts.displayPicCalls++;}
  // Body remains intact; use a non-bg container to avoid unrelated HTML skin.
  for(const role of ['slave','assistant','cow','prisoner','stock','farmhand','room1','room2','room3','room4'])for(const mode of role==='assistant'?[0,1,2,3]:[0]){
   contexts.push("assistant['image_mode']="+mode,"$qa_answer=func('display_fullimage',"+q(role)+",'qa_image')");
   const roleKey=mode===1?'fullmistress':mode===2?'fullmade':mode===3?'fullsecretary':'fullimage';
   const pack=role==='assistant'&&mode?packFor[roleKey]:role==='cow'?'indpack_cow':role==='stock'?'indpack_title':'indpack_corset';
   const wanted=role==='assistant'?(mode?roleKey:''):'fullimage';
   const cached=role==='assistant'&&mode?j[roleKey]||j.fullimage||'':j.fullimage||'';
   const wantedPath=j[pack]||expected(j,id,cached,wanted);
   contexts.push(check("instr($replace($qa_answer,'\\','/'),"+q('content/pic/'+wantedPath+'.png')+')>0','html_'+id+'_'+role+'_'+mode),check("assistant['image_mode']="+mode,'html_mode_'+id+'_'+role+'_'+mode));contextCounts.displayFullimageCalls++;
  }
  contexts.push("assistant['image_mode']=0");
  contexts.push(...actorSnap.verify);
  for(const role of actors.roles)contexts.push(check(role+'_type='+id,'actor_type_'+id+'_'+role),check(role+'_state=1','actor_state_'+id+'_'+role));
 }
 // Mutation by context seeding is test setup: take actor snapshots after the
 // last setup only, then verify generic resolver does not change any actor.
 // Every cache is additionally checked directly after each real display call.
 make('all-callsite-contexts',contexts,[],{snapshot:false,counts:contextCounts,extra:{interior_change:"! Identity test double for unrelated HTML skinning only.\r\n$result=$args[1]"}});
 const red=data.find(x=>x.id===2571);make('baseline-detection-control',[],[{id:red.id,cached:red.j.fullimage,expected:red.j.indpack_title}],{old:true});
 const sources=Object.fromEntries(Object.entries(source).map(([k,v])=>[k,{sha256:core.hash(Buffer.from(v,'utf8')),lines:v.split('\r\n').length}]));
 return{fixtures,coverage,inventory:inv,sources,inputSha256:core.hash(raw),baselineSha256:core.hash(oldRaw),dataManifest:data.map(({id,file,sha256})=>({id,file,sha256})),limits:['Registry is materialized from all JSON string image fields; custom engine JSON deserialization is covered separately by official client smoke tests.','All registered aliases and explicit role requests are bounded exhaustive over the current 1126 JSON records. Arbitrary future IDs, filenames and player-edited paths cannot be exhaustively enumerated.','Exact resolver/display source is preserved; event conditions and narrative branches are not replayed as whole events.','Caller statements test immediate and deferred path composition; native screenshot pixels and existing-save load UI are outside this fixture.','No engine is started by this generator. Baseline detection control intentionally fails the current desired result.']};
}
if(require.main===module){const built=build();fs.mkdirSync(report,{recursive:true});
 const summary={input,inputSha256:built.inputSha256,baselineSha256:built.baselineSha256,templateCount:built.inventory.templateCount,imageFieldCount:built.inventory.imageFields.length,resolverCallLines:built.inventory.resolverCallLines,resolverCallExpressions:built.inventory.resolverCallExpressions,cleanupCalls:built.inventory.cleanupCalls,titlePacks:built.inventory.titlePacks,aliasesNonempty:built.inventory.aliasesNonempty,sameIdAliasCollisions:built.inventory.withinIdAliasCollisions.length,sharedAliasPathsAcrossIds:built.inventory.sharedAliasPathsAcrossIds,changedSelectionCases:built.inventory.selectedPaths.length,missingSelectedPng:built.inventory.missingSelectedPng.length,sources:built.sources,coverage:built.coverage,limits:built.limits};
 for(const [file,obj]of [['image-static-summary.json',summary],['image-caller-inventory.json',built.inventory],['image-input-manifest.json',built.dataManifest]])fs.writeFileSync(path.join(report,file),JSON.stringify(obj,null,2));
 if(process.argv.includes('--prepare')){assert.equal(root,path.resolve('G:/Codex/tmp/jo9-full-audit-20261023/images'));fs.mkdirSync(root,{recursive:true});const plan=[];
  for(const fixture of built.fixtures){const file=path.join(root,fixture.name+'.qsp');if(fs.existsSync(file)){assert(process.argv.includes('--refresh'),'Refuse overwrite '+file);assert.equal(path.dirname(path.resolve(file)),root);const previous=core.parse(fs.readFileSync(file));assert.equal(previous.locations[0].name,'Start');assert(previous.locations.length<=5,'Not a tiny task fixture');}fs.writeFileSync(file,fixture.raw);plan.push({name:fixture.name,file,marker:fixture.marker,checkpoint:fixture.checkpoint,expectFailure:fixture.name==='baseline-detection-control'});}
  fs.copyFileSync(game+'/config.xml',path.join(root,'config.xml'));fs.writeFileSync(path.join(root,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  fs.writeFileSync(path.join(root,'plan.json'),JSON.stringify(plan.filter(p=>!p.expectFailure),null,2));fs.writeFileSync(path.join(root,'red-plan.json'),JSON.stringify(plan.filter(p=>p.expectFailure),null,2));
  fs.writeFileSync(path.join(report,'image-native-plan.json'),JSON.stringify(plan,null,2));
 }
 console.log(JSON.stringify(summary,null,2));
}
module.exports={build,expected,priorExpected};
