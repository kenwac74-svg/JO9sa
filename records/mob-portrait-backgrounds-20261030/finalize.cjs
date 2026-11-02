'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const H=__dirname,R='G:/somi/JO9sa/records/mob-portrait-backgrounds-20261030';
const read=p=>fs.readFileSync(p),j=p=>JSON.parse(read(p));
for(const n of ['png-verification.json','live-verification.json','independent-metadata-verification.json','independent-candidate-verification.json']){const v=j(H+'/'+n);a(v.pass===true||v.status==='PASS',n);}
const m=j(H+'/manifest.json');fs.mkdirSync(R+'/masks',{recursive:true});
for(const f of m.files)if(f.mask){const dst=R+'/masks/'+path.basename(f.mask);if(fs.existsSync(f.mask)){fs.copyFileSync(f.mask,dst);a(read(dst).equals(read(f.mask)));}else a(fs.existsSync(dst));}
const r=j(H+'/installation.json');r.status='VERIFIED';r.verification={png:'png-verification.json',http:'live-verification.json',independentMetadata:'independent-metadata-verification.json',independentPixels:'independent-candidate-verification.json'};
fs.writeFileSync(H+'/installation.json',JSON.stringify(r,null,2));
let count=0;for(const e of fs.readdirSync(H,{withFileTypes:true})){if(!e.isFile()||!/\.(?:json|md|cjs|py|jpg|png|ps1)$/.test(e.name))continue;const b=read(H+'/'+e.name);a(b.length<2*1024*1024);fs.writeFileSync(R+'/'+e.name,b);count++;}
console.log(JSON.stringify({status:'VERIFIED_RECORDS_SAVED',files:count,masks:m.files.filter(f=>f.mask).length,record:R}));
