'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),z=require('zlib'),a=require('assert/strict');
const T='G:/Codex/tmp/workshop-native-layout-20261108',O='G:/somi/JO9sa/records/workshop-native-layout-20261108',R='G:/somi/JO9sa/tools/text-workshop',G='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),before=JSON.parse(fs.readFileSync(T+'/before.json','utf8'));
for(const [p,h]of Object.entries(before))a.equal(hash(p),h,'Concurrent modification: '+p);
const changes=[];for(const [id,root]of [['source',R],['work',G]])for(const name of ['index.html','workshop.css','workshop-ui.js','script-range.js','script-export.js','dialogue-ai.js','variable-inspector.js','journal-keywords-ui.js','server.cjs']){const p=root+'/'+name;let h=null;if(fs.existsSync(p)){h=hash(p);fs.writeFileSync(O+'/before/'+h+'.gz',z.gzipSync(fs.readFileSync(p)));}fs.copyFileSync(T+'/'+id+'/'+name,p);changes.push({file:p,before:h,after:hash(p)});}
for(const n of ['workshop-ui.test.cjs','workshop-native-layout.test.cjs'])fs.copyFileSync(__dirname+'/'+n,R+'/'+n);
fs.writeFileSync(O+'/installation.json',JSON.stringify({changes,protected:Object.fromEntries(Object.entries(before).filter(([p])=>p.endsWith('jack.qsp')||p.endsWith('catalog_status.js')))},null,2));
fs.copyFileSync(T+'/before.json',O+'/before.json');
for(const name of ['build-workshop-layout.cjs','install-workshop-layout.cjs','workshop-native-layout.test.cjs','workshop-ui.test.cjs','workshop-ui.js'])fs.copyFileSync(__dirname+'/'+name,O+'/'+name);
console.log(JSON.stringify({installed:changes.length}));
