'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {cases}=require('./resolver.test.cjs');
const out=path.join(__dirname,'native'),marker='JO9_QA_GIRLIMAGES_dual_registration_COMPLETE';
fs.mkdirSync(out,{recursive:true});
let helper=fs.readFileSync(path.join(__dirname,'helper-new.qsrc'),'utf8');
const nativePathLine="$jo9_lookup_path='content/pic/'+$jo9_lookup_candidates[jo9_lookup_k]+'.png'";
assert.equal(helper.split(nativePathLine).length-1,1);
// Diagnostic path adapter only: production uses its normal relative content root.
// The exact production FastQSP existence statement remains unmodified.
helper=helper.replace(nativePathLine,"$jo9_lookup_path=$jo9_native_fixture_root+'content/pic/'+$jo9_lookup_candidates[jo9_lookup_k]+'.png'");
const png=fs.readFileSync(path.resolve(__dirname,'../../localhost-pic/fixture-a.png'));
const code=[],manifest=[];
for(const [index,[name,setup,call,expected]]of cases.entries()){
 const caseDir=path.join(out,'files','case'+String(index+1).padStart(2,'0'));
 for(const match of setup.matchAll(/jo9_test_files\['([^']+)'\]=1/g)){
  const target=path.join(caseDir,match[1]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,png);
 }
 code.push('killall',`$jo9_native_fixture_root='files/case${String(index+1).padStart(2,'0')}/'`,setup,`$probe=func('jo9_seed_role_images',${call})`,`if $probe ! '${expected}': msg 'JO9_GIRL_IMAGES_FAIL_${index+1}' & exit`);
 manifest.push({index:index+1,name,expected,caseDir});
}
code.push("killall & $indpack_maid[1]='missing' & probe=func('jo9_seed_role_images','registered',1,'fullmade','indpack_maid')","if probe ! 1: msg 'JO9_GIRL_IMAGES_FAIL_REGISTER_NEW' & exit");
code.push("killall & $fullmade[1]='missing' & probe=func('jo9_seed_role_images','registered',1,'fullmade','indpack_maid')","if probe ! 1: msg 'JO9_GIRL_IMAGES_FAIL_REGISTER_OLD' & exit");
code.push("killall & $fullimage[1]='base' & $indpack_title[1]='base' & probe=func('jo9_seed_role_images','registered',1,'fullmade','indpack_maid')","if probe ! 0: msg 'JO9_GIRL_IMAGES_FAIL_REGISTER_BASE' & exit");
code.push(`msg '${marker}'`);
const shift=x=>core.shift(x.replace(/\r?\n/g,'\r\n'),-5);
const fixture=Buffer.from(['QSPGAME','','',shift('2'),shift('Start'),'',shift(code.join('\r\n')),shift('0'),shift('jo9_seed_role_images'),'',shift(helper),shift('0'),''].join('\r\n'),'utf16le');
assert.ok(core.serialize(core.parse(fixture)).equals(fixture));
const file=path.join(out,'girl-image-resolver.qsp');
fs.writeFileSync(file,fixture);
fs.writeFileSync(path.join(out,'config.xml'),'<game width="640" height="480" title="JO9 girl image resolver diagnostic"/>');
fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'girl-image-resolver',file,marker,checkpoint:'dual registration/fallback/existing custom and ID aliases'}],null,2)+'\n');
fs.writeFileSync(path.join(out,'fixture-manifest.json'),JSON.stringify({marker,fixtureHash:core.hash(fixture),tests:manifest.length+3,diagnosticAdapter:'Only relative content-root prefix switched to isolated test-case folders; unmodified native FastQSP file-existence operation. Absolute paths return false in this engine. Existence checks do not prove image decodability.',launched:false,cases:manifest},null,2)+'\n');
console.log(JSON.stringify({file,marker,tests:manifest.length+3,launched:false}));
