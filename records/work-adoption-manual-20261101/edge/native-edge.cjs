'use strict';
// Prepare/collect only. Root owns all serialized engine execution.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/work-adoption-edge-20261101';
const core=require(R+'/tools/text-workshop/core.cjs'),rules=require(R+'/tools/text-workshop/image-cut-condition-rules.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs'),syntax=require(R+'/tools/text-workshop/check-image-cycle-syntax.cjs');
const OUT=__dirname,q=s=>"'"+String(s).replaceAll("'","''")+"'",png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const cut=(b,n)=>n===1?b:b.replace(/\.png$/,' ('+n+').png');
const old=" $jo9_after = func('interior_change', 'jo9_path', $jo9_visible_top)",fixed=" $jo9_after = func('interior_change', 'jo9_path', $jo9_visible_top, 3)";
const rule=(b,n,value=100)=>({base:b,path:cut(b,n),morality:null,money:{op:'ge',value},rank:null,reputation:null});
function world(start,interior){return Buffer.from(['QSPGAME','','',core.shift('2',-5),core.shift('Start',-5),'',core.shift(start,-5),core.shift('0',-5),core.shift('interior_change',-5),'',core.shift(interior,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');}
function owned(){assert.equal(path.resolve(T),path.resolve('G:/Codex/tmp/work-adoption-edge-20261101'));assert(path.resolve(T).startsWith(path.resolve('G:/Codex/tmp')+path.sep));}
function prepare(refresh=false){
 owned();if(refresh)assert.equal(JSON.parse(fs.readFileSync(T+'/owned-fixture.json')).owner,'work-adoption-edge-20261101');else assert(!fs.existsSync(T),'Existing owned edge fixtures must be collected/cleaned by root first.');qa.assertOutside(T,[R,W]);
 const source=fs.readFileSync(W+'/jack.qsp'),sourceSha256=core.hash(source),doc=core.parse(source),locs=doc.locations.filter(l=>l.name==='interior_change');assert.equal(locs.length,1);let body=core.shift(doc.lines[locs[0].body],5);assert.deepEqual(core.serialize(doc),source);
 const mode3AlreadyApplied=body.split(fixed).length-1===1;
 if(mode3AlreadyApplied)assert.equal(body.split(old).length-1,0);else{assert.equal(body.split(old).length-1,1);body=body.replace(old,()=>fixed);}
 assert.equal(body.split(fixed).length-1,1);assert.equal(syntax.checkSyntax(body).ok,true);
 const candidateDoc=core.parse(source);candidateDoc.lines[locs[0].body]=core.shift(body,-5);const candidateSha256=core.hash(core.serialize(candidateDoc));
 fs.mkdirSync(T,{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 fs.writeFileSync(T+'/owned-fixture.json',JSON.stringify({owner:'work-adoption-edge-20261101',sourceSha256,candidateSha256,createdAt:new Date().toISOString()},null,2));
 const plan=[],cases=[];
 function make(name,b,files,rr,build){
  for(const n of files){const file=path.join(T,cut(b,n));fs.mkdirSync(path.dirname(file),{recursive:true});if(refresh&&fs.existsSync(file))assert.deepEqual(fs.readFileSync(file),png);else fs.writeFileSync(file,png,{flag:'wx'});}
  const configured=rules.buildBody(body,rr);assert.equal(configured.split(fixed).length-1,1);assert.equal(rules.buildBody(configured,[]),rules.buildBody(body,[]));assert.equal(syntax.checkSyntax(configured).ok,true);
  const code=["killall","usehtml=0","$counter=''","$onnewloc=''","$ongload=''","settimer 0","sound_on=0","autosave=0","decadesave=0","snk_room_target=0","qa_checks=0","qa_failures=0","$qa_failed=''","$qa_sequence=''","sparks=100"];
  const keys=[];
  const add=(...lines)=>code.push(...lines),check=(expression,key)=>{keys.push(key);add('qa_checks+=1','if ('+expression+")=0: qa_failures+=1 & $qa_failed+="+q(key+'|'));};
  const choice=n=>'jo9_cut_choice['+q(b)+']='+n;
  const see=(n,key)=>check('instr($maintxt,'+q('src="'+cut(b,n)+'"')+')>0',key);
  const selected=(id,key)=>{check(choice(id),key);add("$qa_sequence+=str(jo9_cut_choice["+q(b)+"])+'|'");};
  const render=(html='<div><img src="'+b+'"></div>')=>add('$qa_html=func(\'interior_change\',\'jo9_html\','+q(html)+')','*clr','*p $qa_html');
  const seed=(id,n)=>add('jo9_cut_choice['+q(b)+']='+id,'$jo9_visible_top='+q(b),"$jo9_last_button=''","$jo9_clean_overlay=''","jo9_clean_hidden=0",'*clr','*p '+q('<div><img src="'+cut(b,n)+'"></div>'));
  const toggle=()=>add("gs 'interior_change','jo9_toggle'");
  build({add,check,selected,see,render,seed,toggle,b});
  const label=name.replaceAll('-','_'),marker='JO9_QA_EDGE_'+label+'_COMPLETE';add('savegame '+q(name+'.sav'),'msg '+q(marker));
  const raw=world(code.join('\r\n'),configured);const inspected=qa.inspectWorld(raw);assert.equal(syntax.checkSyntax(code.join('\r\n')).ok,true,JSON.stringify(syntax.checkSyntax(code.join('\r\n')).errors));if(refresh){const temp=T+'/'+name+'.qsp.refresh.tmp';fs.writeFileSync(temp,raw,{flag:'wx'});fs.renameSync(temp,T+'/'+name+'.qsp');}else fs.writeFileSync(T+'/'+name+'.qsp',raw,{flag:'wx'});
  const checkpoint='Actual unchanged jo9_path and jo9_toggle with mode3 fix; '+name+'; '+keys.length+' explicit native assertions';
  plan.push({name,file:T+'/'+name+'.qsp',marker,checkpoint});cases.push({name,base:b,physicalCuts:files,configuredRules:rr,assertions:keys.length,keys,fixtureSha256:inspected.sha256,fixtureBytes:raw.length,locationCount:2,diagnosticLimit:name==='selected-deleted'||name==='a-absent'?'Already-rendered HTML and saved choice are seeded with a now-absent physical file; no live filesystem deletion is required.':'Original jo9_html is invoked; runtime functions are not replaced.'});
 }
 make('selected-deleted','content/pic/scene/edge_deleted.png',[1,2,4],[rule('content/pic/scene/edge_deleted.png',2)],({add,check,selected,see,seed,toggle,b})=>{
  seed(10003,3);add('qa_exists=1',"dynamic "+q('qa_exists = %'+cut(b,3)+'%'));check('qa_exists=0','selected-file-actually-absent');
  add("$qa_before=func('interior_change','jo9_path',"+q(b)+',2)');check('$qa_before='+q(cut(b,3)),'mode2-retains-removed-C-path');
  toggle();selected(0,'removed-C-falls-back-A');see(1,'old-rendered-C-replaced-by-A');check('jo9_image_count=3','three-surviving-cuts');
  toggle();selected(10002,'next-click-cycles-B');see(2,'next-click-displays-B');
 });
 make('a-absent','content/pic/scene/edge_absent.png',[2,3,4],[rule('content/pic/scene/edge_absent.png',2)],({add,check,selected,see,seed,toggle,b})=>{
  add('sparks=0');seed(0,1);add('qa_exists=1',"dynamic "+q('qa_exists = %'+b+'%'));check('qa_exists=0','A-file-actually-absent');
  add("$qa_before=func('interior_change','jo9_path',"+q(b)+',2)');check('$qa_before='+q(b),'mode2-retains-removed-A-path');
  toggle();selected(10003,'fallback-first-eligible-C');see(3,'rendered-A-replaced-C');check('jo9_image_count=2','missing-A-and-failed-B-excluded');
  toggle();selected(10004,'next-click-D');see(4,'next-click-displays-D');toggle();selected(10003,'wraps-to-first-survivor-C');
 });
 assert(body.includes("if $jo9_base = 'content/pic/bg/beach.png':\r\n jo9_count = 2\r\n $jo9_candidates[0] = 'content/pic/bg/beach.png'\r\n jo9_candidate_ids[0] = 0\r\n $jo9_candidates[1] = 'content/pic/bg/beach (2).png'\r\n jo9_candidate_ids[1] = 1"),'Use the actual production legacy registry, with its compact ID1.');
 make('registered-id','content/pic/bg/beach.png',[1,2,3,4],[rule('content/pic/bg/beach.png',2)],({add,check,selected,render,toggle,b})=>{
  render();selected(1,'initial-auto-registered-B-keeps-ID1');add("$qa_before=func('interior_change','jo9_path',"+q(b)+',2)');check('$qa_before='+q(cut(b,2)),'mode2-resolves-registered-ID1');
  for(const [id,key]of[[10003,'registered-B-to-C'],[10004,'C-to-D'],[0,'D-to-A'],[1,'A-to-registered-B']]){toggle();selected(id,key);}
  check('jo9_image_count=4','registered-B-not-duplicated-as-10002');add("$qa_valid=func('interior_change','jo9_path',"+q(b)+',3)');selected(1,'explicit-mode3-keeps-registered-ID1');check('$qa_valid='+q(cut(b,2)),'mode3-path-matches-registered-B');
 });
 make('overlay-last-image','content/pic/scene/edge_overlay.png',[1,2,3,4],[rule('content/pic/scene/edge_overlay.png',2)],({add,check,selected,render,toggle,b})=>{
  render('<div><img id="last" src="'+b+'"></div>');
  add('$qa_layered_html='+q('<img id="first" src="'+cut(b,2)+'">')+'+$maintxt','*clr','*p $qa_layered_html');selected(10002,'initial-B-in-both-layers');
  add("gs 'interior_change','jo9_clean_toggle'");check('jo9_clean_hidden=1','clean-overlay-enabled');check("$jo9_clean_overlay!''",'overlay-markup-present');
  toggle();selected(10003,'manual-top-image-C');check('instr($maintxt,'+q('id="first" src="'+cut(b,2)+'"')+')>0','earlier-identical-B-attribute-preserved');check('instr($maintxt,'+q('id="last" src="'+cut(b,3)+'"')+')>0','last-B-attribute-replaced-C');check('jo9_clean_hidden=1','overlay-mode-still-enabled');
  add("$qa_overlay=func('interior_change','jo9_clean_html')");check('$jo9_clean_overlay=$qa_overlay','rebuilt-overlay-identical');check('(len($maintxt)-len($replace($maintxt,$jo9_clean_overlay,\'\')))=len($jo9_clean_overlay)','exactly-one-overlay-instance');
  toggle();selected(10004,'next-manual-top-image-D');check('instr($maintxt,'+q('id="first" src="'+cut(b,2)+'"')+')>0','earlier-image-still-B');check('instr($maintxt,'+q('id="last" src="'+cut(b,4)+'"')+')>0','last-image-now-D');
  add("gs 'interior_change','jo9_clean_toggle'");check('jo9_clean_hidden=0','clean-overlay-disabled');check("$jo9_clean_overlay=''",'overlay-markup-cleared');check('instr($maintxt,'+q('id="last" src="'+cut(b,4)+'"')+')>0','restoring-UI-keeps-top-D');check('instr($maintxt,\'id="jo9_image_cycle"\')>0','original-cycle-control-preserved');
 });
 make('condition-became-eligible','content/pic/scene/edge_became.png',[1,2,3,4],[rule('content/pic/scene/edge_became.png',2,100),rule('content/pic/scene/edge_became.png',3,0)],({add,check,selected,see,render,toggle,b})=>{
  add('sparks=0');render();selected(10003,'initial-auto-C-with-B-ineligible');
  add('sparks=100',"qa_B_rule=func('interior_change','jo9_cut_condition',"+q(b)+','+q(cut(b,2))+')',"qa_C_rule=func('interior_change','jo9_cut_condition',"+q(b)+','+q(cut(b,3))+')');check('qa_B_rule=2','B-now-eligible');check('qa_C_rule=3','C-remains-eligible');
  add("$qa_before=func('interior_change','jo9_path',"+q(b)+',2)');check('$qa_before='+q(cut(b,3)),'mode2-still-identifies-rendered-C');
  toggle();selected(10004,'manual-retains-C-position-then-advances-D');see(4,'manual-displays-D-instead-of-reset-B');toggle();selected(0,'manual-next-A');
  render();selected(10002,'fresh-render-still-auto-selects-lowest-B');see(2,'fresh-render-displays-B');
 });
 const prepared={source:W+'/jack.qsp',sourceSha256,candidateSha256,mode3AlreadyApplied,productionWrites:false,engineExecuted:false,fixtureRoot:T,fixturesUseOnlyOwnedImages:true,fullProductionWorldCopied:false,interiorBodyPreservedExceptMode3AndDeclaredConditions:true,plan:T+'/plan.json',cases,caseCount:cases.length,assertions:cases.reduce((n,c)=>n+c.assertions,0),fixtureBytes:cases.reduce((n,c)=>n+c.fixtureBytes,0),sourceHashAtEnd:core.hash(fs.readFileSync(W+'/jack.qsp')),limits:['Native results are pending; prepare does not run an engine.','Diagnostic Start adapters seed controlled state; the entire actual interior_change body is preserved.','Owned 1px images verify path selection and HTML state, not visual art quality.']};
 fs.writeFileSync(T+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(T+'/prepared.json',JSON.stringify(prepared,null,2));fs.writeFileSync(OUT+'/native-edge-prepared.json',JSON.stringify(prepared,null,2));fs.writeFileSync(OUT+'/native-edge-plan.json',JSON.stringify(plan,null,2));console.log(JSON.stringify(prepared,null,2));
}
function collect(){owned();const prepared=JSON.parse(fs.readFileSync(OUT+'/native-edge-prepared.json')),client=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8').replace(/^\uFEFF/,''));const cases=prepared.cases.map(c=>{const s=sc.parse(fs.readFileSync(T+'/'+c.name+'.sav'));return{name:c.name,checks:+sc.value(s,'qa_checks')[0],expectedChecks:c.assertions,failures:+sc.value(s,'qa_failures')[0],failed:sc.value(s,'qa_failed')[1],sequence:sc.value(s,'qa_sequence')[1]};});const result={sourceSha256:prepared.sourceSha256,candidateSha256:prepared.candidateSha256,client,cases,assertions:cases.reduce((n,c)=>n+c.checks,0),failures:cases.reduce((n,c)=>n+c.failures,0),pass:client.every(c=>c.pass)&&cases.every(c=>c.checks===c.expectedChecks&&c.failures===0),sourceHashAtCollection:core.hash(fs.readFileSync(W+'/jack.qsp')),productionWrites:false};fs.writeFileSync(OUT+'/native-edge-report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;}
function cleanup(){owned();assert.equal(JSON.parse(fs.readFileSync(T+'/owned-fixture.json')).owner,'work-adoption-edge-20261101');assert(fs.existsSync(OUT+'/native-edge-report.json'),'Collect native results before cleanup.');const links=[];function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())links.push(p);else if(e.isDirectory())scan(p);}}scan(T);assert.deepEqual(links,[]);fs.mkdirSync(OUT+'/diagnostics',{recursive:true});for(const file of fs.readdirSync(T))if(/(?:\.log|\.json)$/.test(file))fs.copyFileSync(T+'/'+file,OUT+'/diagnostics/'+file);fs.rmSync(T,{recursive:true,force:true});fs.writeFileSync(OUT+'/cleanup.json',JSON.stringify({fixtureRoot:T,deleted:true,noLinks:true,reproducibleQspAndOwnedDiagnosticSavesRemoved:true},null,2));}
if(process.argv[2]==='prepare')prepare();else if(process.argv[2]==='refresh')prepare(true);else if(process.argv[2]==='collect')collect();else if(process.argv[2]==='cleanup')cleanup();else throw Error('Use prepare, refresh, collect or cleanup. Engine execution belongs to root.');
