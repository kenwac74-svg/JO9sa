'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),W='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp';
const before={work:c.hash(fs.readFileSync(W)),full:c.hash(fs.readFileSync(F))};
a.equal(before.work,'78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d');a.equal(before.full,'f87363c3050547ae6b7a5387ae9870425fdc4d68cb2e07855e4550df29664168');
const native=JSON.parse(fs.readFileSync(__dirname+'/game/native-final-results.json','utf8')),historical=JSON.parse(fs.readFileSync(__dirname+'/historical/native-historical-report.json','utf8')),toggle=JSON.parse(fs.readFileSync(__dirname+'/toggle-native-report.json','utf8')),fix=JSON.parse(fs.readFileSync(__dirname+'/toggle-fix-native-report.json','utf8'));
a.equal(native.failures,0);a.equal(historical.pass,true);a.equal(toggle.confirmedRegression,true);a.equal(fix.pass,true);
const roots=['qa-bounty-241-game-20261101','qa-bounty-241-historical-78835089','qa-bounty-241-toggle-20261101','qa-bounty-241-toggle-v2-20261101','qa-bounty-241-toggle-v3-20261101','qa-bounty-241-toggle-fix-20261101'];
fs.mkdirSync(__dirname+'/fixture-diagnostics',{recursive:true});
function preserveSmall(dir,label){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),s=fs.lstatSync(p);if(s.isSymbolicLink())continue;if(s.isDirectory())preserveSmall(p,label+'_'+name);else if(/\.(?:log|json)$/.test(name)&&s.size<4000000)fs.copyFileSync(p,__dirname+'/fixture-diagnostics/'+label+'_'+name);}}
let files=0,bytes=0,links=0;const removed=[];
function discard(p){const s=fs.lstatSync(p);if(s.isSymbolicLink()){fs.unlinkSync(p);links++;}else if(s.isDirectory()){for(const n of fs.readdirSync(p))discard(path.join(p,n));fs.rmdirSync(p);}else{files++;bytes+=s.size;fs.unlinkSync(p);}}
for(const name of roots){const p=path.resolve('G:/Codex/tmp',name);a.equal(path.dirname(p).toLowerCase(),path.resolve('G:/Codex/tmp').toLowerCase());if(!fs.existsSync(p))continue;a.equal(fs.realpathSync(p).toLowerCase(),p.toLowerCase());preserveSmall(p,name);discard(p);removed.push(p);}
a.equal(c.hash(fs.readFileSync(W)),before.work);a.equal(c.hash(fs.readFileSync(F)),before.full);
const report={files,bytesFreed:bytes,linksNotFollowed:links,removed,protectedUnchanged:before,privateSavesTouched:false,publicTCOriginalsTouched:false,diagnosticQspAndSavRetained:false};fs.writeFileSync(__dirname+'/cleanup.json',JSON.stringify(report,null,2));console.log(JSON.stringify({files,megabytesFreed:Math.round(bytes/1048576),linksNotFollowed:links,protectedUnchanged:true}));
