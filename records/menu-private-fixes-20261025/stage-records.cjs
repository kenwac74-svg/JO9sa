'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const base=__dirname,task='G:/Codex/tmp/menu-private-fixes-20261025',repo='G:/somi/JO9sa';
const record=repo+'/records/menu-private-fixes-20261025',final='8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const manifest=json(base+'/candidate-final.json');assert.equal(manifest.after,final);assert.equal(c.hash(fs.readFileSync(manifest.candidate)),final);
const inputs=json(base+'/inputs.json');for(const x of inputs)assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Protected input '+x.path);
const official='G:/Codex/tmp/menu-private-release-20261025/run-8p8YuF',release=json(official+'/report.json');assert.equal(release.verdict,'PASS');assert.equal(release.client.probes.length,9);assert(release.client.probes.every(x=>x.pass));assert.equal(release.checks.find(x=>x.name==='inputs-readable').detail.candidate,final);
const groups=[['rumor',task+'/native-rumor-final',5],['inventory',task+'/native-inventory-final',2]];
for(const [name,dir,n]of groups){const results=json(dir+'/client-results.json');assert.equal(results.length,n);assert(results.every(x=>x.pass),name);assert.equal(json(dir+'/prepared.json').sourceHash,final);}
const quota=json(base+'/quota-native-report.json');assert.equal(quota.status,'PASS');assert.equal(quota.candidate.sha256,final);assert.equal(quota.cases.length,11);assert(quota.cases.every(x=>x.pass));
const privateReport=json(base+'/private-native-report.json');assert.equal(privateReport.status,'PASS');assert.equal(privateReport.sourceHash,final);assert.equal(privateReport.originalCssUnchanged,true);assert.equal(privateReport.roleSnapshotsPreserved,true);assert(privateReport.cases.every(x=>x.pass));
assert(!fs.existsSync(record),'Refuse to overwrite a prior final record');fs.mkdirSync(record,{recursive:true});
const excluded=new Set(['patch.json','patch-quota.json','patch-final.json','base.candidate.css','candidate.json','candidate-quota.json','private-audit.json','native-driver-observed.js']);
for(const entry of fs.readdirSync(base,{withFileTypes:true}))if(entry.isFile()&&!excluded.has(entry.name)&&/\.(?:cjs|md|json)$/.test(entry.name))fs.copyFileSync(base+'/'+entry.name,record+'/'+entry.name,fs.constants.COPYFILE_EXCL);
fs.mkdirSync(record+'/official');for(const name of ['report.json','report.md'])if(fs.existsSync(official+'/'+name))fs.copyFileSync(official+'/'+name,record+'/official/'+name);
fs.mkdirSync(record+'/native');for(const [name,dir]of groups){fs.mkdirSync(record+'/native/'+name);for(const entry of fs.readdirSync(dir,{withFileTypes:true}))if(entry.isFile()&&/\.(?:json|log)$/.test(entry.name))fs.copyFileSync(dir+'/'+entry.name,record+'/native/'+name+'/'+entry.name);}
for(const name of ['quota-native-logs','private-native-logs'])if(fs.existsSync(base+'/'+name))fs.cpSync(base+'/'+name,record+'/'+name,{recursive:true,errorOnExist:true,force:false});
const patch=task+'/mods-final/'+manifest.id+'.json',destination=repo+'/mods/'+manifest.id+'.json';assert(!fs.existsSync(destination));fs.copyFileSync(patch,destination,fs.constants.COPYFILE_EXCL);assert(fs.readFileSync(patch).equals(fs.readFileSync(destination)));
const staged={status:'VERIFIED_READY_TO_APPLY',record,patch:destination,qsp:manifest.source,before:manifest.before,after:final,officialPassed:9,functional:{rumor:5,inventory:2,quota:11,private:privateReport.cases.length},protectedInputs:inputs.length,runtimeWritten:false};
fs.writeFileSync(base+'/STAGED.json',JSON.stringify(staged,null,2)+'\n');fs.writeFileSync(record+'/STAGED.json',JSON.stringify(staged,null,2)+'\n');console.log(JSON.stringify(staged));
