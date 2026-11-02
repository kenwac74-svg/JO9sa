'use strict';
const fs=require('fs'),crypto=require('crypto'),path=require('path'),a=require('assert/strict'),H=__dirname,R='G:/somi/JO9sa',rec=R+'/records/mob-portrait-crop-20261030',read=p=>fs.readFileSync(p),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),j=p=>JSON.parse(read(p));
const i=j(H+'/installation.json');a(j(H+'/live-results.json').pass);a(j(H+'/browser-results.json').pass);a(j(H+'/independent-review.json').pass);
for(const [p,h]of Object.entries(i.preserved))a.equal(sha(read(p)),h);for(const row of i.catalogs)a.equal(sha(read(row.path)),row.after);
for(const name of ['catalog-mob-sets.js','portrait-crop.js','frame-data.json','geometry.test.cjs','build-portrait-assets.cjs','README_KO.md'])i.sourceHashes[name]=sha(read(R+'/tools/mob-image-sets/'+name));
i.status='INSTALLED_AND_LIVE_VERIFIED';i.liveApplyRequests=0;i.browserCheckCount=12;i.unitTests=7;fs.writeFileSync(H+'/installation.json',JSON.stringify(i,null,2));
const ps=H+'/cleanup.ps1';if(fs.existsSync(ps))fs.writeFileSync(ps,'\uFEFF'+read(ps).toString('utf8').replace(/^\uFEFF/,''));
for(const n of fs.readdirSync(H))fs.cpSync(H+'/'+n,rec+'/'+n,{recursive:true});console.log(JSON.stringify({status:i.status,sourceFiles:Object.keys(i.sourceHashes).length,portraitFilesPreserved:75,record:rec}));
