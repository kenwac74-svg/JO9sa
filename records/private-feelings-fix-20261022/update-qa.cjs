'use strict';
const fs=require('node:fs');
const repo='G:/somi/JO9sa',root='G:/Codex/tmp/jo9-private-feelings-fix-20261022';
fs.mkdirSync(root+'/qa-before',{recursive:true});
function edit(file,changes,bom=false){const p=repo+'/'+file;let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');const original=s;for(const[a,b]of changes){if(s.split(a).length!==2)throw Error('Nonunique '+a.slice(0,70));s=s.replace(a,b);}const backup=root+'/qa-before/'+file.split('/').at(-1);if(!fs.existsSync(backup))fs.writeFileSync(backup,original);fs.writeFileSync(p,(bom?'\uFEFF':'')+s);}
edit('tools/qa/run-client-smoke.ps1',[["param([Parameter(Mandatory=$true)][string]$Engine,[Parameter(Mandatory=$true)][string]$Plan)","param([Parameter(Mandatory=$true)][string]$Engine,[Parameter(Mandatory=$true)][string]$Plan,[ValidateRange(1,60)][int]$TimeoutSeconds=12)"],["$probeDeadline=(Get-Date).AddSeconds(12)","$probeDeadline=(Get-Date).AddSeconds($TimeoutSeconds)"]],true);
const helper=["function clientRunnerTiming(option,probeCount){"," const timeoutSeconds=option===undefined?12:Number(option);"," if(!Number.isSafeInteger(timeoutSeconds)||timeoutSeconds<1||timeoutSeconds>60)throw Error('Client timeout must be an integer from 1 to 60 seconds');"," if(!Number.isSafeInteger(probeCount)||probeCount<1)throw Error('Positive probe count required');"," return{timeoutSeconds,runnerTimeoutMs:(timeoutSeconds*probeCount+12)*1000};","}","function powershell(args,log,timeoutMs=120000){"].join('\r\n');
edit('tools/qa/release-check.cjs',[
 ["function powershell(args,log){",helper],
 ["windowsHide:true,timeout:120000,maxBuffer:4*1024*1024","windowsHide:true,timeout:timeoutMs,maxBuffer:4*1024*1024"],
 ["'profile','cache-revision']","'profile','cache-revision','client-timeout-seconds']"],
 ["if(!['static','release'].includes(o.profile))throw Error('profile must be static or release');return o;","if(!['static','release'].includes(o.profile))throw Error('profile must be static or release');\r\n clientRunnerTiming(o['client-timeout-seconds'],9);return o;"],
 ["let runnerError;try{powershell(['-File',path.join(__dirname,'run-client-smoke.ps1'),'-Engine',path.resolve(o.engine),'-Plan',planFile],path.join(output,'client-runner.log'));}catch(e){runnerError=e;}","const timing=clientRunnerTiming(o['client-timeout-seconds'],plan.length);\r\n    let runnerError;try{powershell(['-File',path.join(__dirname,'run-client-smoke.ps1'),'-Engine',path.resolve(o.engine),'-Plan',planFile,'-TimeoutSeconds',String(timing.timeoutSeconds)],path.join(output,'client-runner.log'),timing.runnerTimeoutMs);}catch(e){runnerError=e;}"],
 ["report.client={engineSha256:","report.client={timeoutSeconds:timing.timeoutSeconds,runnerTimeoutMs:timing.runnerTimeoutMs,engineSha256:"],
 ["module.exports={inspectWorld,verdict,validatePatchSet,primeState,buildSmoke,assertOutside,parseArgs,run};","module.exports={inspectWorld,verdict,validatePatchSet,primeState,buildSmoke,assertOutside,parseArgs,clientRunnerTiming,run};"]
]);
console.log('QA timeout option added; default12 seconds and all9 completion markers unchanged.');
