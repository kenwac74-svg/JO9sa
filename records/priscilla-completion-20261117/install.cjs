'use strict';
// 승인된 마지막 페이지 효과를 현재 WORK와 추적 소스에 해시 확인 후 적용한다.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',backup='G:/Codex/tmp/priscilla-completion-20261117';
const read=file=>fs.readFileSync(file),j=file=>JSON.parse(read(file).toString('utf8').replace(/^\uFEFF/,'')),bytes=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const proof=j(H+'/prepared.json'),green=j(H+'/green.json'),patchFile=H+'/mods/2026-11-17_priscilla_service_completion.json',patch=j(patchFile),output=read(H+'/candidate.qsp');
assert.equal(green.passed,green.total);assert.equal(green.errors.length,0);assert.equal(green.sha256,proof.after);assert.equal(core.hash(output),proof.after);
const workRaw=read(G+'/jack.qsp'),sourceRaw=read(R+'/assets/runtime/2.4.1/jack.qsp');assert.equal(core.hash(workRaw),proof.before,'WORK changed; rebase on the latest saved file');
const work=core.parse(workRaw),source=core.parse(sourceRaw),sourceChanges=[];
for(const loc of source.locations){const latest=work.locations.find(other=>other.name===loc.name);assert(latest);assert.equal(source.lines[loc.desc],work.lines[latest.desc]);if(source.lines[loc.body]!==work.lines[latest.body])sourceChanges.push({location:loc.name,oldEncodedBody:source.lines[loc.body]});}
assert.deepEqual(sourceChanges.map(change=>change.location),['interaction_city'],'Unexpected source difference requires review');
const replay=core.parse(workRaw),loc=replay.locations.find(loc=>loc.name==='interaction_city'),body=core.shift(replay.lines[loc.body],5),edit=patch.edits[0];assert.equal(body.split(edit.old).length-1,1);replay.lines[loc.body]=core.shift(body.replace(edit.old,()=>edit.new),-5);assert(core.serialize(replay).equals(output),'Declarative patch replay differs');
const records=R+'/records/priscilla-completion-20261117',targets=[];
function add(file,value){targets.push({file:path.resolve(file),before:fs.existsSync(file)?read(file):null,next:value});}
add(G+'/jack.qsp',output);add(R+'/assets/runtime/2.4.1/jack.qsp',output);
for(const file of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const meta=j(file);meta.sourceQspSha256=proof.after;meta.latestPriscillaCompletion={date:'2026-11-17',record:'records/priscilla-completion-20261117/REPORT_KO.md',interactionCity:6028,callbackPage:7,mood:5,flag:'priscilla_slv',flagValue:1};for(const row of meta.files||[])if(row.runtimePath==='jack.qsp'||row.path==='game/jack.qsp'){row.sha256=proof.after;row.bytes=output.length;}add(file,bytes(meta));}
add(R+'/mods/'+path.basename(patchFile),read(patchFile));
for(const name of ['prepare.cjs','test-completion.cjs','install.cjs','prepared.json','red.json','green.json','REPORT_KO.md'])add(records+'/'+name,read(H+'/'+name));
fs.mkdirSync(backup,{recursive:true});const originalBackup=backup+'/before.qsp';if(fs.existsSync(originalBackup))assert.equal(core.hash(read(originalBackup)),proof.before,'Backup already belongs to another revision');else fs.writeFileSync(originalBackup,workRaw,{flag:'wx'});
const sourceDelta=backup+'/source-before-delta.json';if(!fs.existsSync(sourceDelta))fs.writeFileSync(sourceDelta,bytes({sha256:core.hash(sourceRaw),baseSha256:proof.before,locationChanges:sourceChanges}),{flag:'wx'});
const installed=[],temps=[];function current(file){return fs.existsSync(file)?core.hash(read(file)):null;}
try{
 for(const target of targets)assert.equal(current(target.file),target.before?core.hash(target.before):null,'A destination changed before install: '+target.file);
 for(const target of targets){fs.mkdirSync(path.dirname(target.file),{recursive:true});const temp=target.file+'.priscilla-'+process.pid+'.tmp';assert(!fs.existsSync(temp));temps.push(temp);fs.writeFileSync(temp,target.next,{flag:'wx'});assert.equal(current(target.file),target.before?core.hash(target.before):null,'A destination changed during install: '+target.file);installed.push(target);fs.renameSync(temp,target.file);}
 assert.equal(core.hash(read(G+'/jack.qsp')),proof.after);assert(read(G+'/jack.qsp').equals(read(R+'/assets/runtime/2.4.1/jack.qsp')));
 const result={...proof,installed:true,sourceBefore:core.hash(sourceRaw),sourceManualEditLocationsPreserved:sourceChanges.map(change=>change.location),backup:originalBackup,declarativeReplay:true,targetedEngineChecks:green.total,fullUnchanged:true,saveFilesUnchanged:true,files:targets.map(target=>path.relative(R,target.file).replaceAll('\\','/'))};
 fs.writeFileSync(H+'/applied.json',bytes(result));fs.writeFileSync(records+'/applied.json',bytes(result));process.stdout.write(JSON.stringify({installed:true,hash:proof.after,engineChecks:green.total,callbackLine:proof.callbackLine,backup:originalBackup})+'\n');
}catch(error){const conflicts=[];for(const target of installed.reverse()){if(current(target.file)!==core.hash(target.next)){conflicts.push(target.file);continue;}if(target.before===null)fs.unlinkSync(target.file);else fs.writeFileSync(target.file,target.before);}if(conflicts.length)error.message+='; preserved concurrent edits: '+conflicts.join(', ');throw error;}
finally{for(const temp of temps)if(fs.existsSync(temp))fs.unlinkSync(temp);}
