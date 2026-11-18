'use strict';
// Source + SAV files are read-only. Does not create, load, or alter a SAV.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const qsp='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const qraw=fs.readFileSync(qsp),q=core.parse(qraw),banks=new Set(['#txt_woman','#txt_2_woman']);
const femaleAssignments=[],otherNames=new Set(),otherLiteralStrings=new Set();
function assignments(body){
 const out=[];
 for(const e of core.literals(body)){
  const lineStart=body.lastIndexOf('\n',e.start-1)+1;
  const prefix=body.slice(lineStart,e.start-1);
  const m=prefix.match(/^\s*(\$?[\p{L}_][\p{L}\p{N}_]*)(?:\[([^\r\n]*)\])?\s*=\s*$/u);
  if(m)out.push({name:m[1].replace(/^\$/,'').toUpperCase(),key:m[2]??null,text:e.text,line:e.line,interpolated:/<</.test(e.text)});
 }
 return out;
}
for(const l of q.locations){
 const body=core.shift(q.lines[l.body],5),aa=assignments(body);
 if(banks.has(l.name))femaleAssignments.push(...aa.map(a=>({...a,location:l.name})));
 else{
  for(const a of aa)otherNames.add(a.name);
  for(const e of core.literals(body))otherLiteralStrings.add(e.text);
 }
}
const femaleNames=new Set(femaleAssignments.map(a=>a.name));
const onlyFemaleNames=new Set([...femaleNames].filter(n=>!otherNames.has(n)));
const distinctiveTexts=new Set(femaleAssignments.filter(a=>!a.interpolated&&a.text&&!otherLiteralStrings.has(a.text)).map(a=>a.text));
const exactByName=new Map();
for(const a of femaleAssignments)if(distinctiveTexts.has(a.text)){const set=exactByName.get(a.name)||new Set();set.add(a.text);exactByName.set(a.name,set);}
function recordBytes(v){
 let n=String(v.slot).length+v.name.length+String(v.values.length).length+String(v.idx.length).length;
 for(const [num,t] of v.values)n+=num.length+t.length;
 for(const [i,k] of v.idx)n+=String(i).length+k.length;
 return 2*(n+2*(4+2*v.values.length+2*v.idx.length));
}
const reports=[];
for(const file of ['1.sav','bds.sav','josu.sav','안개순찰대.sav']){
 const p=path.join('G:/somi/Jack O Nine Tails v2.4_work/game/save',file),before=fs.statSync(p),raw=fs.readFileSync(p),sha=core.hash(raw),s=codec.parse(raw);
 assert(codec.serialize(s).equals(raw),'Native SAV codec must round-trip exactly');
 const rows=[];let sameNameDistinctMatches=0,anyDistinctMatches=0;
 for(const v of s.vars){
  const exact=exactByName.get(v.name);
  const matching=v.values.filter(([n,t])=>exact?.has(t));
  sameNameDistinctMatches+=matching.length;
  anyDistinctMatches+=v.values.filter(([n,t])=>distinctiveTexts.has(t)).length;
  if(femaleNames.has(v.name))rows.push({name:v.name,slot:v.slot,values:v.values.length,indices:v.idx.length,serializedBytes:recordBytes(v),exclusiveAssignmentName:onlyFemaleNames.has(v.name),femaleDistinctFixedTextMatches:matching.length,femaleDistinctFixedTextBytes:matching.reduce((n,[num,t])=>n+2*t.length,0)});
 }
 const voice=s.vars.filter(v=>v.name.startsWith('VOICE_FRAGMENT')).map(v=>({name:v.name,values:v.values.length,indices:v.idx.length,serializedBytes:recordBytes(v)}));
 const scalar=n=>codec.value(s,n);
 const state={heroChoice:scalar('hero_choice')[0],currentLocation:codec.dec(s.lines[10]),codeRev:scalar('code_rev')[1],voiceFragmentRevision:scalar('voice_fragment_revision')[0],ongload:scalar('ongload')[1],ongsave:scalar('ongsave')[1],voicePickerHasLazyGuard:scalar('voice_pick_fragment')[1].includes('JO9_SAVE_VOICE_LAZY_20261118')};
 const femaleExclusiveRecords=rows.filter(r=>r.exclusiveAssignmentName);
 const after=fs.statSync(p),afterHash=core.hash(fs.readFileSync(p));
 reports.push({file,bytes:raw.length,sha256:sha,stable:sha===afterHash&&before.size===after.size&&before.mtimeMs===after.mtimeMs,roundTripExact:true,state,bankAssignmentVariableRecords:rows.length,bankAssignmentVariableSerializedBytes:rows.reduce((n,v)=>n+v.serializedBytes,0),bankExclusiveAssignmentNameRecords:femaleExclusiveRecords.length,bankExclusiveAssignmentNameBytes:femaleExclusiveRecords.reduce((n,v)=>n+v.serializedBytes,0),sameNameFemaleDistinctFixedTextMatches:sameNameDistinctMatches,anyFemaleDistinctFixedTextMatches:anyDistinctMatches,voiceCacheVariableRecords:voice.length,voiceCacheSerializedBytes:voice.reduce((n,v)=>n+v.serializedBytes,0),voice,rows});
 console.log(JSON.stringify({...reports.at(-1),rows:undefined,voice:undefined}));
}
const result={createdUtc:new Date().toISOString(),qsp:{path:qsp,bytes:qraw.length,sha256:q.hash},privacy:'No saved dialogue, actor identifiers, or personal text emitted. Only code identifiers, counts, hashes and sizes.',method:'Counts direct string-literal assignments. Distinctive fixed texts exclude interpolation and every identical literal outside the two female banks. Shared variable totals are not savings. Exclusive assignment names are evidence candidates, not a deletion whitelist.',femaleBankAssignment:{directStringAssignments:femaleAssignments.length,variableNames:femaleNames.size,sharedElsewhere:[...femaleNames].filter(n=>otherNames.has(n)).length,exclusiveDirectStringAssignmentNames:[...onlyFemaleNames],distinctiveFixedTexts:distinctiveTexts.size,interpolatedAssignments:femaleAssignments.filter(a=>a.interpolated).length},reports};
fs.writeFileSync(path.join(__dirname,'save-bank-measurements.json'),JSON.stringify(result,null,2),'utf8');
console.log(JSON.stringify(result.femaleBankAssignment));
