'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const record='G:/somi/JO9sa/records/menu-private-fixes-20261025',load=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const result=load(record+'/FINAL_RESULT.json'),cleanup=load(record+'/CLEANUP_RESULT.json');assert.equal(result.status,'APPLIED_AND_VERIFIED');assert.equal(cleanup.status,'CLEANED');
const qsp=result.runtimeFiles[0];assert.equal(c.hash(fs.readFileSync(qsp.path)),qsp.after);
for(const x of load(__dirname+'/inputs.json'))if(path.resolve(x.path).toLowerCase()!==path.resolve(qsp.path).toLowerCase())assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,x.path);
const patch=fs.readFileSync(result.patch);assert.equal(load(result.patch).after_sha256,qsp.after);assert(fs.readFileSync(__dirname+'/patch-final.json').equals(patch));
const removed=[];for(const n of ['patch.json','patch-quota.json','patch-final.json','base.candidate.css']){const target=path.join(__dirname,n);assert.equal(path.dirname(path.resolve(target)).toLowerCase(),path.resolve(__dirname).toLowerCase());if(fs.existsSync(target)){assert(fs.lstatSync(target).isFile());fs.unlinkSync(target);removed.push(n);}}
const plan=fs.readFileSync(__dirname+'/PLAN_KO.md','utf8').replaceAll('- [ ]','- [x]');fs.writeFileSync(__dirname+'/PLAN_KO.md',plan);fs.writeFileSync(record+'/PLAN_KO.md',plan);
result.temporaryDiagnostics={status:'CLEANED',bytes:cleanup.bytes,files:cleanup.files,linksUnlinked:cleanup.links,followedLinks:false,removedLocalRegenerableArtifacts:removed};
fs.writeFileSync(record+'/FINAL_RESULT.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync(__dirname+'/FINAL_RESULT.json',JSON.stringify(result,null,2)+'\n');fs.copyFileSync(__filename,record+'/close-task.cjs');
console.log(JSON.stringify({status:result.status,qspHash:qsp.after,existingSavesUnchanged:result.checks.existingSavesUnchanged,protectedFilesVerifiedAgain:true,temporaryRootsAbsent:cleanup.roots.every(x=>!fs.existsSync(x.root)),removedLocalArtifacts:removed,record}));
