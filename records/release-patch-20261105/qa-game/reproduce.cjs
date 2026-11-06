'use strict';
// Release QA only. Writes disposable baselines, patches and diagnostics outside WORK.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const temp='G:/Codex/tmp/jo9-patch-20261105/qa-game',out=__dirname;
const core=require(repo+'/tools/text-workshop/core.cjs');
const codec=require(repo+'/tools/qa/save-codec.cjs');
const gate=require(repo+'/tools/qa/release-check.cjs');
const expectedBaseline='6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505';
const expectedCurrent='f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536';
const baseline=temp+'/baseline/jack.qsp',mods=temp+'/selected-mods',fixture=temp+'/state/state.sav';
const candidate=game+'/jack.qsp',sourceSave=game+'/save/24TEST.sav';
const hashFile=p=>core.hash(fs.readFileSync(p));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n');};
const decoded=(doc,l,field)=>core.shift(doc.lines[l[field]],5);
function prepare(){
 assert.equal(hashFile(candidate),expectedCurrent,'WORK changed; re-audit before validation');
 const got=cp.spawnSync('git',['-C',repo,'show','49458e6:assets/runtime/2.4.1/jack.qsp'],{maxBuffer:128*1024*1024,windowsHide:true});
 if(got.error||got.status!==0)throw Error('Local Git baseline unavailable: '+(got.error?.message||got.stderr.toString()));
 const oldRaw=got.stdout,newRaw=fs.readFileSync(candidate);
 assert.equal(core.hash(oldRaw),expectedBaseline,'Released baseline hash mismatch');
 const old=core.parse(oldRaw),current=core.parse(newRaw),edited=core.parse(oldRaw);
 const oldMap=new Map(old.locations.map(l=>[l.name,l])),newMap=new Map(current.locations.map(l=>[l.name,l]));
 const edits=[],add_locations=[],changes=[];
 for(const l of old.locations){
  const next=newMap.get(l.name);assert.ok(next,'Deleted location is unsupported: '+l.name);
  for(const field of ['desc','body']){
   const before=decoded(old,l,field),after=decoded(current,next,field);
   if(before!==after){assert.ok(before.length,'Empty search body requires a reviewed alternative: '+l.name+'.'+field);edits.push({location:l.name,field,old:before,new:after,count:1});edited.lines[l[field]]=core.shift(after,-5);changes.push({location:l.name,field,oldCharacters:before.length,newCharacters:after.length});}
  }
  const oi=l.body+1,ni=next.body+1;
  const oa=Number(core.shift(old.lines[oi],5)),na=Number(core.shift(current.lines[ni],5));
  assert.equal(oa,na,'Action count changed: '+l.name);
  assert.deepEqual(old.lines.slice(oi,oi+1+oa*3),current.lines.slice(ni,ni+1+na*3),'Location actions changed: '+l.name);
 }
 const existingOrder=current.locations.filter(l=>oldMap.has(l.name)).map(l=>l.name);
 assert.deepEqual(existingOrder,old.locations.map(l=>l.name),'Existing location order changed');
 for(const l of current.locations.filter(l=>!oldMap.has(l.name))){
  assert.equal(core.shift(current.lines[l.body+1],5),'0');
  const added={name:l.name,desc:decoded(current,l,'desc'),body:decoded(current,l,'body'),actions:[]};add_locations.push(added);
  edited.lines.splice(-1,0,core.shift(added.name,-5),core.shift(added.desc,-5),core.shift(added.body,-5),core.shift('0',-5));
 }
 edited.lines[3]=core.shift(String(current.locations.length),-5);
 assert.deepEqual(core.serialize(edited),newRaw,'Whole-location release patch is not exact');
 const patch={id:'2026-11-05_release_2_4_1_to_work_exact',description:'Exact released 2.4.1 to approved WORK snapshot, including preserved manual changes; QA reproduction only.',before_sha256:expectedBaseline,after_sha256:expectedCurrent,edits,add_locations};
 gate.inspectWorld(oldRaw);const structure=gate.inspectWorld(newRaw);gate.validatePatchSet([patch],expectedBaseline,expectedCurrent);
 write(baseline,oldRaw);write(mods+'/2026-11-05_release_exact.json',patch);
 const rawSave=fs.readFileSync(sourceSave),save=codec.parse(rawSave);assert.deepEqual(codec.serialize(save),rawSave);
 for(const role of ['slave','assistant'])assert.equal(codec.value(save,role+'_state')[0],'1');
 const versions={CODE_REV:'2.4.1',GAME_VER:'잭 오 나인 테일 v2.4.1 Kor Ver',TITLE_FIX:'잭 오 나인 테일 v2.4.1 Kor Ver'},versionChanges=[];
 for(const [name,value]of Object.entries(versions)){
  const item=save.vars.find(v=>v.name===name);assert.ok(item&&item.values[0],name+' missing');
  versionChanges.push({name,old:item.values[0][1],new:value});item.values[0][1]=value;
 }
 write(fixture,codec.serialize(save));assert.equal(hashFile(sourceSave),core.hash(rawSave));
 const nloc=current.locations.find(l=>l.name==='$newloc');
 const revisions=[...decoded(current,nloc,'body').matchAll(/jo9_traits_revision\s*=\s*(\d+)/g)].map(m=>Number(m[1]));
 assert.equal(Math.max(...revisions),3);
 const report={baselineCommit:'49458e6',baselineSha256:expectedBaseline,currentSha256:expectedCurrent,structure,editedFields:edits.length,changedExistingLocations:new Set(edits.map(e=>e.location)).size,addedLocations:add_locations.map(l=>l.name),changes,exactMemoryReplay:true,baselinePath:baseline,patchDirectory:mods,fixturePath:fixture,sourceSave,sourceSaveSha256:core.hash(rawSave),fixtureSha256:hashFile(fixture),fixtureVersionOnlyChanges:versionChanges,cacheRevision:3,workUnchanged:true,fullTouched:false};
 write(out+'/prepared.json',report);console.log(JSON.stringify({...report,changes:undefined},null,2));
}
function validate(mirror){
 assert.ok(mirror,'Pass the completed stage jack.qsp as the mirror argument');
 const prep=JSON.parse(fs.readFileSync(out+'/prepared.json','utf8'));
 assert.equal(hashFile(candidate),expectedCurrent);assert.equal(hashFile(baseline),expectedBaseline);assert.equal(hashFile(sourceSave),prep.sourceSaveSha256);assert.equal(hashFile(fixture),prep.fixtureSha256);assert.equal(hashFile(mirror),expectedCurrent);
 const result=gate.run({profile:'release',candidate,baseline,'mods-dir':mods,engine:game+'/engine/jack.exe','game-dir':game,'state-save':fixture,'cache-revision':'3','client-timeout-seconds':'30',mirror,out:temp+'/runs'});
 write(out+'/release-report.json',result.report);
 const run=result.report.output;
 for(const f of ['report.md','client-runner.log','patch-replay.log','patch-reapply.log'])if(fs.existsSync(run+'/'+f))fs.copyFileSync(run+'/'+f,out+'/'+f);
 for(const f of fs.existsSync(run+'/client')?fs.readdirSync(run+'/client'):[])if(f.endsWith('-stderr.log')||f==='client-results.json')fs.copyFileSync(run+'/client/'+f,out+'/'+f);
 assert.equal(hashFile(sourceSave),prep.sourceSaveSha256);assert.equal(hashFile(candidate),expectedCurrent);
 console.log(JSON.stringify({verdict:result.report.verdict,exitCode:result.exitCode,report:out+'/release-report.json',run},null,2));process.exitCode=result.exitCode;
}
function verifyStageJson(stage){
 assert.ok(stage,'Stage game directory is required');assert.equal(hashFile(candidate),expectedCurrent);assert.equal(hashFile(stage+'/jack.qsp'),expectedCurrent);
 const report=JSON.parse(fs.readFileSync(out+'/release-report.json','utf8'));assert.equal(report.verdict,'PASS');
 const sourceRoot=path.join(game,'json'),stageRoot=path.join(stage,'json'),cloneRoot=path.join(report.output,'client','json');
 const list=root=>{const result=[];function visit(p){for(const x of fs.readdirSync(p,{withFileTypes:true})){assert.ok(!x.isSymbolicLink(),'Unexpected link: '+p+'/'+x.name);const f=path.join(p,x.name);if(x.isDirectory())visit(f);else if(x.name.endsWith('.json'))result.push(path.relative(root,f));}}visit(root);return result.sort();};
 const sourceFiles=list(sourceRoot),snapshotPath=out+'/json-source-manifest.json';let diagnosticEvidence;
 if(fs.existsSync(cloneRoot)){
  const cloneFiles=list(cloneRoot);assert.deepEqual(cloneFiles,sourceFiles,'Diagnostic JSON file list differs from WORK');
  for(const rel of sourceFiles)assert.equal(hashFile(path.join(cloneRoot,rel)),hashFile(path.join(sourceRoot,rel)),'Diagnostic JSON differs: '+rel);
  write(snapshotPath,{qspSha256:expectedCurrent,files:sourceFiles.map(rel=>({path:rel.replaceAll('\\','/'),sha256:hashFile(path.join(sourceRoot,rel))}))});diagnosticEvidence='Fresh diagnostic copy compared byte-for-byte by SHA-256';
 }else{
  const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));assert.equal(snapshot.qspSha256,expectedCurrent);assert.deepEqual(snapshot.files.map(x=>x.path),sourceFiles.map(x=>x.replaceAll('\\','/')));
  for(const item of snapshot.files)assert.equal(hashFile(path.join(sourceRoot,item.path)),item.sha256,'WORK JSON changed since diagnostic: '+item.path);
  diagnosticEvidence='Recorded diagnostic snapshot; disposable JSON copy was cleaned after verification';
 }
 const packagedFiles=list(stageRoot),included=[];for(const rel of packagedFiles){const expected=path.join(sourceRoot,rel);assert.ok(fs.existsSync(expected),'Unexpected staged JSON '+rel);assert.equal(hashFile(path.join(stageRoot,rel)),hashFile(expected),'Staged JSON differs: '+rel);included.push({path:rel.replaceAll('\\','/'),sha256:hashFile(expected)});}
 const result={checkedAt:new Date().toISOString(),qspSha256:expectedCurrent,stage,diagnosticJsonFiles:sourceFiles.length,diagnosticJsonExactWorkMatch:true,diagnosticEvidence,jsonSourceManifestSha256:hashFile(snapshotPath),stagedJsonFiles:packagedFiles.length,stagedJsonExactWorkMatch:true,included,limits:['A patch stage contains only the selected JSON delta; unchanged baseline files are outside this subset comparison.']};write(out+'/stage-json-verification.json',result);console.log(JSON.stringify({...result,included:undefined},null,2));
}
if(process.argv[2]==='prepare')prepare();else if(process.argv[2]==='validate')validate(process.argv[3]);else if(process.argv[2]==='verify-stage-json')verifyStageJson(process.argv[3]);else throw Error('Usage: node reproduce.cjs prepare | validate <stage/game/jack.qsp> | verify-stage-json <stage/game>');
