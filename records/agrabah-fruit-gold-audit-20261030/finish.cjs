'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,R='G:/somi/JO9sa/records/agrabah-fruit-gold-audit-20261030',j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const p=j(H+'/prepared.json'),n=j(H+'/native-results.json');a(n.pass&&n.nativeCases===6);a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),p.qsp);a.equal(c.hash(fs.readFileSync(p.sourceSave)),p.saveHash);
fs.mkdirSync(R,{recursive:true});let files=0,bytes=0;
for(const e of fs.readdirSync(H,{withFileTypes:true})){if(!e.isFile()||!/\.(?:json|md|cjs|ps1|log|txt)$/.test(e.name))continue;const b=fs.readFileSync(H+'/'+e.name);if(!b.length)continue;a(b.length<2*1024*1024);fs.writeFileSync(R+'/'+e.name,b);files++;bytes+=b.length;}
console.log(JSON.stringify({status:'AUDIT_RECORDED_NO_RUNTIME_CHANGE',files,bytes,record:R}));
