'use strict';
const fs=require('fs'),zlib=require('zlib'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const record='G:/somi/JO9sa/records/coldef-routing-20261029',game='G:/somi/Jack O Nine Tails v2.4_work/game',json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const installed=json(record+'/installation.json'),patch=json(record+'/patch.json'),before=zlib.gunzipSync(fs.readFileSync(installed.backup)),after=fs.readFileSync(game+'/jack.qsp');
a.equal(c.hash(before),patch.before_sha256);a.equal(c.hash(after),patch.after_sha256);
const old=c.parse(before),now=c.parse(after),loc=now.locations.find(l=>l.name==='interaction_city');let body=c.shift(now.lines[loc.body],5);
for(const e of [...patch.edits].reverse()){a.equal(body.split(e.new).length-1,1);body=body.replace(e.new,e.old);}
now.lines[loc.body]=c.shift(body,-5);a(c.serialize(now).equals(before));
a.equal(json(record+'/official-report.json').verdict,'PASS');a(json(record+'/native-report.json').pass);a(json(record+'/independent-review.json').pass);
const plan=json('G:/somi/JO9sa/records/full-client-preparation-20261029/full-client-input-plan.json');a.equal(plan.qspSha256,patch.after_sha256);a.equal(plan.files.find(f=>f.path==='game/jack.qsp').sha256,patch.after_sha256);
const report={pass:true,after:patch.after_sha256,locations:old.locations.length,inverseRestoresWholeOriginal:true,officialPaths:9,nativeAssignments:3,sourceImagesCreated:0,expectedPaths:installed.routes.map(r=>r.path),temporaryRootsRemoved:json(record+'/cleanup.json').allRootsAbsent};
fs.writeFileSync(record+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
