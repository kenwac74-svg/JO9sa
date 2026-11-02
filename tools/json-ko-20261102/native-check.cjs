'use strict';
// Scoped engine probes in disposable copies; no personal save is read or written.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync,execFileSync}=require('node:child_process');
const builder=require('./build-qsp.cjs'),core=require('../text-workshop/core.cjs');
const quote=builder.qspText;
function diagnostic(candidate,baseline,entries,token){
 const doc=core.parse(candidate),base=core.parse(baseline);
 const body=(d,name)=>{const l=d.locations.find(x=>x.name===name);if(!l)throw Error('Missing '+name);return core.shift(d.lines[l.body],5);};
 const guard=body(doc,'interaction').split('\r\n').find(s=>s.includes("instr($voice_native,'VOICE_ARGON_NATIVE_V5')")&&s.includes('jo9_json_ko'));
 if(!guard)throw Error('Current cached voice guard was not found');
 const marker='JO9_QA_'+token+'_json_ko_COMPLETE';
 const code=['DEBUG=1','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0','qa_jsonko_assertions=0'];
 let checks=0;
 function check(condition,name){checks++;code.push('if '+condition+':',' qa_jsonko_assertions+=1','else',' msg '+quote('JO9_QA_JSON_KO_FAIL_'+name),' exit','end');}
 for(let i=0;i<entries.length;i++)check("func('jo9_json_ko','text',"+quote(entries[i].old)+')='+quote(entries[i].new),'map_'+i);
 for(const [name,value]of Object.entries({unknown:"Player edited 中文 <<literal>> ' unchanged",blank:'',space:' '+entries[0].old,case:entries[0].old.toUpperCase(),translated:entries[0].new})){
  if(entries.some(e=>e.old===value))continue;
  code.push('$qa_jsonko_input='+quote(value));
  check("func('jo9_json_ko','text',$qa_jsonko_input)=$qa_jsonko_input",name);
 }
 // Reuse the exact edited guard. All other cache predicates already pass.
 code.push("$slave_world_description="+quote(entries[0].old),"$slave_family_description='player custom family'","$slave_occupation_description='player custom occupation'",'slave_type=2577',"slave['moral']=4","slave['mood']=-2","slave['pride']=3","slave['fear']=1","$slave_psy_basic='optimistic'","$voice_native='VOICE_ARGON_NATIVE_V5'","$voice_impression='VOICE_ARGON_FLOW_V7'","$voice_relation_line='VOICE_ARGON_RELATION_FLOW_V9'","$voice_native_moods='present'","$voice_native_stored={ $result=$args[1] }",'voice_fragment_revision=8','qa_jsonko_reloads=0',guard);
 check("instr($voice_native_stored,'jo9_json_ko')>0 and qa_jsonko_reloads=1",'stale_cache_reload');
 code.push(guard);
 check('qa_jsonko_reloads=1','current_cache_reused');
 check('$slave_world_description='+quote(entries[0].old)+" and $slave_family_description='player custom family' and $slave_occupation_description='player custom occupation'",'stored_histories_preserved');
 check("slave_type=2577 and slave['moral']=4 and slave['mood']=-2 and slave['pride']=3 and slave['fear']=1 and $slave_psy_basic='optimistic'",'actor_state_preserved');
 // The candidate source remains responsible for exact canonical selection.
 code.push("$voice_native={ $result='QA_CANONICAL_SOURCE' }","$prehistoric_description[1]="+quote(entries[0].old));
 check("$dyneval($voice_native_stored,'world',"+quote(entries[0].old)+")='QA_CANONICAL_SOURCE'",'canonical_original_input');
 code.push('$prehistoric_description[2]='+quote(entries[0].old));
 check("$dyneval($voice_native_stored,'world',"+quote(entries[0].old)+')='+quote(entries[0].new),'ambiguous_source_fallback');
 code.push("$prehistoric_description[1]=''","$prehistoric_description[2]=''");
 check("$dyneval($voice_native_stored,'world',"+quote(entries[0].old)+')='+quote(entries[0].new),'stored_custom_translation');
 check("$dyneval($voice_native_stored,'family','player edited family')='player edited family'",'stored_unknown_preserved');
 // Execute both complete relation implementations against identical synthetic roles.
 code.push("$voice_native={ $result=$args[1] }",'sa_rel=1',"$slave_name='QA slave'","$assistant_name='QA assistant'","slave['id']=10","assistant['id']=20","slave['relative_id']=20","assistant['relative_id']=10","slave['intellect']=2","assistant['intellect']=2","slave['temper']=3","assistant['temper']=3","slave['world_index']=3","assistant['world_index']=3","slave['nation_index']=3","assistant['nation_index']=3","slave['family_index']=2","assistant['family_index']=2","slave['work_index']=1","assistant['work_index']=1","slave['obedience']=1","$slave['relative_relations']="+quote(entries[0].old),"gs 'qa_jsonko_baseline_relations'",'qa_jsonko_relation=sa_relations','qa_jsonko_relation1=sa_relations1','qa_jsonko_relation2=sa_relations2','qa_jsonko_relation3=sa_relations3','qa_jsonko_relation4=sa_relations4');
 check('$text[2]='+quote('[QA slave]<br>'+entries[0].old),'baseline_relation_prose');
 code.push("gs 'origins_relations'");
 check('$text[2]='+quote('[QA slave]<br>'+entries[0].new),'translated_relation_prose');
 check('sa_relations=qa_jsonko_relation and sa_relations1=qa_jsonko_relation1 and sa_relations2=qa_jsonko_relation2 and sa_relations3=qa_jsonko_relation3 and sa_relations4=qa_jsonko_relation4','relation_calculations_preserved');
 check("slave['id']=10 and assistant['id']=20 and slave['relative_id']=20 and $slave['relative_relations']="+quote(entries[0].old),'relation_actor_state_preserved');
 code.push("$slave['relative_relations']='player relation custom'","gs 'origins_relations'");
 check("$text[2]='[QA slave]<br>player relation custom'",'unknown_relation_preserved');
 code.push("$slave['relative_relations']="+quote(entries[0].new),"gs 'origins_relations'");
 check('$text[2]='+quote('[QA slave]<br>'+entries[0].new),'new_korean_relation_preserved');
 code.push('if qa_jsonko_assertions='+checks+':',' msg '+quote(marker),'else'," msg 'JO9_QA_JSON_KO_FAIL_COUNT'",'end');
 const start=doc.locations.find(x=>x.name==='Start'),dynamic=doc.locations.find(x=>x.name==='#dynamic');
 doc.lines[start.body]=core.shift(code.join('\r\n'),-5);
 doc.lines[dynamic.body]=core.shift(body(doc,'#dynamic')+'\r\nqa_jsonko_reloads+=1',-5);
 const additions=[{name:'qa_jsonko_baseline_relations',body:body(base,'origins_relations')}];
 for(const added of additions)doc.lines.splice(doc.lines.length-1,0,...[added.name,'',added.body,'0'].map(x=>core.shift(x,-5)));
 doc.lines[3]=core.shift(String(doc.locations.length+additions.length),-5);
 const raw=core.serialize(doc);builder.inspect(raw);
 return {raw,marker,assertions:checks,checkpoint:'synthetic-old-history-cache-and-relation',name:'json-ko'};
}
function main(argv){
 const o={};for(let i=0;i<argv.length;i+=2){const k=argv[i]?.replace(/^--/,'');if(!['baseline','candidate','map','engine','game-dir','out','qa-ref'].includes(k)||!argv[i+1])throw Error('Unexpected argument '+argv[i]);o[k]=argv[i+1];}
 for(const k of ['baseline','candidate','map','engine','game-dir','out'])if(!o[k])throw Error('Missing --'+k);
 for(const input of [o.baseline,o.candidate,o.engine])builder.assertOutside(o.out,path.dirname(input));
 builder.assertOutside(o.out,o['game-dir']);
 if(fs.existsSync(path.join(o.out,'report.json')))throw Error('Choose a fresh native output directory');
 fs.mkdirSync(o.out,{recursive:true});
 const report={schema:1,profile:'scoped-json-display-compatibility',qa_ref:o['qa-ref']||'origin/main',checks:[],limits:['No personal saves, GUI save loading, or visual layout inspected.','Only edited voice-cache guard and complete relation code are exercised; this is not a full release or gameplay test.']};
 const inputs=[o.baseline,o.candidate,o.engine,o.map],hashes=Object.fromEntries(inputs.map(p=>[path.resolve(p),core.hash(fs.readFileSync(p))]));
 const stage=(name,fn)=>{try{const result=fn();report.checks.push({name,status:'PASS',detail:result});return result;}catch(e){report.checks.push({name,status:'FAIL',error:e.message});throw e;}};
 function ps(args,name,timeout=45000){const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass',...args],{encoding:'utf8',windowsHide:true,timeout,maxBuffer:8*1024*1024});fs.writeFileSync(path.join(o.out,name+'.log'),(r.stdout||'')+(r.stderr||''));if(r.error||r.status!==0)throw Error(name+' failed: '+(r.error?.message||'exit '+r.status));}
 let failure;
 try{
  const dep=path.join(o.out,'deps');
  stage('export-current-qa-dependencies',()=>{
   report.qa_commit=execFileSync('git',['rev-parse',report.qa_ref],{encoding:'utf8'}).trim();
   const files=['tools/text-workshop/core.cjs','tools/qa/check-qsp-line-endings.cjs','tools/qa/check-qsp-marker-boundaries.cjs','tools/qa/run-client-smoke.ps1','tools/apply_mods.ps1'];
   for(const file of files){const target=path.join(dep,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,execFileSync('git',['show',report.qa_commit+':'+file],{maxBuffer:8*1024*1024}));}
   return {commit:report.qa_commit,files};
  });
  const baseline=fs.readFileSync(o.baseline),candidate=fs.readFileSync(o.candidate),entries=builder.normalizeMap(JSON.parse(fs.readFileSync(o.map,'utf8').replace(/^\uFEFF/,'')));
  const built=builder.build(baseline,entries);
  stage('candidate-and-markers',()=>{
   if(!built.raw.equals(candidate))throw Error('Candidate differs from baseline + exact mapping');
   const {inspectMarkerBoundaries}=require(path.resolve(dep,'tools/qa/check-qsp-marker-boundaries.cjs'));
   const result=inspectMarkerBoundaries(candidate);if(result.issues.length)throw Error('QSP marker boundary errors: '+JSON.stringify(result.issues));
   return built.report;
  });
  stage('official-patch-replay-idempotence',()=>{
   const patchDir=path.join(o.out,'patches'),replay=path.join(o.out,'replay.qsp');fs.mkdirSync(patchDir,{recursive:true});
   fs.writeFileSync(path.join(patchDir,'patch.json'),JSON.stringify(built.patch,null,2));fs.writeFileSync(replay,baseline);
   const args=['-File',path.resolve(dep,'tools/apply_mods.ps1'),'-Qsp',path.resolve(replay),'-ModsDir',path.resolve(patchDir)];
   ps(args,'patch-replay');if(!fs.readFileSync(replay).equals(candidate))throw Error('Official patch replay differs');
   ps(args,'patch-reapply');if(!fs.readFileSync(replay).equals(candidate))throw Error('Patch reapplication changed candidate');
   return {byteExact:true,idempotent:true};
  });
  const client=path.join(o.out,'client'),isolatedEngine=path.join(client,'engine','jack.exe');
  const probe=stage('prepare-isolated-synthetic-probe',()=>{
   fs.mkdirSync(client,{recursive:true});
   fs.cpSync(path.dirname(o.engine),path.dirname(isolatedEngine),{recursive:true,filter:p=>!p.split(/[\\/]/).includes('exebackup')});
   fs.cpSync(path.join(o['game-dir'],'json'),path.join(client,'json'),{recursive:true});
   fs.copyFileSync(path.join(o['game-dir'],'config.xml'),path.join(client,'config.xml'));
   fs.writeFileSync(path.join(client,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\nAutosaveWhenExiting=false\r\n');
   const value=diagnostic(candidate,baseline,entries,crypto.randomBytes(10).toString('hex').toUpperCase());
   const file=path.resolve(client,'json-ko.qsp');fs.writeFileSync(file,value.raw);
   fs.writeFileSync(path.join(client,'plan.json'),JSON.stringify([{name:value.name,marker:value.marker,checkpoint:value.checkpoint,file}],null,2));
   return {assertions:value.assertions,checkpoint:value.checkpoint,marker:value.marker};
  });
  stage('current-installed-engine-synthetic-path',()=>{
   const previous={QT_PLUGIN_PATH:process.env.QT_PLUGIN_PATH,QT_QPA_PLATFORM_PLUGIN_PATH:process.env.QT_QPA_PLATFORM_PLUGIN_PATH};
   process.env.QT_PLUGIN_PATH=path.resolve(client,'engine');process.env.QT_QPA_PLATFORM_PLUGIN_PATH=path.resolve(client,'engine/platforms');
   let runnerFailure;try{ps(['-File',path.resolve(dep,'tools/qa/run-client-smoke.ps1'),'-Engine',path.resolve(isolatedEngine),'-Plan',path.resolve(client,'plan.json'),'-TimeoutSeconds','30'],'client-runner',45000);}catch(e){runnerFailure=e;}finally{for(const [k,v]of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
   const p=path.join(client,'client-results.json'),results=fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')):[];
   report.client=results;
   if(runnerFailure||results.length!==1||!results[0].pass)throw Error('Installed engine completion failed: '+(results[0]?.reason||runnerFailure?.message||'missing result'));
   return {assertions:probe.assertions,completionMarker:true,isolatedEngineSha256:core.hash(fs.readFileSync(isolatedEngine))};
  });
 }catch(e){failure=e;}
 try{stage('input-files-unchanged',()=>{for(const [file,hash]of Object.entries(hashes))if(core.hash(fs.readFileSync(file))!==hash)throw Error('Input changed: '+file);return {files:inputs.length};});}catch(e){failure??=e;}
 report.verdict=failure?'FAIL':'SCOPED_NATIVE_PASS';fs.writeFileSync(path.join(o.out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({verdict:report.verdict,report:path.resolve(o.out,'report.json'),error:failure?.message}));if(failure)process.exitCode=1;
 return report;
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={diagnostic,main};
