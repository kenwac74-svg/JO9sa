'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/catalog-native-tabs-20261108',O=R+'/records/catalog-native-tabs-20261108',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before=JSON.parse(fs.readFileSync(T+'/before.json','utf8'));for(const [p,h]of Object.entries(before))a.equal(hash(p),h,'Concurrent modification: '+p);
const jobs=[['work/catalog_merge_vs_original.html',G+'/modtools/catalog/catalog_merge_vs_original.html'],['seed/catalog_merge_vs_original.html',R+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']];
for(const name of ['catalog_workshop.js','catalog-tabs.js'])for(const root of [G+'/modtools/catalog',R+'/tools/local-workspace/catalog-seed'])jobs.push([name,root+'/'+name]);
for(const name of ['server.cjs','catalog-tabs.cjs'])for(const root of [G+'/modtools/text-workshop',R+'/tools/text-workshop'])jobs.push([name,root+'/'+name]);
for(const [name,target]of [['catalog-girls-checklist.js',R+'/tools/girls-image-checklist/catalog-girls-checklist.js'],['catalog-scene-conditions.js',R+'/tools/scene-image-conditions/catalog-scene-conditions.js'],['generate.cjs',R+'/tools/scene-image-conditions/generate.cjs']])jobs.push([name,target]);
const changes=[];for(const [candidate,target]of jobs){let h=null;if(fs.existsSync(target)){h=hash(target);fs.writeFileSync(O+'/before/'+h+'.gz',z.gzipSync(fs.readFileSync(target)));}fs.copyFileSync(T+'/'+candidate,target);changes.push({target,before:h,after:hash(target)});}
for(const name of ['catalog-tabs.js','catalog-tabs.test.cjs','catalog-native-tabs.test.cjs','build-native-tabs.cjs','install-native-tabs.cjs'])fs.copyFileSync(path.join(__dirname,name),O+'/'+name);
fs.writeFileSync(O+'/installation.json',JSON.stringify({changes,protected:Object.fromEntries(Object.entries(before).filter(([p])=>p.endsWith('jack.qsp')||p.endsWith('catalog_status.js')))},null,2));
console.log(JSON.stringify({installed:changes.length}));
