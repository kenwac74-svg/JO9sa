'use strict';
// Read-only WORK inventory. Output is limited to this review directory.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',source=game+'/json';
const core=require(repo+'/tools/text-workshop/core.cjs');
const {assertRegistry}=require(repo+'/tools/qa/check-slave-template-ids.cjs');
const expectedQsp='f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536';
assert.equal(core.hash(fs.readFileSync(game+'/jack.qsp')),expectedQsp,'QSP changed: refresh QA applicability');
assert.ok(!fs.lstatSync(source).isSymbolicLink(),'JSON root must not be a link');
const files=[],excludedNonRuntimeFiles=[],directories=[],links=[];
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const absolute=path.join(dir,e.name),st=fs.lstatSync(absolute),relative=path.relative(source,absolute).replaceAll('\\','/');
  assert.ok(relative&&!relative.startsWith('../')&&!path.isAbsolute(relative),'Out-of-scope relative path');
  if(st.isSymbolicLink()){links.push(relative);continue;}
  if(st.isDirectory()){directories.push('game/json/'+relative);walk(absolute);continue;}
  assert.ok(st.isFile(),'Unexpected special file '+absolute);
  const raw=fs.readFileSync(absolute),item={path:'game/json/'+relative,runtimePath:'json/'+relative,relativePath:relative,sourceAbsolutePath:absolute.replaceAll('\\','/'),bytes:raw.length,sha256:core.hash(raw)};
  if(path.extname(e.name).toLowerCase()==='.json'){
   const value=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));assert.ok(value&&typeof value==='object'&&!Array.isArray(value),'Expected definition object '+relative);
   item.kind='json';item.role=relative.startsWith('slaves/')?'character-template':relative==='menu_icon.json'?'menu-icon-html-definitions':relative==='menu_item.json'?'menu-command-id-definitions':relative==='slave_index.json'?'random-character-id-ranges':'other-json-definition';files.push(item);
  }else{
   assert.equal(relative,'slave_index.json.bak','Review unexpected non-JSON file before deciding payload');
   JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));item.role='old-index-backup';item.requiredRuntime=false;item.reason='Backup extension; current index has milf_last=2340 while this backup has2323. It is not part of the JSON runtime payload. Original WORK backup is preserved.';excludedNonRuntimeFiles.push(item);
  }
 }
}
walk(source);assert.deepEqual(links,[]);files.sort((a,b)=>a.path.localeCompare(b.path,'en'));excludedNonRuntimeFiles.sort((a,b)=>a.path.localeCompare(b.path,'en'));
assert.equal(files.length,1158);assert.equal(files.filter(x=>x.role==='character-template').length,1155);assert.equal(excludedNonRuntimeFiles.length,1);
const registry=assertRegistry(source+'/slaves');
const nativeSnapshotPath=path.resolve(__dirname,'../../release-patch-20261105/qa-game/json-source-manifest.json');
const nativeSnapshot=JSON.parse(fs.readFileSync(nativeSnapshotPath,'utf8'));
assert.equal(nativeSnapshot.qspSha256,expectedQsp);assert.equal(nativeSnapshot.files.length,files.length);
const nativeHashes=new Map(nativeSnapshot.files.map(x=>[x.path,x.sha256]));
for(const item of files)assert.equal(item.sha256,nativeHashes.get(item.relativePath),'JSON changed since final native QA: '+item.relativePath);
const expectedOutside=['save','config.xml','FastQSP.ini'];
for(const name of expectedOutside)assert.ok(fs.existsSync(game+'/'+name));
const exe=fs.readFileSync(game+'/engine/jack.exe');
const report={schema:1,createdAt:new Date().toISOString(),sourceGameRoot:game,sourceJsonRoot:source,qspSha256:expectedQsp,engineSha256:core.hash(exe),description:'Complete current JSON runtime definitions for folder replacement, including all top-level JSON and character templates. This is not a delta or a player-save backup.',directories:['game/json',...directories.sort()],observedFileCount:files.length+excludedNonRuntimeFiles.length,runtimeFileCount:files.length,runtimeBytes:files.reduce((sum,x)=>sum+x.bytes,0),requiredNonJsonFiles:[],excludedNonRuntimeFiles,symlinkOrJunctionCount:links.length,jsonSyntaxAllValid:true,characterRegistry:{files:registry.files,numericIds:registry.numericIds,collisions:0,invalidJson:0,embeddedIdMismatches:0},folderRoles:{'game/json/menu_icon.json':'Menu icon markup and image addresses.','game/json/menu_item.json':'Menu command name to numeric ID definitions.','game/json/slave_index.json':'Random generation ID range definitions.','game/json/slaves':'Character templates including seed data, display descriptions and image-role definitions.'},saveAndSettingsScope:{observedSaveOrSettingsFilesInsideCurrentJson:[],knownSeparateLocations:expectedOutside.map(x=>'game/'+x),saveConfigJsonPresent:fs.existsSync(source+'/save_config.json'),engineContainsSaveConfigJsonPath:exe.includes(Buffer.from('json/save_config.json')),observations:['Current WORK JSON folder contains no SAV, INI, XML, player-save archive or save_config.json.','Known SAV and app-setting locations are outside game/json. Deleting only game/json does not address those sibling paths.','Custom JSON definitions under a target installation will be replaced by a complete-folder replacement. Refreshing definitions can change names, descriptions or image connections used by existing actors.'],limits:['This inventory does not certify the installer implementation or every user installation.','The installed engine contains the path json/save_config.json although this WORK does not have that file; unknown target JSON files cannot all be declared unrelated to user state.','Existing SAV GUI loading and full restoration of stored callbacks were not repeated. The unchanged final QSP retains its official9-route PASS.']},lookupEvidence:{currentQsp:['start_refresh: comment records engine JSON reload after killall.','get_stock_seed: reads seed arrays populated from JSON definitions.','generate_stock: uses loli/young/milf ranges and specific stock IDs.','$addon_custom_data/update_current: updates selected current actor fields from current seed definitions.'],priorSourceSurvey:'G:/somi/JO9sa/docs/ENGINE_SOURCE_SURVEY_20261014.md: executeJSON recursively reads .json under game/json, excluding save_config; local engine/source exact-build correspondence was not established by that survey.',actualBinaryStrings:['executeJSON','json/save_config.json','save/quicksave.sav'],binarySourceEquivalenceVerified:false},files,workModified:false,fullModified:false,engineNineRoutesRerun:false};
report.nativeQaJsonSnapshot={path:nativeSnapshotPath.replaceAll('\\','/'),sha256:core.hash(fs.readFileSync(nativeSnapshotPath)),exactSameFileSetAndHashes:true,fileCount:files.length};
fs.writeFileSync(path.join(__dirname,'json-full.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({runtimeFileCount:report.runtimeFileCount,runtimeBytes:report.runtimeBytes,observedFileCount:report.observedFileCount,excludedNonRuntimeFiles:excludedNonRuntimeFiles.map(x=>x.relativePath),requiredNonJsonFiles:[],links:links.length,registry:report.characterRegistry,qspSha256:expectedQsp,output:path.join(__dirname,'json-full.json')},null,2));
