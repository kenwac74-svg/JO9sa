'use strict';
// Reproduce the approved repair of prepared test save 06; never install it.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),codec=require(repo+'/tools/qa/save-codec.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const opts={};for(let i=2;i<process.argv.length;i++){assert(process.argv[i].startsWith('--'));opts[process.argv[i].slice(2)]=process.argv[++i];}
const source=opts.source||'G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_TEST_20261023_06_ISABELLA.sav';
const qsp=opts.qsp||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const root=path.resolve(opts.out||'G:/Codex/tmp/jo9-asset-event-ui-20261024/isabella');
assert.equal(root.toLowerCase(),path.resolve('G:/Codex/tmp/jo9-asset-event-ui-20261024/isabella').toLowerCase(),'Output must remain in this task diagnostic directory');
const sourceHash='1dfd6e0b5a1f2a3755f4b18cfcb364b35bd12bc9cbe93b4819c632f3dec4dc44',qspHash='da6b23880a93e5850c981ed74e668f34dc7fd247b1913e2adcb5b6df19eaa1c9';
const input=fs.readFileSync(source),rawQsp=fs.readFileSync(qsp);assert.equal(core.hash(input),sourceHash,'Save baseline drift');assert.equal(core.hash(rawQsp),qspHash,'QSP baseline drift');
const original=codec.parse(input);assert(codec.serialize(original).equals(input),'Save byte round-trip');assert.equal(codec.dec(original.lines[10]),'end_day_screen');assert.equal(codec.value(original,'END_DAY_PHASE')[0],'1');
const candidate=codec.parse(input),changes=[];
function setExisting(name,n,t){const matches=candidate.vars.filter(v=>v.name===name);assert.equal(matches.length,1,'Existing slot required: '+name);const v=matches[0];assert(v.values.length<=1&&v.idx.length===0,'Scalar snapshot required: '+name);const before=structuredClone(v);v.values=[[String(n),String(t)]];if(JSON.stringify(before)!==JSON.stringify(v))changes.push({name,slot:v.slot,before:before.values,after:v.values});}
setExisting('PREVIOUS_UI_STYLE',codec.value(original,'UI_STYLE')[0],'');
setExisting('PREVIOUS_NSFW',codec.value(original,'NSFW')[0],'');
for(const name of ['STUDY','BED','BATH','DUNGEON','KITCHEN','LAB','BOUDOIR']){const current=codec.value(original,name);assert(current[1],'Required prepared interior: '+name);setExisting('PREVIOUS_'+name,'0',current[1]);}
const allowed=new Set(changes.map(x=>x.name));assert.deepEqual([...allowed].sort(),['PREVIOUS_BATH','PREVIOUS_BED','PREVIOUS_BOUDOIR','PREVIOUS_DUNGEON','PREVIOUS_KITCHEN','PREVIOUS_LAB','PREVIOUS_STUDY','PREVIOUS_UI_STYLE']);
assert.equal(candidate.vars.length,original.vars.length);assert.deepEqual(candidate.lines.slice(0,candidate.start),original.lines.slice(0,original.start),'CRC, saved screen, location and header must remain unchanged');
for(let i=0;i<original.vars.length;i++)if(!allowed.has(original.vars[i].name))assert.deepEqual(candidate.vars[i],original.vars[i],'Unrelated variable changed: '+original.vars[i].name);
const output=codec.serialize(candidate),round=codec.parse(output);assert(codec.serialize(round).equals(output));assert.deepEqual(round.vars,candidate.vars);
fs.mkdirSync(root,{recursive:true});
function writeExact(file,bytes){if(fs.existsSync(file)){assert.deepEqual(fs.readFileSync(file),bytes,'Refuse overwrite of different diagnostic artifact: '+file);return;}fs.writeFileSync(file,bytes,{flag:'wx'});}
const recovery=path.join(root,'original-06.sav.gz'),candidatePath=path.join(root,'candidate.sav');
if(fs.existsSync(recovery))assert.deepEqual(zlib.gunzipSync(fs.readFileSync(recovery)),input);else fs.writeFileSync(recovery,zlib.gzipSync(input,{level:9}),{flag:'wx'});
writeExact(candidatePath,output);assert.equal(core.hash(zlib.gunzipSync(fs.readFileSync(recovery))),sourceHash);
const spec=JSON.parse(fs.readFileSync(repo+'/records/ready-test-saves-20261023/spec.json','utf8')),entry=spec.all.find(x=>x.key==='isabella');assert(entry);const beforeSteps=entry.steps.filter(x=>x!=="gs 'interior_storage'"),proposed=structuredClone(beforeSteps),at=proposed.indexOf("gt 'end_day_screen'");assert(at>=0);proposed.splice(at,0,"gs 'interior_storage'");
writeExact(path.join(root,'spec-change-proposal.json'),Buffer.from(JSON.stringify({file:repo+'/records/ready-test-saves-20261023/spec.json',key:'isabella',before:beforeSteps,after:proposed,applied:false},null,2)+'\n'));
const plan=[],nativeSnapshots=[];const quote=s=>"'"+s.replaceAll("'","''")+"'";
for(const [name,state,expected]of [['before',original,''],['after',round,'lux']]){
 const doc=core.parse(rawQsp),loc=doc.locations.find(x=>x.name==='Start'),prime=qa.primeState(state),marker='JO9_QA_ISABELLA06_'+name+'_COMPLETE';
 const tests=["gs 'interior_restore'",`if $study ! ${quote(expected)}: msg 'JO9_QA_FAIL_STUDY_${name.toUpperCase()}' & exit`,`if $bed ! ${quote(expected)}: msg 'JO9_QA_FAIL_BED_${name.toUpperCase()}' & exit`,`if $bg['home_lux'] ! ${quote(name==='after'?'interiors\\lux_study_large':'')}: msg 'JO9_QA_FAIL_HOME_BG_${name.toUpperCase()}' & exit`];
 if(name==='after')for(const [key,value]of [['bath','lux'],['dungeon','lux'],['kitchen','econom'],['lab','elite'],['boudoir','lux']])tests.push(`if $${key} ! ${quote(value)}: msg 'JO9_QA_FAIL_${key.toUpperCase()}' & exit`);
 const snapshot='native-'+name+'.sav';tests.push('savegame '+quote(snapshot),'msg '+quote(marker));doc.lines[loc.body]=core.shift(prime.code+'\r\n'+tests.join('\r\n'),-5);
 const fixture=path.join(root,'probe-'+name+'.qsp'),bytes=core.serialize(doc);qa.inspectWorld(bytes);writeExact(fixture,bytes);nativeSnapshots.push({name,file:path.join(root,snapshot),expectedStudy:expected,expectedHomeBg:name==='after'?'interiors\\lux_study_large':''});plan.push({name:'probe-'+name,file:fixture,marker,checkpoint:'Unchanged production interior_restore executed with decoded save snapshot'});
}
writeExact(path.join(root,'plan.json'),Buffer.from(JSON.stringify(plan,null,2)+'\n'));writeExact(path.join(root,'FastQSP.ini'),Buffer.from('[General]\r\nignoreCRC=true\r\nmutedState=true\r\n'));
if(opts.native!=='skip'){
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',path.join(root,'plan.json'),'-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:70000});fs.writeFileSync(path.join(root,'runner.log'),run.stdout+'\n'+run.stderr);assert.equal(run.status,0,'Native comparison failed');
 const results=JSON.parse(fs.readFileSync(path.join(root,'client-results.json'),'utf8').replace(/^\uFEFF/,''));assert.equal(results.length,2);assert(results.every(x=>x.pass));
 for(const x of nativeSnapshots){const snapshotRaw=fs.readFileSync(x.file),saved=codec.parse(snapshotRaw);assert.equal(codec.value(saved,'STUDY')[1],x.expectedStudy);assert.equal(codec.value(saved,'BG','home_lux')[1],x.expectedHomeBg);x.study=codec.value(saved,'STUDY')[1];x.homeBg=codec.value(saved,'BG','home_lux')[1];x.sha256=core.hash(snapshotRaw);x.bytes=snapshotRaw.length;}
}
assert.equal(core.hash(fs.readFileSync(source)),sourceHash,'Source save changed');assert.equal(core.hash(fs.readFileSync(qsp)),qspHash,'WORK game changed');
const temporaryArtifactsRemoved=[];
if(opts.native!=='skip')for(const file of [...plan.map(x=>x.file),...nativeSnapshots.map(x=>x.file)]){assert.equal(path.dirname(path.resolve(file)),root);assert(!fs.lstatSync(file).isSymbolicLink());const bytes=fs.statSync(file).size;fs.unlinkSync(file);temporaryArtifactsRemoved.push({file,bytes});}
const report={status:opts.native==='skip'?'STATIC_PASS':'NATIVE_PASS',source,sourceSha256:sourceHash,candidate:candidatePath,candidateSha256:core.hash(output),qsp,qspSha256:qspHash,recovery,originalBytes:input.length,candidateBytes:output.length,changes,unchanged:{headerAndCrc:true,variablesOutsideEightSnapshots:true,slotsAndOrdering:true,savedScreenAndLocation:true,sourceSave:true,workQsp:true},nativeSnapshots,temporaryArtifactsRemoved,scope:'Prepared test save 06 only; no game, source, shared record or original-save writes',specChangeProposal:path.join(root,'spec-change-proposal.json'),limits:['Native comparison executes unchanged production interior_restore with qa.primeState, not the GUI save selection/click path.','Existing strict CRC behavior is unchanged; test saves were prepared for ignoreCRC=true.','Current BARN string is already empty and the independent PRVIOUS_BARN typo is not migrated.']};fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,candidate:candidatePath,candidateSha256:report.candidateSha256,changedVariables:changes.length,report:path.join(root,'report.json')}));
