'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs');
const spec=JSON.parse(fs.readFileSync(here+'/spec.json')),manifest=JSON.parse(fs.readFileSync(here+'/manifest.json')),stage=spec.root+'/pack';
const refRaw=fs.readFileSync(spec.root+'/work-reference.sav'),reference=s.parse(refRaw);assert.equal(s.value(reference,'SPARKS')[0],'360');assert.equal(s.value(reference,'JO9_LQ','active')[0],'0');
const crc=reference.lines[2],nl=Buffer.from('\r\n','utf16le');
for(const a of manifest.files){const p=stage+'/'+a.path,raw=fs.readFileSync(p),first=raw.indexOf(nl),second=raw.indexOf(nl,first+4),third=raw.indexOf(nl,second+4);assert(first>=0&&second>first&&third>second);const out=Buffer.concat([raw.subarray(0,second+4),Buffer.from(crc,'utf16le'),raw.subarray(third)]);fs.writeFileSync(p,out);a.sha256=c.hash(out);a.bytes=out.length;a.crcFromUnmodifiedWork=true;}
manifest.crcFromUnmodifiedWork=true;manifest.workNativeCrc=s.dec(crc);manifest.totalBytes=manifest.files.reduce((n,a)=>n+a.bytes,0);fs.writeFileSync(here+'/manifest.json',JSON.stringify(manifest,null,2));
const basePath=manifest.files.find(a=>a.id==='bill-settle-once').path,baseRaw=fs.readFileSync(stage+'/'+basePath),base=s.parse(baseRaw),byName=new Map(base.vars.map(v=>[v.name,v]));
const changed=Object.fromEntries(reference.vars.filter(v=>JSON.stringify(byName.get(v.name))!==JSON.stringify(v)).map(v=>[v.name,v]));
const delta={baseFile:basePath,baseSha256:c.hash(baseRaw),targetSha256:c.hash(refRaw),header:reference.lines.slice(0,reference.start),order:reference.vars.map(v=>v.name),changed};
const restored=s.serialize({lines:delta.header,start:delta.header.length,vars:delta.order.map(n=>delta.changed[n]||byName.get(n))});assert(restored.equals(refRaw),'Verification save lossless delta restore');fs.writeFileSync(here+'/settlement-reference.delta.json',JSON.stringify(delta));
const target=path.resolve(work+'/save/JO9_MANUAL_20261025'),allowed=path.resolve(work+'/save');assert(target.startsWith(allowed+path.sep)&&path.dirname(target)===allowed);assert(!fs.existsSync(target),'Do not overwrite an existing pack');
for(const a of JSON.parse(fs.readFileSync(here+'/inputs.json')))assert.equal(c.hash(fs.readFileSync(a.path)),a.sha256,'Original changed '+a.path);
for(const a of manifest.files){const p=path.join(target,a.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(stage+'/'+a.path,p,fs.constants.COPYFILE_EXCL);assert.equal(c.hash(fs.readFileSync(p)),a.sha256);}
fs.copyFileSync(stage+'/검사항목.tsv',target+'/검사항목.tsv',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(here+'/installation.json',JSON.stringify({target,installed:manifest.files.length,workNativeCrc:manifest.workNativeCrc,crcFromByteIdenticalWork:true,originalFilesPreserved:96,referenceSaveRecoverableFromDelta:true,referenceDeltaBytes:fs.statSync(here+'/settlement-reference.delta.json').size},null,2));
console.log(JSON.stringify({installed:manifest.files.length,target,crc:manifest.workNativeCrc,deltaMiB:fs.statSync(here+'/settlement-reference.delta.json').size/1048576}));
