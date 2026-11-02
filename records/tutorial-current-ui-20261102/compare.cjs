'use strict';
const fs=require('fs'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),O=__dirname;
const report={beforeSha256:'6bb939464a7370526ced33c6b51fcb4f0b5023b94bbe1d1bd78dba6bec44398d',candidateSha256:'8a3c7604d713b4ec254a90331d65f08ffc5ef8032ae6f7132106f96cfb432b6c',checks:[],pass:false};
for(const name of ['lecture-menu','home-menu-17','home-menu-2000']){
 const red=JSON.parse(fs.readFileSync(O+'/cases/red-'+name+'-report.json')),green=JSON.parse(fs.readFileSync(O+'/cases/green-'+name+'-report.json'));assert(red.completed&&green.completed,name+' engine completed');assert.equal(red.prepared.sourceSha256,report.beforeSha256);assert.equal(green.prepared.sourceSha256,report.candidateSha256);
 const a=red.domObservations[0],b=green.domObservations[0];for(const key of ['textContent','mainText','links'])assert.deepEqual(b[key],a[key],name+' '+key);
 const ai=red.prepared.caseIndex,bi=green.prepared.caseIndex;for(const key of ['days','sparks','stocks','slaves','pages','lectures','exams'])assert.equal(green[key][bi],red[key][ai],name+' '+key);
 report.checks.push({name,actualLinksCompared:a.links.length,originalVisibleText:true,originalCallbacksAndOrder:true,originalDayMoneyChoiceActorPageLectureExam:true,pass:true});
}
report.pass=true;fs.writeFileSync(O+'/runtime-comparison-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
