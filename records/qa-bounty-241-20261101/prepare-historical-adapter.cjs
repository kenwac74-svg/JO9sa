'use strict';
const fs=require('fs'),a=require('assert/strict'),path=require('path');
const from='G:/somi/JO9sa/records/full-prezip-20261101/native-historical-regressions.cjs';
let s=fs.readFileSync(from,'utf8');
const old="assert.equal(path.resolve(input),path.resolve(F+'/jack.qsp'),'Only completed Full QSP is an execution target');";
a(s.includes(old));s=s.replace(old,"assert.equal(path.resolve(input),path.resolve(W+'/jack.qsp'),'Independent QA uses the pinned current WORK only');");
s=s.replaceAll('G:/Codex/tmp/full-prezip-20261101-historical-','G:/Codex/tmp/qa-bounty-241-historical-');
fs.mkdirSync(__dirname+'/historical',{recursive:true});fs.writeFileSync(__dirname+'/historical/native.cjs',s);
console.log('Historical test adapter copied; only input guard and owned output prefix changed');
