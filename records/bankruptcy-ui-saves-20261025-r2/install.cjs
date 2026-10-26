'use strict';
// Explicit execution only. Never modifies old saves, WORK code, Full or a previous ZIP.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const task='G:/Codex/tmp/bankruptcy-ui-saves-20261025-r2',stage=task+'/pack';
const name='JO9_TEST_BANKRUPTCY_UI_20261025_R2',saveRoot=game+'/save',target=saveRoot+'/'+name,zipTarget=saveRoot+'/'+name+'.zip';
const expectedSource='256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a';
const c=require(repo+'/tools/text-workshop/core.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=p=>c.hash(fs.readFileSync(p));
const canonical=p=>path.resolve(p).toLowerCase();
function assertRegular(p){const st=fs.lstatSync(p);assert(st.isFile()&&!st.isSymbolicLink(),'Expected regular file: '+p);}
function assertProtected(inputs){for(const p of inputs){assertRegular(p.path);assert.equal(hash(p.path),p.sha256,'Protected input changed: '+p.path);}}
function sortedFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).map(e=>{assert(e.isFile()&&!e.isSymbolicLink(),'Unexpected directory/link inside final saves');return e.name;}).sort();}

assert.equal(canonical(target),canonical('G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_TEST_BANKRUPTCY_UI_20261025_R2'));
assert.equal(path.dirname(path.resolve(target)),path.resolve(saveRoot),'Install only directly below WORK/save');
assert.equal(canonical(fs.realpathSync(saveRoot)),canonical(saveRoot),'Unexpected redirected save directory');
assert.equal(canonical(fs.realpathSync(stage)),canonical(stage),'Unexpected redirected staging directory');
assert(!fs.existsSync(target),'New save-pack folder already exists; never overwrite it');
assert(!fs.existsSync(zipTarget),'New save ZIP already exists; never overwrite it');
assert(!fs.existsSync(__dirname+'/FINAL_RESULT.json'),'Final result already exists; do not execute installation twice');
assert.equal(hash(game+'/jack.qsp'),expectedSource,'Current WORK changed; re-verify test saves first');
const manifest=read(__dirname+'/manifest.json'),recipes=read(__dirname+'/recipes.json'),inspection=read(__dirname+'/independent-inspection.json');
assert.equal(manifest.sourceHash,expectedSource);assert.equal(manifest.count,9);assert.equal(manifest.files.length,9);assert.equal(manifest.nativeCrcBound,true);
assert.equal(inspection.status,'PASS');assert.equal(inspection.filesReviewed,9);assert.equal(inspection.passCount,9);assert.equal(inspection.sourceHash,expectedSource);
assert.equal(String(manifest.crc),String(inspection.reference.nativeCrc),'Manifest and inspected native CRC reference differ');
assert.equal(recipes.length,9);
const inputs=read(task+'/inputs.json');assert(Array.isArray(inputs));assert.equal(inputs.length,138,'Expected pre-existing input protection list');assertProtected(inputs);
const seen=new Set();for(const row of manifest.files){assert(/^[0-9]{2}_[a-z0-9-]+\.sav$/.test(row.file),'Unexpected final save filename');assert(!seen.has(row.file));seen.add(row.file);assertRegular(stage+'/'+row.file);assert.equal(fs.statSync(stage+'/'+row.file).size,row.bytes);assert.equal(hash(stage+'/'+row.file),row.sha256,'Staged save differs from reviewed manifest');const inspected=inspection.rows.find(r=>r.file===row.file);assert(inspected&&inspected.pass&&inspected.sha256===row.sha256,'Reviewed bytes differ from final save');const recipe=recipes.find(r=>r.file===row.file);assert(recipe&&recipe.titleKo===row.title,'Recipe and manifest title differ');}
const guide='사용안내.txt',guidePath=stage+'/'+guide;assertRegular(guidePath);const guideHash=hash(guidePath);
assert.equal(hash(__dirname+'/'+guide),guideHash,'Staged guide differs from current review copy');
const expectedFiles=[...seen,guide].sort();assert.deepEqual(sortedFiles(stage),expectedFiles,'Staging must contain only reviewed saves and guide');

// Compress and inspect before creating the destination: missing Python cannot leave a partial installation.
const python=process.env.JO9_TEST_PYTHON||'C:/Users/User/AppData/Local/Programs/Python/Python314/python.exe';
const version=cp.spawnSync(python,['--version'],{encoding:'utf8',windowsHide:true,timeout:10000});assert.equal(version.status,0,'Python 3 is required; no packages are installed by this task');
const temporaryZip=task+'/package/'+name+'.zip',packageReport=task+'/package/archive.json';
assert(!fs.existsSync(temporaryZip)&&!fs.existsSync(packageReport),'Temporary archive/report already exist; inspect before retrying');
const packaged=cp.spawnSync(python,[__dirname+'/package.py','--source',stage,'--manifest',__dirname+'/manifest.json','--output',temporaryZip,'--report',packageReport,'--guide-sha256',guideHash],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:1024*1024});
if(packaged.status!==0)throw Error('Packaging failed before installation: '+packaged.stdout+'\n'+packaged.stderr);
const archive=read(packageReport);assert.equal(archive.status,'PASS');assert.equal(archive.archiveIntegrity,true);assert.equal(archive.saveFilesVerified,9);assert.equal(archive.guideVerified,true);assert.equal(archive.members.length,10);assert.equal(hash(temporaryZip),archive.sha256);
for(const member of archive.members){const leaf=member.member.slice(name.length+1),expectedHash=leaf===guide?guideHash:manifest.files.find(r=>r.file===leaf)?.sha256;assert(expectedHash,'Unexpected ZIP member');assert.equal(member.member,name+'/'+leaf);assert.equal(member.sha256,expectedHash);}

// Re-check every input immediately before writing the new folder and ZIP.
assertProtected(inputs);assert.equal(hash(game+'/jack.qsp'),expectedSource);assert(!fs.existsSync(target)&&!fs.existsSync(zipTarget));
fs.mkdirSync(target);const installed=[];
try{
 for(const file of expectedFiles){fs.copyFileSync(stage+'/'+file,target+'/'+file,fs.constants.COPYFILE_EXCL);assert.equal(hash(target+'/'+file),hash(stage+'/'+file));installed.push(file);}
 assert.deepEqual(sortedFiles(target),expectedFiles);
 fs.copyFileSync(temporaryZip,zipTarget,fs.constants.COPYFILE_EXCL);assert.equal(hash(zipTarget),archive.sha256,'Installed archive differs from verified ZIP');
 assertProtected(inputs);assert.equal(hash(game+'/jack.qsp'),expectedSource);
}catch(error){write(__dirname+'/INSTALL_FAILURE.json',{status:'PARTIAL_INSTALLATION_NOT_ROLLED_BACK',target,zipTarget,installed,reason:error.stack||String(error),note:'Existing inputs were never overwritten. Inspect this uniquely named new destination before any retry.'});throw error;}

const result={
 status:'INSTALLED_AND_ZIP_VERIFIED',sourceHash:expectedSource,target,zip:{path:zipTarget,sha256:archive.sha256,bytes:archive.bytes,integrity:true,memberHashesVerified:10},
 files:manifest.files.map(row=>({file:row.file,title:row.title,path:target+'/'+row.file,sha256:row.sha256,bytes:row.bytes,checkpoint:row.checkpoint})),
 guide:{path:target+'/'+guide,sha256:guideHash},independentSaveInspection:{files:9,passed:9,crcReference:inspection.reference.nativeCrc},
 originalInputsPreserved:inputs.length,existingSaveFilesPreserved:inputs.filter(row=>/\.sav$/i.test(row.path)).length,
 codeChanged:false,fullSynced:false,oldSavePackOverwritten:false,previousZipOverwritten:false,committed:false,pushed:false,
 limits:['This install script verifies file copies and every ZIP member hash. Actual native Game→Load and interaction evidence is recorded separately by the root.','The nine files contain documented test states and are not ordinary long-term playthrough saves.'],
};
write(__dirname+'/archive.json',{...archive,path:zipTarget,temporaryArchive:temporaryZip});write(__dirname+'/FINAL_RESULT.json',result);
console.log(JSON.stringify({status:result.status,target,saves:result.files.length,zip:zipTarget,zipMiB:(archive.bytes/1048576).toFixed(2),protectedInputs:inputs.length}));
