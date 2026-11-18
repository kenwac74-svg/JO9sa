'use strict';
// Hypothetical byte calculation only. Inputs and original SAVs remain untouched.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const qraw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),q=core.parse(qraw);
const metadataNames=new Set(['MASTER_BASE_NAME','HERO_DESCRIPTION','HERO_DIFFICULTY','MASTER_VERSION_STATS','CLEAR_AVA_PATH','SEPIA_AVA_PATH']);
const displayNames=new Set(['FEMALE_VIRGINITY','FEMALE_VAGINAL_MODIFICATION','FEMALE_BOOBS_MODIFICATION','FEMALE_AGE_NAME','FEMALE_BOOBS','FEMALE_ANAL_DESCRIPTION']);
const dynamicNames=new Set(['WOMAN_DOSUG_OPTIONS','BLACK_BAZAR_WOMAN_OPTIONS','SCROLL_HEROES_WOMAN','SCROLL_HEROES_WOMAN_BACK']);
const wholeNames=new Set([...displayNames,...dynamicNames,'PREGNANT_FEMALE_TAKEN']);
function recordBytes(v){
 let chars=String(v.slot).length+v.name.length+String(v.values.length).length+String(v.idx.length).length;
 for(const [n,t] of v.values)chars+=n.length+t.length;
 for(const [i,k] of v.idx)chars+=String(i).length+k.length;
 return 2*(chars+2*(4+2*v.values.length+2*v.idx.length));
}
const sourceEvidence=[];
for(const loc of q.locations){
 const lines=core.shift(q.lines[loc.body],5).split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  if(/^\s*!/.test(lines[i]))continue;
  const m=lines[i].match(/^\s*(\$[a-z_]+)(?:\[(\d+)\])?\s*=/i);
  if(m&&(metadataNames.has(m[1].slice(1).toUpperCase())&&+m[2]>=101&&+m[2]<=124||wholeNames.has(m[1].slice(1).toUpperCase())))sourceEvidence.push({location:loc.name,line:i+1,variable:m[1],index:m[2]??null});
 }
}
const reports=[];
for(const file of ['1.sav','bds.sav','josu.sav','안개순찰대.sav']){
 const p=path.join('G:/somi/Jack O Nine Tails v2.4_work/game/save',file),before=fs.statSync(p),raw=fs.readFileSync(p),s=codec.parse(raw),sha=core.hash(raw);
 const headerBytes=Buffer.byteLength(s.lines.slice(0,s.start).join('\r\n')+'\r\n','utf16le');
 assert.equal(headerBytes+Buffer.byteLength(codec.enc(s.vars.length)+'\r\n','utf16le')+s.vars.reduce((n,v)=>n+recordBytes(v),0),raw.length,'Exact record byte accounting');
 const metadata=[],wholeRecords=[];let fullRemovalVars=0;
 for(const v of s.vars){
  if(metadataNames.has(v.name)){
   const targeted=[];
   const values=v.values.map(([n,t],i)=>{if(i>=101&&i<=124){targeted.push({index:i,stringBytes:t.length*2,numeric:n});return [n,''];}return [n,t];});
   const blanked={...v,values};
   const canTrimTail=v.values.length<=125&&v.values.length>101&&v.idx.every(([i,k])=>i<101)&&targeted.every(v=>v.numeric==='0');
   const trimmed=canTrimTail?{...blanked,values:blanked.values.slice(0,101)}:null;
   assert.deepEqual(blanked.idx,v.idx);
   assert(v.values.every((a,i)=>i>=101&&i<=124||JSON.stringify(a)===JSON.stringify(blanked.values[i])));
   metadata.push({name:v.name,slot:v.slot,values:v.values.length,indices:v.idx.length,totalRecordBytes:recordBytes(v),targetedValues:targeted.length,nonemptyTargetedStrings:targeted.filter(v=>v.stringBytes>0).length,targetedStringPayloadBytes:recordBytes(v)-recordBytes(blanked),targetedNonzeroNumericCount:targeted.filter(v=>v.numeric!=='0').length,blankedPreservesNumericState:true,canTrimFemaleTailWithoutShiftingOtherIds:canTrimTail,tailTrimBytes:trimmed?recordBytes(v)-recordBytes(trimmed):null});
  }
  if(wholeNames.has(v.name)){
   const nonzero=v.values.filter(([n,t])=>n!=='0').length;
   const stringBytes=v.values.reduce((n,[num,t])=>n+2*t.length,0);
   const group=displayNames.has(v.name)?'female_display_tables':dynamicNames.has(v.name)?'female_named_dynamic_code':'pregnant_female_taken';
   wholeRecords.push({name:v.name,group,slot:v.slot,values:v.values.length,indices:v.idx.length,numericNonzeroValues:nonzero,stringPayloadBytes:stringBytes,entireRecordBytes:recordBytes(v),hypotheticalWholeRecordRemovalPreservesNonzeroNumerics:nonzero===0});
   if(nonzero===0)fullRemovalVars++;
  }
 }
 const grouped=group=>wholeRecords.filter(r=>r.group===group).reduce((a,r)=>({records:a.records+1,stringPayloadBytes:a.stringPayloadBytes+r.stringPayloadBytes,entireRecordBytes:a.entireRecordBytes+r.entireRecordBytes,nonzeroNumericValues:a.nonzeroNumericValues+r.numericNonzeroValues}),{records:0,stringPayloadBytes:0,entireRecordBytes:0,nonzeroNumericValues:0});
 const removedRecordBytes=wholeRecords.filter(r=>r.numericNonzeroValues===0).reduce((n,r)=>n+r.entireRecordBytes,0);
 const preservedNumericRecordStringBytes=wholeRecords.filter(r=>r.numericNonzeroValues>0).reduce((n,r)=>n+r.stringPayloadBytes,0);
 const globalCountDigitBytes=2*(String(s.vars.length).length-String(s.vars.length-fullRemovalVars).length);
 const metaPayload=metadata.reduce((n,r)=>n+r.targetedStringPayloadBytes,0);
 const metaTrim=metadata.reduce((n,r)=>n+(r.tailTrimBytes??r.targetedStringPayloadBytes),0);
 const after=fs.statSync(p),afterHash=core.hash(fs.readFileSync(p));
 const mixedSavings=removedRecordBytes+preservedNumericRecordStringBytes+globalCountDigitBytes+metaTrim;
 let inMemorySerializeCheck=null;
 if(file==='josu.sav'){
  const candidate={...s,vars:s.vars.flatMap(v=>{
   if(metadataNames.has(v.name)){
    let values=v.values.map(([n,t],i)=>i>=101&&i<=124?[n,'']:[n,t]);
    if(v.values.length<=125&&v.values.length>101&&v.idx.every(([i,k])=>i<101)&&v.values.slice(101,125).every(([n,t])=>n==='0'))values=values.slice(0,101);
    return [{...v,values}];
   }
   if(wholeNames.has(v.name))return v.values.every(([n,t])=>n==='0')?[]:[{...v,values:v.values.map(([n,t])=>[n,''])}];
   return [v];
  })};
  const serialized=codec.serialize(candidate);
  assert.equal(raw.length-serialized.length,mixedSavings);
  assert(s.vars.filter(v=>!metadataNames.has(v.name)&&!wholeNames.has(v.name)).every(v=>candidate.vars.includes(v)));
  assert(candidate.vars.every(v=>v.idx===s.vars.find(b=>b.slot===v.slot).idx));
  inMemorySerializeCheck={bytes:serialized.length,deltaBytes:raw.length-serialized.length,untargetedVariablesIdenticalObjects:true,allRemainingIndexMapsIdenticalObjects:true,written:false};
 }
 reports.push({file,bytes:raw.length,sha256:sha,stable:sha===afterHash&&before.size===after.size&&before.mtimeMs===after.mtimeMs,heroChoice:codec.value(s,'hero_choice')[0],exactByteAccounting:true,metadata,wholeRecords,groups:{metadata101to124:{records:metadata.length,stringPayloadBytes:metaPayload,tailTrimBytes:metaTrim},femaleDisplayTables:grouped('female_display_tables'),femaleNamedDynamicCode:grouped('female_named_dynamic_code'),pregnantFemaleTaken:grouped('pregnant_female_taken')},hypotheticalSavings:{allSelectedStringsOnlyBytes:metaPayload+wholeRecords.reduce((n,r)=>n+r.stringPayloadBytes,0),selectedWholeRecordsAndMetadataStringsBytes:removedRecordBytes+preservedNumericRecordStringBytes+globalCountDigitBytes+metaPayload,selectedWholeRecordsAndSafeFemaleMetadataTailBytes:mixedSavings,preservedNonzeroNumericRecordCount:wholeRecords.filter(r=>r.numericNonzeroValues>0).length,removedRecordCount:fullRemovalVars,otherVariablesSlotsValuesAndIndexMapsPreserved:true,noSaveWritten:true,inMemorySerializeCheck}});
 console.log(JSON.stringify({...reports.at(-1),metadata:undefined,wholeRecords:undefined}));
}
fs.writeFileSync(path.join(__dirname,'additional-female-save-measurements.json'),JSON.stringify({createdUtc:new Date().toISOString(),qspSha256:q.hash,scope:'Requested 6 metadata arrays IDs101..124, 6 female display tables, PREGNANT_FEMALE_TAKEN and 4 named female dynamic arrays. Calculation does not establish implementation/deletion safety.',sourceEvidence,reports},null,2),'utf8');
