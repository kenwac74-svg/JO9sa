'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs');
const spec=JSON.parse(fs.readFileSync(here+'/spec.json')),rows=JSON.parse(fs.readFileSync(here+'/save-inspection.json'));
assert.equal(rows.length,spec.all.length);assert(rows.every(x=>x.pass));
const ref=spec.root+'/work-reference.sav',crc=fs.existsSync(ref)?s.parse(fs.readFileSync(ref)).lines[2]:null;
const stage=spec.root+'/pack';fs.mkdirSync(stage,{recursive:true});let all=[];
function interiorCache(d){
 const pair=(n,k)=>s.value(d,n,k),str=(n,k)=>pair(n,k)[1];
 function put(n,k,value){const v=d.vars.find(v=>v.name===n),i=v.idx.find(x=>x[1]===k.toUpperCase())?.[0];assert(i!==undefined,n+'.'+k);v.values[i][1]=value;}
 const estate=str('ESTATE'),changes=[];
 const rooms=[['study','STUDY','STUDY',true,'home_lux'],['bedroom','BED','BED',true,'bedroom_lux'],['bathroom','BATH','BATH',+pair('BATH')[0]>0,'bathroom_lux'],['dungeon','DUNGEON','DUNGEON',+pair('DUNGEON')[0]>0,'dungeon_lux'],['kitchen','KITCHEN','KITCHEN',+pair('KITCHEN')[0]>0,'kitchen_lux'],['lab','LAB','LAB',+pair('LAB')[0]>0,'lab_lux'],['boudoir','BOUDOIR','BOUDOIR',+pair('BOUDOIR')[0]>0,'boudoir_lux'],['barn','BARN','BARN',+pair('BARN')[0]>0,'barn_lux']];
 for(const [room,field,stem,enabled,large]of rooms){if(!enabled)continue;const key=str(field),value=room==='barn'?str('INTERIOR_BARN'):str('INTERIOR_'+stem,key),wide=room==='barn'?str('INTERIOR_BARN_LARGE'):str('INTERIOR_'+stem+'_LARGE',key);assert(value&&wide,'Existing interior definitions '+room);
  for(const [place,next]of [[room,value],[large,wide]]){const prev=str('BG',place);put('BG',place,next);if(prev&&prev!==next){for(let j=0;j<d.start;j++){let t=s.dec(d.lines[j]);for(const slash of ['\\','/']){const url=x=>'content'+slash+'pic'+slash+'bg'+slash+x.replace(/[\\/]/g,slash)+'.png';t=t.split(url(prev)).join(url(next));}d.lines[j]=s.enc(t);}changes.push({place,from:prev,to:next});}}
  put('PLACE_NAME',room,str('ESTATE_'+stem+'_NAME',estate));put('PLACE_LOCATION',room,str('ESTATE_'+stem+'_LOCATION',estate));put('PLACE_INFO',room,room==='barn'?str('INTERIOR_BARN_INFO'):str('INTERIOR_'+stem+'_INFO',key));
 }
 return changes;
}
for(const a of spec.all){
 const input=spec.root+'/out/'+a.file,raw=fs.readFileSync(input),d=s.parse(raw);
 d.vars=d.vars.filter(v=>!/^(?:QA_|JO9SV_)/.test(v.name));
 const sceneChanges=interiorCache(d);
 if(crc)d.lines[2]=crc;
 const output=s.serialize(d),check=s.parse(output);assert(s.serialize(check).equals(output));
 const texts=[...check.lines.slice(0,check.start).map(s.dec),...check.vars.flatMap(v=>v.values.map(x=>x[1]))].join('\n');assert(!/qa_emit|jo9sv_boot|JO9_QA_|jo9sv_case/i.test(texts));
 const group=a.group==='manual'?'02_수동확인_문제재현':'01_검사완료재확인',rel=group+'/'+a.file;
 fs.mkdirSync(stage+'/'+group,{recursive:true});fs.writeFileSync(stage+'/'+rel,output);
 all.push({index:a.index,id:a.id,title:a.titleKo,group:a.group,path:rel,sha256:c.hash(output),bytes:output.length,checkpoint:a.checkpoint,preparedByNativeEngine:true,fullScriptCachePreserved:true,interiorCacheFromOriginalRestoreRules:sceneChanges,normalLoadCallback:true,emptyDiagnosticVariablesRemoved:true,crcFromUnmodifiedWork:!!crc});
}
fs.writeFileSync(here+'/manifest.json',JSON.stringify({source:spec.source,sourceSha256:spec.sha256,saveVersion:'5.7.0',count:all.length,checked:all.filter(a=>a.group==='checked').length,manual:all.filter(a=>a.group==='manual').length,totalBytes:all.reduce((n,a)=>n+a.bytes,0),crcFromUnmodifiedWork:!!crc,files:all},null,2));
fs.writeFileSync(stage+'/검사항목.tsv','\uFEFF번호\t분류\t검사 내용\t세이브 경로\n'+all.map(a=>[String(a.index).padStart(2,'0'),a.group==='manual'?'수동 확인·미수정 재현':'기존 검사 재확인',a.title,a.path].join('\t')).join('\n'));
console.log(JSON.stringify({staged:all.length,checked:all.filter(a=>a.group==='checked').length,manual:all.filter(a=>a.group==='manual').length,crcFromUnmodifiedWork:!!crc,totalMiB:all.reduce((n,a)=>n+a.bytes,0)/1048576}));
