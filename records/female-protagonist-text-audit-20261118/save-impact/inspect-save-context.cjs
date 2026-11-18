'use strict';
const fs=require('node:fs'),path=require('node:path');
const codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const q=core.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const reports=[];
for(const file of ['1.sav','bds.sav','josu.sav','안개순찰대.sav']){
 const raw=fs.readFileSync(path.join('G:/somi/Jack O Nine Tails v2.4_work/game/save',file)),s=codec.parse(raw),dec=codec.dec;
 let p=17;p+=+dec(s.lines[16]);p+=1+(+dec(s.lines[p]));
 const count=+dec(s.lines[p++]),actions=[];
 for(let i=0;i<count;i++){
  p+=2;const lines=+dec(s.lines[p++]);let codeBytes=0,ref=false;
  for(let j=0;j<lines;j++){const text=dec(s.lines[p]);codeBytes+=text.length*2;ref=ref||/#txt(?:_2)?_woman/i.test(text);p+=2;}
  const origin=+dec(s.lines[p++]),actIndex=+dec(s.lines[p++]),startLine=+dec(s.lines[p++]),managedLines=+dec(s.lines[p++]);
  actions.push({lines,codeBytes,femaleBankNameReference:ref,originLocationIndex:origin,currentQspLocationAtIndex:q.locations[origin]?.name??null,actIndex,startLine,managedLines,indexWouldShiftIfFemaleBanksDeleted:origin>233});
 }
 const contextNames=new Set(['ONGLOAD','ONGSAVE','ONNEWLOC','COUNTER','VOICE_PICK_FRAGMENT','TEXT','SP_TEXT','SPECIAL_ACTION','SPECIAL_PART','YES','NO','DISPLAY_OPTIONS','RETURN','RETURN_LOC','RETURN_LOCK','CITIES']);
 const context=s.vars.filter(v=>contextNames.has(v.name)).map(v=>({name:v.name,values:v.values.length,indices:v.idx.length,stringBytes:v.values.reduce((n,[num,t])=>n+2*t.length,0),femaleBankNameReferences:v.values.filter(([num,t])=>/#txt(?:_2)?_woman/i.test(t)).length}));
 const bankRefs=s.vars.filter(v=>v.values.some(([num,t])=>/#txt(?:_2)?_woman/i.test(t))).map(v=>({name:v.name,valuesWithReferences:v.values.filter(([num,t])=>/#txt(?:_2)?_woman/i.test(t)).length,activeLineMentions:v.values.reduce((n,[num,t])=>n+t.split(/\r?\n/).filter(line=>!/^\s*!/.test(line)&&/#txt(?:_2)?_woman/i.test(line)).length,0)}));
 reports.push({file,sha256:core.hash(raw),currentLocation:dec(s.lines[10]),renderedMainDescriptionBytes:dec(s.lines[8]).length*2,renderedAdditionalDescriptionBytes:dec(s.lines[9]).length*2,nativeActions:actions,context,allVariableFemaleBankReferences:bankRefs});
}
fs.writeFileSync(path.join(__dirname,'saved-context-evidence.json'),JSON.stringify({createdUtc:new Date().toISOString(),reports},null,2),'utf8');
console.log(JSON.stringify(reports.map(r=>({...r,context:undefined})),null,2));
