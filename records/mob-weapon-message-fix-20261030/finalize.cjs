'use strict';
const fs=require('fs'),a=require('assert/strict'),H=__dirname,j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),v=j(H+'/path.json'),c=require(v.repo+'/tools/text-workshop/core.cjs');
a(j(H+'/verification.json').pass);a(j(H+'/independent-review.json').pass);a.equal(c.hash(fs.readFileSync(v.game+'/jack.qsp')),v.candidateSha256);a.equal(c.hash(fs.readFileSync(v.stateSave)),v.saveSha256);
const ps=H+'/cleanup.ps1';fs.writeFileSync(ps,'\uFEFF'+fs.readFileSync(ps,'utf8').replace(/^\uFEFF/,''));const rec=v.repo+'/records/'+v.id;fs.mkdirSync(rec,{recursive:true});for(const n of fs.readdirSync(H))fs.cpSync(H+'/'+n,rec+'/'+n,{recursive:true});console.log(JSON.stringify({status:'RECORD_SAVED',record:rec,report:rec+'/REPORT_KO.md'}));
