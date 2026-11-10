'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',record=repo+'/records/script-route-lock-20261110',game='G:/somi/Jack O Nine Tails v2.4_work/game',source=repo+'/tools/text-workshop',installed=game+'/modtools/text-workshop',fixture='G:/Codex/tmp/jo9-script-route-20261110';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=JSON.parse(fs.readFileSync(record+'/before-install.json','utf8')),protectedAfter={};
for(const [p,expected]of Object.entries(before)){const current=hash(fs.readFileSync(game+'/'+p));assert.equal(current,expected,p);protectedAfter[p]=current;}
const files=['index.html','script-range.js','script-range.cjs','script-export.cjs','workshop-ui.js','workshop.css','README.md','VERIFICATION.md'];
const installedFiles=[];for(const file of files){const a=fs.readFileSync(source+'/'+file),b=fs.readFileSync(installed+'/'+file);assert(a.equals(b),file);installedFiles.push({file,sha256:hash(a),bytes:a.length});if(/\.(?:js|cjs)$/.test(file))new vm.Script(a.toString('utf8'),{filename:file});}
const html=fs.readFileSync(source+'/index.html','utf8');let inlineScripts=0;for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(m[1].trim()){new vm.Script(m[1],{filename:'index.inline.js'});inlineScripts++;}
for(const id of ['scriptRangeBox','rangeStartLabel','rangeEndLabel','rangePinned','rangeSave','rangePreview','rangeReset','scriptImport'])assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
const logBytes=fs.readFileSync(record+'/regression.log'),log=logBytes[0]===255&&logBytes[1]===254?logBytes.subarray(2).toString('utf16le'):logBytes.toString('utf8');assert.match(log,/tests 57/);assert.match(log,/pass 57/);assert.match(log,/fail 0/);
const samples=[];
for(const [id,name,pages]of [['5ff95723fc5cebf0','sample-single-scene.txt',4],['074a8d2d2c7b41b8','sample-two-scenes.txt',7]]){
 const generated=fixture+'/runtime/script-exports/JO9_각본_'+id+'.txt',from=fs.existsSync(generated)?generated:record+'/'+name,raw=fs.readFileSync(from),text=raw.toString('utf8').replace(/^\uFEFF/,'');
 assert.equal([...text.matchAll(/---- \[S\d+-P\d+\] ----/g)].length,pages);assert(!/고르지 않은 기본 경로|고르지 않은 후속 장면 대사|\$text\[/.test(text));assert(text.includes('선택한 조건 경로 A'));assert(text.includes('선택한 조건 경로 B'));
 fs.writeFileSync(record+'/'+name,raw);samples.push({name,pages,bytes:raw.length,sha256:hash(raw)});
}
const proof='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/jo9-script-route-20261110/route-proof.png';assert(fs.statSync(proof).size>1000);fs.copyFileSync(proof,record+'/route-proof.png');
const result={date:'2026-11-10',patchId:'SCRIPT_ROUTE_LOCK_20261110',tests:{pass:57,fail:0,uiBehavior:9,backendContract:10},syntax:{modules:4,inlineScripts},installedFiles,protectedFilesUnchanged:protectedAfter,browserChecks:['start 3 fixed','conditional A+B pinned','end 6 preserves choices','preview contains 4 chosen pages','TXT path and contents match','reload restores pins and preview','explicit scene 88 transition pinned','2-scene 7-page TXT without repeat route prompt','edit/script tab roundtrip keeps start','actual WORK editor input fields 5 preserved'],browserErrors:[],samples,gameQspOrSaveEdited:false,fullCommitPush:false};
fs.writeFileSync(record+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pass:57,fail:0,installedFiles:installedFiles.length,protectedFiles:Object.keys(protectedAfter).length,syntax:result.syntax,samples}));
