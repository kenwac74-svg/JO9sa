'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',rec=repo+'/records/wong-guild-dialogue-fix-20261030',c=require(repo+'/tools/text-workshop/core.cjs');
const read=p=>fs.readFileSync(p),j=p=>JSON.parse(read(p)),sha=p=>c.hash(read(p));
const r=j(here+'/installation.json'),verified=j(here+'/post-install-verification.json');
a(verified.pass);a.equal(sha(r.workQsp),r.after);a.equal(sha(r.backup),r.before);a.equal(sha(r.sourceSave),r.saveBeforeSha256);
r.status='VERIFIED';r.verification=verified;fs.writeFileSync(here+'/installation.json',JSON.stringify(r,null,2));
let count=0,bytes=0;
function copy(dir,relative=''){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const src=path.join(dir,e.name),rel=path.join(relative,e.name),dst=path.join(rec,rel);a(!e.isSymbolicLink(),'Unexpected report symlink');
  if(e.isDirectory()){copy(src,rel);continue;}
  if(!/\.(?:json|md|log|txt|cjs|py|ps1)$/.test(e.name))continue;
  const b=read(src);a(b.length<1024*1024,'Large non-report excluded: '+rel);
  fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,b);a.equal(sha(dst),c.hash(b));count++;bytes+=b.length;
 }
}
copy(here);console.log(JSON.stringify({status:'VERIFIED_RECORDS_SAVED',files:count,bytes,record:rec}));
